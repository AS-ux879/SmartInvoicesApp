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

// Google Vision API Key — يجب تحديثه بمفتاحك الصحيح
const VISION_KEY = "ضع مفتاح Vision API الذي أعطيتني صورته هنا";

let currentUser;
const invoiceList = document.getElementById("invoiceList");

// التحقق من تسجيل الدخول
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }
  currentUser = user;
  document.getElementById("userName").textContent = "👋 " + (user.email || "مستخدم");
  loadInvoices();
});

// OCR قراءة النص من الفاتورة عند رفع الصورة
document.getElementById("invoiceImage").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  document.getElementById("invoiceName").value = "جاري تحليل الصورة...";
  document.getElementById("invoiceAmount").value = "";
  document.getElementById("invoiceDate").value = "";

  try {
    const tempRef = ref(storage, `ocr/${Date.now()}_${file.name}`);
    await uploadBytes(tempRef, file);
    const imgUrl = await getDownloadURL(tempRef);

    const text = await runOCR(imgUrl);
    fillFields(text);
  } catch (error) {
    console.error(error);
    alert("خطأ في قراءة الفاتورة ❌");
  }
});

// حفظ الفاتورة
document.getElementById("invoiceForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const file = document.getElementById("invoiceImage").files[0];
  if (!file) return alert("اختر صورة الفاتورة أولاً");

  try {
    const storageRef = ref(storage, `invoices/${currentUser.uid}/${Date.now()}_${file.name}`);
    await uploadBytes(storageRef, file);
    const imageUrl = await getDownloadURL(storageRef);

    await addDoc(collection(db, "invoices"), {
      userId: currentUser.uid,
      name: document.getElementById("invoiceName").value,
      amount: Number(document.getElementById("invoiceAmount").value),
      date: document.getElementById("invoiceDate").value,
      warranty: Number(document.getElementById("invoiceWarranty").value),
      imageUrl: imageUrl,
      createdAt: new Date()
    });

    alert("تم إضافة الفاتورة 🌟");
    document.getElementById("invoiceForm").reset();
    loadInvoices();
  } catch (err) {
    console.error(err);
    alert("فشل في الحفظ");
  }
});

// Google Vision OCR
async function runOCR(imageUrl) {
  const res = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${VISION_KEY}`,
    {
      method: "POST",
      body: JSON.stringify({
        requests: [{ image: { source: { imageUri: imageUrl } }, features: [{ type: "TEXT_DETECTION" }] }]
      })
    }
  );

  const json = await res.json();
  return json.responses?.[0]?.fullTextAnnotation?.text || "";
}

// استخراج البيانات تلقائيًا
function fillFields(text) {
  document.getElementById("invoiceName").value = text.split("\n")[0] || "فاتورة بدون اسم";
  document.getElementById("invoiceAmount").value = text.match(/\d+/)?.[0] || "";
  const d = text.match(/\d{1,2}\/\d{1,2}\/\d{2,4}/)?.[0];
  if (d) document.getElementById("invoiceDate").value = new Date(d).toISOString().split("T")[0];
}

// تحميل الفواتير + رسم التحليل المالي
async function loadInvoices() {
  invoiceList.innerHTML = "<tr><td colspan='6'>جاري التحميل...</td></tr>";

  const q = query(collection(db, "invoices"), where("userId", "==", currentUser.uid));
  const snap = await getDocs(q);

  if (snap.empty) {
    invoiceList.innerHTML = "<tr><td colspan='6'>لا توجد فواتير بعد</td></tr>";
    drawChart([]);
    return;
  }

  let amounts = [];
  invoiceList.innerHTML = "";
  snap.forEach((docSnap) => {
    const d = docSnap.data();
    amounts.push(d.amount);

    invoiceList.innerHTML += `
      <tr>
        <td>${d.name}</td>
        <td>${d.amount}</td>
        <td>${d.date}</td>
        <td>${d.warranty || "-"}</td>
        <td><a href="${d.imageUrl}" target="_blank">📄 عرض</a></td>
        <td><button class="del" data-id="${docSnap.id}">🗑️</button></td>
      </tr>`;
  });

  document.querySelectorAll(".del").forEach(b => {
    b.addEventListener("click", async () => {
      await deleteDoc(doc(db, "invoices", b.dataset.id));
      loadInvoices();
    });
  });

  // رسم التحليل المالي
  drawChart(amounts);
}

// رسم الرسم البياني
let chart;
function drawChart(values) {
  if (chart) chart.destroy();
  chart = new Chart(document.getElementById("chart"), {
    type: "bar",
    data: {
      labels: values.map((_, i) => "فاتورة " + (i + 1)),
      datasets: [{
        label: "المبالغ (ريال)",
        data: values
      }]
    }
  });
}

// تسجيل خروج
document.getElementById("logoutBtn").addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "login.html";
});
