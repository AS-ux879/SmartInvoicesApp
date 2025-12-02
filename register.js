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
      langBtn: "🌐 English"
    },
    en: {
      title: "📝 New User Registration",
      name: "Full Name:",
      email: "Email:",
      password: "Password:",
      register: "Register",
      haveAccount: "Already have an account?",
      login: "Login",
      langBtn: "🌐 العربية"
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

  const form = document.getElementById("registerForm");
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const user = {
      name: document.getElementById("name").value,
      email: document.getElementById("email").value,
      password: document.getElementById("password").value
    };

    localStorage.setItem("user", JSON.stringify(user));
    alert(currentLang === "ar" ? "تم التسجيل بنجاح!" : "Registration successful!");
    window.location.href = "login.html";
  });
});
