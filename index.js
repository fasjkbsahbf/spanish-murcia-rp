require('dotenv').config();
const {
  Client, GatewayIntentBits, Collection, Events, PermissionFlagsBits,
  ChannelType, ActionRowBuilder, ButtonBuilder, ButtonStyle,
  EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle
} = require('discord.js');
const fs = require('fs');
const path = require('path');
const db = require('./database.js');

// ===== IDs DE TU SERVIDOR =====
const ROL_GULAG = '1513681295748890625';
const CANAL_BIENVENIDA = '1512954841004245003';
const CANAL_DESPEDIDA = '1512956592088420412';
const CANAL_LOGS = '1513832258673311824';
const CANAL_VERIFICACIONES = '1539980175360528494';
const ROL_VERIFICADO = '1513323359281348628';
const ROL_CIUDADANO = '1513314696394969282';
const ROL_IMPUESTOS = '1513316925898493982';
const ROL_STAFF_VERIFICACION = '1513306322714759349';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildModeration
  ]
});

client.commands = new Collection();
const verificacionesPendientes = new Map();

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  if ('data' in command && 'execute' in command) {
    client.commands.set(command.data.name, command);
  }
}

client.once(Events.ClientReady, () => {
  console.log(`✅ Bot listo como ${client.user.tag}`);
  client.user.setActivity('Spanish Murcia RP', { type: 3 });

  setInterval(async () => {
    const ahora = Date.now();
    const vencidos = db.prepare('SELECT * FROM gulag WHERE fin <= ?').all(ahora);

    for (const row of vencidos) {
      try {
        const guild = await client.guilds.fetch(row.guild_id).catch(() => null);
        if (!guild) continue;

        const member = await guild.members.fetch(row.user_id).catch(() => null);
        const rolGulag = guild.roles.cache.get(ROL_GULAG);

        if (member && rolGulag) {
          await member.roles.remove(rolGulag).catch(() => {});
        }

        db.prepare('DELETE FROM gulag WHERE user_id = ?').run(row.user_id);
      } catch (e) {
        console.error('Error quitando gulag:', e);
      }
    }
  }, 60 * 1000);
});

// BIENVENIDAS
client.on(Events.GuildMemberAdd, async member => {
  const canal = member.guild.channels.cache.get(CANAL_BIENVENIDA);
  if (!canal) return;

  const embed = new EmbedBuilder()
    .setColor(0x2ECC71)
    .setAuthor({ name: member.user.tag, iconURL: member.user.displayAvatarURL({ dynamic: true }) })
    .setTitle('Bienvenido a Spanish Murcia RP')
    .setDescription(
      `Hola ${member}, bienvenido al servidor.\n\n` +
      `Para poder rolear debes **verificarte** y leer las normas.`
    )
    .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
    .addFields({ name: 'Miembros actuales', value: `${member.guild.memberCount}`, inline: true })
    .setFooter({ text: 'Spanish Murcia RP · Roleplay serio' })
    .setTimestamp();

  canal.send({ content: `${member}`, embeds: [embed] }).catch(() => {});
});

// DESPEDIDAS
client.on(Events.GuildMemberRemove, async member => {
  const canal = member.guild.channels.cache.get(CANAL_DESPEDIDA);
  if (!canal) return;

  const embed = new EmbedBuilder()
    .setColor(0xE74C3C)
    .setTitle('Un ciudadano ha abandonado el servidor')
    .setDescription(`**${member.user.tag}** ha salido de Spanish Murcia RP.`)
    .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
    .setFooter({ text: `Miembros restantes: ${member.guild.memberCount}` })
    .setTimestamp();

  canal.send({ embeds: [embed] }).catch(() => {});
});

