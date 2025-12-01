// =======================
//  auth.js (Firebase Authentication)
// =======================

// [تعديل مطلوب]: استيراد دوال Firebase Auth
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// تهيئة الخدمة (يفترض أن `app` معرفة في `index.html` أو `register.html` ضمن سكربت التكوين)
// سنعتمد على أن `getAuth()` ستحصل على المثيل المهيأ من Firebase.
const auth = getAuth();

document.addEventListener("DOMContentLoaded", () => {
  const regForm = document.getElementById("registerForm");
  const loginForm = document.getElementById("loginForm");

  // =======================
  // التسجيل (Register)
  // [تعديل مطلوب]: استخدام createUserWithEmailAndPassword
  // =======================
  if (regForm) {
    regForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = document.getElementById("name").value; // [تعديل]: تم تغيير `regName` إلى `name` كما في register.html
      const email = document.getElementById("email").value; // [تعديل]: تم تغيير `regEmail` إلى `email`
      const password = document.getElementById("password").value; // [تعديل]: تم تغيير `regPassword` إلى `password`

      try {
        // إنشاء مستخدم جديد في Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        // [تعديل]: حفظ اسم المستخدم محلياً لاستخدامه في لوحة التحكم (لأن Firebase لا يخزن الاسم مباشرة)
        localStorage.setItem("user", JSON.stringify({ name: name, email: email, uid: userCredential.user.uid }));
        
        alert("Registration successful! Please log in.");
        window.location.href = "login.html";

      } catch (error) {
        console.error("Firebase Registration Error:", error);
        // عرض رسائل خطأ أكثر وضوحًا
        let errorMessage = "Registration failed. Please try again.";
        if (error.code === 'auth/email-already-in-use') {
          errorMessage = "This email address is already in use.";
        } else if (error.code === 'auth/weak-password') {
          errorMessage = "Password should be at least 6 characters.";
        }
        alert(errorMessage);
      }
    });
  }

  // =======================
  // تسجيل الدخول (Login)
  // [تعديل مطلوب]: استخدام signInWithEmailAndPassword
  // =======================
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("email").value; // [تعديل]: تم تغيير `loginEmail` إلى `email`
      const password = document.getElementById("password").value; // [تعديل]: تم تغيير `loginPassword` إلى `password`

      try {
        // تسجيل الدخول باستخدام Firebase Auth
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        
        // [تعديل]: جلب اسم المستخدم المخزن محلياً (إذا كان موجوداً)
        const storedUser = JSON.parse(localStorage.getItem("user")) || {};
        
        // [تعديل]: تحديث localStorage ببيانات المستخدم الفعلية من Firebase
        localStorage.setItem("user", JSON.stringify({ 
            name: storedUser.name || email.split('@')[0], // الاحتفاظ بالاسم إن وجد
            email: userCredential.user.email, 
            uid: userCredential.user.uid 
        }));
        
        alert(`Welcome back!`);
        window.location.href = "dashboard.html";

      } catch (error) {
        console.error("Firebase Login Error:", error);
        alert("Invalid email or password. Please check your credentials.");
      }
    });
  }
});
