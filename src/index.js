const { Client, GatewayIntentBits, ActivityType } = require("discord.js");
const { google } = require("googleapis");
const dotenv = require("dotenv");
const { authenticate } = require("@google-cloud/local-auth");
const fs = require('fs').promises;
const path = require('path');
dotenv.config();

// Load environment variables
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const CALENDAR_ID = process.env.CALENDAR_ID;
const CHANNEL_ID = process.env.CHANNEL_ID;

// Discord bot setup
const client = new Client({
    intents: [
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildScheduledEvents,
    ],
});

// Google Calendar authentication
const SCOPES = ["https://www.googleapis.com/auth/calendar"]
const TOKEN_PATH = path.join(process.cwd(), 'token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');

async function loadSavedCredentialsIfExist() {
    try {
      const content = await fs.readFile(TOKEN_PATH);
      const credentials = JSON.parse(content);
      return google.auth.fromJSON(credentials);
    } catch (err) {
      return null;
    }
  }

async function saveCredentials(client) {
    const content = await fs.readFile(CREDENTIALS_PATH);
    const keys = JSON.parse(content);
    const key = keys.installed || keys.web;
    const payload = JSON.stringify({
      type: 'authorized_user',
      client_id: key.client_id,
      client_secret: key.client_secret,
      refresh_token: client.credentials.refresh_token,
    });
    await fs.writeFile(TOKEN_PATH, payload);
  }
  

async function authorize() {
    let client = await loadSavedCredentialsIfExist();
    if (client) {
      return client;
    }
    client = await authenticate({
      scopes: SCOPES,
      keyfilePath: CREDENTIALS_PATH,
    });
    if (client.credentials) {
      await saveCredentials(client);
    }
    return client;
  }
  
  async function sendMessage(message) {
    const channel = await client.channels.fetch(CHANNEL_ID);
    if (channel) {
        channel.send(message);
    } else {
        console.error("Channel not found");
    }
}

// Function to create Google Calendar event
async function createCalendarEvent(discordEvent, auth) {
    const calendar = google.calendar({version: 'v3', auth });

    const event = {
        summary: discordEvent.name,
        description: discordEvent.description || "Discord Event",
        start: {
            dateTime: discordEvent.scheduledStartTimestamp
                ? new Date(discordEvent.scheduledStartTimestamp).toISOString()
                : new Date().toISOString(),
            timeZone: "UTC",
        },
        end: {
            dateTime: discordEvent.scheduledEndTimestamp
                ? new Date(discordEvent.scheduledEndTimestamp).toISOString()
                : new Date(new Date().getTime() + 3600000).toISOString(), // Default 1-hour event
            timeZone: "UTC",
        },
        location: discordEvent.entityMetadata?.location || "Online",
    };

    try {
        const response = await calendar.events.insert({
            calendarId: CALENDAR_ID,
            resource: event,
        });
        console.log("Event Created:", response.data.htmlLink);
        sendMessage(`New event created: **${discordEvent.name}**\n📅 ${response.data.htmlLink}`);
    } catch (error) {
        console.error("Error creating event:", error);
    }
}

async function deleteCalendarEvent(discordEvent, auth) {
    const calendar = google.calendar({ version: 'v3', auth });

    try {
        const eventList = await calendar.events.list({
            calendarId: CALENDAR_ID,
            q: discordEvent.name, // Searching event by name
        });
        const event = eventList.data.items.find(e => e.summary === discordEvent.name);
        if (!event) return console.log("Event not found in Google Calendar.");

        await calendar.events.delete({
            calendarId: CALENDAR_ID,
            eventId: event.id,
        });
        console.log("Event Deleted from Google Calendar.");
        sendMessage(`Event deleted: **${discordEvent.name}**`);
    } catch (error) {
        console.error("Error deleting event:", error);
    }
}

async function updateCalendarEvent(discordEvent, auth) {
    const calendar = google.calendar({ version: 'v3', auth });

    try {
        const eventList = await calendar.events.list({
            calendarId: CALENDAR_ID,
            q: discordEvent.name, // Searching event by name
        });
        const event = eventList.data.items.find(e => e.summary === discordEvent.name);
        if (!event) return console.log("Event not found in Google Calendar."), await createCalendarEvent(discordEvent, auth);

        const updatedEvent = {
            summary: discordEvent.name,
            description: discordEvent.description || "Discord Event",
            start: {
                dateTime: new Date(discordEvent.scheduledStartTimestamp).toISOString(),
                timeZone: "UTC",
            },
            end: {
                dateTime: new Date(discordEvent.scheduledEndTimestamp).toISOString(),
                timeZone: "UTC",
            },
            location: discordEvent.entityMetadata?.location || "Online",
        };

        await calendar.events.update({
            calendarId: CALENDAR_ID,
            eventId: event.id,
            resource: updatedEvent,
        });
        console.log("Event Updated in Google Calendar.");
        sendMessage(`Event updated: **${discordEvent.name}**`);
    } catch (error) {
        console.error("Error updating event:", error);
    }
}

// Event listener for new Discord events
client.on("guildScheduledEventCreate", async (event) => {
    console.log(`New Discord event created: ${event.name}`);
    const auth = await authorize();
    await createCalendarEvent(event, auth);
});

client.on("guildScheduledEventUpdate", async (oldEvent, newEvent) => {
    console.log(`Discord event updated: ${newEvent.name}`);
    const auth = await authorize();
    await updateCalendarEvent(newEvent, auth);
});


client.on("guildScheduledEventDelete", async (event) => {
    console.log(`Discord event deleted: ${event.name}`);
    const auth = await authorize();
    await deleteCalendarEvent(event, auth);
});

client.on("ready", () => {
    client.user.setActivity({
        name: "THE SPINE",
        type: ActivityType.Watching
    })
});


// Login the bot
client.login(DISCORD_TOKEN);
