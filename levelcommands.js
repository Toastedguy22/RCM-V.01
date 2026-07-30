// levelcommands.js

import fs from "fs";
import { EmbedBuilder, PermissionFlagsBits } from "discord.js";

const LEVEL_FILE = "levels.json";



function loadLevels() {

  if (fs.existsSync(LEVEL_FILE)) {

    return JSON.parse(
      fs.readFileSync(
        LEVEL_FILE,
        "utf8"
      )
    );

  }


  return {
    users: {}
  };

}




function saveLevels(data) {

  fs.writeFileSync(
    LEVEL_FILE,
    JSON.stringify(data, null, 2)
  );

}



// XP som krävs för nästa level

function getXPForNextLevel(level) {

  return (level + 1) * (level + 1) * 100;

}




export async function handleLevelCommand(interaction) {



  // ==========================
  // /rank
  // ==========================


  if (interaction.commandName === "rank") {


    const data = loadLevels();


    const user =
      interaction.options.getUser("user")
      || interaction.user;



    const stats =
      data.users[user.id];



    if (!stats) {

      return interaction.reply({

        content:
        "📊 No level data found.",

        flags: 64

      });

    }



    const needed =
      getXPForNextLevel(
        stats.level
      );



    const embed =
      new EmbedBuilder()

      .setColor(0x5865F2)

      .setTitle(
        `📈 ${user.username}'s Rank`
      )

      .setThumbnail(
        user.displayAvatarURL()
      )

      .addFields(

        {
          name: "⭐ Level",
          value:
          `${stats.level}`,
          inline: true
        },

        {
          name: "✨ XP",
          value:
          `${stats.xp}/${needed}`,
          inline: true
        }

      )

      .setTimestamp();



    return interaction.reply({

      embeds:[
        embed
      ]

    });



  }




  // ==========================
  // /leaderboard
  // ==========================


  if (interaction.commandName === "leaderboard") {


    const data =
      loadLevels();



    const users =
      Object.entries(data.users)

      .sort(
        (a,b)=>
        b[1].xp - a[1].xp
      )

      .slice(0,10);



    if (!users.length) {

      return interaction.reply({

        content:
        "📊 No users yet.",

        flags:64

      });

    }




    let text = "";

    let position = 1;



    for (const [id, user] of users) {


      text +=
      `**${position}.** <@${id}> — Level ${user.level} (${user.xp} XP)\n`;


      position++;

    }





    const embed =
      new EmbedBuilder()

      .setColor(0xFEE75C)

      .setTitle(
        "🏆 Level Leaderboard"
      )

      .setDescription(
        text
      )

      .setTimestamp();



    return interaction.reply({

      embeds:[
        embed
      ]

    });


  }





  // ==========================
  // /resetlevel
  // ==========================


  if (interaction.commandName === "resetlevel") {



    if (
      !interaction.member.permissions.has(
        PermissionFlagsBits.Administrator
      )
    ) {

      return interaction.reply({

        content:
        "❌ You need Administrator.",

        flags:64

      });

    }




    const user =
      interaction.options.getUser("user");



    const data =
      loadLevels();



    data.users[user.id] = {

      xp:0,

      level:0,

      lastMessage:0

    };



    saveLevels(data);



    return interaction.reply({

      content:
      `✅ Reset level for ${user}`

    });


  }



}