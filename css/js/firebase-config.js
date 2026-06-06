// ============================================================
// FILE: js/firebase-config.js
// PURPOSE: Connects our app to Firebase
// This file runs FIRST before login.js and register.js
// ============================================================

// Your Firebase project credentials
var firebaseConfig = {
  apiKey: "AIzaSyD87-LpwQcLajOy6lGgOMJunGnd11rn5rk",
  authDomain: "feefinder-eb594.firebaseapp.com",
  projectId: "feefinder-eb594",
  storageBucket: "feefinder-eb594.firebasestorage.app",
  messagingSenderId: "553599534095",
  appId: "1:553599534095:web:58d84bfb02a571a4f90f7a",
  measurementId: "G-EXMEF0J2VV"
};

// Initialize Firebase — starts the connection to your project
firebase.initializeApp(firebaseConfig);

// auth = tool we use for login, signup, Google sign-in
var auth = firebase.auth();

// db = tool we use to save and read data from Firestore
var db = firebase.firestore();

console.log("✅ Firebase connected successfully!");