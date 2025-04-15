/**
 * index.js
 * Main entry point for the Node.js Discord Bot TUI Monitor.
 * Initializes the UI and Bot Logic, and connects them.
 */

const TUI = require('./ui');
const BotLogic = require('./botLogic');
require('dotenv').config(); // Ensure .env is loaded

// --- Initialization ---
const ui = new TUI();
const botLogic = new BotLogic();

// --- Event Wiring ---

// Connect BotLogic logs to UI display
botLogic.on('log', (level, message) => {
    ui.addLog(level, message);
});

// Connect BotLogic status updates to UI display
botLogic.on('statusUpdate', () => {
    // Gather data needed for the status box
    const statusData = {
        botInfos: botLogic.getBotInfos(),
        channelDetails: botLogic.getChannelDetails(),
        discordTokens: botLogic.getDiscordTokens(),
        googleApiKeys: botLogic.getGoogleApiKeys(),
        channelIds: botLogic.getChannelIds(),
        rateLimitedKeys: botLogic.getRateLimitedKeys(),
        isRunning: botLogic.isRunningStatus()
    };
    ui.updateStatus(statusData);
});

// Handle shutdown signal from UI (e.g., Ctrl+C)
ui.on('shutdown', () => {
    botLogic.log('INFO', 'Shutdown signal received from UI. Stopping bot logic...');
    botLogic.stop(); // Gracefully stop the bot logic
    // Allow some time for cleanup if needed, then exit
    setTimeout(() => process.exit(0), 500);
});

// Handle shutdown signal from BotLogic (e.g., fatal error)
botLogic.on('shutdown', () => {
     // Log directly to console as UI might be part of the issue or shutting down
     console.log('Shutdown signal received from BotLogic. Exiting application.');
     // Ensure the process exits cleanly
     process.exit(1); // Use exit code 1 for errors
});


// --- Application Start ---

// Initial rendering of the UI
ui.render();
ui.addLog('INFO', '{cyan-fg}Initializing Application...{/cyan-fg}');

// Start the bot logic (this is asynchronous)
botLogic.start()
    .then(() => {
        ui.addLog('SUCCESS', '{green-fg}Bot Logic started successfully.{/green-fg}');
        // Initial status update after start
         const statusData = {
            botInfos: botLogic.getBotInfos(),
            channelDetails: botLogic.getChannelDetails(),
            discordTokens: botLogic.getDiscordTokens(),
            googleApiKeys: botLogic.getGoogleApiKeys(),
            channelIds: botLogic.getChannelIds(),
            rateLimitedKeys: botLogic.getRateLimitedKeys(),
            isRunning: botLogic.isRunningStatus()
        };
        ui.updateStatus(statusData);
    })
    .catch(error => {
        ui.addLog('ERROR', `{red-fg}FATAL ERROR during Bot Logic startup: ${error.message}{/red-fg}`);
        console.error("FATAL STARTUP ERROR:", error); // Also log detailed error to console
        // Consider attempting a clean shutdown or just exiting
        process.exit(1);
    });

// Handle unhandled promise rejections and uncaught exceptions
process.on('unhandledRejection', (reason, promise) => {
  ui.addLog('ERROR', `{red-fg}Unhandled Rejection at: ${promise}, reason: ${reason.stack || reason}{/red-fg}`);
  console.error('Unhandled Rejection:', reason);
  // Decide if you want to exit or attempt recovery
  // process.exit(1);
});

process.on('uncaughtException', (error) => {
  ui.addLog('ERROR', `{red-fg}Uncaught Exception: ${error.stack || error}{/red-fg}`);
  console.error('Uncaught Exception:', error);
  // It's generally recommended to exit after an uncaught exception
  process.exit(1);
});
