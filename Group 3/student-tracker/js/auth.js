/**
 * ========================================
 * Authentication Logic
 * ========================================
 * Handles the Login and Signup processes on index.html.
 */

import { auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, updateProfile } from './firebase.js';
import { seedInitialUserData } from './data.js';

document.addEventListener('DOMContentLoaded', () => {
    // ----------------------------------------------------------------------
    // 1. Check Authentication State (Session Persistence)
    // ----------------------------------------------------------------------
    // onAuthStateChanged is an observer that fires whenever the user logs in, 
    // logs out, or when the page refreshes and Firebase checks its stored session.
    // If we are on the login page and the user is already logged in, redirect them!
    if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/') {
        onAuthStateChanged(auth, (user) => {
            if (user) {
                // User is signed in, redirect to the dashboard
                window.location.href = 'dashboard.html';
            }
        });
    }

    // Grab DOM elements we need to manipulate
    const authForm = document.getElementById('auth-form');
    if (!authForm) return; // Exit if we aren't on the auth page

    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const errorDiv = document.getElementById('auth-error');
    const submitBtn = document.getElementById('submit-btn');
    const toggleModeBtn = document.getElementById('toggle-mode');
    const headerTitle = document.querySelector('.auth-header h2');
    const headerDesc = document.querySelector('.auth-header p');

    // State variable to track whether we are showing the Login or Signup form
    let isLoginMode = true;

    // ----------------------------------------------------------------------
    // 2. Toggle Login/Signup Mode
    // ----------------------------------------------------------------------
    // Since we use the same HTML form for both logging in and signing up,
    // this function just changes the text and intent when the user clicks the toggle button.
    toggleModeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        isLoginMode = !isLoginMode; // Flip the state
        
        if (isLoginMode) {
            headerTitle.textContent = 'Welcome Back';
            headerDesc.textContent = 'Log in to track your learning progress.';
            submitBtn.textContent = 'Sign In';
            toggleModeBtn.textContent = 'Sign Up';
            toggleModeBtn.parentElement.firstChild.textContent = "Don't have an account? ";
        } else {
            headerTitle.textContent = 'Create Account';
            headerDesc.textContent = 'Sign up to start tracking your progress.';
            submitBtn.textContent = 'Sign Up';
            toggleModeBtn.textContent = 'Sign In';
            toggleModeBtn.parentElement.firstChild.textContent = "Already have an account? ";
        }
        // Clear any lingering errors when switching modes
        errorDiv.textContent = ''; 
    });

    // ----------------------------------------------------------------------
    // 3. Handle Form Submission
    // ----------------------------------------------------------------------
    authForm.addEventListener('submit', async (e) => {
        e.preventDefault(); // Prevent the browser from refreshing the page on submit
        
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();
        
        // Reset UI state
        errorDiv.textContent = '';
        submitBtn.disabled = true;
        submitBtn.textContent = 'Please wait...';

        try {
            if (isLoginMode) {
                // Attempt to log the user in
                await signInWithEmailAndPassword(auth, email, password);
                
                // If successful, onAuthStateChanged (above) will catch the state 
                // change and handle the redirect automatically.
            } else {
                // Attempt to create a new user account
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;
                
                // Update the user's profile with a generated display name (the part before the @ in the email)
                const name = email.split('@')[0];
                await updateProfile(user, { displayName: name });
                
                // --- SEED DUMMY DATA ---
                // Since this is a new user, we'll populate their database with some dummy courses 
                // and charts so the dashboard isn't completely empty when they first log in.
                await seedInitialUserData(user.uid);
                
                // Again, onAuthStateChanged will handle the redirect.
            }
        } catch (error) {
            // ----------------------------------------------------------------------
            // 4. Specific Error Handling
            // ----------------------------------------------------------------------
            // Translating ugly Firebase error codes into user-friendly messages.
            let message = 'An error occurred. Please try again.';
            
            if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
                message = 'Invalid email or password.'; // Catch-all for login failures for security
            } else if (error.code === 'auth/email-already-in-use') {
                message = 'An account with this email already exists.';
            } else if (error.code === 'auth/weak-password') {
                message = 'Password should be at least 6 characters.';
            } else if (error.code === 'auth/network-request-failed') {
                message = 'Network error. Please check your internet connection.';
            }
            
            // Display the error and re-enable the button
            errorDiv.textContent = message;
            submitBtn.disabled = false;
            submitBtn.textContent = isLoginMode ? 'Sign In' : 'Sign Up';
        }
    });
});
