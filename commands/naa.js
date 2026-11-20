const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../database.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('naa')
    .setDescription('Sistema de alertas NAA')
    .addSubcommand(s => s.setName('ver').setDescription('Consultar la alerta vigente'))
    .addSubcommand(s => s.setName('cambiar').setDescription('Actualizar la alerta')
      .addStringOption(o => o.setName('mensaje').setDescription('Nuevo aviso').setRequired(true)))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'ver') {
      const data = db.prepare('SELECT mensaje FROM naa WHERE id = 1').get();
      const embed = new EmbedBuilder()
        .setColor(0xE74C3C)
        .setTitle('Alerta NAA vigente')
        .setDescription(data?.mensaje || 'No hay alertas activas.')
        .setFooter({ text: 'Spanish Murcia RP · NAA' })
        .setTimestamp();
      return interaction.reply({ embeds: [embed] });
    }

    if (sub === 'cambiar') {
      const mensaje = interaction.options.getString('mensaje');
      db.prepare('UPDATE naa SET mensaje = ? WHERE id = 1').run(mensaje);
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xE67E22)
            .setTitle('Alerta NAA actualizada')
            .setDescription(mensaje)
            .setFooter({ text: `Actualizada por ${interaction.user.tag}` })
        ]
      });
    }
  },
};