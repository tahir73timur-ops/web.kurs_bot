const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const path = require('path');
const cors = require('cors'); // CORS ni ulash muhim

// --- TOKEN VA ADMIN CHAT IDINGIZNI SHU YERGA YOZING ---
const TOKEN = '8691570304:AAELafDMcO6CsDpqH_2cljwulDPYW7jdJ34'; 
const ADMIN_CHAT_ID = '1947310106'; 
// -----------------------------------------------------

const bot = new TelegramBot(TOKEN, { polling: true });
const app = express();

app.use(cors()); // Veb-saytdan kelgan so'rovlarni ochiq qabul qilish uchun
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Saytdan kelgan arizalarni qabul qilib Telegramga yuborish
app.post('/send-application', async (req, res) => {
    const { name, phone, course, payment, comment } = req.body;

    const message = `🚀 <b>Yangi Startap Arizasi Keldi!</b>\n\n` +
                    `👤 <b>F.I.O:</b> ${name}\n` +
                    `📞 <b>Telefon:</b> ${phone}\n` +
                    `📚 <b>Yo'nalish:</b> ${course}\n` +
                    `💳 <b>To'lov turi:</b> ${payment}\n` +
                    `💬 <b>Izoh:</b> ${comment}`;

    try {
        await bot.sendMessage(ADMIN_CHAT_ID, message, { parse_mode: 'HTML' });
        res.json({ success: true });
    } catch (error) {
        console.error("Telegramga yuborishda xatolik:", error);
        res.json({ success: false });
    }
});

bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, "Salom! EduKontrol platformasi faol va arizalarni qabul qilishga tayyor.");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server ${PORT}-portda muvaffaqiyatli ishga tushdi!`);
});
