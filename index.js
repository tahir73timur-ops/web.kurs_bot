const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const path = require('path');
const cors = require('cors');

// --- TOKEN VA ADMIN SOZLAMALARI ---
const TOKEN = '8691570304:AAHfH-ZMeL_6z0TCqde3jaxEEp3AqYbISmI'; 
const ADMIN_CHAT_ID = '1947310106'; 
const ADMIN_IDS = [1947310106]; // O'z Telegram ID raqamingiz
const WEBSITE_URL = 'https://diyorbekweb015.netlify.app/';

const bot = new TelegramBot(TOKEN, { polling: true });
const app = express();

app.use(cors());
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

// Start komandasi
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, `Assalomu alaykum! EduKontrol Academy (Pop tumani filiali) botiga xush kelibsiz.\n\nSaytimiz: ${WEBSITE_URL}\n\nQuyidagi tugmalar orqali ma'lumot olishingiz mumkin:`, {
        reply_markup: {
            inline_keyboard: [
                [{ text: '💰 Narxlar va Kurslar', callback_data: 'prices' }],
                [{ text: '📍 Manzil va Aloqa', callback_data: 'contact' }],
                [{ text: '🌐 Saytga o\'tish', url: WEBSITE_URL }]
            ]
        }
    });
});

// Admin panel komandasi (/admin)
bot.onText(/\/admin/, (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    if (!ADMIN_IDS.includes(userId)) {
        return bot.sendMessage(chatId, '❌ Kechirasiz, sizda bu buyruqdan foydalanish huquqi yo\'q.');
    }

    bot.sendMessage(chatId, `🎛 *EduKontrol Academy - Admin Panel*\n\nXush kelibsiz, Direktor! Kerakli amalni tanlang:`, {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [
                [{ text: '📊 Statistika', callback_data: 'admin_stats' }],
                [{ text: '📢 Hammaga xabar yuborish (Broadcast)', callback_data: 'admin_broadcast' }],
                [{ text: '⚙️ Kurs narxlarini yangilash', callback_data: 'admin_update_prices' }]
            ]
        }
    });
});

// Inline tugmalar bosilganda
bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const userId = query.from.id;
    const data = query.data;
    
    if (data === 'prices') {
        const text = `📚 *EduKontrol Academy kurslari va narxlari* (Pop tumani):\n\n` +
                     `1️⃣ *HTML & CSS Asoslari*\n- Narxi: 350,000 so'm / oyiga\n\n` +
                     `2️⃣ *Frontend Kursi (HTML, CSS, JS)*\n- Narxi: 500,000 so'm / oyiga\n\n` +
                     `3️⃣ *Full-Stack Master (PRO)*\n- Narxi: 750,000 so'm / oyiga\n\n` +
                     `Batafsil saytimizdan ko'rishingiz mumkin: ${WEBSITE_URL}`;
        
        bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
    } else if (data === 'contact') {
        bot.sendMessage(chatId, `📍 *Manzil:* Namangan viloyati, Pop tumani\n📞 *Telefon:* +998 90 123 45 67\n🌐 *Web sayt:* ${WEBSITE_URL}`, { parse_mode: 'Markdown' });
    } 
    else if (data.startsWith('admin_')) {
        if (!ADMIN_IDS.includes(userId)) {
            return bot.answerCallbackQuery(query.id, { text: 'Ruxsat etilmagan!', show_alert: true });
        }

        if (data === 'admin_stats') {
            bot.sendMessage(chatId, `📊 *Bot statistikasi:*\n\n- Jami foydalanuvchilar: Hisoblanmoqda...\n- Holat: Faol ✅`);
        } else if (data === 'admin_broadcast') {
            bot.sendMessage(chatId, `📢 Hammaga xabar yuborish uchun xabar matnini yuboring (Hozircha ishlab chiqilmoqda).`);
        } else if (data === 'admin_update_prices') {
            bot.sendMessage(chatId, `⚙️ Narxlarni o'zgartirish uchun sayt ma'lumotlarini yangilang: ${WEBSITE_URL}`);
        }
    }
    
    bot.answerCallbackQuery(query.id);
});

// Serverni ishga tushirish
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server ${PORT}-portda muvaffaqiyatli ishga tushdi!`);
});

console.log('Bot admin paneli bilan ishga tushdi...');
