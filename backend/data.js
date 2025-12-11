// backend/data.js
let nextProductId = 4;
let nextInvoiceId = 1;

let products = [
  {
    id: 1,
    name: "Notebook A5",
    category: "Stationery",
    unit: "pcs",
    price: 50,
    taxPercent: 18,
    stockQty: 120,
    reorderLevel: 20,
    isActive: true,
    barcode: "NBK-A5-001"
  },
  {
    id: 2,
    name: "Ball Pen Blue",
    category: "Stationery",
    unit: "pcs",
    price: 10,
    taxPercent: 18,
    stockQty: 300,
    reorderLevel: 50,
    isActive: true,
    barcode: "PEN-BL-001"
  },
  {
    id: 3,
    name: "File Folder",
    category: "Office Supplies",
    unit: "pcs",
    price: 80,
    taxPercent: 18,
    stockQty: 60,
    reorderLevel: 10,
    isActive: true,
    barcode: "FILE-FD-001"
  }
];

let invoices = [];

function getProducts() {
  return products.filter(p => p.isActive);
}

function addProduct(payload) {
  const {
    name,
    category,
    unit,
    price,
    taxPercent,
    stockQty,
    reorderLevel,
    barcode
  } = payload;

  if (!name || price == null || stockQty == null) {
    throw new Error("Name, price, and stockQty are required.");
  }

  const product = {
    id: nextProductId++,
    name,
    category: category || "",
    unit: unit || "pcs",
    price: Number(price),
    taxPercent: Number(taxPercent || 0),
    stockQty: Number(stockQty),
    reorderLevel: Number(reorderLevel || 0),
    isActive: true,
    barcode: barcode || null
  };

  products.push(product);
  return product;
}

function updateProduct(id, payload) {
  const product = products.find(p => p.id === id && p.isActive);
  if (!product) throw new Error("Product not found.");

  const {
    name,
    category,
    unit,
    price,
    taxPercent,
    stockQty,
    reorderLevel,
    isActive,
    barcode
  } = payload;

  if (name != null) product.name = name;
  if (category != null) product.category = category;
  if (unit != null) product.unit = unit;
  if (price != null) product.price = Number(price);
  if (taxPercent != null) product.taxPercent = Number(taxPercent);
  if (stockQty != null) product.stockQty = Number(stockQty);
  if (reorderLevel != null) product.reorderLevel = Number(reorderLevel);
  if (isActive != null) product.isActive = !!isActive;
  if (barcode != null) product.barcode = barcode;

  return product;
}

function deleteProduct(id) {
  const product = products.find(p => p.id === id && p.isActive);
  if (!product) throw new Error("Product not found.");
  product.isActive = false;
  return product;
}

function getInvoices() {
  return invoices;
}

/*
 createInvoice payload:
 {
   customerName,
   items: [{ productId, quantity }],
   discounts?: { type:'percent'|'flat', value:number } (optional),
   payments?: [{ method:'Cash'|'Card'|'UPI', amount:number, reference?:string }]
}
*/
function createInvoice(payload) {
  const { customerName, items, discounts, payments } = payload;

  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new Error("Invoice must have at least one item.");
  }

  // compute totals
  let totalBase = 0;
  let totalTax = 0;
  let invoiceItems = [];

  items.forEach(item => {
    const productId = Number(item.productId);
    const qty = Number(item.quantity);

    if (!productId || !qty || qty <= 0) {
      throw new Error("Invalid product or quantity.");
    }

    const product = products.find(p => p.id === productId && p.isActive);
    if (!product) {
      throw new Error(`Product with id ${productId} not found.`);
    }

    if (qty > product.stockQty) {
      throw new Error(`Insufficient stock for product: ${product.name}`);
    }

    const price = product.price;
    const taxPercent = product.taxPercent || 0;
    const lineBase = price * qty;
    const lineTax = (lineBase * taxPercent) / 100;
    const lineTotal = lineBase + lineTax;

    totalBase += lineBase;
    totalTax += lineTax;

    invoiceItems.push({
      productId: product.id,
      productName: product.name,
      quantity: qty,
      priceAtSale: price,
      taxPercentAtSale: taxPercent,
      lineBase,
      lineTax,
      lineTotal
    });
  });

  const gross = totalBase + totalTax;

  // apply discount if provided
  let discountAmount = 0;
  if (discounts && typeof discounts === "object") {
    if (discounts.type === "percent") {
      discountAmount = (gross * Number(discounts.value || 0)) / 100;
    } else {
      discountAmount = Number(discounts.value || 0);
    }
    if (discountAmount < 0) discountAmount = 0;
    if (discountAmount > gross) discountAmount = gross;
  }

  const netAmount = Number((gross - discountAmount).toFixed(2));

  // validate payments: must be array with sum >= netAmount
  let paymentSummary = [];
  let paidSum = 0;

  if (!payments || !Array.isArray(payments) || payments.length === 0) {
    throw new Error("At least one payment entry required.");
  }

  payments.forEach(p => {
    const method = p.method || "Cash";
    const amount = Number(p.amount || 0);
    const reference = p.reference || null;
    if (amount < 0) throw new Error("Invalid payment amount.");
    paymentSummary.push({ method, amount, reference });
    paidSum += amount;
  });

  // allow tiny fp tolerance
  if (Number((paidSum - netAmount).toFixed(2)) < -0.0001) {
    throw new Error(`Payments total ${paidSum} is less than net amount ${netAmount}`);
  }

  // deduct stock
  invoiceItems.forEach(item => {
    const prod = products.find(p => p.id === item.productId);
    prod.stockQty -= item.quantity;
  });

  const invoice = {
    id: nextInvoiceId++,
    invoiceNumber: `INV-${Date.now()}`,
    dateTime: new Date().toISOString(),
    customerName: customerName || "Walk-in Customer",
    totalAmount: totalBase,
    taxAmount: totalTax,
    discountAmount,
    netAmount,
    paymentSummary,
    paidAmount: paidSum,
    changeGiven: Number((paidSum - netAmount).toFixed(2)),
    items: invoiceItems
  };

  invoices.push(invoice);
  return invoice;
}

module.exports = {
  getProducts,
  addProduct,
  updateProduct,
  deleteProduct,
  getInvoices,
  createInvoice
};
