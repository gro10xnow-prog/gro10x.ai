// Test models from the discovered list with v1beta
const https = require('https');
const fs = require('fs');

const envContent = fs.readFileSync('.env', 'utf8');
const match = envContent.match(/GEMINI_API_KEY=(.+)/);
const apiKey = match ? match[1].trim() : null;

// Models that showed in the available list and support generateContent
const candidateModels = [
  'gemini-flash-latest',
  'gemini-pro-latest',
  'gemini-flash-lite-latest',
  'gemini-2.5-flash-lite',
  'gemini-3.5-flash',
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
  'gemini-3.1-flash-lite-preview',
  'gemini-3-flash-preview',
  'gemini-3.1-pro-preview',
];

function testModel(model) {
  return new Promise((resolve) => {
    const payload = JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: 'Return: {"ok":true}' }] }],
      generationConfig: { maxOutputTokens: 20, temperature: 0 }
    });
    const req = https.request({
      hostname: 'generativelanguage.googleapis.com',
      path: `/v1beta/models/${model}:generateContent?key=${apiKey}`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
    }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try {
          const j = JSON.parse(d);
          if (j.error) resolve({ ok: false, code: res.statusCode, msg: j.error.message.slice(0, 80) });
          else if (j.candidates) resolve({ ok: true, code: res.statusCode });
          else resolve({ ok: false, code: res.statusCode, msg: 'no candidates' });
        } catch (e) { resolve({ ok: false, code: res.statusCode }); }
      });
    });
    req.on('error', e => resolve({ ok: false, msg: e.message }));
    req.setTimeout(10000, () => { req.destroy(); resolve({ ok: false, msg: 'timeout' }); });
    req.write(payload);
    req.end();
  });
}

(async () => {
  console.log('Testing available models with v1beta generateContent...\n');
  const working = [];
  for (const model of candidateModels) {
    const r = await testModel(model);
    const icon = r.ok ? '✅ WORKS' : (r.code === 429 ? '⚠️ QUOTA' : '❌ FAIL ');
    console.log(`  ${icon}  ${model} (${r.code})${r.msg ? ' → ' + r.msg.slice(0,60) : ''}`);
    if (r.ok) working.push(model);
    if (r.code === 429) working.push(`${model} [rate-limited]`);
  }
  console.log('\n=== FINAL WORKING MODELS ===');
  console.log(working.length > 0 ? working.join('\n') : 'NONE FOUND');
  console.log('\nUpdate ai-evaluator.js GEMINI_MODELS to use these ^');
})();
