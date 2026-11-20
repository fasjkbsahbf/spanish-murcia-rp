const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Expulsa a un miembro')
    .addUserOption(option => option.setName('usuario').setDescription('Usuario a expulsar').setRequired(true))
    .addStringOption(option => option.setName('razon').setDescription('Razón de la expulsión'))
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),
  async execute(interaction) {
    const user = interaction.options.getUser('usuario');
    const razon = interaction.options.getString('razon') || 'Sin razón especificada';
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);

    if (!member) return interaction.reply({ content: 'No se encontró al usuario.', ephemeral: true });
    if (!member.kickable) return interaction.reply({ content: 'No puedo expulsar a este usuario.', ephemeral: true });

    await member.kick(razon);
    await interaction.reply(`✅ ${user.tag} ha sido expulsado.\nRazón: ${razon}`);
  },
};