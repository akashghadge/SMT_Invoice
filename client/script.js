// Login functionality
const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", function (e) {
    e.preventDefault();
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    if (username === "admin" && password === "admin123") {
      localStorage.setItem("currentUser", "admin");
      window.location.href = "admin.html";
    } else if (username && password) {
      localStorage.setItem("currentUser", username);
      window.location.href = "dashboard.html";
    } else {
      alert("Invalid username or password");
    }
  });
}

// Display username on dashboard
const usernameSpan = document.getElementById("username");
if (usernameSpan) {
  usernameSpan.textContent = localStorage.getItem("currentUser");
}

// Invoice Generator functionality
function addInvoiceRow() {
  const invoiceBody = document.getElementById("invoiceBody");
  const row = invoiceBody.insertRow();
  const currentDate = new Date().toISOString().split("T")[0];
  const invoiceNo = "INV-" + Math.floor(Math.random() * 1000000);

  row.innerHTML = `
        <td>${invoiceBody.rows.length}</td>
        <td>${currentDate}</td>
        <td>${invoiceNo}</td>
        <td>
            <select required>
                <option value="">Select Party Code</option>
                <option value="PC001">PC001</option>
                <option value="PC002">PC002</option>
                <option value="PC003">PC003</option>
            </select>
        </td>
        <td><input type="file" accept="image/*" required></td>
        <td><input type="text"></td>
        <td><button onclick="completeInvoice(this)">Complete</button></td>
        <td></td>
    `;
}

function completeInvoice(button) {
  const row = button.parentNode.parentNode;
  const fileInput = row.querySelector('input[type="file"]');
  const partyCode = row.querySelector("select").value;

  if (fileInput.files.length > 0 && partyCode) {
    const currentTime = new Date().toLocaleTimeString();
    row.lastElementChild.textContent = currentTime;
    button.disabled = true;
    saveInvoiceData(row);
  } else {
    alert("Please upload an image and select a party code");
  }
}

// Item Check functionality
function loadItemCheckData() {
  const itemCheckBody = document.getElementById("itemCheckBody");
  const invoices = JSON.parse(localStorage.getItem("invoices")) || [];

  invoices.forEach((invoice, index) => {
    const row = itemCheckBody.insertRow();
    row.innerHTML = `
            <td>${index + 1}</td>
            <td>${invoice.invoiceNo}</td>
            <td>${invoice.partyCode}</td>
            <td>Medical Name</td>
            <td>City Name</td>
            <td>${invoice.billImage}</td>
            <td>${invoice.remarks}</td>
            <td><button onclick="completeItemCheck(this)">Complete</button></td>
            <td></td>
        `;
  });
}

function completeItemCheck(button) {
  const row = button.parentNode.parentNode;
  const currentTime = new Date().toLocaleTimeString();
  row.lastElementChild.textContent = currentTime;
  button.disabled = true;
  saveItemCheckData(row);
}

// Item Packing functionality
function loadItemPackingData() {
  const itemPackingBody = document.getElementById("itemPackingBody");
  const checkedItems = JSON.parse(localStorage.getItem("checkedItems")) || [];

  checkedItems.forEach((item, index) => {
    const row = itemPackingBody.insertRow();
    row.innerHTML = `
            <td>${index + 1}</td>
            <td>${item.invoiceNo}</td>
            <td>${item.partyCode}</td>
            <td>${item.medicalName}</td>
            <td>${item.cityName}</td>
            <td>${item.billImage}</td>
            <td>${item.remarks}</td>
            <td><button onclick="pickItem(this)">Pick</button></td>
            <td><button onclick="deliverItem(this)" disabled>Deliver</button></td>
            <td></td>
        `;
  });
}

function pickItem(button) {
  const row = button.parentNode.parentNode;
  const currentTime = new Date().toLocaleTimeString();
  row.cells[7].textContent = currentTime;
  button.disabled = true;
  row.cells[8].querySelector("button").disabled = false;
  saveItemPackingData(row, "picked");
}

function deliverItem(button) {
  const row = button.parentNode.parentNode;
  const currentTime = new Date().toLocaleTimeString();
  row.cells[8].textContent = currentTime;
  button.disabled = true;
  saveItemPackingData(row, "delivered");
}

// Admin functionality
function loadAdminData() {
  const adminBody = document.getElementById("adminBody");
  const invoices = JSON.parse(localStorage.getItem("invoices")) || [];
  const checkedItems = JSON.parse(localStorage.getItem("checkedItems")) || [];
  const packedItems = JSON.parse(localStorage.getItem("packedItems")) || [];

  invoices.forEach((invoice, index) => {
    const row = adminBody.insertRow();
    const checkedItem = checkedItems.find(
      (item) => item.invoiceNo === invoice.invoiceNo
    );
    const packedItem = packedItems.find(
      (item) => item.invoiceNo === invoice.invoiceNo
    );

    row.innerHTML = `
            <td>${index + 1}</td>
            <td>${invoice.invoiceNo}</td>
            <td>${invoice.partyCode}</td>
            <td>${checkedItem ? checkedItem.medicalName : ""}</td>
            <td>${checkedItem ? checkedItem.cityName : ""}</td>
            <td>${invoice.billImage}</td>
            <td>${invoice.remarks}</td>
            <td>${getStatusSymbol(true)} ${invoice.completedBy} (${
      invoice.completedAt
    })</td>
            <td>${getStatusSymbol(!!checkedItem)} ${
      checkedItem
        ? `${checkedItem.completedBy} (${checkedItem.completedAt})`
        : ""
    }</td>
            <td>${getStatusSymbol(
              !!packedItem && packedItem.status === "picked"
            )} ${
      packedItem && packedItem.status === "picked"
        ? `${packedItem.pickedBy} (${packedItem.pickedAt})`
        : ""
    }</td>
            <td>${getStatusSymbol(
              !!packedItem && packedItem.status === "delivered"
            )} ${
      packedItem && packedItem.status === "delivered"
        ? `${packedItem.deliveredBy} (${packedItem.deliveredAt})`
        : ""
    }</td>
        `;
  });
}

function getStatusSymbol(completed) {
  return completed ? "✅" : "❌";
}

// Load data when page loads
window.addEventListener("load", function () {
  if (window.location.pathname.includes("itemcheck.html")) {
    loadItemCheckData();
  } else if (window.location.pathname.includes("itempacking.html")) {
    loadItemPackingData();
  } else if (window.location.pathname.includes("admin.html")) {
    loadAdminData();
  }
});
