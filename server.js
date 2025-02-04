require('dotenv').config();
const express = require('express');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const INSTAGRAM_ACCOUNT_ID = process.env.INSTAGRAM_ACCOUNT_ID;
const VERIFY_TOKEN = "verify_123"; // Должно совпадать с Meta

if (!PAGE_ACCESS_TOKEN || !INSTAGRAM_ACCOUNT_ID) {
    console.error("❌ Ошибка: Переменные окружения PAGE_ACCESS_TOKEN и INSTAGRAM_ACCOUNT_ID не установлены.");
    process.exit(1);
}

app.use(express.json());

app.get('/', (req, res) => {
    res.send("Instagram Bot is running...");
});

// ✅ Верификация Webhook от Meta
app.get('/webhook', (req, res) => {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode === "subscribe" && token === VERIFY_TOKEN) {
        console.log("WEBHOOK_VERIFIED");
        res.status(200).send(challenge);
    } else {
        res.sendStatus(403);
    }
});

// ✅ Webhook для Instagram (получение комментариев)
app.post('/webhook', (req, res) => {
    const body = req.body;

    if (body.object === 'instagram') {
        body.entry.forEach(entry => {
            entry.changes?.forEach(change => {
                if (change.field === "comments" && change.value) {
                    handleComment(change.value);
                }
            });
        });
    }

    res.sendStatus(200);
});

// ✅ Функция для отправки сообщений в Direct
async function sendMessage(recipientId, messageText) {
    try {
        await axios.post(`https://graph.facebook.com/v18.0/${INSTAGRAM_ACCOUNT_ID}/messages`, {
            recipient: { id: recipientId },
            message: { text: messageText }
        }, {
            headers: { Authorization: `Bearer ${PAGE_ACCESS_TOKEN}` }
        });
    } catch (error) {
        console.error("❌ Ошибка при отправке сообщения: ", error.response?.data || error.message);
    }
}

// ✅ Ответ на комментарий
async function replyToComment(commentId) {
    const messageText = "Direct га ёздик";
    
    try {
        await axios.post(`https://graph.facebook.com/v18.0/${commentId}/replies`, {
            message: messageText
        }, {
            headers: { Authorization: `Bearer ${PAGE_ACCESS_TOKEN}` }
        });
    } catch (error) {
        console.error("❌ Ошибка при ответе на комментарий: ", error.response?.data || error.message);
    }
}

// ✅ Обработка комментариев
async function handleComment(event) {
    if (!event.comment_id || !event.from || !event.from.id) {
        console.error("❌ Ошибка: Некорректные данные комментария", event);
        return;
    }

    const commentId = event.comment_id;
    await replyToComment(commentId);

    const senderId = event.from.id;
    const directMessage = "Ассалому алейкум, маълумот олиш учун қуйидаги +998999961696 рақамга қўнғироқ қилинг";
    
    await sendMessage(senderId, directMessage);
}

app.listen(PORT, "0.0.0.0", () => console.log(`✅ Server is running on port ${PORT}`));
