const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../database.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('removemoney')
    .setDescription('Quita dinero a un usuario (Admin)')
    .addUserOption(opt => opt.setName('usuario').setDescription('Usuario').setRequired(true))
    .addIntegerOption(opt => opt.setName('cantidad').setDescription('Cantidad').setRequired(true).setMinValue(1))
    .addStringOption(opt => opt.setName('donde').setDescription('De dónde quitarlo').setRequired(true).addChoices(
      { name: 'Efectivo', value: 'cash' },
      { name: 'Banco', value: 'bank' }
    ))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    const user = interaction.options.getUser('usuario');
    const amount = interaction.options.getInteger('cantidad');
    const donde = interaction.options.getString('donde');

    let data = db.prepare('SELECT * FROM economy WHERE user_id = ?').get(user.id);
    if (!data) {
      return interaction.reply({ content: '❌ Ese usuario no tiene cuenta de economía.', ephemeral: true });
    }

    if (donde === 'cash') {
      db.prepare('UPDATE economy SET cash = MAX(cash - ?, 0) WHERE user_id = ?').run(amount, user.id);
    } else {
      db.prepare('UPDATE economy SET bank = MAX(bank - ?, 0) WHERE user_id = ?').run(amount, user.id);
    }

    const embed = new EmbedBuilder()
      .setColor(0xE74C3C)
      .setTitle('💸 Dinero Retirado')
      .addFields(
        { name: 'Usuario', value: `${user}`, inline: true },
        { name: 'Cantidad', value: `\`$${amount.toLocaleString()}\``, inline: true },
        { name: 'Ubicación', value: donde === 'cash' ? '💵 Efectivo' : '🏦 Banco', inline: true }
      )
      .setFooter({ text: `Acción realizada por ${interaction.user.tag}` })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};