const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../database.js');

const sueldos = {
  'Dirección Policía Local Murcia': 1400,
  'Policía Local Murcia': 1100,
  'Jefatura Cuerpo Nacional de Policía': 1500,
  'Cuerpo Nacional de Policía': 1200,
  'Jefatura Cuerpo de Bomberos': 1350,
  'Cuerpo de Bomberos de Murcia': 1150,
  'Jefatura 061': 1300,
  '061': 1050,
  'Granjero': 650,
  'Taxista': 850,
  'Autobusero': 900,
  'Repartidor de Correos': 750,
  'Camarero': 700,
  'Trasportista de gasolina': 950,
  'Peluquero': 720
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('cobrar-sueldo')
    .setDescription('Cobra la nómina de tu empleo (una vez cada 24 horas)'),
  async execute(interaction) {
    const member = interaction.member;
    let mejorSueldo = 0;
    let trabajo = null;

    for (const [nombreRol, cantidad] of Object.entries(sueldos)) {
      const rol = interaction.guild.roles.cache.find(r => r.name.includes(nombreRol) || nombreRol.includes(r.name));
      if (rol && member.roles.cache.has(rol.id) && cantidad > mejorSueldo) {
        mejorSueldo = cantidad;
        trabajo = nombreRol;
      }
    }

    if (!trabajo) {
      return interaction.reply({
        content: 'No tienes ningún empleo asignado. Solicita un puesto de trabajo al staff.',
        ephemeral: true
      });
    }

    let data = db.prepare('SELECT * FROM economy WHERE user_id = ?').get(interaction.user.id);
    if (!data) {
      db.prepare('INSERT INTO economy (user_id, cash, bank, last_daily) VALUES (?, 0, 0, 0)').run(interaction.user.id);
      data = { last_daily: 0 };
    }

    const now = Date.now();
    const cooldown = 24 * 60 * 60 * 1000;

    if (now - (data.last_daily || 0) < cooldown) {
      const remaining = cooldown - (now - data.last_daily);
      const hours = Math.floor(remaining / 3600000);
      const minutes = Math.floor((remaining % 3600000) / 60000);

      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xE74C3C)
            .setTitle('Nómina no disponible')
            .setDescription(`Ya has cobrado tu sueldo.\nPodrás volver a hacerlo en **${hours}h ${minutes}m**.`)
        ],
        ephemeral: true
      });
    }

    db.prepare('UPDATE economy SET cash = cash + ?, last_daily = ? WHERE user_id = ?')
      .run(mejorSueldo, now, interaction.user.id);

    const embed = new EmbedBuilder()
      .setColor(0x2ECC71)
      .setTitle('Nómina abonada')
      .setDescription('Se ha ingresado tu sueldo correspondiente.')
      .addFields(
        { name: 'Puesto', value: trabajo, inline: true },
        { name: 'Importe', value: `\`$${mejorSueldo.toLocaleString()}\``, inline: true },
        { name: 'Trabajador', value: `${interaction.user}`, inline: true }
      )
      .setFooter({ text: 'Spanish Murcia RP · Nóminas' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};