// main.js - frontend logic for SmartBill (Option B: normal tables + emoji action icons)

const API_BASE = ""; // set if you have backend endpoints

// State
let products = [];
let billCart = [];
let payments = [];
let invoices = [];

// Helpers
const $ = id => document.getElementById(id);
const formatCurrency = v => "₹" + Number(v || 0).toFixed(2);

// DOM refs
const leftCol = $("leftCol");
const productSelect = $("productSelect");
const itemQuantity = $("itemQuantity");
const btnAddItem = $("btnAddItem");
const billItemsBody = $("billItemsBody");

const splitToggle = $("splitToggle");
const paymentsRow = document.querySelector(".payments-row");
const paymentsContainer = $("paymentsContainer");
const newPaymentMethod = $("newPaymentMethod");
const newPaymentAmount = $("newPaymentAmount");
const newPaymentRef = $("newPaymentRef");
const btnAddPayment = $("btnAddPayment");
const paymentMsg = $("paymentMsg");

const cashReceivedGroup = document.querySelector(".cash-received-group");
const cashReceivedInput = $("cashReceived");
const paymentModeSelect = $("paymentMode");

const rightSubtotal = $("billSubtotalRight");
const rightTax = $("billTaxRight");
const rightDiscount = $("billDiscountRight");
const rightNet = $("billNetRight");
const rightPaid = $("billPaidRight");
const rightChange = $("changeDueRight");

const btnOpenProductForm = $("btnOpenProductForm");
const inventoryTableBody = $("inventoryTableBody");
const inventorySearch = $("inventorySearch");

const productModal = $("productModal");
const btnCloseProductModal = $("btnCloseProductModal");
const btnCancelProduct = $("btnCancelProduct");
const productForm = $("productForm");
const productFormMessage = $("productFormMessage");

const statTotalProducts = $("statTotalProducts");
const statLowStock = $("statLowStock");
const statTodayInvoices = $("statTodayInvoices");
const statTodayRevenue = $("statTodayRevenue");

const toast = $("toast");

// fallback demo products
async function loadProducts() {
  try {
    if (API_BASE) {
      const res = await fetch(`${API_BASE}/products`);
      if (!res.ok) throw new Error("Failed to load products");
      products = await res.json();
    } else {
      if (!products.length) {
        products = [
          { id: 1, name: "Notebook A5", category: "Stationery", price: 50, stockQty: 117, unit: "pcs", taxPercent: 0, reorderLevel: 5 },
          { id: 2, name: "Ball Pen Blue", category: "Stationery", price: 10, stockQty: 300, unit: "pcs", taxPercent: 0, reorderLevel: 10 },
          { id: 3, name: "Eraser", category: "Stationery", price: 5, stockQty: 200, unit: "pcs", taxPercent: 0, reorderLevel: 20 }
        ];
      }
    }
  } catch (e) {
    console.warn("loadProducts error", e);
    if (!products.length) products = [
      { id: 1, name: "Notebook A5", category: "Stationery", price: 50, stockQty: 117, unit: "pcs", taxPercent: 0, reorderLevel: 5 },
      { id: 2, name: "Ball Pen Blue", category: "Stationery", price: 10, stockQty: 300, unit: "pcs", taxPercent: 0, reorderLevel: 10 },
      { id: 3, name: "Eraser", category: "Stationery", price: 5, stockQty: 200, unit: "pcs", taxPercent: 0, reorderLevel: 20 }
    ];
  }
  populateProductDropdown();
  renderProducts();
  updateStats();
}

function populateProductDropdown() {
  if (!productSelect) return;
  productSelect.innerHTML = "";
  products.forEach(p => {
    const o = document.createElement("option");
    o.value = p.id;
    o.textContent = `${p.name} (₹${p.price} | stock:${p.stockQty})`;
    productSelect.appendChild(o);
  });
}

function escapeHtml(str) {
  return String(str || "").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;");
}

