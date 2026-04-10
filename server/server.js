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
    const { customerName, items, totalPrice, note, pickupTime } = req.body;

    if (!items || !items.length) {
      return res.status(400).json({ error: "No order items found" });
    }

    const orderLines = items.map((item) => {
      const temperatureLabel = item.temperature || "Hot";
      return `• ${item.name} (${temperatureLabel}) x${item.qty} = ฿${item.price * item.qty}`;
    });

    const messageText = [
      "🔔 New Coffee Order",
      "",
      `👤 Name: ${customerName || "-"}`,
      `📝 Note: ${note || "-"}`,
      `⏰ Pickup time: ${pickupTime || "-"}`,
      "",
      "📦 Order list:",
      ...orderLines,
      "",
      `💰 Total: ฿${totalPrice || 0}`,
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
