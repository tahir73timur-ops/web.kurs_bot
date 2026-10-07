const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const path = require('path');
const cors = require('cors');
const fs = require('fs');

// --- TOKEN VA ADMIN SOZLAMALARI ---
const TOKEN = '8691570304:AAEk_a2W80n3itzqh7By99Hht8UEINQWlIg'; 
const ADMIN_IDS = [1947310106]; 
const ADMIN_USERNAMES = ['diyorbek_2o1']; 
const RENDER_URL = process.env.RENDER_EXTERNAL_URL || 'https://web-kurs-bot-13.onrender.com';
const WEBSITE_URL = 'https://diyorbekweb015.netlify.app/'; // O'z saytingiz havolasini shu yerga yozing

const bot = new TelegramBot(TOKEN, { webHook: true });
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

bot.setWebHook(`${RENDER_URL}/bot${TOKEN}`);

const DB_FILE = path.join(__dirname, 'database.json');

function readDB() {
    if (!fs.existsSync(DB_FILE)) {
        fs.writeFileSync(DB_FILE, JSON.stringify({ users: {}, currentTask: null, submissions: {} }, null, 2));
    }
    try {
        return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    } catch (err) {
        return { users: {}, currentTask: null, submissions: {} };
    }
}

function writeDB(data) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

const userState = {};

function isAdmin(msg) {
    const userId = msg.from.id;
    const username = msg.from.username;
    return ADMIN_IDS.includes(userId) || (username && ADMIN_USERNAMES.includes(username.toLowerCase()));
}

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

app.post(`/bot${TOKEN}`, (req, res) => {
    bot.processUpdate(req.body);
    res.sendStatus(200);
});

