// ============================================================
// FILE: js/firebase-config.js
// PURPOSE: This file connects our web app to Firebase
// Think of this as the "phone number" we use to call Firebase
// ============================================================

// We import specific tools from Firebase that we need
// 'initializeApp' starts the Firebase connection
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

// 'getAuth' gives us the authentication tool (login/signup)
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// 'getFirestore' gives us the database tool
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ✅ Your Firebase Configuration
// These values tell Firebase "which project" you want to connect to
// These are YOUR actual values from the Firebase console
const firebaseConfig = {
  apiKey: "AIzaSyD87-LpwQcLajOy6lGgOMJunGnd11rn5rk",
  authDomain: "feefinder-eb594.firebaseapp.com",
  projectId: "feefinder-eb594",
  storageBucket: "feefinder-eb594.firebasestorage.app",
  messagingSenderId: "553599534095",
  appId: "1:553599534095:web:58d84bfb02a571a4f90f7a",
  measurementId: "G-EXMEF0J2VV"
};

// This line actually STARTS the Firebase connection using your config above
const app = initializeApp(firebaseConfig);

// This creates the Authentication service
// We will use 'auth' in login.js and register.js
export const auth = getAuth(app);

// This creates the Firestore Database service
// We will use 'db' to save data
export const db = getFirestore(app);

// We use 'export' so that other files (login.js, register.js) can use auth and db