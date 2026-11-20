const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../database.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('sanciones')
    .setDescription('Consulta el historial administrativo (warns, bans, timeouts)')
    .addUserOption(o => o.setName('usuario').setDescription('Ciudadano').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    const user = interaction.options.getUser('usuario');

    const rows = db.prepare(`
      SELECT * FROM sanciones
      WHERE user_id = ?
        AND tipo IN ('WARN', 'BAN', 'TIMEOUT', 'KICK')
      ORDER BY id DESC
      LIMIT 15
    `).all(user.id);

    if (!rows.length) {
      return interaction.reply({
        content: `**${user.username}** no tiene sanciones administrativas registradas.`,
        ephemeral: true
      });
    }

    const embed = new EmbedBuilder()
      .setColor(0xE67E22)
      .setAuthor({
        name: `Sanciones de ${user.username}`,
        iconURL: user.displayAvatarURL({ dynamic: true })
      })
      .setTitle('Historial administrativo')
      .setDescription(
        rows.map((s, i) =>
          `**${i + 1}. [${s.tipo}]**` +
          (s.cantidad ? ` · ${s.cantidad}${s.tipo === 'TIMEOUT' ? ' min' : ''}` : '') +
          `\nMotivo: ${s.razon}\nStaff: ${s.staff_tag} · ${s.fecha}`
        ).join('\n\n')
      )
      .setFooter({ text: 'Spanish Murcia RP · Solo staff' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};