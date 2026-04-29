const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const axios = require("axios");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

app.use(
  cors({
    origin: true,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Coffee order API is running");
});

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

const buildOrderLineText = ({ orderNumber, customerName, items, totalPrice }) => {
  const itemLines = items
    .map((item, index) => {
      const tempThai = item.temperature === "Hot" ? "ร้อน" : "เย็น";
      const sweetThai = item.sweetness === "No sugar" ? "ไม่หวาน" : item.sweetness === "Sweetless" ? "หวานน้อย" : "ปกติ";
      const lineTotal = Number(item.price || 0) * Number(item.qty || 0);

      return `${index + 1}. ${item.name} ${tempThai} ${sweetThai} x${item.qty} = ${lineTotal} บาท`;
    })
    .join("\n");

  return `☕ ออเดอร์ใหม่ ${orderNumber}\n👤 ลูกค้า: ${customerName}\n\nรายการ:\n${itemLines}\n\nรวมทั้งหมด: ${totalPrice} บาท`;
};

app.post("/send-order", async (req, res) => {
  const { orderNumber, customerName, items, totalPrice } = req.body || {};

  console.log("📥 /send-order payload:", {
    orderNumber,
    customerName,
    totalPrice,
    itemCount: Array.isArray(items) ? items.length : 0,
  });

  if (!process.env.LINE_CHANNEL_ACCESS_TOKEN) {
    return res.status(500).json({
      ok: false,
      error: "Missing LINE_CHANNEL_ACCESS_TOKEN in environment variables",
    });
  }

  if (!process.env.LINE_USER_ID) {
    return res.status(500).json({
      ok: false,
      error: "Missing LINE_USER_ID in environment variables",
    });
  }

  if (!orderNumber || !customerName || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      ok: false,
      error: "Invalid request body: orderNumber, customerName, and items are required",
    });
  }

  const message = buildOrderLineText({ orderNumber, customerName, items, totalPrice });

  try {
    const lineResponse = await axios.post(
      "https://api.line.me/v2/bot/message/push",
      {
        to: process.env.LINE_USER_ID,
        messages: [{ type: "text", text: message }],
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
        },
      }
    );

    console.log("✅ LINE push sent", { status: lineResponse.status });
    return res.json({ ok: true });
  } catch (error) {
    const detail = error.response?.data || error.message;
    console.error("❌ LINE API failed", detail);
    return res.status(500).json({
      ok: false,
      error: "LINE API request failed",
      detail,
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
