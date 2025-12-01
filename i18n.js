// =======================
//  i18n_auth.js (Shared Translation Utility for Auth Pages)
// =======================

export const i18n = {
    ar: {
        loginTitle: 'تسجيل الدخول',
        registerTitle: 'إنشاء حساب',
        username: 'الاسم الكامل:', // [تعديل بسيط]: تم استخدامه كـ "الاسم الكامل" في صفحة التسجيل
        emailLabel: 'البريد الإلكتروني:', // [إضافة]: لتغطية حقل الإيميل في النماذج
        password: 'كلمة المرور:',
        password2: 'تأكيد كلمة المرور:',
        login: 'دخول',
        goRegister: 'إنشاء حساب جديد',
        goLogin: 'تسجيل الدخول',
        needUserPass: 'أدخل اسم المستخدم وكلمة المرور',
        needMatchPass: 'كلمتا المرور غير متطابقتين',
        userExists: 'البريد الإلكتروني مستخدم مسبقًا', // [تعديل بسيط]: تم ربط الخطأ بالإيميل (Firebase)
        userCreated: 'تم إنشاء الحساب',
        invalidCreds: 'بيانات غير صحيحة',
        lang: 'English'
    },
    en: {
        loginTitle: 'Sign in',
        registerTitle: 'Create account',
        username: 'Full Name:', // [تعديل بسيط]: تم استخدامه كـ "Full Name" في صفحة التسجيل
        emailLabel: 'Email:', // [إضافة]: لتغطية حقل الإيميل في النماذج
        password: 'Password:',
        password2: 'Confirm password:',
        login: 'Login',
        goRegister: 'Create a new account',
        goLogin: 'Login',
        needUserPass: 'Please enter username and password',
        needMatchPass: 'Passwords must match',
        userExists: 'Email already taken',
        userCreated: 'Account created',
        invalidCreds: 'Invalid credentials',
        lang: 'العربية'
    }
};

// [الدوال المساعدة كما قدمتها، لكن بصيغة تصدير Module]
export function getLang() {
    return localStorage.getItem('lang') || 'ar'
};

export function setLang(l) {
    localStorage.setItem('lang', l);
    document.documentElement.lang = l;
    document.documentElement.dir = (l === 'ar') ? 'rtl' : 'ltr';
}
