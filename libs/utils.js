var {getMySQLConnections} = require('./database');
var {con2} = getMySQLConnections();

function generateRandomString(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    result += chars[randomIndex];
  }
  return result;
}

async function backgroundLogger(message, type) {
  await con2.execute("INSERT INTO logs (message, type) VALUES (?, ?)", [message, type]);
  await con2.execute("INSERT INTO temp_logs (message, type) VALUES (?, ?)", [message, type]);
}

module.exports = {
  generateRandomString,
  backgroundLogger,
  default: {
    generateRandomString,
    backgroundLogger
  }
};