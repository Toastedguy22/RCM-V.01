import {
  Client,
  GatewayIntentBits,
  Partials,
  EmbedBuilder,
} from "discord.js";
import fs from "fs";
import http from "http";
import { handleTaskCommand } from "./tasks.js";
import { handleLogCommand } from "./logs.js";
import { setupDiscordLogs } from "./discordlogs.js";
import { setupSuggestionReactions } from "./suggest2.js";
import { 
 handleReminderCommand,
 startReminderSystem
} from "./reminders.js";
import { setupLevels } from "./levels.js";
import { handleLevelCommand } from "./levelcommands.js";
// ─── Uptime ping server ───────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({
    status: "online",
    bot: client.user?.tag ?? "connecting...",
    uptime: Math.floor(process.uptime()),
  }));
}).listen(PORT, () => {
  console.log(`🌐 Ping server listening on port ${PORT} (for UptimeRobot)`);
});

const UPVOTE_EMOJI  = "👍";
const DOWNVOTE_EMOJI = "👎";
const THRESHOLD_PCT  = 0.10; // 10% of server members
const DATA_FILE      = "suggestions.json";


// ─── Persistence ─────────────────────────────────────────────────────────────

function loadData() {
  try {
    if (fs.existsSync(DATA_FILE))
      return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  } catch (e) {
    console.error("Failed to load data:", e);
  }
  return { forwarded: [], counter: 0 };
}

function saveData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error("Failed to save data:", e);
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Build an emoji progress bar using green/grey squares */
function progressBar(current, needed, length = 10) {
  const pct    = needed > 0 ? Math.min(current / needed, 1) : 0;
  const filled = Math.round(pct * length);
  return "🟩".repeat(filled) + "⬛".repeat(length - filled);
}

/** Threshold for a guild: at least 1 vote always required */
function threshold(guild) {
  return Math.max(1, Math.ceil(guild.memberCount * THRESHOLD_PCT));
}

/** Build the suggestion embed (pending state) */
function buildSuggestionEmbed(opts) {
  const { number, text, authorId, authorTag, avatarURL, upvotes, downvotes, needed, approved } = opts;

  const net        = upvotes - downvotes;
  const bar        = progressBar(Math.max(net, 0), needed);
  const pct        = needed > 0 ? Math.min(Math.round((Math.max(net, 0) / needed) * 100), 100) : 0;
  const statusLine = approved
    ? "✅ **Approved** — added to the suggestion center!"
    : `⏳ **Pending** — needs ${needed} upvotes (10% of server)`;

  return new EmbedBuilder()
    .setColor(approved ? 0x57f287 : 0xfee75c)
    .setAuthor({
      name: `${authorTag} · Suggestion #${number}`,
      iconURL: avatarURL,
    })
    .setDescription(`> ${text}`)
    .addFields(
      {
        name: "Votes",
        value: `${UPVOTE_EMOJI} **${upvotes}** upvotes  ·  ${DOWNVOTE_EMOJI} **${downvotes}** downvotes`,
        inline: false,
      },
      {
        name: `Progress  ${pct}%`,
        value: `\`${bar}\`  **${Math.max(net, 0)}** / **${needed}** net upvotes needed`,
        inline: false,
      },
      {
        name: "Status",
        value: statusLine,
        inline: false,
      }
    )
    .setFooter({ text: `Suggestion #${number}  ·  React with 👍 or 👎 to vote` })
    .setTimestamp();
}

/** Build the approved embed posted in suggestion-center */
function buildApprovedEmbed(opts) {
  const { number, text, authorId, authorTag, avatarURL, upvotes, downvotes, needed, msgUrl } = opts;

  return new EmbedBuilder()
    .setColor(0x57f287)
    .setAuthor({
      name: `${authorTag} · Suggestion #${number}`,
      iconURL: avatarURL,
    })
    .setDescription(`> ${text}`)
    .addFields(
      {
        name: "Final Votes",
        value: `${UPVOTE_EMOJI} **${upvotes}** upvotes  ·  ${DOWNVOTE_EMOJI} **${downvotes}** downvotes`,
        inline: false,
      },
      {
        name: "Submitted by",
        value: `<@${authorId}>`,
        inline: true,
      },
      {
        name: "Original",
        value: `[Jump to suggestion](${msgUrl})`,
        inline: true,
      }
    )
    .setFooter({ text: `This suggestion reached 10% server upvotes and has been queued for the game!` })
    .setTimestamp();
}

