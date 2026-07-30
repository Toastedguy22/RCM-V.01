// reminders.js

import fs from "fs";
import { EmbedBuilder } from "discord.js";

const FILE = "reminders.json";


// ===============================
// Database
// ===============================

function loadReminders() {

  if (fs.existsSync(FILE)) {

    return JSON.parse(
      fs.readFileSync(FILE, "utf8")
    );

  }

  return [];

}



function saveReminders(data) {

  fs.writeFileSync(
    FILE,
    JSON.stringify(data, null, 2)
  );

}



// ===============================
// Time converter
// ===============================

function parseTime(time) {

  const match = time.match(/^(\d+)(m|h|d)$/);

  if (!match) return null;


  const amount = Number(match[1]);
  const unit = match[2];


  if (unit === "m")
    return amount * 60 * 1000;


  if (unit === "h")
    return amount * 60 * 60 * 1000;


  if (unit === "d")
    return amount * 24 * 60 * 60 * 1000;


  return null;

}



// ===============================
// /remind command
// ===============================

export async function handleReminderCommand(interaction) {


  if (interaction.commandName !== "remind")
    return;



  const user =
    interaction.options.getUser("user");


  const message =
    interaction.options.getString("message");


  const type =
    interaction.options.getString("type");


  const time =
    interaction.options.getString("time");


  const day =
    interaction.options.getString("day");



  const reminders = loadReminders();



  // ONE TIME REMINDER

  if (type === "once") {


    const ms = parseTime(time);


    if (!ms) {

      return interaction.reply({

        content:
        "❌ Use time like 10m, 2h or 1d.",

        flags: 64

      });

    }



    reminders.push({

      userId: user.id,

      message,

      type: "once",

      sendAt: Date.now() + ms

    });


  }



  // WEEKLY REMINDER

  if (type === "weekly") {


    if (!day) {

      return interaction.reply({

        content:
        "❌ Weekly reminders need a day.",

        flags:64

      });

    }



    if (!time.includes(":")) {

      return interaction.reply({

        content:
        "❌ Weekly time must be like 18:30",

        flags:64

      });

    }



    reminders.push({

      userId: user.id,

      message,

      type: "weekly",

      day,

      time

    });


  }



  saveReminders(reminders);



  return interaction.reply({

    content:
    `✅ Reminder created for ${user}`

  });


}



// ===============================
// Reminder checker
// ===============================

export function startReminderSystem(client) {


  setInterval(async () => {


    const reminders =
      loadReminders();


    const remaining = [];


    const now =
      Date.now();



    for (const reminder of reminders) {


      let send = false;



      // ONE TIME

      if (
        reminder.type === "once" &&
        reminder.sendAt <= now
      ) {

        send = true;

      }



      // WEEKLY

      if (
        reminder.type === "weekly"
      ) {


        const current =
          new Date();



        const hour =
          Number(
            reminder.time.split(":")[0]
          );


        const minute =
          Number(
            reminder.time.split(":")[1]
          );



        if (

          current.getDay()
          .toString()
          === reminder.day

          &&

          current.getHours()
          === hour

          &&

          current.getMinutes()
          === minute

        ) {

          send = true;

        }


      }




      if (send) {


        try {


          const user =
            await client.users.fetch(
              reminder.userId
            );



          await user.send({

            embeds:[

              new EmbedBuilder()

              .setColor(0x5865F2)

              .setTitle("🔔 Reminder")

              .setDescription(
                reminder.message
              )

              .setTimestamp()

            ]

          });


        } catch (err) {

          console.error(
            "Reminder DM failed:",
            err
          );

        }



        // Behåll weekly

        if (
          reminder.type === "weekly"
        ) {

          remaining.push(reminder);

        }


      } else {


        remaining.push(reminder);


      }


    }



    saveReminders(
      remaining
    );



  }, 10000);



  console.log(
    "✅ Reminder system loaded"
  );

}
