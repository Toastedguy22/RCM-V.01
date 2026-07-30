// tasks.js
import { EmbedBuilder } from "discord.js";
import fs from "fs";

const TASK_FILE = "tasks.json";

// ─── Database ─────────────────────────────────────────────

function loadTasks() {
  try {
    if (fs.existsSync(TASK_FILE)) {
      return JSON.parse(fs.readFileSync(TASK_FILE, "utf8"));
    }
  } catch (err) {
    console.error("Failed loading tasks:", err);
  }

  return {
    counter: 0,
    tasks: []
  };
}

function saveTasks(data) {
  try {
    fs.writeFileSync(
      TASK_FILE,
      JSON.stringify(data, null, 2)
    );
  } catch (err) {
    console.error("Failed saving tasks:", err);
  }
}


// ─── Command Handler ──────────────────────────────────────

export async function handleTaskCommand(interaction) {

  const data = loadTasks();


  // /assign
  if (interaction.commandName === "assign") {

    const user = interaction.options.getUser("user");
    const taskText = interaction.options.getString("task");

    data.counter++;

    const task = {
      id: data.counter,
      userId: user.id,
      assignedBy: interaction.user.id,
      task: taskText,
      completed: false,
      created: Date.now()
    };

    data.tasks.push(task);

    saveTasks(data);

    const embed = new EmbedBuilder()
      .setColor(0x57F287)
      .setTitle("📌 New Task Assigned")
      .addFields(
        {
          name: "👤 Assigned to",
          value: `${user}`
        },
        {
          name: "📝 Task",
          value: taskText
        },
        {
          name: "🔢 Task ID",
          value: `#${task.id}`
        },
        {
          name: "👨‍💼 Assigned by",
          value: `${interaction.user}`
        }
      )
      .setTimestamp();

    return interaction.reply({
      content: `${user}`,
      embeds: [embed]
    });
  }


  // /tasks
  if (interaction.commandName === "tasks") {

    if (!data.tasks.length) {
      return interaction.reply({
        content: "📋 There are no tasks.",
        flags: 64
      });
    }

    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle("📋 All Tasks");


    for (const task of data.tasks) {

      embed.addFields({
        name:
          `#${task.id} ${task.completed ? "✅ Completed" : "⏳ Pending"}`,

        value:
          `👤 <@${task.userId}>\n` +
          `📝 ${task.task}`
      });

    }

    return interaction.reply({
      embeds: [embed],
      flags: 64
    });
  }


  // /mytasks
  if (interaction.commandName === "mytasks") {

    const myTasks = data.tasks.filter(
      task =>
        task.userId === interaction.user.id &&
        !task.completed
    );


    if (!myTasks.length) {

      return interaction.reply({
        content: "✅ You have no active tasks.",
        flags: 64
      });

    }


    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle(`📋 Tasks for ${interaction.user.username}`);


    for (const task of myTasks) {

      embed.addFields({
        name: `#${task.id}`,
        value: task.task
      });

    }


    return interaction.reply({
      embeds: [embed],
      flags: 64
    });
  }


  // /done
  if (interaction.commandName === "done") {

    const number = interaction.options.getInteger("number");

    const task = data.tasks.find(
      t => t.id === number
    );


    if (!task) {

      return interaction.reply({
        content: "❌ Task not found.",
        flags: 64
      });

    }


    if (task.userId !== interaction.user.id) {

      return interaction.reply({
        content: "❌ This task is not assigned to you.",
        flags: 64
      });

    }


    task.completed = true;

    saveTasks(data);


    const embed = new EmbedBuilder()
      .setColor(0x57F287)
      .setTitle("✅ Task Completed")
      .setDescription(
        `Task #${task.id}\n${task.task}`
      )
      .setFooter({
        text: `Completed by ${interaction.user.tag}`
      })
      .setTimestamp();


    return interaction.reply({
      embeds: [embed]
    });

  }

}