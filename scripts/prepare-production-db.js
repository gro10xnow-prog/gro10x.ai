const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'db.json');
const backupPath = path.join(__dirname, '..', 'data', 'db.backup.json');

console.log('🔄 Preparing Production Database Clean State...');

try {
  if (fs.existsSync(dbPath)) {
    const rawData = fs.readFileSync(dbPath, 'utf8');
    fs.writeFileSync(backupPath, rawData);
    console.log('💾 Backup created successfully at:', backupPath);

    const db = JSON.parse(rawData);

    // Retain system configurations, service catalog, team directory & bot settings
    const productionDb = {
      services: db.services || [],
      team: db.team || [],
      botConfig: db.botConfig || {
        clientBot: {
          name: 'Purplebot Client Assistant',
          tone: 'Empathetic & Creative',
          persona: 'Official Agency Client Success Assistant',
          greeting: 'Welcome to Purplebot Digital Agency! How can we assist your brand today?',
          fallback: 'Thank you! Our account team has been notified and will reach out shortly.'
        },
        teamBot: {
          name: 'Purplebot Crew Ops Bot',
          tone: 'Direct & Professional',
          persona: 'Internal Operations & Shoot Logistics Bot',
          greeting: 'PurpleOS Crew Ops online. Type /clockin or /mybookings to begin.',
          fallback: 'Command recognized. Operations dashboard updated.'
        },
        knowledgeBase: db.botConfig?.knowledgeBase || [],
        videoTutorials: db.botConfig?.videoTutorials || []
      },
      // Empty operational collections for clean production start
      clients: [],
      tasks: [],
      reviews: [],
      invoices: [],
      expenses: [],
      assets: [],
      attendance: (db.team || []).map(t => ({
        employeeId: t.id,
        name: t.name,
        status: 'Clocked Out',
        clockInTime: '-',
        location: 'Office'
      })),
      leads: [],
      quotes: [],
      posts: [],
      chats: [],
      webhookLogs: [],
      attendanceLog: [],
      checkoutLog: []
    };

    fs.writeFileSync(dbPath, JSON.stringify(productionDb, null, 2));
    console.log('✨ Production database initialized! All dummy test records cleared.');
    console.log('📋 Retained Core Services, Team Codes, and Bot Configuration.');
  } else {
    console.error('❌ Error: data/db.json not found.');
  }
} catch (err) {
  console.error('❌ Error preparing production database:', err.message);
}
