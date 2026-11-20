const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../database.js');

// ⚠️ CAMBIA ESTE ID por el del rol Gulag
const ROL_GULAG = '1513681295748890625';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('timeout')
    .setDescription('Aísla temporalmente a un ciudadano (Gulag)')
    .addUserOption(o => o.setName('usuario').setDescription('Ciudadano').setRequired(true))
    .addIntegerOption(o => o.setName('minutos').setDescription('Duración en minutos').setRequired(true).setMinValue(1).setMaxValue(40320))
    .addStringOption(o => o.setName('motivo').setDescription('Motivo').setRequired(true))
    .addStringOption(o => o.setName('pruebas1').setDescription('Prueba 1').setRequired(true))
    .addStringOption(o => o.setName('apelable').setDescription('¿Es apelable?').setRequired(true)
      .addChoices(
        { name: 'Sí', value: 'si' },
        { name: 'No', value: 'no' }
      ))
    .addStringOption(o => o.setName('pruebas2').setDescription('Prueba 2 (opcional)'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    const user = interaction.options.getUser('usuario');
    const minutos = interaction.options.getInteger('minutos');
    const motivo = interaction.options.getString('motivo');
    const pruebas1 = interaction.options.getString('pruebas1');
    const pruebas2 = interaction.options.getString('pruebas2') || 'No aportada';
    const apelable = interaction.options.getString('apelable') === 'si' ? 'Sí' : 'No';
    const staff = interaction.user;

    const member = await interaction.guild.members.fetch(user.id).catch(() => null);
    if (!member) {
      return interaction.reply({ content: 'No se encontró al usuario en el servidor.', ephemeral: true });
    }

    if (member.moderatable) {
      await member.timeout(minutos * 60 * 1000, motivo).catch(() => {});
    }

    const rolGulag = interaction.guild.roles.cache.get(ROL_GULAG);
    if (rolGulag) {
      await member.roles.add(rolGulag).catch(() => {});
    }

    const fin = Date.now() + (minutos * 60 * 1000);
    db.prepare(`
      INSERT OR REPLACE INTO gulag (user_id, fin, guild_id)
      VALUES (?, ?, ?)
    `).run(user.id, fin, interaction.guild.id);

    try {
      db.prepare(`
        INSERT INTO sanciones (user_id, tipo, cantidad, razon, staff_id, staff_tag, fecha)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        user.id,
        'TIMEOUT',
        minutos,
        `${motivo} | Pruebas: ${pruebas1} / ${pruebas2} | Apelable: ${apelable}`,
        staff.id,
        staff.tag,
        new Date().toLocaleString('es-ES')
      );
    } catch {}

    const embed = new EmbedBuilder()
      .setColor(0xE67E22)
      .setTitle('Aislamiento (Gulag) aplicado')
      .setThumbnail(user.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: 'Ciudadano', value: `${user}`, inline: true },
        { name: 'Duración', value: `${minutos} minutos`, inline: true },
        { name: 'Apelable', value: apelable, inline: true },
        { name: 'Motivo', value: motivo },
        { name: 'Pruebas', value: `1. ${pruebas1}\n2. ${pruebas2}` },
        { name: 'Staff', value: `${staff}` }
      )
      .setFooter({ text: 'Spanish Murcia RP · Sistema disciplinario' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });

    const dmEmbed = new EmbedBuilder()
      .setColor(0xE67E22)
      .setTitle('Has sido enviado al Gulag')
      .setDescription(
        `Has recibido un **aislamiento temporal** en **Spanish Murcia RP**.\n\n` +
        `Durante este tiempo solo podrás ver los canales de aislamiento.`
      )
      .addFields(
        { name: 'Duración', value: `${minutos} minutos` },
        { name: 'Motivo', value: motivo },
        { name: 'Pruebas', value: `• ${pruebas1}\n• ${pruebas2}` },
        { name: '¿Es apelable?', value: apelable },
        { name: 'Staff responsable', value: staff.tag }
      )
      .setFooter({ text: 'Spanish Murcia RP · Sistema disciplinario' })
      .setTimestamp();

    try {
      await user.send({ embeds: [dmEmbed] });
    } catch {}
  },
};