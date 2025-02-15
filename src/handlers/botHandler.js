const { createCalendarEvent, updateCalendarEvent, deleteCalendarEvent } = require("../services/calendar");
const { authorize } = require("../config/auth");
const { client, sendMessage } = require("../services/discordService");
const { ActivityType } = require("discord.js");

/**
 * Set up Discord event listeners.
 */
function setupDiscordEventHandlers() {
    client.on("guildScheduledEventCreate", async (event) => {
        console.log(`New Discord event created: ${event.name}`);
        const auth = await authorize();
        const calendarEvent = await createCalendarEvent(event, auth);
        await sendMessage(`Event created: **${event.name}**`, event.id); // Pass event ID
    });

    client.on("guildScheduledEventUpdate", async (oldEvent, newEvent) => {
        console.log(`Discord event updated: ${newEvent.name}`);
        const auth = await authorize();
        const calendarEvent = await updateCalendarEvent(newEvent, auth);
        await sendMessage(`Event updated: **${newEvent.name}**`, newEvent.id); // Pass event ID
    });

    client.on("guildScheduledEventDelete", async (event) => {
        console.log(`Discord event deleted: ${event.name}`);
        const auth = await authorize();
        await deleteCalendarEvent(event, auth);
        await sendMessage(`Event deleted: **${event.name}**`, event.id); // Pass event ID
    });

    client.on("ready", () => {
        console.log(`Logged in as ${client.user.tag}!`);
        client.user.setActivity({
            name: "The Spine",
            type: ActivityType.Watching,
        });
    });
}

module.exports = { setupDiscordEventHandlers };