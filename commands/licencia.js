const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../database.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('licencia')
    .setDescription('Gestión de licencias (Staff)')
    .addSubcommand(sub =>
      sub.setName('ver')
        .setDescription('Ver las licencias de un usuario')
        .addUserOption(o => o.setName('usuario').setDescription('Usuario'))
    )
    .addSubcommand(sub =>
      sub.setName('dar')
        .setDescription('Dar una licencia')
        .addUserOption(o => o.setName('usuario').setDescription('Usuario').setRequired(true))
        .addStringOption(o => o.setName('tipo').setDescription('Tipo de licencia').setRequired(true)
          .addChoices(
            { name: 'Conducir', value: 'conducir' },
            { name: 'Armas', value: 'armas' }
          ))
    )
    .addSubcommand(sub =>
      sub.setName('quitar')
        .setDescription('Quitar una licencia')
        .addUserOption(o => o.setName('usuario').setDescription('Usuario').setRequired(true))
        .addStringOption(o => o.setName('tipo').setDescription('Tipo de licencia').setRequired(true)
          .addChoices(
            { name: 'Conducir', value: 'conducir' },
            { name: 'Armas', value: 'armas' }
          ))
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    // Crear tabla si no existe
    db.prepare(`
      CREATE TABLE IF NOT EXISTS licencias (
        user_id TEXT PRIMARY KEY,
        conducir INTEGER DEFAULT 0,
        armas INTEGER DEFAULT 0
      )
    `).run();

    if (sub === 'ver') {
      const user = interaction.options.getUser('usuario') || interaction.user;
      let data = db.prepare('SELECT * FROM licencias WHERE user_id = ?').get(user.id);

      if (!data) {
        db.prepare('INSERT INTO licencias (user_id, conducir, armas) VALUES (?, 0, 0)').run(user.id);
        data = { conducir: 0, armas: 0 };
      }

      const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle(`📄 Licencias de ${user.username}`)
        .addFields(
          { name: '🚗 Licencia de Conducir', value: data.conducir ? '✅ Sí' : '❌ No', inline: true },
          { name: '🔫 Licencia de Armas', value: data.armas ? '✅ Sí' : '❌ No', inline: true }
        )
        .setThumbnail(user.displayAvatarURL({ dynamic: true }))
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    }

    const user = interaction.options.getUser('usuario');
    const tipo = interaction.options.getString('tipo');

    let data = db.prepare('SELECT * FROM licencias WHERE user_id = ?').get(user.id);
    if (!data) {
      db.prepare('INSERT INTO licencias (user_id, conducir, armas) VALUES (?, 0, 0)').run(user.id);
    }

    if (sub === 'dar') {
      db.prepare(`UPDATE licencias SET ${tipo} = 1 WHERE user_id = ?`).run(user.id);
      await interaction.reply(`✅ Se le ha **dado** la licencia de **${tipo}** a **${user.username}**.`);
    }

    if (sub === 'quitar') {
      db.prepare(`UPDATE licencias SET ${tipo} = 0 WHERE user_id = ?`).run(user.id);
      await interaction.reply(`✅ Se le ha **quitado** la licencia de **${tipo}** a **${user.username}**.`);
    }
  },
};