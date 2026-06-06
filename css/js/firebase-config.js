// ============================================================
// FILE: js/firebase-config.js
// PURPOSE: Connects our app to Firebase
// 
// IMPORTANT: We use the CDN version (loaded from internet)
// This is the EASIEST way for beginners
// ============================================================

// Your Firebase configuration object
// These are YOUR actual project details
const firebaseConfig = {
  apiKey: "AIzaSyD87-LpwQcLajOy6lGgOMJunGnd11rn5rk",
  authDomain: "feefinder-eb594.firebaseapp.com",
  projectId: "feefinder-eb594",
  storageBucket: "feefinder-eb594.firebasestorage.app",
  messagingSenderId: "553599534095",
  appId: "1:553599534095:web:58d84bfb02a571a4f90f7a",
  measurementId: "G-EXMEF0J2VV"
};

// Initialize Firebase App
// This STARTS the connection to Firebase
firebase.initializeApp(firebaseConfig);

// Create Auth service
// auth = the tool we use for login, signup, Google sign-in
const auth = firebase.auth();

// Create Firestore Database service
// db = the tool we use to save and read data
const db = firebase.firestore();

// We print this to confirm Firebase connected successfully
console.log("✅ Firebase connected successfully!");