// LOGS
client.on(Events.MessageDelete, async message => {
  if (!message.guild || message.author?.bot) return;
  const logChannel = message.guild.channels.cache.get(CANAL_LOGS);
  if (!logChannel) return;

  const embed = new EmbedBuilder()
    .setColor(0xE74C3C)
    .setTitle('Mensaje eliminado')
    .addFields(
      { name: 'Autor', value: `${message.author}`, inline: true },
      { name: 'Canal', value: `${message.channel}`, inline: true },
      { name: 'Contenido', value: message.content?.slice(0, 1000) || '*Archivo / embed*' }
    )
    .setTimestamp();

  logChannel.send({ embeds: [embed] }).catch(() => {});
});

client.on(Events.MessageUpdate, async (oldMessage, newMessage) => {
  if (!oldMessage.guild || oldMessage.author?.bot || oldMessage.content === newMessage.content) return;
  const logChannel = oldMessage.guild.channels.cache.get(CANAL_LOGS);
  if (!logChannel) return;

  const embed = new EmbedBuilder()
    .setColor(0xF39C12)
    .setTitle('Mensaje editado')
    .addFields(
      { name: 'Autor', value: `${oldMessage.author}`, inline: true },
      { name: 'Canal', value: `${oldMessage.channel}`, inline: true },
      { name: 'Antes', value: oldMessage.content?.slice(0, 500) || '*vacío*' },
      { name: 'Después', value: newMessage.content?.slice(0, 500) || '*vacío*' }
    )
    .setTimestamp();

  logChannel.send({ embeds: [embed] }).catch(() => {});
});

