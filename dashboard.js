/* ===================================
   dashboard.js — WORKING FINAL VERSION
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

// ============= GLOBALS =============
let currentUser;
let chart;
const invoiceList = document.getElementById("invoiceList");
const totalSpentDisplay = document.getElementById("totalSpent");

// ============= AUTH CHECK ============
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

// ============= ADD INVOICE ============
document.getElementById("addBtn").addEventListener("click", async () => {
  const name = invoiceName.value.trim();
  const amount = invoiceAmount.value.trim();
  const date = invoiceDate.value.trim() || new Date().toISOString().split("T")[0];
  const warranty = invoiceWarranty.value.trim();
  const file = invoiceImage.files[0];

  if (!name || !amount) {
    alert("يرجى تعبئة اسم ومبلغ الفاتورة");
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
    date,
    warranty: warranty || "-",
    imageUrl,
    createdAt: new Date()
  });

  invoiceForm.reset();
  loadInvoices();
});

// ============= LOAD INVOICES ============
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
    invoiceList.innerHTML = "<tr><td colspan='6'>لا توجد فواتير بعد</td></tr>";
    updateChart([0]);
    totalSpentDisplay.textContent = "0 ريال";
    return;
  }

  res.forEach(docSnap => {
    const d = docSnap.data();
    total += d.amount;
    values.push(d.amount);

    invoiceList.innerHTML += `
      <tr>
        <td>${d.name}</td>
        <td>${d.amount} ريال</td>
        <td>${d.date}</td>
        <td>${d.warranty}</td>
        <td>${d.imageUrl ? `<a href="${d.imageUrl}" target="_blank">📄</a>` : "-"}</td>
        <td><button onclick="deleteInvoice('${docSnap.id}')">🗑️</button></td>
      </tr>`;
  });

  totalSpentDisplay.textContent = `${total} ريال`;
  updateChart(values);
}

// ============= DELETE INVOICE ============
window.deleteInvoice = async (id) => {
  await deleteDoc(doc(db, "invoices", id));
  loadInvoices();
};

// ============= CHART UPDATE ============
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

// ============= LOGOUT ============
logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "login.html";
});
