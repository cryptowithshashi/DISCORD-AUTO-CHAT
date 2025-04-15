/**
 * ui.js
 * Manages the Terminal User Interface (TUI) using the 'blessed' library.
 * Corrected layout calculation for success/status boxes.
 */

const blessed = require('blessed');

class TUI {
    constructor() {
        // Create a screen object.
        this.screen = blessed.screen({
            smartCSR: true,
            title: 'SEAL BOT TUI Monitor',
            fullUnicode: true,
            dockBorders: true,
            autoPadding: true
        });

        // --- Focus Management ---
        this.scrollablePanes = [];
        this.currentFocusIndex = 0;

        // --- Define common focus style ---
        this.focusStyle = {
             border: { fg: 'yellow' }
        };

        this.initComponents(); // Create the layout components
        this.attachHandlers(); // Attach event listeners

        // Set initial focus and render
        if (this.scrollablePanes.length > 0) {
            this.scrollablePanes[0].focus();
        }
        this.render();
    }

    /**
     * Creates and lays out the TUI components (boxes).
     */
    initComponents() {
        const bannerHeight = 3; // Height for the top banner box
        const mainLogWidth = '65%';
        const sidePanelWidth = '35%';
        const sidePanelLeft = mainLogWidth;

        // Box 1: Top Banner
        this.bannerBox = blessed.box({
            parent: this.screen,
            top: 0, left: 0, width: '100%', height: bannerHeight,
            content: '{center}{bold}SEAL BOT -- BY CRYPTO WITH SHASHI | CWS{/bold}{/center}',
            tags: true,
            style: { fg: 'white', bg: 'blue', bold: true, border: { fg: 'white' } },
            border: { type: 'line' }
        });

        // Box 2: Main Log Area (Left)
        this.mainLogBox = blessed.log({
            parent: this.screen,
            label: ' {bold}Main Log{/bold} ',
            tags: true,
            top: bannerHeight, left: 0, width: mainLogWidth, height: `100%-${bannerHeight}`,
            border: { type: 'line' },
            style: {
                fg: 'white', bg: 'black',
                border: { fg: 'blue' }, // Default border
                label: { fg: 'cyan', bold: true },
                scrollbar: { bg: 'cyan', fg: 'black' },
                focus: this.focusStyle // Apply yellow border on focus
            },
            wrap: true, scrollable: true, alwaysScroll: true,
            scrollbar: { ch: ' ', track: { bg: 'grey' }, style: { inverse: true } },
            mouse: true, keys: true, vi: true,
        });
        this.scrollablePanes.push(this.mainLogBox);

        // --- Right Panel Layout Correction ---
        // Define heights relative to screen height, position using top offset

        // Box 3: Success Log Area (Top Right)
        this.successLogBox = blessed.log({
            parent: this.screen,
            label: ' {bold}Success Log{/bold} ',
            tags: true,
            top: bannerHeight, // Start below banner
            left: sidePanelLeft,
            width: sidePanelWidth,
            height: '55%-1', // Approx 55% of screen height, adjust slightly for borders/banner
            border: { type: 'line' },
            style: {
                fg: 'white', bg: 'black',
                border: { fg: 'green' }, // Default border
                label: { fg: 'green', bold: true },
                scrollbar: { bg: 'green', fg: 'black' },
                focus: this.focusStyle // Apply yellow border on focus
            },
            scrollable: true, alwaysScroll: true,
            scrollbar: { ch: ' ', track: { bg: 'grey' }, style: { inverse: true } },
            mouse: true, keys: true, vi: true,
        });
        this.scrollablePanes.push(this.successLogBox);

        // Box 4: Status / Info Area (Bottom Right)
        this.statusBox = blessed.box({
            parent: this.screen,
            label: ' {bold}Status & Info{/bold} ',
            content: 'Initializing...',
            tags: true,
            top: `55%+${bannerHeight-1}`, // Start below Success Log (55%) and Banner (3), adjust overlap
            left: sidePanelLeft,
            width: sidePanelWidth,
            height: `45%-1`, // Fill remaining height (approx 45%), adjust slightly
            border: { type: 'line' },
            style: {
                fg: 'white', bg: 'black',
                border: { fg: 'yellow' }, // Default border
                label: { fg: 'yellow', bold: true },
                scrollbar: { bg: 'yellow', fg: 'black' },
                focus: this.focusStyle // Apply yellow border on focus
            },
            scrollable: true, alwaysScroll: true,
            scrollbar: { ch: ' ', track: { bg: 'grey' }, style: { inverse: true } },
            mouse: true, keys: true, vi: true,
        });
        this.scrollablePanes.push(this.statusBox);
    }

    /**
     * Attaches event handlers for logger events and screen interactions.
     */
    attachHandlers() {
        // Listen for 'log' events from BotLogic
        this.on('log', (level, message) => {
            this.addLog(level, message);
        });

        // Listen for 'statusUpdate' events from BotLogic
        this.on('statusUpdate', (statusData) => {
             this.updateStatus(statusData);
        });

        // Handle screen resize
        this.screen.on('resize', () => {
            this.screen.render();
        });

        // Handle Ctrl+C, q, escape for clean exit
        this.screen.key(['C-c', 'q', 'escape'], (ch, key) => {
            this.emit('shutdown');
        });

        // Handle Tab key press to cycle focus forward
        this.screen.key(['tab'], (ch, key) => {
            this.currentFocusIndex = (this.currentFocusIndex + 1) % this.scrollablePanes.length;
            this.scrollablePanes[this.currentFocusIndex].focus();
            this.screen.render();
        });

         // Handle Shift+Tab key press to cycle focus backward
        this.screen.key(['S-tab'], (ch, key) => {
             this.currentFocusIndex = (this.currentFocusIndex - 1 + this.scrollablePanes.length) % this.scrollablePanes.length;
             this.scrollablePanes[this.currentFocusIndex].focus();
             this.screen.render();
        });

        // Enable mouse event handling
        this.screen.enableMouse();
    }

