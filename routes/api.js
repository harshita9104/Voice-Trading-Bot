const express = require("express");
const router = express.Router();
const exchangeService = require("../services/exchangeService");

// Get available exchanges
router.get("/exchanges", (req, res) => {
  const exchanges = ["OKX", "Bybit", "Deribit", "Binance"];
  res.json({ exchanges });
});

// Get symbols for a specific exchange
router.get("/symbols/:exchange", async (req, res) => {
  try {
    const { exchange } = req.params;
    const symbols = await exchangeService.getSymbols(exchange);
    res.json({ symbols });
  } catch (error) {
    console.error("Error fetching symbols:", error);
    res.status(500).json({ error: "Failed to fetch symbols" });
  }
});

// Get current price for a symbol on an exchange
router.get("/price/:exchange/:symbol", async (req, res) => {
  try {
    const { exchange, symbol } = req.params;
    const price = await exchangeService.getPrice(exchange, symbol);
    res.json({ price });
  } catch (error) {
    console.error("Error fetching price:", error);
    res.status(500).json({ error: "Failed to fetch price" });
  }
});

module.exports = router;