// ─── Client ───────────────────────────────────────────────────────────────────

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
  ],
  partials: [Partials.Message, Partials.Reaction],
});

client.once("clientReady", () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  const suggestions = process.env.SUGGESTIONS_CHANNEL || "💡〙suggestions";
  const center      = process.env.SUGGESTION_CENTER_CHANNEL || "suggestion-center";
  console.log(`📋 Suggestions → #${1446928004700704789}   🏆 Center → #${center}`);
});

// ─── Slash commands ───────────────────────────────────────────────────────────

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.isChatInputCommand()) {
    await handleTaskCommand(interaction);
  if (interaction.isChatInputCommand()) {
    await handleLogCommand(interaction);
  }}
if (interaction.isChatInputCommand()) {
  await handleReminderCommand(interaction);
}
 if (interaction.isChatInputCommand()) {
   await handleLevelCommand(interaction);}
  
  

  // ── /suggest ────────────────────────────────────────────────────────────────
  if (interaction.commandName === "suggest") {
    const text        = interaction.options.getString("suggestion");
    const channelId = process.env.SUGGESTIONS_CHANNEL || "1446928004700704789";
    const channel     = interaction.guild.channels.cache.get(channelId);

    if (!channel) {
      return interaction.reply({
        content: `❌ No channel named **#${channelId}** found. Please create it first!`,
        flags: 64,
      });
    }

    // Load and bump counter
    const data   = loadData();
    data.counter = (data.counter || 0) + 1;
    const number = data.counter;

    const needed   = threshold(interaction.guild);
    const { user } = interaction;

    const embed = buildSuggestionEmbed({
      number,
      text,
      authorId:  user.id,
      authorTag: user.tag,
      avatarURL: user.displayAvatarURL(),
      upvotes:   0,
      downvotes: 0,
      needed,
      approved:  false,
    });

    const msg = await channel.send({ embeds: [embed] });
    await msg.react(UPVOTE_EMOJI);
    await msg.react(DOWNVOTE_EMOJI);
    // Bot seeds both reactions; counts subtract bot's own reactions when tallying

    // Create a discussion thread on the suggestion message
    let thread = null;
    try {
      thread = await msg.startThread({
        name: `💬 Suggestion #${number} — Discussion`,
        autoArchiveDuration: 1440, // archive after 24h of inactivity
        reason: `Discussion thread for suggestion #${number} by ${user.tag}`,
      });
      await thread.send({
        embeds: [
          new EmbedBuilder()
            .setColor(0x5865f2)
            .setDescription(
              `👋 **Welcome to the discussion for Suggestion #${number}!**\n\n` +
              `> ${text}\n\n` +
              `Share your thoughts, ideas, or feedback here. ` +
              `Head back to the main message to cast your 👍 or 👎 vote!`
            )
            .setFooter({ text: `Suggested by ${user.tag}` }),
        ],
      });
    } catch (e) {
      console.warn(`⚠️  Could not create thread for suggestion #${number}:`, e.message);
    }

    // Persist suggestion metadata
    data.suggestions = data.suggestions || {};
    data.suggestions[msg.id] = {
      number,
      text,
      authorId:  user.id,
      authorTag: user.tag,
      avatarURL: user.displayAvatarURL(),
      threadId:  thread?.id ?? null,
    };
    saveData(data);

    await interaction.reply({
      content: `✅ Suggestion **#${number}** posted in <#${channel.id}>! A discussion thread has been opened.`,
      flags: 64,
    });

    console.log(`📝 #${number} from ${user.tag}: "${text}" (msg ${msg.id}, thread ${thread?.id})`);

  // ── /suggestion-delete ──────────────────────────────────────────────────────
  } else if (interaction.commandName === "suggestion-delete") {
    const targetNumber = interaction.options.getInteger("number");
    const data         = loadData();
    const suggestions  = data.suggestions || {};

    // Find the message ID for this suggestion number owned by this user
    const entry = Object.entries(suggestions).find(
      ([, meta]) => meta.number === targetNumber && meta.authorId === interaction.user.id
    );

    if (!entry) {
      return interaction.reply({
        content: `❌ No suggestion **#${targetNumber}** found that belongs to you.`,
        flags: 64,
      });
    }

    const [msgId] = entry;

    // Delete the Discord message
    const channelId = process.env.SUGGESTIONS_CHANNEL || "1446928004700704789";
    const channel = interaction.guild.channels.cache.get(channelId);

    if (channel) {
      try {
        const msg = await channel.messages.fetch(msgId);
        await msg.delete();
      } catch {
        // Message already gone — still clean up data
      }
    }

    // Remove from data store
    delete data.suggestions[msgId];
    data.forwarded = (data.forwarded || []).filter((id) => id !== msgId);
    saveData(data);

    await interaction.reply({
      content: `🗑️ Suggestion **#${targetNumber}** has been deleted.`,
      flags: 64,
    });

    console.log(`🗑️ Suggestion #${targetNumber} deleted by ${interaction.user.tag}`);
  }
});

