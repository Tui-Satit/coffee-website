const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const axios = require("axios");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT =  3002;
const LINE_CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;

app.get("/", (req, res) => {
  res.send("LINE order server is running");
});

app.post("/send-order", async (req, res) => {
  try {
    const { customerName, items, totalPrice, note } = req.body;

    if (!items || !items.length) {
      return res.status(400).json({ error: "No order items found" });
    }

    const getTemperatureLabel = (temperature) => {
      if (temperature === "Hot" || temperature === "Cold") {
        return temperature;
      }
      return temperature || "Cold";
    };

    const getSugarLabel = (sugar) => sugar || "ปกติ";

    const orderLines = items.map((item, index) => {
      const itemTotal = item.price * item.qty;
      return `${index + 1}. ${item.name} (${getTemperatureLabel(item.temperature)} • ${getSugarLabel(
        item.sugar
      )}) x${item.qty} = ฿${itemTotal}`;
    });

    const messageText = [
      "☕ คำสั่งซื้อใหม่",
      "",
      `👤 ลูกค้า: ${customerName || "-"}`,
      "",
      "🛒 รายการสั่งซื้อ",
      orderLines.join("\n"),
      "",
      "📝 หมายเหตุ",
      note || "-",
      "",
      "💰 ยอดรวม",
      `฿${totalPrice || 0}`,
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

    res.json({ success: true, message: "Order sent to LINE successfully" });
  } catch (error) {
    console.error("Send order error:", error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: error.response?.data || error.message,
    });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
