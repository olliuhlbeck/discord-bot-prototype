import { Client, Events, GatewayIntentBits } from "discord.js";
import dotenv from "dotenv";
dotenv.config();

import { registerSlashCommands } from "./loader/registerCommands.js";
import { registerInteractionHandler } from "./loader/handleInteractions.js";
import { loadSlashCommands } from "./loader/loadSlashCommands.js";

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

client.once(Events.ClientReady, async () => {
  console.log(`Logged in as ${client.user?.tag}!`);

  try {
    await loadSlashCommands();
    await registerSlashCommands();
  } catch (error) {
    console.error("Error during slash command setup:", error);
  }
});

registerInteractionHandler(client);

client.login(process.env.TOKEN!);
