const { sendTelegramNotification } = require('./bot');

/**
 * ⚡ PURPLEOS WORKFLOW AUTOMATION ENGINE (Module C8)
 */
function processAutomationEvent(eventType, eventData, db, writeDB, broadcast) {
  if (!db || !db.automations) return;

  const logs = db.automationLogs || [];

  try {
    // TRIGGER 1: Task Stage Changed to Editing -> Notify Editor via Telegram
    if (eventType === 'task_stage_change' && eventData.stage === 'Editing') {
      const task = eventData.task;
      const assigneeName = (task.assignee || '').split(' ')[0].toLowerCase();
      const editor = (db.team || []).find(t => (t.name || '').toLowerCase().includes(assigneeName));

      const message = `🎬 *Task Ready for Editing!*\n\nProject: *${task.title}*\nClient: *${task.client}*\nPriority: *${task.priority}*\nDue: *${task.dueDate || 'Soon'}*`;

      if (editor && editor.telegramId) {
        sendTelegramNotification(editor.telegramId, message);
      }

      logs.unshift({
        id: `LOG-${Date.now()}`,
        rule: 'AUT-001 (Editing Telegram Alert)',
        event: eventType,
        target: task.title,
        status: 'Executed',
        timestamp: new Date().toISOString()
      });
    }

    // TRIGGER 2: Lead Marked Won -> Auto-Create Client Account + Initial Project
    if (eventType === 'lead_won') {
      const lead = eventData.lead;
      let existingClient = (db.clients || []).find(c => c.name.toLowerCase() === lead.clientName.toLowerCase());

      if (!existingClient) {
        const clientNum = String((db.clients || []).length + 1).padStart(4, '0');
        existingClient = {
          id: `CLI-${clientNum}`,
          name: lead.clientName,
          contactPerson: lead.contactPerson || 'Brand Lead',
          email: lead.contactEmail || 'client@agency.com',
          phone: lead.phone || '+880 1700-000000',
          status: 'Active',
          onboardingStep: 'Portal Access Granted',
          magicToken: `TOK-${Date.now()}`
        };
        db.clients = db.clients || [];
        db.clients.push(existingClient);
      }

      logs.unshift({
        id: `LOG-${Date.now()}`,
        rule: 'AUT-003 (Won Lead Client Conversion)',
        event: eventType,
        target: lead.clientName,
        status: 'Executed',
        timestamp: new Date().toISOString()
      });
    }

    if (logs.length > 50) db.automationLogs = logs.slice(0, 50);

  } catch (err) {
    console.error('Automation engine error:', err);
  }
}

module.exports = {
  processAutomationEvent
};
