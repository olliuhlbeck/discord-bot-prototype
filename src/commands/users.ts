import { Message } from "discord.js";

// Command to list all users in the server
const usersCommand = {
  name: "users",
  async execute(message: Message, args: string[]) {
    if (!message.guild) return;
    try {
      const members = await message.guild?.members.fetch();

      const subCommand = args[0]?.toLowerCase();

      // !users count - Show total user count
      if (subCommand === "count") {
        message.reply(`There are ${members?.size} users in this server.`);
        return;
      }

      // !users list <number> - List first N users in the server
      if (subCommand === "list") {
        const amount = parseInt(args[1] ?? "5") || 5; // Default to 5 if no number provided
        const memberArray = Array.from(members?.values());
        const listedMembers = memberArray.slice(0, amount);
        const memberList = listedMembers
          .map((member) => `${member.user.username} (${member.id})`)
          .join("\n");
        message.reply(`First ${amount} users in this server:\n${memberList}`);
        return;
      }

      const memberList = members
        ?.map((member) => `${member.user.username} (${member.id})`)
        .join("\n");
      message.reply(`${members?.size} users in this server:\n${memberList}`);
    } catch (error) {
      console.error("Failed to fetch members:", error);
      message.reply("Sorry, I couldn't fetch the user list.");
    }
  },
};

export default usersCommand;
