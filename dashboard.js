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

// Vision API
const VISION_API_KEY = "AIzaSyDEzLQRjRCn60WsUsY-aEFBKZ4Vy1iJceA";

let currentUser;
const chartCanvas = document.getElementById("chart");
const invoiceList = document.getElementById("invoiceList");
const warrantyList = document.getElementById("warrantyList");

// Check Login
onAuthStateChanged(auth, (user) => {
  if (!user) location.href = "login.html";
  currentUser = user;
  document.getElementById("userName").innerText = user.email;
  loadInvoices();
});

// Add Invoice
document.getElementById("invoiceForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const file = document.getElementById("invoiceImage").files[0];
  const sRef = ref(storage, `invoices/${currentUser.uid}/${file.name}`);
  await uploadBytes(sRef, file);
  const imgUrl = await getDownloadURL(sRef);

  await addDoc(collection(db, "invoices"), {
    userId: currentUser.uid,
    name: document.getElementById("invoiceName").value,
    amount: +document.getElementById("invoiceAmount").value,
    date: document.getElementById("invoiceDate").value,
    warranty: +document.getElementById("invoiceWarranty").value,
    imageUrl: imgUrl
  });

  loadInvoices();
});

// Load invoices
async function loadInvoices() {
  const q = query(collection(db, "invoices"), where("userId", "==", currentUser.uid));
  const snap = await getDocs(q);

  invoiceList.innerHTML = "";
  let amounts = [], names = [];

  snap.forEach((docSnap) => {
    let d = docSnap.data();

    invoiceList.innerHTML += `
      <tr>
        <td>${d.name}</td>
        <td>${d.amount} ريال</td>
        <td>${d.date}</td>
        <td>${d.warranty} شهر</td>
        <td><a href="${d.imageUrl}" target="_blank">📄</a></td>
        <td><button onclick="del('${docSnap.id}')">🗑️</button></td>
      </tr>`;

    // charts
    names.push(d.name);
    amounts.push(d.amount);

    // warranty alerts
    let exp = new Date(d.date);
    exp.setMonth(exp.getMonth() + d.warranty);
    let left = Math.floor((exp - new Date()) / (1000*60*60*24));
    if (left < 45)
      warrantyList.innerHTML += `<li>⚠️ ${d.name} — ينتهي خلال ${left} يوم</li>`;
  });

  drawChart(names, amounts);
}

window.del = async (id) => {
  await deleteDoc(doc(db, "invoices", id));
  loadInvoices();
};

// Chart
function drawChart(n, a) {
  new Chart(chartCanvas, {
    type: "pie",
    data: { labels: n, datasets: [{ data: a }] }
  });
}

// Logout
document.getElementById("logoutBtn").onclick = () => {
  signOut(auth).then(() => location.href = "login.html");
};
