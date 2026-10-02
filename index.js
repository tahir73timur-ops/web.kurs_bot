const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const path = require('path');
const cors = require('cors');
const fs = require('fs');

// --- TOKEN VA ADMIN SOZLAMALARI ---
const TOKEN = '8691570304:AAF6gDIyrNo9l3L-U4wqf9xS0GV9FtijfFE'; 
const ADMIN_IDS = [1947310106]; 
const WEBSITE_URL = 'https://diyorbekweb015.netlify.app/';

const bot = new TelegramBot(TOKEN, { polling: true });
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Ma'lumotlarni saqlash uchun database.json fayli bilan ishlash
const DB_FILE = path.join(__dirname, 'database.json');

function readDB() {
    if (!fs.existsSync(DB_FILE)) {
        fs.writeFileSync(DB_FILE, JSON.stringify({ users: [], currentTask: null, submissions: {} }, null, 2));
    }
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
}

function writeDB(data) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

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
        await bot.sendMessage(ADMIN_IDS[0], message, { parse_mode: 'HTML' });
        res.json({ success: true });
    } catch (error) {
        console.error("Xatolik:", error);
        res.json({ success: false });
    }
});

// /start komandasi - Foydalanuvchini bazaga qo'shadi
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const db = readDB();
    
    if (!db.users.includes(chatId)) {
        db.users.push(chatId);
        writeDB(db);
    }

    bot.sendMessage(chatId, `Assalomu alaykum! EduKontrol Academy o'quv botiga xush kelibsiz.\n\nBu bot orqali sizga uyga vazifalar kelib turadi va ularni shu yerda topshirishingiz mumkin.`);
});

// --- ADMIN UCHUN VAZIFA BERISH BUYRUG'I ---
// Ishlatilishi: /vazifa [Vazifa matni]
bot.onText(/\/vazifa (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const taskText = match[1];

    if (!ADMIN_IDS.includes(userId)) {
        return bot.sendMessage(chatId, "❌ Kechirasiz, bu buyruq faqat admin uchun.");
    }

    const db = readDB();
    db.currentTask = taskText;
    db.submissions = {}; // Yangi vazifa uchun avvalgi topshiriqlarni tozalash
    writeDB(db);

    // Barcha ro'yxatdan o'tgan o'quvchilarga vazifani yuborish
    let sentCount = 0;
    for (const userChatId of db.users) {
        try {
            await bot.sendMessage(userChatId, `📚 **Yangi Uyga Vazifa!**\n\n${taskText}\n\n*Vazifani bajarib, javobini shu botga yuboring!*`, { parse_mode: 'Markdown' });
            sentCount++;
        } catch (err) {
            console.log(`Foydalanuvchiga yuborib bo'lmadi: ${userChatId}`);
        }
    }

    bot.sendMessage(chatId, `✅ Vazifa muvaffaqiyatli ${sentCount} ta o'quvchiga yuborildi!`);
});

// --- ADMIN UCHUN ESLATMA BERISH BUYRUG'I ---
// Ishlatilishi: /eslatma (Hali vazifa tashlamaganlarga xabar yuboradi)
bot.onText(/\/eslatma/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    if (!ADMIN_IDS.includes(userId)) {
        return bot.sendMessage(chatId, "❌ Kechirasiz, bu buyruq faqat admin uchun.");
    }

    const db = readDB();
    if (!db.currentTask) {
        return bot.sendMessage(chatId, "⚠️ Hozircha faol vazifa mavjud emas.");
    }

    let remindCount = 0;
    for (const userChatId of db.users) {
        // Agar foydalanuvchi hali javob yubormagan bo'lsa
        if (!db.submissions[userChatId]) {
            try {
                await bot.sendMessage(userChatId, `⚠️ **Eslatma!** Siz hali joriy vazifani bajarmadingiz va botga tashlamadingiz:\n\n"${db.currentTask}"\n\nIltimos, tezroq bajarib yuboring!`, { parse_mode: 'Markdown' });
                remindCount++;
            } catch (err) {
                console.log(`Eslatma yuborishda xatolik: ${userChatId}`);
            }
        }
    }

    bot.sendMessage(chatId, `📢 Vazifani bajarmagan ${remindCount} ta o'quvchiga eslatma yuborildi!`);
});

// O'quvchilarning vazifa javoblarini qabul qilish
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (!text || text.startsWith('/')) return; // Komandalarni o'tkazib yuborish

    const db = readDB();
    if (db.currentTask) {
        // O'quvchi javobini saqlaymiz
        db.submissions[chatId] = { text: text, time: new Date().toISOString() };
        writeDB(db);

        bot.sendMessage(chatId, `✅ Vazifangiz qabul qilindi va adminga yuborildi! Rahmat.`);

        // Adminga xabar berish
        for (const adminId of ADMIN_IDS) {
            await bot.sendMessage(adminId, `📥 **Yangi Vazifa Javobi!**\n\n👤 O'quvchi ID: <code>${chatId}</code>\n📝 Javob: ${text}`, { parse_mode: 'HTML' });
        }
    }
});

// Serverni ishga tushirish
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server ${PORT}-portda ishga tushdi!`);
});
