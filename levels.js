// levels.js

import fs from "fs";
import { EmbedBuilder } from "discord.js";

const LEVEL_FILE = "levels.json";


// ===============================
// Inställningar
// ===============================

const XP_PER_MESSAGE = 20;
const MESSAGE_COOLDOWN = 60000; // 60 sek

const XP_PER_VOICE_MINUTE = 10;


// Roller vid levels
// Byt ID till dina egna roller senare

const LEVEL_ROLES = {
  5: "ROLL_ID_HÄR",
  10: "ROLL_ID_HÄR",
  20: "ROLL_ID_HÄR",
  50: "ROLL_ID_HÄR"
};



// ===============================
// Database
// ===============================

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



// ===============================
// Level calculator
// ===============================

function getLevel(xp) {

  return Math.floor(
    Math.sqrt(xp / 100)
  );

}



// ===============================
// Add XP
// ===============================

async function addXP(client, user, amount) {


  const data = loadLevels();


  if (!data.users[user.id]) {

    data.users[user.id] = {
      xp: 0,
      level: 0,
      lastMessage: 0
    };

  }



  const oldLevel =
    data.users[user.id].level;



  data.users[user.id].xp += amount;



  const newLevel =
    getLevel(
      data.users[user.id].xp
    );


  data.users[user.id].level =
    newLevel;



  saveLevels(data);



  // Level up

  if (newLevel > oldLevel) {


    const guild =
      user.guilds?.cache;


    const member =
      await user.fetch()
        .catch(() => null);



    if (!member) return;



    const channel =
      member.guild.systemChannel;


    if (channel) {


      const embed =
        new EmbedBuilder()

        .setColor(0x57F287)

        .setTitle("🎉 Level Up!")

        .setDescription(
          `${user} reached **Level ${newLevel}**!`
        )

        .setTimestamp();



      channel.send({
        embeds: [embed]
      });


    }



    // Ge level-roll

    const roleID =
      LEVEL_ROLES[newLevel];


    if (roleID) {


      const role =
        member.guild.roles.cache.get(
          roleID
        );


      if (role) {

        member.roles.add(role)
          .catch(() => {});

      }

    }


  }

}




// ===============================
// Setup
// ===============================

export function setupLevels(client) {



  // TEXT XP

  client.on(
    "messageCreate",
    async (message) => {


      if (!message.guild) return;

      if (message.author.bot)
        return;



      const data =
        loadLevels();



      if (!data.users[message.author.id]) {

        data.users[message.author.id] = {
          xp: 0,
          level: 0,
          lastMessage: 0
        };

      }



      const last =
        data.users[message.author.id]
          .lastMessage;



      if (
        Date.now() - last
        < MESSAGE_COOLDOWN
      ) {

        return;

      }



      data.users[message.author.id]
        .lastMessage =
        Date.now();



      saveLevels(data);



      await addXP(
        client,
        message.member,
        XP_PER_MESSAGE
      );


    }
  );





  // VOICE XP


  setInterval(
    async () => {


      const data =
        loadLevels();



      for (const guild of client.guilds.cache.values()) {



        for (
          const member
          of guild.members.cache.values()
        ) {



          if (
            !member.voice.channel
          )
          continue;



          if (
            member.user.bot
          )
          continue;



          const voice =
            member.voice.channel;



          if (
            voice.members.size < 2
          )
          continue;



          await addXP(
            client,
            member,
            XP_PER_VOICE_MINUTE
          );


        }


      }


    },
    60000
  );



  console.log(
    "✅ Level system loaded"
  );

}