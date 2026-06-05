// ============================================================
// FILE: js/login.js
// PURPOSE: Handles all login, signup, Google sign-in,
//          email verification, and password reset logic
//
// This file is like the "brain" of the login page
// ============================================================

// Import Firebase tools we need
// 'auth' and 'db' come from our firebase-config.js
import { auth, db } from './firebase-config.js';

// Import specific Authentication functions from Firebase
import {
  createUserWithEmailAndPassword,  // Creates new account
  signInWithEmailAndPassword,       // Signs in existing user
  GoogleAuthProvider,               // For Google Sign-In
  signInWithPopup,                  // Opens Google popup
  sendEmailVerification,            // Sends verification email
  sendPasswordResetEmail,           // Sends reset password email
  onAuthStateChanged                // Watches if user is logged in
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// Import Firestore functions to save data to database
import {
  doc,       // Creates a reference to a specific document
  setDoc,    // Saves/sets data in a document
  getDoc,    // Gets data from a document
  serverTimestamp  // Gets the current time from Firebase server
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// ============================================================
// HELPER FUNCTIONS
// These are small utility functions we use throughout the code
// ============================================================

/**
 * showLoading() and hideLoading()
 * Shows/hides the spinning loader overlay
 * We call this before Firebase operations (which can take time)
 */
function showLoading() {
  document.getElementById('loadingOverlay').style.display = 'flex';
}

function hideLoading() {
  document.getElementById('loadingOverlay').style.display = 'none';
}

/**
 * showMessage(elementId, message, type)
 * Shows a colored message in the message box
 * 
 * @param {string} elementId - The id of the msg-box div
 * @param {string} message - The text to show
 * @param {string} type - 'success' (green) or 'error' (red)
 */
function showMessage(elementId, message, type) {
  // Find the message box element by its id
  const msgBox = document.getElementById(elementId);
  
  // Set the text
  msgBox.textContent = message;
  
  // Remove old color classes first
  msgBox.classList.remove('msg-success', 'msg-error');
  
  // Add the correct color class
  if (type === 'success') {
    msgBox.classList.add('msg-success');
  } else {
    msgBox.classList.add('msg-error');
  }
}

/**
 * clearMessage(elementId)
 * Clears the message box
 */
function clearMessage(elementId) {
  const msgBox = document.getElementById(elementId);
  msgBox.textContent = '';
  msgBox.classList.remove('msg-success', 'msg-error');
}


// ============================================================
// TAB SWITCHING
// Controls which form is visible: login, signup, or forgot
// ============================================================

/**
 * showTab(tabName)
 * Shows the selected tab section and hides the others
 * 
 * @param {string} tabName - 'login', 'signup', or 'forgot'
 */
function showTab(tabName) {
  // Get all three sections
  const loginSection = document.getElementById('loginSection');
  const signupSection = document.getElementById('signupSection');
  const forgotSection = document.getElementById('forgotSection');
  
  // Get tab buttons
  const loginTab = document.getElementById('loginTab');
  const signupTab = document.getElementById('signupTab');
  
  // Hide ALL sections first
  loginSection.style.display = 'none';
  signupSection.style.display = 'none';
  forgotSection.style.display = 'none';
  
  // Remove 'active' class from both tabs
  loginTab.classList.remove('active');
  signupTab.classList.remove('active');
  
  // Show the correct section based on tabName
  if (tabName === 'login') {
    loginSection.style.display = 'block';
    loginTab.classList.add('active');
  } else if (tabName === 'signup') {
    signupSection.style.display = 'block';
    signupTab.classList.add('active');
  } else if (tabName === 'forgot') {
    // Forgot section doesn't have a tab button
    // We just show the section
    forgotSection.style.display = 'block';
  }
}

// Make showTab available globally (so onclick in HTML can call it)
window.showTab = showTab;


// ============================================================
// SHOW FORGOT PASSWORD SECTION
// ============================================================

/**
 * showForgotPassword()
 * Hides login form and shows forgot password form
 */
function showForgotPassword() {
  // Hide all sections
  document.getElementById('loginSection').style.display = 'none';
  document.getElementById('signupSection').style.display = 'none';
  
  // Show forgot section
  document.getElementById('forgotSection').style.display = 'block';
  
  // Remove active from tabs
  document.getElementById('loginTab').classList.remove('active');
  document.getElementById('signupTab').classList.remove('active');
}

// Make available globally
window.showForgotPassword = showForgotPassword;


// ============================================================
// TOGGLE PASSWORD VISIBILITY (Eye Icon)
// ============================================================

/**
 * togglePassword(inputId, eyeIcon)
 * Shows or hides the password text when eye icon is clicked
 * 
 * @param {string} inputId - id of the password input field
 * @param {HTMLElement} eyeIcon - the eye icon element that was clicked
 */
function togglePassword(inputId, eyeIcon) {
  // Get the password input field
  const input = document.getElementById(inputId);
  
  // If currently showing dots (password), switch to text
  if (input.type === 'password') {
    input.type = 'text';  // Show the password
    eyeIcon.classList.remove('fa-eye');
    eyeIcon.classList.add('fa-eye-slash'); // Change to strikethrough eye
  } else {
    input.type = 'password'; // Hide the password again
    eyeIcon.classList.remove('fa-eye-slash');
    eyeIcon.classList.add('fa-eye');
  }
}

// Make available globally
window.togglePassword = togglePassword;


// ============================================================
// SIGNUP FUNCTION
// Creates a new parent account
// ============================================================

/**
 * signupParent()
 * This function runs when user clicks "Create Account" button
 * Steps:
 * 1. Gets values from form
 * 2. Validates them
 * 3. Creates Firebase account
 * 4. Saves parent data to Firestore
 * 5. Sends verification email
 * 6. Shows confirmation popup
 */
async function signupParent() {
  // STEP 1: Get values from input fields
  // .value gets the text inside an input field
  const fullName = document.getElementById('signupName').value.trim();
  const email = document.getElementById('signupEmail').value.trim();
  const phone = document.getElementById('signupPhone').value.trim();
  const password = document.getElementById('signupPassword').value;
  const confirmPassword = document.getElementById('signupConfirmPassword').value;
  
  // Clear any previous messages
  clearMessage('signupMsg');
  
  // STEP 2: Validate the inputs
  // We check that all fields are filled and correct
  
  if (!fullName) {
    showMessage('signupMsg', '⚠️ Please enter your full name.', 'error');
    return; // Stop the function here
  }
  
  if (!email) {
    showMessage('signupMsg', '⚠️ Please enter your email address.', 'error');
    return;
  }
  
  if (!phone || phone.length < 10) {
    showMessage('signupMsg', '⚠️ Please enter a valid 10-digit phone number.', 'error');
    return;
  }
  
  if (password.length < 6) {
    showMessage('signupMsg', '⚠️ Password must be at least 6 characters.', 'error');
    return;
  }
  
  if (password !== confirmPassword) {
    showMessage('signupMsg', '⚠️ Passwords do not match. Please re-enter.', 'error');
    return;
  }
  
  // STEP 3: Show loading spinner (Firebase can take 1-3 seconds)
  showLoading();
  
  try {
    // STEP 4: Create the Firebase account
    // 'createUserWithEmailAndPassword' creates account in Firebase Auth
    // It returns a 'userCredential' object with the user's info
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Get the user object from the result
    // user.uid is a unique ID Firebase gives every user (like a roll number)
    const user = userCredential.user;
    
    // STEP 5: Save parent details to Firestore database
    // We create a document in the 'parents' collection
    // The document ID is the user's UID (so we can find it later)
    await setDoc(doc(db, 'parents', user.uid), {
      fullName: fullName,           // Parent's full name
      email: email,                 // Parent's email
      phone: phone,                 // Parent's phone number
      accountType: 'parent',        // Type of account
      emailVerified: false,         // Will become true after verification
      createdAt: serverTimestamp()  // Exact time of account creation (from Firebase server)
    });
    
    // STEP 6: Send verification email
    // Firebase sends an email with a link to verify the account
    await sendEmailVerification(user);
    
    // STEP 7: Hide loading
    hideLoading();
    
    // STEP 8: Show the email verification popup
    showVerifyModal(email);
    
  } catch (error) {
    // If anything goes wrong, Firebase gives us an error
    hideLoading();
    
    // Convert Firebase error codes to friendly messages
    let errorMessage = '';
    
    // error.code tells us what went wrong
    if (error.code === 'auth/email-already-in-use') {
      errorMessage = '❌ This email is already registered. Please sign in instead.';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = '❌ Invalid email format. Please check your email.';
    } else if (error.code === 'auth/weak-password') {
      errorMessage = '❌ Password is too weak. Use at least 6 characters.';
    } else {
      // For any other errors, show the Firebase error message
      errorMessage = '❌ ' + error.message;
    }
    
    showMessage('signupMsg', errorMessage, 'error');
  }
}

// Make available globally
window.signupParent = signupParent;


// ============================================================
// LOGIN FUNCTION
// Signs in an existing parent
// ============================================================

/**
 * loginParent()
 * This function runs when user clicks "Sign In" button
 * Steps:
 * 1. Gets email and password
 * 2. Validates
 * 3. Signs in with Firebase
 * 4. Checks if email is verified
 * 5. Redirects or shows error
 */
async function loginParent() {
  // Get values from login form
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  
  // Clear previous messages
  clearMessage('loginMsg');
  
  // Validate
  if (!email) {
    showMessage('loginMsg', '⚠️ Please enter your email.', 'error');
    return;
  }
  
  if (!password) {
    showMessage('loginMsg', '⚠️ Please enter your password.', 'error');
    return;
  }
  
  // Show loading
  showLoading();
  
  try {
    // Sign in with Firebase Authentication
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Check if the user has verified their email
    if (!user.emailVerified) {
      // Not verified yet
      hideLoading();
      
      // Show message asking them to verify
      showMessage('loginMsg', '⚠️ Please verify your email first. Check your inbox!', 'error');
      
      // Show the verification modal again
      showVerifyModal(email);
      return;
    }
    
    // Email is verified! Update Firestore to reflect this
    await setDoc(doc(db, 'parents', user.uid), {
      emailVerified: true
    }, { merge: true }); 
    // merge: true means "update only these fields, don't delete others"
    
    hideLoading();
    
    // Show success message
    showMessage('loginMsg', '✅ Login successful! Welcome back.', 'success');
    
    // Wait 1.5 seconds then redirect to main app
    // (For now we stay on the page since we're only building auth)
    setTimeout(() => {
      // In a full app, this would go to the main dashboard
      // For now, show a welcome alert
      alert('✅ Welcome to FeeFinder, ' + (user.displayName || email) + '!');
    }, 1500);
    
  } catch (error) {
    hideLoading();
    
    let errorMessage = '';
    
    if (error.code === 'auth/user-not-found') {
      errorMessage = '❌ No account found with this email. Please sign up first.';
    } else if (error.code === 'auth/wrong-password') {
      errorMessage = '❌ Incorrect password. Please try again.';
    } else if (error.code === 'auth/invalid-credential') {
      errorMessage = '❌ Invalid email or password. Please check and try again.';
    } else if (error.code === 'auth/too-many-requests') {
      errorMessage = '❌ Too many failed attempts. Please wait a few minutes.';
    } else {
      errorMessage = '❌ ' + error.message;
    }
    
    showMessage('loginMsg', errorMessage, 'error');
  }
}

// Make available globally
window.loginParent = loginParent;


// ============================================================
// GOOGLE SIGN-IN
// ============================================================

/**
 * loginWithGoogle()
 * Opens Google Sign-In popup
 * After login, saves user data to Firestore
 */
async function loginWithGoogle() {
  // Create a Google provider object
  // This tells Firebase we want to use Google for sign-in
  const provider = new GoogleAuthProvider();
  
  showLoading();
  
  try {
    // Opens a popup window for Google login
    const result = await signInWithPopup(auth, provider);
    
    // Get the user from the result
    const user = result.user;
    
    // Check if this user already exists in our database
    // doc(db, 'parents', user.uid) creates a reference to the document
    const docRef = doc(db, 'parents', user.uid);
    const docSnap = await getDoc(docRef);
    
    // If the document does NOT exist (new user), save their data
    if (!docSnap.exists()) {
      await setDoc(docRef, {
        fullName: user.displayName || 'Google User', // Name from Google account
        email: user.email,
        phone: user.phoneNumber || '',  // Google might provide phone number
        accountType: 'parent',
        emailVerified: true,  // Google accounts are already verified
        createdAt: serverTimestamp(),
        loginMethod: 'google'  // How they signed in
      });
    }
    
    hideLoading();
    
    // Success! Show welcome message
    showMessage('loginMsg', '✅ Google Sign-In successful! Welcome.', 'success');
    
    setTimeout(() => {
      alert('✅ Welcome to FeeFinder, ' + user.displayName + '!');
    }, 1500);
    
  } catch (error) {
    hideLoading();
    
    let errorMessage = '';
    
    if (error.code === 'auth/popup-closed-by-user') {
      errorMessage = '⚠️ Sign-in popup was closed. Please try again.';
    } else {
      errorMessage = '❌ Google Sign-In failed: ' + error.message;
    }
    
    // Show error in whichever section is currently visible
    if (document.getElementById('signupSection').style.display !== 'none') {
      showMessage('signupMsg', errorMessage, 'error');
    } else {
      showMessage('loginMsg', errorMessage, 'error');
    }
  }
}

// Make available globally
window.loginWithGoogle = loginWithGoogle;


// ============================================================
// FORGOT PASSWORD
// ============================================================

/**
 * resetPassword()
 * Sends a password reset email to the user
 */
async function resetPassword() {
  const email = document.getElementById('forgotEmail').value.trim();
  
  clearMessage('forgotMsg');
  
  if (!email) {
    showMessage('forgotMsg', '⚠️ Please enter your email address.', 'error');
    return;
  }
  
  showLoading();
  
  try {
    // Firebase sends a reset email automatically
    await sendPasswordResetEmail(auth, email);
    
    hideLoading();
    
    showMessage(
      'forgotMsg', 
      '✅ Password reset email sent! Please check your inbox.', 
      'success'
    );
    
    // After 3 seconds, go back to login
    setTimeout(() => {
      showTab('login');
    }, 3000);
    
  } catch (error) {
    hideLoading();
    
    let errorMessage = '';
    
    if (error.code === 'auth/user-not-found') {
      errorMessage = '❌ No account found with this email.';
    } else {
      errorMessage = '❌ ' + error.message;
    }
    
    showMessage('forgotMsg', errorMessage, 'error');
  }
}

// Make available globally
window.resetPassword = resetPassword;


// ============================================================
// EMAIL VERIFICATION MODAL
// ============================================================

/**
 * showVerifyModal(email)
 * Shows the email verification popup
 * @param {string} email - The email to display in the modal
 */
function showVerifyModal(email) {
  // Show the email in the modal
  document.getElementById('modalEmailDisplay').textContent = email;
  
  // Show the modal overlay
  document.getElementById('verifyModal').style.display = 'flex';
}

/**
 * closeVerifyModal()
 * Closes the verification popup and shows login form
 */
function closeVerifyModal() {
  document.getElementById('verifyModal').style.display = 'none';
  
  // Switch to login tab
  showTab('login');
}

// Make available globally
window.closeVerifyModal = closeVerifyModal;

/**
 * resendVerification()
 * Resends the verification email if user didn't receive it
 */
async function resendVerification() {
  clearMessage('verifyMsg');
  
  // Check if a user is currently signed in
  const user = auth.currentUser;
  
  if (!user) {
    showMessage('verifyMsg', '❌ No user logged in. Please sign up again.', 'error');
    return;
  }
  
  showLoading();
  
  try {
    // Send verification email again
    await sendEmailVerification(user);
    
    hideLoading();
    
    showMessage('verifyMsg', '✅ Verification email resent! Please check your inbox.', 'success');
    
  } catch (error) {
    hideLoading();
    showMessage('verifyMsg', '❌ Could not resend email. Please try again later.', 'error');
  }
}

// Make available globally
window.resendVerification = resendVerification;


// ============================================================
// AUTH STATE OBSERVER
// This watches if user is logged in or out
// It runs automatically when the page loads
// ============================================================

/**
 * onAuthStateChanged listens for login/logout events
 * 
 * If user is already logged in (from a previous session):
 *   - We can redirect them or update the UI
 * 
 * If user is logged out:
 *   - Show the login form
 */
onAuthStateChanged(auth, (user) => {
  if (user) {
    // User is signed in
    console.log('User is logged in:', user.email);
    
    // You could redirect to dashboard here
    // For now, we just log it
    
  } else {
    // User is signed out
    console.log('No user is signed in.');
  }
});