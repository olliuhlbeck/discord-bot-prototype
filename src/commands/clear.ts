import { Message } from "discord.js";
import { PermissionFlagsBits } from "discord.js";

// Command to clear a specified number of messages from the current channel
const clearCommand = {
  name: "clear",
  async execute(message: Message, args: string[]) {
    if (!message.inGuild()) return;
    if (!message.channel.isTextBased()) return;

    if (!message.member?.permissions.has(PermissionFlagsBits.ManageMessages)) {
      message.reply("You don't have permission to use this command.");
      return;
    }

    const amount = parseInt(args[0] ?? "10") || 10;
    if (amount < 1 || amount > 100) {
      message.reply("Please specify a number between 1 and 100.");
      return;
    }

    const messages = await message.channel.messages.fetch({
      limit: amount + 1,
    });
    const deleted = await message.channel.bulkDelete(messages, true);

    const countDeleted = deleted.has(message.id)
      ? deleted.size - 1
      : deleted.size;

    try {
      const deletionMessage = await message.channel.send(
        `Deleted ${countDeleted} messages.`,
      );

      setTimeout(() => {
        deletionMessage.delete().catch(() => {});
      }, 5000);
    } catch (error) {
      console.error("Failed to send deletion confirmation:", error);
    }
  },
};

export default clearCommand;
