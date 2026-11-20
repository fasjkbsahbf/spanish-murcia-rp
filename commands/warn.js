const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../database.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Advierte a un ciudadano')
    .addUserOption(o => o.setName('usuario').setDescription('Ciudadano').setRequired(true))
    .addStringOption(o => o.setName('motivo').setDescription('Motivo de la advertencia').setRequired(true))
    .addStringOption(o => o.setName('pruebas1').setDescription('Prueba 1 (enlace o descripción)').setRequired(true))
    .addStringOption(o => o.setName('apelable').setDescription('¿Es apelable?').setRequired(true)
      .addChoices(
        { name: 'Sí', value: 'si' },
        { name: 'No', value: 'no' }
      ))
    .addStringOption(o => o.setName('pruebas2').setDescription('Prueba 2 (opcional)'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    const user = interaction.options.getUser('usuario');
    const motivo = interaction.options.getString('motivo');
    const pruebas1 = interaction.options.getString('pruebas1');
    const pruebas2 = interaction.options.getString('pruebas2') || 'No aportada';
    const apelable = interaction.options.getString('apelable') === 'si' ? 'Sí' : 'No';
    const staff = interaction.user;

    try {
      db.prepare(`
        INSERT INTO sanciones (user_id, tipo, cantidad, razon, staff_id, staff_tag, fecha)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(user.id, 'WARN', 0, `${motivo} | Pruebas: ${pruebas1} / ${pruebas2} | Apelable: ${apelable}`, staff.id, staff.tag, new Date().toLocaleString('es-ES'));
    } catch (e) {}

    const embed = new EmbedBuilder()
      .setColor(0xF1C40F)
      .setTitle('Advertencia formal')
      .setThumbnail(user.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: 'Ciudadano', value: `${user}`, inline: true },
        { name: 'Staff actuante', value: `${staff}`, inline: true },
        { name: 'Apelable', value: apelable, inline: true },
        { name: 'Motivo', value: motivo },
        { name: 'Pruebas', value: `1. ${pruebas1}\n2. ${pruebas2}` }
      )
      .setFooter({ text: 'Spanish Murcia RP · Sistema disciplinario' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });

    const dmEmbed = new EmbedBuilder()
      .setColor(0xF1C40F)
      .setTitle('Has recibido una advertencia')
      .setDescription(
        `Se te ha impuesto una **advertencia formal** en **Spanish Murcia RP**.\n\n` +
        `Te recomendamos leer las normas del servidor para evitar sanciones mayores.`
      )
      .addFields(
        { name: 'Motivo', value: motivo },
        { name: 'Pruebas aportadas', value: `• ${pruebas1}\n• ${pruebas2}` },
        { name: '¿Es apelable?', value: apelable },
        { name: 'Staff responsable', value: staff.tag },
        { name: 'Fecha', value: new Date().toLocaleString('es-ES') }
      )
      .setFooter({ text: 'Spanish Murcia RP · Si consideras que es un error, abre ticket de apelación' })
      .setTimestamp();

    try {
      await user.send({ embeds: [dmEmbed] });
    } catch {
      await interaction.followUp({ content: 'No se pudo enviar el MD al usuario (tiene los mensajes privados cerrados).', ephemeral: true });
    }
  },
};