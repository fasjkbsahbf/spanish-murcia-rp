const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../database.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('config')
    .setDescription('Configura permisos del bot (solo administradores)')
    .addSubcommand(sub =>
      sub.setName('ver')
        .setDescription('Ver la configuración actual')
    )
    .addSubcommand(sub =>
      sub.setName('set')
        .setDescription('Asignar un rol a un permiso')
        .addStringOption(o =>
          o.setName('permiso')
            .setDescription('Qué permiso configurar')
            .setRequired(true)
            .addChoices(
              { name: 'Apertura / Cierre del servidor', value: 'apertura' },
              { name: 'Baneos y expulsiones', value: 'moderacion' },
              { name: 'Multas y arrestos', value: 'sanciones' },
              { name: 'Gestión de licencias', value: 'licencias' },
              { name: 'Economía admin (add/remove money)', value: 'economia' },
              { name: 'Verificaciones', value: 'verificacion' },
              { name: 'Tickets staff', value: 'tickets' }
            )
        )
        .addRoleOption(o => o.setName('rol').setDescription('Rol que tendrá ese permiso').setRequired(true))
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    db.prepare(`
      CREATE TABLE IF NOT EXISTS config (
        clave TEXT PRIMARY KEY,
        valor TEXT
      )
    `).run();

    const sub = interaction.options.getSubcommand();

    if (sub === 'ver') {
      const rows = db.prepare('SELECT * FROM config').all();
      const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle('Configuración del bot')
        .setDescription(rows.length ? null : 'No hay permisos configurados todavía.')
        .setFooter({ text: 'Spanish Murcia RP · Panel de configuración' })
        .setTimestamp();

      if (rows.length) {
        for (const row of rows) {
          embed.addFields({ name: row.clave, value: `<@&${row.valor}>`, inline: true });
        }
      }

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (sub === 'set') {
      const permiso = interaction.options.getString('permiso');
      const rol = interaction.options.getRole('rol');

      db.prepare('INSERT OR REPLACE INTO config (clave, valor) VALUES (?, ?)').run(permiso, rol.id);

      await interaction.reply({
        content: `Permiso **${permiso}** asignado al rol ${rol}.`,
        ephemeral: true
      });
    }
  },
};