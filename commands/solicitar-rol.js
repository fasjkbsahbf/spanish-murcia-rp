const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const ROLES_PROHIBIDOS = [
  'fundadora',
  'co-fundador',
  'altos cargos',
  'manager',
  'super game operator',
  'bots',
  'rb3',
  'bot oficial',
  'murcia rp',
  'equipo moderativo',
  'game operator',
  'ayudante'
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('solicitar-rol')
    .setDescription('Solicita un rol del servidor')
    .addRoleOption(o =>
      o.setName('rol')
        .setDescription('Rol que quieres solicitar')
        .setRequired(true)
    )
    .addStringOption(o =>
      o.setName('motivo')
        .setDescription('Por qué lo solicitas')
        .setRequired(true)
    ),

  async execute(interaction) {
    const rol = interaction.options.getRole('rol');
    const motivo = interaction.options.getString('motivo');

    const nombre = rol.name.toLowerCase();
    if (ROLES_PROHIBIDOS.some(p => nombre.includes(p))) {
      return interaction.reply({
        content: 'Ese rol no se puede solicitar. Es un rol de staff / administración.',
        ephemeral: true
      });
    }

    if (interaction.member.roles.cache.has(rol.id)) {
      return interaction.reply({
        content: 'Ya tienes ese rol.',
        ephemeral: true
      });
    }

    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle('Solicitud de rol')
      .addFields(
        { name: 'Usuario', value: `${interaction.user} (\`${interaction.user.tag}\`)`, inline: true },
        { name: 'Rol solicitado', value: `${rol}`, inline: true },
        { name: 'Motivo', value: motivo }
      )
      .setFooter({ text: `ID usuario: ${interaction.user.id} · ID rol: ${rol.id}` })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`aceptar_rol_${interaction.user.id}_${rol.id}`)
        .setLabel('Aceptar')
        .setStyle(ButtonStyle.Success)
        .setEmoji('✅'),
      new ButtonBuilder()
        .setCustomId(`rechazar_rol_${interaction.user.id}_${rol.id}`)
        .setLabel('Rechazar')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('❌')
    );

    // ⚠️ CAMBIA ESTE ID por el canal de solicitudes
    const canalSolicitudes = interaction.guild.channels.cache.get('1512972198598676561');

    if (canalSolicitudes) {
      await canalSolicitudes.send({ embeds: [embed], components: [row] });
    } else {
      await interaction.channel.send({ embeds: [embed], components: [row] });
    }

    await interaction.reply({
      content: `Tu solicitud del rol ${rol} ha sido enviada al staff.`,
      ephemeral: true
    });
  },
};