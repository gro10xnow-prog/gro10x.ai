#!/usr/bin/env node
/**
 * register-webhook.js
 * 
 * One-shot script to permanently register both Telegram bots to the Vercel webhook URL.
 * Run this ANYTIME the bot stops responding:
 * 
 *   node register-webhook.js
 * 
 * This is safe to run as many times as needed. It never deletes or resets the bot.
 */

require('dotenv').config();
const https = require('https');

const BASE_URL = process.env.BASE_URL || 'https://gro10x-ai.vercel.app';
const TEAM_BOT_TOKEN = process.env.TEAM_BOT_TOKEN;
const CLIENT_BOT_TOKEN = process.env.CLIENT_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
const DIGIVAULT_BOT_TOKEN = process.env.DIGIVAULT_BOT_TOKEN || process.env.DIGISTORE_BOT_TOKEN;

function setWebhook(token, botName, url) {
  return new Promise((resolve, reject) => {
    const apiUrl = `https://api.telegram.org/bot${token}/setWebhook`;
    const payload = JSON.stringify({ url, allowed_updates: ['message', 'callback_query', 'inline_query'] });
    const options = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
    };

    const req = https.request(apiUrl, options, (res) => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result.ok) {
            console.log(`✅ ${botName}: Webhook set → ${url}`);
            resolve(result);
          } else {
            console.error(`❌ ${botName}: Failed →`, result);
            reject(result);
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

function getWebhookInfo(token, botName) {
  return new Promise((resolve) => {
    https.get(`https://api.telegram.org/bot${token}/getWebhookInfo`, (res) => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          const info = result.result || {};
          console.log(`🔍 ${botName} Current Webhook:`);
          console.log(`   URL: ${info.url || '(empty — bot is deaf!)'}`);
          console.log(`   Pending updates: ${info.pending_update_count || 0}`);
          if (info.last_error_message) {
            console.log(`   ⚠️ Last error: ${info.last_error_message}`);
          }
          resolve(info);
        } catch (e) {
          resolve({});
        }
      });
    }).on('error', (e) => { console.error(`Error checking ${botName}:`, e.message); resolve({}); });
  });
}

async function main() {
  console.log('\n🤖 GRO10X Multi-Stakeholder Telegram Webhook Registration Tool');
  console.log('━'.repeat(60));
  console.log(`Target Base URL: ${BASE_URL}\n`);

  if (!TEAM_BOT_TOKEN) {
    console.error('❌ ERROR: TEAM_BOT_TOKEN not found in .env file!');
    process.exit(1);
  }

  // Step 1: Show current status
  console.log('📡 Step 1: Querying Live Webhook Status...');
  await getWebhookInfo(TEAM_BOT_TOKEN, '1. Admin & Team Bot (@Gro10xBot / @Aigeneral01bot)');
  
  if (CLIENT_BOT_TOKEN && CLIENT_BOT_TOKEN !== TEAM_BOT_TOKEN) {
    await getWebhookInfo(CLIENT_BOT_TOKEN, '2. B2B Client Bot (@gro10xb2bot)');
  }
  
  if (DIGIVAULT_BOT_TOKEN) {
    await getWebhookInfo(DIGIVAULT_BOT_TOKEN, '3. DigiVault Customer Commerce Bot (@Digivault20bot)');
  }
  
  console.log('\n🔧 Step 2: Registering Webhook Endpoints...');
  
  // Step 2: Set webhooks
  const teamUrl = `${BASE_URL}/api/webhooks/telegram?bot=team`;
  const clientUrl = `${BASE_URL}/api/webhooks/telegram?bot=client`;
  const digiVaultUrl = `${BASE_URL}/api/digivault-webhook`;

  await setWebhook(TEAM_BOT_TOKEN, '1. Admin & Team Bot', teamUrl);
  
  if (CLIENT_BOT_TOKEN && CLIENT_BOT_TOKEN !== TEAM_BOT_TOKEN) {
    await setWebhook(CLIENT_BOT_TOKEN, '2. B2B Client Bot', clientUrl);
  }

  if (DIGIVAULT_BOT_TOKEN) {
    await setWebhook(DIGIVAULT_BOT_TOKEN, '3. DigiVault Customer Commerce Bot', digiVaultUrl);
  }

  // Step 3: Verify
  console.log('\n✔️  Step 3: Verifying Configuration...');
  await getWebhookInfo(TEAM_BOT_TOKEN, '1. Admin & Team Bot');
  if (DIGIVAULT_BOT_TOKEN) {
    await getWebhookInfo(DIGIVAULT_BOT_TOKEN, '3. DigiVault Customer Commerce Bot');
  }

  console.log('\n━'.repeat(60));
  console.log('🎉 Done! All registered Telegram bots will respond in real time.');
  console.log('   If a bot does not reply, inspect live Vercel function logs:\n');
  console.log('   npx vercel logs gro10x-ai.vercel.app --limit 20\n');
}

main().catch(console.error);
