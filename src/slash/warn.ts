import {
  GuildMember,
  MessageFlags,
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
} from "discord.js";
import type { Command } from "../types/Command.js";
import { addWarning, getWarnings } from "../utils/warnings.js";
import { logAction } from "../utils/logger.js";

// Command to issue a warning to a user
const warnCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("warn")
    .setDescription("Issue a warning to a user")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The user to warn")
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("reason")
        .setDescription("Reason for the warning")
        .setRequired(false),
    ),
  cooldown: 5,

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.inGuild()) return;

    const target = interaction.options.getMember("user");

    if (!target || !(target instanceof GuildMember)) {
      await interaction.reply({
        content: "User not found or not a member of this server.",
        flags: MessageFlags.Ephemeral,
      });

      return;
    }

    const reason =
      interaction.options.getString("reason") || "No reason provided";

    // Try handing the actual warning
    addWarning(target.id, {
      moderatorID: interaction.user.id,
      reason,
      timestamp: Date.now(),
    });

    const warnings = await getWarnings(target.id);

    await interaction.reply({
      content: `Warned ${target.user.tag}. Total warnings: ${warnings.length}`,
      flags: MessageFlags.Ephemeral,
    });

    await logAction(
      interaction,
      "User Warned",
      `${target.user.tag} was warned. Reason: ${reason}`,
    );
  },
};

export default warnCommand;
