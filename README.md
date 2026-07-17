# 🏓 Acropolis Wolt Cup

A three-page website for running a handicap table-tennis cup at work.

- **`index.html`** — players declare participation: name, email, and level (novice / intermediary / advanced). Shows a live list of who's registered.
- **`bracket.html`** — live single-elimination bracket + day-by-day schedule, fed by results.
- **`admin.html`** — passcode-protected: draw the bracket and enter scores. Winners advance automatically.

All shared data (registrations, bracket, scores) lives in a free **Firebase Realtime Database**, so everyone sees the same thing in real time. Hostable on GitHub Pages — no server to run.

## Format

- **Best of 5 games** every match (first to 3 games).
- **Handicaps** (head start, applied every game):
  - Novice vs Advanced → **Novice starts 3–0**
  - Novice vs Intermediary → **Novice starts 2–0**
  - Intermediary vs Advanced → **Intermediary starts 1–0**
  - Same level → even start.
- **Seeding / byes:** players are seeded by level (advanced first, then intermediary, then novice; ties broken by who registered earlier). When the field isn't a power of two, the **top seeds get first-round byes** — i.e. higher-level players skip round 1 and start in round 2.
- **Days:** round 1 on **Tuesday**, rounds 2–3 on **Wednesday**, and the final two rounds (semi-finals and final) on **Thursday**. Round titles on the bracket are colour-coded by day.

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
    "players":   { ".read": true, ".write": true, ".indexOn": ["email"] },
    "tournament":{ ".read": true, ".write": true }
  }
}
```

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
