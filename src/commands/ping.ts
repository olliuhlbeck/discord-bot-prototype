import { Message } from "discord.js";
import type { Command } from "../types/Command.ts";

// Command to respond with "Pong!" when a user types "!ping" || Server health check ping command
const pingCommand: Command = {
  name: "ping",
  async execute(message: Message) {
    await message.reply("Pong!").catch((error) => {
      console.error("Failed to send reply:", error);
    });
  },
};

export default pingCommand;
