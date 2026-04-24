import type { ChatInputCommandInteraction, GuildMember } from "discord.js";
import type { Command } from "../types/Command.ts";

const BOT_OWNER_ID = process.env.BOT_OWNER_ID;

export function checkPermissions(
  interaction: ChatInputCommandInteraction,
  command: Command,
): string | null {
  if (!interaction.inGuild()) {
    return "This command can only be used in a server.";
  }

  const member = interaction.member as GuildMember;

  // Check if owner id is defined in environment variables when calling owner-only command
  if (command.ownerOnly) {
    if (!BOT_OWNER_ID) {
      console.warn(
        "BOT_OWNER_ID is not defined. Owner-only commands will not work.",
      );
      return "Owner-only commands are disabled (missing BOT_OWNER_ID).";
    }

    if (interaction.user.id !== BOT_OWNER_ID) {
      return "You do not have permission to use this command.";
    }
  }

  // Check if the command is owner-only and if the user is the owner
  if (command.ownerOnly && interaction.user.id !== BOT_OWNER_ID) {
    return "You do not have permission to use this command.";
  }

  // Discord permission check
  if (command.permissions) {
    const missingPermission = command.permissions.filter(
      (permission) => !member.permissions.has(permission),
    );
    if (missingPermission.length > 0) {
      return "You do not have the required permissions to use this command.";
    }
  }

  // Role-based permission check
  if (command.rolesThatCanUseCommand) {
    const hasRequiredRole = member.roles.cache.some((role) =>
      command.rolesThatCanUseCommand!.includes(role.name),
    );
    if (!hasRequiredRole) {
      return "You do not have the required role to use this command.";
    }
  }

  // If all checks pass, return null (indicating no permission issues)
  return null;
}
