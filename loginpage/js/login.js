// ============================================================
// FILE: js/login.js
// PURPOSE: All login, signup, Google sign-in,
//          email verification, and password reset logic
// ============================================================


// ============================================================
// SECTION 1: HELPER FUNCTIONS
// ============================================================

// Shows the loading spinner overlay
function showLoading() {
  document.getElementById("loadingOverlay").classList.add("show");
}

// Hides the loading spinner overlay
function hideLoading() {
  document.getElementById("loadingOverlay").classList.remove("show");
}

// Shows a colored message inside a message box
// boxId = id of the msg-box element
// msg   = text to display
// type  = "success" (green) or "error" (red)
function showMsg(boxId, msg, type) {
  var box = document.getElementById(boxId);
  if (!box) return;
  box.textContent = msg;
  box.className = "msg-box " + (type === "success" ? "msg-success" : "msg-error");
}

// Clears a message box
function clearMsg(boxId) {
  var box = document.getElementById(boxId);
  if (!box) return;
  box.textContent = "";
  box.className = "msg-box";
}

// Sets a button to loading state or restores it
// btnId        = button element id
// loading      = true means show spinner text, false means restore
// originalHTML = the original button label to restore
function setBtnLoading(btnId, loading, originalHTML) {
  var btn = document.getElementById(btnId);
  if (!btn) return;
  if (loading) {
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Please wait...';
  } else {
    btn.disabled = false;
    btn.innerHTML = originalHTML;
  }
}


// ============================================================
// SECTION 2: TAB SWITCHING
// Controls which form is visible: login, signup, or forgot
// ============================================================

function showTab(tabName) {

  // Hide all three sections
  document.getElementById("loginSection").classList.remove("active-section");
  document.getElementById("signupSection").classList.remove("active-section");
  document.getElementById("forgotSection").classList.remove("active-section");

  // Remove active highlight from tab buttons
  document.getElementById("loginTab").classList.remove("active");
  document.getElementById("signupTab").classList.remove("active");

  // Show correct section and highlight correct tab
  if (tabName === "login") {
    document.getElementById("loginSection").classList.add("active-section");
    document.getElementById("loginTab").classList.add("active");
    clearMsg("loginMsg");

  } else if (tabName === "signup") {
    document.getElementById("signupSection").classList.add("active-section");
    document.getElementById("signupTab").classList.add("active");
    clearMsg("signupMsg");

  } else if (tabName === "forgot") {
    document.getElementById("forgotSection").classList.add("active-section");
    clearMsg("forgotMsg");
  }
}


// ============================================================
// SECTION 3: PASSWORD SHOW / HIDE (Eye Icon)
// ============================================================

function togglePassword(inputId, icon) {
  var input = document.getElementById(inputId);
  if (input.type === "password") {
    input.type = "text";
    icon.classList.replace("fa-eye", "fa-eye-slash");
  } else {
    input.type = "password";
    icon.classList.replace("fa-eye-slash", "fa-eye");
  }
}


// ============================================================
// SECTION 4: SIGNUP FUNCTION
// Creates a new parent account in Firebase
// ============================================================

