const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const path = require('path');
const cors = require('cors');

// --- TOKEN VA ADMIN SOZLAMALARI ---
const TOKEN = '8691570304:AAHIyxgI6lV4KMFexs_76mXPV04cSXZmHkE'; 
const ADMIN_CHAT_ID = '1947310106'; 
const ADMIN_IDS = [1947310106]; 
const WEBSITE_URL = 'https://diyorbekweb015.netlify.app/';

// Bitta va yagona bot obyektini yaratish
const bot = new TelegramBot(TOKEN, { polling: true });
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Foydalanuvchi qadamlarini saqlash uchun xotira
const userState = {};

// Saytdan kelgan arizalarni qabul qilish
app.post('/send-application', async (req, res) => {
    const { name, phone, course, payment, comment } = req.body;
    const message = `🚀 <b>Saytdan Yangi Ariza Keldi!</b>\n\n` +
                    `👤 <b>F.I.O:</b> ${name}\n` +
                    `📞 <b>Telefon:</b> ${phone}\n` +
                    `📚 <b>Yo'nalish:</b> ${course}\n` +
                    `💳 <b>To'lov turi:</b> ${payment}\n` +
                    `💬 <b>Izoh:</b> ${comment}`;

    try {
        await bot.sendMessage(ADMIN_CHAT_ID, message, { parse_mode: 'HTML' });
        res.json({ success: true });
    } catch (error) {
        console.error("Xatolik:", error);
        res.json({ success: false });
    }
});

// /start komandasi bosilganda darhol Ism va Familiyani so'rash
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    
    // Foydalanuvchini boshlang'ich ariza holatiga o'tkazamiz
    userState[chatId] = { step: 'waiting_for_name' };

    bot.sendMessage(chatId, `Assalomu alaykum! EduKontrol Academy (Pop tumani filiali) botiga xush kelibsiz.\n\nKursga yozilish uchun iltimos, avval **Ism va Familiyangizni** kiriting:`, { parse_mode: 'Markdown' });
});

// Inline tugmalar (Narxlar va Manzil uchun)
bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const data = query.data;

    if (data === 'prices') {
        const text = `📚 *EduKontrol Academy kurslari va narxlari* (Pop tumani):\n\n` +
                     `1️⃣ *HTML & CSS Asoslari*\n- Narxi: 350,000 so'm / oyiga\n\n` +
                     `2️⃣ *Frontend Kursi (HTML, CSS, JS)*\n- Narxi: 500,000 so'm / oyiga\n\n` +
                     `3️⃣ *Full-Stack Master (PRO)*\n- Narxi: 750,000 so'm / oyiga\n\n` +
                     `Batafsil saytimizda: ${WEBSITE_URL}`;
        bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
    } else if (data === 'contact') {
        bot.sendMessage(chatId, `📍 *Manzil:* Namangan viloyati, Pop tumani\n📞 *Telefon:* +998 90 123 45 67\n🌐 *Web sayt:* ${WEBSITE_URL}`, { parse_mode: 'Markdown' });
    }

    bot.answerCallbackQuery(query.id);
});

// Faqat bitta 'message' tinglovchisi (takrorlanishning oldini olish uchun)
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (!text || text.startsWith('/')) return; // Komandalarni o'tkazib yuborish

    if (userState[chatId]) {
        const state = userState[chatId];

        if (state.step === 'waiting_for_name') {
            state.name = text;
            state.step = 'waiting_for_phone';
            bot.sendMessage(chatId, `Rahmat, ${text}!\n\nEndi telefon raqamingizni yuboring (Masalan: +998 90 123 45 67):`);
        } 
        else if (state.step === 'waiting_for_phone') {
            state.phone = text;
            state.step = 'waiting_for_course';
            bot.sendMessage(chatId, `Qaysi kursda o'qimoqchisiz? (Masalan: Frontend, HTML & CSS, Full-Stack):`);
        } 
        else if (state.step === 'waiting_for_course') {
            state.course = text;
            
            // Arizani adminga yuborish
            const adminMessage = `🚀 <b>Bot Orqali Yangi Ariza Keldi!</b>\n\n` +
                                 `👤 <b>F.I.O:</b> ${state.name}\n` +
                                 `📞 <b>Telefon:</b> ${state.phone}\n` +
                                 `📚 <b>Kurs:</b> ${state.course}`;

            await bot.sendMessage(ADMIN_CHAT_ID, adminMessage, { parse_mode: 'HTML' });

            // Foydalanuvchiga asosiy menyu tugmalari bilan javob berish
            bot.sendMessage(chatId, `✅ Arizangiz muvaffaqiyatli qabul qilindi! Tez orada operatorlarimiz siz bilan bog'lanishadi.\n\nBoshqa bo'limlarni ko'rish uchun quyidagilardan foydalanishingiz mumkin:`, {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '💰 Kurslar va Narxlar', callback_data: 'prices' }],
                        [{ text: '📍 Manzil va Aloqa', callback_data: 'contact' }],
                        [{ text: '🌐 Saytga o\'tish', url: WEBSITE_URL }]
                    ]
                }
            });

            delete userState[chatId]; // Xotirani tozalash
        }
    } else {
        // Agar foydalanuvchi /start bosmagan bo'lsa yoki ariza jarayonida bo'lmasa
        bot.sendMessage(chatId, `Qaytadan boshlash uchun /start buyrug'ini bosing.`);
    }
});

// Admin panel komandasi
bot.onText(/\/admin/, (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    if (!ADMIN_IDS.includes(userId)) {
        return bot.sendMessage(chatId, '❌ Kechirasiz, sizda bu buyruqdan foydalanish huquqi yo\'q.');
    }

    bot.sendMessage(chatId, `🎛 *EduKontrol Academy - Admin Panel*\nXush kelibsiz!`, { parse_mode: 'Markdown' });
});

// Serverni ishga tushirish
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server ${PORT}-portda ishga tushdi!`);
});
