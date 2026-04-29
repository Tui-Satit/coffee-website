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

// =============================
// HEALTH CHECK
// =============================
app.get("/", (req, res) => {
  res.send("LINE order server is running 🚀");
});

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

// =============================
// SEND ORDER TO LINE (FLEX)
// =============================
app.post("/api/line/push-order", async (req, res) => {
  try {
    console.log("📥 Incoming order:", req.body);

    if (!LINE_CHANNEL_ACCESS_TOKEN) {
      return res.status(500).json({
        success: false,
        error: "Missing LINE_CHANNEL_ACCESS_TOKEN",
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

    if (!items || !items.length) {
      return res.status(400).json({
        success: false,
        error: "No items",
      });
    }

    const getTemp = (t) => {
      if (t === "Hot") return "🔥 ร้อน";
      if (t === "Cold") return "❄️ เย็น";
      return t || "❄️ เย็น";
    };

    const createdAtText = createdAt
      ? new Date(createdAt).toLocaleString("th-TH")
      : "-";

    // =============================
    // BUILD ITEM LIST
    // =============================
    const itemRows = items.flatMap((item) => {
      const total = item.price * item.qty;

      return [
        {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "text",
              text: item.name,
              weight: "bold",
              size: "sm",
            },
            {
              type: "text",
              text: `${getTemp(item.temperature)} • ${item.sugar} • x${item.qty}`,
              size: "xs",
              color: "#666666",
            },
            {
              type: "text",
              text: `฿${total}`,
              size: "sm",
              color: "#06C755",
              weight: "bold",
            },
          ],
        },
        { type: "separator", margin: "md" },
      ];
    });

    if (itemRows[itemRows.length - 1]?.type === "separator") {
      itemRows.pop();
    }

    // =============================
    // FLEX MESSAGE
    // =============================
    const flexMessage = {
      type: "flex",
      altText: `ออเดอร์ใหม่ ${customerName} ฿${totalPrice}`,
      contents: {
        type: "bubble",
        size: "giga",
        header: {
          type: "box",
          layout: "vertical",
          backgroundColor: "#D32F2F",
          contents: [
            {
              type: "text",
              text: "🚨 ออเดอร์ใหม่!",
              color: "#FFFFFF",
              size: "lg",
              weight: "bold",
            },
            {
              type: "text",
              text: `Order ID: ${orderId}`,
              color: "#FFEBEE",
              size: "xs",
            },
          ],
        },
        body: {
          type: "box",
          layout: "vertical",
          spacing: "md",
          contents: [
            {
              type: "text",
              text: `👤 ${customerName}`,
              size: "sm",
            },
            {
              type: "text",
              text: `📍 ${pickupTime || "รับที่ร้าน"}`,
              size: "sm",
            },
            {
              type: "text",
              text: `🕒 ${createdAtText}`,
              size: "xs",
              color: "#666666",
            },

            { type: "separator" },

            {
              type: "text",
              text: "☕ รายการสั่ง",
              weight: "bold",
            },

            ...itemRows,

            { type: "separator" },

            {
              type: "box",
              layout: "horizontal",
              contents: [
                { type: "text", text: "จำนวน", size: "sm" },
                {
                  type: "text",
                  text: `${totalItems} แก้ว`,
                  align: "end",
                  weight: "bold",
                },
              ],
            },
            {
              type: "box",
              layout: "horizontal",
              contents: [
                { type: "text", text: "ยอดรวม", size: "sm" },
                {
                  type: "text",
                  text: `฿${totalPrice}`,
                  align: "end",
                  weight: "bold",
                  color: "#06C755",
                },
              ],
            },

            {
              type: "text",
              text: `📝 ${note || "-"}`,
              size: "xs",
              wrap: true,
              margin: "md",
            },
          ],
        },
        footer: {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "button",
              style: "primary",
              color: "#06C755",
              action: {
                type: "uri",
                label: "เปิด Monitor",
                uri: "http://192.168.1.43:3000/monitor",
              },
            },
          ],
        },
      },
    };

    // =============================
    // SEND TO LINE
    // =============================
    const response = await axios.post(
      "https://api.line.me/v2/bot/message/broadcast",
      {
        messages: [flexMessage],
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
        },
      }
    );

    console.log("✅ LINE sent:", response.status);

    res.json({ success: true });
  } catch (error) {
    console.error("❌ LINE error:", error.response?.data || error.message);

    res.status(500).json({
      success: false,
      error: error.response?.data || error.message,
    });
  }
});

// =============================
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});