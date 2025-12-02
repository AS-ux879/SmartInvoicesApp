// ============================
// firebase.js — Cloud Storage
// ============================

// استيراد مكتبات Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-app.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-storage.js";

// إعدادات Firebase الخاصة بمشروعك
const firebaseConfig = {
  apiKey: "AIzaSyDEzLQRjRCn60WsUsY-aEFBKZ4Vy1iJceA",
  authDomain: "smartinvoicesapp-ebb2c.firebaseapp.com",
  projectId: "smartinvoicesapp-ebb2c",
  storageBucket: "smartinvoicesapp-ebb2c.firebasestorage.app",
  messagingSenderId: "665203531882",
  appId: "1:665203531882:web:e793ac17dc0f5b5d92aa13",
  measurementId: "G-YCB6R5HR28"
};

// تشغيل Firebase
const app = initializeApp(firebaseConfig);

// التخزين السحابي Firebase Storage
export const storage = getStorage(app);
