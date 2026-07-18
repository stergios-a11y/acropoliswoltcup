# Acropolis Wolt Cup — Site Audit

_Comprehensive review of logic, security, privacy, accessibility, UX and code quality._

**Overall verdict:** Solid for a friendly internal cup. The tournament engine is correct and well-tested. The main real risks are **privacy/security from wide-open database rules** and a couple of small **XSS / accessibility** bugs. None block launch for an internal audience, but the items marked 🔴/🟠 are worth addressing.

Severity: 🔴 High · 🟠 Medium · 🟡 Low · ✅ Verified good

> **Update (post-audit):** Fixed #3 (admin messages now escaped), #4 (duplicate-name check on edit), #7 (stale comment), #8 (level radios keyboard-accessible), #9 (radiogroup + SVG aria), #10 (`maxlength`), #11 (no redundant polling), #12 (reconnect indicator). Email collection was **removed entirely** (registration now uses a Slack name), which also closes the biggest part of the privacy concern in #1 — the DB no longer stores emails. Remaining open item: the database is still world-readable/writable (#1/#2) — acceptable for an internal cup, but that's a deliberate choice.

---

## Security & Privacy

### 🔴 1. Database is world-readable and world-writable
`database rules` are `.read:true / .write:true` for `players`, `tournament`, `settings`. Anyone who knows the database URL (it's in `js/firebase-config.js`, which is public on GitHub Pages) can:
- **read every registrant's email** (PII leak — emails are not shown on the site, but are freely readable from the DB),
- delete or edit anyone's registration,
- overwrite the bracket / scores,
- open or close registrations.

**Impact:** privacy leak of work emails + anyone can vandalise the tournament.
**Fix options (pick per how much you care):**
- Minimum: accept the risk (internal, low-stakes) — but at least know it.
- Better: lock reads/writes behind Firebase Auth (Google sign-in), or split rules so `players` email is not publicly readable.
- Simplest privacy win: don't store emails at all (you contact people via Slack anyway), or store only a hash.

### 🟠 2. Admin passcode is cosmetic
`ADMIN_PASSCODE = "ssss"` lives in public client code and is checked in the browser. It's visible to anyone who views source, and because writes are open (see #1), the gate stops nobody who's determined. It only prevents casual clicking.
**Fix:** treat it as a convenience lock only; real protection requires Auth + rules.

### 🟠 3. Stored XSS in the Admin page
`admin.html`'s `note()` renders messages with `innerHTML`, and those messages include the **player-controlled name** (e.g. `note('ok','Αποθηκεύτηκε: '+name)`). A registrant who sets their name to `<img src=x onerror=…>` gets script execution **in the admin's browser** when the admin saves/edits that row.
**Where:** `admin.html` `function note()` + calls in the players table and score save.
**Fix:** escape `txt` (or set `.textContent`). The public page is already safe — `index.html`'s `show()` uses `textContent`.

### 🟡 4. Duplicate email only checked at registration
The admin players table lets you edit an email to one that already exists (no uniqueness check). Registration itself does check. Low impact.

### 🟡 5. Client-side–only gating
Registration close and the deadline are enforced in JS + open rules, so a technical user could still write directly. Fine for internal use; just don't rely on it as a hard control.

---

## Logic & Correctness  ✅ (engine is strong)

Stress-tested every field size **n = 2…64**:
- ✅ No round-1 empty-vs-empty pairings (mathematically impossible here — verified).
- ✅ All players placed; byes always go to the top seeds (advanced → intermediary), never novices.
- ✅ Every simulated tournament reaches a single champion with no stuck matches.
- ✅ Handicaps correct (3-0 / 2-0 / 1-0 / even).
- ✅ Score validation rejects ties, non-numeric, and "winner didn't reach 3".

### 🟠 6. Editing a result after later rounds are played can desync the bracket
`recordResult` pushes the winner to the **immediate** parent, but if deeper rounds were already recorded and you change an earlier winner, the downstream matches keep the old player/scores. Same if you correct a level/name after the draw.
**Impact:** rare (you'd have to edit history mid-tournament) but produces an inconsistent bracket.
**Fix / mitigation:** already documented in the README ("redraw to apply"). Could add a guard that warns when editing a match whose winner already advanced, or auto-clears downstream.

### 🟡 7. Stale comment
`tournament.js` `dayForRound` still has an old comment ("Final -> day 24"). Cosmetic only — logic is current.

---

## Accessibility

### 🟠 8. Level selection isn't keyboard-accessible
`.levels input{display:none}` removes the radios from tab order, so keyboard and screen-reader users **cannot select a level** (and the `:focus-visible` style is dead code). Mouse/touch works fine.
**Fix:** hide the radios with a visually-hidden pattern instead of `display:none`:
```css
.levels input{position:absolute;opacity:0;width:1px;height:1px}
```
(keeps them focusable; the existing `:checked`/`:focus-visible` styles then work).

### 🟡 9. Minor a11y polish
- Group the three level cards in a `<fieldset>`/`role="radiogroup"` with a legend for screen readers.
- Bracket SVG could use a `<title>`/`aria-label` summary; the horizontal-scroll region could be focusable.

---

## UX & Consistency  ✅ mostly

- ✅ Greek throughout; Wolt-blue theme consistent; favicon + emblem on all pages.
- ✅ Schedule, handicaps and Slack instructions are consistent across index/bracket/admin.
- 🟡 10. No `maxlength` on name/email — a very long name can stretch the bracket boxes/tables (SVG truncates to ~18 chars, but the schedule table and admin table don't).
- 🟡 11. Redundant polling: both `index` and `admin` keep a `.on('value')` **and** a 30-second `setInterval` that re-reads `settings`. The interval only exists to notice the deadline crossing; it could re-evaluate locally without the extra DB read.
- 🟡 12. If Firebase disconnects mid-session there's no "reconnecting" indicator (only initial-config errors are surfaced).

---

## What's solid ✅
- Correct, well-tested single-elimination engine with level-based seeding, byes, handicaps and auto-advancement.
- Clean separation: pure logic in `tournament.js`, Firebase only in the pages.
- Public registration page escapes user input (`textContent`).
- Live updates, sensible empty/loading states, responsive layout, colour-coded schedule.
- Registration deadline + manual open/close, and an editable players table for admins.

---

## Suggested priority
1. **Decide on the privacy posture** (#1) — at minimum acknowledge it; ideally stop exposing emails.
2. **Escape admin messages** (#3) — quick, removes the XSS.
3. **Make level radios keyboard-accessible** (#8) — one CSS line.
4. Optional polish: duplicate-email check on edit (#4), `maxlength` (#10), downstream-edit guard (#6), stale comment (#7).

Items 2, 3, 4, 7, 10 are small, self-contained fixes I can apply in one pass if you want.
