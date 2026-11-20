const { SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('Envía el panel de tickets')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle('Sistema de Tickets')
      .setDescription('Selecciona el tipo de ticket que necesitas abrir:')
      .addFields(
        { name: '🏛️ Contactar con Fundación', value: 'Asuntos relacionados con la Fundación' },
        { name: '🚨 Reporte a Usuario', value: 'Reportar a un usuario' },
        { name: '🛠️ Problemas Servidor', value: 'Problemas técnicos o del servidor' },
        { name: '🤝 Alianzas', value: 'Propuestas de alianza' },
        { name: '💰 Donaciones', value: 'Temas de donaciones' },
        { name: '📁 Otro', value: 'Cualquier otro asunto' }
      )
      .setFooter({ text: 'Solo puedes tener 1 ticket abierto a la vez' });

    const row1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('ticket_fundacion').setLabel('Fundación').setStyle(ButtonStyle.Primary).setEmoji('🏛️'),
      new ButtonBuilder().setCustomId('ticket_reporte').setLabel('Reporte').setStyle(ButtonStyle.Danger).setEmoji('🚨'),
      new ButtonBuilder().setCustomId('ticket_problemas').setLabel('Problemas').setStyle(ButtonStyle.Secondary).setEmoji('🛠️')
    );

    const row2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('ticket_alianzas').setLabel('Alianzas').setStyle(ButtonStyle.Success).setEmoji('🤝'),
      new ButtonBuilder().setCustomId('ticket_donaciones').setLabel('Donaciones').setStyle(ButtonStyle.Primary).setEmoji('💰'),
      new ButtonBuilder().setCustomId('ticket_otro').setLabel('Otro').setStyle(ButtonStyle.Secondary).setEmoji('📁')
    );

    await interaction.channel.send({ embeds: [embed], components: [row1, row2] });
    await interaction.reply({ content: 'Panel de tickets enviado.', ephemeral: true });
  },
};