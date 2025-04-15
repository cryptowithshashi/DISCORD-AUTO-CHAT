
# DISCORD AUTO CHAT BOT

This Repository is a Node.js version of a Discord bot with a real-time Terminal User Interface (TUI). It supports multiple bot accounts, optional Gemini AI replies, and live monitoring of activity in a visually organized terminal layout.

# Features

- Multi-Account Support: Run multiple Discord bots concurrently.

- Multi-Channel Monitoring: Define and manage specific Discord channels to monitor.

- Gemini AI Integration (optional):
  - Auto-reply using Google's Gemini AI.
  - English (en) language support.
  - API key rotation and cooldown management on rate limits     (429 errors).

- Fallback Message Mode: Sends random messages from info.txt when AI is disabled.

- .env Configurations: Flexible environment-based setup.

- Smart Slow Mode Handling: Adjusts message rates based on channel slow mode.

- Auto Message Deletion: Control message lifespan after sending.

# Pre Requisites

- Install Node.js and npm

```bash
   node -v
   npm -v
```

# INSTALLATION GUIDE

### Clone or Download the Repository

```bash
   git clone https://github.com/cryptowithshashi/DISCORD-AUTO-CHAT.git
   cd DISCORD-AUTO-CHAT
```
Or extract from a ZIP and cd into the folder.

### Install Dependencies

```bash
   npm install
```

##  Configure the Bot (.env)

Copy and edit the .env file:

```bash
   nano .env
```   
Edit it with your credentials:

- DISCORD_TOKENS — Your bot token(s), comma-separated.
 
  How to obtain your bot token (advanced method):
   - Log into Discord.
   - Press `F12` or right-click and choose Inspect to open Developer Tools.
   - Go to the Console tab.
   - Paste the following:
  
    ```bash
    (
        webpackChunkdiscord_app.push(
            [
                [''],
                {},
                e => {
                    m=[];
                    for(let c in e.c)
                        m.push(e.c[c])
                }
            ]
        ),
        m
    ).find(
        m => m?.exports?.default?.getToken !== void 0
    ).exports.default.getToken()
    ```
   - This will return your Discord token. Copy it and paste it into your `.env` file.

   - Use multiple tokens by separating them with commas (no spaces).

- GOOGLE_API_KEYS — Gemini API keys (only if AI is enabled).
  - How to get a Google Gemini API key:
  - Visit Google AI Studio.
  - Sign in with your Google account.
  - Click Create API Key.
  - Copy the key and paste it into your `.env` file.
  - You can include multiple keys, separated by commas, to avoid rate limits.

- CHANNEL_IDS — Channel IDs to monitor.
- Other settings:
  - USE_GEMINI_AI=true/false
  - PROMPT_LANGUAGE=en
  - INTERVAL_SECONDS=10
  - DELETE_MESSAGE_DELAY=5 or null

⚠️ Never share your .env file publicly. 

##  Run the Bot

```bash
   npm start
```   

## TUI Controls

- Focus Panes: Press `Tab` to switch between log and status views.
- Scroll: Arrow keys, PageUp/PageDown, or mouse.
- Exit: Press `Ctrl+C` to stop the bot.


| Issue     | Description                |
| :-------- | :------------------------- |
| `Cannot find module '...'` | Run npm install in the project folder |
| TUI opens, but logs show auth errors | Check `.env` token validity |
| `Missing Access` or 403 | Check bot permissions & channel IDs |
| 429 API Rate Limits | Add more Gemini keys or reduce activity rate |
| Terminal looks broken | Try a different terminal (Windows Terminal, etc.) |
| Bot doesn't respond | Confirm intents and permissions in the Developer Portal |


# Disclaimer

This project is for educational and personal use only.

- Extracting or using Discord tokens through browser developer tools may violate Discord's Terms of Service.
- The author is not responsible for any misuse, abuse, account bans, or damages caused by this software.
- Use at your own risk.
- Always follow platform rules and respect API rate limits.



ABOUT ME

Twitter -- https://x.com/SHASHI522004

Github -- https://github.com/cryptowithshashi
