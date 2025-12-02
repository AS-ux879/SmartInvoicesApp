// ============================
// dashboard.js — CLEANED + FIXED
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

// التحقق من المستخدم
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    alert("الرجاء تسجيل الدخول");
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
        <td><a href="${data.imageUrl}" target="_blank">عرض الصورة</a></td>
        <td><button onclick="deleteInvoice('${docSnap.id}')">🗑️</button></td>
      </tr>`;
  });
}

// حذف فاتورة
window.deleteInvoice = async (id) => {
  if (!confirm("هل تريد حذف الفاتورة؟")) return;

  await deleteDoc(doc(db, "invoices", id));
  loadInvoices();
};

// رفع ومعالجة الفاتورة
document.getElementById("invoiceForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const file = document.getElementById("invoiceImage").files[0];
  if (!file) {
    alert("اختر صورة الفاتورة أولاً");
    return;
  }

  try {
    const storageRef = ref(storage, `invoices/${currentUser.uid}/${Date.now()}_${file.name}`);
    await uploadBytes(storageRef, file);
    const imageUrl = await getDownloadURL(storageRef);

    const text = await extractTextFromImage(imageUrl);
    const data = extractInvoiceData(text);

    await addDoc(collection(db, "invoices"), {
      userId: currentUser.uid,
      name: data.name,
      amount: data.amount,
      date: data.date,
      imageUrl,
      createdAt: new Date()
    });

    alert("تمت الإضافة");
    loadInvoices();
    document.getElementById("invoiceForm").reset();

  } catch (err) {
    alert("فشل الإضافة: " + err.message);
  }
});

// OCR API
async function extractTextFromImage(imageUrl) {
  const url = `https://vision.googleapis.com/v1/images:annotate?key=${VISION_API_KEY}`;

  const body = {
    requests: [{
      image: { source: { imageUri: imageUrl }},
      features: [{ type: "TEXT_DETECTION" }]
    }]
  };

  const res = await fetch(url, {
    method: "POST",
    body: JSON.stringify(body)
  });

  const data = await res.json();
  return data?.responses?.[0]?.fullTextAnnotation?.text || "";
}

function extractInvoiceData(text) {
  return {
    name: text.split("\n")[0] || "فاتورة",
    amount: (text.match(/\d+(\.\d+)?/) || [0])[0],
    date: (text.match(/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/) || ["غير محدد"])[0]
  };
}

// خروج
window.logout = () => {
  signOut(auth);
  window.location.href = "login.html";
};
