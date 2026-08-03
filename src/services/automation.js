// Lazy require to break the circular dependency:
// bot.js â†’ automation.js â†’ bot.js (sendTelegramNotification)
// By deferring the require to call-time, both modules finish initialising first.
function getSendTelegram() {
  return require('./bot').sendTelegramNotification;
}

function recordAutomationLog(db, logEntry) {
  db.automationLogs = db.automationLogs || [];
  db.automationLogs.unshift(logEntry);

  try {
    const { supabase, isSupabaseConfigured } = require('./supabase');
    if (isSupabaseConfigured()) {
      supabase.from('automation_logs').insert([{
        id: logEntry.id,
        rule: logEntry.rule,
        event: logEntry.event,
        target: logEntry.target,
        status: logEntry.status
      }]).then(() => {}).catch(() => {});
    }
  } catch (e) {}
}

/**
 * âš¡ PURPLEOS WORKFLOW AUTOMATION ENGINE (Module C8)
 */
function processAutomationEvent(eventType, eventData, db, writeDB, broadcast) {
  const sendTelegramNotification = getSendTelegram();
  if (!db) return;

  try {
    // TRIGGER 1: Task Stage Changed to Editing -> Notify Editor via Telegram
    if (eventType === 'task_stage_change' && eventData.stage === 'Editing') {
      const task = eventData.task;
      const assigneeName = (task.assignee || '').split(' ')[0].toLowerCase();
      const editor = (db.team || []).find(t => (t.name || '').toLowerCase().includes(assigneeName));

      const message = `ðŸŽ¬ *Task Ready for Editing!*\n\nProject: *${task.title}*\nClient: *${task.client}*\nPriority: *${task.priority}*\nDue: *${task.dueDate || 'Soon'}*`;

      if (editor && editor.telegramId) {
        sendTelegramNotification(editor.telegramId, message, null, true);
      }

      recordAutomationLog(db, {
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
      let existingClient = (db.clients || []).find(c => c.name.toLowerCase() === (lead.clientName || lead.company || '').toLowerCase());

      if (!existingClient) {
        const clientNum = String((db.clients || []).length + 1).padStart(4, '0');
        existingClient = {
          id: `CLI-${clientNum}`,
          name: lead.clientName || lead.company || 'New Client',
          contactPerson: lead.contactPerson || 'Brand Lead',
          email: lead.contactEmail || lead.email || '',
          phone: lead.phone || '+880 1700-000000',
          status: 'Active Retainer',
          category: lead.category || 'General',
          totalSpent: '$0',
          activeCampaigns: [lead.service || 'New Campaign']
        };
        db.clients = db.clients || [];
        db.clients.push(existingClient);
      }

      recordAutomationLog(db, {
        id: `LOG-${Date.now()}`,
        rule: 'AUT-003 (Won Lead Client Conversion)',
        event: eventType,
        target: lead.clientName || lead.company,
        status: 'Executed',
        timestamp: new Date().toISOString()
      });
    }

    // TRIGGER 3: Task Stage Changed to "Client Review" -> Direct notification to Client Rep
    if (eventType === 'task_stage_change' && eventData.stage === 'Client Review') {
      const task = eventData.task;
      const clientObj = (db.clients || []).find(c => (c.name || '').toLowerCase().includes((task.client || '').toLowerCase()));

      if (clientObj && clientObj.telegramId) {
        const reviewUrl = `https://purpleos-iota.vercel.app/partners?client=${encodeURIComponent(clientObj.name)}`;
        const msgText = `ðŸŽ¬ *Deliverable Ready for Review!*\n\nProject: *${task.title}*\nClient: *${task.client}*\n\nAccess your interactive Review Room to stream cut & leave feedback:\nðŸ”— ${reviewUrl}`;
        sendTelegramNotification(clientObj.telegramId, msgText, [
          [{ text: 'ðŸŽ¬ Open Review Room', url: reviewUrl }]
        ], false);
      }

      recordAutomationLog(db, {
        id: `LOG-${Date.now()}`,
        rule: 'AUT-004 (Client Review Portal Push)',
        event: eventType,
        target: task.title,
        status: 'Executed',
        timestamp: new Date().toISOString()
      });
    }

    // TRIGGER 4: Invoice Marked Paid -> Notify Client via Telegram
    if (eventType === 'invoice_paid') {
      const invoice = eventData.invoice;
      const clientObj = (db.clients || []).find(c => c.id === invoice.clientId || (c.name || '').toLowerCase().includes((invoice.clientName || '').toLowerCase()));

      if (clientObj && clientObj.telegramId) {
        const msgText = `âœ… *Payment Received & Verified!*\n\nInvoice: *${invoice.id}*\nAmount: *$${invoice.amount} USD*\nDate: *${invoice.paidDate || new Date().toISOString().split('T')[0]}*\n\nThank you for partnering with Purplebot Digital!`;
        sendTelegramNotification(clientObj.telegramId, msgText, null, false);
      }

      recordAutomationLog(db, {
        id: `LOG-${Date.now()}`,
        rule: 'AUT-005 (Payment Receipt Alert)',
        event: eventType,
        target: invoice.id,
        status: 'Executed',
        timestamp: new Date().toISOString()
      });
    }

    // TRIGGER 5: Social Post Approved by Client -> Alert Assigned Publisher (AUT-006)
    if (eventType === 'social_post_approved') {
      const post = eventData.post;
      const publisherName = (post.assignedPublisher || '').split(' ')[0].toLowerCase();
      const publisher = (db.team || []).find(t => (t.name || '').toLowerCase().includes(publisherName));
      const portalUrl = `https://purpleos-iota.vercel.app/admin?tab=social`;

      const msgText = `âœ… *SOCIAL POST APPROVED BY CLIENT*\n\n` +
        `ðŸ‘¤ Client: *${post.clientName}*\n` +
        `ðŸ“± Platform: *${post.platform}*\n` +
        `ðŸ“Œ Topic: *${post.title}*\n` +
        `ðŸ“… Scheduled Date: *${post.scheduledDate} ${post.scheduledTime || ''}*\n\n` +
        `The client has approved this post. It is queued for 1-Click Dispatch.`;

      if (publisher && publisher.telegramId) {
        sendTelegramNotification(publisher.telegramId, msgText, [
          [{ text: 'ðŸ“± Open Social Planner', url: portalUrl }]
        ], true);
      }

      recordAutomationLog(db, {
        id: `LOG-${Date.now()}`,
        rule: 'AUT-006 (Post Approved Alert)',
        event: eventType,
        target: `${post.clientName} - ${post.platform}`,
        status: 'Executed',
        timestamp: new Date().toISOString()
      });
    }

    // TRIGGER 6: Social Post Day-Of Dispatch Due -> Push 1-Click Launch Alert (AUT-007)
    if (eventType === 'social_post_dispatch_alert') {
      const post = eventData.post;
      const publisherName = (post.assignedPublisher || '').split(' ')[0].toLowerCase();
      const publisher = (db.team || []).find(t => (t.name || '').toLowerCase().includes(publisherName));
      const portalUrl = `https://purpleos-iota.vercel.app/admin?tab=social&dispatchId=${post.id}`;
      const targetUrl = post.targetUrl || 'https://facebook.com';

      const msgText = `ðŸ“± *1-CLICK SOCIAL DISPATCH DUE NOW!*\n\n` +
        `ðŸ‘¤ Client: *${post.clientName}*\n` +
        `ðŸ“Œ Platform: *${post.platform}*\n` +
        `ðŸ“ Topic: *${post.title}*\n\n` +
        `ðŸ”— Direct Target Link:\n${targetUrl}\n\n` +
        `ðŸ“² Open 1-Click Dispatch Hub to copy caption & download media assets:`;

      const buttons = [
        [{ text: 'ðŸš€ Launch Target Page', url: targetUrl }],
        [{ text: 'ðŸ“‹ Open 1-Click Dispatch Hub', url: portalUrl }]
      ];

      if (publisher && publisher.telegramId) {
        sendTelegramNotification(publisher.telegramId, msgText, buttons, true);
      } else {
        const owner = (db.team || []).find(t => (t.role || '').toLowerCase().includes('owner'));
        if (owner && owner.telegramId) {
          sendTelegramNotification(owner.telegramId, msgText, buttons, true);
        }
      }

      recordAutomationLog(db, {
        id: `LOG-${Date.now()}`,
        rule: 'AUT-007 (Post Day-Of Dispatch Alert)',
        event: eventType,
        target: `${post.clientName} (${post.id})`,
        status: 'Executed',
        timestamp: new Date().toISOString()
      });
    }

    // TRIGGER 7: Expense Tier 1 Approved -> Notify Finance Lead (AUT-008)
    if (eventType === 'expense_tier1_approved') {
      const expense = eventData.expense;
      const portalUrl = `https://purpleos-iota.vercel.app/admin?tab=expenses&expenseId=${expense.id}`;
      const msgText = `ðŸ’° *EXPENSE TIER 1 APPROVED â€” READY FOR FINANCE VERIFICATION*\n\n` +
        `ðŸ“‹ Claim ID: *${expense.id}*\n` +
        `ðŸ‘¤ Submitted By: *${expense.submittedBy}*\n` +
        `ðŸ“‚ Category: *${expense.category}*\n` +
        `ðŸ’µ Amount: *BDT ${(Number(expense.amount) || 0).toLocaleString()}*\n` +
        `âœï¸ Line Manager: *${expense.tier1.approvedBy}*\n\n` +
        `Please review and verify budget allocation in the Finance Portal.`;

      const financeUser = (db.team || []).find(t => (t.role || '').toLowerCase().includes('finance') || (t.role || '').toLowerCase().includes('owner'));
      if (financeUser && financeUser.telegramId) {
        sendTelegramNotification(financeUser.telegramId, msgText, [
          [
            { text: 'ðŸ’° Verify Tier 2', callback_data: `approve_expense_t2:${expense.id}` }
          ],
          [{ text: 'ðŸ” Inspect in Finance Portal', url: portalUrl }]
        ], true);
      }

      recordAutomationLog(db, {
        id: `LOG-${Date.now()}`,
        rule: 'AUT-008 (Expense Tier 1 Alert)',
        event: eventType,
        target: `${expense.submittedBy} - ${expense.id}`,
        status: 'Executed',
        timestamp: new Date().toISOString()
      });
    }

    // TRIGGER 8: Expense Tier 2 Verified -> Notify Owner (AUT-009)
    if (eventType === 'expense_tier2_approved') {
      const expense = eventData.expense;
      const portalUrl = `https://purpleos-iota.vercel.app/admin?tab=expenses&expenseId=${expense.id}`;
      const msgText = `ðŸ‘‘ *EXPENSE TIER 2 VERIFIED â€” AWAITING OWNER DISBURSEMENT*\n\n` +
        `ðŸ“‹ Claim ID: *${expense.id}*\n` +
        `ðŸ‘¤ Submitted By: *${expense.submittedBy}*\n` +
        `ðŸ“‚ Category: *${expense.category}*\n` +
        `ðŸ’µ Amount: *BDT ${(Number(expense.amount) || 0).toLocaleString()}*\n` +
        `âœ… Tier 1 (Manager): *${expense.tier1.approvedBy}*\n` +
        `âœ… Tier 2 (Finance): *${expense.tier2.approvedBy}*\n\n` +
        `Click below to approve final disbursement release.`;

      const owner = (db.team || []).find(t => (t.role || '').toLowerCase().includes('owner'));
      if (owner && owner.telegramId) {
        sendTelegramNotification(owner.telegramId, msgText, [
          [
            { text: 'ðŸ’¸ Release Disbursement', callback_data: `disburse_expense_t3:${expense.id}` }
          ],
          [{ text: 'ðŸ” Inspect in Admin Portal', url: portalUrl }]
        ], true);
      }

      // Large expense threshold â€” BDT 25,000+ triggers Chairman notification
      const LARGE_EXP_THRESHOLD = 25000;
      if (Number(expense.amount) >= LARGE_EXP_THRESHOLD) {
        const chairman = (db.team || []).find(t => t.id === 'PBD-002');
        if (chairman?.telegramId) {
          sendTelegramNotification(chairman.telegramId,
            `âš ï¸ *Large Expense â€” Chairman Oversight*\n\n` +
            `â€¢ Claim ID: *${expense.id}*\n` +
            `â€¢ By: *${expense.submittedBy}*\n` +
            `â€¢ Category: *${expense.category}*\n` +
            `â€¢ Amount: *BDT ${Number(expense.amount).toLocaleString()}* _(above BDT 25,000 threshold)_\n` +
            `â€¢ Tier 1 âœ…  Tier 2 âœ…  Awaiting Owner disbursement\n\n` +
            `This has been flagged to you as Chairman per the financial oversight policy.`,
            null, true
          );
        }
      }

      recordAutomationLog(db, {
        id: `LOG-${Date.now()}`,
        rule: 'AUT-009 (Expense Tier 2 Alert)',
        event: eventType,
        target: `${expense.submittedBy} - ${expense.id}`,
        status: 'Executed',
        timestamp: new Date().toISOString()
      });
    }

    // TRIGGER 9: Expense Disbursed -> Notify Staff Member (AUT-010)
    if (eventType === 'expense_disbursed') {
      const expense = eventData.expense;
      const staffName = (expense.submittedBy || '').split(' ')[0].toLowerCase();
      const staff = (db.team || []).find(t => (t.name || '').toLowerCase().includes(staffName));

      const msgText = `ðŸŽ‰ *EXPENSE CLAIM DISBURSED & PAID!*\n\n` +
        `ðŸ“‹ Claim ID: *${expense.id}*\n` +
        `ðŸ’µ Amount Disbursed: *BDT ${(Number(expense.amount) || 0).toLocaleString()}*\n` +
        `ðŸ“‚ Category: *${expense.category}*\n` +
        `ðŸ“… Date: *${expense.disbursedAt ? expense.disbursedAt.split('T')[0] : new Date().toISOString().split('T')[0]}*\n\n` +
        `The funds have been released by agency management. Thank you!`;

      if (staff && staff.telegramId) {
        sendTelegramNotification(staff.telegramId, msgText, null, true);
      }

      recordAutomationLog(db, {
        id: `LOG-${Date.now()}`,
        rule: 'AUT-010 (Expense Disbursed Alert)',
        event: eventType,
        target: `${expense.submittedBy} - ${expense.id}`,
        status: 'Executed',
        timestamp: new Date().toISOString()
      });
    }

    // TRIGGER 10: Leave Request Decision Alert (AUT-011)
    if (eventType === 'leave_decision') {
      const leave = eventData.leave;
      const staffName = (leave.staffName || '').split(' ')[0].toLowerCase();
      const staff = (db.team || []).find(t => (t.name || '').toLowerCase().includes(staffName));

      const icon = leave.status === 'Approved' ? 'âœ…' : 'âŒ';
      const msgText = `${icon} *LEAVE REQUEST ${leave.status.toUpperCase()}*\n\n` +
        `ðŸ‘¤ Staff: *${leave.staffName}*\n` +
        `ðŸŒ´ Type: *${leave.type}*\n` +
        `ðŸ“… Dates: *${leave.startDate} to ${leave.endDate}* (${leave.totalDays || 1} Days)\n` +
        `âœï¸ Reviewed By: *${leave.reviewedBy || 'Manager'}*\n\n` +
        `Your attendance calendar has been updated.`;

      if (staff && staff.telegramId) {
        sendTelegramNotification(staff.telegramId, msgText, null, true);
      }

      recordAutomationLog(db, {
        id: `LOG-${Date.now()}`,
        rule: 'AUT-011 (Leave Decision Alert)',
        event: eventType,
        target: `${leave.staffName} (${leave.status})`,
        status: 'Executed',
        timestamp: new Date().toISOString()
      });
    }

    // TRIGGER 11: 7:00 PM Daily EOD Report Prompt (AUT-012)
    if (eventType === 'eod_daily_prompt') {
      const msgText = `ðŸ“‹ *TIME FOR YOUR DAILY EOD REPORT! (7:00 PM)*\n\n` +
        `Hello team! Please reply to this message or log into the Crew Portal with:\n` +
        `1. Tasks completed today\n` +
        `2. Tasks in progress\n` +
        `3. Blockers / help needed\n\n` +
        `ðŸŒ Open Crew Portal: https://purpleos-iota.vercel.app/team`;

      (db.team || []).forEach(staff => {
        if (staff.telegramId) {
          sendTelegramNotification(staff.telegramId, msgText, [
            [{ text: 'ðŸ“‹ Submit EOD in Portal', url: 'https://purpleos-iota.vercel.app/team' }]
          ], true);
        }
      });

      recordAutomationLog(db, {
        id: `LOG-${Date.now()}`,
        rule: 'AUT-012 (Daily 7PM EOD Prompt)',
        event: eventType,
        target: 'Active Team Members',
        status: 'Executed',
        timestamp: new Date().toISOString()
      });
    }

    // TRIGGER 12: Support Ticket Resolved Alert (AUT-013)
    if (eventType === 'ticket_resolved') {
      const ticket = eventData.ticket;
      const staffName = (ticket.loggedBy || '').split(' ')[0].toLowerCase();
      const staff = (db.team || []).find(t => (t.name || '').toLowerCase().includes(staffName));

      const msgText = `ðŸ”§ *SUPPORT TICKET RESOLVED!*\n\n` +
        `ðŸŽ« Ticket ID: *${ticket.id}*\n` +
        `ðŸ“‚ Category: *${ticket.category}*\n` +
        `ðŸ“Œ Title: *${ticket.title}*\n` +
        `âœ… Status: *Resolved*\n` +
        `âœï¸ Resolved By: *${ticket.resolvedBy || 'Maintenance Lead'}*\n\n` +
        `Your support ticket has been closed.`;

      if (staff && staff.telegramId) {
        sendTelegramNotification(staff.telegramId, msgText, null, true);
      }

      recordAutomationLog(db, {
        id: `LOG-${Date.now()}`,
        rule: 'AUT-013 (Ticket Resolution Alert)',
        event: eventType,
        target: `${ticket.id} (${ticket.title})`,
        status: 'Executed',
        timestamp: new Date().toISOString()
      });
    }

    // TRIGGER 13: 9:00 AM Morning Executive Briefing (AUT-014)
    if (eventType === 'morning_executive_briefing') {
      const todayStr = new Date().toISOString().split('T')[0];
      const openTasks = (db.tasks || []).filter(t => t.stage !== 'Approved').length;
      const pendingExp = (db.expenses || []).filter(e => e.status !== 'Disbursed' && e.status !== 'Rejected').length;
      const activeStaff = (db.team || []).length;

      const msgText = `â˜€ï¸ *PURPLEBOT 9:00 AM MORNING EXECUTIVE BRIEFING*\n` +
        `ðŸ“… Date: *${todayStr}*\n\n` +
        `ðŸŽ¬ *Active Campaigns & Shoots:* ${openTasks} Open Workflows\n` +
        `ðŸ‘¥ *Team Capacity:* ${activeStaff} Specialists Active\n` +
        `ðŸ§¾ *Pending Approvals:* ${pendingExp} Expense Claims Awaiting Release\n` +
        `ðŸ“± *Social Dispatches:* Check 1-Click Social Dispatch Hub\n\n` +
        `ðŸŒ Open Admin Dashboard: https://purpleos-iota.vercel.app/admin`;

      const leaders = (db.team || []).filter(t => (t.role || '').toLowerCase().includes('director') || (t.role || '').toLowerCase().includes('founder') || (t.role || '').toLowerCase().includes('owner'));
      leaders.forEach(l => {
        if (l.telegramId) sendTelegramNotification(l.telegramId, msgText, null, true);
      });

      recordAutomationLog(db, {
        id: `LOG-${Date.now()}`,
        rule: 'AUT-014 (9AM Morning Briefing)',
        event: eventType,
        target: 'Agency Leadership',
        status: 'Executed',
        timestamp: new Date().toISOString()
      });
    }

    // TRIGGER 14: 8:30 PM Evening Digest (AUT-015)
    if (eventType === 'evening_digest') {
      const todayStr = new Date().toISOString().split('T')[0];
      const paidRev = (db.invoices || []).filter(i => i.status === 'Paid').reduce((s, i) => s + (Number(i.amount) || 0), 0);
      const disbursedExp = (db.expenses || []).filter(e => e.status === 'Disbursed').reduce((s, e) => s + (Number(e.amount) || 0), 0);
      const eodCount = (db.eod_reports || []).filter(e => (e.date || '').startsWith(todayStr) || (e.submittedAt || '').startsWith(todayStr)).length;
      const openTickets = (db.tickets || []).filter(t => t.status !== 'Resolved').length;

      const msgText = `ðŸŒ™ *PURPLEBOT 8:30 PM EVENING EXECUTIVE DIGEST*\n\n` +
        `ðŸ“Š *Financial Summary:*\n` +
        `  â€¢ Total Revenue Collected: *$${paidRev.toLocaleString()} USD*\n` +
        `  â€¢ Disbursed Operational Expenses: *BDT ${disbursedExp.toLocaleString()}*\n\n` +
        `ðŸ“‹ *Team EOD Submission Rate:* ${eodCount} Reports Logged Today\n` +
        `ðŸ”§ *Active Support Tickets:* ${openTickets} Open Ticket(s)\n\n` +
        `_Generated automatically by PurpleOS Core_`;

      const leaders = (db.team || []).filter(t => (t.role || '').toLowerCase().includes('director') || (t.role || '').toLowerCase().includes('founder') || (t.role || '').toLowerCase().includes('owner'));
      leaders.forEach(l => {
        if (l.telegramId) sendTelegramNotification(l.telegramId, msgText, null, true);
      });

      recordAutomationLog(db, {
        id: `LOG-${Date.now()}`,
        rule: 'AUT-015 (8:30PM Evening Digest)',
        event: eventType,
        target: 'Agency Leadership',
        status: 'Executed',
        timestamp: new Date().toISOString()
      });
    }

    // TRIGGER 15: Weekly Executive KPI Summary (AUT-016)
    if (eventType === 'weekly_kpi_summary') {
      const totalRev = (db.invoices || []).reduce((s, i) => s + (Number(i.amount) || 0), 0);
      const clientCount = (db.clients || []).length;
      const taskCount = (db.tasks || []).length;

      const msgText = `ðŸ“ˆ *PURPLEBOT WEEKLY EXECUTIVE KPI SUMMARY*\n\n` +
        `ðŸ’° Total Portfolio Revenue: *$${totalRev.toLocaleString()} USD*\n` +
        `ðŸ¢ Active Brand Retainers: *${clientCount} Clients*\n` +
        `ðŸš€ Total Campaign Workflows: *${taskCount} Production Shoots*\n\n` +
        `Check full BI Analytics tab on Admin Portal.`;

      const owner = (db.team || []).find(t => (t.role || '').toLowerCase().includes('owner') || (t.role || '').toLowerCase().includes('founder'));
      if (owner && owner.telegramId) {
        sendTelegramNotification(owner.telegramId, msgText, null, true);
      }

      recordAutomationLog(db, {
        id: `LOG-${Date.now()}`,
        rule: 'AUT-016 (Weekly Executive KPI Summary)',
        event: eventType,
        target: 'Agency Owner',
        status: 'Executed',
        timestamp: new Date().toISOString()
      });
    }

    // TRIGGER 16: Team Broadcast Notice (AUT-017)
    if (eventType === 'team_broadcast_notice') {
      const { title, message, targetGroup, senderName, urgent } = eventData;

      const prefix = urgent ? 'ðŸš¨ *URGENT TEAM BROADCAST NOTICE*' : 'ðŸ“¢ *TEAM BROADCAST NOTICE*';
      const msgText = `${prefix}\n` +
        `ðŸ“Œ *Title:* ${title || 'Notice'}\n` +
        `ðŸ‘¤ *From:* ${senderName || 'Agency Leadership'}\n\n` +
        `${message}\n\n` +
        `ðŸŒ Open Crew Portal: https://purpleos-iota.vercel.app/team`;

      (db.team || []).forEach(staff => {
        if (staff.telegramId) {
          sendTelegramNotification(staff.telegramId, msgText, null, true);
        }
      });

      // Also send to production telegram groups
      (db.telegramGroups || []).forEach(group => {
        if (group.chatId) {
          sendTelegramNotification(group.chatId, msgText, null, true);
        }
      });

      recordAutomationLog(db, {
        id: `LOG-${Date.now()}`,
        rule: 'AUT-017 (Team Broadcast Notice)',
        event: eventType,
        target: targetGroup || 'All Staff & Groups',
        status: 'Executed',
        timestamp: new Date().toISOString()
      });
    }

    // TRIGGER 17: Specialist Personal Daily Task Briefing (AUT-018)
    if (eventType === 'specialist_daily_briefing') {
      (db.team || []).forEach(staff => {
        const firstName = staff.name.split(' ')[0].toLowerCase();
        const staffTasks = (db.tasks || []).filter(t => {
          if (t.assignees && Array.isArray(t.assignees)) {
            return t.assignees.some(a => a.toLowerCase().includes(firstName));
          }
          return (t.assignee || '').toLowerCase().includes(firstName);
        });

        let taskListText = 'No specific deliverables assigned for today.';
        if (staffTasks.length > 0) {
          taskListText = staffTasks.map((t, idx) => `${idx + 1}. *${t.title}* (${t.client})\n   Stage: ${t.stage} | Deadline: ${t.dueDate || 'Today'}`).join('\n');
        }

        const msgText = `â˜€ï¸ *GOOD MORNING ${staff.name.toUpperCase()}!*\n` +
          `ðŸŽ¯ *YOUR DAILY ACTION PLAN & TASK BRIEFING (9:00 AM)*\n\n` +
          `ðŸ“‹ *Assigned Tasks & Deliverables:*\n${taskListText}\n\n` +
          `â° Please remember to clock in when starting studio work.\n` +
          `ðŸŒ Open Crew Portal: https://purpleos-iota.vercel.app/team`;

        if (staff.telegramId) {
          sendTelegramNotification(staff.telegramId, msgText, [
            [{ text: 'ðŸŸ¢ Clock In Studio', url: 'https://purpleos-iota.vercel.app/team' }]
          ], true);
        }
      });

      recordAutomationLog(db, {
        id: `LOG-${Date.now()}`,
        rule: 'AUT-018 (Specialist Personal Daily Task Briefing)',
        event: eventType,
        target: 'All Team Specialists',
        status: 'Executed',
        timestamp: new Date().toISOString()
      });
    }

    // TRIGGER 19: New Expense Claim Submitted -> Alert Line Manager (AUT-019)
    if (eventType === 'expense_submitted') {
      const expense = eventData.expense;
      const staffName = (expense.submittedBy || '').split(' ')[0].toLowerCase();
      const staffObj = (db.team || []).find(t => (t.name || '').toLowerCase().includes(staffName));
      
      const targetManager = (staffObj && staffObj.reportsTo)
        ? (db.team || []).find(t => t.id === staffObj.reportsTo)
        : (db.team || []).find(t => (t.role || '').toLowerCase().includes('managing director') || t.id === 'PBD-001');

      const msgText = `ðŸ’° *NEW EXPENSE CLAIM SUBMITTED (TIER 1 PENDING)*\n\n` +
        `ðŸ“‹ Claim ID: *${expense.id}*\n` +
        `ðŸ‘¤ Submitted By: *${expense.submittedBy}*\n` +
        `ðŸ“‚ Category: *${expense.category}*\n` +
        `ðŸ’µ Amount: *BDT ${(Number(expense.amount) || 0).toLocaleString()}*\n` +
        `ðŸ“ Note: *${expense.description || 'Field operational expense'}*\n\n` +
        `Click below to approve Tier 1 or inspect in Manager Portal.`;

      if (targetManager && targetManager.telegramId) {
        sendTelegramNotification(targetManager.telegramId, msgText, [
          [{ text: 'âœ… Approve T1 (Manager)', callback_data: `approve_expense_t1:${expense.id}` }],
          [{ text: 'ðŸ” Inspect in Manager Portal', url: `https://purpleos-iota.vercel.app/manager` }]
        ], true);
      }

      recordAutomationLog(db, {
        id: `LOG-${Date.now()}`,
        rule: 'AUT-019 (Expense Submitted Alert)',
        event: eventType,
        target: `${expense.submittedBy} - ${expense.id}`,
        status: 'Executed',
        timestamp: new Date().toISOString()
      });
    }

    // TRIGGER 19.1: Expense Tier 1 Approved -> Check High-Value (> BDT 10k) Ops Routing
    if (eventType === 'expense_tier1_approved') {
      const expense = eventData.expense;
      const amt = Number(expense.amount) || 0;

      if (amt > 10000) {
        // High-Value Claim (> 10k) -> Route to Kafil Mahmud (Head of Business Operations) for Tier 1.5
        const kafil = (db.team || []).find(t => t.id === 'PBD-004' || (t.role || '').toLowerCase().includes('business operations'));
        expense.status = 'Tier 1.5 Pending (Ops Review)';

        const msgText = `ðŸš¨ *HIGH-VALUE EXPENSE CLAIM (> BDT 10,000) â€” TIER 1.5 OPS REVIEW*\n\n` +
          `ðŸ“‹ Claim ID: *${expense.id}*\n` +
          `ðŸ‘¤ Submitted By: *${expense.submittedBy}*\n` +
          `ðŸ’µ Amount: *BDT ${amt.toLocaleString()}*\n` +
          `âœï¸ T1 Approved By: *${expense.tier1?.approvedBy || 'Line Manager'}*\n\n` +
          `Requires Head of Business Operations sign-off before Finance disbursement.`;

        const targetId = kafil?.telegramId || '1708459008';
        sendTelegramNotification(targetId, msgText, [
          [{ text: 'âœ… Approve T1.5 (Ops Head)', callback_data: `approve_expense_t1_5:${expense.id}` }],
          [{ text: 'ðŸ” Inspect in Portal', url: `https://purpleos-iota.vercel.app/admin` }]
        ], true);
      } else {
        // Standard Claim (<= 10k) -> Route directly to Borhan Siddique (Finance Manager) for Tier 2
        const borhan = (db.team || []).find(t => t.id === 'PBD-029' || (t.role || '').toLowerCase().includes('finance manager'));
        expense.status = 'Tier 2 Pending';

        const msgText = `ðŸ’° *EXPENSE CLAIM TIER 1 APPROVED â€” AWAITING TIER 2 FINANCE VERIFICATION*\n\n` +
          `ðŸ“‹ Claim ID: *${expense.id}*\n` +
          `ðŸ‘¤ Submitted By: *${expense.submittedBy}*\n` +
          `ðŸ’µ Amount: *BDT ${amt.toLocaleString()}*\n` +
          `âœï¸ T1 Approved By: *${expense.tier1?.approvedBy || 'Line Manager'}*\n\n` +
          `Click below to verify for final disbursement.`;

        const targetId = borhan?.telegramId || '1708459008';
        sendTelegramNotification(targetId, msgText, [
          [{ text: 'ðŸ’° Verify T2 (Finance)', callback_data: `approve_expense_t2:${expense.id}` }],
          [{ text: 'ðŸ” Inspect in Admin Portal', url: `https://purpleos-iota.vercel.app/admin` }]
        ], true);
      }
    }

    // TRIGGER 19.2: Expense Tier 1.5 Approved -> Route to Finance Manager (Tier 2)
    if (eventType === 'expense_tier1_5_approved') {
      const expense = eventData.expense;
      const borhan = (db.team || []).find(t => t.id === 'PBD-029' || (t.role || '').toLowerCase().includes('finance manager'));
      expense.status = 'Tier 2 Pending';

      const msgText = `ðŸ’° *HIGH-VALUE EXPENSE TIER 1.5 OPS APPROVED â€” AWAITING FINANCE VERIFICATION*\n\n` +
        `ðŸ“‹ Claim ID: *${expense.id}*\n` +
        `ðŸ‘¤ Submitted By: *${expense.submittedBy}*\n` +
        `ðŸ’µ Amount: *BDT ${(Number(expense.amount) || 0).toLocaleString()}*\n` +
        `âœï¸ Ops Approved By: *${expense.tier1_5?.approvedBy || 'Kafil Mahmud (Head of Ops)'}*\n\n` +
        `Click below to verify for final disbursement.`;

      const targetId = borhan?.telegramId || '1708459008';
      sendTelegramNotification(targetId, msgText, [
        [{ text: 'ðŸ’° Verify T2 (Finance)', callback_data: `approve_expense_t2:${expense.id}` }],
        [{ text: 'ðŸ” Inspect in Admin Portal', url: `https://purpleos-iota.vercel.app/admin` }]
      ], true);
    }

    // TRIGGER 20: New Leave Request Submitted -> Alert Line Manager (AUT-020)
    if (eventType === 'leave_submitted') {
      const leave = eventData.leave;
      const staffName = (leave.staffName || '').split(' ')[0].toLowerCase();
      const staffObj = (db.team || []).find(t => (t.name || '').toLowerCase().includes(staffName));

      const targetManager = (staffObj && staffObj.reportsTo)
        ? (db.team || []).find(t => t.id === staffObj.reportsTo)
        : (db.team || []).find(t => (t.role || '').toLowerCase().includes('managing director') || t.id === 'PBD-001');

      const msgText = `ðŸŒ´ *NEW LEAVE REQUEST SUBMITTED (PENDING MANAGER REVIEW)*\n\n` +
        `ðŸ“‹ Leave ID: *${leave.id}*\n` +
        `ðŸ‘¤ Staff: *${leave.staffName}*\n` +
        `ðŸŒ´ Type: *${leave.type}*\n` +
        `ðŸ“… Dates: *${leave.startDate} to ${leave.endDate}* (${leave.totalDays || 1} Days)\n` +
        `ðŸ“ Reason: *${leave.reason}*\n\n` +
        `Click below to review leave request.`;

      const targetId = targetManager?.telegramId || '1708459008';
      sendTelegramNotification(targetId, msgText, [
        [
          { text: 'âœ… Approve Leave', callback_data: `approve_leave:${leave.id}` },
          { text: 'âŒ Reject Leave', callback_data: `reject_leave:${leave.id}` }
        ],
        [{ text: 'ðŸ” Inspect in Manager Portal', url: `https://purpleos-iota.vercel.app/manager` }]
      ], true);

      recordAutomationLog(db, {
        id: `LOG-${Date.now()}`,
        rule: 'AUT-020 (Leave Submitted Alert)',
        event: eventType,
        target: `${leave.staffName} - ${leave.id}`,
        status: 'Executed',
        timestamp: new Date().toISOString()
      });
    }

    // TRIGGER: Leave Manager Approved -> Alert Owner for Final Sign-off
    if (eventType === 'leave_manager_approved') {
      const leave = eventData.leave;
      const iftekhar = (db.team || []).find(t => t.id === 'PBD-001');
      const firoz = (db.team || []).find(t => t.id === 'PBD-000');

      const msgText = `ðŸ‘‘ *LEAVE MANAGER APPROVED â€” AWAITING OWNER FINAL SIGN-OFF*\n\n` +
        `ðŸ“‹ Leave ID: *${leave.id}*\n` +
        `ðŸ‘¤ Staff: *${leave.staffName}*\n` +
        `ðŸŒ´ Type: *${leave.type}*\n` +
        `ðŸ“… Dates: *${leave.startDate} to ${leave.endDate}*\n` +
        `âœï¸ Manager Approved By: *${leave.managerReviewedBy || 'Line Manager'}*\n\n` +
        `Click below to issue final leave sign-off.`;

      const buttons = [
        [{ text: 'ðŸ‘‘ Final Leave Sign-off', callback_data: `approve_leave_owner:${leave.id}` }],
        [{ text: 'âŒ Decline Leave', callback_data: `reject_leave:${leave.id}` }],
        [{ text: 'ðŸ” Inspect in Admin Portal', url: `https://purpleos-iota.vercel.app/admin` }]
      ];

      if (iftekhar && iftekhar.telegramId) {
        sendTelegramNotification(iftekhar.telegramId, msgText, buttons, true);
      }
      if (firoz && firoz.telegramId && firoz.telegramId !== iftekhar?.telegramId) {
        sendTelegramNotification(firoz.telegramId, msgText, buttons, true);
      }

      recordAutomationLog(db, {
        id: `LOG-${Date.now()}`,
        rule: 'Leave Manager Approved Alert',
        event: eventType,
        target: `${leave.staffName} (${leave.id})`,
        status: 'Executed',
        timestamp: new Date().toISOString()
      });
    }

    // TRIGGER: Individual EOD Report Submitted -> Notify Manager, MD & Department Group
    if (eventType === 'eod_submitted') {
      const eod = eventData.eod;
      const staffObj = (db.team || []).find(t => t.name === eod.staffName) || (db.team || [])[0];
      const dept = staffObj?.department || 'Operations';

      const lineManager = (db.team || []).find(t => (t.department || '').toLowerCase() === dept.toLowerCase() && (t.accessLevel || '').includes('Manager'));
      const owner = (db.team || []).find(t => (t.role || '').toLowerCase().includes('managing director') || t.id === 'PBD-001') || (db.team || [])[0];

      const msgText = `ðŸ“‹ *NEW EOD REPORT LOGGED*\n\n` +
        `ðŸ‘¤ Staff: *${eod.staffName}* (${dept})\n` +
        `âœ… *Completed:* ${eod.tasksCompleted}\n` +
        `â³ *In Progress:* ${eod.tasksInProgress}\n` +
        `ðŸš§ *Blockers:* ${eod.blockers}\n\n` +
        `Submitted at ${new Date(eod.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

      if (lineManager && lineManager.telegramId) {
        sendTelegramNotification(lineManager.telegramId, msgText, null, true);
      }
      if (owner && owner.telegramId && owner.telegramId !== lineManager?.telegramId) {
        sendTelegramNotification(owner.telegramId, msgText, null, true);
      }

      // Phase 7: Broadcast to Department Group if registered
      const deptGroupKeyMap = {
        'Design & Post-Production': 'design_post',
        'Content Production': 'content_production',
        'Client Services': 'client_services',
        'Strategy & Planning': 'strategy',
        'Finance & Admin': 'finance_admin',
        'Tech & AI': 'tech_ai'
      };
      const groupKey = deptGroupKeyMap[dept];
      if (groupKey) {
        const group = (db.groups || []).find(g => g.type === groupKey && g.registered && g.chatId);
        if (group && group.chatId) {
          sendTelegramNotification(group.chatId, msgText, null, true);
        }
      }

      recordAutomationLog(db, {
        id: `LOG-${Date.now()}`,
        rule: 'EOD Submitted Alert',
        event: eventType,
        target: `${eod.staffName}`,
        status: 'Executed',
        timestamp: new Date().toISOString()
      });
    }

    // TRIGGER 21: Daily 7:30 PM Manager EOD Digest (AUT-021)
    if (eventType === 'eod_evening_digest') {
      const todayStr = new Date().toISOString().split('T')[0];
      const todayEods = (db.eod_reports || []).filter(e => (e.date || '').startsWith(todayStr) || (e.submittedAt || '').startsWith(todayStr));
      const blockersCount = todayEods.filter(e => e.blockers && !e.blockers.toLowerCase().includes('none') && e.blockers.trim() !== '').length;

      const managers = (db.team || []).filter(t => (t.accessLevel || '').includes('Manager') || (t.role || '').toLowerCase().includes('operations'));

      managers.forEach(mgr => {
        const dept = mgr.department || 'Operations';
        const msgText = `ðŸ“‹ *PURPLEBOT 7:30 PM DEPARTMENT EOD DIGEST*\n` +
          `ðŸ“ Department: *${dept}*\n\n` +
          `âœ… *Reports Logged Today:* ${todayEods.length} Submissions\n` +
          `ðŸ”´ *Blockers Flagged:* ${blockersCount} Action Item(s)\n\n` +
          `ðŸŒ Open Manager Portal: https://purpleos-iota.vercel.app/manager`;

        const targetId = mgr.telegramId || '1708459008';
        sendTelegramNotification(targetId, msgText, null, true);
      });

      recordAutomationLog(db, {
        id: `LOG-${Date.now()}`,
        rule: 'AUT-021 (7:30PM Manager EOD Digest)',
        event: eventType,
        target: 'Department Managers',
        status: 'Executed',
        timestamp: new Date().toISOString()
      });
    }

    if (logs.length > 50) db.automationLogs = logs.slice(0, 50);

  } catch (err) {
    console.error('Automation engine error:', err);
  }
}

