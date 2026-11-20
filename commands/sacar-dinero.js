const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../database.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('sacar-dinero')
    .setDescription('Retira dinero de tu cuenta bancaria')
    .addIntegerOption(o => o.setName('cantidad').setDescription('Importe a retirar').setRequired(true).setMinValue(1)),
  async execute(interaction) {
    const amount = interaction.options.getInteger('cantidad');
    let data = db.prepare('SELECT * FROM economy WHERE user_id = ?').get(interaction.user.id);

    if (!data || data.bank < amount) {
      return interaction.reply({ content: 'No tienes suficiente saldo en el banco.', ephemeral: true });
    }
    if (!data.banco) {
      return interaction.reply({ content: 'No tienes cuenta bancaria abierta.', ephemeral: true });
    }

    db.prepare('UPDATE economy SET bank = bank - ?, cash = cash + ? WHERE user_id = ?')
      .run(amount, amount, interaction.user.id);

    const embed = new EmbedBuilder()
      .setColor(0xF1C40F)
      .setTitle('Retirada realizada')
      .setDescription(`Has retirado dinero de **${data.banco}**.`)
      .addFields(
        { name: 'Importe', value: `\`$${amount.toLocaleString()}\``, inline: true },
        { name: 'Efectivo actual', value: `\`$${(data.cash + amount).toLocaleString()}\``, inline: true }
      )
      .setFooter({ text: 'Spanish Murcia RP · Banca' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};