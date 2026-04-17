import {
  ChatInputCommandInteraction,
  MessageFlags,
  SlashCommandBuilder,
} from "discord.js";
import type { Command } from "../types/Command.ts";

// Command to respond with "Pong!" when a user types "!ping" || Server health check ping command
const pingCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Responds with Pong!"),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction
      .reply({ content: "Pong!", flags: MessageFlags.Ephemeral })
      .catch((error) => {
        console.error("Failed to send reply:", error);
      });
  },
};

export default pingCommand;
