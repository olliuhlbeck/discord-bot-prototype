import { Message, PermissionFlagsBits } from "discord.js";
import type { Command } from "../types/Command.ts";

// Command to kick a user from the server
const kickCommand: Command = {
  name: "kick",
  async execute(message: Message, args: string[]) {
    if (!message.inGuild()) return;
    if (!message.channel.isTextBased()) return;

    // Check permission to kick members
    if (!message.member?.permissions.has(PermissionFlagsBits.KickMembers)) {
      message.reply("You don't have permission to use this command.");
      return;
    }

    // Check who is subject of kicking
    const kickSubject = message.mentions.members?.first();
    if (!kickSubject) {
      message.reply("Cannot kick without mention of a user.");
      return;
    }

    // Prevent self kick
    if (kickSubject.id === message.author.id) {
      message.reply("You cannot kick yourself.");
      return;
    }

    // Check if the bot has permission to kick the user
    if (!kickSubject.kickable) {
      message.reply("I don't have permission to kick this user.");
      return;
    }

    // Reason for kicking (optional)
    const reasonForKick = args.slice(1).join(" ") || "No reason provided";

    // Attempt actual kick
    try {
      await kickSubject.kick(reasonForKick);
      await message.channel.send(
        `${kickSubject.user.tag} was kicked. Reason for kick: ${reasonForKick}`,
      );
    } catch (error) {
      console.error("Failed to kick member:", error);
      await message.reply("I could notkick that user.");
    }
  },
};

export default kickCommand;
