// =======================
//  Dashboard.js (Firestore + OCR)
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

// تهيئة الخدمات
const auth = getAuth();
const db = getFirestore();

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
//      الترجمات
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
    langBtn: "🌐 English"
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
    langBtn: "🌐 العربية"
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

// =======================
//  تحويل الصورة إلى Base64
// =======================
function toBase64(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(file);
  });
}

// =======================
// OCR — قراءة النص من الصورة
// =======================
async function extractTextFromImage(base64) {
  const result = await Tesseract.recognize(base64, "eng", {
    logger: (m) => console.log(m)
  });
  return result.data.text;
}

// =======================
// استخراج البيانات من النص
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
//  حفظ الفاتورة في Firestore
// =======================
async function saveInvoice(userId, invoice) {
  await addDoc(collection(db, "users", userId, "invoices"), invoice);
}

// =======================
// جلب الفواتير من Firestore
// =======================
async function loadInvoices(userId) {
  const list = document.getElementById("invoiceList");
  list.innerHTML = "";

  const querySnapshot = await getDocs(collection(db, "users", userId, "invoices"));

  querySnapshot.forEach((docSnap) => {
    const inv = docSnap.data();
    const row = `
      <tr>
        <td>${inv.name}</td>
        <td>${inv.amount}</td>
        <td>${inv.date}</td>
        <td>${inv.warranty}</td>
        <td>${inv.image ? `<a href="${inv.image}" target="_blank">📎 عرض</a>` : "—"}</td>
        <td><button onclick="deleteInvoice('${docSnap.id}')">🗑️</button></td>
      </tr>
    `;
    list.innerHTML += row;
  });
}

// =======================
//  حذف فاتورة
// =======================
window.deleteInvoice = async function (id) {
  const user = auth.currentUser;
  if (!user) return;

  await deleteDoc(doc(db, "users", user.uid, "invoices", id));
  loadInvoices(user.uid);
};

// =======================
//  عند إرسال النموذج
// =======================
document.getElementById("invoiceForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const user = auth.currentUser;

  const nameInput = document.getElementById("invoiceName");
  const amountInput = document.getElementById("invoiceAmount");
  const dateInput = document.getElementById("invoiceDate");
  const warrantyInput = document.getElementById("invoiceWarranty");
  const fileInput = document.getElementById("invoiceImage");

  let imageBase64 = "";
  let extracted = {};

  if (fileInput.files.length > 0) {
    const file = fileInput.files[0];
    imageBase64 = await toBase64(file);

    const text = await extractTextFromImage(imageBase64);

    extracted = extractInvoiceData(text);

    if (extracted.name) nameInput.value = extracted.name;
    if (extracted.amount) amountInput.value = extracted.amount;
    if (extracted.date) dateInput.value = extracted.date;
    if (extracted.warranty) warrantyInput.value = extracted.warranty;
  }

  const invoice = {
    name: nameInput.value,
    amount: amountInput.value,
    date: dateInput.value,
    warranty: warrantyInput.value,
    image: imageBase64
  };

  await saveInvoice(user.uid, invoice);
  await loadInvoices(user.uid);

  document.getElementById("invoiceForm").reset();
});

// =======================
//  تصدير PDF
// =======================
document.getElementById("pdfBtn").addEventListener("click", () => {
  const element = document.querySelector("table");
  html2pdf().from(element).save("invoices.pdf");
});

// =======================
//  تسجيل خروج
// =======================
document.getElementById("logoutBtn").addEventListener("click", () => {
  signOut(auth);
  window.location.href = "login.html";
});
