/* ===================================
   dashboard.js — STABLE PRODUCTION VERSION
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
  where
} from "https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js";

import {
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.12.3/firebase-storage.js";

let currentUser;
let chart;

// ========================= USER AUTH =========================
onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  currentUser = user;
  document.getElementById("userName").textContent =
    user.displayName || user.email.split("@")[0];

  loadInvoices();
});

// ========================= ADD INVOICE =========================
document.getElementById("addBtn").addEventListener("click", async () => {
  const file = invoiceImage.files[0];
  const name = invoiceName.value.trim();
  const amount = invoiceAmount.value.trim();
  const date = invoiceDate.value.trim() || new Date().toISOString().split("T")[0];
  const warranty = invoiceWarranty.value.trim() || "-";

  if (!name || !amount) {
    alert("يرجى تعبئة اسم ومبلغ الفاتورة");
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
    imageUrl
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
    where("userId", "==", currentUser.uid)
  );

  const res = await getDocs(q);

  if (res.empty) {
    invoiceList.innerHTML = "<tr><td colspan='6'>لا توجد فواتير بعد</td></tr>";
    totalSpentDisplay.textContent = "0 ريال";
    updateChart([0]);
    return;
  }

  res.forEach((docSnap) => {
    const d = docSnap.data();
    total += d.amount;
    values.push(d.amount);

    invoiceList.innerHTML += `
      <tr>
        <td>${d.name}</td>
        <td>${d.amount} ريال</td>
        <td>${d.date}</td>
        <td>${d.warranty}</td>
        <td>${d.imageUrl !== "-" ? `<a href="${d.imageUrl}" target="_blank">📄</a>` : "-"}</td>
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
