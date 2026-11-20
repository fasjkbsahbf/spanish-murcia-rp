const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../database.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('dni')
    .setDescription('Documento Nacional de Identidad')
    .addSubcommand(s => s
      .setName('crear')
      .setDescription('Registrar o actualizar tu DNI')
      .addStringOption(o => o.setName('nombre').setDescription('Nombre').setRequired(true))
      .addStringOption(o => o.setName('apellido1').setDescription('Primer apellido').setRequired(true))
      .addStringOption(o => o.setName('apellido2').setDescription('Segundo apellido').setRequired(true))
      .addStringOption(o => o.setName('fecha_nacimiento').setDescription('Fecha de nacimiento (DD/MM/AAAA)').setRequired(true))
      .addStringOption(o => o.setName('lugar_nacimiento').setDescription('Lugar de nacimiento (Ciudad, Provincia)').setRequired(true))
      .addStringOption(o => o.setName('nacionalidad').setDescription('Nacionalidad').setRequired(true))
      .addStringOption(o => o.setName('sexo').setDescription('Sexo').setRequired(true)
        .addChoices(
          { name: 'Masculino', value: 'Masculino' },
          { name: 'Femenino', value: 'Femenino' }
        ))
      .addStringOption(o => o.setName('domicilio').setDescription('Domicilio completo').setRequired(true))
      .addStringOption(o => o.setName('numero_dni').setDescription('Número de DNI (ejemplo: 12345678A)').setRequired(true))
    )
    .addSubcommand(s => s
      .setName('ver')
      .setDescription('Consultar un DNI')
      .addUserOption(o => o.setName('usuario').setDescription('Ciudadano'))
    )
    .addSubcommand(s => s
      .setName('eliminar')
      .setDescription('Retirar un DNI (autoridad)')
      .addUserOption(o => o.setName('usuario').setDescription('Ciudadano').setRequired(true))
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'crear') {
      const nombre = interaction.options.getString('nombre');
      const apellido1 = interaction.options.getString('apellido1');
      const apellido2 = interaction.options.getString('apellido2');
      const fechaNacimiento = interaction.options.getString('fecha_nacimiento');
      const lugarNacimiento = interaction.options.getString('lugar_nacimiento');
      const nacionalidad = interaction.options.getString('nacionalidad');
      const sexo = interaction.options.getString('sexo');
      const domicilio = interaction.options.getString('domicilio');
      const numeroDni = interaction.options.getString('numero_dni').toUpperCase();
      const fechaEmision = new Date().toLocaleDateString('es-ES');

      // Validación básica del número de DNI
      const dniRegex = /^[0-9]{8}[A-Z]$/;
      if (!dniRegex.test(numeroDni)) {
        return interaction.reply({
          content: 'El número de DNI no es válido. Debe tener el formato **12345678A**.',
          ephemeral: true
        });
      }

      // Calcular fecha de caducidad (10 años)
      const [dia, mes, anio] = fechaNacimiento.split('/').map(Number);
      const fechaCaducidad = new Date(anio + 10, mes - 1, dia).toLocaleDateString('es-ES');

      db.prepare(`
        INSERT OR REPLACE INTO dni (
          user_id, nombre, apellido1, apellido2, fecha_nacimiento, lugar_nacimiento,
          nacionalidad, sexo, domicilio, numero_dni, fecha_emision, fecha_caducidad
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        interaction.user.id,
        nombre,
        apellido1,
        apellido2,
        fechaNacimiento,
        lugarNacimiento,
        nacionalidad,
        sexo,
        domicilio,
        numeroDni,
        fechaEmision,
        fechaCaducidad
      );

      const embed = new EmbedBuilder()
        .setColor(0x2ECC71)
        .setTitle('DNI registrado correctamente')
        .setDescription('Tu Documento Nacional de Identidad ha sido inscrito en el Registro Civil.')
        .addFields(
          { name: 'Titular', value: `${nombre} ${apellido1} ${apellido2}`, inline: false },
          { name: 'Número de DNI', value: numeroDni, inline: true },
          { name: 'Sexo', value: sexo, inline: true },
          { name: 'Nacionalidad', value: nacionalidad, inline: true },
          { name: 'Fecha de nacimiento', value: fechaNacimiento, inline: true },
          { name: 'Lugar de nacimiento', value: lugarNacimiento, inline: true },
          { name: 'Domicilio', value: domicilio, inline: false },
          { name: 'Fecha de emisión', value: fechaEmision, inline: true },
          { name: 'Fecha de caducidad', value: fechaCaducidad, inline: true }
        )
        .setFooter({ text: 'Spanish Murcia RP · Registro Civil' })
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    }

    if (sub === 'ver') {
      const user = interaction.options.getUser('usuario') || interaction.user;
      const data = db.prepare('SELECT * FROM dni WHERE user_id = ?').get(user.id);

      if (!data) {
        return interaction.reply({
          content: 'Ese ciudadano no tiene DNI registrado.',
          ephemeral: true
        });
      }

      const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle('Documento Nacional de Identidad')
        .setThumbnail(user.displayAvatarURL({ dynamic: true }))
        .addFields(
          { name: 'Nombre', value: data.nombre, inline: true },
          { name: 'Primer apellido', value: data.apellido1, inline: true },
          { name: 'Segundo apellido', value: data.apellido2 || '—', inline: true },
          { name: 'Número de DNI', value: data.numero_dni || '—', inline: true },
          { name: 'Sexo', value: data.sexo || '—', inline: true },
          { name: 'Nacionalidad', value: data.nacionalidad || '—', inline: true },
          { name: 'Fecha de nacimiento', value: data.fecha_nacimiento || '—', inline: true },
          { name: 'Lugar de nacimiento', value: data.lugar_nacimiento || '—', inline: true },
          { name: 'Domicilio', value: data.domicilio || '—', inline: false },
          { name: 'Fecha de emisión', value: data.fecha_emision || '—', inline: true },
          { name: 'Fecha de caducidad', value: data.fecha_caducidad || '—', inline: true }
        )
        .setFooter({ text: `ID Discord: ${user.id}` })
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    }

    if (sub === 'eliminar') {
      if (!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
        return interaction.reply({
          content: 'No tienes autoridad para esta acción.',
          ephemeral: true
        });
      }

      const user = interaction.options.getUser('usuario');
      db.prepare('DELETE FROM dni WHERE user_id = ?').run(user.id);

      return interaction.reply(`Se ha retirado el DNI de **${user.username}**.`);
    }
  },
};