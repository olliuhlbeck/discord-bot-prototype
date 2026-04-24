import {
  ChatInputCommandInteraction,
  GuildMember,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import type { Command } from "../types/Command.ts";

// Command to kick a user from the server
const kickCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("kick")
    .setDescription("Kicks a specified user from the server.")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The user to kick")
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("reason")
        .setDescription("Reason for kicking the user (optional)"),
    ),
  cooldown: 5,
  rolesThatCanUseCommand: ["Moderator", "Admin"],

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.inGuild()) return;

    const member = interaction.member as GuildMember;

    // Check permission to kick members
    if (!member?.permissions.has(PermissionFlagsBits.KickMembers)) {
      await interaction.reply({
        content: "You don't have permission to use this command.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // Check who is subject of kicking
    const kickSubject = interaction.options.getMember("user") as GuildMember;

    if (!kickSubject) {
      await interaction.reply({
        content: "Cannot kick without mention of a user.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // Prevent self kick
    if (kickSubject.id === interaction.user.id) {
      await interaction.reply({
        content: "You cannot kick yourself.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // Check if the bot has permission to kick the user
    if (!kickSubject.kickable) {
      await interaction.reply({
        content: "I don't have permission to kick this user.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // Check hierarchy - user cannot kick someone with equal or higher role
    if (kickSubject.roles.highest.position >= member.roles.highest.position) {
      await interaction.reply({
        content: "You cannot kick this user (role hierarchy).",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // Reason for kicking (optional)
    const reasonForKick =
      interaction.options.getString("reason") || "No reason provided";

    // Attempt actual kick
    try {
      await kickSubject.kick(reasonForKick);
      await interaction.reply({
        content: `${kickSubject.user.tag} was kicked. Reason for kick: ${reasonForKick}`,
        flags: MessageFlags.Ephemeral,
      });
    } catch (error) {
      console.error("Failed to kick member:", error);
      await interaction.reply({
        content: "I could not kick that user.",
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};

export default kickCommand;
