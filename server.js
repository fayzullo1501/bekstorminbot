require('dotenv').config();
const express = require('express');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;

app.use(express.json());

app.get('/', (req, res) => {
    res.send("Instagram Bot is running...");
});

// Вебхук для Instagram
app.post('/webhook', (req, res) => {
    const body = req.body;

    if (body.object === 'instagram') {
        body.entry.forEach(entry => {
            entry.messaging?.forEach(event => {
                if (event.message) {
                    handleDirectMessage(event);
                }
            });

            entry.changes?.forEach(change => {
                if (change.field === "comments") {
                    handleComment(change);
                }
            });
        });
    }

    res.sendStatus(200);
});

// Функция для отправки сообщений в Direct
async function sendMessage(recipientId, messageText) {
    try {
        await axios.post(`https://graph.facebook.com/v18.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`, {
            recipient: { id: recipientId },
            message: { text: messageText }
        });
    } catch (error) {
        console.error("Ошибка при отправке сообщения: ", error.response.data);
    }
}

// Обработка сообщений в Direct
async function handleDirectMessage(event) {
    const senderId = event.sender.id;
    const messageText = "Ассалому алейкум, маълумот олиш учун қуйидаги +998999961696 рақамга қўнғироқ қилинг";
    
    await sendMessage(senderId, messageText);
}

// Ответ на комментарий
async function replyToComment(commentId) {
    const messageText = "Direct га ёздик";
    
    try {
        await axios.post(`https://graph.facebook.com/v18.0/${commentId}/comments?access_token=${PAGE_ACCESS_TOKEN}`, {
            message: messageText
        });
    } catch (error) {
        console.error("Ошибка при ответе на комментарий: ", error.response.data);
    }
}

// Обработка комментариев
async function handleComment(event) {
    const commentId = event.value.comment_id;
    await replyToComment(commentId);

    const senderId = event.value.from.id;
    const directMessage = "Ассалому алейкум, маълумот олиш учун қуйидаги +998999961696 рақамга қўнғироқ қилинг";
    
    await sendMessage(senderId, directMessage);
}

app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
