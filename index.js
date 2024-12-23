const fs = require('fs');
const { Telegraf } = require('telegraf');
const obfuscateCode = require('./toolsobf');
const axios = require('axios');

// Setup bot token and owner ID
const TOKEN = '8193576202:AAHgIjp9JatIZct0ZGpwMV38zb_t7eky_cc';  // Replace with your bot token
const OWNER_ID = '7065763951'; // Replace with your owner ID
const USERS_PREMIUM_FILE = 'userspremium.json';
const bot = new Telegraf(TOKEN);

// Load or initialize premium users
let usersPremium = {};
if (fs.existsSync(USERS_PREMIUM_FILE)) {
    usersPremium = JSON.parse(fs.readFileSync(USERS_PREMIUM_FILE, 'utf8'));
} else {
    fs.writeFileSync(USERS_PREMIUM_FILE, JSON.stringify({}));
}

// Initialize userSessions
let userSessions = {};

// ASCII Art for bot startup
const asciiArt = `
⠄⣾⣿⡇⢸⣿⣿⣿⠄⠈⣿⣿⣿⣿⠈⣿⡇⢹⣿⣿⣿⡇⡇⢸⣿⣿⡇⣿⣿⣿
⢠⣿⣿⡇⢸⣿⣿⣿⡇⠄⢹⣿⣿⣿⡀⣿⣧⢸⣿⣿⣿⠁⡇⢸⣿⣿⠁⣿⣿⣿
⢸⣿⣿⡇⠸⣿⣿⣿⣿⡄⠈⢿⣿⣿⡇⢸⣿⡀⣿⣿⡿⠸⡇⣸⣿⣿⠄⣿⣿⣿
⢸⣿⡿⠷⠄⠿⠿⠿⠟⠓⠰⠘⠿⣿⣿⡈⣿⡇⢹⡟⠰⠦⠁⠈⠉⠋⠄⠻⢿⣿
⢨⡑⠶⡏⠛⠐⠋⠓⠲⠶⣭⣤⣴⣦⣭⣥⣮⣾⣬⣴⡮⠝⠒⠂⠂⠘⠉⠿⠖⣬
⠈⠉⠄⡀⠄⣀⣀⣀⣀⠈⢛⣿⣿⣿⣿⣿⣿⣿⣿⣟⠁⣀⣤⣤⣠⡀⠄⡀⠈⠁
⠄⠠⣾⡀⣾⣿⣧⣼⣿⡿⢠⣿⣿⣿⣿⣿⣿⣿⣿⣧⣼⣿⣧⣼⣿⣿⢀⣿⡇⠄
⡀⠄⠻⣷⡘⢿⣿⣿⡿⢣⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣜⢿⣿⣿⡿⢃⣾⠟⢁⠈
⢃⢻⣶⣬⣿⣶⣬⣥⣶⣿⣿⣿⣿⣿⣿⢿⣿⣿⣿⣿⣿⣷⣶⣶⣾⣿⣷⣾⣾⢣
⡄⠈⢿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣷⣼⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡏⠘
⣿⡐⠘⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠟⢠⢃
⣿⣷⡀⠈⠻⣿⣿⣿⣿⣿⣿⣿⣿⠿⠿⠿⠿⢿⣿⣿⣿⣿⣿⣿⣿⡿⠋⢀⠆⣼
⣿⣿⣷⡀⠄⠈⠛⢿⣿⣿⣿⣿⣷⣶⣶⣶⣶⣶⣿⣿⣿⣿⣿⠿⠋⠠⠂⢀⣾⣿
⣿⣿⣿⣧⠄⠄⢵⢠⣈⠛⠿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠟⢋⡁⢰⠏⠄⠄⣼⣿⣿
⢻⣿⣿⣿⡄⢢⠨⠄⣯⠄⠄⣌⣉⠛⠻⠟⠛⢋⣉⣤⠄⢸⡇⣨⣤⠄⢸⣿⣿⣿
⡏⠉⠉⠉⠉⠉⠉⠋⠉⠉⠉⠉⠉⠉⠋⠉⠉⠉⠉⠉⠉⠉⠉⠉⠉⠙⠉⠉⠉⠹
⡇⢸⣿⡟⠛⢿⣷⠀⢸⣿⡟⠛⢿⣷⡄⢸⣿⡇⠀⢸⣿⡇⢸⣿⡇⠀⢸⣿⡇⠀
⡇⢸⣿⣧⣤⣾⠿⠀⢸⣿⣇⣀⣸⡿⠃⢸⣿⡇⠀⢸⣿⡇⢸⣿⣇⣀⣸⣿⡇⠀
⡇⢸⣿⡏⠉⢹⣿⡆⢸⣿⡟⠛⢻⣷⡄⢸⣿⡇⠀⢸⣿⡇⢸⣿⡏⠉⢹⣿⡇⠀
⡇⢸⣿⣧⣤⣼⡿⠃⢸⣿⡇⠀⢸⣿⡇⠸⣿⣧⣤⣼⡿⠁⢸⣿⡇⠀⢸⣿⡇⠀
⣇⣀⣀⣀⣀⣀⣀⣄⣀⣀⣀⣀⣀⣀⣀⣠⣀⡈⠉⣁⣀⣄⣀⣀⣀⣠⣀⣀⣀⣰
                                   
`;

