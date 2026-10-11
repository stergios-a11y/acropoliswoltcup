/* ============================================================
   Firebase configuration + current cup settings.
   ============================================================ */

var firebaseConfig = {
  apiKey: "AIzaSyAf8ZZ274JwixKlf2-tTfnCWV0q1ILwmsA",
  authDomain: "acropolis-wolt-cup.firebaseapp.com",
  databaseURL: "https://acropolis-wolt-cup-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "acropolis-wolt-cup",
  storageBucket: "acropolis-wolt-cup.firebasestorage.app",
  messagingSenderId: "749427500456",
  appId: "1:749427500456:web:eff0be1f3a10a5cf4be99d",
  measurementId: "G-Y0DFBRJHBR"
};

// Admin passcode for the score-entry page:
var ADMIN_PASSCODE = "ssss";

/* ---- CURRENT CUP ----
   Each cup lives in its own database folder (CUP.dbRoot), so a new cup
   never touches an old one. The 1st cup's data stays at the database root
   and is also archived statically in data/cup1.js (shown on history.html).
   For a 3rd cup: archive this one into data/cup2.js, then bump these values. */
var CUP = {
  n: 2,
  name: "2nd Acropolis Wolt Cup",
  dbRoot: "cup2/",
  slack: "#2nd-acropolis-wolt-cup",
  // Shown in the champion banner once the final is recorded ("" = no photo):
  winnerPhoto: "",
  dayShort: { "Δευτέρα & Τρίτη": "ΔΕΥΤ 19 & ΤΡΙ 20", "Τετάρτη": "ΤΕΤΑΡΤΗ 21", "Πέμπτη": "ΠΕΜΠΤΗ 22" },
  dayLong: {
    "Δευτέρα & Τρίτη": "Δευτέρα 19 & Τρίτη 20 Οκτωβρίου · 1ος γύρος",
    "Τετάρτη": "Τετάρτη 21 Οκτωβρίου · 2ος & 3ος γύρος",
    "Πέμπτη": "Πέμπτη 22 Οκτωβρίου · Τελικοί γύροι"
  }
};

// Registration deadline — applications auto-close at this time (Athens time).
var REGISTRATION_DEADLINE = new Date("2026-10-19T17:00:00+03:00").getTime();

// --- init (leave as-is) ---
var DB = null, DB_READY = false, DB_ERROR = "";
try {
  firebase.initializeApp(firebaseConfig);
  DB = firebase.database();
  DB_READY = true;
} catch (e) {
  DB_ERROR = "Firebase init failed: " + e.message;
}
// Reference inside the current cup's folder, e.g. R('players') -> cup2/players
function R(path) { return DB.ref(CUP.dbRoot + path); }
