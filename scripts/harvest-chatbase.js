import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const TARGET_DIR = path.join(ROOT_DIR, 'docs', 'engine1_reference', 'chatbase');

// Ensure target directories exist
const categories = [
  'specs',
  'quick-start',
  'chatbot-core',
  'data-sources',
  'actions-procedures',
  'channels-integrations',
  'helpdesk-support',
  'developer-sdk',
  'api-v2',
  'workspace-settings',
  'other'
];

for (const cat of categories) {
  const dir = path.join(TARGET_DIR, cat);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Map a doc URL to one of our categorized folders
function getCategoryForUrl(url) {
  if (url.includes('/quick-start/')) return 'quick-start';
  if (url.includes('/data-sources')) return 'data-sources';
  if (url.includes('/actions/') || url.includes('/procedures/')) return 'actions-procedures';
  if (url.includes('/help-desk/')) return 'helpdesk-support';
  if (url.includes('/integrations/')) return 'channels-integrations';
  if (url.includes('/developer-guides/') || url.includes('/cli/') || url.includes('-sdk/')) return 'developer-sdk';
  if (url.includes('/api-v2/') || url.includes('/api-reference/')) return 'api-v2';
  if (url.includes('/workspace/')) return 'workspace-settings';
  if (url.includes('/chatbot/')) return 'chatbot-core';
  return 'other';
}

async function fetchWithRetry(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      return await res.text();
    } catch (err) {
      if (i === retries - 1) throw err;
      await new Promise(r => setTimeout(r, 500 * (i + 1)));
    }
  }
}

async function run() {
  console.log('🚀 [Sub-Phase 1.1] Harvesting OpenAPI specifications...');
  
  // 1. Fetch OpenAPI schemas
  const specFiles = [
    { url: 'https://chatbase.co/docs/api-v2-openapi.json', filename: 'api-v2-openapi.json' },
    { url: 'https://chatbase.co/docs/openapi.yaml', filename: 'openapi.yaml' }
  ];

  for (const spec of specFiles) {
    try {
      console.log(`Downloading spec: ${spec.url}`);
      const text = await fetchWithRetry(spec.url);
      fs.writeFileSync(path.join(TARGET_DIR, 'specs', spec.filename), text, 'utf8');
      console.log(`✅ Saved specs/${spec.filename} (${Math.round(text.length / 1024)} KB)`);
    } catch (err) {
      console.error(`⚠️ Failed to download spec ${spec.filename}: ${err.message}`);
    }
  }

  // 2. Parse llms.txt to get the list of docs
  console.log('\n📚 [Sub-Phase 1.2] Parsing doc list from llms.txt...');
  const llmsPath = 'C:\\Users\\Hp\\.gemini\\antigravity\\brain\\01068434-323e-444d-bd9c-bd96a352a94b\\.system_generated\\steps\\40\\content.md';
  const llmsContent = fs.readFileSync(llmsPath, 'utf8');
  
  const linkRegex = /- \[(.*?)\]\((https:\/\/chatbase\.co\/docs\/.*?\.md)\)(?:: (.*))?/g;
  let match;
  const docs = [];

  while ((match = linkRegex.exec(llmsContent)) !== null) {
    docs.push({
      title: match[1].trim(),
      url: match[2].trim(),
      description: match[3] ? match[3].trim() : ''
    });
  }

  console.log(`Found ${docs.length} documentation guides to harvest.`);

  const catalog = [];
  let downloadedCount = 0;
  let failedCount = 0;

  for (let i = 0; i < docs.length; i++) {
    const doc = docs[i];
    const category = getCategoryForUrl(doc.url);
    const parsedUrl = new URL(doc.url);
    const baseName = path.basename(parsedUrl.pathname);
    const destPath = path.join(TARGET_DIR, category, baseName);

    process.stdout.write(`[${i + 1}/${docs.length}] Fetching ${baseName}... `);

    try {
      const content = await fetchWithRetry(doc.url);
      fs.writeFileSync(destPath, content, 'utf8');
      downloadedCount++;
      catalog.push({
        title: doc.title,
        category,
        file: `chatbase/${category}/${baseName}`,
        url: doc.url,
        description: doc.description,
        sizeKb: Math.round(content.length / 1024)
      });
      console.log(`OK (${Math.round(content.length / 1024)} KB)`);
    } catch (err) {
      failedCount++;
      console.log(`FAILED: ${err.message}`);
    }

    // Polite delay
    await new Promise(r => setTimeout(r, 60));
  }

  console.log(`\n🎉 Ingestion complete: ${downloadedCount} downloaded, ${failedCount} failed.`);

  // 3. Write SUMMARY_CATALOG.md
  console.log('\n📑 Generating SUMMARY_CATALOG.md...');
  let catalogMd = `# 📖 Chatbase Harvested Documentation Catalog\n\n`;
  catalogMd += `> **Harvest Date**: ${new Date().toISOString()}\n`;
  catalogMd += `> **Total Guides Harvested**: ${downloadedCount}\n`;
  catalogMd += `> **Specs Available**: \`specs/api-v2-openapi.json\`, \`specs/openapi.yaml\`\n\n`;

  const grouped = {};
  for (const item of catalog) {
    if (!grouped[item.category]) grouped[item.category] = [];
    grouped[item.category].push(item);
  }

  for (const [cat, items] of Object.entries(grouped)) {
    catalogMd += `## Category: \`${cat}\` (${items.length} docs)\n\n`;
    catalogMd += `| Document Title | Local File | Size | Description |\n`;
    catalogMd += `| :--- | :--- | :---: | :--- |\n`;
    for (const it of items) {
      catalogMd += `| **${it.title}** | [\`${path.basename(it.file)}\`](./${it.file}) | ${it.sizeKb} KB | ${it.description || 'N/A'} |\n`;
    }
    catalogMd += `\n`;
  }

  const catalogFilePath = path.join(ROOT_DIR, 'docs', 'engine1_reference', 'SUMMARY_CATALOG.md');
  fs.writeFileSync(catalogFilePath, catalogMd, 'utf8');
  console.log(`✅ Saved ${catalogFilePath}`);
}

run().catch(console.error);
