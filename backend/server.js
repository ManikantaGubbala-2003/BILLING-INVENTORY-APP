// backend/server.js
const express = require("express");
const cors = require("cors");
const path = require("path");

const {
  getProducts,
  addProduct,
  updateProduct,
  deleteProduct,
  getInvoices,
  createInvoice
} = require("./data");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../frontend")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

// Products
app.get("/api/products", (req, res) => {
  try {
    res.json(getProducts());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/products", (req, res) => {
  try {
    const p = addProduct(req.body);
    res.status(201).json(p);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put("/api/products/:id", (req, res) => {
  try {
    const id = Number(req.params.id);
    const p = updateProduct(id, req.body);
    res.json(p);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete("/api/products/:id", (req, res) => {
  try {
    const id = Number(req.params.id);
    const p = deleteProduct(id);
    res.json(p);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Invoices
app.get("/api/invoices", (req, res) => {
  try {
    res.json(getInvoices());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/*
 Accepts payload:
 {
   customerName,
   items: [{productId, quantity}],
   discounts: {type:'percent'|'flat', value: number} (optional),
   payments: [{method, amount, reference?}]
 }
*/
app.post("/api/invoices", (req, res) => {
  try {
    const invoice = createInvoice(req.body);
    res.status(201).json(invoice);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
