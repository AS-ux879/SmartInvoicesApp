document.addEventListener("DOMContentLoaded", () => {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user) {
    alert("الرجاء تسجيل الدخول أولاً");
    window.location.href = "login.html";
    return;
  }

  // الترجمات
  const i18n = {
    ar: {
      title: "📊 لوحة الفواتير",
      greet: "مرحبًا",
      name: "اسم الفاتورة:",
      amount: "المبلغ (ريال):",
      date: "التاريخ:",
      warranty: "مدة الضمان (بالأشهر):",
      image: "📷 صورة الضمان:",
      add: "➕ إضافة الفاتورة",
      list: "🧾 قائمة الفواتير",
      thName: "الاسم",
      thAmount: "المبلغ (ريال)",
      thDate: "التاريخ",
      thWarranty: "الضمان (أشهر)",
      thImage: "صورة الضمان",
      thAction: "إجراء",
      capture: "📸 تصوير الفواتير",
      pdf: "📄 حفظ كـ PDF",
      logout: "🚪 تسجيل الخروج",
      langBtn: "🌐 English",
    },
    en: {
      title: "📊 Invoice Dashboard",
      greet: "Hello",
      name: "Invoice Name:",
      amount: "Amount (SAR):",
      date: "Date:",
      warranty: "Warranty (Months):",
      image: "📷 Warranty Image:",
      add: "➕ Add Invoice",
      list: "🧾 Invoice List",
      thName: "Name",
      thAmount: "Amount (SAR)",
      thDate: "Date",
      thWarranty: "Warranty (Months)",
      thImage: "Warranty Image",
      thAction: "Action",
      capture: "📸 Capture Invoices",
      pdf: "📄 Save as PDF",
      logout: "🚪 Logout",
      langBtn: "🌐 العربية",
    }
  };

  let currentLang = localStorage.getItem("lang") || "ar";
  const userName = document.getElementById("userName");
  userName.textContent = user.name;

  function setLang(lang) {
    const t = i18n[lang];
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    document.getElementById("title").textContent = t.title;
    document.getElementById("greet").textContent = t.greet;
    document.getElementById("labelName").textContent = t.name;
    document.getElementById("labelAmount").textContent = t.amount;
    document.getElementById("labelDate").textContent = t.date;
    document.getElementById("labelWarranty").textContent = t.warranty;
    document.getElementById("labelImage").textContent = t.image;
    document.getElementById("addBtn").textContent = t.add;
    document.getElementById("listTitle").textContent = t.list;
    document.getElementById("thName").textContent = t.thName;
    document.getElementById("thAmount").textContent = t.thAmount;
    document.getElementById("thDate").textContent = t.thDate;
    document.getElementById("thWarranty").textContent = t.thWarranty;
    document.getElementById("thImage").textContent = t.thImage;
    document.getElementById("thAction").textContent = t.thAction;
    document.getElementById("captureBtn").textContent = t.capture;
    document.getElementById("pdfBtn").textContent = t.pdf;
    document.getElementById("logoutBtn").textContent = t.logout;
    document.getElementById("langBtn").textContent = t.langBtn;
    localStorage.setItem("lang", lang);
  }

  document.getElementById("langBtn").addEventListener("click", () => {
    currentLang = currentLang === "ar" ? "en" : "ar";
    setLang(currentLang);
  });

  setLang(currentLang);

  // === نظام الفواتير ===
  const form = document.getElementById("invoiceForm");
  const list = document.getElementById("invoiceList");
  let invoices = JSON.parse(localStorage.getItem("invoices")) || [];

  function saveInvoices() {
    localStorage.setItem("invoices", JSON.stringify(invoices));
  }

  function renderInvoices() {
    list.innerHTML = "";
    invoices.forEach((inv, index) => {
      const row = `
        <tr>
          <td>${inv.name}</td>
          <td>${inv.amount}</td>
          <td>${inv.date}</td>
          <td>${inv.warranty}</td>
          <td>${inv.image ? `<a href="${inv.image}" target="_blank">📎 View</a>` : "—"}</td>
          <td><button onclick="deleteInvoice(${index})">🗑️ Delete</button></td>
        </tr>`;
      list.innerHTML += row;
    });
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("invoiceName").value.trim();
    const amount = document.getElementById("invoiceAmount").value.trim();
    const date = document.getElementById("invoiceDate").value.trim();
    const warranty = document.getElementById("invoiceWarranty").value.trim();
    const fileInput = document.getElementById("invoiceImage");
    let imageBase64 = "";

    if (!name || !amount || !date || !warranty) {
      alert("يرجى تعبئة جميع الحقول قبل الإضافة.");
      return;
    }

    if (fileInput.files.length > 0) {
      const file = fileInput.files[0];
      imageBase64 = await toBase64(file);
    }

    invoices.push({ name, amount, date, warranty, image: imageBase64 });
    saveInvoices();
    renderInvoices();
    form.reset();
  });

  renderInvoices();

  window.deleteInvoice = (index) => {
    if (confirm("هل أنت متأكد من حذف هذه الفاتورة؟")) {
      invoices.splice(index, 1);
      saveInvoices();
      renderInvoices();
    }
  };

  // تصوير الفواتير
  document.getElementById("captureBtn").addEventListener("click", async () => {
    const table = document.querySelector("table");
    const canvas = await html2canvas(table);
    const link = document.createElement("a");
    link.download = "invoices.png";
    link.href = canvas.toDataURL();
    link.click();
  });

  // حفظ PDF
  document.getElementById("pdfBtn").addEventListener("click", () => {
    const element = document.querySelector("table");
    const opt = {
      margin: 0.5,
      filename: "invoices.pdf",
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: "in", format: "a4", orientation: "portrait" }
    };
    html2pdf().from(element).set(opt).save();
  });
});

function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
  });
}

function logout() {
  localStorage.removeItem("user");
  window.location.href = "login.html";
}
