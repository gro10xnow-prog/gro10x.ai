const fs = require('fs');

let html = fs.readFileSync('public/pitch/nhf/index.html', 'utf8');

// 1. Google Fonts Hind Siliguri
const oldFont = 'family=Plus+Jakarta+Sans';
const newFont = 'family=Hind+Siliguri:wght@400;500;600;700&family=Plus+Jakarta+Sans';
if (!html.includes(oldFont)) {
  console.error('Could not find Google Fonts link');
  process.exit(1);
}
html = html.replace(oldFont, newFont);

// 2. CSS font family and letter spacing
const styleTarget = '.heading-font { font-family: \'Space Grotesk\', sans-serif; }';
const styleRepl = `.heading-font { font-family: 'Space Grotesk', sans-serif; }
    .bangla-caption {
      font-family: 'Hind Siliguri', sans-serif !important;
      letter-spacing: normal !important;
    }`;
if (!html.includes(styleTarget)) {
  console.error('Could not find styleTarget');
  process.exit(1);
}
html = html.replace(styleTarget, styleRepl);

// 3. Caption element classes
const oldCap = '<p id="captionText" class="text-sm sm:text-base md:text-lg font-medium text-white leading-relaxed tracking-wide">';
const newCap = '<p id="captionText" class="bangla-caption text-sm sm:text-base md:text-lg font-medium text-white leading-relaxed">';
if (!html.includes(oldCap)) {
  console.error('Could not find oldCap');
  process.exit(1);
}
html = html.replace(oldCap, newCap);

fs.writeFileSync('public/pitch/nhf/index.html', html, 'utf8');
console.log('Bangla font and letter-spacing fix applied cleanly!');
