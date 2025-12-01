// =======================
//  register.js (النسخة النهائية مع Auth + Firestore)
// =======================

// [تصحيح]: استيراد مثيلات auth و db من ملف الإعدادات الموحد firebase.js
import { auth, db } from "./firebase.js"; 

// استيراد دوال Firebase Module من CDN
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
      success: "تم التسجيل بنجاح! يرجى تسجيل الدخول.", // تعديل بسيط على رسالة النجاح
      fail: "فشل التسجيل. يرجى التأكد من كلمة المرور أو أن البريد غير مستخدم بالفعل." // رسالة خطأ موحدة
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
      success: "Registration successful! Please log in.",
      fail: "Registration failed. Check your password or ensure the email is not already in use."
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
      // 1. إنشاء الحساب في Firebase Auth
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCred.user;

      // 2. [إضافة هامة]: حفظ الاسم والـ UID في Local Storage (ليعمل dashboard.js بشكل فوري)
      localStorage.setItem("user", JSON.stringify({
          name: fullName,
          email: email,
          uid: user.uid
      }));

      // 3. حفظ بيانات المستخدم في Firestore
      await setDoc(doc(db, "users", user.uid), {
        name: fullName,
        email: email,
        createdAt: new Date()
      });

      alert(i18n[currentLang].success);
      window.location.href = "login.html";

    } catch (error) {
      console.error("Firebase Registration Error:", error);
      
      // رسالة خطأ مخصصة حسب نوع الخطأ
      let errorMessage = i18n[currentLang].fail;
      if (error.code === 'auth/email-already-in-use') {
          errorMessage = currentLang === "ar" ? "هذا البريد الإلكتروني مستخدم بالفعل." : "This email address is already in use.";
      } else if (error.code === 'auth/weak-password') {
          errorMessage = currentLang === "ar" ? "كلمة المرور ضعيفة (6 أحرف على الأقل)." : "Password should be at least 6 characters.";
      }
      alert(errorMessage);
    }
  });
});
