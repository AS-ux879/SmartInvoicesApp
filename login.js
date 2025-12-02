document.addEventListener("DOMContentLoaded", () => {
  const i18n = {
    ar: {
      title: "🔐 تسجيل الدخول",
      email: "البريد الإلكتروني:",
      password: "كلمة المرور:",
      login: "دخول",
      noAccount: "ليس لديك حساب؟",
      register: "تسجيل جديد",
      langBtn: "🌐 English"
    },
    en: {
      title: "🔐 Login",
      email: "Email:",
      password: "Password:",
      login: "Login",
      noAccount: "Don't have an account?",
      register: "Register",
      langBtn: "🌐 العربية"
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

  const form = document.getElementById("loginForm");
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const storedUser = JSON.parse(localStorage.getItem("user"));

    if (storedUser && storedUser.email === email && storedUser.password === password) {
      alert(currentLang === "ar" ? "تم تسجيل الدخول بنجاح!" : "Login successful!");
      window.location.href = "dashboard.html";
    } else {
      alert(currentLang === "ar" ? "بيانات الدخول غير صحيحة!" : "Incorrect credentials!");
    }
  });
});
