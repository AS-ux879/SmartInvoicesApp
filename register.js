// register.js (بعد التعديل الكامل للعمل مع Firebase)

import { auth, db } from "./firebase-config.js";
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
  const i18n = {
    ar: {
      title: "📝 تسجيل مستخدم جديد",
      name: "الاسم الكامل:",
      email: "البريد الإلكتروني:",
      password: "كلمة المرور:",
      register: "تسجيل",
      haveAccount: "لديك حساب؟",
      login: "تسجيل الدخول",
      langBtn: "🌐 English",
      success: "تم التسجيل بنجاح!",
      fail: "حدث خطأ أثناء التسجيل:"
    },
    en: {
      title: "📝 New User Registration",
      name: "Full Name:",
      email: "Email:",
      password: "Password:",
      register: "Register",
      haveAccount: "Already have an account?",
      login: "Login",
      langBtn: "🌐 العربية",
      success: "Registration successful!",
      fail: "Registration error:"
    }
  };

  let currentLang = localStorage.getItem("lang") || "ar";

  function setLang(lang) {
    const t = i18n[lang];

    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";

    document.getElementById("title").textContent = t.title;
    document.getElementById("labelName").textContent = t.name;
    document.getElementById("labelEmail").textContent = t.email;
    document.getElementById("labelPassword").textContent = t.password;
    document.getElementById("registerBtn").textContent = t.register;
    document.getElementById("haveAccount").firstChild.textContent = t.haveAccount + " ";
    document.getElementById("loginLink").textContent = t.login;
    document.getElementById("langBtn").textContent = t.langBtn;

    localStorage.setItem("lang", lang);
  }

  document.getElementById("langBtn").addEventListener("click", () => {
    currentLang = currentLang === "ar" ? "en" : "ar";
    setLang(currentLang);
  });

  setLang(currentLang);

  // 🔥 تسجيل مستخدم جديد في Firebase Auth + تخزين بياناته في Firestore
  const form = document.getElementById("registerForm");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const fullName = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    try {
      // إنشاء الحساب في Firebase Auth
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCred.user;

      // حفظ بيانات المستخدم في Firestore
      await setDoc(doc(db, "users", user.uid), {
        name: fullName,
        email: email,
        createdAt: new Date()
      });

      alert(i18n[currentLang].success);
      window.location.href = "login.html";

    } catch (error) {
      alert(i18n[currentLang].fail + "\n" + error.message);
    }
  });
});
