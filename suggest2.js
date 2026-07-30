export function setupSuggestionReactions(client) {
  const SUGGESTION_CHANNEL_ID = "1446928004700704789";

  client.on("messageCreate", async (message) => {
    if (message.author.bot) return;
    if (message.channel.id !== SUGGESTION_CHANNEL_ID) return;

    try {
      await message.react("👍");
      await message.react("👎");
    } catch (err) {
      console.error(err);
    }
  });
}