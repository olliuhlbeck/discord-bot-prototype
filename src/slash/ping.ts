import {
  ChatInputCommandInteraction,
  MessageFlags,
  SlashCommandBuilder,
} from "discord.js";
import type { Command } from "../types/Command.ts";
import { logAction } from "../utils/logger.ts";

// Command that respond with "Pong!"  || Server health check ping command
const pingCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Responds with Pong!"),
  cooldown: 3,

  async execute(interaction: ChatInputCommandInteraction) {
    try {
      await interaction
        .reply({ content: "Pong!", flags: MessageFlags.Ephemeral })
        .catch((error) => {
          console.error("Failed to send reply:", error);
        });

      await logAction(
        interaction,
        "🏓 Ping Command",
        `User: ${interaction.user.tag} (${interaction.user.id})`,
      );
    } catch (error) {
      console.error("Error executing ping command:", error);
    }
  },
};

export default pingCommand;
