/**
 * scripts/test-traffic-bot.js
 * Quick utility to detect your Telegram Chat ID and send a test traffic alert.
 */

const botToken = '8792754820:AAEJOQQkh9I0eKcSjkS5kZtSTejn3p75pKE';

async function main() {
  console.log('Polling Telegram for recent messages to @jonosarthebangladeshbot...');
  const res = await fetch(`https://api.telegram.org/bot${botToken}/getUpdates`);
  const data = await res.json();

  if (!data.ok || !data.result || data.result.length === 0) {
    console.log('No recent messages found.');
    console.log('👉 Please open Telegram on your phone or PC:');
    console.log('   1. Search for: @jonosarthebangladeshbot');
    console.log('   2. Tap "START" or send "hello".');
    console.log('   3. Run this script again to verify and send a test traffic alert!');
    return;
  }

  // Extract latest chat
  const latestUpdate = data.result[data.result.length - 1];
  const chat = latestUpdate.message?.chat || latestUpdate.channel_post?.chat;

  if (!chat) {
    console.log('Could not find chat in update:', latestUpdate);
    return;
  }

  const chatId = chat.id;
  const name = chat.first_name || chat.title || 'User';
  console.log(`\n🎉 Found Chat! ID: ${chatId} (${name})`);

  // Send a test traffic alert
  const testMessage = `🚨 <b>TRAFFIC ALERT</b> | 🔴 <b>HIGH SEVERITY</b>

📍 <b>Location:</b> Mohakhali Flyover (Towards Banani)
⚠️ <b>Type:</b> 💥 Accident / Gridlock
💡 <b>Summary:</b> Severe gridlock due to broken down bus blocking middle lane.

📝 <b>Report:</b> <i>"Mohakhali flyover ekdom jam. Bus noshto hoye ase. Bypass use korun."</i>
👤 <b>Source:</b> Traffic Alert Bangladesh
👥 <b>Group:</b> <a href="https://www.facebook.com/groups/608459192604436">FB Traffic Group (608459192604436)</a>

<i>✅ GRO10X Traffic Sentinel is active and connected!</i>`;

  console.log(`Sending test alert to chat ${chatId}...`);
  const sendRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: testMessage,
      parse_mode: 'HTML',
      disable_web_page_preview: false
    })
  });

  const sendData = await sendRes.json();
  if (sendData.ok) {
    console.log('✅ Test alert delivered successfully to your Telegram!');
  } else {
    console.error('❌ Failed to send message:', sendData);
  }
}

main().catch(console.error);
