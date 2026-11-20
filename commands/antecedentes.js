const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../database.js');

// ⚠️ SOLO quien tenga ESTE rol puede usar /antecedentes
const ROL_PUEDE_VER_ANTECEDENTES = '1540342976302284881'; // cámbialo

module.exports = {
  data: new SlashCommandBuilder()
    .setName('antecedentes')
    .setDescription('Consulta la ficha policial de un ciudadano')
    .addUserOption(o => o.setName('usuario').setDescription('Ciudadano').setRequired(true)),

  async execute(interaction) {
    // Comprobar rol
    if (!interaction.member.roles.cache.has(ROL_PUEDE_VER_ANTECEDENTES) &&
        !interaction.member.permissions.has('Administrator')) {
      return interaction.reply({
        content: 'No tienes autorización para consultar antecedentes policiales.',
        ephemeral: true
      });
    }

    const user = interaction.options.getUser('usuario');
    const dni = db.prepare('SELECT * FROM dni WHERE user_id = ?').get(user.id);

    const multas = db.prepare(`
      SELECT * FROM sanciones WHERE user_id = ? AND tipo = 'MULTA' ORDER BY id DESC
    `).all(user.id);

    const arrestos = db.prepare(`
      SELECT * FROM sanciones WHERE user_id = ? AND tipo = 'ARRESTO' ORDER BY id DESC
    `).all(user.id);

    const totalMultas = multas.reduce((acc, m) => acc + (m.cantidad || 0), 0);
    const totalFianzas = arrestos.reduce((acc, a) => acc + (a.cantidad || 0), 0);

    // Años de prisión estimados (1 arresto ≈ 1 año RP, ajústalo si quieres)
    const anosPrision = arrestos.length;

    const embed = new EmbedBuilder()
      .setColor(0x1A1A2E)
      .setAuthor({
        name: 'CUERPO NACIONAL DE POLICÍA · REGISTRO DE ANTECEDENTES',
        iconURL: interaction.guild.iconURL({ dynamic: true }) || undefined
      })
      .setTitle('FICHA POLICIAL')
      .setThumbnail(user.displayAvatarURL({ dynamic: true }))
      .addFields(
        {
          name: 'IDENTIFICACIÓN',
          value:
            `**Nombre:** ${dni?.nombre || '—'}\n` +
            `**Apellidos:** ${dni?.apellido || '—'}\n` +
            `**Edad:** ${dni?.edad || '—'}\n` +
            `**Nacionalidad:** ${dni?.nacionalidad || '—'}\n` +
            `**Sexo:** ${dni?.sexo || '—'}\n` +
            `**Discord:** ${user.tag}\n` +
            `**ID:** \`${user.id}\``
        },
        {
          name: 'RESUMEN PENAL',
          value:
            `**Multas registradas:** ${multas.length}\n` +
            `**Monto total multas:** $${totalMultas.toLocaleString()}\n` +
            `**Arrestos registrados:** ${arrestos.length}\n` +
            `**Monto total fianzas:** $${totalFianzas.toLocaleString()}\n` +
            `**Años en prisión (estimados):** ${anosPrision}`
        }
      )
      .setFooter({
        text: `Consulta realizada por ${interaction.user.tag} · Spanish Murcia RP`
      })
      .setTimestamp();

    // Detalle de multas
    if (multas.length) {
      embed.addFields({
        name: 'HISTORIAL DE MULTAS',
        value: multas.slice(0, 8).map((m, i) =>
          `**${i + 1}.** $${Number(m.cantidad).toLocaleString()} — ${m.razon}\n*${m.staff_tag} · ${m.fecha}*`
        ).join('\n\n').slice(0, 1024)
      });
    } else {
      embed.addFields({ name: 'HISTORIAL DE MULTAS', value: 'Sin multas registradas.' });
    }

    // Detalle de arrestos
    if (arrestos.length) {
      embed.addFields({
        name: 'HISTORIAL DE ARRESTOS / FIANZAS',
        value: arrestos.slice(0, 8).map((a, i) =>
          `**${i + 1}.** Fianza $${Number(a.cantidad).toLocaleString()} — ${a.razon}\n*${a.staff_tag} · ${a.fecha}*`
        ).join('\n\n').slice(0, 1024)
      });
    } else {
      embed.addFields({ name: 'HISTORIAL DE ARRESTOS / FIANZAS', value: 'Sin arrestos registrados.' });
    }

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};