// ============================
// firebase.js — FINAL VERSION
// ============================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-app.js";

// Auth
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-auth.js";

// Firestore
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js";

// Storage
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-storage.js";

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyDEzLQRjRCn60WsUsY-aEFBKZ4Vy1iJceA",
  authDomain: "smartinvoicesapp-ebb2c.firebaseapp.com",
  projectId: "smartinvoicesapp-ebb2c",
  storageBucket: "smartinvoicesapp-ebb2c.appspot.com",
  messagingSenderId: "665203531882",
  appId: "1:665203531882:web:e793ac17dc0f5b5d92aa13"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Firebase services to use them everywhere
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
