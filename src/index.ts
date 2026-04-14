import { Client, GatewayIntentBits } from "discord.js";
import dotenv from "dotenv";
dotenv.config();
import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import type { Command } from "./types/Command.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Bot prefix for commands
const prefix = "!";

// Automatically load all command files from the commands directory
const commands = new Map<string, Command>();

const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs
  .readdirSync(commandsPath)
  .filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const commandModule = await import(pathToFileURL(filePath).href);
  const command: Command = commandModule.default;
  if (command && command.name) {
    commands.set(command.name, command);
  } else {
    console.warn(`Command in ${file} is missing a name or default export.`);
  }
}

// Initialize the Discord client with necessary intents
const harryBotter = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.MessageContent,
  ],
});

// Event listener for when the bot is ready
harryBotter.on("clientReady", () => {
  console.log(`Logged in as ${harryBotter.user?.tag}!`);
});

// Event listener for incoming messages
harryBotter.on("messageCreate", async (msg) => {
  if (!msg.content.startsWith(prefix)) return;

  const args = msg.content.slice(prefix.length).trim().split(/ +/);
  const commandName = args.shift();
  if (!commandName) return;

  const command = commands.get(commandName);
  if (!command) {
    try {
      await msg.reply("Unknown command!").catch((error) => {
        console.error("Failed to send reply:", error);
      });
    } catch (error) {
      console.error("Failed to send unknown command reply:", error);
    }
    return;
  }

  try {
    await command.execute(msg, args);
  } catch (error) {
    console.error(`Error executing command ${commandName}:`, error);
    await msg.reply("There was an error executing last command.");
  }
});

// Log in to Discord with the bot token
harryBotter.login(process.env.TOKEN!);
