const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('cerrar')
    .setDescription('Anuncia que el servidor está cerrado')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor(0xE74C3C)
      .setTitle('Servidor cerrado')
      .setDescription(
        `Servidor cerrado por ${interaction.user}.\n` +
        `¡Gracias por rolear con nosotros!`
      )
      .setFooter({ text: 'Spanish Murcia RP' })
      .setTimestamp();

    await interaction.channel.send({ content: '@everyone', embeds: [embed] });
    await interaction.reply({ content: 'Servidor anunciado como cerrado.', ephemeral: true });
  },
};