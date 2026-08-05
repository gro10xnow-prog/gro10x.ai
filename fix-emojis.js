const fs = require('fs');
let content = fs.readFileSync('src/services/automation.js', 'utf8');

// The replacement mapping
const replacements = [
  { bad: /dY'/g, good: '📣' },
  { bad: /o\?/g, good: '👤' }, // Part of 👤
  { bad: /,\?/g, good: '' }, // Clean up the rest of the 👤 bytes
  { bad: /o\./g, good: '✅' },
  { bad: /\?O/g, good: '❌' },
  { bad: /\?/g, good: '📌' },
  { bad: /\?3/g, good: '⏳' },
  { bad: /dYs"/g, good: '🚨' },
  { bad: /s,\?/g, good: '⚠️' },
  { bad: /s/g, good: '⚠️' },
  { bad: /~,\?/g, good: '🌅' },
  { bad: /~/g, good: '🌅' },
  { bad: /dY``/g, good: '🔔' },
  { bad: /"\?"\?"\?/g, good: '───' },
  { bad: / \? \?/g, good: '─' },
  { bad: /\?"/g, good: '—' },
  { bad: /o\?,\?/g, good: '👤' },
  { bad: /~\?,\?/g, good: '🌅' }
];

replacements.forEach(({ bad, good }) => {
  content = content.replace(bad, good);
});

// Since regex on corrupted bytes can be weird, let's also just explicitly fix the strings if needed, 
// but this global replace should catch 90% of them.

fs.writeFileSync('src/services/automation.js', content, 'utf8');
console.log('Fixed additional emojis');