// Render inventory - normal table. Edit & Delete icons are emoji-based.
function renderProducts() {
  if (!inventoryTableBody) return;
  const q = (inventorySearch && inventorySearch.value || "").trim().toLowerCase();
  inventoryTableBody.innerHTML = "";

  products.filter(p => {
    if (!q) return true;
    return (p.name + " " + (p.category || "")).toLowerCase().includes(q);
  }).forEach(p => {
    const tr = document.createElement("tr");
    const low = p.reorderLevel && p.stockQty <= p.reorderLevel;

    // actions: emoji icon buttons
    const actions = document.createElement("div");
    actions.style.display = "flex";
    actions.style.gap = "8px";
    actions.style.justifyContent = "flex-end";
    actions.style.alignItems = "center";

    const editBtn = document.createElement("button");
    editBtn.className = "action-icon-btn edit-ico";
    editBtn.type = "button";
    editBtn.title = "Edit";
    editBtn.innerText = "✏️";
    editBtn.dataset.action = "edit";
    editBtn.dataset.id = p.id;

    const delBtn = document.createElement("button");
    delBtn.className = "action-icon-btn delete-ico";
    delBtn.type = "button";
    delBtn.title = "Delete";
    delBtn.innerText = "🗑️";
    delBtn.dataset.action = "delete";
    delBtn.dataset.id = p.id;

    actions.appendChild(editBtn);
    actions.appendChild(delBtn);

    tr.innerHTML = `
      <td>${escapeHtml(p.name)}</td>
      <td>${escapeHtml(p.category || "-")}</td>
      <td style="text-align:right">${formatCurrency(p.price)}</td>
      <td style="text-align:center">${p.stockQty}</td>
      <td style="text-align:center">${escapeHtml(p.unit || "-")}</td>
      <td style="text-align:center">${low ? '<span class="status-low">Low</span>' : '<span class="status-ok">OK</span>'}</td>
      <td></td>
    `;
    tr.querySelector("td:last-child").appendChild(actions);
    inventoryTableBody.appendChild(tr);
  });
}

// Update stats
function updateStats() {
  if (statTotalProducts) statTotalProducts.textContent = products.length;
  if (statLowStock) statLowStock.textContent = products.filter(p => p.reorderLevel && p.stockQty <= p.reorderLevel).length;
  if (statTodayInvoices || statTodayRevenue) {
    const today = new Date().toISOString().slice(0,10);
    let tcount=0,trev=0;
    invoices.forEach(i => { if (i.dateTime && i.dateTime.slice(0,10)===today) { tcount++; trev+=Number(i.netAmount||0); }});
    if (statTodayInvoices) statTodayInvoices.textContent = tcount;
    if (statTodayRevenue) statTodayRevenue.textContent = formatCurrency(trev);
  }
}

// Billing
function addItemToBill() {
  if (!products.length) return;
  const pid = Number(productSelect.value);
  const qty = Number(itemQuantity.value || 1);
  const prod = products.find(p => p.id === pid);
  if (!prod) return;
  if (qty < 1) return;
  if (qty > prod.stockQty) {
    alert(`Insufficient stock (${prod.stockQty})`);
    return;
  }
  const price = Number(prod.price);
  const taxPercent = Number(prod.taxPercent || 0);
  const lineBase = price * qty;
  const lineTax = (lineBase * taxPercent) / 100;
  const lineTotal = Number((lineBase + lineTax).toFixed(2));
  billCart.push({ productId: prod.id, productName: prod.name, quantity: qty, priceAtSale: price, taxPercentAtSale: taxPercent, lineBase, lineTax, lineTotal });
  renderBillCart();
}

