// ============================
// Dashboard.js — Firestore + Firebase Storage
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
  doc
} from "https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js";

import {
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.12.3/firebase-storage.js";

// تأكد من تسجيل الدخول
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    alert("الرجاء تسجيل الدخول أولاً");
    window.location.href = "login.html";
    return;
  }

  document.getElementById("userName").textContent = user.displayName;

  const form = document.getElementById("invoiceForm");
  const list = document.getElementById("invoiceList");

  const invoicesRef = collection(db, "users", user.uid, "invoices");

  // تحميل الفواتير
  async function loadInvoices() {
    list.innerHTML = "";
    const snapshot = await getDocs(invoicesRef);

    snapshot.forEach((docSnap) => {
      const inv = docSnap.data();
      const row = document.createElement("tr");

      row.innerHTML = `
        <td>${inv.name}</td>
        <td>${inv.amount}</td>
        <td>${inv.date}</td>
        <td>${inv.warranty}</td>
        <td>${inv.imageURL ? `<a href="${inv.imageURL}" target="_blank">📎 View</a>` : "—"}</td>
        <td><button data-id="${docSnap.id}" class="delBtn">🗑️ Delete</button></td>
      `;

      list.appendChild(row);
    });

    // زر الحذف
    document.querySelectorAll(".delBtn").forEach(btn => {
      btn.addEventListener("click", async () => {
        if (confirm("هل أنت متأكد من الحذف؟")) {
          await deleteDoc(doc(db, "users", user.uid, "invoices", btn.dataset.id));
          loadInvoices();
        }
      });
    });
  }

  loadInvoices();

  // إضافة فاتورة
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("invoiceName").value;
    const amount = document.getElementById("invoiceAmount").value;
    const date = document.getElementById("invoiceDate").value;
    const warranty = document.getElementById("invoiceWarranty").value;
    const file = document.getElementById("invoiceImage").files[0];

    let imageURL = "";

    if (file) {
      const storageRef = ref(storage, `invoices/${user.uid}/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      imageURL = await getDownloadURL(storageRef);
    }

    await addDoc(invoicesRef, {
      name,
      amount,
      date,
      warranty,
      imageURL,
      createdAt: new Date()
    });

    form.reset();
    loadInvoices();
  });

});

// تسجيل الخروج
window.logout = function () {
  signOut(auth).then(() => {
    window.location.href = "login.html";
  });
};
