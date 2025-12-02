// ============================
// dashboard.js — FINAL WORKING VERSION
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

// Google Vision API
const VISION_API_KEY = "AIzaSyDEzLQRjRCn60WsUsY-aEFBKZ4Vy1iJceA";

let currentUser;
const invoiceList = document.getElementById("invoiceList");

// ============================
// التحقق من تسجيل الدخول
// ============================
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }
  currentUser = user;
  document.getElementById("userName").textContent = user.displayName || "مستخدم";
  loadInvoices();
});

// ============================
// تشغيل OCR تلقائياً عند رفع الصورة
// ============================
document.getElementById("invoiceImage").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  document.getElementById("invoiceName").value = "جاري القراءة...";
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
    alert("حدث خطأ أثناء قراءة الفاتورة.");
  }
});

// ============================
// حفظ الفاتورة
// ============================
document.getElementById("invoiceForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  try {
    const file = document.getElementById("invoiceImage").files[0];
    if (!file) return alert("اختر صورة الفاتورة أولاً");

    const storageRef = ref(storage, `invoices/${currentUser.uid}/${Date.now()}_${file.name}`);
    await uploadBytes(storageRef, file);
    const imgUrl = await getDownloadURL(storageRef);

    await addDoc(collection(db, "invoices"), {
      userId: currentUser.uid,
      name: document.getElementById("invoiceName").value,
      amount: document.getElementById("invoiceAmount").value,
      date: document.getElementById("invoiceDate").value,
      warranty: document.getElementById("invoiceWarranty").value,
      imageUrl: imgUrl,
      createdAt: new Date()
    });

    alert("✅ تم إضافة الفاتورة بنجاح");
    document.getElementById("invoiceForm").reset();
    loadInvoices();
  } catch (err) {
    console.error("Add Invoice Error:", err);
    alert("حدث خطأ أثناء حفظ الفاتورة");
  }
});

// ============================
// OCR — Google Vision API
// ============================
async function runOCR(imageUrl) {
  const response = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${VISION_API_KEY}`,
    {
      method: "POST",
      body: JSON.stringify({
        requests: [
          {
            image: { source: { imageUri: imageUrl } },
            features: [{ type: "TEXT_DETECTION" }]
          }
        ]
      })
    }
  );
  const json = await response.json();
  return json?.responses?.[0]?.fullTextAnnotation?.text || "";
}

// ============================
// تعبئة الحقول تلقائياً بعد OCR
// ============================
function fillFields(text) {
  const price = text.match(/\d{2,6}/)?.[0] || "";
  const foundDate = text.match(/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/)?.[0];

  document.getElementById("invoiceName").value = text.split("\n")[0] || "فاتورة بدون اسم";
  document.getElementById("invoiceAmount").value = price;
  if (foundDate) {
    const parsedDate = new Date(foundDate);
    if (!isNaN(parsedDate)) {
      document.getElementById("invoiceDate").value = parsedDate.toISOString().split("T")[0];
    }
  }
}

// ============================
// تحميل وعرض الفواتير
// ============================
async function loadInvoices() {
  try {
    invoiceList.innerHTML = "<tr><td colspan='6'>⏳ جاري تحميل الفواتير...</td></tr>";
    const q = query(collection(db, "invoices"), where("userId", "==", currentUser.uid));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      invoiceList.innerHTML = "<tr><td colspan='6'>لا توجد فواتير محفوظة بعد</td></tr>";
      return;
    }

    invoiceList.innerHTML = "";
    querySnapshot.forEach((docSnap) => {
      const d = docSnap.data();
      invoiceList.innerHTML += `
        <tr>
          <td>${d.name}</td>
          <td>${d.amount}</td>
          <td>${d.date}</td>
          <td>${d.warranty || "-"}</td>
          <td><a href="${d.imageUrl}" target="_blank">📄 عرض</a></td>
          <td><button class="delete-btn" data-id="${docSnap.id}">🗑️ حذف</button></td>
        </tr>`;
    });

    document.querySelectorAll(".delete-btn").forEach(btn => {
      btn.addEventListener("click", async (e) => {
        const id = e.target.dataset.id;
        await deleteDoc(doc(db, "invoices", id));
        loadInvoices();
      });
    });
  } catch (err) {
    console.error("Load Invoices Error:", err);
    invoiceList.innerHTML = "<tr><td colspan='6'>⚠️ فشل في تحميل الفواتير</td></tr>";
  }
}

// ============================
// زر تسجيل الخروج
// ============================
document.getElementById("logoutBtn").addEventListener("click", async () => {
  try {
    await signOut(auth);
    alert("تم تسجيل الخروج بنجاح");
    window.location.href = "login.html";
  } catch (err) {
    console.error("Logout Error:", err);
  }
});
