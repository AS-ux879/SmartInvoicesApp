/* ===================================
   dashboard.js — STABLE SAVE VERSION
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

// ============= DOM ELEMENTS (مهم جداً) =============
const invoiceForm        = document.getElementById("invoiceForm");
const invoiceImageInput  = document.getElementById("invoiceImage");
const invoiceNameInput   = document.getElementById("invoiceName");
const invoiceAmountInput = document.getElementById("invoiceAmount");
const invoiceDateInput   = document.getElementById("invoiceDate");
const invoiceWarrantyInput = document.getElementById("invoiceWarranty");
const addBtn             = document.getElementById("addBtn");
const invoiceList        = document.getElementById("invoiceList");
const totalSpentDisplay  = document.getElementById("totalSpent");
const userNameSpan       = document.getElementById("userName");
const logoutBtn          = document.getElementById("logoutBtn");

let currentUser;
let chart;

// ========================= USER LOGIN =========================
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  currentUser = user;
  // الترحيب بالاسم (أو جزء من الإيميل لو لا يوجد اسم)
  userNameSpan.textContent = user.displayName || user.email.split("@")[0];

  await loadInvoices();
});

// ========================= ADD INVOICE (BY FORM SUBMIT) =========================
invoiceForm.addEventListener("submit", onAddInvoice);
// لضمان العمل حتى لو تم الضغط مباشرة على الزر
addBtn.addEventListener("click", (e) => {
  e.preventDefault();
  onAddInvoice(e);
});

async function onAddInvoice(e) {
  e.preventDefault();

  const file     = invoiceImageInput.files[0];
  const name     = invoiceNameInput.value.trim();
  const amount   = invoiceAmountInput.value.trim();
  const date     = invoiceDateInput.value.trim() || new Date().toISOString().split("T")[0];
  const warranty = invoiceWarrantyInput.value.trim() || "-";

  if (!name || !amount) {
    alert("يرجى إدخال اسم الفاتورة والمبلغ.");
    return;
  }

  let imageUrl = "-";
  try {
    // رفع الصورة (اختياري)
    if (file) {
      const fileRef = ref(storage, `invoices/${currentUser.uid}/${Date.now()}_${file.name}`);
      await uploadBytes(fileRef, file);
      imageUrl = await getDownloadURL(fileRef);
    }

    // حفظ الفاتورة في Firestore
    await addDoc(collection(db, "invoices"), {
      userId: currentUser.uid,
      name,
      amount: Number(amount),
      date,
      warranty,
      imageUrl,
      createdAt: new Date()
    });

    alert("✅ تم حفظ الفاتورة بنجاح");
    invoiceForm.reset();
    await loadInvoices();
  } catch (err) {
    console.error("Add invoice error:", err);
    alert("⚠️ حدث خطأ أثناء حفظ الفاتورة.");
  }
}

// ========================= LOAD INVOICES =========================
async function loadInvoices() {
  invoiceList.innerHTML = "";
  let total = 0;
  const values = [];

  try {
    const q = query(
      collection(db, "invoices"),
      where("userId", "==", currentUser.uid)
      // بدون orderBy حتى لا يطلب Index إضافي
    );

    const res = await getDocs(q);

    if (res.empty) {
      invoiceList.innerHTML = "<tr><td colspan='6'>لا توجد فواتير بعد</td></tr>";
      totalSpentDisplay.textContent = "0 ريال";
      updateChart([]);
      return;
    }

    res.forEach((docSnap) => {
      const data = docSnap.data();
      total  += data.amount || 0;
      values.push(data.amount || 0);

      invoiceList.innerHTML += `
        <tr>
          <td>${data.name}</td>
          <td>${data.amount} ريال</td>
          <td>${data.date || "-"}</td>
          <td>${data.warranty || "-"}</td>
          <td>${data.imageUrl && data.imageUrl !== "-" 
                ? `<a href="${data.imageUrl}" target="_blank">📄</a>` 
                : "-"}</td>
          <td><button onclick="deleteInvoice('${docSnap.id}')">🗑️</button></td>
        </tr>`;
    });

    totalSpentDisplay.textContent = `${total} ريال`;
    updateChart(values);
  } catch (err) {
    console.error("Load invoices error:", err);
    invoiceList.innerHTML = "<tr><td colspan='6'>خطأ في تحميل الفواتير</td></tr>";
    totalSpentDisplay.textContent = "0 ريال";
    updateChart([]);
  }
}

// ========================= DELETE =========================
window.deleteInvoice = async (id) => {
  try {
    await deleteDoc(doc(db, "invoices", id));
    await loadInvoices();
  } catch (err) {
    console.error("Delete invoice error:", err);
    alert("لم يتم حذف الفاتورة.");
  }
};

// ========================= CHART =========================
function updateChart(values) {
  if (chart) chart.destroy();

  const total = values.reduce((a, b) => a + b, 0);
  const ctx = document.getElementById("expenseChart");

  if (!ctx) return;

  chart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["إجمالي المصروفات"],
      datasets: [{
        label: "ريال",
        data: [total],
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