function renderBillCart() {
  if (!billItemsBody) return;
  billItemsBody.innerHTML = "";
  billCart.forEach((it, idx) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${escapeHtml(it.productName)}</td>
      <td style="text-align:center"><input class="qty-input" type="number" data-index="${idx}" value="${it.quantity}" min="1" /></td>
      <td style="text-align:right">${formatCurrency(it.priceAtSale)}</td>
      <td style="text-align:center">${it.taxPercentAtSale}%</td>
      <td style="text-align:right">${formatCurrency(it.lineTotal)}</td>
      <td style="text-align:right"><button class="ghost-btn remove-item" data-index="${idx}">Remove</button></td>`;
    billItemsBody.appendChild(tr);
  });

  // qty listeners
  billItemsBody.querySelectorAll(".qty-input").forEach(inp => {
    inp.addEventListener("input", (e) => {
      const idx = Number(e.target.dataset.index);
      let val = Number(e.target.value || 1);
      if (val < 1) val = 1;
      const item = billCart[idx];
      item.quantity = val;
      item.lineBase = item.priceAtSale * val;
      item.lineTax = (item.lineBase * item.taxPercentAtSale) / 100;
      item.lineTotal = Number((item.lineBase + item.lineTax).toFixed(2));
      renderBillCart();
    });
  });

  billItemsBody.querySelectorAll(".remove-item").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const idx = Number(btn.dataset.index);
      if (!isNaN(idx)) { billCart.splice(idx,1); renderBillCart(); }
    });
  });

  syncRightNow();
}

// Payments
function renderPayments() {
  if (!paymentsContainer) return;
  paymentsContainer.innerHTML = "";
  payments.forEach((p, idx) => {
    const el = document.createElement("div");
    el.style.display = "flex";
    el.style.gap = "8px";
    el.style.alignItems = "center";
    el.innerHTML = `<div style="flex:1">${escapeHtml(p.method)} — ${formatCurrency(p.amount)} ${p.reference ? "(" + escapeHtml(p.reference) + ")" : ""}</div><button class="ghost-btn" data-idx="${idx}">Remove</button>`;
    paymentsContainer.appendChild(el);
    el.querySelector("button").addEventListener("click", () => {
      payments.splice(idx,1); renderPayments(); syncRightNow();
    });
  });
  syncRightNow();
}

if (btnAddPayment) btnAddPayment.addEventListener("click", (e) => {
  e.preventDefault();
  if (!(splitToggle && splitToggle.checked)) { paymentMsg.textContent = "Enable split payments to add payments."; return; }
  const method = (newPaymentMethod && newPaymentMethod.value) || "Cash";
  const amount = Number((newPaymentAmount && newPaymentAmount.value) || 0);
  const ref = (newPaymentRef && newPaymentRef.value) || "";
  if (!amount || amount <= 0) { paymentMsg.textContent = "Enter valid amount"; return; }
  payments.push({ method, amount, reference: ref });
  newPaymentAmount.value = ""; newPaymentRef.value = "";
  paymentMsg.textContent = "";
  renderPayments();
});

function updatePaymentUI_safe() {
  if (splitToggle && splitToggle.checked) {
    if (paymentsRow) paymentsRow.style.display = "";
    if (cashReceivedGroup) cashReceivedGroup.style.display = "none";
  } else {
    if (paymentsRow) paymentsRow.style.display = "none";
    if (paymentModeSelect && paymentModeSelect.value === "Cash") {
      if (cashReceivedGroup) cashReceivedGroup.style.display = "";
    } else {
      if (cashReceivedGroup) cashReceivedGroup.style.display = "none";
      if (cashReceivedInput) cashReceivedInput.value = "";
    }
  }
  syncRightNow();
}
if (splitToggle) splitToggle.addEventListener("change", updatePaymentUI_safe);
if (paymentModeSelect) paymentModeSelect.addEventListener("change", updatePaymentUI_safe);
if (cashReceivedInput) cashReceivedInput.addEventListener("input", syncRightNow);

// sync right summary
function syncRightNow() {
  try {
    let subtotal = 0, tax = 0;
    billCart.forEach(it => { subtotal += Number(it.lineBase||0); tax += Number(it.lineTax||0); });
    const net = Number((subtotal + tax).toFixed(2));
    if (rightSubtotal) rightSubtotal.textContent = formatCurrency(subtotal);
    if (rightTax) rightTax.textContent = formatCurrency(tax);
    if (rightDiscount) rightDiscount.textContent = formatCurrency(0);
    if (rightNet) rightNet.textContent = formatCurrency(net);

    let paidSum = 0;
    if (splitToggle && splitToggle.checked) paidSum = payments.reduce((s,p)=>s+Number(p.amount||0),0);
    else if (paymentModeSelect && paymentModeSelect.value === "Cash") paidSum = Number((cashReceivedInput && cashReceivedInput.value) || 0);
    else paidSum = net;

    if (rightPaid) rightPaid.textContent = formatCurrency(paidSum);
    const change = Math.max(0, Number((paidSum - net).toFixed(2)));
    if (rightChange) rightChange.textContent = formatCurrency(change);
  } catch (e) {
    console.warn("syncRightNow error", e);
  }
}

// Confirm & Save
const rightConfirmBtn = $("rightConfirmBtn");
const rightClearBtn = $("rightClearBtn");

if (rightClearBtn) rightClearBtn.addEventListener("click", (e) => {
  billCart = []; payments = []; if (cashReceivedInput) cashReceivedInput.value = "";
  renderBillCart(); renderPayments();
});

if (rightConfirmBtn) rightConfirmBtn.addEventListener("click", async (e) => {
  if (!billCart.length) { alert("Add items first"); return; }
  const subtotal = billCart.reduce((s,i)=>s+Number(i.lineBase||0),0);
  const tax = billCart.reduce((s,i)=>s+Number(i.lineTax||0),0);
  const net = Number((subtotal + tax).toFixed(2));

  let payloadPayments = [];
  if (splitToggle && splitToggle.checked) {
    if (!payments.length) { alert("Add payments"); return; }
    payloadPayments = payments.map(p=>({ method:p.method, amount:p.amount, reference:p.reference }));
  } else {
    const mode = paymentModeSelect && paymentModeSelect.value || "Cash";
    if (mode === "Cash") {
      const cash = Number(cashReceivedInput && cashReceivedInput.value || 0);
      if (cash + 0.0001 < net) { alert("Cash given is less than net"); return; }
      payloadPayments = [{ method: "Cash", amount: cash, reference: null }];
    } else {
      payloadPayments = [{ method: mode, amount: net, reference: null }];
    }
  }

  const invoice = { invoiceNumber: "INV-" + Date.now(), dateTime: new Date().toISOString(), customerName: $("customerName")?.value || "Walk-in", items: billCart, payments: payloadPayments, netAmount: net };
  invoices.push(invoice);
  // update stock locally
  billCart.forEach(it => {
    const prod = products.find(p => p.id === it.productId);
    if (prod) prod.stockQty = Math.max(0, prod.stockQty - it.quantity);
  });
  billCart = []; payments = []; if (cashReceivedInput) cashReceivedInput.value = "";
  renderBillCart(); renderProducts(); renderPayments(); updateStats();
  if (toast) { toast.classList.add("show"); setTimeout(()=>toast.classList.remove("show"), 1800); }
  alert("Saved " + invoice.invoiceNumber);
});

// Product modal & inventory handlers
if (btnOpenProductForm) btnOpenProductForm.addEventListener("click", () => openProductModal(null));

// Inventory click (delegated) - handles emoji icon buttons
if (inventoryTableBody) {
  inventoryTableBody.addEventListener("click", async (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    const id = Number(btn.dataset.id);
    const action = btn.dataset.action;

    if (action === "edit") {
      const p = products.find(x => x.id === id);
      if (p) openProductModal(p);
      else console.warn("Edit target not found:", id);
      return;
    }

    if (action === "delete") {
      const prod = products.find(x => x.id === id);
      if (!prod) return;
      const ok = confirm(`Delete product "${prod.name}"? This will remove it from inventory.`);
      if (!ok) return;
      try {
        products = products.filter(p => p.id !== id);
        const hadInCart = billCart.some(it => it.productId === id);
        if (hadInCart) {
          billCart = billCart.filter(it => it.productId !== id);
          renderBillCart();
        }
        renderProducts();
        updateStats();
        renderPayments();
      } catch (err) {
        console.error("Delete failed:", err);
        alert("Failed to delete product. See console for details.");
      }
    }
  });
}

function openProductModal(p = null) {
  if (!productModal) return;
  if (p) {
    $("productId").value = p.id;
    $("productName").value = p.name;
    $("productCategory").value = p.category || "";
    $("productUnit").value = p.unit || "pcs";
    $("productPrice").value = p.price;
    $("productTax").value = p.taxPercent || 0;
    $("productStock").value = p.stockQty;
    $("productReorder").value = p.reorderLevel || 0;
    $("productBarcode").value = p.barcode || "";
  } else {
    ["productId","productName","productCategory","productUnit","productPrice","productTax","productStock","productReorder","productBarcode"].forEach(id=>{ if($(id)) $(id).value = "";});
    $("productUnit").value = "pcs";
  }
  productFormMessage.textContent = "";
  productModal.classList.remove("hidden");
}

if (btnCloseProductModal) btnCloseProductModal.addEventListener("click", ()=> productModal.classList.add("hidden"));
if (btnCancelProduct) btnCancelProduct.addEventListener("click", ()=> productModal.classList.add("hidden"));

if (productForm) productForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const payload = {
    id: $("productId").value ? Number($("productId").value) : Date.now(),
    name: $("productName").value.trim(),
    category: $("productCategory").value.trim(),
    unit: $("productUnit").value.trim() || "pcs",
    price: Number($("productPrice").value || 0),
    taxPercent: Number($("productTax").value || 0),
    stockQty: Number($("productStock").value || 0),
    reorderLevel: Number($("productReorder").value || 0),
    barcode: $("productBarcode").value.trim() || null
  };
  const idx = products.findIndex(p => p.id === payload.id);
  if (idx >= 0) products[idx] = payload; else products.push(payload);
  productModal.classList.add("hidden");
  populateProductDropdown();
  renderProducts();
  updateStats();
});

// barcode quick add
const barcodeInput = $("productBarcodeInput");
if (barcodeInput) {
  barcodeInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const val = barcodeInput.value.trim();
      if (!val) return;
      const found = products.find(p => p.barcode && String(p.barcode) === String(val));
      if (found) {
        productSelect.value = found.id;
        addItemToBill();
        barcodeInput.value = "";
      } else {
        addItemToBill();
        barcodeInput.value = "";
      }
    }
  });
}

// add item button
if (btnAddItem) btnAddItem.addEventListener("click", (e) => { e.preventDefault(); addItemToBill(); });

// search inventory
if (inventorySearch) inventorySearch.addEventListener("input", renderProducts);

// navigation & sections
(function navigationSetup() {
  const navBtns = document.querySelectorAll(".nav-btn");
  const mapping = {
    billing: $("section-billing"),
    inventory: $("section-inventory"),
    invoices: $("section-invoices")
  };

  if (leftCol) leftCol.style.display = "";

  function showSection(name) {
    Object.keys(mapping).forEach(k => {
      const el = mapping[k];
      if (!el) return;
      if (k === name) { el.style.display = ""; el.classList.add("active"); }
      else { el.style.display = "none"; el.classList.remove("active"); }
    });
    if (name === "inventory") renderProducts();
    if (name === "invoices") renderInvoices();
  }

  navBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      navBtns.forEach(b => b.classList.remove("nav-btn-active"));
      btn.classList.add("nav-btn-active");
      const section = btn.dataset.section || "billing";
      showSection(section);
    });
  });

  document.addEventListener("DOMContentLoaded", () => {
    const activeBtn = document.querySelector(".nav-btn.nav-btn-active");
    const initial = activeBtn ? (activeBtn.dataset.section || "billing") : "billing";
    showSection(initial);
  });
})();

function renderInvoices() {
  const tbody = $("invoicesTableBody");
  if (!tbody) return;
  tbody.innerHTML = "";
  invoices.slice().reverse().forEach(inv => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${escapeHtml(inv.invoiceNumber)}</td><td>${new Date(inv.dateTime).toLocaleString()}</td><td>${escapeHtml(inv.customerName)}</td><td>${escapeHtml((inv.payments||[]).map(p=>p.method+":"+p.amount).join(", "))}</td><td style="text-align:right">${formatCurrency(inv.netAmount)}</td>`;
    tbody.appendChild(tr);
  });
}

async function init() {
  await loadProducts();
  renderProducts();
  renderBillCart();
  renderPayments();
  updateStats();
  updatePaymentUI_safe();
  setTimeout(syncRightNow, 60);
}
document.addEventListener("DOMContentLoaded", init);

// periodic sync
setInterval(syncRightNow, 1000);
