// discordlogs.js

import { EmbedBuilder } from "discord.js";

const LOG_CHANNEL_ID = "1530637401175621642";


export function setupDiscordLogs(client) {


  // Hämta loggkanalen
  function getLogChannel(guild) {
    return guild.channels.cache.get(LOG_CHANNEL_ID);
  }



  // ==========================
  // Deleted Messages
  // ==========================

  client.on("messageDelete", async (message) => {

    if (!message.guild) return;
    if (message.author?.bot) return;

    const channel = getLogChannel(message.guild);
    if (!channel) return;


    const embed = new EmbedBuilder()
      .setColor(0xED4245)
      .setTitle("🗑️ Message Deleted")
      .addFields(
        {
          name: "👤 User",
          value: message.author
            ? `${message.author}`
            : "Unknown"
        },
        {
          name: "📍 Channel",
          value: `${message.channel}`
        },
        {
          name: "💬 Content",
          value: message.content || "No content"
        }
      )
      .setTimestamp();


    channel.send({
      embeds: [embed]
    });

  });



  // ==========================
  // Edited Messages
  // ==========================

  client.on("messageUpdate", async (oldMessage, newMessage) => {

    if (!oldMessage.guild) return;
    if (oldMessage.author?.bot) return;

    if (oldMessage.content === newMessage.content) return;


    const channel = getLogChannel(oldMessage.guild);
    if (!channel) return;


    const embed = new EmbedBuilder()
      .setColor(0xFEE75C)
      .setTitle("✏️ Message Edited")
      .addFields(
        {
          name: "👤 User",
          value: `${oldMessage.author}`
        },
        {
          name: "📍 Channel",
          value: `${oldMessage.channel}`
        },
        {
          name: "Before",
          value: oldMessage.content || "Empty"
        },
        {
          name: "After",
          value: newMessage.content || "Empty"
        }
      )
      .setTimestamp();


    channel.send({
      embeds: [embed]
    });

  });



  // ==========================
  // Role Created
  // ==========================

  client.on("roleCreate", async (role) => {

    const channel = getLogChannel(role.guild);
    if (!channel) return;


    const embed = new EmbedBuilder()
      .setColor(0x57F287)
      .setTitle("🆕 Role Created")
      .addFields(
        {
          name: "Role",
          value: `${role}`
        },
        {
          name: "ID",
          value: role.id
        }
      )
      .setTimestamp();


    channel.send({
      embeds: [embed]
    });

  });



  // ==========================
  // Role Deleted
  // ==========================

  client.on("roleDelete", async (role) => {

    const channel = getLogChannel(role.guild);
    if (!channel) return;


    const embed = new EmbedBuilder()
      .setColor(0xED4245)
      .setTitle("❌ Role Deleted")
      .addFields({
        name: "Role",
        value: role.name
      })
      .setTimestamp();


    channel.send({
      embeds: [embed]
    });

  });



  // ==========================
  // Member Joined
  // ==========================

  client.on("guildMemberAdd", async (member) => {

    const channel = getLogChannel(member.guild);
    if (!channel) return;


    const embed = new EmbedBuilder()
      .setColor(0x57F287)
      .setTitle("👋 Member Joined")
      .addFields(
        {
          name: "User",
          value: `${member}`
        },
        {
          name: "Account Created",
          value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`
        }
      )
      .setTimestamp();


    channel.send({
      embeds: [embed]
    });

  });



  // ==========================
  // Member Left
  // ==========================

  client.on("guildMemberRemove", async (member) => {

    const channel = getLogChannel(member.guild);
    if (!channel) return;


    const embed = new EmbedBuilder()
      .setColor(0xED4245)
      .setTitle("🚪 Member Left")
      .addFields({
        name: "User",
        value: `${member.user.tag}`
      })
      .setTimestamp();


    channel.send({
      embeds: [embed]
    });

  });



  // ==========================
  // Channel Created
  // ==========================

  client.on("channelCreate", async (channel) => {

    if (!channel.guild) return;

    const logChannel = getLogChannel(channel.guild);
    if (!logChannel) return;


    const embed = new EmbedBuilder()
      .setColor(0x57F287)
      .setTitle("📁 Channel Created")
      .addFields(
        {
          name: "Channel",
          value: `${channel}`
        },
        {
          name: "Type",
          value: channel.type.toString()
        }
      )
      .setTimestamp();


    logChannel.send({
      embeds: [embed]
    });

  });



  // ==========================
  // Channel Deleted
  // ==========================

  client.on("channelDelete", async (channel) => {

    if (!channel.guild) return;

    const logChannel = getLogChannel(channel.guild);
    if (!logChannel) return;


    const embed = new EmbedBuilder()
      .setColor(0xED4245)
      .setTitle("🗑️ Channel Deleted")
      .addFields({
        name: "Channel",
        value: channel.name
      })
      .setTimestamp();


    logChannel.send({
      embeds: [embed]
    });

  });



  console.log("✅ Discord logging system loaded");

}