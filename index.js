const TelegramBot = require('node-telegram-bot-api');

// O'zingizning bot tokeningizni shu yerga yozing
const TOKEN = '8691570304:AAFrEyd3Ue6xJFOu3S35UwEAs1k7rwioVRE';
const bot = new TelegramBot(TOKEN, { polling: true });

// Bot ishga tushganda
console.log("Bot ishga tushdi...");

// /start komandasi
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, "Salom! EduKontrol Academy botiga xush kelibsiz. Saytdan kelgan arizalar shu yerga tashlanadi.");
});

// Saytdan yoki boshqa yerdan kelgan arizalarni qabul qilib, o'zingizga yuborish funksiyasi
// (Boshqa fayllardan chaqirish uchun buni export qilish ham mumkin)
function sendApplicationToAdmin(adminChatId, course, name, phone) {
    const message = `🚀 *Yangi ariza (EduKontrol Academy)*\n\n` +
                    `📚 *Kurs:* ${course}\n` +
                    `👤 *Ism:* ${name}\n` +
                    `📞 *Telefon:* ${phone}`;

    bot.sendMessage(adminChatId, message, { parse_mode: 'Markdown' });
}

// Misol uchun oddiy xabar kelganda
bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    console.log(`Xabar keldi: ${msg.text} | Chat ID: ${chatId}`);
});