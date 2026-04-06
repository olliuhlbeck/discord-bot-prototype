import { Message } from "discord.js";

// Command to respond with "Pong!" when a user types "!ping" || Server health check ping command
const pingCommand = {
  name: "ping",
  execute(message: Message) {
    message.reply("Pong!").catch((error) => {
      console.error("Failed to send reply:", error);
    });
  },
};

export default pingCommand;