// Log ASCII art to console
console.log(asciiArt);

// Start the bot
bot.start((ctx) => {
    ctx.replyWithPhoto('https://files.catbox.moe/5lwuyc.jpg', {
        caption: '📄 Welcome to the Obfuscation Bot!\n\nChoose an option below:\n\n' +
            '/obfmenu - Obfuscation Menu\n' +
            '/status - Check Premium Status\n' +
            '/addprem - Add Premium (Owner only)',
        parse_mode: 'Markdown'
    });
});

// Obfuscation menu
bot.command('obfmenu', (ctx) => {
    const menuText = `
**Obfuscation Menu**:
1. /obf1 - Var [HardObf!]
2. /obf2 - Var [ExtremeObf!]
3. /obf3 - DeadCode [ExtremeObf!]
4. /obf4 - EncCode [ExtremeObf!!]
5. /obf5 - ABCD [HardObf!]
6. /obf6 - Name [ExtremeObf!!]
7. /obf7 - Name [ExtremeObf!!]
8. /obf8 - Name [ExtremeObf!]
9. /obf9 - Crass [HardObf!]
        FIX ERROR ALL

📄 Send your .js file after selecting the obfuscation type.
    `;
    ctx.reply(menuText, { parse_mode: 'Markdown' });
});

bot.command('obf1', (ctx) => {
    const userId = ctx.from.id.toString();

    if (!isPremium(userId)) {
        return ctx.reply('❌ You do not have premium access.');
    }

    userSessions[userId] = { obfuscationType: 'obf1' };
    ctx.reply('📄 Please send your .js file for Obfuscation (Rename All Variable Var).');
});

// Command for obfuscation type obf2 (Hexadecimal Anti Dec)
bot.command('obf2', (ctx) => {
    const userId = ctx.from.id.toString();

    if (!isPremium(userId)) {
        return ctx.reply('❌ You do not have premium access.');
    }

    userSessions[userId] = { obfuscationType: 'obf2' };
    ctx.reply('📄 Please send your .js file for Obfuscation (Hexadecimal Anti Dec).');
});

// Command for obfuscation type obf3 (Random Deadcode)
bot.command('obf3', (ctx) => {
    const userId = ctx.from.id.toString();

    if (!isPremium(userId)) {
        return ctx.reply('❌ You do not have premium access.');
    }

    userSessions[userId] = { obfuscationType: 'obf3' };
    ctx.reply('📄 Please send your .js file for Obfuscation (Random Deadcode).');
});

// Command for obfuscation type obf4 (Return Obfuscation)
bot.command('obf4', (ctx) => {
    const userId = ctx.from.id.toString();

    if (!isPremium(userId)) {
        return ctx.reply('❌ You do not have premium access.');
    }

    userSessions[userId] = { obfuscationType: 'obf4' };
    ctx.reply('📄 Please send your .js file for Return Obfuscation.');
});

//mangled
bot.command('obf5', (ctx) => {
    const userId = ctx.from.id.toString();

    if (!isPremium(userId)) {
        return ctx.reply('❌ You do not have premium access.');
    }

    userSessions[userId] = { obfuscationType: 'obf5' };
    ctx.reply('📄 Please send your .js file for Mangled Obfuscation (Type 5).');
});

bot.command('obf6', (ctx) => {
    const userId = ctx.from.id.toString();

    if (!isPremium(userId)) {
        return ctx.reply('❌ You do not have premium access.');
    }

    userSessions[userId] = { obfuscationType: 'obf6' };
    ctx.reply('📄 Please send your .js file for Mangled Obfuscation (Type 6).');
});

bot.command('obf7', (ctx) => {
    const userId = ctx.from.id.toString();

    if (!isPremium(userId)) {
        return ctx.reply('❌ You do not have premium access.');
    }

    userSessions[userId] = { obfuscationType: 'obf7' };
    ctx.reply('📄 Please send your .js file for Mangled Obfuscation (Type 7).');
});

bot.command('obf8', (ctx) => {
    const userId = ctx.from.id.toString();

    if (!isPremium(userId)) {
        return ctx.reply('❌ You do not have premium access.');
    }

    userSessions[userId] = { obfuscationType: 'obf8' };
    ctx.reply('📄 Please send your .js file for Mangled Obfuscation (Type 8).');
});