// INTERACCIONES
client.on(Events.InteractionCreate, async interaction => {

  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) return;
    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(error);
      try {
        const msg = { content: 'Ha ocurrido un error al ejecutar este comando.', ephemeral: true };
        if (interaction.replied || interaction.deferred) await interaction.followUp(msg);
        else await interaction.reply(msg);
      } catch {}
    }
  }

  if (interaction.isStringSelectMenu() && interaction.customId === 'elegir_banco') {
    try {
      await interaction.deferUpdate();
      const bancos = {
        cajamar: { nombre: 'Cajamar Caja Rural', interes: 1.5 },
        sabadell: { nombre: 'Banco Sabadell', interes: 2.8 },
        bbva: { nombre: 'BBVA', interes: 2.2 },
        caixabank: { nombre: 'CaixaBank', interes: 2.5 },
        unicaja: { nombre: 'Unicaja Banco', interes: 1.8 },
        santander: { nombre: 'Banco Santander', interes: 3.0 }
      };
      const banco = bancos[interaction.values[0]];
      if (!banco) return;

      const existe = db.prepare('SELECT user_id FROM economy WHERE user_id = ?').get(interaction.user.id);
      if (!existe) {
        db.prepare('INSERT INTO economy (user_id, cash, bank, banco, interes) VALUES (?, 0, 0, ?, ?)')
          .run(interaction.user.id, banco.nombre, banco.interes);
      } else {
        db.prepare('UPDATE economy SET banco = ?, interes = ? WHERE user_id = ?')
          .run(banco.nombre, banco.interes, interaction.user.id);
      }

      const embed = new EmbedBuilder()
        .setColor(0x2ECC71)
        .setTitle('Cuenta bancaria abierta')
        .setDescription(`Has abierto una cuenta en **${banco.nombre}**.`)
        .addFields(
          { name: 'Entidad', value: banco.nombre, inline: true },
          { name: 'Comisión', value: `${banco.interes}%`, inline: true }
        )
        .setFooter({ text: 'Ya puedes usar /depositar y /sacar-dinero' })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed], components: [] });
    } catch (error) {
      console.error('ERROR BANCO:', error);
    }
  }

  if (interaction.isStringSelectMenu() && interaction.customId === 'comprar_item') {
    const items = {
      beretta_m9: { nombre: 'Beretta M9', precio: 2000 },
      colt1911M: { nombre: 'Colt1911M', precio: 2300 },
      ak47: { nombre: 'AK-47', precio: 90000 },
      lmt1209a1: { nombre: 'LMT1209A1', precio: 75000 },
      cuchillo: { nombre: 'Cuchillo de combate', precio: 350 },
      bate: { nombre: 'Bate de béisbol', precio: 200 },
      linterna: { nombre: 'Linterna', precio: 80 },
      botiquin: { nombre: 'Botiquín', precio: 150 },
      esposas: { nombre: 'Esposas', precio: 120 },
      radio: { nombre: 'Radio portátil', precio: 250 },
      chaleco: { nombre: 'Chaleco antibalas', precio: 3000 },
      movil: { nombre: 'Teléfono móvil', precio: 400 }
    };
    const item = items[interaction.values[0]];
    if (!item) return;

    let data = db.prepare('SELECT * FROM economy WHERE user_id = ?').get(interaction.user.id);
    if (!data || data.cash < item.precio) {
      return interaction.reply({ content: 'No tienes suficiente efectivo.', ephemeral: true });
    }

    db.prepare('UPDATE economy SET cash = cash - ? WHERE user_id = ?').run(item.precio, interaction.user.id);
    const inv = db.prepare('SELECT * FROM inventario WHERE user_id = ? AND item = ?').get(interaction.user.id, interaction.values[0]);
    if (inv) {
      db.prepare('UPDATE inventario SET cantidad = cantidad + 1 WHERE user_id = ? AND item = ?').run(interaction.user.id, interaction.values[0]);
    } else {
      db.prepare('INSERT INTO inventario (user_id, item, cantidad) VALUES (?, ?, 1)').run(interaction.user.id, interaction.values[0]);
    }

    await interaction.reply({ content: `Has comprado **${item.nombre}** por **$${item.precio.toLocaleString()}**.`, ephemeral: true });
  }

  if (interaction.isButton()) {
    const ticketTypes = {
      'ticket_fundacion': { name: 'fundacion', category: '1513136850179588117', emoji: '👑' },
      'ticket_reporte': { name: 'reporte', category: '1513136663600173149', emoji: '🔎' },
      'ticket_problemas': { name: 'problemas', category: '1513136795188199454', emoji: '🛠️' },
      'ticket_alianzas': { name: 'alianzas', category: '1513136970543530095', emoji: '🤝' },
      'ticket_donaciones': { name: 'donaciones', category: '1513488592771612815', emoji: '💰' },
      'ticket_otro': { name: 'otro', category: '1513137017834180669', emoji: '🌐' }
    };

    if (ticketTypes[interaction.customId]) {
      const type = ticketTypes[interaction.customId];
      const existing = interaction.guild.channels.cache.find(c =>
        c.name.toLowerCase().includes(interaction.user.username.toLowerCase())
      );
      if (existing) return interaction.reply({ content: 'Ya tienes un ticket abierto.', ephemeral: true });

      const canal = await interaction.guild.channels.create({
        name: `${type.emoji}│${type.name}-${interaction.user.username}`,
        type: ChannelType.GuildText,
        parent: type.category,
        permissionOverwrites: [
          { id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
          { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles, PermissionFlagsBits.ReadMessageHistory] },
          { id: interaction.client.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels] }
        ]
      });

      const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle(`${type.emoji} Ticket · ${type.name}`)
        .setDescription(`Hola ${interaction.user}.\nUn miembro del staff te atenderá lo antes posible.`)
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('cerrar_ticket').setLabel('Cerrar ticket').setStyle(ButtonStyle.Danger)
      );

      await canal.send({ content: `${interaction.user}`, embeds: [embed], components: [row] });
      await interaction.reply({ content: `Ticket creado: ${canal}`, ephemeral: true });
    }

    if (interaction.customId === 'cerrar_ticket') {
      await interaction.reply('Cerrando el ticket en 5 segundos...');
      setTimeout(() => interaction.channel.delete().catch(() => {}), 5000);
    }

    if (interaction.customId === 'empezar_verificacion') {
      const modal = new ModalBuilder()
        .setCustomId('modal_verificacion_1')
        .setTitle('Verificación · Datos (1/2)');

      modal.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId('discord_user').setLabel('Usuario de Discord').setStyle(TextInputStyle.Short).setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId('roblox_user').setLabel('Usuario de Roblox').setStyle(TextInputStyle.Short).setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId('roblox_link').setLabel('Enlace del perfil de Roblox').setStyle(TextInputStyle.Short).setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId('edad_ooc').setLabel('Edad real (OOC)').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(3)
        )
      );

      await interaction.showModal(modal);
    }

    if (interaction.customId === 'continuar_verificacion_2') {
      if (!verificacionesPendientes.has(interaction.user.id)) {
        return interaction.reply({ content: 'La sesión ha caducado. Vuelve a empezar la verificación.', ephemeral: true });
      }

      const modal2 = new ModalBuilder()
        .setCustomId('modal_verificacion_2')
        .setTitle('Verificación · Conceptos RP (2/2)');

      modal2.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId('powergaming').setLabel('¿Qué es PowerGaming?').setStyle(TextInputStyle.Paragraph).setRequired(true).setMaxLength(400)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId('metagaming').setLabel('¿Qué es Metagaming?').setStyle(TextInputStyle.Paragraph).setRequired(true).setMaxLength(400)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId('ck').setLabel('¿Qué es CK (Character Kill)?').setStyle(TextInputStyle.Paragraph).setRequired(true).setMaxLength(400)
        )
      );

      await interaction.showModal(modal2);
    }

    if (interaction.customId.startsWith('aceptar_verif_')) {
      const userId = interaction.customId.split('_')[2];
      const member = await interaction.guild.members.fetch(userId).catch(() => null);
      if (!member) return interaction.reply({ content: 'No se encontró al usuario.', ephemeral: true });

      await member.roles.add([ROL_VERIFICADO, ROL_CIUDADANO, ROL_IMPUESTOS]).catch(() => {});

      const embed = EmbedBuilder.from(interaction.message.embeds[0])
        .setColor(0x2ECC71)
        .setTitle('Verificación aceptada')
        .setFooter({ text: `Aceptada por ${interaction.user.tag}` });

      await interaction.update({ embeds: [embed], components: [] });
      try { await member.send('Tu verificación en **Spanish Murcia RP** ha sido **aceptada**. Bienvenido.'); } catch {}
    }

    if (interaction.customId.startsWith('denegar_verif_')) {
      const userId = interaction.customId.split('_')[2];
      const member = await interaction.guild.members.fetch(userId).catch(() => null);

      const embed = EmbedBuilder.from(interaction.message.embeds[0])
        .setColor(0xE74C3C)
        .setTitle('Verificación denegada')
        .setFooter({ text: `Denegada por ${interaction.user.tag}` });

      await interaction.update({ embeds: [embed], components: [] });
      if (member) {
        try { await member.send('Tu verificación en **Spanish Murcia RP** ha sido **denegada**.'); } catch {}
      }
    }

    // Aceptar solicitud de rol
    if (interaction.customId.startsWith('aceptar_rol_')) {
      if (!interaction.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
        return interaction.reply({ content: 'No tienes permisos para gestionar roles.', ephemeral: true });
      }

      const partes = interaction.customId.split('_');
      const userId = partes[2];
      const roleId = partes[3];

      const member = await interaction.guild.members.fetch(userId).catch(() => null);
      const rol = interaction.guild.roles.cache.get(roleId);

      if (!member || !rol) {
        return interaction.reply({ content: 'No se encontró el usuario o el rol.', ephemeral: true });
      }

      try {
        await member.roles.add(rol);
      } catch {
        return interaction.reply({ content: 'No pude asignar el rol (jerarquía o permisos del bot).', ephemeral: true });
      }

      const embed = EmbedBuilder.from(interaction.message.embeds[0])
        .setColor(0x2ECC71)
        .setTitle('Solicitud de rol aceptada')
        .setFooter({ text: `Aceptada por ${interaction.user.tag}` });

      await interaction.update({ embeds: [embed], components: [] });

      try {
        await member.send(`Tu solicitud del rol **${rol.name}** en **Spanish Murcia RP** ha sido **aceptada**.`);
      } catch {}
    }

    // Rechazar solicitud de rol
    if (interaction.customId.startsWith('rechazar_rol_')) {
      if (!interaction.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
        return interaction.reply({ content: 'No tienes permisos para gestionar roles.', ephemeral: true });
      }

      const partes = interaction.customId.split('_');
      const userId = partes[2];
      const roleId = partes[3];

      const member = await interaction.guild.members.fetch(userId).catch(() => null);
      const rol = interaction.guild.roles.cache.get(roleId);

      const embed = EmbedBuilder.from(interaction.message.embeds[0])
        .setColor(0xE74C3C)
        .setTitle('Solicitud de rol rechazada')
        .setFooter({ text: `Rechazada por ${interaction.user.tag}` });

      await interaction.update({ embeds: [embed], components: [] });

      if (member) {
        try {
          await member.send(
            `Tu solicitud del rol **${rol ? rol.name : 'desconocido'}** en **Spanish Murcia RP** ha sido **rechazada**.`
          );
        } catch {}
      }
    }
  }

  if (interaction.isModalSubmit() && interaction.customId === 'modal_verificacion_1') {
    verificacionesPendientes.set(interaction.user.id, {
      discordUser: interaction.fields.getTextInputValue('discord_user'),
      robloxUser: interaction.fields.getTextInputValue('roblox_user'),
      robloxLink: interaction.fields.getTextInputValue('roblox_link'),
      edad: interaction.fields.getTextInputValue('edad_ooc')
    });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('continuar_verificacion_2')
        .setLabel('Continuar · Conceptos de rol (2/2)')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('➡️')
    );

    await interaction.reply({
      content: 'Datos guardados. Pulsa el botón para continuar con las preguntas de roleplay.',
      components: [row],
      ephemeral: true
    });
  }

  if (interaction.isModalSubmit() && interaction.customId === 'modal_verificacion_2') {
    const datos = verificacionesPendientes.get(interaction.user.id);
    if (!datos) {
      return interaction.reply({ content: 'La sesión ha caducado. Vuelve a empezar.', ephemeral: true });
    }

    const powergaming = interaction.fields.getTextInputValue('powergaming');
    const metagaming = interaction.fields.getTextInputValue('metagaming');
    const ck = interaction.fields.getTextInputValue('ck');
    verificacionesPendientes.delete(interaction.user.id);

    const embed = new EmbedBuilder()
      .setColor(0xF1C40F)
      .setTitle('Nueva solicitud de verificación')
      .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: 'Discord', value: `${interaction.user}\n\`${datos.discordUser}\``, inline: true },
        { name: 'Roblox', value: datos.robloxUser, inline: true },
        { name: 'Edad OOC', value: datos.edad, inline: true },
        { name: 'Perfil Roblox', value: `[Abrir perfil](${datos.robloxLink})` },
        { name: 'PowerGaming', value: powergaming },
        { name: 'Metagaming', value: metagaming },
        { name: 'CK', value: ck }
      )
      .setFooter({ text: `ID: ${interaction.user.id}` })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`aceptar_verif_${interaction.user.id}`).setLabel('Aceptar').setStyle(ButtonStyle.Success).setEmoji('✅'),
      new ButtonBuilder().setCustomId(`denegar_verif_${interaction.user.id}`).setLabel('Denegar').setStyle(ButtonStyle.Danger).setEmoji('❌')
    );

    const canalStaff = interaction.guild.channels.cache.get(CANAL_VERIFICACIONES);
    if (canalStaff) {
      await canalStaff.send({
        content: `<@&${ROL_STAFF_VERIFICACION}>`,
        embeds: [embed],
        components: [row]
      });
    }

    await interaction.reply({ content: 'Tu solicitud ha sido enviada al staff.', ephemeral: true });
  }
});

client.login(process.env.DISCORD_TOKEN); 