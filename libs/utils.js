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

async function backgroundErrorLogger(message) {
  await con2.execute("INSERT INTO errors (message) VALUES (?)", [message]);
  await con2.execute("INSERT INTO temp_errors (message) VALUES (?)", [message]);
}

module.exports = {
  generateRandomString,
  backgroundErrorLogger,
  default: {
    generateRandomString,
    backgroundErrorLogger
  }
};