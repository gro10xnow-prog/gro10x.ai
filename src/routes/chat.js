const express = require('express');
const router = express.Router();
const { broadcast } = require('../services/sse');

router.post('/send', (req, res) => {
  const { command, mode } = req.body;
  
  // Acknowledge receipt immediately
  res.json({ ok: true, status: 'processing' });
  
  // Simulate backend processing and respond via SSE
  setTimeout(() => {
    let reply = `Thanks for reaching out! We received your message: "${command}". Our human agents will get back to you shortly.`;
    
    const lowerCmd = (command || '').toLowerCase();
    
    if (mode === 'team') {
      if (lowerCmd.includes('/clockin') || lowerCmd.includes('clock in')) {
        reply = "🟢 You have successfully clocked in at Gulshan Production Studio. Have a great shoot!";
      } else if (lowerCmd.includes('/myearnings') || lowerCmd.includes('earnings')) {
        reply = "💰 Your current month pending earnings: BDT 45,000. Next payout on 10th of next month.";
      } else if (lowerCmd.includes('/clockout') || lowerCmd.includes('clock out')) {
        reply = "🚪 You have clocked out. See you tomorrow!";
      }
    } else {
      if (lowerCmd.includes('rate') || lowerCmd.includes('package') || lowerCmd.includes('price')) {
        reply = "💰 **Our Service Rates:**\n\n- Digital Marketing Retainer: BDT 75,000 / month\n- Short-Form Video (10 Reels): BDT 45,000\n- Web Development: Starting from BDT 150,000";
      } else if (lowerCmd.includes('portfolio') || lowerCmd.includes('reel')) {
        reply = "📁 **Portfolio Reels:**\n\nCheck out our recent work for Chillox, UCB, and LG here: [Our Work](#portfolio)";
      } else if (lowerCmd.includes('invoice') || lowerCmd.includes('billing')) {
        reply = "💳 **Invoice Billing:**\n\nYou can access your invoices and make payments directly in the Client Portal. Open the 'My Invoices' miniapp!";
      }
    }
    
    // Broadcast the bot's response to the active web chat clients via SSE
    broadcast('chat_message', {
      mode: mode,
      sender: 'bot',
      text: reply
    });
  }, 1000); // Artificial delay to simulate processing/typing
});

module.exports = router;
