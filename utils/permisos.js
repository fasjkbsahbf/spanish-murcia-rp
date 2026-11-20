const db = require('../database.js');

function tienePermiso(member, permiso) {
  if (member.permissions.has('Administrator')) return true;

  try {
    const row = db.prepare('SELECT valor FROM config WHERE clave = ?').get(permiso);
    if (!row) return false;
    return member.roles.cache.has(row.valor);
  } catch {
    return false;
  }
}

module.exports = { tienePermiso };