const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

const votacionPath = path.join(__dirname, '..', 'votacion-apertura.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('votacion-apertura')
    .setDescription('Inicia la votación para la apertura del servidor')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle('Votación de apertura del servidor')
      .setDescription(
        `${interaction.user} ha iniciado una votación para la apertura del servidor.\n\n` +
        `Reacciona con ✅ si te unirás cuando abra el servidor.\n` +
        `Reacciona con ❌ si no te podrás unir cuando abra el servidor.\n` +
        `Reacciona con ⏰ si te unirás más tarde.\n\n` +
        `*Jugar con las reacciones es motivo de sanción.*`
      )
      .setFooter({ text: 'Spanish Murcia RP · Votación de apertura' })
      .setTimestamp();

    await interaction.reply({ content: '@everyone', embeds: [embed] });
    const mensaje = await interaction.fetchReply();

    await mensaje.react('✅');
    await mensaje.react('❌');
    await mensaje.react('⏰');

    // Guardamos el ID del mensaje para usarlo al abrir
    fs.writeFileSync(votacionPath, JSON.stringify({
      messageId: mensaje.id,
      channelId: mensaje.channel.id,
      staffId: interaction.user.id,
      staffTag: interaction.user.tag
    }, null, 2));
  },
};