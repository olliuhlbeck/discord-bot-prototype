import {
  ChatInputCommandInteraction,
  GuildMember,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import type { Command } from "../types/Command.js";

import { getWarnings } from "../utils/warnings.js";

// Command to check the warnings of a user
const checkWarnings: Command = {
  data: new SlashCommandBuilder()
    .setName("checkwarnings")
    .setDescription("Check the warnings of a user")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The user whose warnings you want to check")
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

    // Try clearing the warnings and handle any potential errors
    try {
      const warnings = await getWarnings(target.id);

      if (warnings.length === 0) {
        await interaction.reply({
          content: `${target.user.tag} has no warnings.`,
          flags: MessageFlags.Ephemeral,
        });

        return;
      }

      const warningList = warnings
        .map((warning, index) => {
          return [
            `#${index + 1}`,
            `Reason: ${warning.reason}`,
            `Moderator: <@${warning.moderatorID}>`,
            `Date: ${new Date(warning.timestamp).toLocaleDateString()}`,
          ].join("\n");
        })
        .join("\n\n");

      await interaction.reply({
        content: `${target.user.tag} has the following warnings:\n${warningList}`,
        flags: MessageFlags.Ephemeral,
      });
    } catch (error) {
      console.error("Error occurred while fetching warnings:", error);

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: "An error occurred while fetching warnings.",
          flags: MessageFlags.Ephemeral,
        });
      } else {
        await interaction.reply({
          content: "An error occurred while fetching warnings.",
          flags: MessageFlags.Ephemeral,
        });
      }
    }
  },
};

export default checkWarnings;
