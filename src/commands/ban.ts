import { Message, PermissionFlagsBits } from "discord.js";

const banCommand = {
  name: "ban",
  async execute(message: Message, args: string[]) {
    if (!message.inGuild()) return;
    if (!message.channel.isTextBased()) return;

    // Check permission to ban members
    if (!message.member?.permissions.has(PermissionFlagsBits.BanMembers)) {
      await message.reply("You don't have permission to use this command.");
      return;
    }

    // Check who is subject of banning
    const banSubject = message.mentions.members?.first();
    if (!banSubject) {
      await message.reply("Cannot ban without mention of a user.");
      return;
    }

    // Prevent self ban
    if (banSubject.id === message.author.id) {
      await message.reply("You cannot ban yourself.");
      return;
    }

    // Prevent banning the bot itself
    if (banSubject.id === message.client.user?.id) {
      await message.reply("No one can ban harry-botter!");
      return;
    }

    // Check if the bot has permission to ban the user
    if (!banSubject.bannable) {
      await message.reply("I don't have permission to ban this user.");
      return;
    }
    if (
      banSubject.roles.highest.position >= message.member.roles.highest.position
    ) {
      await message.reply("You cannot ban this user (role hierarchy).");
      return;
    }

    // Server owner protection
    if (banSubject.id === message.guild.ownerId) {
      await message.reply("You cannot ban the server owner.");
      return;
    }

    // Ban reason (optional)
    const reasonForBan = args.slice(1).join(" ") || "No reason provided";

    // Attempt actual ban
    try {
      await banSubject.ban({
        reason: reasonForBan,
        deleteMessageSeconds: 60 * 60 * 24, // delete last 24h messages
      });

      await message.channel.send(
        `${banSubject.user.tag} was banned. Reason: ${reasonForBan}`,
      );
    } catch (error) {
      console.error(error);
      await message.reply("Failed to ban the user.");
    }
  },
};

export default banCommand;
