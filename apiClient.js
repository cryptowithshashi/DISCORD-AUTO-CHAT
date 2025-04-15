/**
 * apiClient.js
 * Handles interactions with external APIs (Discord, Google Generative Language).
 * Created by crypto with shashi
 */

const axios = require('axios');

// Base URL for Discord API
const DISCORD_API_BASE = 'https://discord.com/api/v9';
// Base URL for Google Generative Language API
const GOOGLE_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent';

/**
 * Creates standard headers for Discord API requests.
 * @param {string} token - The Discord bot token.
 * @returns {object} Headers object.
 */
const createDiscordHeaders = (token) => ({
    'Authorization': token,
    'Content-Type': 'application/json',
    'User-Agent': 'DiscordBot (Node.js, 1.0)' // Good practice to identify your bot
});

/**
 * Creates standard headers for Google Generative Language API requests.
 * @returns {object} Headers object.
 */
const createGoogleHeaders = () => ({
    'Content-Type': 'application/json'
});

/**
 * Fetches messages from a specific Discord channel.
 * @param {string} channelId - The ID of the Discord channel.
 * @param {string} token - The Discord bot token.
 * @returns {Promise<Array|null>} A promise resolving to an array of messages or null on error.
 */
async function fetchMessages(channelId, token) {
    const url = `${DISCORD_API_BASE}/channels/${channelId}/messages?limit=5`; // Fetch last 5 messages
    const headers = createDiscordHeaders(token);
    try {
        const response = await axios.get(url, { headers });
        return response.data;
    } catch (error) {
        console.error(`[API Error] Failed to fetch messages for channel ${channelId}:`, error.response?.data || error.message);
        return null;
    }
}

/**
 * Sends a message to a specific Discord channel.
 * @param {string} channelId - The ID of the Discord channel.
 * @param {string} content - The message content to send.
 * @param {string} token - The Discord bot token.
 * @param {string|null} replyToMessageId - The ID of the message to reply to (optional).
 * @returns {Promise<object|null>} A promise resolving to the sent message data or null on error.
 */
async function sendMessage(channelId, content, token, replyToMessageId = null) {
    const url = `${DISCORD_API_BASE}/channels/${channelId}/messages`;
    const headers = createDiscordHeaders(token);
    const payload = { content };
    if (replyToMessageId) {
        payload.message_reference = { message_id: replyToMessageId };
    }
    try {
        const response = await axios.post(url, payload, { headers });
        return response.data;
    } catch (error) {
        console.error(`[API Error] Failed to send message to channel ${channelId}:`, error.response?.data || error.message);
        // Specific handling for slow mode might be needed based on error code/message
        if (error.response?.data?.retry_after) {
             console.warn(`[API Warn] Hit rate limit/slow mode in channel ${channelId}. Retry after: ${error.response.data.retry_after}s`);
             // The botLogic should handle this delay
        }
        return null;
    }
}

/**
 * Deletes a message from a specific Discord channel.
 * @param {string} channelId - The ID of the Discord channel.
 * @param {string} messageId - The ID of the message to delete.
 * @param {string} token - The Discord bot token.
 * @returns {Promise<boolean>} A promise resolving to true on success, false otherwise.
 */
async function deleteMessage(channelId, messageId, token) {
    const url = `${DISCORD_API_BASE}/channels/${channelId}/messages/${messageId}`;
    const headers = createDiscordHeaders(token);
    try {
        await axios.delete(url, { headers });
        return true;
    } catch (error) {
        console.error(`[API Error] Failed to delete message ${messageId} in channel ${channelId}:`, error.response?.data || error.message);
        return false;
    }
}

/**
 * Fetches information about the current bot user.
 * @param {string} token - The Discord bot token.
 * @returns {Promise<object|null>} A promise resolving to the user data or null on error.
 */
async function getBotInfo(token) {
    const url = `${DISCORD_API_BASE}/users/@me`;
    const headers = createDiscordHeaders(token);
    try {
        const response = await axios.get(url, { headers });
        return response.data;
    } catch (error) {
        console.error(`[API Error] Failed to fetch bot info for token ${token.substring(0, 5)}...:`, error.response?.data || error.message);
        return null;
    }
}

