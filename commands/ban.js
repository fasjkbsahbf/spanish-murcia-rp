const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../database.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Expulsa permanentemente a un ciudadano del servidor')
    .addUserOption(o => o.setName('usuario').setDescription('Ciudadano').setRequired(true))
    .addStringOption(o => o.setName('motivo').setDescription('Motivo del ban').setRequired(true))
    .addStringOption(o => o.setName('pruebas1').setDescription('Prueba 1').setRequired(true))
    .addStringOption(o => o.setName('apelable').setDescription('¿Es apelable?').setRequired(true)
      .addChoices(
        { name: 'Sí', value: 'si' },
        { name: 'No', value: 'no' }
      ))
    .addStringOption(o => o.setName('pruebas2').setDescription('Prueba 2 (opcional)'))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  async execute(interaction) {
    const user = interaction.options.getUser('usuario');
    const motivo = interaction.options.getString('motivo');
    const pruebas1 = interaction.options.getString('pruebas1');
    const pruebas2 = interaction.options.getString('pruebas2') || 'No aportada';
    const apelable = interaction.options.getString('apelable') === 'si' ? 'Sí' : 'No';
    const staff = interaction.user;

    const dmEmbed = new EmbedBuilder()
      .setColor(0xE74C3C)
      .setTitle('Has sido baneado de Spanish Murcia RP')
      .setDescription(
        `Has recibido una **sanción de ban** en el servidor.\n\n` +
        `Si la sanción es apelable, puedes abrir un ticket de apelación o contactar con la administración.`
      )
      .addFields(
        { name: 'Motivo', value: motivo },
        { name: 'Pruebas', value: `• ${pruebas1}\n• ${pruebas2}` },
        { name: '¿Es apelable?', value: apelable },
        { name: 'Staff responsable', value: staff.tag },
        { name: 'Fecha', value: new Date().toLocaleString('es-ES') }
      )
      .setFooter({ text: 'Spanish Murcia RP · Sistema disciplinario' })
      .setTimestamp();

    try { await user.send({ embeds: [dmEmbed] }); } catch {}

    try {
      db.prepare(`
        INSERT INTO sanciones (user_id, tipo, cantidad, razon, staff_id, staff_tag, fecha)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(user.id, 'BAN', 0, `${motivo} | Pruebas: ${pruebas1} / ${pruebas2} | Apelable: ${apelable}`, staff.id, staff.tag, new Date().toLocaleString('es-ES'));
    } catch {}

    await interaction.guild.members.ban(user.id, { reason: `${motivo} | Staff: ${staff.tag}` }).catch(() => null);

    const embed = new EmbedBuilder()
      .setColor(0xE74C3C)
      .setTitle('Ban aplicado')
      .setThumbnail(user.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: 'Ciudadano', value: `${user.tag}`, inline: true },
        { name: 'Staff', value: `${staff}`, inline: true },
        { name: 'Apelable', value: apelable, inline: true },
        { name: 'Motivo', value: motivo },
        { name: 'Pruebas', value: `1. ${pruebas1}\n2. ${pruebas2}` }
      )
      .setFooter({ text: 'Spanish Murcia RP · Sistema disciplinario' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};