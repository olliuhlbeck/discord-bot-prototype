import {
  ChatInputCommandInteraction,
  type PermissionResolvable,
} from "discord.js";

export interface Command {
  // Using any type in data since Discord.js's command builders have a complex type that can be difficult to represent accurately in a simple interface.
  // The actual type of data will depend on the specific command builder used (e.g., SlashCommandBuilder, SlashCommandSubcommandBuilder, etc.).
  // Discord.js also validates the command data at runtime, so we can be flexible here.
  data: any;
  cooldown?: number;

  // Permission properties
  permissions?: PermissionResolvable[];
  ownerOnly?: boolean;
  rolesThatCanUseCommand?: string[];

  execute(interaction: ChatInputCommandInteraction): Promise<void>;
}
