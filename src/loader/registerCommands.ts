import { REST, Routes } from "discord.js";
import { slashCommands } from "./commandRegistry.ts";

export async function registerSlashCommands() {
  const rest = new REST({ version: "10" }).setToken(process.env.TOKEN!);

  const body = [...slashCommands.values()].map((cmd) => cmd.data.toJSON());

  try {
    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID!), {
      body,
    });
    console.log("Successfully registered slash commands.");
  } catch (error) {
    console.error("Error registering slash commands:", error);
  }
}
