import { MessageFlags, type Client, type Interaction } from "discord.js";
import { slashCommands } from "./commandRegistry.ts";

export function registerInteractionHandler(client: Client) {
  client.on("interactionCreate", async (interaction: Interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const command = slashCommands.get(interaction.commandName);

    if (!command) {
      await interaction.reply({
        content: "Unknown command.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: "There was an error executing that command.",
        flags: MessageFlags.Ephemeral,
      });
    }
  });
}
