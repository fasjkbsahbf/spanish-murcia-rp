const Database = require('better-sqlite3');
const db = new Database('economy.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS economy (
    user_id TEXT PRIMARY KEY,
    cash INTEGER DEFAULT 0,
    bank INTEGER DEFAULT 0,
    last_daily INTEGER DEFAULT 0,
    last_work INTEGER DEFAULT 0,
    banco TEXT DEFAULT NULL,
    interes REAL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS dni (
    user_id TEXT PRIMARY KEY,
    nombre TEXT,
    apellido TEXT,
    edad INTEGER,
    nacionalidad TEXT,
    sexo TEXT,
    fecha TEXT
  );

  CREATE TABLE IF NOT EXISTS licencias (
    user_id TEXT PRIMARY KEY,
    conducir INTEGER DEFAULT 0,
    armas INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS inventario (
    user_id TEXT,
    item TEXT,
    cantidad INTEGER DEFAULT 1,
    PRIMARY KEY (user_id, item)
  );

  CREATE TABLE IF NOT EXISTS naa (
    id INTEGER PRIMARY KEY,
    mensaje TEXT
  );

  CREATE TABLE IF NOT EXISTS config (
    clave TEXT PRIMARY KEY,
    valor TEXT
  );

  CREATE TABLE IF NOT EXISTS sanciones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    tipo TEXT NOT NULL,
    cantidad INTEGER DEFAULT 0,
    razon TEXT,
    staff_id TEXT,
    staff_tag TEXT,
    fecha TEXT
  );

  CREATE TABLE IF NOT EXISTS gulag (
    user_id TEXT PRIMARY KEY,
    fin INTEGER NOT NULL,
    guild_id TEXT NOT NULL
  );
`);

const naa = db.prepare('SELECT * FROM naa WHERE id = 1').get();
if (!naa) {
  db.prepare("INSERT INTO naa (id, mensaje) VALUES (1, 'No hay alertas activas.')").run();
}

module.exports = db;