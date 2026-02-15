// =========================
// 🔹 Firebase Authentication Setup
// =========================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
  getAuth, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  updateProfile,
  signInAnonymously
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { 
  getFirestore, 
  doc, 
  setDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA_z4sfdgMGXjrKaGkUN4312Gw6gV10DKk",
  authDomain: "campus-pulse-6934d.firebaseapp.com",
  projectId: "campus-pulse-6934d",
  storageBucket: "campus-pulse-6934d.firebasestorage.app",
  messagingSenderId: "31365095682",
  appId: "1:31365095682:web:a0a7dbd07282860cc8e21b",
  measurementId: "G-GB03XWJEST"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

console.log("✅ Firebase Auth initialized");

// =========================
// 🎨 Tab Navigation
// =========================

window.showTab = function(tabName) {
  // Hide all forms
  document.querySelectorAll('.auth-form').forEach(form => {
    form.classList.remove('active');
    form.style.display = 'none';
  });

  // Remove active class from all tabs
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('active');
  });

  // Show selected form
  const selectedForm = document.getElementById(tabName + 'Tab');
  if (selectedForm) {
    selectedForm.style.display = 'block';
    selectedForm.classList.add('active');
  }

  // Activate corresponding tab button
  const tabMap = {
    'login': 0,
    'signup': 1,
    'guest': 2,
    'reset': 0 // Reset shows under login tab
  };
  
  if (tabMap[tabName] !== undefined) {
    document.querySelectorAll('.tab-btn')[tabMap[tabName]].classList.add('active');
  }

  // Clear all messages
  clearMessages();
}

// =========================
// 🔐 Login Function
// =========================

window.loginUser = async function() {
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const msgElement = document.getElementById('loginMsg');

  // Validation
  if (!email || !password) {
    showMessage(msgElement, '❌ Please fill in all fields', 'error');
    return;
  }

  showMessage(msgElement, '⏳ Logging in...', 'loading');

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Get user role from Firestore
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    const userData = userDoc.data();

    showMessage(msgElement, '✅ Login successful! Redirecting...', 'success');

    // Store user info in localStorage
    localStorage.setItem('userRole', userData?.role || 'student');
    localStorage.setItem('userName', userData?.name || user.email);
    localStorage.setItem('userEmail', user.email);

    // Redirect based on role
    setTimeout(() => {
      showRoleSelection();
    }, 1000);

  } catch (error) {
    console.error('Login error:', error);
    let errorMessage = 'Login failed. ';
    
    switch(error.code) {
      case 'auth/user-not-found':
        errorMessage += 'No account found with this email.';
        break;
      case 'auth/wrong-password':
        errorMessage += 'Incorrect password.';
        break;
      case 'auth/invalid-email':
        errorMessage += 'Invalid email format.';
        break;
      case 'auth/too-many-requests':
        errorMessage += 'Too many failed attempts. Try again later.';
        break;
      default:
        errorMessage += error.message;
    }
    
    showMessage(msgElement, '❌ ' + errorMessage, 'error');
  }
}

// =========================
// 📝 Signup Function
// =========================

window.signupUser = async function() {
  const name = document.getElementById('signupName').value.trim();
  const email = document.getElementById('signupEmail').value.trim();
  const password = document.getElementById('signupPassword').value;
  const confirmPassword = document.getElementById('signupPasswordConfirm').value;
  const role = document.getElementById('userRole').value;
  const msgElement = document.getElementById('signupMsg');

  // Validation
  if (!name || !email || !password || !confirmPassword) {
    showMessage(msgElement, '❌ Please fill in all fields', 'error');
    return;
  }

  if (password !== confirmPassword) {
    showMessage(msgElement, '❌ Passwords do not match', 'error');
    return;
  }

  if (password.length < 6) {
    showMessage(msgElement, '❌ Password must be at least 6 characters', 'error');
    return;
  }

  showMessage(msgElement, '⏳ Creating account...', 'loading');

  try {
    // Create user account
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update profile with name
    await updateProfile(user, {
      displayName: name
    });

    // Save user data to Firestore
    await setDoc(doc(db, 'users', user.uid), {
      name: name,
      email: email,
      role: role,
      createdAt: new Date(),
      isActive: true
    });

    showMessage(msgElement, '✅ Account created! Redirecting...', 'success');

    // Store user info
    localStorage.setItem('userRole', role);
    localStorage.setItem('userName', name);
    localStorage.setItem('userEmail', email);

    // Redirect to role selection
    setTimeout(() => {
      showRoleSelection();
    }, 1500);

  } catch (error) {
    console.error('Signup error:', error);
    let errorMessage = 'Signup failed. ';
    
    switch(error.code) {
      case 'auth/email-already-in-use':
        errorMessage += 'This email is already registered.';
        break;
      case 'auth/invalid-email':
        errorMessage += 'Invalid email format.';
        break;
      case 'auth/weak-password':
        errorMessage += 'Password is too weak.';
        break;
      default:
        errorMessage += error.message;
    }
    
    showMessage(msgElement, '❌ ' + errorMessage, 'error');
  }
}

