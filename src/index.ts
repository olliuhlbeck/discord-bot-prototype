import { Client, GatewayIntentBits } from "discord.js";
import dotenv from "dotenv";
dotenv.config();
import pingCommand from "./commands/ping.ts";
import usersCommand from "./commands/users.ts";

const prefix = "!";

const harryBotter = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

harryBotter.on("clientReady", () => {
  console.log(`Logged in as ${harryBotter.user?.tag}!`);
});

harryBotter.on("messageCreate", (msg) => {
  if (!msg.content.startsWith(prefix)) return;
  const commandName = msg.content.slice(prefix.length).trim();
  if (commandName === pingCommand.name) {
    pingCommand.execute(msg);
  }
  if (commandName === usersCommand.name) {
    usersCommand.execute(msg);
  }
});

harryBotter.login(process.env.TOKEN!);
