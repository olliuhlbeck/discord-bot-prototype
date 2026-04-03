import { Client, GatewayIntentBits } from "discord.js";
import dotenv from "dotenv";
dotenv.config();

const harryBotter = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

harryBotter.on("clientReady", () => {
  console.log(`Logged in as ${harryBotter.user?.tag}!`);
});

harryBotter.on("messageCreate", (msg) => {
  if (msg.content === "!ping") {
    msg.reply("pong");
  }
});

harryBotter.login(process.env.TOKEN!);
