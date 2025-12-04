/* ============================
   dashboard.js — FINAL WORKING VERSION (No UI Change)
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

// 🔹 OCR API
const VISION_API_KEY = "AIzaSyDEzLQRjRCn60WsUsY-aEFBKZ4Vy1iJceA";

let currentUser;
const invoiceList = document.getElementById("invoiceList");

// ============================
// التحقق من المستخدم
// ============================
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }
  currentUser = user;
  document.getElementById("userName").textContent = user.email;
  loadInvoices();
});

// ============================
// تشغيل OCR عند تحميل صورة
// ============================
document.getElementById("invoiceImage").addEventListener("change", async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  document.getElementById("invoiceName").value = "جاري قراءة الفاتورة...";
  document.getElementById("invoiceAmount").value = "";
  document.getElementById("invoiceDate").value = "";

  try {
    const tempRef = ref(storage, `ocr/${Date.now()}_${file.name}`);
    await uploadBytes(tempRef, file);
    const url = await getDownloadURL(tempRef);

    const text = await detectText(url);
    fillFields(text);
  } catch (err) {
    console.error(err);
    alert("حدث خطأ أثناء قراءة الفاتورة");
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
  const amount = text.match(/\d+/)?.[0] || "";
  const date = text.match(/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/)?.[0];

  document.getElementById("invoiceName").value = text.split("\n")[0] || "فاتورة";
  document.getElementById("invoiceAmount").value = amount;
  document.getElementById("invoiceDate").value =
    date ? new Date(date).toISOString().split("T")[0] :
    new Date().toISOString().split("T")[0];
}

// ============================
// زر إضافة الفاتورة – FIXED
// ============================
document.getElementById("addBtn").addEventListener("click", addInvoice);

async function addInvoice() {
  const file = document.getElementById("invoiceImage").files[0];
  const name = document.getElementById("invoiceName").value.trim();
  const amount = document.getElementById("invoiceAmount").value.trim();
  const date = document.getElementById("invoiceDate").value.trim();
  const warranty = document.getElementById("invoiceWarranty").value.trim();

  if (!file) return alert("اختر صورة الفاتورة أولاً");
  if (!name) return alert("يرجى إدخال اسم الفاتورة");
  if (!amount) return alert("يرجى إدخال مبلغ الفاتورة");

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

    alert("✔️ تمت الإضافة بنجاح");
    document.getElementById("invoiceForm").reset();
    loadInvoices();
  } catch (err) {
    console.error(err);
    alert("⚠️ لم يتم الحفظ");
  }
}

// ============================
// تحميل الفواتير
// ============================
async function loadInvoices() {
  invoiceList.innerHTML = "";
  let total = 0;

  const q = query(collection(db, "invoices"), where("userId", "==", currentUser.uid));
  const data = await getDocs(q);

  if (data.empty) {
    invoiceList.innerHTML = "<tr><td colspan='6'>لا توجد فواتير بعد</td></tr>";
    return;
  }

  data.forEach((d) => {
    const inv = d.data();
    total += inv.amount;

    invoiceList.innerHTML += `
      <tr>
        <td>${inv.name}</td>
        <td>${inv.amount} ريال</td>
        <td>${inv.date}</td>
        <td>${inv.warranty || "-"}</td>
        <td><a href="${inv.imageUrl}" target="_blank">📄</a></td>
        <td><button onclick="deleteInvoice('${d.id}')">🗑️</button></td>
      </tr>`;
  });
}

window.deleteInvoice = async (id) => {
  await deleteDoc(doc(db, "invoices", id));
  loadInvoices();
};

// ============================
// تسجيل الخروج
// ============================
document.getElementById("logoutBtn").addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "login.html";
});
