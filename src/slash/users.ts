import {
  ChatInputCommandInteraction,
  MessageFlags,
  SlashCommandBuilder,
} from "discord.js";
import type { Command } from "../types/Command.ts";

// Command to list users with different options (total count, list of users, online users)
const usersCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("users")
    .setDescription("User related commands")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("count")
        .setDescription("Show total user count in the server"),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("list")
        .setDescription("List first N users in the server")
        .addIntegerOption((option) =>
          option
            .setName("amount")
            .setDescription("Number of users to list (default 5, max 20)")
            .setMinValue(1)
            .setMaxValue(20)
            .setRequired(false),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("online")
        .setDescription("List all online users in the server"),
    ),
  cooldown: 5,

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) return;
    try {
      const members = await interaction.guild.members.fetch();

      const subCommand = interaction.options.getSubcommand();

      // !users count - Show total user count
      if (subCommand === "count") {
        await interaction.reply({
          content: `There are ${members?.size} users in this server.`,
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      // !users list <number> - List first N users in the server
      if (subCommand === "list") {
        const amount = Math.min(
          parseInt(
            interaction.options.getInteger("amount")?.toString() ?? "5",
          ) || 5,
          20,
        );
        const memberArray = Array.from(members?.values());
        const listedMembers = memberArray.slice(0, amount);
        const memberList = listedMembers
          .map((member) => `${member.user.username} (${member.id})`)
          .join("\n");
        await interaction.reply({
          content: `First ${amount} users in this server:\n${memberList}`,
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      // !users online - List all online users in the server
      if (subCommand === "online") {
        const onlineMembers = members?.filter(
          (member) => member.presence?.status === "online",
        );

        if (!onlineMembers || onlineMembers.size === 0) {
          await interaction.reply({
            content: "No users are currently online in this server.",
            flags: MessageFlags.Ephemeral,
          });
          return;
        }

        const memberList = Array.from(onlineMembers.values())
          .slice(0, 20)
          ?.map((member) => `${member.user.username} (${member.id})`)
          .join("\n");
        await interaction.reply({
          content: `Online users in this server:\n${memberList}`,
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      const memberList = members
        ?.map((member) => `${member.user.username} (${member.id})`)
        .join("\n");
      await interaction.reply({
        content: `${members?.size} users in this server:\n${memberList}`,
        flags: MessageFlags.Ephemeral,
      });
    } catch (error) {
      console.error("Failed to fetch members:", error);
      await interaction.reply({
        content: "Sorry, I couldn't fetch the user list.",
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};

export default usersCommand;
