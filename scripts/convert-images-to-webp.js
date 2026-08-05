const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const dirs = [
  path.join(__dirname, '../public/images'),
  path.join(__dirname, '../public/images/portfolio'),
  path.join(__dirname, '../public/images/clients')
];

async function convertImages() {
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) continue;
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const ext = path.extname(file).toLowerCase();
      if (['.png', '.jpg', '.jpeg'].includes(ext)) {
        const filePath = path.join(dir, file);
        const webpPath = path.join(dir, `${path.basename(file, ext)}.webp`);
        try {
          await sharp(filePath)
            .webp({ quality: 80 })
            .toFile(webpPath);
          const oldSize = fs.statSync(filePath).size;
          const newSize = fs.statSync(webpPath).size;
          console.log(`Converted ${file} -> ${path.basename(webpPath)} (${(oldSize / 1024).toFixed(1)}KB -> ${(newSize / 1024).toFixed(1)}KB)`);
        } catch (err) {
          console.error(`Failed to convert ${file}:`, err.message);
        }
      }
    }
  }
}

convertImages();
