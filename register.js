// =======================
//  register.js (مع Firebase Auth)
// =======================

// 1. استيراد الخدمات المطلوبة
import { auth } from "./firebase.js";
import { createUserWithEmailAndPassword, updateProfile } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-auth.js";


document.addEventListener("DOMContentLoaded", () => {
    // 2. منطق الترجمة (i18n)
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
            success: "تم التسجيل بنجاح! جاري التوجيه لتسجيل الدخول.",
            errorWeakPass: "كلمة المرور يجب أن تتكون من 6 أحرف أو أكثر.",
            errorEmailUsed: "البريد الإلكتروني مُستخدم بالفعل.",
            errorOther: "حدث خطأ أثناء التسجيل. حاول مجدداً."
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
            success: "Registration successful! Redirecting to login.",
            errorWeakPass: "Password should be at least 6 characters.",
            errorEmailUsed: "The email address is already in use.",
            errorOther: "An error occurred during registration. Please try again."
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

    // تطبيق اللغة عند التحميل
    setLang(currentLang);

    // 🌐 تبديل اللغة
    document.getElementById("langBtn").addEventListener("click", () => {
        currentLang = currentLang === "ar" ? "en" : "ar";
        setLang(currentLang);
    });

    // 3. منطق تسجيل المستخدم باستخدام Firebase Auth
    const form = document.getElementById("registerForm");
    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const name = document.getElementById("name").value;
        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;
        
        try {
            // إنشاء المستخدم في Firebase
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // تحديث اسم المستخدم (Display Name)
            await updateProfile(user, { displayName: name });
            
            // نجاح التسجيل
            alert(i18n[currentLang].success);
            window.location.href = "login.html";
            
        } catch (error) {
            let errorMessage = i18n[currentLang].errorOther;
            
            // معالجة أخطاء Firebase الشائعة
            if (error.code === 'auth/weak-password') {
                errorMessage = i18n[currentLang].errorWeakPass;
            } else if (error.code === 'auth/email-already-in-use') {
                errorMessage = i18n[currentLang].errorEmailUsed;
            }
            
            alert(errorMessage);
            console.error("Firebase Registration Error:", error.message);
        }
    });
});