function signupParent() {

  // Read all values from the signup form
  var name     = document.getElementById("signupName").value.trim();
  var email    = document.getElementById("signupEmail").value.trim();
  var phone    = document.getElementById("signupPhone").value.trim();
  var password = document.getElementById("signupPassword").value;
  var confirm  = document.getElementById("signupConfirmPassword").value;

  // Clear any previous messages
  clearMsg("signupMsg");

  // ---- Validate every field one by one ----

  if (!name) {
    showMsg("signupMsg", "⚠️ Please enter your full name.", "error");
    document.getElementById("signupName").focus();
    return;
  }

  if (!email) {
    showMsg("signupMsg", "⚠️ Please enter your email address.", "error");
    document.getElementById("signupEmail").focus();
    return;
  }

  // Check email has correct format like abc@gmail.com
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showMsg("signupMsg", "⚠️ Please enter a valid email address.", "error");
    document.getElementById("signupEmail").focus();
    return;
  }

  if (!phone) {
    showMsg("signupMsg", "⚠️ Please enter your phone number.", "error");
    document.getElementById("signupPhone").focus();
    return;
  }

  if (phone.length < 10) {
    showMsg("signupMsg", "⚠️ Phone number must be at least 10 digits.", "error");
    document.getElementById("signupPhone").focus();
    return;
  }

  if (!password) {
    showMsg("signupMsg", "⚠️ Please create a password.", "error");
    document.getElementById("signupPassword").focus();
    return;
  }

  if (password.length < 6) {
    showMsg("signupMsg", "⚠️ Password must be at least 6 characters.", "error");
    document.getElementById("signupPassword").focus();
    return;
  }

  if (!confirm) {
    showMsg("signupMsg", "⚠️ Please confirm your password.", "error");
    document.getElementById("signupConfirmPassword").focus();
    return;
  }

  if (password !== confirm) {
    showMsg("signupMsg", "⚠️ Passwords do not match! Please re-enter.", "error");
    document.getElementById("signupConfirmPassword").focus();
    return;
  }

  // ---- All fields are valid — start Firebase ----

  showLoading();
  setBtnLoading(
    "signupBtn",
    true,
    '<i class="fas fa-user-plus"></i> Create Account'
  );

  // STEP 1: Create the account in Firebase Authentication
  auth.createUserWithEmailAndPassword(email, password)

    .then(function (userCredential) {
      // Account created successfully
      var user = userCredential.user;
      console.log("✅ Account created! UID:", user.uid);

      // STEP 2: Save parent data to Firestore database
      // collection("parents") = the parents table in Firestore
      // doc(user.uid) = use Firebase user ID as document name
      return db.collection("parents").doc(user.uid).set({
        fullName      : name,
        email         : email,
        phone         : phone,
        accountType   : "parent",
        emailVerified : false,
        createdAt     : firebase.firestore.FieldValue.serverTimestamp()
      });
    })

    .then(function () {
      console.log("✅ Parent data saved to Firestore!");

      // STEP 3: Send verification email to the user
      var user = auth.currentUser;
      return user.sendEmailVerification();
    })

    .then(function () {
      console.log("✅ Verification email sent!");

      hideLoading();
      setBtnLoading(
        "signupBtn",
        false,
        '<i class="fas fa-user-plus"></i> Create Account'
      );

      // STEP 4: Show verification popup to user
      showVerifyModal(email);
    })

    .catch(function (error) {
      // Something went wrong — show the error message
      hideLoading();
      setBtnLoading(
        "signupBtn",
        false,
        '<i class="fas fa-user-plus"></i> Create Account'
      );

      console.error("❌ Signup error:", error.code, error.message);

      var msg = "";
      if (error.code === "auth/email-already-in-use")
        msg = "❌ This email is already registered. Please sign in.";
      else if (error.code === "auth/invalid-email")
        msg = "❌ Invalid email format. Please check.";
      else if (error.code === "auth/weak-password")
        msg = "❌ Password is too weak. Use at least 6 characters.";
      else if (error.code === "auth/network-request-failed")
        msg = "❌ No internet connection. Please check and retry.";
      else
        msg = "❌ " + error.message;

      showMsg("signupMsg", msg, "error");
    });
}


// ============================================================
// SECTION 5: LOGIN FUNCTION
// Signs in an existing parent
// ============================================================

function loginParent() {

  var email    = document.getElementById("loginEmail").value.trim();
  var password = document.getElementById("loginPassword").value;

  clearMsg("loginMsg");

  if (!email) {
    showMsg("loginMsg", "⚠️ Please enter your email.", "error");
    document.getElementById("loginEmail").focus();
    return;
  }

  if (!password) {
    showMsg("loginMsg", "⚠️ Please enter your password.", "error");
    document.getElementById("loginPassword").focus();
    return;
  }

  showLoading();
  setBtnLoading(
    "loginBtn",
    true,
    '<i class="fas fa-sign-in-alt"></i> Sign In'
  );

  auth.signInWithEmailAndPassword(email, password)

    .then(function (userCredential) {
      var user = userCredential.user;
      console.log("✅ Signed in:", user.email);

      // Check if user has verified their email
      if (!user.emailVerified) {
        hideLoading();
        setBtnLoading(
          "loginBtn",
          false,
          '<i class="fas fa-sign-in-alt"></i> Sign In'
        );
        showMsg(
          "loginMsg",
          "⚠️ Please verify your email first. Check your inbox!",
          "error"
        );
        showVerifyModal(email);
        return Promise.reject({ handled: true });
      }

      // Update emailVerified field in Firestore
      return db.collection("parents").doc(user.uid).set(
        { emailVerified: true },
        { merge: true }
      );
    })

    .then(function () {
      hideLoading();
      setBtnLoading(
        "loginBtn",
        false,
        '<i class="fas fa-sign-in-alt"></i> Sign In'
      );

      var user = auth.currentUser;
      if (user) {
        showMsg("loginMsg", "✅ Login successful! Welcome back.", "success");
        setTimeout(function () {
          alert("✅ Welcome to FeeFinder!\n\nLogged in as: " + user.email);
        }, 1200);
      }
    })

    .catch(function (error) {
      if (error.handled) return;

      hideLoading();
      setBtnLoading(
        "loginBtn",
        false,
        '<i class="fas fa-sign-in-alt"></i> Sign In'
      );

      console.error("❌ Login error:", error.code);

      var msg = "";
      if (error.code === "auth/user-not-found")
        msg = "❌ No account found. Please sign up first.";
      else if (error.code === "auth/wrong-password")
        msg = "❌ Wrong password. Please try again.";
      else if (error.code === "auth/invalid-credential")
        msg = "❌ Invalid email or password. Please check.";
      else if (error.code === "auth/too-many-requests")
        msg = "❌ Too many attempts. Try again later.";
      else if (error.code === "auth/network-request-failed")
        msg = "❌ No internet connection.";
      else
        msg = "❌ " + error.message;

      showMsg("loginMsg", msg, "error");
    });
}


