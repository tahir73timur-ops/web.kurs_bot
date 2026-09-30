const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const path = require('path');

// --- O'ZINGIZNING TOKEN VA CHAT ID RAQAMINGIZNI SHU YERGA YOZING ---
const TOKEN = '8691570304:AAFYoATvcEIWPhZDow27noOmAfl_NEFZKzA'; 
const ADMIN_CHAT_ID = '1947310106'; 
// -------------------------------------------------------------------

const bot = new TelegramBot(TOKEN, { polling: true });
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Saytdan kelgan arizani qabul qilish va botga yo'naltirish
app.post('/send-application', async (req, res) => {
    const { name, phone, course, level, payment, comment } = req.body;

    const message = `🚨 <b>Yangi Ariza Keldi!</b>\n\n` +
                    `👤 <b>Ism:</b> ${name}\n` +
                    `📞 <b>Telefon:</b> ${phone}\n` +
                    `📚 <b>Kurs:</b> ${course}\n` +
                    `📊 <b>Daraja:</b> ${level}\n` +
                    `💳 <b>To'lov turi:</b> ${payment}\n` +
                    `💬 <b>Izoh:</b> ${comment}`;

    try {
        await bot.sendMessage(ADMIN_CHAT_ID, message, { parse_mode: 'HTML' });
        res.json({ success: true });
    } catch (error) {
        console.error("Xabar yuborishda xatolik:", error);
        res.json({ success: false });
    }
});

// Oddiy bot buyruqlari
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, "Salom! EduKontrol Academy botiga xush kelibsiz. Veb-saytdan yuborilgan arizalar shu yerga kelib tushadi.");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server ${PORT}-portda ishga tushdi va bot faol!`);
});
