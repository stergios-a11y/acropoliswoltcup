# 🏓 Acropolis Wolt Cup (currently: 2nd cup, 19–22 Oct 2026)

A three-page website for running a handicap table-tennis cup at work.

- **`index.html`** — players declare participation: their **Slack name** and level (novice / intermediary / advanced). Shows a live list of who's registered. No email is collected.
- **`bracket.html`** — live single-elimination bracket + day-by-day schedule, fed by results.
- **`admin.html`** — passcode-protected: draw the bracket and enter scores. Winners advance automatically.
- **`history.html`** — hall of fame: archived cups (winner photo, podium, upsets, final bracket, all results). Static, no database needed.

All shared data (registrations, bracket, scores) lives in a free **Firebase Realtime Database**, so everyone sees the same thing in real time. Hostable on GitHub Pages — no server to run.

## Multiple cups

- Current cup settings live in `CUP` in `js/firebase-config.js` (name, Slack channel, database folder `dbRoot`, day labels, optional `winnerPhoto`) plus `REGISTRATION_DEADLINE`.
- Each cup uses its own database folder (`cup2/players`, `cup2/tournament`, `cup2/settings`). The 1st cup's data was left untouched at the database root.
- Finished cups are archived as static files in `data/` (`data/cup1.js`) and listed on `history.html`.
- **Starting a 3rd cup:** export the cup-2 bracket into `data/cup2.js` (same shape as `cup1.js`), include it on `history.html` / `index.html`, then set `CUP.n=3`, `dbRoot:"cup3/"`, new dates and deadline.

## Format

- **Best of 5 games** every match (first to 3 games).
- **Handicaps** (head start, applied every game):
  - Novice vs Advanced → **Novice starts 4–0**
  - Novice vs Intermediary → **Novice starts 2–0**
  - Intermediary vs Advanced → **Intermediary starts 2–0**
  - Same level → even start.
- **Seeding / byes:** players are seeded by level (advanced first, then intermediary, then novice; ties broken by who registered earlier). When the field isn't a power of two, the **top seeds get first-round byes** — i.e. higher-level players skip round 1 and start in round 2.
- **Days:** round 1 is the biggest and is played across **Monday & Tuesday**; rounds 2–3 on **Wednesday**; the final two rounds (semi-finals and final) on **Thursday**. Round titles on the bracket are colour-coded by day.
- **Slack:** everyone who registers is added to the **#1st-acropolis-world-cup** Slack channel, where players schedule their own matches and post scores.

---

## Step 1 — Create the Firebase backend (~5 min)

1. Go to <https://console.firebase.google.com> and **Add project** (any name, e.g. `acropolis-wolt-cup`). You can disable Google Analytics.
2. In the left menu: **Build → Realtime Database → Create Database**. Pick a location, and start in **Test mode** for now.
3. Back on the project overview, click the **`</>` (Web)** icon to register a web app. Give it a nickname; you don't need Hosting.
4. Firebase shows a `firebaseConfig = { ... }` object. Copy those values into **`js/firebase-config.js`**, replacing every `PASTE_ME`.
5. In the same file, change `ADMIN_PASSCODE` to something only you know.

### Recommended database rules

In **Realtime Database → Rules**, paste this and Publish. It lets anyone register and read the bracket, but blocks deleting other people's registrations:

```json
{
  "rules": {
    "players":   { ".read": true, ".write": true },
    "tournament":{ ".read": true, ".write": true },
    "settings":  { ".read": true, ".write": true },
    "cup2":      { ".read": true, ".write": true }
  }
}
```

### Registration deadline & closing

Applications auto-close at the time set in `REGISTRATION_DEADLINE` in `js/firebase-config.js` (currently Monday 19 Oct 2026, 17:00 Athens). The registration page shows an open/closed status live. From **Admin → 1 · Εγγραφές** you can also **close now**, **open / extend** (overrides the deadline), or switch back to **auto** (close at the deadline).

> This is open write access, which is fine for a friendly internal cup. The admin passcode is a light gate on the score page, **not** real security — don't put anything sensitive here. If you want it locked down, enable Firebase Auth (out of scope for this simple build).

---

## Step 2 — Put it online with GitHub Pages

1. Push this folder to the repo `stergios-a11y/acropoliswoltcup` (see commands below).
2. On GitHub: **Settings → Pages → Build and deployment → Source: Deploy from a branch**, branch `main`, folder `/ (root)`. Save.
3. After a minute the site is live at:
   `https://stergios-a11y.github.io/acropoliswoltcup/`
4. Share the base URL for registration; `bracket.html` for the public bracket; keep `admin.html` for yourself.

### Push commands

From inside this folder:

```bash
git init
git add .
git commit -m "Acropolis Wolt Cup site"
git branch -M main
git remote add origin https://github.com/stergios-a11y/acropoliswoltcup.git
git push -u origin main
```

(If the repo already has commits, use `git pull --rebase origin main` first.)

---

## Running the cup

1. Share the site — players register on the home page.
2. When registration closes, open **Admin**, unlock, and click **Generate / redraw bracket**.
3. As matches finish, enter the games won on the Admin page. The bracket and schedule update live for everyone.

### Notes / limits

- Redrawing the bracket wipes all scores — only redraw before play starts.
- Correcting a score *after later rounds have been played* advances the corrected winner but won't automatically undo results further down the bracket; fix those rounds manually or redraw.
- Handicaps are shown on each match as guidance — players apply the head start on the table; the admin records the final games won.

## Local preview

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

Registration/bracket data only appears once `js/firebase-config.js` is filled in.