// ============================================================
// SECTION 6: GOOGLE SIGN-IN
// ============================================================

function loginWithGoogle() {

  var provider = new firebase.auth.GoogleAuthProvider();
  provider.addScope("email");
  provider.addScope("profile");

  showLoading();

  auth.signInWithPopup(provider)

    .then(function (result) {
      var user = result.user;
      console.log("✅ Google Sign-In:", user.email);

      // Check if this user already exists in Firestore
      return db.collection("parents").doc(user.uid).get()
        .then(function (doc) {
          if (!doc.exists) {
            // New user — save their data
            return db.collection("parents").doc(user.uid).set({
              fullName      : user.displayName || "Google User",
              email         : user.email,
              phone         : user.phoneNumber || "",
              accountType   : "parent",
              emailVerified : true,
              loginMethod   : "google",
              createdAt     : firebase.firestore.FieldValue.serverTimestamp()
            });
          }
          // Existing user — no need to save again
        });
    })

    .then(function () {
      hideLoading();
      var user = auth.currentUser;
      showMsg("loginMsg", "✅ Google Sign-In successful!", "success");
      setTimeout(function () {
        alert(
          "✅ Welcome to FeeFinder!\n" +
          user.displayName + "\n" +
          user.email
        );
      }, 1000);
    })

    .catch(function (error) {
      hideLoading();
      console.error("❌ Google error:", error.code);

      var msg = "";
      if (error.code === "auth/popup-closed-by-user")
        msg = "⚠️ Sign-in cancelled. Please try again.";
      else if (error.code === "auth/popup-blocked")
        msg = "❌ Popup blocked. Please allow popups for this site.";
      else
        msg = "❌ Google Sign-In failed: " + error.message;

      showMsg("loginMsg", msg, "error");
    });
}


// ============================================================
// SECTION 7: FORGOT PASSWORD
// ============================================================

function resetPassword() {

  var email = document.getElementById("forgotEmail").value.trim();
  clearMsg("forgotMsg");

  if (!email) {
    showMsg("forgotMsg", "⚠️ Please enter your email address.", "error");
    document.getElementById("forgotEmail").focus();
    return;
  }

  showLoading();

  auth.sendPasswordResetEmail(email)
    .then(function () {
      hideLoading();
      showMsg(
        "forgotMsg",
        "✅ Reset email sent! Check your inbox and spam folder.",
        "success"
      );
      // Go back to login after 3 seconds
      setTimeout(function () {
        showTab("login");
      }, 3000);
    })
    .catch(function (error) {
      hideLoading();
      var msg =
        error.code === "auth/user-not-found"
          ? "❌ No account found with this email."
          : "❌ " + error.message;
      showMsg("forgotMsg", msg, "error");
    });
}


// ============================================================
// SECTION 8: EMAIL VERIFICATION MODAL
// ============================================================

// Shows the verification popup with the user's email
function showVerifyModal(email) {
  document.getElementById("modalEmailDisplay").textContent = email;
  document.getElementById("verifyModal").classList.add("show");
}

// Closes the popup and goes back to login
function closeVerifyModal() {
  document.getElementById("verifyModal").classList.remove("show");
  showTab("login");
}

// Resends the verification email
function resendVerification() {
  clearMsg("verifyMsg");

  var user = auth.currentUser;

  if (!user) {
    showMsg("verifyMsg", "❌ No user found. Please sign up again.", "error");
    return;
  }

  showLoading();

  user.sendEmailVerification()
    .then(function () {
      hideLoading();
      showMsg(
        "verifyMsg",
        "✅ Verification email resent! Check your inbox.",
        "success"
      );
    })
    .catch(function () {
      hideLoading();
      showMsg(
        "verifyMsg",
        "❌ Could not resend. Please wait a few minutes and try again.",
        "error"
      );
    });
}


// ============================================================
// SECTION 9: KEYBOARD SUPPORT
// Press Enter key to submit forms
// ============================================================

document.addEventListener("DOMContentLoaded", function () {

  // Enter on login password field
  document.getElementById("loginPassword")
    .addEventListener("keypress", function (e) {
      if (e.key === "Enter") loginParent();
    });

  // Enter on signup confirm password field
  document.getElementById("signupConfirmPassword")
    .addEventListener("keypress", function (e) {
      if (e.key === "Enter") signupParent();
    });

  // Enter on forgot password email field
  document.getElementById("forgotEmail")
    .addEventListener("keypress", function (e) {
      if (e.key === "Enter") resetPassword();
    });

  console.log("✅ FeeFinder Login Page ready!");
});


// ============================================================
// SECTION 10: AUTH STATE WATCHER
// Automatically runs when page loads or user logs in/out
// ============================================================

auth.onAuthStateChanged(function (user) {
  if (user) {
    console.log("👤 User logged in:", user.email, "| Verified:", user.emailVerified);
  } else {
    console.log("👤 No user logged in.");
  }
});