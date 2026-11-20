require('dotenv').config();
const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  try {
    const command = require(`./commands/${file}`);
    
    if (!command.data || !command.execute) {
      console.log(`❌ El archivo ${file} no tiene "data" o "execute"`);
      continue;
    }

    commands.push(command.data.toJSON());
    console.log(`✅ Cargado: ${file}`);
  } catch (error) {
    console.log(`❌ Error en el archivo ${file}:`);
    console.log(error.message);
  }
}

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log(`\nRegistrando ${commands.length} comandos...`);

    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: commands }
    );

    console.log('✅ Comandos registrados correctamente.');
  } catch (error) {
    console.error(error);
  }
})();