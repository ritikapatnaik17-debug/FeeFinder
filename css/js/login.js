// ============================================================
// FILE: js/login.js
// PURPOSE: All login, signup, Google sign-in, verification logic
//
// HOW THIS WORKS NOW:
// We use the "compat" version of Firebase.
// This means we write: firebase.auth() and firebase.firestore()
// Instead of complex imports.
// This is MUCH simpler and works in any browser!
// ============================================================


// ============================================================
// SECTION 1: HELPER FUNCTIONS
// Small tools we use throughout the file
// ============================================================

/**
 * showLoading()
 * Shows the spinning loader on screen
 * Call this BEFORE any Firebase operation
 */
function showLoading() {
  document.getElementById('loadingOverlay').style.display = 'flex';
}

/**
 * hideLoading()
 * Hides the spinning loader
 * Call this AFTER Firebase operation finishes
 */
function hideLoading() {
  document.getElementById('loadingOverlay').style.display = 'none';
}

/**
 * showMessage(boxId, message, type)
 * Displays a colored message in a message box
 *
 * @param {string} boxId    - The id of the msg-box element
 * @param {string} message  - The text to display
 * @param {string} type     - 'success' = green, 'error' = red
 */
function showMessage(boxId, message, type) {
  // Find the element
  var box = document.getElementById(boxId);
  
  // If element doesn't exist, stop
  if (!box) return;
  
  // Set the text
  box.textContent = message;
  
  // Remove old color classes
  box.classList.remove('msg-success', 'msg-error');
  
  // Add the right color class
  if (type === 'success') {
    box.classList.add('msg-success');
  } else {
    box.classList.add('msg-error');
  }
}

/**
 * clearMessage(boxId)
 * Clears a message box
 */
function clearMessage(boxId) {
  var box = document.getElementById(boxId);
  if (!box) return;
  box.textContent = '';
  box.classList.remove('msg-success', 'msg-error');
}

/**
 * setButtonLoading(btnId, isLoading, originalText)
 * Changes button text to show loading state
 * This prevents users from clicking twice!
 *
 * @param {string}  btnId        - Button element id
 * @param {boolean} isLoading    - true = show loading, false = restore
 * @param {string}  originalText - The original button label
 */
function setButtonLoading(btnId, isLoading, originalText) {
  var btn = document.getElementById(btnId);
  if (!btn) return;
  
  if (isLoading) {
    // Disable the button and show spinner text
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Please wait...';
    btn.style.opacity = '0.8';
  } else {
    // Re-enable the button
    btn.disabled = false;
    btn.innerHTML = originalText;
    btn.style.opacity = '1';
  }
}


// ============================================================
// SECTION 2: TAB SWITCHING
// Controls which form section is visible
// ============================================================

/**
 * showTab(tabName)
 * Shows the correct form section based on tab clicked
 *
 * @param {string} tabName - 'login' or 'signup'
 */
function showTab(tabName) {
  // Get all sections
  var loginSection = document.getElementById('loginSection');
  var signupSection = document.getElementById('signupSection');
  var forgotSection = document.getElementById('forgotSection');
  
  // Get tab buttons
  var loginTab = document.getElementById('loginTab');
  var signupTab = document.getElementById('signupTab');
  
  // Hide everything first
  loginSection.style.display = 'none';
  signupSection.style.display = 'none';
  forgotSection.style.display = 'none';
  
  // Remove active class from both tabs
  loginTab.classList.remove('active');
  signupTab.classList.remove('active');
  
  // Show the selected section
  if (tabName === 'login') {
    loginSection.style.display = 'block';
    loginTab.classList.add('active');
    clearMessage('loginMsg');
    
  } else if (tabName === 'signup') {
    signupSection.style.display = 'block';
    signupTab.classList.add('active');
    clearMessage('signupMsg');
  }
}

/**
 * showForgotSection()
 * Shows the Forgot Password section
 * Hides login and signup tabs
 */
