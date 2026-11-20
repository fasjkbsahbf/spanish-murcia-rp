const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../database.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('tramitar-licencia')
    .setDescription('Solicita una licencia de conducir o de armas')
    .addStringOption(o =>
      o.setName('tipo')
        .setDescription('Tipo de licencia que quieres tramitar')
        .setRequired(true)
        .addChoices(
          { name: 'Licencia de Conducir', value: 'conducir' },
          { name: 'Licencia de Armas', value: 'armas' }
        )
    ),

  async execute(interaction) {
    const tipo = interaction.options.getString('tipo');
    const userId = interaction.user.id;

    // Aseguramos que exista la tabla
    db.prepare(`
      CREATE TABLE IF NOT EXISTS licencias (
        user_id TEXT PRIMARY KEY,
        conducir INTEGER DEFAULT 0,
        armas INTEGER DEFAULT 0
      )
    `).run();

    let data = db.prepare('SELECT * FROM licencias WHERE user_id = ?').get(userId);
    if (!data) {
      db.prepare('INSERT INTO licencias (user_id, conducir, armas) VALUES (?, 0, 0)').run(userId);
      data = { conducir: 0, armas: 0 };
    }

    // Comprobar si ya la tiene
    if (data[tipo] === 1) {
      return interaction.reply({
        content: `Ya tienes la licencia de **${tipo === 'conducir' ? 'Conducir' : 'Armas'}**.`,
        ephemeral: true
      });
    }

    // Precios de las licencias
    const precios = {
      conducir: 1500,
      armas: 3500
    };

    const precio = precios[tipo];

    // Comprobar dinero
    let economia = db.prepare('SELECT * FROM economy WHERE user_id = ?').get(userId);
    if (!economia || economia.cash < precio) {
      return interaction.reply({
        content: `No tienes suficiente dinero. La licencia de **${tipo}** cuesta **$${precio.toLocaleString()}**.`,
        ephemeral: true
      });
    }

    // Cobrar y dar la licencia
    db.prepare('UPDATE economy SET cash = cash - ? WHERE user_id = ?').run(precio, userId);
    db.prepare(`UPDATE licencias SET ${tipo} = 1 WHERE user_id = ?`).run(userId);

    const embed = new EmbedBuilder()
      .setColor(0x00FF00)
      .setTitle('✅ Licencia Tramitada')
      .setDescription(`Has obtenido la **Licencia de ${tipo === 'conducir' ? 'Conducir' : 'Armas'}**.`)
      .addFields(
        { name: 'Coste', value: `$${precio.toLocaleString()}`, inline: true },
        { name: 'Usuario', value: `${interaction.user}`, inline: true }
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};