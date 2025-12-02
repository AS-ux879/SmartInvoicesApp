// ============================
// register.js — Firebase Auth Register
// ============================

import { auth, db } from "./firebase.js";
import { 
  createUserWithEmailAndPassword,
  updateProfile 
} from "https://www.gstatic.com/firebasejs/10.12.3/firebase-auth.js";
import { 
  doc, 
  setDoc 
} from "https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("registerForm");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    try {
      // إنشاء حساب
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // حفظ الاسم على حساب Firebase
      await updateProfile(user, { displayName: name });

      // إنشاء مستند للمستخدم في Firestore
      await setDoc(doc(db, "users", user.uid), {
        name,
        email,
        createdAt: new Date()
      });

      alert("تم التسجيل بنجاح!");
      window.location.href = "login.html";

    } catch (error) {
      alert("حدث خطأ: " + error.message);
    }
  });
});
