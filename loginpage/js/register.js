// ============================================================
// FILE: js/register.js
// PURPOSE: Handles institution (school/college) registration
//          Generates fee cards dynamically
//          Saves all data to Firestore
// ============================================================

// Import Firebase tools
import { auth, db } from './firebase-config.js';

// Import Firestore functions
import {
  collection,       // Reference to a collection
  addDoc,           // Adds a new document with auto-generated ID
  serverTimestamp   // Server time
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Import auth state observer
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";


// ============================================================
// GLOBAL VARIABLES
// These store data as user moves through the steps
// ============================================================

// Keeps track of which institution type was selected
let currentInstitutionType = ''; // 'school' or 'college'

// Stores the current user's UID (from Firebase Auth)
let currentUserId = '';

// Stores the institution document ID after saving (to link fee structures)
let savedInstitutionId = '';


// ============================================================
// CHECK IF USER IS LOGGED IN
// We watch for auth state to get the user's ID
// ============================================================
onAuthStateChanged(auth, (user) => {
  if (user) {
    // Store user ID for later use
    currentUserId = user.uid;
    console.log('Register page: User logged in:', user.email);
  } else {
    // No user logged in
    // Optional: redirect to login
    console.log('No user logged in on register page.');
    // Uncomment below line to force login before registering:
    // window.location.href = 'index.html';
  }
});


// ============================================================
// HELPER FUNCTIONS
// ============================================================

function showLoading() {
  document.getElementById('loadingOverlay').style.display = 'flex';
}

function hideLoading() {
  document.getElementById('loadingOverlay').style.display = 'none';
}

/**
 * showMessage(elementId, message, type)
 * Same as login.js — shows colored messages
 */
function showMessage(elementId, message, type) {
  const msgBox = document.getElementById(elementId);
  if (!msgBox) return;
  msgBox.textContent = message;
  msgBox.classList.remove('msg-success', 'msg-error');
  msgBox.classList.add(type === 'success' ? 'msg-success' : 'msg-error');
}

function clearMessage(elementId) {
  const msgBox = document.getElementById(elementId);
  if (!msgBox) return;
  msgBox.textContent = '';
  msgBox.classList.remove('msg-success', 'msg-error');
}


// ============================================================
// STEP NAVIGATION FUNCTIONS
// Show/hide different step sections
// ============================================================

/**
 * hideAllSteps()
 * Hides all form steps (we call this before showing one)
 */
function hideAllSteps() {
  document.getElementById('formStep1').style.display = 'none';
  document.getElementById('formStep2School').style.display = 'none';
  document.getElementById('formStep2College').style.display = 'none';
  document.getElementById('formStep3').style.display = 'none';
  document.getElementById('successScreen').style.display = 'none';
}

/**
 * updateProgressIndicator(stepNumber)
 * Updates the visual progress circles at the top
 * @param {number} stepNumber - Which step (1, 2, or 3)
 */
function updateProgressIndicator(stepNumber) {
  // Remove all active/completed states
  document.getElementById('step1Indicator').classList.remove('active', 'completed');
  document.getElementById('step2Indicator').classList.remove('active', 'completed');
  document.getElementById('step3Indicator').classList.remove('active', 'completed');
  document.getElementById('line1').classList.remove('active');
  document.getElementById('line2').classList.remove('active');
  
  // Set states based on current step
  if (stepNumber === 1) {
    document.getElementById('step1Indicator').classList.add('active');
  } else if (stepNumber === 2) {
    document.getElementById('step1Indicator').classList.add('completed');
    document.getElementById('step2Indicator').classList.add('active');
    document.getElementById('line1').classList.add('active');
  } else if (stepNumber === 3) {
    document.getElementById('step1Indicator').classList.add('completed');
    document.getElementById('step2Indicator').classList.add('completed');
    document.getElementById('step3Indicator').classList.add('active');
    document.getElementById('line1').classList.add('active');
    document.getElementById('line2').classList.add('active');
  }
}

/**
 * goToStep1()
 * Shows Step 1 form
 */
function goToStep1() {
  hideAllSteps();
  document.getElementById('formStep1').style.display = 'block';
  updateProgressIndicator(1);
  // Scroll to top of form
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Make globally available
window.goToStep1 = goToStep1;


/**
 * handleInstitutionType()
 * Called when user selects school or college from dropdown
 * Just stores the selection for now
 */
function handleInstitutionType() {
  currentInstitutionType = document.getElementById('institutionType').value;
}

// Make globally available
window.handleInstitutionType = handleInstitutionType;


/**
 * goToStep2()
 * Validates Step 1 and moves to Step 2
 */
function goToStep2() {
  clearMessage('step1Msg');
  
  const name = document.getElementById('institutionName').value.trim();
  const type = document.getElementById('institutionType').value;
  
  // Validate Step 1 fields
  if (!name) {
    showMessage('step1Msg', '⚠️ Please enter the institution name.', 'error');
    return;
  }
  
  if (!type) {
    showMessage('step1Msg', '⚠️ Please select the type of institution.', 'error');
    return;
  }
  
  // Store the type
  currentInstitutionType = type;
  
  // Hide all steps and show correct Step 2
  hideAllSteps();
  
  if (type === 'school') {
    document.getElementById('formStep2School').style.display = 'block';
  } else if (type === 'college') {
    document.getElementById('formStep2College').style.display = 'block';
  }
  
  updateProgressIndicator(2);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Make globally available
window.goToStep2 = goToStep2;


/**
 * goToStep3School()
 * Validates school details and moves to Step 3 (fee structure)
 */
function goToStep3School() {
  clearMessage('step2SchoolMsg');
  
  // Get all school fields
  const board = document.getElementById('boardType').value;
  const classes = document.getElementById('numberOfClasses').value;
  const regId = document.getElementById('schoolRegId').value.trim();
  const address = document.getElementById('schoolAddress').value.trim();
  const contact = document.getElementById('schoolContact').value.trim();
  const email = document.getElementById('schoolEmail').value.trim();
  
  // Validate
  if (!board) {
    showMessage('step2SchoolMsg', '⚠️ Please select the board type.', 'error');
    return;
  }
  if (!classes) {
    showMessage('step2SchoolMsg', '⚠️ Please select the classes offered.', 'error');
    return;
  }
  if (!regId) {
    showMessage('step2SchoolMsg', '⚠️ Please enter the Registration ID.', 'error');
    return;
  }
  if (!address) {
    showMessage('step2SchoolMsg', '⚠️ Please enter the complete address.', 'error');
    return;
  }
  if (!contact || contact.length < 10) {
    showMessage('step2SchoolMsg', '⚠️ Please enter a valid contact number.', 'error');
    return;
  }
  if (!email) {
    showMessage('step2SchoolMsg', '⚠️ Please enter the official email.', 'error');
    return;
  }
  
  // Generate fee cards for school
  generateSchoolFeeCards(classes);
  
  // Move to step 3
  hideAllSteps();
  document.getElementById('formStep3').style.display = 'block';
  updateProgressIndicator(3);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Make globally available
window.goToStep3School = goToStep3School;


/**
 * goToStep3College()
 * Validates college details and moves to Step 3
 */
function goToStep3College() {
  clearMessage('step2CollegeMsg');
  
  const type = document.getElementById('collegeType').value;
  const regId = document.getElementById('collegeRegId').value.trim();
  const address = document.getElementById('collegeAddress').value.trim();
  const contact = document.getElementById('collegeContact').value.trim();
  const email = document.getElementById('collegeEmail').value.trim();
  
  // Get selected branches
  const branchCheckboxes = document.querySelectorAll('.branch-check:checked');
  
  // Validate
  if (!type) {
    showMessage('step2CollegeMsg', '⚠️ Please select the college type.', 'error');
    return;
  }
  if (branchCheckboxes.length === 0) {
    showMessage('step2CollegeMsg', '⚠️ Please select at least one branch.', 'error');
    return;
  }
  if (!regId) {
    showMessage('step2CollegeMsg', '⚠️ Please enter the Registration ID.', 'error');
    return;
  }
  if (!address) {
    showMessage('step2CollegeMsg', '⚠️ Please enter the complete address.', 'error');
    return;
  }
  if (!contact || contact.length < 10) {
    showMessage('step2CollegeMsg', '⚠️ Please enter a valid contact number.', 'error');
    return;
  }
  if (!email) {
    showMessage('step2CollegeMsg', '⚠️ Please enter the official email.', 'error');
    return;
  }
  
  // Get array of selected branch names
  const selectedBranches = Array.from(branchCheckboxes).map(cb => cb.value);
  
  // Generate fee cards for college
  generateCollegeFeeCards(selectedBranches);
  
  // Move to step 3
  hideAllSteps();
  document.getElementById('formStep3').style.display = 'block';
  updateProgressIndicator(3);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Make globally available
window.goToStep3College = goToStep3College;


/**
 * goToStep2FromStep3()
 * Goes back from step 3 to correct step 2
 */
function goToStep2FromStep3() {
  hideAllSteps();
  
  if (currentInstitutionType === 'school') {
    document.getElementById('formStep2School').style.display = 'block';
  } else {
    document.getElementById('formStep2College').style.display = 'block';
  }
  
  updateProgressIndicator(2);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Make globally available
window.goToStep2FromStep3 = goToStep2FromStep3;


// ============================================================
// FEE CARD GENERATION FUNCTIONS
// These create the dynamic fee input cards in Step 3
// ============================================================

/**
 * getClassList(classRange)
 * Returns an array of class names based on the selected range
 * 
 * @param {string} classRange - The value from the dropdown
 * @returns {Array} - Array of class name strings
 */
function getClassList(classRange) {
  // Based on what was selected, return the right list of classes
  switch (classRange) {
    case 'nursery-ukg':
      return ['Nursery', 'LKG', 'UKG'];
      
    case 'class1-5':
      return ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5'];
      
    case 'class1-10':
      return [
        'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5',
        'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'
      ];
      
    case 'class1-12':
      return [
        'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5',
        'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10',
        'Class 11', 'Class 12'
      ];
      
    default:
      return [];
  }
}

/**
 * generateSchoolFeeCards(classRange)
 * Creates a fee input card for EVERY class in the selected range
 * 
 * @param {string} classRange - e.g. 'class1-10'
 */
function generateSchoolFeeCards(classRange) {
  // Get the list of classes
  const classes = getClassList(classRange);
  
  // Get the container where we'll put all the cards
  const container = document.getElementById('feeCardsContainer');
  
  // Clear any previously generated cards
  container.innerHTML = '';
  
  // Add a title
  container.innerHTML = `
    <div class="fee-section-title">
      <i class="fas fa-table"></i>
      Fee Structure for ${classes.length} classes
    </div>
  `;
  
  // Loop through each class and create a card for it
  // forEach loops through every item in the array
  classes.forEach((className, index) => {
    
    // Create a unique ID for each set of inputs
    // We use the index to make unique IDs like: admission_0, admission_1, etc.
    const cardId = `class_${index}`;
    
    // Create a card HTML
    // Template literals (backticks) let us write multi-line HTML with variables
    const cardHTML = `
      <div class="fee-card" id="feeCard_${cardId}">
        
        <!-- Card Header with class name -->
        <div class="fee-card-header">
          <div class="fee-card-icon">
            <i class="fas fa-chalkboard"></i>
          </div>
          <div class="fee-card-title">${className}</div>
        </div>
        
        <!-- Fee Fields Grid -->
        <div class="fee-grid">
          
          <!-- Admission Fee -->
          <div class="fee-field">
            <label>Admission Fee (₹)</label>
            <input 
              type="number" 
              id="admission_${cardId}" 
              class="fee-input" 
              placeholder="0"
              oninput="calculateTotal('${cardId}')"
            />
          </div>
          
          <!-- Tuition Fee -->
          <div class="fee-field">
            <label>Tuition Fee (₹)</label>
            <input 
              type="number" 
              id="tuition_${cardId}" 
              class="fee-input" 
              placeholder="0"
              oninput="calculateTotal('${cardId}')"
            />
          </div>
          
          <!-- Exam Fee -->
          <div class="fee-field">
            <label>Exam Fee (₹)</label>
            <input 
              type="number" 
              id="exam_${cardId}" 
              class="fee-input" 
              placeholder="0"
              oninput="calculateTotal('${cardId}')"
            />
          </div>
          
          <!-- Transport Fee -->
          <div class="fee-field">
            <label>Transport Fee (₹)</label>
            <input 
              type="number" 
              id="transport_${cardId}" 
              class="fee-input" 
              placeholder="0"
              oninput="calculateTotal('${cardId}')"
            />
          </div>
          
          <!-- Hostel Fee -->
          <div class="fee-field">
            <label>Hostel Fee (₹)</label>
            <input 
              type="number" 
              id="hostel_${cardId}" 
              class="fee-input" 
              placeholder="0"
              oninput="calculateTotal('${cardId}')"
            />
          </div>
          
          <!-- Other Fee -->
          <div class="fee-field">
            <label>Other Fees (₹)</label>
            <input 
              type="number" 
              id="other_${cardId}" 
              class="fee-input" 
              placeholder="0"
              oninput="calculateTotal('${cardId}')"
            />
          </div>
          
          <!-- Total Fee (auto-calculated, shown in blue bar) -->
          <div class="fee-total-row">
            <span class="fee-total-label">Total Annual Fee</span>
            <span class="fee-total-value" id="total_${cardId}">₹ 0</span>
          </div>
          
        </div>
        <!-- END FEE GRID -->
        
      </div>
      <!-- END FEE CARD -->
    `;
    
    // Add the card HTML to the container
    container.innerHTML += cardHTML;
  });
}

// Make globally available
window.generateClassFeeCards = function() {
  const classes = document.getElementById('numberOfClasses').value;
  if (classes) generateSchoolFeeCards(classes);
};


/**
 * generateCollegeFeeCards(branches)
 * Creates a fee card for each selected branch
 * 
 * @param {Array} branches - Array of branch names like ['BCA', 'MCA']
 */
function generateCollegeFeeCards(branches) {
  const container = document.getElementById('feeCardsContainer');
  
  // Clear previous content
  container.innerHTML = '';
  
  // Add title
  container.innerHTML = `
    <div class="fee-section-title">
      <i class="fas fa-university"></i>
      Fee Structure for ${branches.length} branch(es)
    </div>
  `;
  
  // Create a card for each branch
  branches.forEach((branchName, index) => {
    const cardId = `branch_${index}`;
    
    const cardHTML = `
      <div class="fee-card" id="feeCard_${cardId}">
        
        <div class="fee-card-header">
          <div class="fee-card-icon">
            <i class="fas fa-book-open"></i>
          </div>
          <div class="fee-card-title">${branchName}</div>
        </div>
        
        <div class="fee-grid">
          
          <div class="fee-field">
            <label>Admission Fee (₹)</label>
            <input 
              type="number" 
              id="admission_${cardId}" 
              class="fee-input" 
              placeholder="0"
              oninput="calculateTotal('${cardId}')"
            />
          </div>
          
          <div class="fee-field">
            <label>Tuition Fee (₹)</label>
            <input 
              type="number" 
              id="tuition_${cardId}" 
              class="fee-input" 
              placeholder="0"
              oninput="calculateTotal('${cardId}')"
            />
          </div>
          
          <div class="fee-field">
            <label>Hostel Fee (₹)</label>
            <input 
              type="number" 
              id="hostel_${cardId}" 
              class="fee-input" 
              placeholder="0"
              oninput="calculateTotal('${cardId}')"
            />
          </div>
          
          <div class="fee-field">
            <label>Exam Fee (₹)</label>
            <input 
              type="number" 
              id="exam_${cardId}" 
              class="fee-input" 
              placeholder="0"
              oninput="calculateTotal('${cardId}')"
            />
          </div>
          
          <div class="fee-field">
            <label>Other Fees (₹)</label>
            <input 
              type="number" 
              id="other_${cardId}" 
              class="fee-input" 
              placeholder="0"
              oninput="calculateTotal('${cardId}')"
            />
          </div>
          
          <!-- Placeholder to maintain grid layout -->
          <div class="fee-field"></div>
          
          <div class="fee-total-row">
            <span class="fee-total-label">Total Annual Fee</span>
            <span class="fee-total-value" id="total_${cardId}">₹ 0</span>
          </div>
          
        </div>
      </div>
    `;
    
    container.innerHTML += cardHTML;
  });
}


// ============================================================
// AUTO-CALCULATE TOTAL FEE
// Called every time a fee input value changes
// ============================================================

/**
 * calculateTotal(cardId)
 * Adds up all fee fields and shows the total
 * 
 * @param {string} cardId - The unique ID of the fee card
 */
function calculateTotal(cardId) {
  // Get values from each fee input
  // parseFloat converts text to a number (0 if empty)
  const admission = parseFloat(document.getElementById(`admission_${cardId}`)?.value) || 0;
  const tuition = parseFloat(document.getElementById(`tuition_${cardId}`)?.value) || 0;
  const exam = parseFloat(document.getElementById(`exam_${cardId}`)?.value) || 0;
  const transport = parseFloat(document.getElementById(`transport_${cardId}`)?.value) || 0;
  const hostel = parseFloat(document.getElementById(`hostel_${cardId}`)?.value) || 0;
  const other = parseFloat(document.getElementById(`other_${cardId}`)?.value) || 0;
  
  // Add all fees together
  const total = admission + tuition + exam + transport + hostel + other;
  
  // Format with Indian number formatting (e.g., ₹1,20,000)
  const formattedTotal = '₹ ' + total.toLocaleString('en-IN');
  
  // Update the total display
  const totalElement = document.getElementById(`total_${cardId}`);
  if (totalElement) {
    totalElement.textContent = formattedTotal;
  }
}

// Make globally available
window.calculateTotal = calculateTotal;


// ============================================================
// SUBMIT REGISTRATION
// Saves all data to Firestore
// ============================================================

/**
 * submitRegistration()
 * This is the main function that:
 * 1. Collects all form data
 * 2. Saves institution to Firestore 'institutions' collection
 * 3. Saves each fee card to Firestore 'feeStructures' collection
 * 4. Shows success screen
 */
async function submitRegistration() {
  clearMessage('step3Msg');
  showLoading();
  
  try {
    
    // ---- COLLECT DATA BASED ON INSTITUTION TYPE ----
    
    const institutionName = document.getElementById('institutionName').value.trim();
    
    let institutionData = {}; // This will hold all the data we want to save
    let feeItems = [];         // This will hold each class/branch fee data
    
    if (currentInstitutionType === 'school') {
      
      // Collect school data
      institutionData = {
        institutionName: institutionName,
        type: 'school',
        boardType: document.getElementById('boardType').value,
        classRange: document.getElementById('numberOfClasses').value,
        registrationId: document.getElementById('schoolRegId').value.trim(),
        address: document.getElementById('schoolAddress').value.trim(),
        contactNumber: document.getElementById('schoolContact').value.trim(),
        email: document.getElementById('schoolEmail').value.trim(),
        verificationStatus: 'pending', // Admin will change this to 'verified'
        createdBy: currentUserId || 'anonymous',
        createdAt: serverTimestamp()
      };
      
      // Collect fee data for each class
      const classes = getClassList(document.getElementById('numberOfClasses').value);
      
      classes.forEach((className, index) => {
        const cardId = `class_${index}`;
        
        const admissionFee = parseFloat(document.getElementById(`admission_${cardId}`)?.value) || 0;
        const tuitionFee = parseFloat(document.getElementById(`tuition_${cardId}`)?.value) || 0;
        const examFee = parseFloat(document.getElementById(`exam_${cardId}`)?.value) || 0;
        const transportFee = parseFloat(document.getElementById(`transport_${cardId}`)?.value) || 0;
        const hostelFee = parseFloat(document.getElementById(`hostel_${cardId}`)?.value) || 0;
        const otherFee = parseFloat(document.getElementById(`other_${cardId}`)?.value) || 0;
        const totalFee = admissionFee + tuitionFee + examFee + transportFee + hostelFee + otherFee;
        
        // Push this class's fee data into the array
        feeItems.push({
          className: className,
          admissionFee: admissionFee,
          tuitionFee: tuitionFee,
          examFee: examFee,
          transportFee: transportFee,
          hostelFee: hostelFee,
          otherFee: otherFee,
          totalFee: totalFee
        });
      });
      
    } else if (currentInstitutionType === 'college') {
      
      // Collect college data
      const selectedBranches = Array.from(document.querySelectorAll('.branch-check:checked'))
                                     .map(cb => cb.value);
      
      institutionData = {
        institutionName: institutionName,
        type: 'college',
        collegeType: document.getElementById('collegeType').value,
        branches: selectedBranches,
        registrationId: document.getElementById('collegeRegId').value.trim(),
        address: document.getElementById('collegeAddress').value.trim(),
        contactNumber: document.getElementById('collegeContact').value.trim(),
        email: document.getElementById('collegeEmail').value.trim(),
        verificationStatus: 'pending',
        createdBy: currentUserId || 'anonymous',
        createdAt: serverTimestamp()
      };
      
      // Collect fee data for each branch
      selectedBranches.forEach((branchName, index) => {
        const cardId = `branch_${index}`;
        
        const admissionFee = parseFloat(document.getElementById(`admission_${cardId}`)?.value) || 0;
        const tuitionFee = parseFloat(document.getElementById(`tuition_${cardId}`)?.value) || 0;
        const hostelFee = parseFloat(document.getElementById(`hostel_${cardId}`)?.value) || 0;
        const examFee = parseFloat(document.getElementById(`exam_${cardId}`)?.value) || 0;
        const otherFee = parseFloat(document.getElementById(`other_${cardId}`)?.value) || 0;
        const totalFee = admissionFee + tuitionFee + hostelFee + examFee + otherFee;
        
        feeItems.push({
          branchName: branchName,
          admissionFee: admissionFee,
          tuitionFee: tuitionFee,
          hostelFee: hostelFee,
          examFee: examFee,
          otherFee: otherFee,
          totalFee: totalFee
        });
      });
    }
    
    // ---- STEP 1: SAVE INSTITUTION TO FIRESTORE ----
    // addDoc automatically creates a new document with a unique ID
    // collection(db, 'institutions') → refers to the 'institutions' collection
    const institutionRef = await addDoc(collection(db, 'institutions'), institutionData);
    
    // The new document's ID
    savedInstitutionId = institutionRef.id;
    console.log('Institution saved with ID:', savedInstitutionId);
    
    // ---- STEP 2: SAVE EACH FEE ITEM TO FIRESTORE ----
    // We save each class/branch as a separate document in 'feeStructures'
    for (const feeItem of feeItems) {
      await addDoc(collection(db, 'feeStructures'), {
        institutionId: savedInstitutionId,  // Links back to the institution
        institutionName: institutionName,
        institutionType: currentInstitutionType,
        ...feeItem,  // Spread all fee fields (admission, tuition, etc.)
        createdAt: serverTimestamp()
      });
    }
    
    console.log('All fee structures saved successfully!');
    
    // ---- STEP 3: SHOW SUCCESS SCREEN ----
    hideLoading();
    
    // Show institution name in success screen
    document.getElementById('successDetails').innerHTML = `
      <i class="fas fa-check-circle" style="color:#4CAF50; margin-right:8px;"></i>
      <strong>${institutionName}</strong> has been registered successfully!
    `;
    
    // Show the success screen
    hideAllSteps();
    document.getElementById('successScreen').style.display = 'block';
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
  } catch (error) {
    hideLoading();
    console.error('Error saving registration:', error);
    showMessage('step3Msg', '❌ Error: ' + error.message + '. Please try again.', 'error');
  }
}

// Make globally available
window.submitRegistration = submitRegistration;


// ============================================================
// RESET FORM (Register Another Institution)
// ============================================================

/**
 * resetForm()
 * Resets everything and starts from Step 1
 */
function resetForm() {
  // Reset all dropdowns and inputs
  document.getElementById('institutionName').value = '';
  document.getElementById('institutionType').value = '';
  document.getElementById('feeCardsContainer').innerHTML = '';
  
  currentInstitutionType = '';
  savedInstitutionId = '';
  
  // Go back to step 1
  goToStep1();
}

// Make globally available
window.resetForm = resetForm;