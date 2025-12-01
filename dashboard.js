// =======================
//  Dashboard.js (Firestore + Storage + OCR)
// =======================

import { 
  getAuth, 
  onAuthStateChanged, 
  signOut 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

import { 
  getFirestore,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// [تعديل مطلوب]: استيراد مكتبة التخزين السحابي (Storage)
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";


// تهيئة الخدمات
const auth = getAuth();
const db = getFirestore();
const storage = getStorage(); // [إضافة]: تهيئة خدمة التخزين السحابي


// =======================
// التأكد من تسجيل الدخول
// =======================
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    alert("الرجاء تسجيل الدخول أولاً");
    window.location.href = "login.html";
    return;
  }

  document.getElementById("userName").textContent = user.email.split("@")[0];
  await loadInvoices(user.uid);
});

// =======================
//      الترجمات (بدون تغيير)
// =======================
const i18n = {
  ar: {
    title: "📊 لوحة الفواتير",
    greet: "مرحبًا",
    name: "اسم الفاتورة:",
    amount: "المبلغ (ريال):",
    date: "التاريخ:",
    warranty: "مدة الضمان (بالأشهر):",
    image: "📷 صورة الفاتورة:",
    add: "➕ إضافة الفاتورة",
    list: "🧾 قائمة الفواتير",
    thName: "الاسم",
    thAmount: "المبلغ",
    thDate: "التاريخ",
    thWarranty: "الضمان",
    thImage: "الصورة",
    thAction: "إجراء",
    pdf: "📄 حفظ كـ PDF",
    logout: "🚪 تسجيل الخروج",
    langBtn: "🌐 English",
    viewImage: "عرض الملف/الصورة" // [إضافة]: مفتاح جديد للعرض
  },
  en: {
    title: "📊 Invoice Dashboard",
    greet: "Hello",
    name: "Invoice Name:",
    amount: "Amount (SAR):",
    date: "Date:",
    warranty: "Warranty (Months):",
    image: "📷 Invoice Image:",
    add: "➕ Add Invoice",
    list: "🧾 Invoice List",
    thName: "Name",
    thAmount: "Amount",
    thDate: "Date",
    thWarranty: "Warranty",
    thImage: "Image",
    thAction: "Action",
    pdf: "📄 Save as PDF",
    logout: "🚪 Logout",
    langBtn: "🌐 العربية",
    viewImage: "View File/Image"
  }
};

let currentLang = localStorage.getItem("lang") || "ar";

function setLang(lang) {
  const t = i18n[lang];

  document.documentElement.lang = lang;
  document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";

  document.getElementById("title").textContent = t.title;
  document.getElementById("greet").textContent = t.greet;
  document.getElementById("labelName").textContent = t.name;
  document.getElementById("labelAmount").textContent = t.amount;
  document.getElementById("labelDate").textContent = t.date;
  document.getElementById("labelWarranty").textContent = t.warranty;
  document.getElementById("labelImage").textContent = t.image;
  document.getElementById("addBtn").textContent = t.add;
  document.getElementById("listTitle").textContent = t.list;

  document.getElementById("thName").textContent = t.thName;
  document.getElementById("thAmount").textContent = t.thAmount;
  document.getElementById("thDate").textContent = t.thDate;
  document.getElementById("thWarranty").textContent = t.thWarranty;
  document.getElementById("thImage").textContent = t.thImage;
  document.getElementById("thAction").textContent = t.thAction;

  document.getElementById("pdfBtn").textContent = t.pdf;
  document.getElementById("logoutBtn").textContent = t.logout;
  document.getElementById("langBtn").textContent = t.langBtn;

  localStorage.setItem("lang", lang);
}

document.getElementById("langBtn").addEventListener("click", () => {
  currentLang = currentLang === "ar" ? "en" : "ar";
  setLang(currentLang);
});
setLang(currentLang);

// [تعديل مطلوب]: حذف الدالة القديمة toBase64 لأننا سنرفع الصورة مباشرة إلى السحابة
// function toBase64(file) { ... }
// لم تعد هناك حاجة لها

// =======================
// [إضافة]: رفع الملف إلى التخزين السحابي (Firebase Storage)
// =======================
async function uploadFile(file, userId, invoiceName) {
  if (!file) return null;
  
  // إنشاء مسار فريد للملف
  const fileName = `${userId}/${invoiceName}_${Date.now()}_${file.name}`;
  const storageRef = ref(storage, fileName);

  // بدء عملية الرفع
  const uploadTask = uploadBytesResumable(storageRef, file);

  return new Promise((resolve, reject) => {
    uploadTask.on('state_changed', 
      (snapshot) => {
        // يمكن هنا عرض شريط التقدم إذا أردت
      }, 
      (error) => {
        // فشل الرفع
        console.error("Error uploading file:", error);
        reject(null);
      }, 
      async () => {
        // نجاح الرفع، الحصول على رابط التحميل المباشر
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        resolve(downloadURL);
      }
    );
  });
}


// =======================
// OCR — قراءة النص من الصورة (بدون تغيير)
// =======================
async function extractTextFromImage(base64) {
  const result = await Tesseract.recognize(base64, "eng", {
    logger: (m) => console.log(m)
  });
  return result.data.text;
}

