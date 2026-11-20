const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const db = require('../database.js');

const items = [
  { id: 'beretta_m9', nombre: 'Beretta M9', precio: 2000, emoji: '🔫' },
  { id: 'coltm1911', nombre: 'ColtM1911', precio: 2300, emoji: '🔫' },
  { id: 'ak47', nombre: 'AK-47', precio: 90000, emoji: '🔫' },
  { id: 'lmt129a1', nombre: 'LMT129A1', precio: 75000, emoji: '🔫' },
  { id: 'cuchillo', nombre: 'Cuchillo de combate', precio: 350, emoji: '🔪' },
  { id: 'bate', nombre: 'Bate de béisbol', precio: 200, emoji: '🏏' },
  { id: 'linterna', nombre: 'Linterna', precio: 80, emoji: '🔦' },
  { id: 'botiquin', nombre: 'Botiquín', precio: 150, emoji: '🩹' },
  { id: 'esposas', nombre: 'Esposas', precio: 120, emoji: '🔗' },
  { id: 'radio', nombre: 'Radio portátil', precio: 250, emoji: '📻' },
  { id: 'chaleco', nombre: 'Chaleco antibalas', precio: 3000, emoji: '🦺' },
  { id: 'movil', nombre: 'Teléfono móvil', precio: 400, emoji: '📱' }
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('tienda')
    .setDescription('Abre la tienda de objetos'),
  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor(0x00FF00)
      .setTitle('🛒 Tienda del Servidor')
      .setDescription(items.map(i => `${i.emoji} **${i.nombre}** — $${i.precio.toLocaleString()}`).join('\n'))
      .setFooter({ text: 'Selecciona un objeto del menú para comprarlo' });

    const menu = new StringSelectMenuBuilder()
      .setCustomId('comprar_item')
      .setPlaceholder('Selecciona un objeto...')
      .addOptions(items.map(i => ({
        label: i.nombre,
        description: `Precio: $${i.precio}`,
        value: i.id,
        emoji: i.emoji
      })));

    const row = new ActionRowBuilder().addComponents(menu);
    await interaction.reply({ embeds: [embed], components: [row] });
  },
};