function showForgotSection() {
  document.getElementById('loginSection').style.display = 'none';
  document.getElementById('signupSection').style.display = 'none';
  document.getElementById('forgotSection').style.display = 'block';
  
  // Remove active from tabs
  document.getElementById('loginTab').classList.remove('active');
  document.getElementById('signupTab').classList.remove('active');
  
  clearMessage('forgotMsg');
}


// ============================================================
// SECTION 3: PASSWORD TOGGLE (Eye Icon)
// ============================================================

/**
 * togglePassword(inputId, eyeIcon)
 * Shows or hides the password text
 *
 * @param {string}      inputId - The id of the password input
 * @param {HTMLElement} eyeIcon - The eye icon that was clicked
 */
function togglePassword(inputId, eyeIcon) {
  var input = document.getElementById(inputId);
  
  if (input.type === 'password') {
    // Show the password text
    input.type = 'text';
    eyeIcon.classList.remove('fa-eye');
    eyeIcon.classList.add('fa-eye-slash');
  } else {
    // Hide the password again
    input.type = 'password';
    eyeIcon.classList.remove('fa-eye-slash');
    eyeIcon.classList.add('fa-eye');
  }
}


// ============================================================
// SECTION 4: SIGNUP FUNCTION
// Creates a new parent account in Firebase
// ============================================================

/**
 * signupParent()
 * Main signup function - runs when user clicks "Create Account"
 *
 * FLOW:
 * 1. Read form values
 * 2. Validate all fields
 * 3. Create account in Firebase Auth
 * 4. Save data to Firestore database
 * 5. Send email verification
 * 6. Show verification popup
 */
