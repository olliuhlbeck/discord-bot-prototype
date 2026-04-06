import { Message } from "discord.js";

// Command to list all users in the server
const usersCommand = {
  name: "users",
  async execute(message: Message) {
    try {
      const members = await message.guild?.members.fetch();
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