// =======================
// استخراج البيانات من النص (بدون تغيير)
// =======================
function extractInvoiceData(text) {
  const amountRegex = /\b\d+(\.\d{1,2})?\b/g;
  const amounts = text.match(amountRegex);
  const amount = amounts ? amounts[0] : "";

  const dateRegex =
    /\b(20\d{2}[-\/\. ]\d{1,2}[-\/\. ]\d{1,2})\b|\b(\d{1,2}[-\/\. ]\d{1,2}[-\/\. ]20\d{2})\b/;
  const dateMatch = text.match(dateRegex);
  const rawDate = dateMatch ? dateMatch[0] : "";

  let formattedDate = "";
  if (rawDate.includes("-") || rawDate.includes("/")) {
    const parts = rawDate.split(/[-\/]/);
    if (parts[0].length === 4) formattedDate = rawDate;
    else formattedDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
  }

  const warrantyRegex = /\b(\d{1,2})\s*(month|months|شهر|شهور)\b/i;
  const warrantyMatch = text.match(warrantyRegex);
  const warranty = warrantyMatch ? warrantyMatch[1] : "";

  const name = text.split("\n")[0].trim();

  return { name, amount, date: formattedDate, warranty };
}

// =======================
//  حفظ الفاتورة في Firestore (بدون تغيير)
// =======================
async function saveInvoice(userId, invoice) {
  await addDoc(collection(db, "users", userId, "invoices"), invoice);
}

// =======================
// جلب الفواتير من Firestore
// [تعديل مطلوب]: تعديل عرض الصورة لاستخدام الرابط السحابي
// =======================
async function loadInvoices(userId) {
  const list = document.getElementById("invoiceList");
  list.innerHTML = "";

  const querySnapshot = await getDocs(collection(db, "users", userId, "invoices"));

  querySnapshot.forEach((docSnap) => {
    const inv = docSnap.data();
    const docId = docSnap.id; // نحتاج ID للحذف
    const row = `
      <tr>
        <td>${inv.name}</td>
        <td>${inv.amount}</td>
        <td>${inv.date}</td>
        <td>${inv.warranty}</td>
        <td>${inv.imageURL ? `<a href="${inv.imageURL}" target="_blank">${i18n[currentLang].viewImage}</a>` : "—"}</td>
        <td><button onclick="deleteInvoice('${docId}')">🗑️</button></td>
      </tr>
    `;
    list.innerHTML += row;
  });
}

// =======================
//  حذف فاتورة (بدون تغيير)
// =======================
window.deleteInvoice = async function (id) {
  const user = auth.currentUser;
  if (!user) return;

  await deleteDoc(doc(db, "users", user.uid, "invoices", id));
  loadInvoices(user.uid);
};

// =======================
//  عند إرسال النموذج
// [تعديل مطلوب]: استخدام دالة الرفع السحابي بدلاً من Base64
// =======================
document.getElementById("invoiceForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const user = auth.currentUser;
  if (!user) return; // تأمين إضافي

  const nameInput = document.getElementById("invoiceName");
  const amountInput = document.getElementById("invoiceAmount");
  const dateInput = document.getElementById("invoiceDate");
  const warrantyInput = document.getElementById("invoiceWarranty");
  const fileInput = document.getElementById("invoiceImage");

  let imageURL = ""; // [تعديل]: تحويل المتغير إلى رابط سحابي
  let extracted = {};
  let file = null;

  if (fileInput.files.length > 0) {
    file = fileInput.files[0];
    
    // [تعديل مطلوب]: بما أننا نحتاج Base64 لـ OCR، سنضطر لاستخدام FileReader مؤقتاً
    // (هذا ليس مثالياً ولكنه يحافظ على وظيفة OCR الحالية)
    const imageBase64 = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(file);
    });

    const text = await extractTextFromImage(imageBase64);

    extracted = extractInvoiceData(text);

    if (extracted.name) nameInput.value = extracted.name;
    if (extracted.amount) amountInput.value = extracted.amount;
    if (extracted.date) dateInput.value = extracted.date;
    if (extracted.warranty) warrantyInput.value = extracted.warranty;
    
    // **[تعديل مطلوب]: رفع الصورة إلى Firebase Storage بعد استخلاص النص**
    imageURL = await uploadFile(file, user.uid, nameInput.value);
  }

  const invoice = {
    name: nameInput.value,
    amount: amountInput.value,
    date: dateInput.value,
    warranty: warrantyInput.value,
    imageURL: imageURL // [تعديل]: حفظ الرابط السحابي بدلاً من Base64
  };

  await saveInvoice(user.uid, invoice);
  await loadInvoices(user.uid);

  document.getElementById("invoiceForm").reset();
});

// =======================
//  تصدير PDF (بدون تغيير)
// =======================
document.getElementById("pdfBtn").addEventListener("click", () => {
  const element = document.querySelector("table");
  html2pdf().from(element).save("invoices.pdf");
});

// =======================
//  تسجيل خروج (بدون تغيير)
// =======================
document.getElementById("logoutBtn").addEventListener("click", () => {
  signOut(auth);
  window.location.href = "login.html";
});
