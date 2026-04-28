import {
  ChatInputCommandInteraction,
  GuildMember,
  MessageFlags,
  SlashCommandBuilder,
} from "discord.js";
import { PermissionFlagsBits } from "discord.js";
import type { Command } from "../types/Command.ts";
import { logAction } from "../utils/logger.ts";

// Command to clear a specified number of messages from the current channel
const clearCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("clear")
    .setDescription("Delete a number of messages")
    .addIntegerOption((option) =>
      option
        .setName("amount")
        .setDescription("Number of messages to delete (1–100)")
        .setRequired(true),
    ),
  cooldown: 5,

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.inGuild()) return;

    const member = interaction.member as GuildMember;

    if (!member.permissions.has(PermissionFlagsBits.ManageMessages)) {
      await interaction.reply({
        content: "You don't have permission to use this command.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // Check how many messages to delete
    const amount = interaction.options.getInteger("amount", true);

    if (amount < 1 || amount > 100) {
      await interaction.reply({
        content: "Please provide a number between 1 and 100.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // Defer the reply to avoid "Interaction failed" message
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const channel = interaction.channel;

    if (!channel || !channel.isTextBased()) {
      await interaction.editReply({
        content: "This command can only be used in a text channel.",
      });
      return;
    }

    // Attempt actual message deletion
    try {
      const messages = await channel.messages.fetch({ limit: amount });

      const deleted = await channel.bulkDelete(messages, true);

      await interaction.editReply({
        content: `Deleted ${deleted.size} message(s).`,
      });

      await logAction(
        interaction,
        "Messages Cleared",
        `${interaction.user.tag} (${interaction.user.id}) cleared ${deleted.size} message(s) in ${channel}.`,
      );

      setTimeout(async () => {
        try {
          await interaction.deleteReply();
        } catch (error) {
          console.error("Failed to delete confirmation message:", error);
        }
      }, 5000);
    } catch (error) {
      console.error("Failed to send deletion confirmation:", error);
    }
  },
};

export default clearCommand;
