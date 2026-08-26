const https = require('https');
const { execSync } = require('child_process');

// Read API key from .env
const envContent = require('fs').readFileSync('.env', 'utf8');
const match = envContent.match(/GEMINI_API_KEY=(.+)/);
const apiKey = match ? match[1].trim() : null;

console.log('[Test] GEMINI_API_KEY present:', !!apiKey, apiKey ? `(starts: ${apiKey.slice(0,10)}...)` : '');

if (!apiKey) {
  console.log('RESULT: NO KEY - all audits will use seeded fallback');
  process.exit(0);
}

const payload = JSON.stringify({
  contents: [{ role: 'user', parts: [{ text: 'Respond only with valid JSON: {"ok": true, "alive": true}' }] }],
  generationConfig: { maxOutputTokens: 50, temperature: 0, responseMimeType: 'application/json' }
});

const req = https.request({
  hostname: 'generativelanguage.googleapis.com',
  path: `/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
}, (res) => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    console.log('[Test] HTTP Status:', res.statusCode);
    try {
      const j = JSON.parse(d);
      if (j.error) {
        console.log('RESULT: KEY INVALID -', j.error.code, j.error.message);
        console.log('=> All AI audits are falling back to seeded template data');
      } else if (j.candidates && j.candidates[0]) {
        console.log('RESULT: KEY VALID - Gemini API working!');
        console.log('=> AI Vision audit should work if mockup images are accessible');
        console.log('Response:', j.candidates[0].content.parts[0].text);
      } else {
        console.log('RESULT: UNEXPECTED response:', JSON.stringify(j).slice(0, 300));
      }
    } catch (e) {
      console.log('RESULT: PARSE ERROR:', d.slice(0, 200));
    }
  });
});
req.on('error', e => console.log('RESULT: NETWORK ERROR -', e.message));
req.setTimeout(15000, () => { req.destroy(); console.log('RESULT: TIMEOUT'); });
req.write(payload);
req.end();
