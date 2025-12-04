// ============================
// dashboard.js — FINAL FULL FIXED VERSION
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


// ===== ضعِ مفتاح Google Vision API الجديد هنا =====
const VISION_API_KEY = "AIzaSyDEzLQRjRCn60WsUsY-aEFBKZ4Vy1iJceA";


let currentUser;
const invoiceList = document.getElementById("invoiceList");


// ============================
// تسجيل الدخول تلقائيًا
// ============================
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }
  currentUser = user;
  document.getElementById("userName").textContent =
    user.displayName || user.email.split("@")[0];
  loadInvoices();
});


// ============================
// OCR عند رفع الصورة
// ============================
document.getElementById("invoiceImage").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  document.getElementById("invoiceName").value = "جارِ تحليل الصورة...";
  document.getElementById("invoiceAmount").value = "";
  document.getElementById("invoiceDate").value = "";

  try {
    const tempRef = ref(storage, `tempOCR/${Date.now()}_${file.name}`);
    await uploadBytes(tempRef, file);
    const imgUrl = await getDownloadURL(tempRef);

    const text = await runOCR(imgUrl);
    fillFields(text);
  } catch (err) {
    console.error("OCR Error:", err);
  }
});


// ============================
// حفظ الفاتورة (تم إصلاح مشكلة required)
// ============================
document.getElementById("invoiceForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("invoiceName").value.trim();
  const amount = document.getElementById("invoiceAmount").value.trim();
  const date = document.getElementById("invoiceDate");
  const warranty = document.getElementById("invoiceWarranty").value.trim();
  const file = document.getElementById("invoiceImage").files[0];

  if (!file) return alert("اختر صورة الفاتورة");
  if (!name) return alert("أدخل اسم الفاتورة");
  if (!amount) return alert("أدخل مبلغ الفاتورة");

  let finalDate = date.value;
  if (!finalDate) {
    finalDate = new Date().toISOString().split("T")[0];
    date.value = finalDate;
  }

  try {
    const storageRef = ref(storage, `invoices/${currentUser.uid}/${Date.now()}_${file.name}`);
    await uploadBytes(storageRef, file);
    const imgUrl = await getDownloadURL(storageRef);

    await addDoc(collection(db, "invoices"), {
      userId: currentUser.uid,
      name,
      amount,
      date: finalDate,
      warranty,
      imageUrl: imgUrl,
      createdAt: new Date()
    });

    alert("تم إضافة الفاتورة بنجاح");
    document.getElementById("invoiceForm").reset();
    loadInvoices();
  } catch (err) {
    console.error("Add Invoice Error:", err);
    alert("خطأ أثناء الحفظ");
  }
});


// ============================
// استدعاء Google Vision
// ============================
async function runOCR(imageUrl) {
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
  const json = await res.json();
  return json?.responses?.[0]?.fullTextAnnotation?.text || "";
}


// ============================
// تعبئة الحقول تلقائياً حسب OCR
// ============================
function fillFields(text) {
  const price = text.match(/\d{2,6}/)?.[0] || "";
  const foundDate = text.match(/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/)?.[0];

  document.getElementById("invoiceName").value =
    text.split("\n")[0] || "فاتورة بدون اسم";

  document.getElementById("invoiceAmount").value = price;

  if (foundDate) {
    const d = new Date(foundDate);
    if (!isNaN(d)) {
      document.getElementById("invoiceDate").value =
        d.toISOString().split("T")[0];
    }
  }
}


// ============================
// عرض الفواتير من Firestore
// ============================
async function loadInvoices() {
  try {
    invoiceList.innerHTML =
      "<tr><td colspan='6'>⏳ جاري التحميل...</td></tr>";

    const q = query(collection(db, "invoices"), where("userId", "==", currentUser.uid));
    const snap = await getDocs(q);

    if (snap.empty) {
      invoiceList.innerHTML =
        "<tr><td colspan='6'>لا توجد فواتير بعد</td></tr>";
      return;
    }

    invoiceList.innerHTML = "";

    snap.forEach((docSnap) => {
      const d = docSnap.data();

      invoiceList.innerHTML += `
        <tr>
          <td>${d.name}</td>
          <td>${d.amount}</td>
          <td>${d.date}</td>
          <td>${d.warranty || "-"}</td>
          <td><a href="${d.imageUrl}" target="_blank">📄</a></td>
          <td><button class="delete-btn" data-id="${docSnap.id}">🗑️</button></td>
        </tr>`;
    });

    document.querySelectorAll(".delete-btn").forEach(btn => {
      btn.addEventListener("click", async (e) => {
        await deleteDoc(doc(db, "invoices", e.target.dataset.id));
        loadInvoices();
      });
    });

  } catch (err) {
    console.error("Load Error:", err);
    invoiceList.innerHTML =
      "<tr><td colspan='6'>⚠️ فشل في تحميل الفواتير</td></tr>";
  }
}


// ============================
// زر تسجيل الخروج
// ============================
document.getElementById("logoutBtn").addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "login.html";
});
