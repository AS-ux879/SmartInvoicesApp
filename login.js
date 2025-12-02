// ============================
// login.js — Firebase Auth Login
// ============================

import { auth } from "./firebase.js";
import { 
  signInWithEmailAndPassword 
} from "https://www.gstatic.com/firebasejs/10.12.3/firebase-auth.js";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    try {
      await signInWithEmailAndPassword(auth, email, password);
      alert("تم تسجيل الدخول بنجاح!");
      window.location.href = "dashboard.html";
    } 
    catch (error) {
      alert("خطأ في تسجيل الدخول: " + error.message);
    }
  });
});
