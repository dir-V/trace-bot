const { Client, GatewayIntentBits} = require("discord.js");
const { CHANNEL_ID } = require("../config/constants");

// Initialize the Discord client
const client = new Client({
    intents: [
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildScheduledEvents,
    ],
});

// Map to track event IDs and their corresponding bot messages
const eventMessageMap = new Map();

async function sendMessage(message, eventId) {
    try {
        const channel = await client.channels.fetch(CHANNEL_ID);
        if (channel) {
            // Delete the previous message for this event, if it exists
            if (eventMessageMap.has(eventId)) {
                const previousMessageId = eventMessageMap.get(eventId);
                try {
                    const previousMessage = await channel.messages.fetch(previousMessageId);
                    await previousMessage.delete();
                    console.log(`Deleted previous message for event ${eventId}`);
                } catch (error) {
                    console.error("Error deleting previous message:", error);
                }
            }

            // Send the new message and track it
            const newMessage = await channel.send(message);
            eventMessageMap.set(eventId, newMessage.id);
            console.log(`Sent new message for event ${eventId}`);
        } else {
            console.error("Channel not found");
        }
    } catch (error) {
        console.error("Error sending message:", error);
    }
}

// Export the client and functions
module.exports = {
    client,
    sendMessage,
};