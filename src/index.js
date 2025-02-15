const { client } = require("./services/discordService");
const { setupDiscordEventHandlers } = require("./handlers/botHandler");
const { DISCORD_TOKEN } = require("./config/constants");

setupDiscordEventHandlers(client);

// Login the bot
client.login(DISCORD_TOKEN);

