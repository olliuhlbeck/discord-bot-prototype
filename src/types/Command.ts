import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";

export interface Command {
  name: string;
  description?: string;
  data?: SlashCommandBuilder;

  executeInteraction(
    interaction: ChatInputCommandInteraction,
    args?: string[],
  ): Promise<void>;
}
