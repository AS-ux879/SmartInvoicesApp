// =======================
//  firebase.js (التحديث النهائي لمعرف المشروع)
// =======================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-storage.js";

const firebaseConfig = {
    // [تم التحديث بناءً على معرف المشروع الجديد]
  apiKey: "AIzaSyBAWj23fIad9ec9T1fbT0XkpVLxnK9f2wg", 
  authDomain: "smartinvoicesapp-ebb2c.firebaseapp.com", // استخدام الـ Project ID الجديد
  projectId: "smartinvoicesapp-ebb2c", // الـ Project ID الجديد
  storageBucket: "smartinvoicesapp-ebb2c.appspot.com", // استخدام الـ Project ID الجديد
  messagingSenderId: "665203531882", // استخدام الـ Project Number الجديد
  appId: "1:665203531882:web:5e4414db92c5ad17afd8d7", // يجب تحديث هذا بناءً على الـ App ID الفعلي لـ Web App
    // Note: If you have a different App ID for the web app, please replace this value.
  measurementId: "G-T1H667FSH3" // يتم تركه كما هو ما لم يكن لديك قياس جديد
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
