/* ============================
   dashboard.js — FINAL STABLE VERSION
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

// ————— إصلاح مفتاح Vision API —————
const VISION_API_KEY = "AIzaSyDEzLQRjRCn60WsUsY-aEFBKZ4Vy1iJceA";

let currentUser;
const invoiceList = document.getElementById("invoiceList");
const totalSpentDisplay = document.getElementById("totalSpent");

// مراقبة حالة تسجيل الدخول
onAuthStateChanged(auth, async (user) => {
  if (!user) return (window.location.href = "login.html");
  currentUser = user;
  document.getElementById("userName").textContent = user.email;
  loadInvoices();
});

// ——— OCR عند رفع الصورة ———
document.getElementById("invoiceImage").addEventListener("change", async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  document.getElementById("invoiceName").value = "جاري تحليل الفاتورة...";
  document.getElementById("invoiceAmount").value = "";
  document.getElementById("invoiceDate").value = "";

  try {
    const tempRef = ref(storage, `temp/${Date.now()}_${file.name}`);
    await uploadBytes(tempRef, file);
    const url = await getDownloadURL(tempRef);

    const text = await detectText(url);
    fillFields(text);
  } catch (err) {
    console.error("OCR ERROR:", err);
    alert("حدث خطأ أثناء قراءة الصورة");
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
  const amount = text.match(/\d{2,6}/)?.[0] || "";
  const foundDate = text.match(/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/)?.[0];

  document.getElementById("invoiceName").value = text.split("\n")[0] || "فاتورة";
  document.getElementById("invoiceAmount").value = amount;
  document.getElementById("invoiceDate").value =
    foundDate ? new Date(foundDate).toISOString().split("T")[0] :
    new Date().toISOString().split("T")[0];
}

// ——— إضافة فاتورة ———
document.getElementById("invoiceForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const file = document.getElementById("invoiceImage").files[0];
  if (!file) return alert("اختر صورة الفاتورة أولاً");

  try {
    const invoiceRef = ref(storage, `invoices/${currentUser.uid}/${Date.now()}_${file.name}`);
    await uploadBytes(invoiceRef, file);
    const url = await getDownloadURL(invoiceRef);

    await addDoc(collection(db, "invoices"), {
      userId: currentUser.uid,
      name: document.getElementById("invoiceName").value,
      amount: Number(document.getElementById("invoiceAmount").value),
      date: document.getElementById("invoiceDate").value,
      warranty: document.getElementById("invoiceWarranty").value,
      imageUrl: url,
      createdAt: new Date()
    });

    alert("تمت الإضافة بنجاح ✔️");
    document.getElementById("invoiceForm").reset();
    loadInvoices();
  } catch (err) {
    console.error("ADD ERROR:", err);
    alert("لم يتم الحفظ — تحقق من الاتصال!");
  }
});

// ——— تحميل الفواتير ———
async function loadInvoices() {
  invoiceList.innerHTML = "";
  let total = 0;

  const q = query(collection(db, "invoices"), where("userId", "==", currentUser.uid));
  const data = await getDocs(q);

  if (data.empty) {
    invoiceList.innerHTML = "<tr><td colspan='6'>لا يوجد فواتير بعد</td></tr>";
    totalSpentDisplay.textContent = "0 ريال";
    return;
  }

  data.forEach((d) => {
    const invoice = d.data();
    total += invoice.amount;
    invoiceList.innerHTML += `
      <tr>
        <td>${invoice.name}</td>
        <td>${invoice.amount} ريال</td>
        <td>${invoice.date}</td>
        <td>${invoice.warranty || "-"}</td>
        <td><a href="${invoice.imageUrl}" target="_blank">📄</a></td>
        <td><button onclick="deleteInvoice('${d.id}')">🗑️</button></td>
      </tr>`;
  });

  totalSpentDisplay.textContent = `${total} ريال`;
}

window.deleteInvoice = async (id) => {
  await deleteDoc(doc(db, "invoices", id));
  loadInvoices();
};

// ——— تسجيل الخروج ———
document.getElementById("logoutBtn").addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "login.html";
});
