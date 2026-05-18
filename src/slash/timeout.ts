import {
  ChatInputCommandInteraction,
  GuildMember,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import type { Command } from "../types/Command.js";
import { logAction } from "../utils/logger.js";

// Command to timeout a user for a specified duration
const timeout: Command = {
  data: new SlashCommandBuilder()
    .setName("timeout")
    .setDescription("Timeout a user for a given duration")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("User to issue timeout for")
        .setRequired(true),
    )
    .addIntegerOption((option) =>
      option
        .setName("minutes")
        .setDescription("Duration of timeout in minutes")
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("reason")
        .setDescription("Reason for timeout")
        .setRequired(false),
    ),
  cooldown: 5,
  permissions: [PermissionFlagsBits.ModerateMembers],
  ownerOnly: false,
  rolesThatCanUseCommand: ["Moderator", "Admin"],

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.inGuild()) return;

    const moderator = interaction.member as GuildMember;

    const target = interaction.options.getMember("user");

    if (!target || !(target instanceof GuildMember)) {
      await interaction.reply({
        content: "User not found in this guild.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const minutes = interaction.options.getInteger("minutes", true);

    if (minutes < 1 || minutes > 40320) {
      await interaction.reply({
        content:
          "Please provide a duration between 1 and 40320 minutes (28 days).",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (target.id === moderator.id) {
      await interaction.reply({
        content: "You cannot timeout yourself.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (target.id === interaction.guild?.ownerId) {
      await interaction.reply({
        content: "You cannot timeout the server owner.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (target.roles.highest.position >= moderator.roles.highest.position) {
      await interaction.reply({
        content: "You cannot timeout a user with an equal or higher role.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (!target.moderatable) {
      await interaction.reply({
        content: "I do not have permission to timeout this user.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (target.id === interaction.client.user?.id) {
      await interaction.reply({
        content: "You cannot timeout the bot.",
        flags: MessageFlags.Ephemeral,
      });

      return;
    }

    const reason =
      interaction.options.getString("reason") || "No reason provided";

    // Try the actual timeout action
    try {
      await target.timeout(minutes * 60 * 1000, reason);
      await interaction.reply({
        content: `${target.user.tag} has been timed out for ${minutes} minute(s). Reason: ${reason}`,
        flags: MessageFlags.Ephemeral,
      });

      await logAction(
        interaction,
        "User Timed Out",
        `${target.user.tag} was timed out for ${minutes} minute(s). Reason: ${reason}`,
      );
    } catch (error) {
      console.error("Error applying timeout:", error);
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: "An error occurred while trying to timeout the user.",
          flags: MessageFlags.Ephemeral,
        });
      } else {
        await interaction.reply({
          content: "An error occurred while trying to timeout the user.",
          flags: MessageFlags.Ephemeral,
        });
      }
    }
  },
};

export default timeout;