bot.command('obf9', (ctx) => {
    const userId = ctx.from.id.toString();

    if (!isPremium(userId)) {
        return ctx.reply('❌ You do not have premium access.');
    }

    userSessions[userId] = { obfuscationType: 'obf9' };
    ctx.reply('📄 Please send your .js file for Mangled Obfuscation (Type 9).');
});



// Check premium status
bot.command('status', (ctx) => {
    const userId = ctx.from.id.toString();

    if (isPremium(userId)) {
        const remainingDays = Math.ceil((usersPremium[userId].premiumUntil - Date.now()) / (24 * 60 * 60 * 1000));
        ctx.reply(`📅 You have ${remainingDays} days of premium remaining.`);
    } else {
        ctx.reply('❌ You do not have premium access.');
    }
});

// Command to add premium (Owner only)
bot.command('addprem', (ctx) => {
    const args = ctx.message.text.split(' ').slice(1);
    const userId = args[0];
    const days = parseInt(args[1]);

    if (!isOwner(ctx.from.id)) {
        return ctx.reply('❌ You do not have permission to use this command.');
    }

    if (!usersPremium[userId]) {
        usersPremium[userId] = { premiumUntil: Date.now() + days * 24 * 60 * 60 * 1000 };
    } else {
        usersPremium[userId].premiumUntil += days * 24 * 60 * 60 * 1000;
    }

    fs.writeFileSync(USERS_PREMIUM_FILE, JSON.stringify(usersPremium));
    ctx.reply(`✅ User ${userId} has been granted ${days} days of premium.`);
});

// Reduce premium days function
function reducePremiumDays(userId) {
    if (usersPremium[userId] && usersPremium[userId].premiumUntil > Date.now()) {
        usersPremium[userId].premiumUntil -= 24 * 60 * 60 * 1000; // Reduce by 1 day
        fs.writeFileSync(USERS_PREMIUM_FILE, JSON.stringify(usersPremium));
    } else if (usersPremium[userId]) {
        delete usersPremium[userId]; // Remove user from premium list
        fs.writeFileSync(USERS_PREMIUM_FILE, JSON.stringify(usersPremium));
    }
}

// Check if user is premium
function isPremium(userId) {
    return usersPremium[userId] && usersPremium[userId].premiumUntil > Date.now();
}

// Check if user is owner
function isOwner(userId) {
    return userId.toString() === OWNER_ID;
}

// Interval to reduce premium days
setInterval(() => {
    const now = new Date();
    if (now.getHours() === 0 && now.getMinutes() === 0) {
        for (const userId in usersPremium) {
            reducePremiumDays(userId);
        }
    }
}, 60 * 60 * 1000); // Check every hour

// Handle document uploads for premium users
bot.on('document', async (ctx) => {
    const userId = ctx.from.id.toString();

    if (!isPremium(userId)) {
        return ctx.reply('❌ This feature is only available for premium users.');
    }

    const fileName = ctx.message.document.file_name;

    if (!fileName.endsWith('.js')) {
        return ctx.reply('❌ Please send a file with the .js extension.');
    }

    if (!userSessions[userId] || !userSessions[userId].obfuscationType) {
        return ctx.reply('❌ Please select an obfuscation type first using one of the commands.');
    }

    const obfuscationType = userSessions[userId].obfuscationType;

    // Reduce premium days
    reducePremiumDays(userId);

    await handleDocumentObfuscation(ctx, obfuscationType);
});

async function handleDocumentObfuscation(ctx, option) {
    const fileId = ctx.message.document.file_id;
    const fileName = ctx.message.document.file_name; // Ambil nama file asli
    const loadingMessage = await ctx.reply('🚧 Preparing obfuscation...');

    try {
        const fileLink = await ctx.telegram.getFileLink(fileId);
        const code = await downloadFile(fileLink);

        await ctx.telegram.editMessageText(ctx.chat.id, loadingMessage.message_id, undefined, '🔄 Encrypting...');
        const obfuscatedCode = await obfuscateCode(code, option);

        await ctx.telegram.editMessageText(ctx.chat.id, loadingMessage.message_id, undefined, '🎉 Obfuscation complete! Sending file...');
        
        // Kirim file dengan nama yang sama seperti file asli
        await ctx.replyWithDocument({
            source: Buffer.from(obfuscatedCode),
            filename: fileName // Gunakan nama file asli
        }, {
            caption: `Tools Obf: ${option}`,
            parse_mode: 'Markdown'
        });
    } catch (error) {
        console.error('Error during obfuscation process:', error);
        await ctx.telegram.editMessageText(ctx.chat.id, loadingMessage.message_id, undefined, '❌ An error occurred while processing the file.');
    }
}
 
 
async function downloadFile(fileLink) {
    try {
        const response = await axios.get(fileLink);
        return response.data;
    } catch (error) {
        console.error('Error downloading the file:', error);
        throw new Error('Failed to download the file');
    }
}


bot.launch();