/**
 * Check posts scheduled for today or past due and trigger dispatch alerts
 */
function checkScheduledSocialDispatches(db, writeDB, broadcast) {
  if (!db || !db.posts) return;
  const todayStr = new Date().toISOString().split('T')[0];
  let updated = false;

  db.posts.forEach(post => {
    if ((post.status === 'Approved' || post.status === 'Scheduled') && post.scheduledDate <= todayStr) {
      post.status = 'Due Today';
      updated = true;
      processAutomationEvent('social_post_dispatch_alert', { post }, db, writeDB, broadcast);
    }
  });

  if (updated && writeDB) {
    writeDB(db);
    if (broadcast) broadcast('post_update', db.posts);
  }
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// SCHEDULED JOBS â€” Morning Briefing & EOD Summary
// Runs inside the server process via setInterval (no cron lib needed)
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

let _schedulerDb = null;
let _schedulerWriteDB = null;
let _schedulerBroadcast = null;
let _schedulerStarted = false;

function getBDTime() {
  // Bangladesh Standard Time = UTC+6
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const bd = new Date(utc + 6 * 3600000);
  return { h: bd.getHours(), m: bd.getMinutes(), day: bd.getDay(), bd };
}

function buildMorningBriefing(db) {
  const team = db.team || [];
  const inStudio = team.filter(t => t.status === 'In Studio').length;
  const onShoot = team.filter(t => t.status === 'On Field Shoot').length;
  const onLeave = team.filter(t => t.status === 'On Leave').length;
  const offline = team.length - inStudio - onShoot - onLeave;

  const pendingAgreements = team.filter(t => t.agreementStage === 1 || (t.agreementStage === 2 && true)).length;
  const pendingExpenses = (db.expenses || []).filter(e => e.status === 'Tier 3 Pending').length;
  const pendingExpAmt = (db.expenses || [])
    .filter(e => e.status === 'Tier 3 Pending')
    .reduce((s, e) => s + (e.amount || 0), 0);

  const pendingInvoices = (db.invoices || []).filter(i => i.status !== 'Paid' && i.status !== 'Draft');
  const pendingInvAmt = pendingInvoices.reduce((s, i) => s + (i.amount || 0), 0);

  const clientsInReview = (db.tasks || []).filter(t => t.stage === 'Client Review').length;
  const clientsInEdit = (db.tasks || []).filter(t => t.stage === 'Editing' || t.stage === 'Post Production').length;

  const now = getBDTime().bd;
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  let msg = `â˜€ï¸ *Good morning, this is your ${dayNames[now.getDay()]} briefing!*\n`;
  msg += `â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”\n\n`;

  msg += `ðŸ“ *Team Live (${now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })} BD)*\n`;
  msg += `  ðŸŸ¢ ${inStudio} In Studio  `;
  msg += `ðŸŽ¬ ${onShoot} On Shoot  `;
  msg += `ðŸŒ´ ${onLeave} Leave  `;
  msg += `â¬› ${offline} Offline\n\n`;

  if (pendingAgreements > 0 || pendingExpenses > 0) {
    msg += `âœï¸ *Pending Your Approval*\n`;
    if (pendingAgreements > 0) msg += `  â€¢ ${pendingAgreements} Employment Agreement(s) awaiting final seal\n`;
    if (pendingExpenses > 0) msg += `  â€¢ ${pendingExpenses} Expense(s) â€” BDT ${pendingExpAmt.toLocaleString()} to disburse\n`;
    msg += `\n`;
  }

  msg += `ðŸ’° *Finance Snapshot*\n`;
  msg += `  â€¢ Outstanding Invoices: ${pendingInvoices.length} (BDT ${pendingInvAmt.toLocaleString()})\n\n`;

  msg += `ðŸŽ¬ *Campaign Pipeline*\n`;
  msg += `  â€¢ ${clientsInReview} deliverable(s) in Client Review\n`;
  msg += `  â€¢ ${clientsInEdit} in Editing / Post Production\n`;
  msg += `â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”`;

  return msg;
}

function buildEODSummary(db) {
  const team = db.team || [];
  const todayStr = new Date().toLocaleDateString('en-CA');

  // Who clocked in today
  const clockedToday = (db.attendance || []).filter(a =>
    a.clockInTime && (a.date === todayStr || !a.date)
  );

  // EOD reports submitted today
  const eodToday = (db.eodReports || []).filter(r =>
    r.date === todayStr || r.submittedAt?.startsWith(todayStr)
  );

  // Expenses submitted today
  const expToday = (db.expenses || []).filter(e =>
    e.date === todayStr || e.createdAt?.startsWith(todayStr)
  );

  let msg = `ðŸŒ™ *Evening Summary â€” End of Day*\n`;
  msg += `â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”\n\n`;

  msg += `ðŸ“ *Attendance Today*\n`;
  msg += `  â€¢ ${clockedToday.length} team member(s) clocked in\n`;
  if (team.length - clockedToday.length > 0) {
    msg += `  â€¢ ${team.length - clockedToday.length} did not log attendance\n`;
  }
  msg += `\n`;

  msg += `ðŸ“ *EOD Reports*\n`;
  if (eodToday.length > 0) {
    msg += `  â€¢ ${eodToday.length} report(s) submitted today\n`;
    eodToday.slice(0, 3).forEach(r => {
      msg += `  â€” ${r.employeeName || 'Team Member'}: ${(r.summary || r.tasks || '').slice(0, 60)}...\n`;
    });
  } else {
    msg += `  â€¢ No EOD reports received today\n`;
  }
  msg += `\n`;

  if (expToday.length > 0) {
    const expTotal = expToday.reduce((s, e) => s + (e.amount || 0), 0);
    msg += `ðŸ§¾ *Expenses Filed Today*\n`;
    msg += `  â€¢ ${expToday.length} claim(s) â€” BDT ${expTotal.toLocaleString()} total\n\n`;
  }

  msg += `â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”\n`;
  msg += `_Have a great evening! See you tomorrow._ ðŸ’œ`;

  return msg;
}

// â”€â”€â”€ Chairman's Strategic Briefing (board-level, different from MD's operational view) â”€â”€â”€
function buildChairmanBriefing(db) {
  const team = db.team || [];
  const now = getBDTime().bd;
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Finance
  const invoices = db.invoices || [];
  const monthStr = now.toISOString().slice(0, 7);
  const paidThisMonth = invoices.filter(i => i.status === 'Paid' && (i.paidAt || i.issueDate || '').startsWith(monthStr));
  const revThisMonth = paidThisMonth.reduce((s, i) => s + (i.amount || 0), 0);
  const pendingInvoices = invoices.filter(i => i.status !== 'Paid' && i.status !== 'Draft');
  const pendingInvAmt = pendingInvoices.reduce((s, i) => s + (i.amount || 0), 0);
  const salaryTotal = team.reduce((s, t) => s + (t.baseSalary || 0), 0);

  // HR
  const activeEmployees = team.filter(t => t.id !== 'PBD-000').length;
  const pendingAgreements = team.filter(t => t.agreementStage && t.agreementStage < 3 && !t.agreementComplete).length;
  const onLeave = team.filter(t => t.status === 'On Leave').length;
  const pendingLeaves = (db.leaveRequests || []).filter(l => l.status === 'Pending Manager Approval').length;

  // BD Pipeline
  const leads = db.leads || [];
  const activeLeads = leads.filter(l => l.status !== 'Won' && l.status !== 'Lost').length;
  const pipelineValue = leads.filter(l => l.status !== 'Won' && l.status !== 'Lost').reduce((s, l) => s + (l.value || 0), 0);
  const wonThisMonth = leads.filter(l => l.status === 'Won' && (l.wonAt || '').startsWith(monthStr)).length;

  // Clients
  const clients = db.clients || [];
  const activeClients = clients.filter(c => c.status === 'Active Retainer').length;
  const inReview = (db.tasks || []).filter(t => t.stage === 'Client Review').length;

  let msg = `ðŸ›ï¸ *Chairman's ${dayNames[now.getDay()]} Board Briefing*\n`;
  msg += `â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”\n\n`;

  msg += `ðŸ’° *Financial Health*\n`;
  msg += `  â€¢ Revenue (this month): BDT ${revThisMonth.toLocaleString()}\n`;
  msg += `  â€¢ Outstanding invoices: ${pendingInvoices.length} â€” BDT ${pendingInvAmt.toLocaleString()}\n`;
  msg += `  â€¢ Monthly payroll commitment: BDT ${salaryTotal.toLocaleString()}\n\n`;

  msg += `ðŸ‘¥ *HR Status*\n`;
  msg += `  â€¢ Active employees: ${activeEmployees}\n`;
  if (pendingAgreements > 0) msg += `  â€¢ âš ï¸ ${pendingAgreements} agreement(s) pending completion\n`;
  if (pendingLeaves > 0) msg += `  â€¢ ðŸŒ´ ${pendingLeaves} leave request(s) pending approval\n`;
  msg += `  â€¢ ${onLeave} on leave today\n\n`;

  msg += `ðŸ“Š *Business Development*\n`;
  msg += `  â€¢ Active leads in pipeline: ${activeLeads}\n`;
  if (pipelineValue > 0) msg += `  â€¢ Estimated pipeline value: BDT ${pipelineValue.toLocaleString()}\n`;
  if (wonThisMonth > 0) msg += `  â€¢ Deals won this month: ${wonThisMonth}\n\n`;

  msg += `ðŸŽ¬ *Client Health*\n`;
  msg += `  â€¢ Active retainers: ${activeClients}\n`;
  msg += `  â€¢ Deliverables in client review: ${inReview}\n`;
  msg += `â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”`;

  return msg;
}

let _lastMorningFired = null;
let _lastEODFired = null;

function startScheduledJobs(readDB, writeDB, broadcast) {
  if (_schedulerStarted) return;
  _schedulerStarted = true;
  _schedulerWriteDB = writeDB;
  _schedulerBroadcast = broadcast;

  // Check every 60 seconds
  setInterval(async () => {
    try {
      const { h, m, bd } = getBDTime();
      const todayKey = bd.toLocaleDateString('en-CA');

      const db = await readDB();
      const owners = (db.team || []).filter(t =>
        t.accessLevel === 'Owner / Admin' && t.telegramId
      );
      if (!owners.length) return;

      // â”€â”€ Morning Briefing: 9:15 AM BD (Monâ€“Sat, skip Friday)
      if (h === 9 && m === 15 && bd.getDay() !== 5 && _lastMorningFired !== todayKey) {
        _lastMorningFired = todayKey;
        const { sendTelegramNotification } = require('./bot');
        owners.forEach(owner => {
          // Chairman (PBD-002) gets strategic board briefing; everyone else gets operational briefing
          const msg = owner.id === 'PBD-002'
            ? buildChairmanBriefing(db)
            : buildMorningBriefing(db);
          sendTelegramNotification(owner.telegramId, msg, null, true);
        });
      }

      // â”€â”€ EOD Summary: 8:00 PM BD (Monâ€“Sat, skip Friday)
      if (h === 20 && m === 0 && bd.getDay() !== 5 && _lastEODFired !== todayKey) {
        _lastEODFired = todayKey;
        const { sendTelegramNotification } = require('./bot');
        const eodMsg = buildEODSummary(db);
        owners.forEach(owner => {
          sendTelegramNotification(owner.telegramId, eodMsg, null, true);
        });
      }
    } catch (e) {
      // Silent fail â€” scheduler must never crash the server
    }
  }, 60 * 1000);
}

module.exports = {
  processAutomationEvent,
  checkScheduledSocialDispatches,
  startScheduledJobs,
  buildMorningBriefing,
  buildEODSummary,
  buildChairmanBriefing
};

