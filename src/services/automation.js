const { sendTelegramNotification } = require('./bot');

/**
 * ⚡ PURPLEOS WORKFLOW AUTOMATION ENGINE (Module C8)
 */
function processAutomationEvent(eventType, eventData, db, writeDB, broadcast) {
  if (!db) return;

  db.automationLogs = db.automationLogs || [];
  const logs = db.automationLogs;

  try {
    // TRIGGER 1: Task Stage Changed to Editing -> Notify Editor via Telegram
    if (eventType === 'task_stage_change' && eventData.stage === 'Editing') {
      const task = eventData.task;
      const assigneeName = (task.assignee || '').split(' ')[0].toLowerCase();
      const editor = (db.team || []).find(t => (t.name || '').toLowerCase().includes(assigneeName));

      const message = `🎬 *Task Ready for Editing!*\n\nProject: *${task.title}*\nClient: *${task.client}*\nPriority: *${task.priority}*\nDue: *${task.dueDate || 'Soon'}*`;

      if (editor && editor.telegramId) {
        sendTelegramNotification(editor.telegramId, message, null, true);
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

      logs.unshift({
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
        const msgText = `🎬 *Deliverable Ready for Review!*\n\nProject: *${task.title}*\nClient: *${task.client}*\n\nAccess your interactive Review Room to stream cut & leave feedback:\n🔗 ${reviewUrl}`;
        sendTelegramNotification(clientObj.telegramId, msgText, [
          [{ text: '🎬 Open Review Room', url: reviewUrl }]
        ], false);
      }

      logs.unshift({
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
        const msgText = `✅ *Payment Received & Verified!*\n\nInvoice: *${invoice.id}*\nAmount: *$${invoice.amount} USD*\nDate: *${invoice.paidDate || new Date().toISOString().split('T')[0]}*\n\nThank you for partnering with Purplebot Digital!`;
        sendTelegramNotification(clientObj.telegramId, msgText, null, false);
      }

      logs.unshift({
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

      const msgText = `✅ *SOCIAL POST APPROVED BY CLIENT*\n\n` +
        `👤 Client: *${post.clientName}*\n` +
        `📱 Platform: *${post.platform}*\n` +
        `📌 Topic: *${post.title}*\n` +
        `📅 Scheduled Date: *${post.scheduledDate} ${post.scheduledTime || ''}*\n\n` +
        `The client has approved this post. It is queued for 1-Click Dispatch.`;

      if (publisher && publisher.telegramId) {
        sendTelegramNotification(publisher.telegramId, msgText, [
          [{ text: '📱 Open Social Planner', url: portalUrl }]
        ], true);
      }

      logs.unshift({
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

      const msgText = `📱 *1-CLICK SOCIAL DISPATCH DUE NOW!*\n\n` +
        `👤 Client: *${post.clientName}*\n` +
        `📌 Platform: *${post.platform}*\n` +
        `📝 Topic: *${post.title}*\n\n` +
        `🔗 Direct Target Link:\n${targetUrl}\n\n` +
        `📲 Open 1-Click Dispatch Hub to copy caption & download media assets:`;

      const buttons = [
        [{ text: '🚀 Launch Target Page', url: targetUrl }],
        [{ text: '📋 Open 1-Click Dispatch Hub', url: portalUrl }]
      ];

      if (publisher && publisher.telegramId) {
        sendTelegramNotification(publisher.telegramId, msgText, buttons, true);
      } else {
        const owner = (db.team || []).find(t => (t.role || '').toLowerCase().includes('owner'));
        if (owner && owner.telegramId) {
          sendTelegramNotification(owner.telegramId, msgText, buttons, true);
        }
      }

      logs.unshift({
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
      const msgText = `💰 *EXPENSE TIER 1 APPROVED — READY FOR FINANCE VERIFICATION*\n\n` +
        `📋 Claim ID: *${expense.id}*\n` +
        `👤 Submitted By: *${expense.submittedBy}*\n` +
        `📂 Category: *${expense.category}*\n` +
        `💵 Amount: *BDT ${(Number(expense.amount) || 0).toLocaleString()}*\n` +
        `✍️ Line Manager: *${expense.tier1.approvedBy}*\n\n` +
        `Please review and verify budget allocation in the Finance Portal.`;

      const financeUser = (db.team || []).find(t => (t.role || '').toLowerCase().includes('finance') || (t.role || '').toLowerCase().includes('owner'));
      if (financeUser && financeUser.telegramId) {
        sendTelegramNotification(financeUser.telegramId, msgText, [
          [
            { text: '💰 Verify Tier 2', callback_data: `approve_expense_t2:${expense.id}` }
          ],
          [{ text: '🔍 Inspect in Finance Portal', url: portalUrl }]
        ], true);
      }

      logs.unshift({
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
      const msgText = `👑 *EXPENSE TIER 2 VERIFIED — AWAITING OWNER DISBURSEMENT*\n\n` +
        `📋 Claim ID: *${expense.id}*\n` +
        `👤 Submitted By: *${expense.submittedBy}*\n` +
        `📂 Category: *${expense.category}*\n` +
        `💵 Amount: *BDT ${(Number(expense.amount) || 0).toLocaleString()}*\n` +
        `✅ Tier 1 (Manager): *${expense.tier1.approvedBy}*\n` +
        `✅ Tier 2 (Finance): *${expense.tier2.approvedBy}*\n\n` +
        `Click below to approve final disbursement release.`;

      const owner = (db.team || []).find(t => (t.role || '').toLowerCase().includes('owner'));
      if (owner && owner.telegramId) {
        sendTelegramNotification(owner.telegramId, msgText, [
          [
            { text: '💸 Release Disbursement', callback_data: `disburse_expense_t3:${expense.id}` }
          ],
          [{ text: '🔍 Inspect in Admin Portal', url: portalUrl }]
        ], true);
      }

      logs.unshift({
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

      const msgText = `🎉 *EXPENSE CLAIM DISBURSED & PAID!*\n\n` +
        `📋 Claim ID: *${expense.id}*\n` +
        `💵 Amount Disbursed: *BDT ${(Number(expense.amount) || 0).toLocaleString()}*\n` +
        `📂 Category: *${expense.category}*\n` +
        `📅 Date: *${expense.disbursedAt ? expense.disbursedAt.split('T')[0] : new Date().toISOString().split('T')[0]}*\n\n` +
        `The funds have been released by agency management. Thank you!`;

      if (staff && staff.telegramId) {
        sendTelegramNotification(staff.telegramId, msgText, null, true);
      }

      logs.unshift({
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

      const icon = leave.status === 'Approved' ? '✅' : '❌';
      const msgText = `${icon} *LEAVE REQUEST ${leave.status.toUpperCase()}*\n\n` +
        `👤 Staff: *${leave.staffName}*\n` +
        `🌴 Type: *${leave.type}*\n` +
        `📅 Dates: *${leave.startDate} to ${leave.endDate}* (${leave.totalDays || 1} Days)\n` +
        `✍️ Reviewed By: *${leave.reviewedBy || 'Manager'}*\n\n` +
        `Your attendance calendar has been updated.`;

      if (staff && staff.telegramId) {
        sendTelegramNotification(staff.telegramId, msgText, null, true);
      }

      logs.unshift({
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
      const msgText = `📋 *TIME FOR YOUR DAILY EOD REPORT! (7:00 PM)*\n\n` +
        `Hello team! Please reply to this message or log into the Crew Portal with:\n` +
        `1. Tasks completed today\n` +
        `2. Tasks in progress\n` +
        `3. Blockers / help needed\n\n` +
        `🌐 Open Crew Portal: https://purpleos-iota.vercel.app/team`;

      (db.team || []).forEach(staff => {
        if (staff.telegramId) {
          sendTelegramNotification(staff.telegramId, msgText, [
            [{ text: '📋 Submit EOD in Portal', url: 'https://purpleos-iota.vercel.app/team' }]
          ], true);
        }
      });

      logs.unshift({
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

      const msgText = `🔧 *SUPPORT TICKET RESOLVED!*\n\n` +
        `🎫 Ticket ID: *${ticket.id}*\n` +
        `📂 Category: *${ticket.category}*\n` +
        `📌 Title: *${ticket.title}*\n` +
        `✅ Status: *Resolved*\n` +
        `✍️ Resolved By: *${ticket.resolvedBy || 'Maintenance Lead'}*\n\n` +
        `Your support ticket has been closed.`;

      if (staff && staff.telegramId) {
        sendTelegramNotification(staff.telegramId, msgText, null, true);
      }

      logs.unshift({
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

      const msgText = `☀️ *PURPLEBOT 9:00 AM MORNING EXECUTIVE BRIEFING*\n` +
        `📅 Date: *${todayStr}*\n\n` +
        `🎬 *Active Campaigns & Shoots:* ${openTasks} Open Workflows\n` +
        `👥 *Team Capacity:* ${activeStaff} Specialists Active\n` +
        `🧾 *Pending Approvals:* ${pendingExp} Expense Claims Awaiting Release\n` +
        `📱 *Social Dispatches:* Check 1-Click Social Dispatch Hub\n\n` +
        `🌐 Open Admin Dashboard: https://purpleos-iota.vercel.app/admin`;

      const leaders = (db.team || []).filter(t => (t.role || '').toLowerCase().includes('director') || (t.role || '').toLowerCase().includes('founder') || (t.role || '').toLowerCase().includes('owner'));
      leaders.forEach(l => {
        if (l.telegramId) sendTelegramNotification(l.telegramId, msgText, null, true);
      });

      logs.unshift({
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

      const msgText = `🌙 *PURPLEBOT 8:30 PM EVENING EXECUTIVE DIGEST*\n\n` +
        `📊 *Financial Summary:*\n` +
        `  • Total Revenue Collected: *$${paidRev.toLocaleString()} USD*\n` +
        `  • Disbursed Operational Expenses: *BDT ${disbursedExp.toLocaleString()}*\n\n` +
        `📋 *Team EOD Submission Rate:* ${eodCount} Reports Logged Today\n` +
        `🔧 *Active Support Tickets:* ${openTickets} Open Ticket(s)\n\n` +
        `_Generated automatically by PurpleOS Core_`;

      const leaders = (db.team || []).filter(t => (t.role || '').toLowerCase().includes('director') || (t.role || '').toLowerCase().includes('founder') || (t.role || '').toLowerCase().includes('owner'));
      leaders.forEach(l => {
        if (l.telegramId) sendTelegramNotification(l.telegramId, msgText, null, true);
      });

      logs.unshift({
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

      const msgText = `📈 *PURPLEBOT WEEKLY EXECUTIVE KPI SUMMARY*\n\n` +
        `💰 Total Portfolio Revenue: *$${totalRev.toLocaleString()} USD*\n` +
        `🏢 Active Brand Retainers: *${clientCount} Clients*\n` +
        `🚀 Total Campaign Workflows: *${taskCount} Production Shoots*\n\n` +
        `Check full BI Analytics tab on Admin Portal.`;

      const owner = (db.team || []).find(t => (t.role || '').toLowerCase().includes('owner') || (t.role || '').toLowerCase().includes('founder'));
      if (owner && owner.telegramId) {
        sendTelegramNotification(owner.telegramId, msgText, null, true);
      }

      logs.unshift({
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

      const prefix = urgent ? '🚨 *URGENT TEAM BROADCAST NOTICE*' : '📢 *TEAM BROADCAST NOTICE*';
      const msgText = `${prefix}\n` +
        `📌 *Title:* ${title || 'Notice'}\n` +
        `👤 *From:* ${senderName || 'Agency Leadership'}\n\n` +
        `${message}\n\n` +
        `🌐 Open Crew Portal: https://purpleos-iota.vercel.app/team`;

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

      logs.unshift({
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

        const msgText = `☀️ *GOOD MORNING ${staff.name.toUpperCase()}!*\n` +
          `🎯 *YOUR DAILY ACTION PLAN & TASK BRIEFING (9:00 AM)*\n\n` +
          `📋 *Assigned Tasks & Deliverables:*\n${taskListText}\n\n` +
          `⏰ Please remember to clock in when starting studio work.\n` +
          `🌐 Open Crew Portal: https://purpleos-iota.vercel.app/team`;

        if (staff.telegramId) {
          sendTelegramNotification(staff.telegramId, msgText, [
            [{ text: '🟢 Clock In Studio', url: 'https://purpleos-iota.vercel.app/team' }]
          ], true);
        }
      });

      logs.unshift({
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

      const msgText = `💰 *NEW EXPENSE CLAIM SUBMITTED (TIER 1 PENDING)*\n\n` +
        `📋 Claim ID: *${expense.id}*\n` +
        `👤 Submitted By: *${expense.submittedBy}*\n` +
        `📂 Category: *${expense.category}*\n` +
        `💵 Amount: *BDT ${(Number(expense.amount) || 0).toLocaleString()}*\n` +
        `📝 Note: *${expense.description || 'Field operational expense'}*\n\n` +
        `Click below to approve Tier 1 or inspect in Manager Portal.`;

      if (targetManager && targetManager.telegramId) {
        sendTelegramNotification(targetManager.telegramId, msgText, [
          [{ text: '✅ Approve T1 (Manager)', callback_data: `approve_expense_t1:${expense.id}` }],
          [{ text: '🔍 Inspect in Manager Portal', url: `https://purpleos-iota.vercel.app/manager` }]
        ], true);
      }

      logs.unshift({
        id: `LOG-${Date.now()}`,
        rule: 'AUT-019 (Expense Submitted Alert)',
        event: eventType,
        target: `${expense.submittedBy} - ${expense.id}`,
        status: 'Executed',
        timestamp: new Date().toISOString()
      });
    }

    // TRIGGER 20: New Leave Request Submitted -> Alert Line Manager (AUT-020)
    if (eventType === 'leave_submitted') {
      const leave = eventData.leave;
      const staffName = (leave.staffName || '').split(' ')[0].toLowerCase();
      const staffObj = (db.team || []).find(t => (t.name || '').toLowerCase().includes(staffName));

      const targetManager = (staffObj && staffObj.reportsTo)
        ? (db.team || []).find(t => t.id === staffObj.reportsTo)
        : (db.team || []).find(t => (t.role || '').toLowerCase().includes('managing director') || t.id === 'PBD-001');

      const msgText = `🌴 *NEW LEAVE REQUEST SUBMITTED (PENDING MANAGER REVIEW)*\n\n` +
        `📋 Leave ID: *${leave.id}*\n` +
        `👤 Staff: *${leave.staffName}*\n` +
        `🌴 Type: *${leave.type}*\n` +
        `📅 Dates: *${leave.startDate} to ${leave.endDate}* (${leave.totalDays || 1} Days)\n` +
        `📝 Reason: *${leave.reason}*\n\n` +
        `Click below to review leave request.`;

      const targetId = targetManager?.telegramId || '1708459008';
      sendTelegramNotification(targetId, msgText, [
        [
          { text: '✅ Approve Leave', callback_data: `approve_leave:${leave.id}` },
          { text: '❌ Reject Leave', callback_data: `reject_leave:${leave.id}` }
        ],
        [{ text: '🔍 Inspect in Manager Portal', url: `https://purpleos-iota.vercel.app/manager` }]
      ], true);

      logs.unshift({
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
      const owner = (db.team || []).find(t => (t.role || '').toLowerCase().includes('owner')) || (db.team || []).find(t => t.id === 'EMP-007');

      const msgText = `👑 *LEAVE MANAGER APPROVED — AWAITING OWNER FINAL SIGN-OFF*\n\n` +
        `📋 Leave ID: *${leave.id}*\n` +
        `👤 Staff: *${leave.staffName}*\n` +
        `🌴 Type: *${leave.type}*\n` +
        `📅 Dates: *${leave.startDate} to ${leave.endDate}*\n` +
        `✍️ Manager Approved By: *${leave.managerReviewedBy || 'Line Manager'}*\n\n` +
        `Click below to issue final leave sign-off.`;

      const targetId = owner?.telegramId || '1708459008';
      sendTelegramNotification(targetId, msgText, [
        [
          { text: '👑 Final Leave Sign-off', callback_data: `approve_leave_owner:${leave.id}` }
        ],
        [{ text: '🔍 Inspect in Admin Portal', url: `https://purpleos-iota.vercel.app/admin` }]
      ], true);

      logs.unshift({
        id: `LOG-${Date.now()}`,
        rule: 'Leave Manager Approved Alert',
        event: eventType,
        target: `${leave.staffName} (${leave.id})`,
        status: 'Executed',
        timestamp: new Date().toISOString()
      });
    }

    // TRIGGER: Individual EOD Report Submitted -> Notify Manager & MD
    if (eventType === 'eod_submitted') {
      const eod = eventData.eod;
      const staffObj = (db.team || []).find(t => t.name === eod.staffName) || (db.team || [])[0];
      const dept = staffObj?.department || 'Operations';

      const lineManager = (db.team || []).find(t => (t.department || '').toLowerCase() === dept.toLowerCase() && (t.accessLevel || '').includes('Manager'));
      const owner = (db.team || []).find(t => (t.role || '').toLowerCase().includes('managing director') || t.id === 'PBD-001') || (db.team || [])[0];

      const msgText = `📋 *NEW EOD REPORT LOGGED*\n\n` +
        `👤 Staff: *${eod.staffName}* (${dept})\n` +
        `✅ *Completed:* ${eod.tasksCompleted}\n` +
        `⏳ *In Progress:* ${eod.tasksInProgress}\n` +
        `🚧 *Blockers:* ${eod.blockers}\n\n` +
        `Submitted at ${new Date(eod.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

      if (lineManager && lineManager.telegramId) {
        sendTelegramNotification(lineManager.telegramId, msgText, null, true);
      }
      if (owner && owner.telegramId && owner.telegramId !== lineManager?.telegramId) {
        sendTelegramNotification(owner.telegramId, msgText, null, true);
      }

      logs.unshift({
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
        const msgText = `📋 *PURPLEBOT 7:30 PM DEPARTMENT EOD DIGEST*\n` +
          `📍 Department: *${dept}*\n\n` +
          `✅ *Reports Logged Today:* ${todayEods.length} Submissions\n` +
          `🔴 *Blockers Flagged:* ${blockersCount} Action Item(s)\n\n` +
          `🌐 Open Manager Portal: https://purpleos-iota.vercel.app/manager`;

        const targetId = mgr.telegramId || '1708459008';
        sendTelegramNotification(targetId, msgText, null, true);
      });

      logs.unshift({
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

module.exports = {
  processAutomationEvent,
  checkScheduledSocialDispatches
};