    /**
     * Adds a log message (already formatted) to the appropriate log box.
     * @param {string} level - Log level (SUCCESS, ERROR, etc.).
     * @param {string} message - The pre-formatted log message string.
     */
    addLog(level, message) {
         try {
            if (level === 'SUCCESS') {
                this.successLogBox.log(message);
            } else {
                this.mainLogBox.log(message);
            }
            this.screen.render();
        } catch (e) {
             console.error("TUI Log Error:", e, "Original Msg:", message);
        }
    }

    /**
     * Formats the content for the status box, including instructions.
     * @param {object} statusData - Object from botLogic.
     * @returns {string} Formatted string for status box content.
     */
    formatStatusContent(statusData) {
        const {
            botInfos = {}, channelDetails = {}, discordTokens = [], googleApiKeys = [], channelIds = [],
            rateLimitedKeys = new Map(), isRunning = false
        } = statusData; // Destructure with defaults

        let content = `{bold}Status:{/} ${isRunning ? '{green-fg}Running{/green-fg}' : '{red-fg}Stopped{/red-fg}'}\n`;

        // Discord Tokens
        const loadedBotsCount = Object.keys(botInfos).length;
        content += `\n{bold}Discord Tokens (${loadedBotsCount}/${discordTokens.length} loaded):{/}\n`;
        if (discordTokens.length > 0) {
            discordTokens.forEach((token, index) => {
                const info = Object.values(botInfos).find(bInfo => bInfo.tokenRef === token);
                const masked = `${token.substring(0, 5)}...${token.substring(token.length - 4)}`;
                content += ` T${index + 1}: ${masked} ${info ? `({green-fg}${info.fullUsername}{/green-fg})` : '({red-fg}X{/red-fg})'}\n`;
            });
        } else { content += " (None)\n"; }

        // Google API Keys
        content += `\n{bold}Google API Keys (${googleApiKeys.length}):{/}\n`;
        if (googleApiKeys.length > 0) {
            googleApiKeys.forEach((key, index) => {
                const masked = `${key.substring(0, 5)}...${key.substring(key.length - 4)}`;
                const expiry = rateLimitedKeys.get(key);
                const limited = expiry && expiry > Date.now();
                const remaining = limited ? ` (~${Math.ceil((expiry - Date.now()) / 1000 / 60)}m)` : '';
                content += ` K${index + 1}: ${masked} ${limited ? `{red-fg}Limited${remaining}{/red-fg}` : '{green-fg}Active{/green-fg}'}\n`;
            });
        } else { content += " (None)\n"; }

        // Monitored Channels
        content += `\n{bold}Channels (${channelIds.length}):{/}\n`;
        if (channelIds.length > 0) {
            channelIds.forEach((id) => {
                const details = channelDetails[id];
                // Shorten ID for display
                const shortId = id.length > 6 ? `...${id.slice(-6)}` : id;
                const name = details?.name || '...';
                // Check for the specific 'Missing Access' error if details indicate failure
                const status = details ? (details.error ? '{red-fg}Fail{/red-fg}' : '{green-fg}OK{/green-fg}') : '{yellow-fg}Init{/yellow-fg}';
                content += ` ${shortId}: ${name.substring(0,15)} (${status})\n`; // Show more name chars
            });
        } else { content += " (None)\n"; }

        // Instructions
        content += `\n{bold}---------------------------------{/bold}\n`;
        content += `{bold}Controls:{/}\n`;
        content += ` {yellow-fg}Ctrl+C{/yellow-fg}, {yellow-fg}Q{/yellow-fg}, {yellow-fg}Esc{/yellow-fg}: Exit\n`;
        content += ` {yellow-fg}Tab{/yellow-fg}/{yellow-fg}S-Tab{/yellow-fg}    : Cycle Focus\n`;
        content += ` ({yellow-fg}Yellow Border{/yellow-fg} = Active Pane)\n`;
        content += ` {yellow-fg}Arrows{/yellow-fg}/{yellow-fg}PgUp/Dn{/yellow-fg}: Scroll Focused Pane`;

        return content;
    }


    /**
     * Updates the content of the status box with new data.
     * @param {object} statusData - The complete status data object from botLogic.
     */
    updateStatus(statusData) {
        const formattedContent = this.formatStatusContent(statusData);
        try {
            this.statusBox.setContent(formattedContent);
            this.screen.render();
        } catch (e) {
             console.error("TUI Status Update Error:", e);
        }
    }

    /** Renders the TUI screen. */
    render() {
        if (this.screen) {
            this.screen.render();
        }
    }

    /** Destroys the TUI screen. */
    destroy() {
        if (this.screen) {
            this.screen.destroy();
            this.screen = null;
            console.log("TUI Screen Destroyed.");
        }
    }

    // --- Event Emitter Passthrough ---
    on(event, listener) {
        if (this.screen) {
            this.screen.on(event, listener);
        }
    }
    emit(event, ...args) {
         if (this.screen) {
             this.screen.emit(event, ...args);
         }
    }
}

module.exports = TUI;
