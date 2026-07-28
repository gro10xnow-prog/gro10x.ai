const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../../data/db.json');

function readDB() {
  try {
    const data = fs.readFileSync(dbPath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading db.json:', err);
    return {};
  }
}

function writeDB(data) {
  if (process.env.FORCE_SUPABASE === 'true') {
    // In production with Supabase enabled, bypass ephemeral db.json writes
    return true;
  }
  try {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error writing db.json:', err);
    return false;
  }
}

module.exports = {
  readDB,
  writeDB
};