// =========================
// 👤 Guest Access
// =========================

window.continueAsGuest = async function() {
  const msgElement = document.getElementById('guestMsg');
  
  showMessage(msgElement, '⏳ Setting up guest access...', 'loading');

  try {
    // Sign in anonymously
    await signInAnonymously(auth);
    
    // Store guest info
    localStorage.setItem('userRole', 'guest');
    localStorage.setItem('userName', 'Guest User');
    localStorage.setItem('userEmail', 'guest@shuttlepulse.com');

    showMessage(msgElement, '✅ Guest access granted! Redirecting...', 'success');

    // Redirect to student dashboard (read-only)
    setTimeout(() => {
      window.location.href = 'student.html';
    }, 1000);

  } catch (error) {
    console.error('Guest access error:', error);
    showMessage(msgElement, '❌ Guest access failed: ' + error.message, 'error');
  }
}

// =========================
// 🔄 Password Reset
// =========================

window.resetPassword = async function() {
  const email = document.getElementById('resetEmail').value.trim();
  const msgElement = document.getElementById('resetMsg');

  if (!email) {
    showMessage(msgElement, '❌ Please enter your email', 'error');
    return;
  }

  showMessage(msgElement, '⏳ Sending reset link...', 'loading');

  try {
    await sendPasswordResetEmail(auth, email);
    showMessage(msgElement, '✅ Password reset email sent! Check your inbox.', 'success');
    
    // Clear input
    document.getElementById('resetEmail').value = '';

  } catch (error) {
    console.error('Password reset error:', error);
    let errorMessage = 'Reset failed. ';
    
    switch(error.code) {
      case 'auth/user-not-found':
        errorMessage += 'No account found with this email.';
        break;
      case 'auth/invalid-email':
        errorMessage += 'Invalid email format.';
        break;
      default:
        errorMessage += error.message;
    }
    
    showMessage(msgElement, '❌ ' + errorMessage, 'error');
  }
}

// =========================
// 🚪 Logout Function
// =========================

window.logoutUser = async function() {
  try {
    await signOut(auth);
    
    // Clear localStorage
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');

    // Show login form
    showTab('login');
    
    // Hide role selection
    document.getElementById('roleSelection').style.display = 'none';
    document.querySelectorAll('.auth-form')[0].style.display = 'block';

    alert('✅ Logged out successfully!');

  } catch (error) {
    console.error('Logout error:', error);
    alert('❌ Logout failed: ' + error.message);
  }
}

// =========================
// 📋 Role Selection Display
// =========================

function showRoleSelection() {
  // Hide all auth forms
  document.querySelectorAll('.auth-form').forEach(form => {
    form.style.display = 'none';
  });

  // Hide tabs
  document.querySelector('.tab-container').style.display = 'none';

  // Show role selection
  document.getElementById('roleSelection').style.display = 'block';
}

// =========================
// 💬 Message Helper Functions
// =========================

function showMessage(element, message, type) {
  if (!element) return;

  element.innerHTML = `<p class="msg-${type}">${message}</p>`;
  element.style.display = 'block';
}

function clearMessages() {
  document.querySelectorAll('.auth-message').forEach(msg => {
    msg.innerHTML = '';
    msg.style.display = 'none';
  });
}

// =========================
// 🔍 Auth State Listener
// =========================

onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log('✅ User logged in:', user.email);
    
    // If already logged in, show role selection
    if (window.location.pathname.includes('login.html')) {
      const userName = localStorage.getItem('userName') || user.email;
      console.log('Welcome back, ' + userName);
    }
  } else {
    console.log('❌ No user logged in');
  }
});

// =========================
// 🎬 Initialize
// =========================

document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Auth page initialized');
  
  // Show login tab by default
  showTab('login');

  // Check if user is already logged in
  if (auth.currentUser) {
    showRoleSelection();
  }
});

console.log("✅ Auth system loaded");