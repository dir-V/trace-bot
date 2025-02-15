const dotenv = require('dotenv');
dotenv.config();

module.exports = {
    DISCORD_TOKEN: process.env.DISCORD_TOKEN,
    CALENDAR_ID: process.env.CALENDAR_ID,
    CHANNEL_ID: process.env.CHANNEL_ID,
    // WEBHOOK_PORT: process.env.WEBHOOK_PORT || 3000,
    // WEBHOOK_URL: process.env.WEBHOOK_URL,
};