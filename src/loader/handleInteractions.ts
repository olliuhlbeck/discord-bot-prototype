import type { Client, Interaction } from "discord.js";
import { slashCommands } from "./commandRegistry.ts";

export function registerInteractionHandler(client: Client) {
  client.on("interactionCreate", async (interaction: Interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const command = slashCommands.get(interaction.commandName);

    if (!command) {
      await interaction.reply({
        content: "Unknown command.",
        ephemeral: true,
      });
      return;
    }

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: "There was an error executing that command.",
        ephemeral: true,
      });
    }
  });
}
