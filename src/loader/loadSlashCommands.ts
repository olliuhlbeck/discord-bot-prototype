import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";
import type { Command } from "../types/Command.ts";
import { slashCommands } from "./commandRegistry.ts";

export async function loadSlashCommands() {
  const slashCommandsPath = path.join(process.cwd(), "dist/slash");
  const files = fs
    .readdirSync(slashCommandsPath)
    .filter((file) => file.endsWith(".js"));

  for (const file of files) {
    const filePath = path.join(slashCommandsPath, file);

    const imported = await import(pathToFileURL(filePath).href);

    const command: Command = imported.default;

    if (!command?.data?.name) continue;

    slashCommands.set(command.data.name, command);
    console.log(`Loaded slash command: ${command.data.name}`);
  }
}
