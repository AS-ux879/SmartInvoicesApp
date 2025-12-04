/* ============================
   dashboard.js — FINAL PERFECT FIXED VERSION
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
  where,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js";

import {
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.12.3/firebase-storage.js";

// OCR KEY
const VISION_API_KEY = "AIzaSyDEzLQRjRCn60WsUsY-aEFBKZ4Vy1iJceA";

let currentUser;
const invoiceList = document.getElementById("invoiceList");
const totalSpentDisplay = document.getElementById("totalSpent");
let chart;

// التحقق من المستخدم
onAuthStateChanged(auth, async (user) => {
  if (!user) return (window.location.href = "login.html");
  currentUser = user;
  document.getElementById("userName").textContent = user.email;
  loadInvoices();
});

// OCR
document.getElementById("invoiceImage").addEventListener("change", async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  document.getElementById("invoiceName").value = "جاري التحليل...";
  document.getElementById("invoiceAmount").value = "";

  try {
    const tempRef = ref(storage, `ocr/${Date.now()}_${file.name}`);
    await uploadBytes(tempRef, file);
    const url = await getDownloadURL(tempRef);

    const text = await detectText(url);
    fillFields(text);
  } catch (err) {
    alert("فشل استخراج النصوص");
  }
});

async function detectText(url) {
  const res = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${VISION_API_KEY}`,
    {
      method: "POST",
      body: JSON.stringify({
        requests: [{ image: { source: { imageUri: url } }, features: [{ type: "TEXT_DETECTION" }] }]
      })
    }
  );
  const json = await res.json();
  return json.responses?.[0]?.fullTextAnnotation?.text || "";
}

function fillFields(text) {
  const amount = text.match(/\d+/)?.[0] || "";
  document.getElementById("invoiceName").value = text.split("\n")[0] || "فاتورة";
  document.getElementById("invoiceAmount").value = amount;
  document.getElementById("invoiceDate").value = new Date().toISOString().split("T")[0];
}

// إضافة الفاتورة
document.getElementById("addBtn").addEventListener("click", addInvoice);

async function addInvoice() {
  const file = invoiceImage.files[0];
  const name = invoiceName.value.trim();
  const amount = invoiceAmount.value.trim();
  const date = invoiceDate.value.trim();
  const warranty = invoiceWarranty.value.trim();

  if (!file || !name || !amount) {
    alert("أكمل البيانات");
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

    invoiceForm.reset();
    loadInvoices();
  } catch {
    alert("خطأ أثناء الحفظ");
  }
}

// تحميل الفواتير
async function loadInvoices() {
  invoiceList.innerHTML = "";
  let total = 0;
  let values = [];

  const q = query(
    collection(db, "invoices"),
    where("userId", "==", currentUser.uid),
    orderBy("createdAt", "desc")
  );
  
  const res = await getDocs(q);

  if (res.empty) {
    invoiceList.innerHTML = "<tr><td colspan='6'>لا توجد فواتير</td></tr>";
    totalSpentDisplay.textContent = "0 ريال";
    updateChart([]);
    return;
  }

  res.forEach((docSnap) => {
    const data = docSnap.data();
    total += data.amount;
    values.push(data.amount);

    invoiceList.innerHTML += `
      <tr>
        <td>${data.name}</td>
        <td>${data.amount} ريال</td>
        <td>${data.date}</td>
        <td>${data.warranty || '-'}</td>
        <td><a href="${data.imageUrl}" target="_blank">📄</a></td>
        <td><button onclick="deleteInvoice('${docSnap.id}')">🗑️</button></td>
      </tr>`;
  });

  totalSpentDisplay.textContent = `${total} ريال`;
  updateChart(values);
}

// حذف
window.deleteInvoice = async (id) => {
  await deleteDoc(doc(db, "invoices", id));
  loadInvoices();
};

// الرسم البياني
function updateChart(values) {
  if (chart) chart.destroy();

  const ctx = document.getElementById("expenseChart");
  chart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: values.map((_, i) => `فاتورة ${i + 1}`),
      datasets: [{
        label: "ريال",
        data: values,
        backgroundColor: "#2b5b7b"
      }]
    },
    options: { responsive: true }
  });
}

// خروج
logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "login.html";
});
