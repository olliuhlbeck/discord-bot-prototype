import {
  EmbedBuilder,
  TextChannel,
  type ChatInputCommandInteraction,
} from "discord.js";

const LOG_CHANNEL_ID = process.env.LOG_CHANNEL;

export async function logAction(
  interaction: ChatInputCommandInteraction,
  title: string,
  description: string,
) {
  if (!interaction.guild || !LOG_CHANNEL_ID) return;

  try {
    const channel = await interaction.guild.channels.fetch(LOG_CHANNEL_ID);

    if (!channel || !channel.isTextBased()) return;

    const embed = new EmbedBuilder()
      .setTitle(title)
      .setDescription(description)
      .setColor(0xff0000)
      .addFields(
        {
          name: "Moderator",
          value: `${interaction.user.tag} (${interaction.user.id})`,
        },
        {
          name: "Channel",
          value: `${interaction.channel}`,
        },
      )
      .setTimestamp();

    await (channel as TextChannel).send({ embeds: [embed] });
  } catch (error) {
    console.error("Failed to fetch log channel:", error);
    return;
  }
}
