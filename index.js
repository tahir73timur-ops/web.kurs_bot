const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

// Bot tokeningizni shu yerga yozing
const token = '8691570304:AAFaVbRXSnDc1ExqUBQE_GPf_eZrdkCQWT0';
const bot = new TelegramBot(token, { polling: true });

// Sayt manzili
const WEBSITE_URL = 'https://diyorbekweb015.netlify.app/';

// Adminlar ro'yxati (O'z Telegram ID raqamingizni shu yerga yozing)
// ID raqamingizni bilmasangiz, @userinfobot orqali bilib olishingiz mumkin
const ADMIN_IDS = [123456789]; // <-- O'z Telegram ID raqamingizni yozing

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

    // Faqat adminlar kirishi uchun tekshiruv
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
    // Admin panel tugmalari
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

console.log('Bot admin paneli bilan ishga tushdi...');
