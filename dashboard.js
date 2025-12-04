// ============================
// Dashboard.js — FIXED VERSION
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

// ضع هنا مفتاح Google Vision الصحيح
const VISION_API_KEY = "AIzaSyDEzLQRjRCn60WsUsY-aEFBKZ4Vy1jceA";

// المستخدم الحالي
let currentUser;
const invoiceList = document.getElementById("invoiceList");

// التأكد من تسجيل الدخول
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }
  currentUser = user;
  document.getElementById("userName").textContent = user.email;
  loadInvoices();
});

// ============================
// OCR عند تغيير الملف
// ============================
document.getElementById("invoiceImage").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  document.getElementById("invoiceName").value = "جاري تحليل الصورة...";
  document.getElementById("invoiceAmount").value = "";
  document.getElementById("invoiceDate").value = "";

  try {
    const tempRef = ref(storage, `tempOCR/${Date.now()}_${file.name}`);
    await uploadBytes(tempRef, file);
    const imgURL = await getDownloadURL(tempRef);

    const text = await runOCR(imgURL);
    fillFields(text);
  } catch (err) {
    console.error(err);
    alert("فشل تحليل الصورة!");
  }
});

// ============================
// حفظ الفاتورة
// ============================
document.getElementById("invoiceForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  try {
    const file = document.getElementById("invoiceImage").files[0];
    if (!file) return alert("يرجى اختيار صورة أولاً");

    const storageRef = ref(storage, `invoices/${currentUser.uid}/${Date.now()}_${file.name}`);
    await uploadBytes(storageRef, file);
    const imageUrl = await getDownloadURL(storageRef);

    await addDoc(collection(db, "invoices"), {
      userId: currentUser.uid,
      name: document.getElementById("invoiceName").value,
      amount: document.getElementById("invoiceAmount").value,
      date: document.getElementById("invoiceDate").value,
      warranty: document.getElementById("invoiceWarranty").value,
      imageUrl: imageUrl,
      createdAt: new Date()
    });

    alert("تمت إضافة الفاتورة بنجاح");
    document.getElementById("invoiceForm").reset();
    loadInvoices();
  } catch (err) {
    console.error("Add Invoice Error:", err);
    alert("خطأ أثناء حفظ الفاتورة");
  }
});

// ============================
// Google Vision OCR
// ============================
async function runOCR(imageURL) {
  const res = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${VISION_API_KEY}`,
    {
      method: "POST",
      body: JSON.stringify({
        requests: [
          {
            image: { source: { imageUri: imageURL } },
            features: [{ type: "TEXT_DETECTION" }]
          }
        ]
      }),
    }
  );

  const data = await res.json();
  return data.responses?.[0]?.fullTextAnnotation?.text || "";
}

// تعبئة الحقول بعد OCR
function fillFields(text) {
  const price = text.match(/\d{2,6}/)?.[0] || "";
  const foundDate = text.match(/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/)?.[0];

  document.getElementById("invoiceName").value = text.split("\n")[0] || "فاتورة بدون اسم";
  document.getElementById("invoiceAmount").value = price;

  if (foundDate) {
    const parsed = new Date(foundDate);
    if (!isNaN(parsed)) {
      document.getElementById("invoiceDate").value = parsed.toISOString().split("T")[0];
    }
  }
}

// ============================
// تحميل الفواتير
// ============================
async function loadInvoices() {
  try {
    invoiceList.innerHTML = "<tr><td colspan='6'>جاري التحميل...</td></tr>";

    const q = query(collection(db, "invoices"), where("userId", "==", currentUser.uid));
    const qs = await getDocs(q);

    if (qs.empty) {
      invoiceList.innerHTML = "<tr><td colspan='6'>لا توجد فواتير محفوظة بعد</td></tr>";
      return;
    }

    invoiceList.innerHTML = "";
    qs.forEach((d) => {
      const data = d.data();
      invoiceList.innerHTML += `
        <tr>
          <td>${data.name}</td>
          <td>${data.amount}</td>
          <td>${data.date}</td>
          <td>${data.warranty || "-"}</td>
          <td><a href="${data.imageUrl}" target="_blank">عرض</a></td>
          <td><button class="delete-btn" data-id="${d.id}">حذف</button></td>
        </tr>`;
    });

    document.querySelectorAll(".delete-btn").forEach(btn => {
      btn.addEventListener("click", async (e) => {
        await deleteDoc(doc(db, "invoices", e.target.dataset.id));
        loadInvoices();
      });
    });

  } catch (err) {
    console.error(err);
    invoiceList.innerHTML = "<tr><td colspan='6'>فشل تحميل البيانات!</td></tr>";
  }
}

// تسجيل الخروج
document.getElementById("logoutBtn").addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "login.html";
});
