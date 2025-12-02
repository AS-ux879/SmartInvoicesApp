// ============================
// dashboard.js — Firebase + OCR + Storage + Firestore
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

// ضع مفتاح Google Vision هنا لاحقاً
const VISION_API_KEY = "AIzaSyBVAfj2LIYr7EMqhUySeazeqH-8bPebry0";

let currentUser = null;
const invoiceList = document.getElementById("invoiceList");

// Detect user login state
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

// تحميل فواتير المستخدم
async function loadInvoices() {
  invoiceList.innerHTML = "";

  const q = query(collection(db, "invoices"), where("userId", "==", currentUser.uid));
  const snapshot = await getDocs(q);

  snapshot.forEach(docSnap => {
    const data = docSnap.data();
    const row = `
      <tr>
        <td>${data.name}</td>
        <td>${data.amount}</td>
        <td>${data.date}</td>
        <td><a href="${data.imageUrl}" target="_blank">📄 عرض</a></td>
        <td><button onclick="deleteInvoice('${docSnap.id}')">🗑️ حذف</button></td>
      </tr>`;
    invoiceList.innerHTML += row;
  });
}

// حذف فاتورة
window.deleteInvoice = async (id) => {
  if (!confirm("تأكيد حذف الفاتورة؟")) return;

  await deleteDoc(doc(db, "invoices", id));
  await loadInvoices();
};

// تحويل ملف لصورة Base64
async function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// رفع بيانات الفاتورة لفايرستور + OCR
document.getElementById("invoiceForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const fileInput = document.getElementById("invoiceImage");
  if (!fileInput.files.length) {
    alert("يرجى اختيار صورة الفاتورة");
    return;
  }
  const file = fileInput.files[0];

  try {
    const storageRef = ref(storage, `invoices/${currentUser.uid}/${Date.now()}_${file.name}`);
    await uploadBytes(storageRef, file);
    const imageUrl = await getDownloadURL(storageRef);

    const text = await extractTextFromImage(imageUrl);

    const invoiceData = extractInvoiceData(text);

    await addDoc(collection(db, "invoices"), {
      userId: currentUser.uid,
      imageUrl,
      name: invoiceData.name,
      amount: invoiceData.amount,
      date: invoiceData.date,
      createdAt: new Date()
    });

    alert("تم إضافة الفاتورة بنجاح!");
    await loadInvoices();
    document.getElementById("invoiceForm").reset();

  } catch (err) {
    alert("خطأ أثناء إضافة الفاتورة: " + err.message);
  }
});

// Google Vision OCR
async function extractTextFromImage(imageUrl) {
  const url = `https://vision.googleapis.com/v1/images:annotate?key=${VISION_API_KEY}`;
  const body = {
    requests: [
      {
        image: { source: { imageUri: imageUrl }},
        features: [{ type: "TEXT_DETECTION" }]
      }
    ]
  };

  const res = await fetch(url, {
    method: "POST",
    body: JSON.stringify(body)
  });

  const data = await res.json();
  return data.responses[0].fullTextAnnotation?.text || "";
}

// تحليل البيانات من النص
function extractInvoiceData(text) {
  return {
    name: text.split("\n")[0] || "فاتورة",
    amount: extractNumber(text) || 0,
    date: extractDate(text) || new Date().toLocaleDateString("en-GB")
  };
}

function extractNumber(text) {
  const match = text.match(/\d+(\.\d{1,2})?/);
  return match ? match[0] : "";
}

function extractDate(text) {
  const match = text.match(/\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/);
  return match ? match[0] : "";
}

// تسجيل خروج
window.logout = () => {
  signOut(auth);
  window.location.href = "login.html";
};
