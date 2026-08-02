const fs = require('fs');
const path = require('path');

const bundleDbPath = path.join(__dirname, '../../data/db.json');
const tmpDbPath = '/tmp/db.json';

function getDbPath() {
  if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
    if (!fs.existsSync(tmpDbPath)) {
      try {
        const bundleData = fs.readFileSync(bundleDbPath, 'utf8');
        fs.writeFileSync(tmpDbPath, bundleData, 'utf8');
      } catch (err) {
        console.error('Error seeding /tmp/db.json:', err.message);
        return bundleDbPath;
      }
    }
    return tmpDbPath;
  }
  return bundleDbPath;
}

function readDB() {
  try {
    const targetPath = getDbPath();
    const data = fs.readFileSync(targetPath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    try {
      const data = fs.readFileSync(bundleDbPath, 'utf8');
      return JSON.parse(data);
    } catch (e) {
      console.error('Error reading db.json:', e);
      return {};
    }
  }
}

function writeDB(data) {
  if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
    console.error('🚨 writeDB() blocked in production environment — all operations must use Supabase.');
    return false;
  }
  try {
    const targetPath = getDbPath();
    fs.writeFileSync(targetPath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    try {
      fs.writeFileSync('/tmp/db.json', JSON.stringify(data, null, 2), 'utf8');
      return true;
    } catch (e) {
      console.error('Error writing db.json:', e);
      return false;
    }
  }
}

module.exports = {
  readDB,
  writeDB
};
