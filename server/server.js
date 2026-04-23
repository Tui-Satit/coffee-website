const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const axios = require("axios");

dotenv.config();

const app = express();

app.use(
  cors({
    origin: true,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());

const PORT = process.env.PORT || 3002;
const LINE_CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;

app.get("/", (req, res) => {
  res.send("LINE order server is running");
});

app.get("/health", (req, res) => {
  res.json({
    ok: true,
    message: "Server is healthy",
  });
});

app.post("/api/line/push-order", async (req, res) => {
  try {
    if (!LINE_CHANNEL_ACCESS_TOKEN) {
      return res.status(500).json({
        success: false,
        error: "Missing LINE_CHANNEL_ACCESS_TOKEN in environment variables",
      });
    }

    const {
      orderId,
      customerName,
      items,
      totalItems,
      totalPrice,
      note,
      pickupTime,
      createdAt,
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: "No order items found",
      });
    }

    const getTemperatureLabel = (temperature) => {
      if (temperature === "Hot") return "🔥 ร้อน";
      if (temperature === "Cold") return "❄️ เย็น";
      return temperature || "❄️ เย็น";
    };

    const getSugarLabel = (sugar) => sugar || "ปกติ";

    const orderLines = items.map((item, index) => {
      const itemTotal = Number(item.price || 0) * Number(item.qty || 0);

      return `${index + 1}. ${item.name} (${getTemperatureLabel(
        item.temperature
      )} • ${getSugarLabel(item.sugar)}) x${item.qty} = ฿${itemTotal}`;
    });

    const createdAtText = createdAt
      ? new Date(createdAt).toLocaleString("th-TH", {
          dateStyle: "short",
          timeStyle: "short",
        })
      : "-";

    const messageText = [
      "🚨 ออเดอร์ใหม่เข้าร้าน!",
      "",
      `Order ID: ${orderId || "-"}`,
      `ลูกค้า: ${customerName || "-"}`,
      `รับสินค้า: ${pickupTime || "รับที่ร้าน"}`,
      `เวลา: ${createdAtText}`,
      "",
      "รายการสั่ง",
      ...orderLines,
      "",
      `จำนวนรวม: ${totalItems || 0} แก้ว`,
      `ยอดรวม: ฿${totalPrice || 0}`,
      "",
      `หมายเหตุ: ${note || "-"}`,
      "",
      "กรุณาเตรียมออเดอร์ทันที",
    ].join("\n");

    await axios.post(
      "https://api.line.me/v2/bot/message/broadcast",
      {
        messages: [
          {
            type: "text",
            text: messageText,
          },
        ],
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
        },
      }
    );

    return res.json({
      success: true,
      message: "Order sent to LINE successfully",
    });
  } catch (error) {
    console.error(
      "Send order error:",
      error.response?.data || error.message || error
    );

    return res.status(500).json({
      success: false,
      error: error.response?.data || error.message || "Unknown server error",
    });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});