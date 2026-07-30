// logs.js

import { EmbedBuilder } from "discord.js";
import fs from "fs";

const LOG_FILE = "logs.json";

function loadLogs() {
  try {
    if (fs.existsSync(LOG_FILE)) {
      return JSON.parse(fs.readFileSync(LOG_FILE, "utf8"));
    }
  } catch (err) {
    console.error("Failed loading logs:", err);
  }

  return {
    counter: 0,
    logs: []
  };
}


function saveLogs(data) {
  fs.writeFileSync(
    LOG_FILE,
    JSON.stringify(data, null, 2)
  );
}


export async function handleLogCommand(interaction) {

  if (interaction.commandName !== "newlog") return;


  const data = loadLogs();


  const type = interaction.options.getString("type");
  const user = interaction.options.getUser("user");
  const reason = interaction.options.getString("reason");


  data.counter++;


  const log = {
    id: data.counter,
    type: type,
    userId: user.id,
    reason: reason,
    createdBy: interaction.user.id,
    time: Date.now()
  };


  data.logs.push(log);

  saveLogs(data);


  let color = 0x5865F2;

  if (type === "warning") color = 0xFEE75C;
  if (type === "ban") color = 0xED4245;
  if (type === "event") color = 0x57F287;


  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle(`📋 New ${type.toUpperCase()} Log`)
    .addFields(
      {
        name: "👤 User",
        value: `${user}`
      },
      {
        name: "📝 Reason",
        value: reason
      },
      {
        name: "🔢 Log ID",
        value: `#${log.id}`
      },
      {
        name: "👮 Created by",
        value: `${interaction.user}`
      }
    )
    .setTimestamp();


  return interaction.reply({
    embeds: [embed]
  });

}