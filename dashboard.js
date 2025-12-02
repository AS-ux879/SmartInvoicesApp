// ============================
// dashboard.js — FIXED FINAL VERSION
// ============================

import { auth, db, storage } from "./firebase.js";
import {
  onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/10.12.3/firebase-auth.js";

import {
  collection, addDoc, getDocs, deleteDoc, doc, query, where
} from "https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js";

import {
  ref, uploadBytes, getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.12.3/firebase-storage.js";

// Google Vision API
const VISION_API_KEY = "AIzaSyDEzLQRjRCn60WsUsY-aEFBKZ4Vy1iJceA";

let currentUser;
const invoiceList = document.getElementById("invoiceList");

// Check login status
onAuthStateChanged(auth, async (user) => {
  if (!user) return location.href = "login.html";
  currentUser = user;
  document.getElementById("userName").textContent = user.displayName || "مستخدم";
  loadInvoices();
});

// Logout Fix (Button Listener)
document.getElementById("logoutBtn").addEventListener("click", async () => {
  await signOut(auth);
  location.href = "login.html";
});

// Automatic OCR reading
document.getElementById("invoiceImage").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  document.getElementById("invoiceName").value = "جـاري القراءة...";
  document.getElementById("invoiceAmount").value = "";
  document.getElementById("invoiceDate").value = "";

  const tempRef = ref(storage, `tempOCR/${Date.now()}_${file.name}`);
  await uploadBytes(tempRef, file);
  const imgUrl = await getDownloadURL(tempRef);

  const text = await runOCR(imgUrl);
  fillFields(text);
});

// Save invoice
document.getElementById("invoiceForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const file = document.getElementById("invoiceImage").files[0];
  if (!file) return alert("اختر صورة الفاتورة");

  const name = document.getElementById("invoiceName").value.trim();
  const amount = document.getElementById("invoiceAmount").value;
  const date = document.getElementById("invoiceDate").value;
  const warranty = document.getElementById("invoiceWarranty").value;

  if (!name || !amount || !date) return alert("اكمل بقية الحقول");

  const storageRef = ref(storage, `invoices/${currentUser.uid}/${Date.now()}_${file.name}`);
  await uploadBytes(storageRef, file);
  const imgUrl = await getDownloadURL(storageRef);

  await addDoc(collection(db, "invoices"), {
    userId: currentUser.uid,
    name,
    amount,
    date,
    warranty,
    imageUrl: imgUrl,
    createdAt: new Date()
  });

  alert("تم الحفظ بنجاح");
  loadInvoices();
  document.getElementById("invoiceForm").reset();
});

// Google Vision API
async function runOCR(imageUrl) {
  try {
    const response = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${VISION_API_KEY}`,
      {
        method: "POST",
        body: JSON.stringify({
          requests: [{
            image: { source: { imageUri: imageUrl } },
            features: [{ type: "TEXT_DETECTION" }]
          }]
        })
      }
    );
    const json = await response.json();
    return json?.responses?.[0]?.fullTextAnnotation?.text || "";
  } catch (err) {
    console.error("OCR Error", err);
    return "";
  }
}

// Auto-fill invoice fields
function fillFields(text) {
  const price = text.match(/\d{2,6}/)?.[0] || "";
  const foundDate = text.match(/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/)?.[0];

  document.getElementById("invoiceName").value = text.split("\n")[0] || "";
  document.getElementById("invoiceAmount").value = price;
  if (foundDate) {
    document.getElementById("invoiceDate").value =
      new Date(foundDate).toISOString().split("T")[0];
  }
}

// Load invoices
async function loadInvoices() {
  invoiceList.innerHTML = "";
  const q = query(collection(db, "invoices"), where("userId", "==", currentUser.uid));
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    invoiceList.innerHTML = "<tr><td colspan='6'>لا توجد فواتير بعد</td></tr>";
    return;
  }

  snapshot.forEach(docSnap => {
    const d = docSnap.data();
    invoiceList.innerHTML += `
      <tr>
        <td>${d.name}</td>
        <td>${d.amount}</td>
        <td>${d.date}</td>
        <td>${d.warranty}</td>
        <td><a href="${d.imageUrl}" target="_blank">📄</a></td>
        <td><button class="deleteBtn" data-id="${docSnap.id}">🗑️</button></td>
      </tr>
    `;
  });

  document.querySelectorAll(".deleteBtn").forEach(btn => {
    btn.addEventListener("click", async () => {
      await deleteDoc(doc(db, "invoices", btn.dataset.id));
      loadInvoices();
    });
  });
}
