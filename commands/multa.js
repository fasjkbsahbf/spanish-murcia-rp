const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../database.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('multa')
    .setDescription('Impone una sanción económica a un ciudadano')
    .addUserOption(o => o.setName('usuario').setDescription('Infractor').setRequired(true))
    .addIntegerOption(o => o.setName('cantidad').setDescription('Importe de la multa').setRequired(true).setMinValue(1))
    .addStringOption(o => o.setName('razon').setDescription('Motivo de la sanción').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    const user = interaction.options.getUser('usuario');
    const cantidad = interaction.options.getInteger('cantidad');
    const razon = interaction.options.getString('razon');

    let data = db.prepare('SELECT * FROM economy WHERE user_id = ?').get(user.id);
    if (!data) {
      db.prepare('INSERT INTO economy (user_id, cash, bank) VALUES (?, 0, 0)').run(user.id);
      data = { bank: 0 };
    }

    db.prepare('UPDATE economy SET bank = bank - ? WHERE user_id = ?').run(cantidad, user.id);
    const nuevoSaldo = data.bank - cantidad;

    // Guardar en historial
    db.prepare(`
      INSERT INTO sanciones (user_id, tipo, cantidad, razon, staff_id, staff_tag, fecha)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      user.id,
      'MULTA',
      cantidad,
      razon,
      interaction.user.id,
      interaction.user.tag,
      new Date().toLocaleString('es-ES')
    );

    const embed = new EmbedBuilder()
      .setColor(0xE74C3C)
      .setTitle('Sanción económica impuesta')
      .addFields(
        { name: 'Ciudadano', value: `${user}`, inline: true },
        { name: 'Importe', value: `\`$${cantidad.toLocaleString()}\``, inline: true },
        { name: 'Saldo bancario resultante', value: `\`$${nuevoSaldo.toLocaleString()}\``, inline: true },
        { name: 'Motivo', value: razon },
        { name: 'Agente actuante', value: `${interaction.user}` }
      )
      .setFooter({ text: 'Spanish Murcia RP · Cuerpo de Policía' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};