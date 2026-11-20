const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../database.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('depositar')
    .setDescription('Ingresa efectivo en tu cuenta bancaria')
    .addIntegerOption(o => o.setName('cantidad').setDescription('Importe a ingresar').setRequired(true).setMinValue(1)),
  async execute(interaction) {
    const amount = interaction.options.getInteger('cantidad');
    let data = db.prepare('SELECT * FROM economy WHERE user_id = ?').get(interaction.user.id);

    if (!data || data.cash < amount) {
      return interaction.reply({ content: 'No dispones de ese efectivo.', ephemeral: true });
    }
    if (!data.banco) {
      return interaction.reply({ content: 'No tienes cuenta bancaria. Usa `/crear-cuenta` primero.', ephemeral: true });
    }

    db.prepare('UPDATE economy SET cash = cash - ?, bank = bank + ? WHERE user_id = ?')
      .run(amount, amount, interaction.user.id);

    const embed = new EmbedBuilder()
      .setColor(0x2ECC71)
      .setTitle('Ingreso realizado')
      .setDescription(`Has ingresado dinero en **${data.banco}**.`)
      .addFields(
        { name: 'Importe', value: `\`$${amount.toLocaleString()}\``, inline: true },
        { name: 'Nuevo saldo', value: `\`$${(data.bank + amount).toLocaleString()}\``, inline: true }
      )
      .setFooter({ text: 'Spanish Murcia RP · Banca' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};