bot.on('message', async (msg) => {
    if (!msg || !msg.text) return;

    const chatId = msg.chat.id;
    const text = msg.text.trim();
    const db = readDB();

    if (text === '/start') {
        userState[chatId] = { step: 'waiting_for_name' };
        return bot.sendMessage(chatId, `Assalomu alaykum! EduKontrol Academy botiga xush kelibsiz.\n\nKursga yozilish uchun iltimos, **Ism va Familiyangizni** kiriting:`, { parse_mode: 'Markdown' });
    }

    if (text === '/oqquvchilar') {
        if (!isAdmin(msg)) return bot.sendMessage(chatId, "❌ Kechirasiz, bu buyruq faqat admin uchun.");

        const userKeys = Object.keys(db.users || {});
        if (userKeys.length === 0) return bot.sendMessage(chatId, "⚠️ Hozircha bazada ro'yxatdan o'tgan o'quvchilar yo'q.");

        let listText = `📋 **Ro'yxatdan o'tgan o'quvchilar (${userKeys.length} ta):**\n\n`;
        let index = 1;
        for (const id in db.users) {
            const u = db.users[id];
            listText += `${index}. **${u.name}**\n📞 Tel: ${u.phone}\n📚 Kurs: ${u.course}\n\n`;
            index++;
        }
        return bot.sendMessage(chatId, listText, { parse_mode: 'Markdown' });
    }

    if (text.startsWith('/vazifa ')) {
        if (!isAdmin(msg)) return bot.sendMessage(chatId, "❌ Kechirasiz, bu buyruq faqat admin uchun.");

        const taskText = text.replace('/vazifa ', '').trim();
        db.currentTask = taskText;
        db.submissions = {};
        writeDB(db);

        let sentCount = 0;
        for (const userChatId in db.users) {
            try {
                await bot.sendMessage(userChatId, `📚 **Yangi Uyga Vazifa!**\n\n${taskText}\n\n*Vazifani bajarib, javobini shu botga yuboring!*`, { parse_mode: 'Markdown' });
                sentCount++;
            } catch (err) {
                console.log(`Yuborib bo'lmadi: ${userChatId}`);
            }
        }
        return bot.sendMessage(chatId, `✅ Vazifa muvaffaqiyatli ${sentCount} ta o'quvchiga yuborildi!`);
    }

    if (text === '/eslatma') {
        if (!isAdmin(msg)) return bot.sendMessage(chatId, "❌ Kechirasiz, bu buyruq faqat admin uchun.");
        if (!db.currentTask) return bot.sendMessage(chatId, "⚠️ Hozircha faol vazifa mavjud emas.");

        let remindCount = 0;
        for (const userChatId in db.users) {
            if (!db.submissions[userChatId]) {
                try {
                    await bot.sendMessage(userChatId, `⚠️ **Eslatma!** Siz hali joriy vazifani bajarmadingiz:\n\n"${db.currentTask}"\n\nIltimos, tezroq bajarib yuboring!`, { parse_mode: 'Markdown' });
                    remindCount++;
                } catch (err) {
                    console.log(`Eslatma yuborib bo'lmadi: ${userChatId}`);
                }
            }
        }
        return bot.sendMessage(chatId, `📢 Vazifani bajarmagan ${remindCount} ta o'quvchiga eslatma yuborildi!`);
    }

    if (userState[chatId]) {
        const state = userState[chatId];

        if (state.step === 'waiting_for_name') {
            state.name = text;
            state.step = 'waiting_for_phone';
            return bot.sendMessage(chatId, `Rahmat, ${text}!\n\nEndi telefon raqamingizni yuboring (Masalan: +998 90 123 45 67):`);
        } 
        else if (state.step === 'waiting_for_phone') {
            state.phone = text;
            state.step = 'waiting_for_course';

            const courseKeyboard = {
                reply_markup: {
                    keyboard: [
                        [{ text: '💻 Kompyuter savodxonligi' }],
                        [{ text: '🌐 Frontend (HTML & CSS)' }, { text: '⚡ JavaScript' }],
                        [{ text: '🚀 Backend (Node.js)' }, { text: '🐘 PHP & MySQL' }]
                    ],
                    resize_keyboard: true,
                    one_time_keyboard: true
                }
            };

            return bot.sendMessage(chatId, `Quyidagi yo'nalishlardan birini tanlang:`, courseKeyboard);
        } 
        else if (state.step === 'waiting_for_course') {
            state.course = text;
            
            if (!db.users) db.users = {};
            db.users[chatId] = {
                name: state.name,
                phone: state.phone,
                course: state.course
            };
            writeDB(db);

            const adminMsg = `🚀 <b>Bot Orqali Yangi O'quvchi Ro'yxatdan O'tdi!</b>\n\n` +
                             `👤 <b>F.I.O:</b> ${state.name}\n` +
                             `📞 <b>Telefon:</b> ${state.phone}\n` +
                             `📚 <b>Kurs:</b> ${state.course}`;
            await bot.sendMessage(ADMIN_IDS[0], adminMsg, { parse_mode: 'HTML' });

            delete userState[chatId];

            const successMessage = `✅ Tabriklaymiz, ma'lumotlaringiz muvaffaqiyatli saqlandi va ro'yxatdan o'tdingiz!\n\n` +
                                   `💰 Kurslarimizning narxlari va to'liq ma'lumotlar bilan quyidagi sayt orqali tanishishingiz mumkin:\n` +
                                   `🔗 ${WEBSITE_URL}`;

            return bot.sendMessage(chatId, successMessage, { parse_mode: 'Markdown', reply_markup: { remove_keyboard: true } });
        }
    } 

    if (db.users && db.users[chatId]) {
        if (db.currentTask) {
            db.submissions[chatId] = { text: text, time: new Date().toISOString() };
            writeDB(db);

            await bot.sendMessage(chatId, `✅ Vazifangiz qabul qilindi va adminga yuborildi! Rahmat.`);

            const student = db.users[chatId];
            await bot.sendMessage(ADMIN_IDS[0], `📥 <b>Vazifa Javobi Keldi!</b>\n\n👤 O'quvchi: ${student.name} (${student.phone})\n📝 Javob: ${text}`, { parse_mode: 'HTML' });
            return;
        } else {
            return bot.sendMessage(chatId, `Hozircha faol vazifa mavjud emas.`);
        }
    } 

    return bot.sendMessage(chatId, `Iltimos, avval ro'yxatdan o'tish uchun /start buyrug'ini bosing.`);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server ${PORT}-portda ishga tushdi!`);
});
