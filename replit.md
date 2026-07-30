# Discord Suggestion Bot

A Discord bot that collects game suggestions from server members. When a suggestion receives 10 👍 upvotes, it is automatically forwarded to a dedicated suggestion center channel.

## Features

- `/suggest <text>` slash command — anyone can submit a suggestion
- Suggestions are posted in a `#💡〙suggestions` channel with a 👍 reaction
- The embed updates live showing current upvote progress (e.g. "3/10 upvotes")
- Once a suggestion hits 10 upvotes it is forwarded to `#suggestion-center` exactly once
- Forwarded suggestion IDs are persisted in `suggestions.json` to prevent duplicates

## Setup

### Required Secrets

| Secret | Description |
|--------|-------------|
| `DISCORD_TOKEN` | Bot token from the Discord Developer Portal |
| `DISCORD_CLIENT_ID` | Application / Client ID from the Developer Portal |

### Optional Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DISCORD_GUILD_ID` | *(empty)* | Guild ID for instant command registration (testing). Leave empty for global registration. |
| `SUGGESTIONS_CHANNEL` | `💡〙suggestions` | Name of the channel where suggestions are posted |
| `SUGGESTION_CENTER_CHANNEL` | `suggestion-center` | Name of the channel where approved suggestions appear |

### Discord Setup Steps

1. Go to https://discord.com/developers/applications and create a new application
2. Under **Bot**, create a bot and copy the token → save as `DISCORD_TOKEN` secret
3. Copy the **Application ID** → save as `DISCORD_CLIENT_ID` secret
4. Under **OAuth2 → URL Generator**, select scopes: `bot`, `applications.commands`
5. Select bot permissions: `Send Messages`, `Embed Links`, `Add Reactions`, `Read Message History`, `View Channels`
6. Invite the bot to your server using the generated URL
7. Create `#suggestions` and `#suggestion-center` channels in your server
8. Run `node register-commands.js` once to register the `/suggest` slash command
9. Start the bot with `node index.js`

## User preferences

- Use ES modules (`"type": "module"`)
