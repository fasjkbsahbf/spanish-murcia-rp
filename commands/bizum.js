const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../database.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('bizum')
    .setDescription('Transfiere dinero a otro ciudadano')
    .addUserOption(o => o.setName('usuario').setDescription('Destinatario').setRequired(true))
    .addIntegerOption(o => o.setName('cantidad').setDescription('Importe').setRequired(true).setMinValue(1)),
  async execute(interaction) {
    const target = interaction.options.getUser('usuario');
    const amount = interaction.options.getInteger('cantidad');

    if (target.id === interaction.user.id) {
      return interaction.reply({ content: 'No puedes transferirte dinero a ti mismo.', ephemeral: true });
    }
    if (target.bot) {
      return interaction.reply({ content: 'No se puede transferir dinero a un bot.', ephemeral: true });
    }

    let sender = db.prepare('SELECT * FROM economy WHERE user_id = ?').get(interaction.user.id);
    if (!sender || sender.cash < amount) {
      return interaction.reply({ content: 'No dispones de suficiente efectivo.', ephemeral: true });
    }

    if (!db.prepare('SELECT user_id FROM economy WHERE user_id = ?').get(target.id)) {
      db.prepare('INSERT INTO economy (user_id, cash, bank) VALUES (?, 0, 0)').run(target.id);
    }

    db.prepare('UPDATE economy SET cash = cash - ? WHERE user_id = ?').run(amount, interaction.user.id);
    db.prepare('UPDATE economy SET cash = cash + ? WHERE user_id = ?').run(amount, target.id);

    const embed = new EmbedBuilder()
      .setColor(0x3498DB)
      .setTitle('Transferencia realizada')
      .addFields(
        { name: 'Remitente', value: `${interaction.user}`, inline: true },
        { name: 'Beneficiario', value: `${target}`, inline: true },
        { name: 'Importe', value: `\`$${amount.toLocaleString()}\``, inline: true }
      )
      .setFooter({ text: 'Spanish Murcia RP · Bizum' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};