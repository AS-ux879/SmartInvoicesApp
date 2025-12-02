// ============================
// dashboard.js — FINAL VERSION
// ============================

import { auth, db, storage } from "./firebase.js";
import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.3/firebase-auth.js";

import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js";

import {
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.12.3/firebase-storage.js";

// OCR API KEY
const VISION_API_KEY = "AIzaSyDEzLQRjRCn60WsUsY-aEFBKZ4Vy1iJceA";

let currentUser = null;
const invoiceList = document.getElementById("invoiceList");

// التحقق من تسجيل الدخول
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    alert("الرجاء تسجيل الدخول أولاً");
    window.location.href = "login.html";
    return;
  }

  currentUser = user;
  document.getElementById("userName").textContent = user.displayName || "مستخدم";
  await loadInvoices();
});

// تحميل الفواتير
async function loadInvoices() {
  invoiceList.innerHTML = "";

  const q = query(collection(db, "invoices"), where("userId", "==", currentUser.uid));
  const snapshot = await getDocs(q);

  snapshot.forEach(docSnap => {
    const data = docSnap.data();
    invoiceList.innerHTML += `
      <tr>
        <td>${data.name}</td>
        <td>${data.amount}</td>
        <td>${data.date}</td>
        <td>${data.warranty || "-"}</td>
        <td><a href="${data.imageUrl}" target="_blank">📄 عرض</a></td>
        <td><button onclick="deleteInvoice('${docSnap.id}')">🗑️</button></td>
      </tr>`;
  });
}

// حذف فاتورة
window.deleteInvoice = async (id) => {
  if (!confirm("تأكيد حذف الفاتورة؟")) return;
  await deleteDoc(doc(db, "invoices", id));
  loadInvoices();
};

// عند إضافة فواتير
document.getElementById("invoiceForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const file = document.getElementById("invoiceImage").files[0];
  if (!file) return alert("يرجى اختيار صورة الفاتورة");

  try {
    // رفع الصورة
    const storageRef = ref(storage, `invoices/${currentUser.uid}/${Date.now()}_${file.name}`);
    await uploadBytes(storageRef, file);
    const imageUrl = await getDownloadURL(storageRef);

    // OCR القراءة التلقائية
    const text = await extractTextFromImage(imageUrl);
    const extracted = extractInvoiceData(text);

    await addDoc(collection(db, "invoices"), {
      userId: currentUser.uid,
      name: extracted.name,
      amount: extracted.amount,
      date: extracted.date,
      warranty: document.getElementById("invoiceWarranty").value,
      imageUrl,
      createdAt: new Date()
    });

    alert("تم إضافة الفاتورة بنجاح");
    loadInvoices();
    document.getElementById("invoiceForm").reset();

  } catch (err) {
    alert("خطأ: " + err.message);
  }
});

// Google Vision OCR
async function extractTextFromImage(imageUrl) {
  const res = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${VISION_API_KEY}`,
    {
      method: "POST",
      body: JSON.stringify({
        requests: [{
          image: { source: { imageUri: imageUrl } },
          features: [{ type: "TEXT_DETECTION" }]
        }]
      })
    }
  );

  const data = await res.json();
  return data?.responses?.[0]?.fullTextAnnotation?.text || "";
}

// استخلاص البيانات
function extractInvoiceData(text) {
  return {
    name: text.split("\n")[0] || "فاتورة",
    amount: (text.match(/\d+(\.\d+)?/) || ["0"])[0],
    date: (text.match(/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/) || ["غير محدد"])[0]
  };
}

// تسجيل خروج
window.logout = () => {
  signOut(auth);
  window.location.href = "login.html";
};
