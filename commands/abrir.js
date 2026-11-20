const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

const votacionPath = path.join(__dirname, '..', 'votacion-apertura.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('abrir')
    .setDescription('Anuncia que el servidor está abierto')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    let menciones = '';

    try {
      if (fs.existsSync(votacionPath)) {
        const data = JSON.parse(fs.readFileSync(votacionPath, 'utf8'));
        const canal = await interaction.guild.channels.fetch(data.channelId).catch(() => null);

        if (canal) {
          const mensaje = await canal.messages.fetch(data.messageId).catch(() => null);

          if (mensaje) {
            const reaccionSi = mensaje.reactions.cache.get('✅');
            const reaccionTarde = mensaje.reactions.cache.get('⏰');

            const usuarios = new Set();

            if (reaccionSi) {
              const usersSi = await reaccionSi.users.fetch();
              usersSi.forEach(u => {
                if (!u.bot) usuarios.add(u.id);
              });
            }

            if (reaccionTarde) {
              const usersTarde = await reaccionTarde.users.fetch();
              usersTarde.forEach(u => {
                if (!u.bot) usuarios.add(u.id);
              });
            }

            menciones = [...usuarios].map(id => `<@${id}>`).join(' ');
          }
        }
      }
    } catch (e) {
      console.error('Error leyendo votación:', e);
    }

    const embed = new EmbedBuilder()
      .setColor(0x2ECC71)
      .setTitle('¡Servidor Abierto!')
      .setDescription(
        `**Spanish Murcia RP** ya está **abierto**.\n` +
        `Podéis entrar a rolear.\n\n` +
        `Apertura realizada por ${interaction.user}.`
      )
      .setFooter({ text: 'Spanish Murcia RP' })
      .setTimestamp();

    const contenido = menciones
      ? `${menciones}\n\n¡Servidor abierto!`
      : '@everyone\n\n¡Servidor abierto!';

    await interaction.channel.send({ content: contenido, embeds: [embed] });
    await interaction.reply({ content: 'Servidor anunciado como abierto.', ephemeral: true });

    // Limpiar votación usada
    try {
      if (fs.existsSync(votacionPath)) fs.unlinkSync(votacionPath);
    } catch {}
  },
};