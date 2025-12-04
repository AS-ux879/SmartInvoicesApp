/* ============================
   dashboard.js — FINAL PERFECT VERSION
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

const VISION_API_KEY = "AIzaSyDEzLQRjRCn60WsUsY-aEFBKZ4Vy1iJceA";

let currentUser;
const invoiceList = document.getElementById("invoiceList");
const totalSpentDisplay = document.getElementById("totalSpent");
let chart;

// ============================
// التحقق من المستخدم
// ============================
onAuthStateChanged(auth, async (user) => {
  if (!user) return (window.location.href = "login.html");
  currentUser = user;
  document.getElementById("userName").textContent = user.email;
  loadInvoices();
});

// ============================
// قراءة الفاتورة OCR
// ============================
document.getElementById("invoiceImage").addEventListener("change", async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  document.getElementById("invoiceName").value = "جاري تحليل الفاتورة...";
  document.getElementById("invoiceAmount").value = "";
  document.getElementById("invoiceDate").value = "";

  try {
    const tempRef = ref(storage, `ocr/${Date.now()}_${file.name}`);
    await uploadBytes(tempRef, file);
    const url = await getDownloadURL(tempRef);

    const text = await detectText(url);
    fillFields(text);
  } catch {
    alert("خطأ أثناء قراءة الصورة");
  }
});

async function detectText(imgUrl) {
  const response = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${VISION_API_KEY}`,
    {
      method: "POST",
      body: JSON.stringify({
        requests: [{ image: { source: { imageUri: imgUrl } }, features: [{ type: "TEXT_DETECTION" }] }]
      })
    }
  );
  const result = await response.json();
  return result.responses?.[0]?.fullTextAnnotation?.text || "";
}

function fillFields(text) {
  const amount = text.match(/\d+/)?.[0] || "";
  document.getElementById("invoiceName").value = text.split("\n")[0] || "فاتورة";
  document.getElementById("invoiceAmount").value = amount;
  document.getElementById("invoiceDate").value = new Date().toISOString().split("T")[0];
}

// ============================
// إضافة الفاتورة
// ============================
document.getElementById("addBtn").addEventListener("click", async () => {
  const file = document.getElementById("invoiceImage").files[0];
  const name = document.getElementById("invoiceName").value.trim();
  const amount = document.getElementById("invoiceAmount").value.trim();
  const date = document.getElementById("invoiceDate").value.trim();
  const warranty = document.getElementById("invoiceWarranty").value.trim();

  if (!file || !name || !amount) {
    alert("يرجى إدخال جميع البيانات");
    return;
  }

  try {
    const fileRef = ref(storage, `invoices/${currentUser.uid}/${Date.now()}_${file.name}`);
    await uploadBytes(fileRef, file);
    const url = await getDownloadURL(fileRef);

    await addDoc(collection(db, "invoices"), {
      userId: currentUser.uid,
      name,
      amount: Number(amount),
      date,
      warranty,
      imageUrl: url,
      createdAt: new Date()
    });

    alert("✔️ تم الحفظ بنجاح");
    document.getElementById("invoiceForm").reset();
    loadInvoices();
  } catch {
    alert("⚠️ لم يتم الحفظ — تحقق من الاتصال");
  }
});

// ============================
// تحميل الفواتير + التحليل المالي
// ============================
async function loadInvoices() {
  invoiceList.innerHTML = "";
  let total = 0;
  let values = [];

  const q = query(collection(db, "invoices"), where("userId", "==", currentUser.uid));
  const data = await getDocs(q);

  if (data.empty) {
    invoiceList.innerHTML = "<tr><td colspan='6'>لا توجد فواتير بعد</td></tr>";
    totalSpentDisplay.textContent = "0 ريال";
    updateChart([0]);
    return;
  }

  data.forEach((d) => {
    const inv = d.data();
    total += inv.amount;
    values.push(inv.amount);

    invoiceList.innerHTML += `
      <tr>
        <td>${inv.name}</td>
        <td>${inv.amount} ريال</td>
        <td>${inv.date}</td>
        <td>${inv.warranty || '-'}</td>
        <td><a href="${inv.imageUrl}" target="_blank">📄</a></td>
        <td><button onclick="deleteInvoice('${d.id}')">🗑️</button></td>
      </tr>`;
  });

  totalSpentDisplay.textContent = `${total} ريال`;
  updateChart(values);
}

window.deleteInvoice = async (id) => {
  await deleteDoc(doc(db, "invoices", id));
  loadInvoices();
};

// ============================
// الرسم البياني
// ============================
function updateChart(data) {
  if (chart) chart.destroy();
  const ctx = document.getElementById("expenseChart");

  chart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["إجمالي المصروفات"],
      datasets: [{ data, backgroundColor: "#2b5b7b", label: "ريال" }]
    },
    options: { responsive: true }
  });
}

// ============================
// تسجيل الخروج
// ============================
document.getElementById("logoutBtn").addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "login.html";
});
