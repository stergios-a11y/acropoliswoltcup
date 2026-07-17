/* ============================================================
   Acropolis Wolt Cup — core tournament logic (pure functions)
   Used by both admin.js and bracket.js. No Firebase in here.
   ============================================================ */
(function (global) {
  "use strict";

  var LEVELS = { novice: 1, intermediary: 2, advanced: 3 };
  var LEVEL_LABEL = { novice: "Αρχάριος", intermediary: "Μέσος", advanced: "Προχωρημένος" };

  /* ---- Handicap: head-start points for the lower-level player ----
     novice vs advanced      -> novice starts +3
     novice vs intermediary   -> novice starts +2
     intermediary vs advanced -> intermediary starts +1
     Returns { favoredLevel, points, text } where favoredLevel is the
     level string that receives the head start ('' if none).            */
  function handicap(levelA, levelB) {
    var a = LEVELS[levelA], b = LEVELS[levelB];
    if (!a || !b || a === b) return { favoredLevel: "", points: 0, text: "Χωρίς προβάδισμα — καθαρή μάχη." };
    var lowLevel = a < b ? levelA : levelB; // lower rank = weaker = gets head start
    var pair = [Math.min(a, b), Math.max(a, b)].join("-");
    var pts = { "1-3": 3, "1-2": 2, "2-3": 1 }[pair] || 0;
    return {
      favoredLevel: lowLevel,
      points: pts,
      text: LEVEL_LABEL[lowLevel] + ": ξεκινά κάθε σετ " + pts + "-0."
    };
  }

  function nextPow2(n) {
    var p = 1;
    while (p < n) p *= 2;
    return p;
  }

  /* Standard single-elimination seed slot order for a power-of-2 size.
     Ensures the top seed is paired against the lowest seed (i.e. byes). */
  function seedOrder(size) {
    var rounds = Math.round(Math.log2(size));
    var pl = [1, 2];
    for (var r = 1; r < rounds; r++) {
      var out = [];
      var sum = pl.length * 2 + 1;
      for (var i = 0; i < pl.length; i++) {
        out.push(pl[i]);
        out.push(sum - pl[i]);
      }
      pl = out;
    }
    return pl;
  }

  /* Seed players: advanced first, then intermediary, then novice,
     ties broken by registration timestamp (earlier = higher seed). */
  function seedPlayers(players) {
    return players.slice().sort(function (x, y) {
      var lx = LEVELS[x.level] || 0, ly = LEVELS[y.level] || 0;
      if (ly !== lx) return ly - lx;            // higher level first
      return (x.ts || 0) - (y.ts || 0);          // earlier registration first
    });
  }

  /* Assign rounds to tournament days.
     Final -> day 24. Earlier rounds split across 22 and 23.            */
  function dayForRound(round, totalRounds) {
    // Rounds 1–3 on Tuesday; the final rounds (4+) on Wednesday.
    return round <= 3 ? "Τρίτη" : "Τετάρτη";
  }

  /* Build the full bracket from a player list.
     Returns { size, rounds, matches } where matches is a flat array.
     Byes auto-advance the present player into round 2.                 */
  function buildBracket(players) {
    var seeded = seedPlayers(players);
    var n = seeded.length;
    var size = Math.max(2, nextPow2(n));
    var totalRounds = Math.round(Math.log2(size));
    var order = seedOrder(size); // seeds in slot order, length = size

    // slot -> player (or null for a bye)
    var slotPlayer = order.map(function (seed) {
      return seed <= n ? seeded[seed - 1] : null;
    });

    var matches = [];
    var mid = 0;
    // Round 1
    var round1 = [];
    for (var s = 0; s < size; s += 2) {
      var p1 = slotPlayer[s], p2 = slotPlayer[s + 1];
      var m = newMatch(mid++, 1, s / 2, p1, p2, totalRounds);
      round1.push(m);
      matches.push(m);
    }
    // Later rounds (empty shells; filled as results come in)
    var prevCount = round1.length;
    for (var r = 2; r <= totalRounds; r++) {
      var count = prevCount / 2;
      for (var idx = 0; idx < count; idx++) {
        matches.push(newMatch(mid++, r, idx, null, null, totalRounds));
      }
      prevCount = count;
    }

    // Auto-advance round-1 byes
    round1.forEach(function (m) {
      if (m.isBye && m.winnerId) advanceWinner(matches, m);
    });

    return { size: size, rounds: totalRounds, matches: matches };
  }

  function newMatch(id, round, index, p1, p2, totalRounds) {
    var m = {
      id: "m" + id,
      round: round,
      index: index,
      day: dayForRound(round, totalRounds),
      p1Id: p1 ? p1.id : "",
      p1Name: p1 ? p1.name : "",
      p1Level: p1 ? p1.level : "",
      p2Id: p2 ? p2.id : "",
      p2Name: p2 ? p2.name : "",
      p2Level: p2 ? p2.level : "",
      p1Games: 0,
      p2Games: 0,
      winnerId: "",
      isBye: false,
      status: "pending"
    };
    // A round-1 slot with exactly one player is a bye.
    if (round === 1) {
      if (p1 && !p2) { m.isBye = true; m.winnerId = p1.id; m.status = "bye"; }
      else if (p2 && !p1) { m.isBye = true; m.winnerId = p2.id; m.status = "bye"; }
    }
    return m;
  }

  function findMatch(matches, round, index) {
    for (var i = 0; i < matches.length; i++) {
      if (matches[i].round === round && matches[i].index === index) return matches[i];
    }
    return null;
  }

  /* Push a match's winner into its parent slot. */
  function advanceWinner(matches, match) {
    if (!match.winnerId) return;
    var parent = findMatch(matches, match.round + 1, Math.floor(match.index / 2));
    if (!parent) return; // final
    var winner = winnerObj(match);
    if (match.index % 2 === 0) {
      parent.p1Id = winner.id; parent.p1Name = winner.name; parent.p1Level = winner.level;
    } else {
      parent.p2Id = winner.id; parent.p2Name = winner.name; parent.p2Level = winner.level;
    }
    // If the parent now has one real player and its sibling was a bye that
    // already resolved, it still waits for the other side — no auto win here.
  }

  function winnerObj(m) {
    if (m.winnerId && m.winnerId === m.p1Id) return { id: m.p1Id, name: m.p1Name, level: m.p1Level };
    return { id: m.p2Id, name: m.p2Name, level: m.p2Level };
  }

  /* Record a best-of-5 result (first to 3 games). Sets winner + advances. */
  function recordResult(matches, matchId, p1Games, p2Games) {
    var m = null;
    for (var i = 0; i < matches.length; i++) if (matches[i].id === matchId) { m = matches[i]; break; }
    if (!m) return { ok: false, error: "Match not found." };
    if (!m.p1Id || !m.p2Id) return { ok: false, error: "Both players not set yet." };
    p1Games = +p1Games; p2Games = +p2Games;
    if (Math.max(p1Games, p2Games) !== 3) return { ok: false, error: "Best of 5 — the winner must reach 3 games." };
    if (p1Games === p2Games) return { ok: false, error: "Games can't be tied." };
    m.p1Games = p1Games; m.p2Games = p2Games;
    m.winnerId = p1Games > p2Games ? m.p1Id : m.p2Id;
    m.status = "done";
    advanceWinner(matches, m);
    return { ok: true, match: m };
  }

  var api = {
    LEVELS: LEVELS,
    LEVEL_LABEL: LEVEL_LABEL,
    handicap: handicap,
    nextPow2: nextPow2,
    seedOrder: seedOrder,
    seedPlayers: seedPlayers,
    dayForRound: dayForRound,
    buildBracket: buildBracket,
    advanceWinner: advanceWinner,
    recordResult: recordResult
  };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  global.TT = api;
})(typeof window !== "undefined" ? window : this);
