const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../database.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('arrestar')
    .setDescription('Practica un arresto y aplica la fianza correspondiente')
    .addUserOption(o => o.setName('usuario').setDescription('Detenido').setRequired(true))
    .addIntegerOption(o => o.setName('fianza').setDescription('Importe de la fianza').setRequired(true).setMinValue(1))
    .addStringOption(o => o.setName('razon').setDescription('Motivo del arresto').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    const user = interaction.options.getUser('usuario');
    const fianza = interaction.options.getInteger('fianza');
    const razon = interaction.options.getString('razon');

    let data = db.prepare('SELECT * FROM economy WHERE user_id = ?').get(user.id);
    if (!data) {
      db.prepare('INSERT INTO economy (user_id, cash, bank) VALUES (?, 0, 0)').run(user.id);
      data = { bank: 0 };
    }

    db.prepare('UPDATE economy SET bank = bank - ? WHERE user_id = ?').run(fianza, user.id);
    const nuevoSaldo = data.bank - fianza;

    // Guardar en historial
    db.prepare(`
      INSERT INTO sanciones (user_id, tipo, cantidad, razon, staff_id, staff_tag, fecha)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      user.id,
      'ARRESTO',
      fianza,
      razon,
      interaction.user.id,
      interaction.user.tag,
      new Date().toLocaleString('es-ES')
    );

    const embed = new EmbedBuilder()
      .setColor(0xC0392B)
      .setTitle('Arresto practicado')
      .addFields(
        { name: 'Detenido', value: `${user}`, inline: true },
        { name: 'Fianza', value: `\`$${fianza.toLocaleString()}\``, inline: true },
        { name: 'Saldo bancario resultante', value: `\`$${nuevoSaldo.toLocaleString()}\``, inline: true },
        { name: 'Hechos', value: razon },
        { name: 'Agente', value: `${interaction.user}` }
      )
      .setFooter({ text: 'Spanish Murcia RP · Fuerzas y Cuerpos de Seguridad' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};