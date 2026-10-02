const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const path = require('path');
const cors = require('cors');
const fs = require('fs');

// --- TOKEN VA ADMIN SOZLAMALARI ---
const TOKEN = '8691570304:AAHPWVoFLyjXSxHcY7huOiL_OJPtN5RXVwA'; 
const ADMIN_IDS = [1947310106]; 

const bot = new TelegramBot(TOKEN, { polling: true });
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Ma'lumotlarni saqlash uchun database.json fayli
const DB_FILE = path.join(__dirname, 'database.json');

function readDB() {
    if (!fs.existsSync(DB_FILE)) {
        fs.writeFileSync(DB_FILE, JSON.stringify({ users: {}, currentTask: null, submissions: {} }, null, 2));
    }
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
}

function writeDB(data) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

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
        await bot.sendMessage(ADMIN_IDS[0], message, { parse_mode: 'HTML' });
        res.json({ success: true });
    } catch (error) {
        console.error("Xatolik:", error);
        res.json({ success: false });
    }
});

// Yagona asosiy xabar qabul qiluvchi (dublyatsiyaning oldini oladi)
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (!text) return;

    const userId = msg.from.id;
    const db = readDB();

    // 1. /start buyrug'i
    if (text === '/start') {
        userState[chatId] = { step: 'waiting_for_name' };
        return bot.sendMessage(chatId, `Assalomu alaykum! EduKontrol Academy botiga xush kelibsiz.\n\nKursga yozilish uchun iltimos, **Ism va Familiyangizni** kiriting:`, { parse_mode: 'Markdown' });
    }

    // 2. Admin buyruqlari: /vazifa va /eslatma
    if (text.startsWith('/vazifa ') && ADMIN_IDS.includes(userId)) {
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

    if (text === '/eslatma' && ADMIN_IDS.includes(userId)) {
        if (!db.currentTask) {
            return bot.sendMessage(chatId, "⚠️ Hozircha faol vazifa mavjud emas.");
        }

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

    // 3. Ro'yxatdan o'tish bosqichlari
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
            return bot.sendMessage(chatId, `Qaysi kursda o'qimoqchisiz? (Masalan: Frontend, HTML & CSS):`);
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
            return bot.sendMessage(chatId, `✅ Tabriklaymiz! Ma'lumotlaringiz saqlandi va ro'yxatdan o'tdingiz. Tez orada admin tomonidan vazifalar yuboriladi.`);
        }
    } 

    // 4. Vazifa javobini qabul qilish
    if (db.users && db.users[chatId]) {
        if (db.currentTask) {
            db.submissions[chatId] = { text: text, time: new Date().toISOString() };
            writeDB(db);

            bot.sendMessage(chatId, `✅ Vazifangiz qabul qilindi va adminga yuborildi! Rahmat.`);

            const student = db.users[chatId];
            await bot.sendMessage(ADMIN_IDS[0], `📥 <b>Vazifa Javobi Keldi!</b>\n\n👤 O'quvchi: ${student.name} (${student.phone})\n📝 Javob: ${text}`, { parse_mode: 'HTML' });
            return;
        } else {
            return bot.sendMessage(chatId, `Hozircha faol vazifa mavjud emas.`);
        }
    } 

    // Agar boshqa holat bo'lsa
    return bot.sendMessage(chatId, `Iltimos, avval ro'yxatdan o'tish uchun /start buyrug'ini bosing.`);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server ${PORT}-portda ishga tushdi!`);
});
