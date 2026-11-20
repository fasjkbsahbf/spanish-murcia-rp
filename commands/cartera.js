const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../database.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('cartera')
    .setDescription('Consulta tu situación económica o la de otro ciudadano')
    .addUserOption(o => o.setName('usuario').setDescription('Ciudadano')),
  async execute(interaction) {
    const user = interaction.options.getUser('usuario') || interaction.user;
    let data = db.prepare('SELECT * FROM economy WHERE user_id = ?').get(user.id);

    if (!data) {
      db.prepare('INSERT INTO economy (user_id, cash, bank) VALUES (?, 0, 0)').run(user.id);
      data = { cash: 0, bank: 0, banco: null, interes: 0 };
    }

    const total = data.cash + data.bank;
    const tieneCuenta = !!data.banco;

    const embed = new EmbedBuilder()
      .setColor(tieneCuenta ? 0x2ECC71 : 0xE67E22)
      .setAuthor({ name: `Situación económica · ${user.username}`, iconURL: user.displayAvatarURL({ dynamic: true }) })
      .setThumbnail(user.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: 'Efectivo', value: `\`$${data.cash.toLocaleString()}\``, inline: true },
        { name: 'Saldo bancario', value: `\`$${data.bank.toLocaleString()}\``, inline: true },
        { name: 'Patrimonio total', value: `\`$${total.toLocaleString()}\``, inline: true },
        {
          name: 'Entidad bancaria',
          value: tieneCuenta
            ? `**${data.banco}**\nComisión aplicada: **${data.interes}%**`
            : 'Sin cuenta bancaria\nUsa `/crear-cuenta` para abrir una'
        }
      )
      .setFooter({ text: 'Spanish Murcia RP · Sistema económico' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};