/**
 * Fetches channel information, including slow mode delay.
 * @param {string} channelId - The ID of the Discord channel.
 * @param {string} token - The Discord bot token.
 * @returns {Promise<object|null>} A promise resolving to channel data or null on error.
 */
async function getChannelInfo(channelId, token) {
    const url = `${DISCORD_API_BASE}/channels/${channelId}`;
    const headers = createDiscordHeaders(token);
    try {
        const response = await axios.get(url, { headers });
        // Fetch guild info if it's a guild channel
        if (response.data.guild_id) {
             const guildUrl = `${DISCORD_API_BASE}/guilds/${response.data.guild_id}`;
             try {
                 const guildResponse = await axios.get(guildUrl, { headers });
                 response.data.guild_name = guildResponse.data.name || 'Unknown Server';
             } catch (guildError) {
                 console.error(`[API Error] Failed to fetch guild info for channel ${channelId}:`, guildError.response?.data || guildError.message);
                 response.data.guild_name = 'Unknown Server (Error)';
             }
        } else {
            response.data.guild_name = 'Direct Message';
        }
        return response.data; // Includes name, rate_limit_per_user (slow mode), guild_id, guild_name
    } catch (error) {
        console.error(`[API Error] Failed to fetch channel info for ${channelId}:`, error.response?.data || error.message);
        return null;
    }
}


/**
 * Generates a reply using the Google Generative Language API (Gemini).
 * @param {string} userMessage - The user's message to reply to.
 * @param {string} apiKey - The Google API Key.
 * @param {string} promptLanguage - 'en' or 'id'.
 * @returns {Promise<string|null>} A promise resolving to the generated text or null on error/rate limit.
 */
async function generateGeminiReply(userMessage, apiKey, promptLanguage = 'id') {
    const url = `${GOOGLE_API_BASE}?key=${apiKey}`;
    const headers = createGoogleHeaders();

    let basePrompt;
    if (promptLanguage === 'id') {
        basePrompt = `Balas pesan berikut dalam bahasa Indonesia: "${userMessage}"`;
    } else if (promptLanguage === 'en') {
        basePrompt = `Reply to the following message in English: "${userMessage}"`;
    } else {
        console.error(`[API Error] Invalid prompt language: ${promptLanguage}`);
        return null; // Invalid language
    }

    // Refine the prompt for a conversational, single-sentence reply
    const refinedPrompt = `${basePrompt}\n\nBuatlah menjadi 1 kalimat menggunakan bahasa sehari-hari manusia.`;

    const data = {
        contents: [{
            parts: [{ text: refinedPrompt }]
        }],
        // Optional: Add safety settings if needed
        // safetySettings: [
        //   { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" }
        // ],
        // generationConfig: { // Optional: Control generation parameters
        //   temperature: 0.7,
        //   maxOutputTokens: 100
        // }
    };

    try {
        const response = await axios.post(url, data, { headers });
        if (response.data.candidates && response.data.candidates.length > 0 &&
            response.data.candidates[0].content && response.data.candidates[0].content.parts &&
            response.data.candidates[0].content.parts.length > 0) {
            return response.data.candidates[0].content.parts[0].text.trim();
        } else {
            // Handle cases where the response structure is unexpected or content is blocked
             console.warn('[API Warn] Gemini response structure unexpected or content missing/blocked:', response.data);
             if (response.data.promptFeedback?.blockReason) {
                 console.warn(`[API Warn] Gemini prompt blocked due to: ${response.data.promptFeedback.blockReason}`);
             }
             return null; // Indicate an issue with the response content
        }
    } catch (error) {
        if (error.response && error.response.status === 429) {
            // Specific handling for rate limits
            console.warn(`[API Warn] Google API key rate limited (429). Key: ${apiKey.substring(0, 5)}...`);
            return 'RATE_LIMITED'; // Special return value for rate limit
        } else {
            // General error handling
            console.error('[API Error] Failed to generate Gemini reply:', error.response?.data || error.message);
            return null; // Indicate a general error
        }
    }
}


module.exports = {
    fetchMessages,
    sendMessage,
    deleteMessage,
    getBotInfo,
    getChannelInfo,
    generateGeminiReply
};
