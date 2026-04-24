import {
  ChatInputCommandInteraction,
  GuildMember,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import type { Command } from "../types/Command.ts";

// Command to ban a user from the server
const banCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("ban")
    .setDescription("Bans a specified user from the server.")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The user to ban")
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("reason")
        .setDescription("Set reason for banning the user (optional)"),
    ),
  cooldown: 5,
  rolesThatCanUseCommand: ["Moderator", "Admin"],

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.inGuild()) return;

    const member = interaction.member as GuildMember;

    // Check permission to ban members
    if (!member?.permissions.has(PermissionFlagsBits.BanMembers)) {
      await interaction.reply({
        content: "You don't have permission to use this command.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // Check who is subject of banning
    const banSubject = interaction.options.getMember("user") as GuildMember;

    if (!banSubject) {
      await interaction.reply({
        content: "User not found. Cannot ban without mention of a user.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // Prevent self ban
    if (banSubject.id === interaction.user.id) {
      await interaction.reply({
        content: "You cannot ban yourself.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // Prevent banning the bot itself
    if (banSubject.id === interaction.client.user?.id) {
      await interaction.reply({
        content: "No one can ban Spearfish!",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // Check if the bot has permission to ban the user
    if (!banSubject.bannable) {
      await interaction.reply({
        content: "I don't have permission to ban this user.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
    if (banSubject.roles.highest.position >= member.roles.highest.position) {
      await interaction.reply({
        content: "You cannot ban this user (role hierarchy).",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // Ban reason (optional)
    const reasonForBan =
      interaction.options.getString("reason") || "No reason provided";

    // Attempt actual ban
    try {
      await banSubject.ban({
        reason: reasonForBan,
        deleteMessageSeconds: 60 * 60 * 24, // delete last 24h messages
      });

      await interaction.reply(
        `${banSubject.user.tag} was banned. Reason: ${reasonForBan}`,
      );
    } catch (error) {
      console.error(error);
      await interaction.reply("Failed to ban the user.");
    }
  },
};

export default banCommand;
