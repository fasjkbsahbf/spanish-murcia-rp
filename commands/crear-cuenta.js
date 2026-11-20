const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const db = require('../database.js');

const bancos = [
  {
    id: 'cajamar',
    nombre: 'Cajamar Caja Rural',
    descripcion: 'Banco principal de Murcia. Interés bajo y estable.',
    interes: 1.5,
    emoji: '🟢'
  },
  {
    id: 'sabadell',
    nombre: 'Banco Sabadell',
    descripcion: 'Buena rentabilidad pero comisiones más altas.',
    interes: 2.8,
    emoji: '🔵'
  },
  {
    id: 'bbva',
    nombre: 'BBVA',
    descripcion: 'Banco grande. Comisiones moderadas.',
    interes: 2.2,
    emoji: '🔷'
  },
  {
    id: 'caixabank',
    nombre: 'CaixaBank',
    descripcion: 'Muy usado en la región. Interés medio.',
    interes: 2.5,
    emoji: '🟣'
  },
  {
    id: 'unicaja',
    nombre: 'Unicaja Banco',
    descripcion: 'Opción económica con comisiones bajas.',
    interes: 1.8,
    emoji: '🟠'
  },
  {
    id: 'santander',
    nombre: 'Banco Santander',
    descripcion: 'Prestigio nacional. Comisiones más altas.',
    interes: 3.0,
    emoji: '🔴'
  }
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('crear-cuenta')
    .setDescription('Abre una cuenta bancaria en uno de los bancos disponibles'),

  async execute(interaction) {
    const userId = interaction.user.id;
    let data = db.prepare('SELECT * FROM economy WHERE user_id = ?').get(userId);

    if (!data) {
      db.prepare('INSERT INTO economy (user_id, cash, bank) VALUES (?, 0, 0)').run(userId);
      data = { banco: null };
    }

    if (data.banco) {
      return interaction.reply({
        content: `❌ Ya tienes una cuenta abierta en **${data.banco}**.\nSi quieres cambiar de banco, contacta con un administrador.`,
        ephemeral: true
      });
    }

    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle('🏦 Apertura de Cuenta Bancaria')
      .setDescription('Selecciona el banco con el que quieres abrir tu cuenta.\n\nCada banco tiene un **interés/comisión** diferente.')
      .addFields(
        bancos.map(b => ({
          name: `${b.emoji} ${b.nombre}`,
          value: `${b.descripcion}\n**Comisión:** ${b.interes}%`,
          inline: false
        }))
      )
      .setFooter({ text: 'Elige con cuidado, solo puedes tener una cuenta' })
      .setTimestamp();

    const menu = new StringSelectMenuBuilder()
      .setCustomId('elegir_banco')
      .setPlaceholder('Selecciona un banco...')
      .addOptions(
        bancos.map(b => ({
          label: b.nombre,
          description: `Comisión: ${b.interes}%`,
          value: b.id,
          emoji: b.emoji
        }))
      );

    const row = new ActionRowBuilder().addComponents(menu);
    await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
  },
};