import { auth, signInWithEmailAndPassword } from "./firebase-config.js";

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
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";

    document.getElementById("title").textContent = t.title;
    document.getElementById("labelEmail").textContent = t.email;
    document.getElementById("labelPassword").textContent = t.password;
    document.getElementById("loginBtn").textContent = t.login;
    document.getElementById("noAccount").firstChild.textContent = t.noAccount + " ";
    document.getElementById("registerLink").textContent = t.register;
    document.getElementById("langBtn").textContent = t.langBtn;

    localStorage.setItem("lang", lang);
  }

  document.getElementById("langBtn").addEventListener("click", () => {
    currentLang = currentLang === "ar" ? "en" : "ar";
    setLang(currentLang);
  });

  setLang(currentLang);

  // 🔥 تسجيل الدخول باستخدام Firebase (modular)
  const form = document.getElementById("loginForm");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    try {
      await signInWithEmailAndPassword(auth, email, password);

      alert(i18n[currentLang].success);
      window.location.href = "dashboard.html";

    } catch (error) {
      alert(i18n[currentLang].fail + "\n" + error.message);
    }
  });
});
