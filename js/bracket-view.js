/* ============================================================
   Shared bracket rendering (SVG graph, schedule tables, champion).
   Used by bracket.html (live cup) and history.html (archived cups).
   ============================================================ */
(function (global) {
  "use strict";

  var DAY_ORDER = ["Δευτέρα & Τρίτη", "Τετάρτη", "Πέμπτη"];
  var DAYCOLOR = { "Δευτέρα & Τρίτη": "#009de0", "Τετάρτη": "#17b890", "Πέμπτη": "#e0245e" };
  var LVLCOLOR = { novice: "#00c2e8", intermediary: "#f5a623", advanced: "#e0245e" };

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function trunc(s, n) { s = String(s || ""); return s.length > n ? s.slice(0, n - 1) + "…" : s; }
  function roundName(r, total) { var f = total - r; return f === 0 ? "Τελικός" : f === 1 ? "Ημιτελικοί" : f === 2 ? "Προημιτελικοί" : "Γύρος " + r; }
  function dayForRound(r, total) { if (r === 1) return "Δευτέρα & Τρίτη"; if (r > total - 2) return "Πέμπτη"; return "Τετάρτη"; }
  function toList(matches) { return Array.isArray(matches) ? matches : Object.keys(matches || {}).map(function (k) { return matches[k]; }); }
  function toMap(list) { var map = {}; list.forEach(function (m) { map[m.round + "_" + m.index] = m; }); return map; }

  /* opts.dayShort: { "Δευτέρα & Τρίτη": "ΔΕΥΤ 19 & ΤΡΙ 20", ... } */
  function buildSVG(size, map, rounds, opts) {
    opts = opts || {};
    var dayShort = opts.dayShort || {};
    var boxW = 205, boxH = 34, colGap = 24, rowGap = 8, topPad = 46, leftPad = 4;
    var firstMatches = size / 2;
    var unit = boxH + rowGap;
    var totalH = firstMatches * unit;
    var colStep = boxW + colGap;
    var width = leftPad + rounds * colStep - colGap + leftPad;
    var height = topPad + totalH + 10;

    var conns = "", boxes = "", titles = "";
    function colX(r) { return leftPad + (r - 1) * colStep; }
    function blockH(r) { return unit * Math.pow(2, r - 1); }
    function cy(r, i) { return topPad + i * blockH(r) + blockH(r) / 2; }

    for (var r = 1; r <= rounds; r++) {
      var mInRound = firstMatches / Math.pow(2, r - 1);
      var day = dayForRound(r, rounds), col = DAYCOLOR[day], tx = colX(r) + boxW / 2;
      titles += '<text class="sv-round" x="' + tx + '" y="14" text-anchor="middle" fill="' + col + '">' + esc(roundName(r, rounds)) + "</text>";
      titles += '<text class="sv-day" x="' + tx + '" y="28" text-anchor="middle" fill="' + col + '">' + esc(dayShort[day] || day.toUpperCase()) + "</text>";
      titles += '<rect x="' + (tx - 22) + '" y="34" width="44" height="2.5" rx="1.25" fill="' + col + '"/>';
      for (var i = 0; i < mInRound; i++) {
        var x = colX(r), y = cy(r, i) - boxH / 2;
        var m = map[r + "_" + i];
        if (r > 1) {
          var childRight = colX(r - 1) + boxW;
          var midX = (childRight + x) / 2;
          var up = cy(r - 1, 2 * i), dn = cy(r - 1, 2 * i + 1), pc = cy(r, i);
          conns += '<path class="sv-conn" d="M' + childRight + " " + up + " L" + midX + " " + up + " L" + midX + " " + dn + " L" + childRight + " " + dn + " M" + midX + " " + pc + " L" + x + " " + pc + '"/>';
        }
        boxes += boxSVG(x, y, boxW, boxH, m);
      }
    }
    return '<svg viewBox="0 0 ' + width + " " + height + '" style="width:100%;max-width:' + width + 'px;height:auto;display:block;margin:0 auto" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Ταμπλό τουρνουά, ' + rounds + ' γύροι">' +
      conns + titles + boxes + "</svg>";
  }

  function slotSVG(x, y, w, h, name, level, score, isWin, tbd) {
    var barColor = level ? LVLCOLOR[level] : "transparent";
    var bar = '<rect x="' + x + '" y="' + y + '" width="3" height="' + h + '" fill="' + barColor + '"/>';
    var cls = "sv-name" + (isWin ? " win" : "") + (tbd ? " tbd" : "");
    var scls = "sv-score" + (isWin ? " win" : "");
    var hasScore = !(score === "" || score == null);
    var scoreW = 16;
    var sc = hasScore ? '<text class="' + scls + '" x="' + (x + 8) + '" y="' + (y + h / 2 + 3.5) + '">' + score + "</text>" : "";
    var nameX = x + (hasScore ? 8 + scoreW : 8);
    var nameAreaChars = Math.floor((w - (hasScore ? 8 + scoreW : 8) - 6) / 5.4);
    var nm = '<text class="' + cls + '" x="' + nameX + '" y="' + (y + h / 2 + 3.5) + '">' + esc(trunc(name, nameAreaChars)) + "</text>";
    return bar + sc + nm;
  }

  function boxSVG(x, y, w, h, m) {
    var done = m && m.status === "done";
    var rect = '<rect class="sv-box' + (done ? " done" : "") + '" x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="6"/>';
    var div = '<line class="sv-div" x1="' + x + '" y1="' + (y + h / 2) + '" x2="' + (x + w) + '" y2="' + (y + h / 2) + '"/>';
    if (!m) {
      return rect + div + slotSVG(x, y, w, h / 2, "—", "", "", false, true) + slotSVG(x, y + h / 2, w, h / 2, "—", "", "", false, true);
    }
    if (m.isBye) {
      var bn = m.p1Id ? m.p1Name : m.p2Name, bl = m.p1Id ? m.p1Level : m.p2Level;
      return rect + div + slotSVG(x, y, w, h / 2, bn, bl, "", true, false) + slotSVG(x, y + h / 2, w, h / 2, "ΡΕΠΟ", "", "", false, true);
    }
    var p1 = !!m.p1Id, p2 = !!m.p2Id;
    var w1 = done && m.winnerId === m.p1Id, w2 = done && m.winnerId === m.p2Id;
    return rect + div +
      slotSVG(x, y, w, h / 2, p1 ? m.p1Name : "—", m.p1Level, p1 ? m.p1Games : "", w1, !p1) +
      slotSVG(x, y + h / 2, w, h / 2, p2 ? m.p2Name : "—", m.p2Level, p2 ? m.p2Games : "", w2, !p2);
  }

  /* Schedule / results tables grouped by day. opts.dayLong: label per day key. */
  function scheduleHTML(matches, total, opts) {
    opts = opts || {};
    var dayLong = opts.dayLong || {};
    var showHandicap = opts.handicap !== false && global.TT;
    var days = {};
    matches.forEach(function (m) { if (!m.isBye) (days[m.day] = days[m.day] || []).push(m); });
    var html = "";
    DAY_ORDER.forEach(function (d) {
      var list = (days[d] || []).sort(function (a, b) { return a.round - b.round || a.index - b.index; });
      if (!list.length) return;
      html += '<h3 class="day">' + esc(dayLong[d] || d) + "</h3>";
      html += '<table class="tbl"><thead><tr><th>Γύρος</th><th>Αγώνας</th>' + (showHandicap ? "<th>Προβάδισμα</th>" : "") + "<th>Αποτέλεσμα</th></tr></thead><tbody>";
      list.forEach(function (m) {
        var p1 = m.p1Id ? m.p1Name : "Αναμονή", p2 = m.p2Id ? m.p2Name : "Αναμονή";
        var done = m.status === "done";
        var n1 = done && m.winnerId === m.p1Id ? "<b>" + esc(p1) + "</b>" : esc(p1);
        var n2 = done && m.winnerId === m.p2Id ? "<b>" + esc(p2) + "</b>" : esc(p2);
        var hc = "";
        if (showHandicap) {
          var h = (m.p1Id && m.p2Id) ? global.TT.handicap(m.p1Level, m.p2Level) : null;
          hc = '<td class="muted">' + ((h && h.points > 0) ? esc(h.text) : "—") + "</td>";
        }
        var res = done ? (m.p1Games + "–" + m.p2Games) : "—";
        html += '<tr><td class="muted">' + roundName(m.round, total) + "</td><td>" + n1 + " – " + n2 + "</td>" + hc + "<td>" + res + "</td></tr>";
      });
      html += "</tbody></table>";
    });
    return html;
  }

  /* Final match info, or null if the final isn't played yet. */
  function finalResult(matches, total) {
    var fin = null;
    for (var i = 0; i < matches.length; i++) if (matches[i].round === total) { fin = matches[i]; break; }
    if (!fin || fin.status !== "done" || !fin.winnerId) return null;
    var p1w = fin.winnerId === fin.p1Id;
    return {
      winner: p1w ? fin.p1Name : fin.p2Name,
      winnerLevel: p1w ? fin.p1Level : fin.p2Level,
      runnerUp: p1w ? fin.p2Name : fin.p1Name,
      runnerUpLevel: p1w ? fin.p2Level : fin.p1Level,
      score: p1w ? (fin.p1Games + "–" + fin.p2Games) : (fin.p2Games + "–" + fin.p1Games)
    };
  }

  function confettiHTML(n) {
    var colors = ["#e0245e", "#009de0", "#17b890", "#ff8a00", "#ffffff"], out = "";
    for (var c = 0; c < (n || 26); c++) {
      out += '<span class="cf" style="left:' + (2 + c * 3.8) + "%;background:" + colors[c % 5] +
        ";animation-duration:" + (2.4 + (c % 7) * .35) + "s;animation-delay:" + ((c % 9) * .4) + 's"></span>';
    }
    return out;
  }

  global.BV = {
    DAY_ORDER: DAY_ORDER, DAYCOLOR: DAYCOLOR, LVLCOLOR: LVLCOLOR,
    esc: esc, roundName: roundName, toList: toList, toMap: toMap,
    buildSVG: buildSVG, scheduleHTML: scheduleHTML, finalResult: finalResult, confettiHTML: confettiHTML
  };
})(typeof window !== "undefined" ? window : this);
