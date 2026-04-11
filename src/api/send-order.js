const axios = require("axios");

module.exports = async (req, res) => {
  // CORS
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,POST");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method === "GET") {
    return res.status(200).json({ message: "LINE order server is running" });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { customerName, items, totalPrice, note, pickupTime } = req.body;

    if (!items || !items.length) {
      return res.status(400).json({ error: "No items provided" });
    }

    const orderText = [
      "☕ ออเดอร์ใหม่",
      "",
      `ชื่อลูกค้า: ${customerName || "-"}`,
      `เวลารับ: ${pickupTime || "-"}`,
      `หมายเหตุ: ${note || "-"}`,
      "",
      "รายการ:",
      ...items.map(
        (item) =>
          `- ${item.name} (${item.sweetness || "ปกติ"}) x${item.qty} = ฿${item.price * item.qty}`
      ),
      "",
      `รวมทั้งหมด: ฿${totalPrice || 0}`,
    ].join("\n");

    await axios.post(
      "https://api.line.me/v2/bot/message/push",
      {
        to: process.env.LINE_USER_ID,
        messages: [
          {
            type: "text",
            text: orderText,
          },
        ],
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
        },
      }
    );

    return res.status(200).json({ success: true, message: "Order sent to LINE" });
  } catch (error) {
    console.error("send-order error:", error?.response?.data || error.message);
    return res.status(500).json({
      error: "Failed to send order",
      details: error?.response?.data || error.message,
    });
  }
};