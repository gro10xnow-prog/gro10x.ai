const fs = require('fs');

const botJsPath = './src/services/bot.js';
const legacyPath = './src/services/bot/handlers/legacy_menus.js';

let botJs = fs.readFileSync(botJsPath, 'utf8');

const lines = botJs.split('\n');

const startIdx = lines.findIndex(l => l.includes('// MEHEDI CLIENT & GROWTH COMMANDS')) - 2;
const endIdx = lines.findIndex(l => l.includes('// 2. Initialize Client Bot (Purple Bot)')) - 5;

if (startIdx < 0 || endIdx < 0 || startIdx >= endIdx) {
  console.log('Could not find indices', startIdx, endIdx);
  process.exit(1);
}

const extractedLines = lines.slice(startIdx, endIdx);

const legacyContent = `const state = require('../../state');

function registerLegacyTeamMenus(teamBot, readDB) {
${extractedLines.join('\n')}
}

module.exports = { registerLegacyTeamMenus };
`;

fs.writeFileSync(legacyPath, legacyContent);

const newBotJs = [
  ...lines.slice(0, startIdx),
  `      // Refactored monolithic handlers`,
  `      require('./bot/handlers/legacy_menus').registerLegacyTeamMenus(teamBot, readDB);`,
  ...lines.slice(endIdx)
].join('\n');

fs.writeFileSync(botJsPath, newBotJs);

console.log('Successfully refactored bot.js');
