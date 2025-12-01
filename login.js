// =======================
//  login.js (Firebase Auth + Local i18n)
// =======================

// [تعديل مطلوب]: استيراد مثيل Firebase Auth من ملف firebase.js
import { auth } from "./firebase.js";

// [تعديل مطلوب]: استيراد دالة تسجيل الدخول من CDN
import {
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";


document.addEventListener("DOMContentLoaded", () => {
  const i18n = {
    ar: {
      title: "🔐 تسجيل الدخول",
      email: "البريد الإلكتروني:",
      password: "كلمة المرور:",
      login: "دخول",
      noAccount: "ليس لديك حساب؟",
      register: "تسجيل جديد",
      langBtn: "🌐 English",
      success: "تم تسجيل الدخول بنجاح!",
      fail: "بيانات الدخول غير صحيحة!"
    },
    en: {
      title: "🔐 Login",
      email: "Email:",
      password: "Password:",
      login: "Login",
      noAccount: "Don't have an account?",
      register: "Register",
      langBtn: "🌐 العربية",
      success: "Login successful!",
      fail: "Incorrect credentials!"
    }
  };

  let currentLang = localStorage.getItem("lang") || "ar";

  function setLang(lang) {
    const t = i18n[lang];
    localStorage.setItem("lang", lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";

    // التأكد من وجود جميع العناصر في login.html
    const titleElement = document.getElementById("title");
    if (titleElement) titleElement.textContent = t.title;

    const labelEmailElement = document.getElementById("labelEmail");
    if (labelEmailElement) labelEmailElement.textContent = t.email;

    const labelPasswordElement = document.getElementById("labelPassword");
    if (labelPasswordElement) labelPasswordElement.textContent = t.password;

    const loginBtnElement = document.getElementById("loginBtn");
    if (loginBtnElement) loginBtnElement.textContent = t.login;

    const noAccountElement = document.getElementById("noAccount");
    if (noAccountElement) noAccountElement.firstChild.textContent = t.noAccount + " ";
    
    const registerLinkElement = document.getElementById("registerLink");
    if (registerLinkElement) registerLinkElement.textContent = t.register;

    const langBtnElement = document.getElementById("langBtn");
    if (langBtnElement) langBtnElement.textContent = t.langBtn;
  }

  document.getElementById("langBtn").addEventListener("click", () => {
    currentLang = currentLang === "ar" ? "en" : "ar";
    setLang(currentLang);
  });

  setLang(currentLang);

  const form = document.getElementById("loginForm");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // [ملاحظة]: تم تغيير IDs حقول الإدخال إلى 'email' و 'password' في التعديلات السابقة.
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);

      // [إضافة مطلوبة وهامة]: حفظ بيانات المستخدم (UID) ليعمل dashboard.js
      const storedUser = JSON.parse(localStorage.getItem("user")) || {};
        
      localStorage.setItem("user", JSON.stringify({ 
          // نحتفظ بالاسم المخزن من صفحة التسجيل، أو نستخدم جزء الإيميل كاسم افتراضي
          name: storedUser.name || email.split('@')[0], 
          email: userCredential.user.email, 
          uid: userCredential.user.uid 
      }));
      // ----------------------------------------------------

      alert(i18n[currentLang].success);
      window.location.href = "dashboard.html";

    } catch (error) {
      console.error("Firebase Login Error:", error);
      // عرض رسالة الخطأ المترجمة فقط
      alert(i18n[currentLang].fail); 
    }
  });
});
