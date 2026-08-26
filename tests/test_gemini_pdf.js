const https = require('https');
const fs = require('fs');

const envContent = fs.readFileSync('.env', 'utf8');
const match = envContent.match(/GEMINI_API_KEY=(.+)/);
const apiKey = match ? match[1].trim() : null;

console.log('Testing PDF audit with gemini-3.5-flash...');

// Let's create a small test or check if we can call Gemini with application/pdf
const samplePdfHeader = Buffer.from('%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>\nendobj\n4 0 obj\n<< /Length 44 >>\nstream\nBT /F1 12 Tf 100 700 Td (Planner Queen Co) Tj ET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000010 00000 n \n0000000060 00000 n \n0000000117 00000 n \n0000000201 00000 n \ntrailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n294\n%%EOF');

const payload = JSON.stringify({
  contents: [{
    role: 'user',
    parts: [
      {
        inlineData: {
          mimeType: 'application/pdf',
          data: samplePdfHeader.toString('base64')
        }
      },
      {
        text: 'Analyze this PDF page and return JSON with {"pdfRead": true, "pageCount": 1}'
      }
    ]
  }],
  generationConfig: {
    maxOutputTokens: 200,
    responseMimeType: 'application/json'
  }
});

const req = https.request({
  hostname: 'generativelanguage.googleapis.com',
  path: `/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload)
  }
}, (res) => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', d);
  });
});
req.on('error', e => console.log('Error:', e.message));
req.write(payload);
req.end();
