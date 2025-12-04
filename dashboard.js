/* ============================
   dashboard.js — FIXED FINAL VERSION
   ============================ */

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
const totalSpentDisplay = document.getElementById("totalSpent");
let chart;

// ==================================
// التحقق من المستخدم
// ==================================
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    return (window.location.href = "login.html");
  }
  currentUser = user;
  document.getElementById("userName").textContent = user.email;
  loadInvoices();
});

// ==================================
// OCR — عند رفع الصورة
// ==================================
document.getElementById("invoiceImage").addEventListener("change", async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  document.getElementById("invoiceName").value = "جاري تحليل الصورة...";
  document.getElementById("invoiceAmount").value = "";
  document.getElementById("invoiceDate").value = "";

  try {
    const tempRef = ref(storage, `temp/${Date.now()}_${file.name}`);
    await uploadBytes(tempRef, file);
    const url = await getDownloadURL(tempRef);

    const text = await detectText(url);
    fillFields(text);
  } catch (err) {
    console.error("OCR Error:", err);
    alert("حدث خطأ أثناء تحليل الصورة");
  }
});

async function detectText(imgUrl) {
  const response = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${VISION_API_KEY}`,
    {
      method: "POST",
      body: JSON.stringify({
        requests: [
          {
            image: { source: { imageUri: imgUrl } },
            features: [{ type: "TEXT_DETECTION" }]
          }
        ]
      })
    }
  );

  const json = await response.json();
  return json.responses?.[0]?.fullTextAnnotation?.text || "";
}

function fillFields(text) {
  const amount = text.match(/\d+/)?.[0] || "";
  const foundDate = text.match(/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/)?.[0];

  document.getElementById("invoiceName").value = text.split("\n")[0] || "فاتورة بدون اسم";
  document.getElementById("invoiceAmount").value = amount;

  if (foundDate) {
    const parsed = new Date(foundDate);
    if (!isNaN(parsed)) {
      document.getElementById("invoiceDate").value = parsed.toISOString().split("T")[0];
    }
  }

  // إذا لم يجد OCR تاريخ، ضع تاريخ اليوم تلقائياً
  if (!document.getElementById("invoiceDate").value) {
    const today = new Date().toISOString().split("T")[0];
    document.getElementById("invoiceDate").value = today;
  }
}

// ==================================
// إضافة الفاتورة
// ==================================
document.getElementById("invoiceForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const file = document.getElementById("invoiceImage").files[0];
  if (!file) return alert("يرجى اختيار صورة الفاتورة أولاً");

  if (!document.getElementById("invoiceName").value.trim()) {
    return alert("يرجى إدخال اسم الفاتورة");
  }
  if (!document.getElementById("invoiceAmount").value.trim()) {
    return alert("يرجى إدخال مبلغ الفاتورة");
  }
  if (!document.getElementById("invoiceDate").value.trim()) {
    const today = new Date().toISOString().split("T")[0];
    document.getElementById("invoiceDate").value = today;
  }

  try {
    const path = `invoices/${currentUser.uid}/${Date.now()}_${file.name}`;
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);

    await addDoc(collection(db, "invoices"), {
      userId: currentUser.uid,
      name: document.getElementById("invoiceName").value,
      amount: Number(document.getElementById("invoiceAmount").value),
      date: document.getElementById("invoiceDate").value,
      warranty: document.getElementById("invoiceWarranty").value,
      imageUrl: url,
      createdAt: new Date()
    });

    document.getElementById("invoiceForm").reset();
    alert("✅ تمت إضافة الفاتورة بنجاح");
    loadInvoices();
  } catch (err) {
    console.error("Add Invoice Error:", err);
    alert("حدث خطأ أثناء حفظ الفاتورة");
  }
});

// ==================================
// تحميل الفواتير
// ==================================
async function loadInvoices() {
  invoiceList.innerHTML = "";
  let totalExpenses = 0;

  const q = query(collection(db, "invoices"), where("userId", "==", currentUser.uid));
  const res = await getDocs(q);

  if (res.empty) {
    invoiceList.innerHTML = "<tr><td colspan='6'>لا توجد فواتير بعد</td></tr>";
    updateChart([0]);
    totalSpentDisplay.textContent = "0 ريال";
    return;
  }

  res.forEach((d) => {
    const data = d.data();
    totalExpenses += data.amount;

    invoiceList.innerHTML += `
      <tr>
        <td>${data.name}</td>
        <td>${data.amount} ريال</td>
        <td>${data.date}</td>
        <td>${data.warranty || "-"}</td>
        <td><a href="${data.imageUrl}" target="_blank">📄 عرض</a></td>
        <td><button class="delete-btn" data-id="${d.id}">🗑️ حذف</button></td>
      </tr>`;
  });

  document.querySelectorAll(".delete-btn").forEach((btn) =>
    btn.addEventListener("click", async (e) => {
      await deleteDoc(doc(db, "invoices", e.target.dataset.id));
      loadInvoices();
    })
  );

  totalSpentDisplay.textContent = `${totalExpenses} ريال`;
  updateChart([totalExpenses]);
}

// ==================================
// التحليل المالي (الرسم البياني)
// ==================================
function updateChart(data) {
  if (chart) chart.destroy();

  const ctx = document.getElementById("expenseChart");
  chart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["إجمالي المصروفات"],
      datasets: [
        {
          label: "ريال 📊",
          data: data,
          backgroundColor: "#2b5b7b"
        }
      ]
    },
    options: { responsive: true }
  });
}

// ==================================
// تسجيل الخروج
// ==================================
document.getElementById("logoutBtn").addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "login.html";
});