// ─── Reaction handler ────────────────────────────────────────────────────────

async function handleReaction(reaction, user) {
  // Resolve partials
  try {
    if (reaction.partial)         await reaction.fetch();
    if (reaction.message.partial) await reaction.message.fetch();
  } catch (e) {
    console.error("Failed to fetch partial:", e);
    return;
  }

  if (user.bot) return;

  const { emoji, message } = reaction;
  if (emoji.name !== UPVOTE_EMOJI && emoji.name !== DOWNVOTE_EMOJI) return;

  // Must be in the suggestions channel
  const channelId = process.env.SUGGESTIONS_CHANNEL || "1446928004700704789";
  if (message.channel.id !== channelId) return;

  // Must be a bot-sent embed
  if (!message.embeds?.length || !message.author?.bot) return;

  const data = loadData();
  const meta = data.suggestions?.[message.id];
  if (!meta) return; // Not a tracked suggestion

  // Count reactions, subtracting 1 from both sides for the bot's own seed reactions
  const upvoteReaction   = message.reactions.cache.get(UPVOTE_EMOJI);
  const downvoteReaction = message.reactions.cache.get(DOWNVOTE_EMOJI);
  const upvotes   = Math.max(0, (upvoteReaction?.count   || 1) - 1); // subtract bot's 👍 seed
  const downvotes = Math.max(0, (downvoteReaction?.count || 1) - 1); // subtract bot's 👎 seed

  const net    = upvotes - downvotes;
  const needed = threshold(message.guild);
  const approved = net >= needed;

  console.log(`${emoji.name} on #${meta.number}: 👍${upvotes} 👎${downvotes} net=${net} needed=${needed}`);

  // Update the embed
  const embed = buildSuggestionEmbed({
    ...meta,
    upvotes,
    downvotes,
    needed,
    approved,
  });
  await message.edit({ embeds: [embed] }).catch(() => {});

  // Forward if threshold hit and not yet forwarded
  if (approved) {
    if ((data.forwarded || []).includes(message.id)) return;

    const centerName    = process.env.SUGGESTION_CENTER_CHANNEL || "suggestion-center";
    const centerChannel = message.guild.channels.cache.find((c) => c.name === centerName);

    if (!centerChannel) {
      console.warn(`⚠️  Channel #${centerName} not found`);
      return;
    }

    const approvedEmbed = buildApprovedEmbed({
      ...meta,
      upvotes,
      downvotes,
      needed,
      msgUrl: message.url,
    });

    await centerChannel.send({ embeds: [approvedEmbed] });

    data.forwarded = data.forwarded || [];
    data.forwarded.push(message.id);
    saveData(data);

    console.log(`🏆 Suggestion #${meta.number} forwarded to #${centerName}!`);
  }
}

client.on("messageReactionAdd",    handleReaction);
client.on("messageReactionRemove", handleReaction); // also re-check on un-votes

// ─── Start ────────────────────────────────────────────────────────────────────

const token = process.env.DISCORD_TOKEN;
if (!token) {
  console.error("❌ DISCORD_TOKEN is not set.");
  process.exit(1);
}
startReminderSystem(client);
setupDiscordLogs(client);
setupSuggestionReactions(client);
setupLevels(client);
client.login(token);

