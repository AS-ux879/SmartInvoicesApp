/* ===================================
   dashboard.js — FINAL WORKING VERSION
   =================================== */

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

let currentUser;
let chart;
const invoiceList = document.getElementById("invoiceList");
const totalSpentDisplay = document.getElementById("totalSpent");

// ========================= USER LOGIN =========================
onAuthStateChanged(auth, async (user) => {
  if (!user) return (window.location.href = "login.html");
  currentUser = user;

  // عرض الاسم فقط وليس الإيميل كامل
  document.getElementById("userName").textContent =
    user.displayName || user.email.split("@")[0];

  loadInvoices();
});

// ========================= ADD INVOICE =========================
document.getElementById("invoiceForm").addEventListener("submit", async (e) => {
  e.preventDefault(); // منع إعادة تحميل الصفحة

  const file = invoiceImage.files[0];
  const name = invoiceName.value.trim();
  const amount = invoiceAmount.value.trim();
  const date = invoiceDate.value.trim() || new Date().toISOString().split("T")[0];
  const warranty = invoiceWarranty.value.trim() || "-";

  if (!name || !amount) {
    alert("يرجى إدخال اسم ومبلغ الفاتورة");
    return;
  }

  let imageUrl = "-";
  if (file) {
    const fileRef = ref(storage, `invoices/${currentUser.uid}/${Date.now()}_${file.name}`);
    await uploadBytes(fileRef, file);
    imageUrl = await getDownloadURL(fileRef);
  }

  await addDoc(collection(db, "invoices"), {
    userId: currentUser.uid,
    name,
    amount: Number(amount),
    date,
    warranty,
    imageUrl,
    createdAt: new Date()
  });

  invoiceForm.reset();
  loadInvoices();
});

// ========================= LOAD INVOICES =========================
async function loadInvoices() {
  invoiceList.innerHTML = "";
  let total = 0;
  const values = [];

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
        <td>${data.warranty}</td>
        <td>${data.imageUrl !== "-" ? `<a href="${data.imageUrl}" target="_blank">📄</a>` : "-"}</td>
        <td><button onclick="deleteInvoice('${docSnap.id}')">🗑️</button></td>
      </tr>`;
  });

  totalSpentDisplay.textContent = `${total} ريال`;
  updateChart(values);
}

// ========================= DELETE =========================
window.deleteInvoice = async (id) => {
  await deleteDoc(doc(db, "invoices", id));
  loadInvoices();
};

// ========================= CHART =========================
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

// ========================= LOGOUT =========================
logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "login.html";
});
