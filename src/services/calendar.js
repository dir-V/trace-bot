const { google } = require("googleapis");
const { CALENDAR_ID, CHANNEL_ID } = require("../config/constants");
const { sendMessage } = require("../services/discordService");

// ADDING EVENT TO GOOGLE CALENDAR FROM A DISCORD EVENT 
// Creating a new event in google calendar
async function createCalendarEvent(discordEvent, auth,) {
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
    } catch (error) {
        console.error("Error creating event:", error);
    }
}

// Deleting an event from google calendar if discord event is deleted
async function deleteCalendarEvent(discordEvent, auth,) {
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
    } catch (error) {
        console.error("Error deleting event:", error);
    }
}

// Updating an event from google calendar if discord event is updated
async function updateCalendarEvent(discordEvent, auth) {
    const calendar = google.calendar({ version: 'v3', auth });

    try {
        const eventList = await calendar.events.list({
            calendarId: CALENDAR_ID,
            q: discordEvent.name,
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
    } catch (error) {
        console.error("Error updating event:", error);
    }
}

module.exports = { createCalendarEvent, updateCalendarEvent, deleteCalendarEvent };