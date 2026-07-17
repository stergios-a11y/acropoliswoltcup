/* ============================================================
   Firebase configuration — FILL THIS IN (see README, Step 1).
   Create a free Firebase project, add a Web App, enable
   Realtime Database, then paste the config object below.
   ============================================================ */

// 1) Paste your Firebase web config here:
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

// 2) Admin passcode for the score-entry page (change this!):
var ADMIN_PASSCODE = "acropolis2026";

// 3) Registration deadline — applications auto-close at this time.
//    (Monday 19:00 Athens time. Edit the date to match your event week.)
var REGISTRATION_DEADLINE = new Date("2026-07-20T19:00:00+03:00").getTime();

// --- init (leave as-is) ---
var DB = null, DB_READY = false, DB_ERROR = "";
try {
  if (firebaseConfig.apiKey === "PASTE_ME") {
    DB_ERROR = "Firebase not configured yet. Edit js/firebase-config.js — see README Step 1.";
  } else {
    firebase.initializeApp(firebaseConfig);
    DB = firebase.database();
    DB_READY = true;
  }
} catch (e) {
  DB_ERROR = "Firebase init failed: " + e.message;
}
