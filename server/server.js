const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");

const app = express();
app.use(bodyParser.json());

const CHANNEL_ACCESS_TOKEN = "PUT_YOUR_TOKEN_HERE";

app.post("/webhook", async (req, res) => {
  const events = req.body.events;

  for (let event of events) {
    if (event.type === "message") {
      const text = event.message.text;

      console.log("📩 Order:", text);

      await axios.post(
        "https://api.line.me/v2/bot/message/reply",
        {
          replyToken: event.replyToken,
          messages: [
            {
              type: "text",
              text: `✅ รับออเดอร์แล้ว\n\n${text}\n\n☕ กำลังเตรียมครับ`,
            },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${CHANNEL_ACCESS_TOKEN}`,
            "Content-Type": "application/json",
          },
        }
      );
    }
  }

  res.sendStatus(200);
});

app.listen(3000, () => {
  console.log("🚀 Server running on port 3000");
});