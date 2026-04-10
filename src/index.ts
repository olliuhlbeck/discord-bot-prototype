import { Client, GatewayIntentBits } from "discord.js";
import dotenv from "dotenv";
dotenv.config();
import pingCommand from "./commands/ping.js";
import usersCommand from "./commands/users.js";
import clearCommand from "./commands/clear.js";
import kickCommand from "./commands/kick.js";

// Bot prefix for commands
const prefix = "!";

// Create a map of commands for easy access
const commands = new Map();
commands.set(pingCommand.name, pingCommand);
commands.set(usersCommand.name, usersCommand);
commands.set(clearCommand.name, clearCommand);
commands.set(kickCommand.name, kickCommand);

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
harryBotter.on("messageCreate", (msg) => {
  if (!msg.content.startsWith(prefix)) return;

  const args = msg.content.slice(prefix.length).trim().split(/ +/);
  const commandName = args.shift();

  const command = commands.get(commandName);
  if (!command) {
    msg.reply("Unknown command!").catch((error) => {
      console.error("Failed to send reply:", error);
    });
    return;
  }
  command.execute(msg, args);
});

// Log in to Discord with the bot token
harryBotter.login(process.env.TOKEN!);
