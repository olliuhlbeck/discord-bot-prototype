import { Message } from "discord.js";

const pingCommand = {
  name: "ping",
  execute(message: Message) {
    message.reply("Pong!").catch((error) => {
      console.error("Failed to send reply:", error);
    });
  },
};

export default pingCommand;