function signupParent() {
  
  // --- STEP 1: Read values from the form ---
  // .value gets the text the user typed
  // .trim() removes extra spaces from beginning/end
  var fullName = document.getElementById('signupName').value.trim();
  var email = document.getElementById('signupEmail').value.trim();
  var phone = document.getElementById('signupPhone').value.trim();
  var password = document.getElementById('signupPassword').value;
  var confirmPassword = document.getElementById('signupConfirmPassword').value;
  
  // Clear any previous error messages
  clearMessage('signupMsg');
  
  // --- STEP 2: Validate inputs ---
  // Check each field one by one
  
  if (fullName === '') {
    showMessage('signupMsg', '⚠️ Please enter your full name.', 'error');
    document.getElementById('signupName').focus(); // Move cursor to this field
    return; // STOP the function here
  }
  
  if (email === '') {
    showMessage('signupMsg', '⚠️ Please enter your email address.', 'error');
    document.getElementById('signupEmail').focus();
    return;
  }
  
  // Check email format using a simple test
  // This regex checks if email has @ and . in right places
  var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    showMessage('signupMsg', '⚠️ Please enter a valid email address.', 'error');
    document.getElementById('signupEmail').focus();
    return;
  }
  
  if (phone === '') {
    showMessage('signupMsg', '⚠️ Please enter your phone number.', 'error');
    document.getElementById('signupPhone').focus();
    return;
  }
  
  if (phone.length < 10) {
    showMessage('signupMsg', '⚠️ Phone number must be at least 10 digits.', 'error');
    document.getElementById('signupPhone').focus();
    return;
  }
  
  if (password === '') {
    showMessage('signupMsg', '⚠️ Please create a password.', 'error');
    document.getElementById('signupPassword').focus();
    return;
  }
  
  if (password.length < 6) {
    showMessage('signupMsg', '⚠️ Password must be at least 6 characters long.', 'error');
    document.getElementById('signupPassword').focus();
    return;
  }
  
  if (confirmPassword === '') {
    showMessage('signupMsg', '⚠️ Please confirm your password.', 'error');
    document.getElementById('signupConfirmPassword').focus();
    return;
  }
  
  if (password !== confirmPassword) {
    showMessage('signupMsg', '⚠️ Passwords do not match! Please re-enter.', 'error');
    document.getElementById('signupConfirmPassword').focus();
    return;
  }
  
  // --- STEP 3: Show loading state ---
  showLoading();
  setButtonLoading('signupBtn', true, '<i class="fas fa-user-plus"></i> Create Account');
  
  // --- STEP 4: Create account in Firebase ---
  // auth.createUserWithEmailAndPassword() is the Firebase function
  // It returns a "Promise" - meaning it will finish in the future
  // .then() runs when it SUCCEEDS
  // .catch() runs when it FAILS
  auth.createUserWithEmailAndPassword(email, password)
    .then(function(userCredential) {
      
      // userCredential.user is the newly created user object
      // user.uid is the unique ID Firebase gives every user
      var user = userCredential.user;
      
      console.log('✅ Account created! User ID:', user.uid);
      
      // --- STEP 5: Save parent data to Firestore ---
      // db.collection('parents') → refers to the 'parents' collection
      // .doc(user.uid) → creates/updates document with user's ID
      // .set() → saves the data
      return db.collection('parents').doc(user.uid).set({
        fullName: fullName,
        email: email,
        phone: phone,
        accountType: 'parent',
        emailVerified: false,
        // firebase.firestore.FieldValue.serverTimestamp() 
        // saves the exact time from Firebase server
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      
    })
    .then(function() {
      
      console.log('✅ Parent data saved to Firestore!');
      
      // --- STEP 6: Send email verification ---
      // Firebase sends an email to the user's inbox
      // The email contains a link to verify their account
      var user = auth.currentUser;
      return user.sendEmailVerification();
      
    })
    .then(function() {
      
      console.log('✅ Verification email sent!');
      
      // --- STEP 7: Hide loading and show success ---
      hideLoading();
      setButtonLoading('signupBtn', false, '<i class="fas fa-user-plus"></i> Create Account');
      
      // Show the verification modal popup
      showVerifyModal(email);
      
    })
    .catch(function(error) {
      
      // Something went wrong!
      hideLoading();
      setButtonLoading('signupBtn', false, '<i class="fas fa-user-plus"></i> Create Account');
      
      // Log the error so we can see it in browser console
      console.error('❌ Signup error:', error.code, error.message);
      
      // Show user-friendly error message
      var errorMessage = '';
      
      // error.code tells us WHAT went wrong
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = '❌ This email is already registered. Please sign in or use a different email.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = '❌ The email address is not valid. Please check it.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = '❌ Password is too weak. Use at least 6 characters with numbers.';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = '❌ No internet connection. Please check your connection and try again.';
      } else {
        // For any other error, show the Firebase message
        errorMessage = '❌ Error: ' + error.message;
      }
      
      showMessage('signupMsg', errorMessage, 'error');
    });
}


// ============================================================
// SECTION 5: LOGIN FUNCTION
// Signs in an existing parent
// ============================================================

/**
 * loginParent()
 * Signs in with email and password
 *
 * FLOW:
 * 1. Read email and password
 * 2. Validate them
 * 3. Sign in with Firebase
 * 4. Check if email is verified
 * 5. If yes → welcome message
 * 6. If no → show verification reminder
 */
