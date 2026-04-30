import { Client, GatewayIntentBits } from "discord.js";
import dotenv from "dotenv";
dotenv.config();

import { registerSlashCommands } from "./loader/registerCommands.js";
import { registerInteractionHandler } from "./loader/handleInteractions.js";
import { loadSlashCommands } from "./loader/loadSlashCommands.ts";

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

client.once("ready", async () => {
  console.log(`Logged in as ${client.user?.tag}!`);

  await loadSlashCommands();
  await registerSlashCommands();
});

registerInteractionHandler(client);

client.login(process.env.TOKEN!);
