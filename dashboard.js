// ============================
// dashboard.js — AUTO OCR VERSION
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

// عند تسجيل دخول المستخدم
onAuthStateChanged(auth, async (user) => {
  if (!user) return window.location.href = "login.html";
  currentUser = user;
  document.getElementById("userName").textContent = user.displayName || "مستخدم";
  loadInvoices();
});

// تحميل الفواتير
async function loadInvoices() {
  invoiceList.innerHTML = "";
  const q = query(collection(db, "invoices"), where("userId", "==", currentUser.uid));
  const snapshot = await getDocs(q);

  snapshot.forEach(docSnap => {
    const d = docSnap.data();
    invoiceList.innerHTML += `
      <tr>
        <td>${d.name}</td>
        <td>${d.amount}</td>
        <td>${d.date}</td>
        <td>${d.warranty || "-"}</td>
        <td><a href="${d.imageUrl}" target="_blank">📄 عرض</a></td>
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

// تشغيل OCR تلقائياً عند اختيار صورة
document.getElementById("invoiceImage").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  document.getElementById("invoiceName").value = "جاري القراءة...";
  document.getElementById("invoiceAmount").value = "";
  document.getElementById("invoiceDate").value = "";

  const storageRef = ref(storage, `ocr_temp/${Date.now()}_${file.name}`);
  await uploadBytes(storageRef, file);
  const imageUrl = await getDownloadURL(storageRef);

  const text = await extractTextFromImage(imageUrl);
  const extracted = extractInvoiceData(text);

  document.getElementById("invoiceName").value = extracted.name;
  document.getElementById("invoiceAmount").value = extracted.amount;
  
  if (extracted.date !== "غير محدد") {
    document.getElementById("invoiceDate").value =
      new Date(extracted.date).toISOString().split("T")[0];
  }
});

// حفظ الفاتورة
document.getElementById("invoiceForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const file = document.getElementById("invoiceImage").files[0];
  if (!file) return alert("اختر صورة أولاً");

  const storageRef = ref(storage, `invoices/${currentUser.uid}/${Date.now()}_${file.name}`);
  await uploadBytes(storageRef, file);
  const imageUrl = await getDownloadURL(storageRef);

  await addDoc(collection(db, "invoices"), {
    userId: currentUser.uid,
    name: document.getElementById("invoiceName").value,
    amount: document.getElementById("invoiceAmount").value,
    date: document.getElementById("invoiceDate").value,
    warranty: document.getElementById("invoiceWarranty").value,
    imageUrl,
    createdAt: new Date()
  });

  alert("تم حفظ الفاتورة بنجاح");
  loadInvoices();
  document.getElementById("invoiceForm").reset();
});

// OCR
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