function loginParent() {
  
  // Read values
  var email = document.getElementById('loginEmail').value.trim();
  var password = document.getElementById('loginPassword').value;
  
  clearMessage('loginMsg');
  
  // Validate
  if (email === '') {
    showMessage('loginMsg', '⚠️ Please enter your email address.', 'error');
    document.getElementById('loginEmail').focus();
    return;
  }
  
  if (password === '') {
    showMessage('loginMsg', '⚠️ Please enter your password.', 'error');
    document.getElementById('loginPassword').focus();
    return;
  }
  
  // Show loading
  showLoading();
  setButtonLoading('loginBtn', true, '<i class="fas fa-sign-in-alt"></i> Sign In');
  
  // Sign in with Firebase
  auth.signInWithEmailAndPassword(email, password)
    .then(function(userCredential) {
      
      var user = userCredential.user;
      
      console.log('✅ Signed in as:', user.email);
      
      // Check if email is verified
      if (!user.emailVerified) {
        // NOT verified
        hideLoading();
        setButtonLoading('loginBtn', false, '<i class="fas fa-sign-in-alt"></i> Sign In');
        
        showMessage(
          'loginMsg',
          '⚠️ Please verify your email first! Check your inbox for the verification link.',
          'error'
        );
        
        // Show the verification popup again
        showVerifyModal(email);
        return;
      }
      
      // Email IS verified → Update Firestore
      return db.collection('parents').doc(user.uid).set(
        { emailVerified: true },
        { merge: true }  // merge: true = only update this field, keep others
      );
      
    })
    .then(function() {
      
      hideLoading();
      setButtonLoading('loginBtn', false, '<i class="fas fa-sign-in-alt"></i> Sign In');
      
      var user = auth.currentUser;
      
      if (user && user.emailVerified) {
        showMessage('loginMsg', '✅ Login successful! Welcome back.', 'success');
        
        // Wait 2 seconds then show welcome
        setTimeout(function() {
          alert('✅ Welcome to FeeFinder!\n\nYou are now logged in as: ' + user.email);
          // In a full app, you would redirect to: window.location.href = 'dashboard.html';
        }, 1500);
      }
      
    })
    .catch(function(error) {
      
      hideLoading();
      setButtonLoading('loginBtn', false, '<i class="fas fa-sign-in-alt"></i> Sign In');
      
      console.error('❌ Login error:', error.code, error.message);
      
      var errorMessage = '';
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = '❌ No account found with this email. Please sign up first.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = '❌ Wrong password. Please try again.';
      } else if (error.code === 'auth/invalid-credential') {
        errorMessage = '❌ Invalid email or password. Please check and try again.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = '❌ Invalid email format.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = '❌ Too many failed attempts. Account temporarily locked. Try again later.';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = '❌ No internet. Please check your connection.';
      } else {
        errorMessage = '❌ ' + error.message;
      }
      
      showMessage('loginMsg', errorMessage, 'error');
    });
}


// ============================================================
// SECTION 6: GOOGLE SIGN-IN
// ============================================================

/**
 * loginWithGoogle()
 * Opens Google Sign-In popup window
 */
function loginWithGoogle() {
  
  // Create Google provider
  // This tells Firebase: "use Google for login"
  var provider = new firebase.auth.GoogleAuthProvider();
  
  // Add scope to get user's email
  provider.addScope('email');
  provider.addScope('profile');
  
  showLoading();
  
  // Open the Google popup
  auth.signInWithPopup(provider)
    .then(function(result) {
      
      var user = result.user;
      
      console.log('✅ Google Sign-In success:', user.email);
      
      // Check if this user exists in our database
      return db.collection('parents').doc(user.uid).get()
        .then(function(doc) {
          
          if (!doc.exists) {
            // NEW user - save their data to Firestore
            return db.collection('parents').doc(user.uid).set({
              fullName: user.displayName || 'Google User',
              email: user.email,
              phone: user.phoneNumber || '',
              accountType: 'parent',
              emailVerified: true,
              loginMethod: 'google',
              createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
          }
          // If user already exists, just continue (no need to save again)
        });
      
    })
    .then(function() {
      
      hideLoading();
      
      var user = auth.currentUser;
      showMessage('loginMsg', '✅ Google Sign-In successful! Welcome.', 'success');
      
      setTimeout(function() {
        alert('✅ Welcome to FeeFinder!\n' + user.displayName + ' (' + user.email + ')');
      }, 1000);
      
    })
    .catch(function(error) {
      
      hideLoading();
      
      console.error('❌ Google Sign-In error:', error.code);
      
      var errorMessage = '';
      
      if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = '⚠️ Sign-in was cancelled. Please try again.';
      } else if (error.code === 'auth/popup-blocked') {
        errorMessage = '❌ Popup was blocked by your browser. Please allow popups for this site.';
      } else {
        errorMessage = '❌ Google Sign-In failed: ' + error.message;
      }
      
      // Show error in whichever section is visible
      var signupVisible = document.getElementById('signupSection').style.display !== 'none';
      showMessage(signupVisible ? 'signupMsg' : 'loginMsg', errorMessage, 'error');
    });
}


// ============================================================
// SECTION 7: FORGOT PASSWORD
// ============================================================

/**
 * resetPassword()
 * Sends password reset email
 */
function resetPassword() {
  
  var email = document.getElementById('forgotEmail').value.trim();
  
  clearMessage('forgotMsg');
  
  if (email === '') {
    showMessage('forgotMsg', '⚠️ Please enter your email address.', 'error');
    document.getElementById('forgotEmail').focus();
    return;
  }
  
  showLoading();
  
  auth.sendPasswordResetEmail(email)
    .then(function() {
      
      hideLoading();
      
      showMessage(
        'forgotMsg',
        '✅ Password reset email sent! Please check your inbox (and spam folder).',
        'success'
      );
      
      // Go back to login after 3 seconds
      setTimeout(function() {
        showTab('login');
      }, 3000);
      
    })
    .catch(function(error) {
      
      hideLoading();
      
      console.error('❌ Reset password error:', error.code);
      
      var errorMessage = '';
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = '❌ No account found with this email address.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = '❌ Invalid email format.';
      } else {
        errorMessage = '❌ ' + error.message;
      }
      
      showMessage('forgotMsg', errorMessage, 'error');
    });
}


