import {
  GuildMember,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
} from "discord.js";

import type { Command } from "../types/Command.js";

import { clearWarnings, getWarnings } from "../utils/warnings.js";

import { logAction } from "../utils/logger.js";

// Command to clear all warnings from a user
const clearWarningsCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("clearwarnings")
    .setDescription("Clear all warnings from a user")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The user whose warnings should be cleared")
        .setRequired(true),
    ),

  cooldown: 5,
  rolesThatCanUseCommand: ["Moderator", "Admin"],
  permissions: [PermissionFlagsBits.ModerateMembers],

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.inGuild()) return;

    const target = interaction.options.getMember("user");

    if (!target || !(target instanceof GuildMember)) {
      await interaction.reply({
        content: "User not found.",
        flags: MessageFlags.Ephemeral,
      });

      return;
    }

    try {
      const existingWarnings = await getWarnings(target.id);

      if (existingWarnings.length === 0) {
        await interaction.reply({
          content: `${target.user.tag} has no warnings.`,
          flags: MessageFlags.Ephemeral,
        });

        return;
      }

      await clearWarnings(target.id);

      await interaction.reply({
        content: `Cleared ${existingWarnings.length} warning(s) from ${target.user.tag}.`,
        flags: MessageFlags.Ephemeral,
      });

      await logAction(
        interaction,
        "Warnings Cleared",
        `${interaction.user.tag} cleared warnings for ${target.user.tag}.`,
      );
    } catch (error) {
      console.error("clearwarnings failed:", error);

      await interaction.reply({
        content: "Something went wrong while clearing warnings.",
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};

export default clearWarningsCommand;
