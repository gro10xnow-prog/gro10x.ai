const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');

async function run() {
    const data = fs.readFileSync('D:/gro10x.ai/Section 2.pdf');
    const parser = new PDFParse({ data });
    await parser.load();
    const result = await parser.getImage();
    console.log('Result pages count:', result.pages ? result.pages.length : null);
    const outDir = 'D:/gro10x.ai/public/section2_extracted';
    if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true });
    }
    if (result.pages) {
        result.pages.forEach((p, idx) => {
            console.log('Page ' + (idx + 1) + ': ' + (p.images ? p.images.length : 0) + ' images');
            if (p.images && p.images[0]) {
                const img = p.images[0];
                console.log('  keys:', Object.keys(img), 'w:', img.width, 'h:', img.height, 'format:', img.imageFormat);
                if (img.data) {
                    const ext = img.imageFormat || 'png';
                    const outPath = path.join(outDir, 'slide_' + (idx + 1) + '.' + ext);
                    fs.writeFileSync(outPath, img.data);
                    console.log('  Saved:', outPath, 'bytes:', img.data.length);
                }
            }
        });
    }
    await parser.destroy();
}
run().catch(console.error);