// ============================================================
// SECTION 8: EMAIL VERIFICATION MODAL
// ============================================================

/**
 * showVerifyModal(email)
 * Shows the email verification popup
 */
function showVerifyModal(email) {
  // Display the user's email in the popup
  document.getElementById('modalEmailDisplay').textContent = email;
  
  // Show the modal
  document.getElementById('verifyModal').style.display = 'flex';
}

/**
 * closeVerifyModal()
 * Closes the popup and goes to login tab
 */
function closeVerifyModal() {
  document.getElementById('verifyModal').style.display = 'none';
  showTab('login');
}

/**
 * resendVerification()
 * Resends the verification email
 */
function resendVerification() {
  
  clearMessage('verifyMsg');
  
  var user = auth.currentUser;
  
  if (!user) {
    showMessage('verifyMsg', '❌ No user found. Please sign up again.', 'error');
    return;
  }
  
  showLoading();
  
  user.sendEmailVerification()
    .then(function() {
      hideLoading();
      showMessage('verifyMsg', '✅ Verification email resent! Check your inbox.', 'success');
    })
    .catch(function(error) {
      hideLoading();
      showMessage('verifyMsg', '❌ Could not resend. Please wait a few minutes.', 'error');
    });
}


// ============================================================
// SECTION 9: AUTH STATE LISTENER
// Watches if user is logged in or out automatically
// ============================================================

/**
 * auth.onAuthStateChanged() runs automatically:
 * - When page loads
 * - When user logs in
 * - When user logs out
 */
auth.onAuthStateChanged(function(user) {
  if (user) {
    // User is currently signed in
    console.log('👤 User is logged in:', user.email, '| Verified:', user.emailVerified);
  } else {
    // No user is signed in
    console.log('👤 No user is signed in.');
  }
});


// ============================================================
// SECTION 10: KEYBOARD SUPPORT
// Allow pressing ENTER key to submit forms
// ============================================================

// When page loads, add keyboard listeners
document.addEventListener('DOMContentLoaded', function() {
  
  // Enter key on login form
  document.getElementById('loginPassword').addEventListener('keypress', function(e) {
    // e.key === 'Enter' checks if Enter was pressed
    if (e.key === 'Enter') {
      loginParent();
    }
  });
  
  // Enter key on signup confirm password
  document.getElementById('signupConfirmPassword').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      signupParent();
    }
  });
  
  // Enter key on forgot password
  document.getElementById('forgotEmail').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      resetPassword();
    }
  });
  
  console.log('✅ FeeFinder Login Page loaded successfully!');
});