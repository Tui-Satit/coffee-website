const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");

const app = express();
app.use(bodyParser.json());

const CHANNEL_ACCESS_TOKEN = "ch93j64aCG/8LWnxGEkDIkh3RAzd1dTNvdkaHffv8KqSZG0zCEW5GHjFnzIEtprSywAQ8rZJA9h9PNShBKP+XVdnkCtrdZXUxhN5AlY4HCOIizG2JGU4O8B1tcIflkRqEAHaAOqPom1n6nCcokD5uwdB04t89/1O/w1cDnyilFU=";

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

app.listen(process.env.PORT || 3000, () => {
  console.log("🚀 Server running");
});