require("dotenv").config();
const express = require("express");
const axios = require("axios");
const bodyParser = require("body-parser");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

// 📌 Вебхук для получения сообщений и комментариев
app.get("/webhook", (req, res) => {
    let VERIFY_TOKEN = process.env.VERIFY_TOKEN;
    
    let mode = req.query["hub.mode"];
    let token = req.query["hub.verify_token"];
    let challenge = req.query["hub.challenge"];

    if (mode && token === VERIFY_TOKEN) {
        res.status(200).send(challenge);
    } else {
        res.sendStatus(403);
    }
});

app.post("/webhook", async (req, res) => {
    let body = req.body;
    
    if (body.object === "instagram") {
        body.entry.forEach(async (entry) => {
            let changes = entry.changes;
            changes.forEach(async (change) => {
                if (change.field === "messages") {
                    let fromId = change.value.from.id;
                    await sendDirectMessage(fromId);
                }
                if (change.field === "comments") {
                    let commentId = change.value.id;
                    let fromId = change.value.from.id;
                    let text = change.value.text;

                    if (!text.includes("@")) {
                        await replyToComment(commentId);
                        await sendDirectMessage(fromId);
                    }
                }
            });
        });
        res.sendStatus(200);
    } else {
        res.sendStatus(404);
    }
});

// 📌 Функция отправки сообщения в директ
async function sendDirectMessage(userId) {
    let message = "Ассалому алейкум, батафсил маълумот олишингиз учун куйидаги ракамга 123445 конгирок килин, йоки оператор жавобини кутин.";

    try {
        await axios.post(
            `https://graph.facebook.com/v18.0/${process.env.INSTAGRAM_ID}/messages`,
            {
                recipient: { id: userId },
                message: { text: message },
            },
            {
                headers: { Authorization: `Bearer ${process.env.ACCESS_TOKEN}` },
            }
        );
        console.log(`📩 Сообщение отправлено пользователю: ${userId}`);
    } catch (error) {
        console.error("⚠️ Ошибка при отправке сообщения:", error.response ? error.response.data : error.message);
    }
}

// 📌 Функция ответа на комментарий
async function replyToComment(commentId) {
    let message = "Директга йоздик.";

    try {
        await axios.post(
            `https://graph.facebook.com/v18.0/${commentId}/replies`,
            {
                message: message,
            },
            {
                headers: { Authorization: `Bearer ${process.env.ACCESS_TOKEN}` },
            }
        );
        console.log(`💬 Ответ в комментариях отправлен: ${commentId}`);
    } catch (error) {
        console.error("⚠️ Ошибка при ответе на комментарий:", error.response ? error.response.data : error.message);
    }
}

// 📌 Запускаем сервер
app.listen(PORT, () => {
    console.log(`🚀 Сервер запущен на порту ${PORT}`);
});
