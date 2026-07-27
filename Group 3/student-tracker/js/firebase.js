/**
 * ========================================
 * Firebase Initialization & Export Module
 * ========================================
 * Centralized Firebase connection exporting Auth and Firestore helpers.
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";

import { 
    getAuth, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    onAuthStateChanged, 
    signOut, 
    updateProfile 
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

import { 
    getFirestore, 
    collection, 
    doc, 
    setDoc, 
    getDocs, 
    query, 
    where, 
    getDoc,
    updateDoc,
    deleteDoc
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBX6DGKCsH6I5RbmOhK7oR8neApkGGraAE",
    authDomain: "new-app-f4ba1.firebaseapp.com",
    projectId: "new-app-f4ba1",
    storageBucket: "new-app-f4ba1.firebasestorage.app",
    messagingSenderId: "379707222319",
    appId: "1:379707222319:web:743b7201ecde0288a019da"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { 
    app, 
    auth, 
    db, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    onAuthStateChanged, 
    signOut,
    updateProfile,
    collection, 
    doc, 
    setDoc, 
    getDocs, 
    query, 
    where,
    getDoc,
    updateDoc,
    deleteDoc
};
