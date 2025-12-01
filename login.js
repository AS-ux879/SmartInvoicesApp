// =======================
//  login.js (مع Firebase Auth)
// =======================

// 1. استيراد الخدمات المطلوبة
import { auth } from "./firebase.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-auth.js";


document.addEventListener("DOMContentLoaded", () => {
    // 2. منطق الترجمة (i18n)
    const i18n = {
        ar: {
            title: "🔐 تسجيل الدخول",
            email: "البريد الإلكتروني:",
            password: "كلمة المرور:",
            login: "دخول",
            noAccount: "ليس لديك حساب؟",
            register: "تسجيل جديد",
            langBtn: "🌐 English",
            success: "تم تسجيل الدخول بنجاح! جاري التوجيه...",
            errorInvalid: "البريد الإلكتروني أو كلمة المرور غير صحيحين.",
            errorOther: "حدث خطأ أثناء تسجيل الدخول. حاول مجدداً."
        },
        en: {
            title: "🔐 Login",
            email: "Email:",
            password: "Password:",
            login: "Login",
            noAccount: "Don't have an account?",
            register: "Register",
            langBtn: "🌐 العربية",
            success: "Login successful! Redirecting...",
            errorInvalid: "Invalid email or password.",
            errorOther: "An error occurred during login. Please try again."
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

    // تطبيق اللغة عند التحميل
    setLang(currentLang);

    // 🌐 تبديل اللغة
    document.getElementById("langBtn").addEventListener("click", () => {
        currentLang = currentLang === "ar" ? "en" : "ar";
        setLang(currentLang);
    });

    // 3. منطق تسجيل الدخول باستخدام Firebase Auth
    const form = document.getElementById("loginForm");
    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;
        
        try {
            // استخدام دالة Firebase لتسجيل الدخول
            await signInWithEmailAndPassword(auth, email, password);
            
            // نجاح تسجيل الدخول
            alert(i18n[currentLang].success);
            window.location.href = "dashboard.html";
            
        } catch (error) {
            let errorMessage = i18n[currentLang].errorOther;
            
            // معالجة أخطاء Firebase الشائعة
            if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                errorMessage = i18n[currentLang].errorInvalid;
            }
            
            alert(errorMessage);
            console.error("Firebase Login Error:", error.message);
        }
    });
});
