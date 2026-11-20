const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('verificacion')
    .setDescription('Envía el panel de verificación')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle('✅ Sistema de Verificación')
      .setDescription('Para poder acceder al servidor y rolear, **debes verificarte**.\n\n**¿Qué necesitas?**\n• Tener cuenta de Roblox\n• Conocer las normas básicas de roleplay\n• Completar el formulario\n\nEl staff revisará tu solicitud.')
      .addFields({ name: '📋 Se pedirá', value: '• Usuario de Discord\n• Usuario de Roblox\n• Link del perfil de Roblox\n• Edad (OOC)\n• Preguntas de roleplay' })
      .setFooter({ text: 'Haz clic en el botón para empezar' })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('empezar_verificacion')
        .setLabel('Haz clic para verificarte')
        .setStyle(ButtonStyle.Success)
        .setEmoji('✅')
    );

    await interaction.reply({ content: 'Panel de verificación enviado.', ephemeral: true });
    await interaction.channel.send({ embeds: [embed], components: [row] });
  },
};