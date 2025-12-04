/* ===================================
   dashboard.js — FINAL FOR PRESENTATION
   =================================== */

import { auth, db, storage } from "./firebase.js";
import {
  onAuthStateChanged,
  signOut,
  updateProfile
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

// ---------------------- تحقق من تسجيل الدخول
onAuthStateChanged(auth, async (user) => {
  if (!user) return (window.location.href = "login.html");

  currentUser = user;
  document.getElementById("userName").textContent =
    user.displayName || "مستخدم";
  loadInvoices();
});

// ---------------------- زر إضافة الفاتورة
document.getElementById("addBtn").addEventListener("click", async () => {
  const name = invoiceName.value.trim();
  const amount = invoiceAmount.value.trim();
  const date = invoiceDate.value.trim();
  const warranty = invoiceWarranty.value.trim();
  const file = invoiceImage.files[0];

  if (!name || !amount) {
    alert("الرجاء إدخال اسم ومبلغ الفاتورة");
    return;
  }

  let imageUrl = "";
  if (file) {
    const fileRef = ref(storage, `invoices/${currentUser.uid}/${Date.now()}_${file.name}`);
    await uploadBytes(fileRef, file);
    imageUrl = await getDownloadURL(fileRef);
  }

  await addDoc(collection(db, "invoices"), {
    userId: currentUser.uid,
    name,
    amount: Number(amount),
    date: date || new Date().toISOString().split("T")[0],
    warranty,
    imageUrl,
    createdAt: new Date()
  });

  invoiceForm.reset();
  loadInvoices();
});

// ---------------------- تحميل الفواتير
async function loadInvoices() {
  invoiceList.innerHTML = "";
  let total = 0;

  const q = query(collection(db, "invoices"), where("userId", "==", currentUser.uid));
  const res = await getDocs(q);

  if (res.empty) {
    invoiceList.innerHTML = "<tr><td colspan='6'>لا توجد فواتير بعد</td></tr>";
    totalSpentDisplay.textContent = "0 ريال";
    updateChart([0]);
    return;
  }

  let values = [];

  res.forEach(docSnap => {
    const d = docSnap.data();
    total += d.amount;
    values.push(d.amount);

    invoiceList.innerHTML += `
      <tr>
        <td>${d.name}</td>
        <td>${d.amount} ريال</td>
        <td>${d.date}</td>
        <td>${d.warranty || '-'}</td>
        <td>${d.imageUrl ? `<a href="${d.imageUrl}" target="_blank">📄</a>` : '-'}</td>
        <td><button onclick="deleteInvoice('${docSnap.id}')">🗑️</button></td>
      </tr>`;
  });

  totalSpentDisplay.textContent = `${total} ريال`;
  updateChart(values);
}

window.deleteInvoice = async (id) => {
  await deleteDoc(doc(db, "invoices", id));
  loadInvoices();
};

// ---------------------- الرسم البياني
function updateChart(values) {
  if (chart) chart.destroy();
  const ctx = document.getElementById("expenseChart");

  chart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["إجمالي المصروفات"],
      datasets: [{
        label: "ريال",
        data: [values.reduce((a, b) => a + b, 0)],
        backgroundColor: "#2b5b7b"
      }]
    },
    options: { responsive: true }
  });
}

// ---------------------- تسجيل الخروج
logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "login.html";
});
