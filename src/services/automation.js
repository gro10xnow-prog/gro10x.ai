const { broadcast: defaultBroadcast } = require('./sse');
const { supabase, isSupabaseConfigured } = require('./supabase');

// Break circular dependency cleanly via lazy loader
function getSendTelegram() {
  try {
    const botMod = require('./bot');
    if (botMod && typeof botMod.sendTelegramNotification === 'function') {
      return botMod.sendTelegramNotification;
    }
  } catch (e) {}
  return (() => Promise.resolve());
}

function recordAutomationLog(db, logEntry) {
  db.automationLogs = db.automationLogs || [];
  db.automationLogs.unshift(logEntry);

  try {
    if (isSupabaseConfigured && isSupabaseConfigured()) {
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
 * Find a team member by employee_id/emp_code first, then fall back to name matching.
 * Avoids silent delivery failures from name collisions or nicknames.
 */
function findStaffMember(db, { employeeId, empCode, name } = {}) {
  const team = db?.team || [];
  const targetId = employeeId || empCode;
  if (targetId) {
    const byId = team.find(t => t.id === targetId || t.emp_code === targetId || t.empCode === targetId);
    if (byId) return byId;
  }
  if (name) {
    const cleanName = name.trim().toLowerCase();
    const exact = team.find(t => (t.name || '').toLowerCase() === cleanName);
    if (exact) return exact;
    const firstName = cleanName.split(' ')[0];
    if (firstName && firstName.length > 1) {
      const byFirst = team.find(t => (t.name || '').toLowerCase().includes(firstName));
      if (byFirst) return byFirst;
    }
  }
  return null;
}

/**
 * ⚡ PURPLEOS WORKFLOW AUTOMATION ENGINE (Module C8)
 */
function processAutomationEvent(eventType, eventData, db, writeDB, broadcast) {
  const sendTelegramNotification = getSendTelegram();
  if (!db) return;

  const effectiveBroadcast = (typeof broadcast === 'function' ? broadcast : defaultBroadcast) || (() => {});
  const effectiveWriteDB = (typeof writeDB === 'function' ? writeDB : () => {});
  broadcast = effectiveBroadcast;
  writeDB = effectiveWriteDB;

  try {
    // TRIGGER 1: Task Stage Changed to Editing -> Notify Editor via Telegram
    if (eventType === 'task_stage_change' && eventData.stage === 'Editing') {
      const task = eventData.task;
      const editor = findStaffMember(db, { employeeId: task.assignee_id || task.assigneeId, name: task.assignee });

      const message = `🎬 *Task Ready for Editing!*\n\nProject: *${task.title}*\nClient: *${task.client}*\nPriority: *${task.priority}*\nDue: *${task.dueDate || 'Soon'}*`;

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

    // TRIGGER 1.1: Task QC Rejected -> Notify Assignee with feedback
    if (eventType === 'task_qc_rejected') {
      const task = eventData.task || eventData;
      const feedback = eventData.feedback || task.qc_feedback || task.feedback || 'Please check feedback notes in task board.';
      const assignee = findStaffMember(db, { employeeId: task.assignee_id || task.assigneeId, name: task.assignee });

      const message = `⚠️ *Task QC Revision Required!*\n\nProject: *${task.title}*\nClient: *${task.client}*\nFeedback: _${feedback}_\n\nPlease update your deliverable cut and re-submit for review.`;

      if (assignee && assignee.telegramId) {
        sendTelegramNotification(assignee.telegramId, message, [
          [{ text: '📋 View Task in Crew Portal', url: 'https://gro10x-ai.vercel.app/crew#tasks' }]
        ], true);
      }

      recordAutomationLog(db, {
        id: `LOG-${Date.now()}`,
        rule: 'AUT-001.1 (QC Rejection Alert)',
        event: eventType,
        target: task.title,
        status: 'Executed',
        timestamp: new Date().toISOString()
      });
    }

    // TRIGGER 1.2: Task Reassigned -> Notify New Assignee
    if (eventType === 'task_reassigned') {
      const task = eventData.task || eventData;
      const newAssigneeName = eventData.newAssignee || task.assignee;
      const newAssignee = findStaffMember(db, { employeeId: task.assignee_id || task.assigneeId, name: newAssigneeName });

      const message = `📋 *Task Assigned to You!*\n\nProject: *${task.title}*\nClient: *${task.client}*\nPriority: *${task.priority || 'Normal'}*\nStage: *${task.stage || 'Briefing'}*\nDue: *${task.dueDate || task.due_date || 'TBD'}*`;

      if (newAssignee && newAssignee.telegramId) {
        sendTelegramNotification(newAssignee.telegramId, message, [
          [{ text: '📋 View Task in Crew Portal', url: 'https://gro10x-ai.vercel.app/crew#tasks' }]
        ], true);
      }

      recordAutomationLog(db, {
        id: `LOG-${Date.now()}`,
        rule: 'AUT-001.2 (Task Reassignment Alert)',
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

    // TRIGGER 3: Task Stage Changed to "Client Review" -> Direct notification to Client Rep with Review Room deep link
    if (eventType === 'task_stage_change' && eventData.stage === 'Client Review') {
      const task = eventData.task;
      const clientObj = (db.clients || []).find(c => (c.name || '').toLowerCase().includes((task.client || '').toLowerCase()));
      const targetTelegramId = clientObj?.telegramId || clientObj?.telegram_id;

      if (targetTelegramId) {
        const BASE_URL = process.env.BASE_URL || 'https://gro10x-ai.vercel.app';
        const reviewId = eventData.reviewId || null;
        const reviewUrl = `${BASE_URL}/client#review`;
        const msgText = `🎬 *Deliverable Ready for Review!*\n\nProject: *${task.title}*\nClient: *${task.client}*\n\nYour creative deliverable cut is ready. Stream the cut, leave timecoded feedback, and sign off:\n🔗 ${reviewUrl}`;
        sendTelegramNotification(targetTelegramId, msgText, [
          [{ text: '🎬 Open Review Room', url: reviewUrl }]
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

    // TRIGGER: Client approved creative deliverable -> Notify production team
    if (eventType === 'review_approved') {
      const { projectName, clientName, taskId, approvedBy } = eventData;
      const productionTeamChatId = process.env.TELEGRAM_PRODUCTION_CHAT_ID || process.env.TELEGRAM_GROUP_CHAT_ID;
      if (productionTeamChatId) {
        const msgText = `✅ *Client Approved Deliverable!*\n\nProject: *${projectName}*\nClient: *${clientName}*\nApproved By: *${approvedBy || 'Client'}*\n${taskId ? `Linked Task: ${taskId} → Stage set to Approved` : ''}\n\nInvoice release triggered. 🎉`;
        sendTelegramNotification(productionTeamChatId, msgText, [], true);
      }

      recordAutomationLog(db, {
        id: `LOG-${Date.now()}`,
        rule: 'AUT-009 (Review Room Approval Cascade)',
        event: eventType,
        target: projectName,
        status: 'Executed',
        timestamp: new Date().toISOString()
      });
    }

    // TRIGGER: Client requested revisions -> Alert production lead
    if (eventType === 'review_revision_requested') {
      const { projectName, clientName, revisionNotes, requestedBy } = eventData;
      const productionTeamChatId = process.env.TELEGRAM_PRODUCTION_CHAT_ID || process.env.TELEGRAM_GROUP_CHAT_ID;
      if (productionTeamChatId) {
        const msgText = `🔴 *Client Requested Revisions!*\n\nProject: *${projectName}*\nClient: *${clientName}*\nRequested By: *${requestedBy || 'Client'}*\n\n📝 Revision Notes:\n"${revisionNotes}"\n\nPlease review feedback and update the deliverable.`;
        sendTelegramNotification(productionTeamChatId, msgText, [], true);
      }

      recordAutomationLog(db, {
        id: `LOG-${Date.now()}`,
        rule: 'AUT-010 (Review Room Revision Request)',
        event: eventType,
        target: projectName,
        status: 'Executed',
        timestamp: new Date().toISOString()
      });
    }

    // TRIGGER 4: Invoice Marked Paid -> Notify Client via Telegram
    if (eventType === 'invoice_paid') {
      const invoice = eventData.invoice || {};
      const invClientId = invoice.clientId || invoice.client_id;
      const invClientName = (invoice.clientName || invoice.client_name || '').toLowerCase();
      const clientObj = (db.clients || []).find(c => (invClientId && c.id === invClientId) || (invClientName && (c.name || '').toLowerCase().includes(invClientName)));
      const clientTg = clientObj?.telegramId || clientObj?.telegram_id;

      if (clientTg) {
        const msgText = `✅ *Payment Received & Verified!*\n\nInvoice: *${invoice.id}*\nAmount: *BDT ${Number(invoice.amount || 0).toLocaleString()}*\nDate: *${invoice.paidDate || invoice.paid_date || new Date().toISOString().split('T')[0]}*\n\nThank you for partnering with GRO10X AI Agency!`;
        sendTelegramNotification(clientTg, msgText, null, false);
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
      const post = eventData.post || {};
      const publisherName = (post.assignedPublisher || post.assigned_publisher || '').split(' ')[0].toLowerCase();
      const publisher = (db.team || []).find(t => (t.name || '').toLowerCase().includes(publisherName));
      const pubTg = publisher?.telegramId || publisher?.telegram_id;
      const portalUrl = `https://gro10x-ai.vercel.app/admin?tab=social`;

      const msgText = `✅ *SOCIAL POST APPROVED BY CLIENT*\n\n` +
        `👤 Client: *${post.clientName || post.client_name || 'Client'}*\n` +
        `📱 Platform: *${post.platform}*\n` +
        `📌 Topic: *${post.title || post.caption || 'Post Asset'}*\n` +
        `📅 Scheduled Date: *${post.scheduledDate || post.scheduled_date || 'Scheduled'} ${post.scheduledTime || post.scheduled_time || ''}*\n\n` +
        `The client has approved this post. It is queued for 1-Click Dispatch.`;

      if (pubTg) {
        sendTelegramNotification(pubTg, msgText, [
          [{ text: '📱 Open Social Planner', url: portalUrl }]
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
      const portalUrl = `https://gro10x-ai.vercel.app/admin?tab=social&dispatchId=${post.id}`;
      const targetUrl = post.targetUrl || 'https://facebook.com';

      const msgText = `📱 *1-CLICK SOCIAL DISPATCH DUE NOW!*\n\n` +
        `👤 Client: *${post.clientName}*\n` +
        `📌 Platform: *${post.platform}*\n` +
        `📌 Topic: *${post.title}*\n\n` +
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
      const expense = eventData.expense || eventData || {};
      const portalUrl = `https://gro10x-ai.vercel.app/admin?tab=expenses&expenseId=${expense.id || ''}`;
      const lineManager = expense.tier1?.approvedBy || expense.approvedBy || 'Line Manager';
      const msgText = `💰 *EXPENSE TIER 1 APPROVED — READY FOR FINANCE VERIFICATION*\n\n` +
        `📋 Claim ID: *${expense.id || 'N/A'}*\n` +
        `👤 Submitted By: *${expense.submittedBy || expense.employeeName || 'Team Member'}*\n` +
        `📁 Category: *${expense.category || 'Expense'}*\n` +
        `💵 Amount: *BDT ${(Number(expense.amount) || 0).toLocaleString()}*\n` +
        `✍️ Line Manager: *${lineManager}*\n\n` +
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
      const portalUrl = `https://gro10x-ai.vercel.app/admin?tab=expenses&expenseId=${expense.id}`;
      const msgText = `👑 *EXPENSE TIER 2 VERIFIED — AWAITING OWNER DISBURSEMENT*\n\n` +
        `📋 Claim ID: *${expense.id}*\n` +
        `👤 Submitted By: *${expense.submittedBy}*\n` +
        `📁 Category: *${expense.category}*\n` +
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

      // Large expense threshold — BDT 25,000+ triggers Chairman notification
      const LARGE_EXP_THRESHOLD = 25000;
      if (Number(expense.amount) >= LARGE_EXP_THRESHOLD) {
        const chairman = (db.team || []).find(t => t.id === 'PBD-002');
        if (chairman?.telegramId) {
          sendTelegramNotification(chairman.telegramId,
            `⚠️ *Large Expense — Chairman Oversight*\n\n` +
            `• Claim ID: *${expense.id}*\n` +
            `• By: *${expense.submittedBy}*\n` +
            `• Category: *${expense.category}*\n` +
            `• Amount: *BDT ${Number(expense.amount).toLocaleString()}* _(above BDT 25,000 threshold)_\n` +
            `• Tier 1 ✅  Tier 2 ✅  Awaiting Owner disbursement\n\n` +
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
      const staff = findStaffMember(db, {
        employeeId: expense.submitted_by_id || expense.employee_id || expense.submittedById || expense.employeeId,
        name: expense.submittedBy || expense.loggedBy || expense.submitted_by
      });

      const msgText = `🎉 *EXPENSE CLAIM DISBURSED & PAID!*\n\n` +
        `📋 Claim ID: *${expense.id}*\n` +
        `💵 Amount Disbursed: *BDT ${(Number(expense.amount) || 0).toLocaleString()}*\n` +
        `📁 Category: *${expense.category}*\n` +
        `📅 Date: *${expense.disbursedAt ? expense.disbursedAt.split('T')[0] : new Date().toISOString().split('T')[0]}*\n\n` +
        `The funds have been released by agency management. Thank you!`;

      if (staff && staff.telegramId) {
        sendTelegramNotification(staff.telegramId, msgText, null, true);
      }

      recordAutomationLog(db, {
        id: `LOG-${Date.now()}`,
        rule: 'AUT-010 (Expense Disbursed Alert)',
        event: eventType,
        target: `${expense.submittedBy || expense.submitted_by || 'Staff'} - ${expense.id}`,
        status: 'Executed',
        timestamp: new Date().toISOString()
      });
    }

    // TRIGGER 10: Leave Request Decision Alert (AUT-011)
    if (eventType === 'leave_decision') {
      const leave = eventData.leave;
      const staff = findStaffMember(db, {
        employeeId: leave.employee_id || leave.employeeId || leave.staffId,
        name: leave.staffName || leave.employeeName || leave.employee_name
      });

      const icon = leave.status === 'Approved' ? '✅' : '❌';
      const msgText = `${icon} *LEAVE REQUEST ${leave.status.toUpperCase()}*\n\n` +
        `👤 Staff: *${leave.staffName || leave.employeeName || 'Staff'}*\n` +
        `🌴 Type: *${leave.type || leave.leaveType || 'Leave'}*\n` +
        `📅 Dates: *${leave.startDate || leave.start_date} to ${leave.endDate || leave.end_date}* (${leave.totalDays || leave.total_days || 1} Days)\n` +
        `✍️ Reviewed By: *${leave.reviewedBy || leave.reviewed_by || 'Manager'}*\n\n` +
        `Your attendance calendar has been updated.`;

      if (staff && staff.telegramId) {
        sendTelegramNotification(staff.telegramId, msgText, null, true);
      }

      recordAutomationLog(db, {
        id: `LOG-${Date.now()}`,
        rule: 'AUT-011 (Leave Decision Alert)',
        event: eventType,
        target: `${leave.staffName || leave.employeeName || 'Staff'} (${leave.status})`,
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
        `🌐 Open Crew Portal: https://gro10x-ai.vercel.app/team`;

      (db.team || []).forEach(staff => {
        if (staff.telegramId) {
          sendTelegramNotification(staff.telegramId, msgText, [
            [{ text: '📋 Submit EOD in Portal', url: 'https://gro10x-ai.vercel.app/team' }]
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
      const staff = findStaffMember(db, {
        employeeId: ticket.submitted_by_id || ticket.submittedById || ticket.employee_id || ticket.employeeId,
        name: ticket.loggedBy || ticket.logged_by || ticket.submittedBy
      });

      let targetTelegramId = staff?.telegramId;
      if (!targetTelegramId && db.clients) {
        const clientObj = (db.clients || []).find(c =>
          c.id === ticket.client_id || c.id === ticket.clientId ||
          (c.name && (ticket.submitted_by || ticket.submittedBy || '').toLowerCase().includes(c.name.toLowerCase()))
        );
        if (clientObj?.telegramId || clientObj?.telegram_id) {
          targetTelegramId = clientObj.telegramId || clientObj.telegram_id;
        }
      }

      const msgText = `🔧 *SUPPORT TICKET RESOLVED!*\n\n` +
        `🎫 Ticket ID: *${ticket.id}*\n` +
        `📁 Category: *${ticket.category || 'General'}*\n` +
        `📌 Title: *${ticket.title}*\n` +
        `✅ Status: *Resolved*\n` +
        `✍️ Resolved By: *${ticket.resolvedBy || ticket.resolved_by || 'Support Lead'}*\n\n` +
        `Your support ticket has been closed.`;

      if (targetTelegramId) {
        sendTelegramNotification(targetTelegramId, msgText, null, true);
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

      const msgText = `☀️ *GRO10X 9:00 AM MORNING EXECUTIVE BRIEFING*\n` +
        `📅 Date: *${todayStr}*\n\n` +
        `🎬 *Active Campaigns & Workflows:* ${openTasks} Open Workflows\n` +
        `👥 *Team Capacity:* ${activeStaff} Specialists Active\n` +
        `🧾 *Pending Approvals:* ${pendingExp} Expense Claims Awaiting Release\n` +
        `📱 *Social Dispatches:* Check 1-Click Social Dispatch Hub\n\n` +
        `🌐 Open Admin Dashboard: https://gro10x-ai.vercel.app/admin`;

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

      const msgText = `🌙 *GRO10X 8:30 PM EVENING EXECUTIVE DIGEST*\n\n` +
        `📊 *Financial Summary:*\n` +
        `  • Total Revenue Collected: *BDT ${paidRev.toLocaleString()}*\n` +
        `  • Disbursed Operational Expenses: *BDT ${disbursedExp.toLocaleString()}*\n\n` +
        `📋 *Team EOD Submission Rate:* ${eodCount} Reports Logged Today\n` +
        `🔧 *Active Support Tickets:* ${openTickets} Open Ticket(s)\n\n` +
        `_Generated automatically by GRO10X OS Core_`;

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

      const msgText = `📈 *GRO10X WEEKLY EXECUTIVE KPI SUMMARY*\n\n` +
        `💰 Total Portfolio Revenue: *BDT ${totalRev.toLocaleString()}*\n` +
        `🏢 Active Brand Retainers: *${clientCount} Clients*\n` +
        `🚀 Total Campaign Workflows: *${taskCount} Production Shoots*\n\n` +
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

    // TRIGGER: Invoice Due Reminder -> Notify Client via Client Bot
    if (eventType === 'invoice_due_reminder') {
      const invoice = eventData.invoice || {};
      const invClientId = invoice.clientId || invoice.client_id;
      const client = (db.clients || []).find(c => (invClientId && c.id === invClientId) || (invoice.clientName && c.name && c.name.toLowerCase().includes(invoice.clientName.toLowerCase())));
      const clientTg = client?.telegramId || client?.telegram_id;

      if (clientTg) {
        const msgText = `💳 *INVOICE DUE REMINDER*\n\n` +
          `Dear *${client.name || 'Brand Partner'}*,\n` +
          `Invoice *${invoice.id || 'INV'}* of *BDT ${(Number(invoice.amount) || 0).toLocaleString()}* is due on *${invoice.dueDate || invoice.due_date || 'Soon'}*.\n\n` +
          `To complete payment and upload transaction proof, please open your Client Portal below.`;
        sendTelegramNotification(clientTg, msgText, [
          [{ text: '💳 Open Client Portal', url: 'https://gro10x-ai.vercel.app/client#invoices' }]
        ], false);
      }

      recordAutomationLog(db, {
        id: `LOG-${Date.now()}`,
        rule: 'AUT-005 (Invoice Due Reminder)',
        event: eventType,
        target: `${invoice.id || 'INV'} (${client?.name || 'Client'})`,
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
        `🌐 Open Crew Portal: https://gro10x-ai.vercel.app/team`;

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
      const crewOnly = (db.team || []).filter(staff => {
        const role = (staff.role || staff.position || '').toLowerCase();
        const access = (staff.accessLevel || staff.access_level || '').toLowerCase();
        const isLeadership = ['owner', 'founder', 'ceo', 'chairman', 'managing director', 'finance manager', 'head of'].some(kw => role.includes(kw) || access.includes(kw));
        return !isLeadership;
      });

      crewOnly.forEach(staff => {
        const firstName = staff.name.split(' ')[0].toLowerCase();
        const staffTasks = (db.tasks || []).filter(t => {
          if (t.assignees && Array.isArray(t.assignees)) {
            return t.assignees.some(a => a.toLowerCase().includes(firstName));
          }
          return (t.assignee || '').toLowerCase().includes(firstName) || 
                 (t.assignee_id && (t.assignee_id === staff.id || t.assignee_id === staff.emp_code));
        });

        let taskListText = 'No specific deliverables assigned for today.';
        if (staffTasks.length > 0) {
          taskListText = staffTasks.map((t, idx) => `${idx + 1}. *${t.title}* (${t.client || 'Internal'})\n   Stage: ${t.stage} | Deadline: ${t.dueDate || t.due_date || 'Today'}`).join('\n');
        }

        const msgText = `☀️ *GOOD MORNING ${staff.name.toUpperCase()}!*\n` +
          `🎯 *YOUR DAILY ACTION PLAN & TASK BRIEFING (9:00 AM)*\n\n` +
          `📋 *Assigned Tasks & Deliverables:*\n${taskListText}\n\n` +
          `⏰ Please remember to clock in when starting studio work.\n` +
        `🌐 Open Crew Portal: https://gro10x-ai.vercel.app/team`;

        if (staff.telegramId) {
          sendTelegramNotification(staff.telegramId, msgText, [
            [{ text: '🟢 Clock In Studio', url: 'https://gro10x-ai.vercel.app/team' }]
          ], true);
        }
      });

      recordAutomationLog(db, {
        id: `LOG-${Date.now()}`,
        rule: 'AUT-018 (Specialist Personal Daily Task Briefing)',
        event: eventType,
        target: 'Crew Specialists',
        status: 'Executed',
        timestamp: new Date().toISOString()
      });
    }

    // TRIGGER 19: New Expense Claim Submitted -> Alert Line Manager (AUT-019)
    if (eventType === 'expense_submitted') {
      const expense = eventData?.expense || eventData || {};
      const staffObj = findStaffMember(db, { employeeId: expense.employeeId || expense.emp_code || expense.empCode, name: expense.submittedBy || expense.loggedBy });
      
      const owner = (db.team || []).find(t => (t.role || '').toLowerCase().includes('founder') || (t.role || '').toLowerCase().includes('director') || (t.accessLevel || '').toLowerCase().includes('admin'));
      const targetId = (staffObj && staffObj.reportsTo ? (db.team || []).find(t => t.id === staffObj.reportsTo)?.telegramId : null) || owner?.telegramId || process.env.OWNER_TELEGRAM_ID;

      const msgText = `💰 *NEW EXPENSE CLAIM SUBMITTED (PENDING APPROVAL)*\n\n` +
        `📋 Claim ID: *${expense.id || 'EXP-NEW'}*\n` +
        `👤 Submitted By: *${expense.submittedBy || expense.loggedBy || 'Staff Member'}*\n` +
        `📁 Category: *${expense.category || 'General'}*\n` +
        `💵 Amount: *BDT ${(Number(expense.amount) || 0).toLocaleString()}*\n` +
        `📝 Note: *${expense.description || 'Field operational expense'}*\n\n` +
        `Click below to approve and release payment.`;

      if (targetId) {
        sendTelegramNotification(targetId, msgText, [
          [{ text: '💸 Approve & Disburse', callback_data: `disburse_expense_t3:${expense.id}` }],
          [{ text: '🔍 Inspect in Admin Portal', url: `https://gro10x-ai.vercel.app/admin` }]
        ], true);
      }

      recordAutomationLog(db, {
        id: `LOG-${Date.now()}`,
        rule: 'AUT-019 (Expense Submitted Alert)',
        event: eventType,
        target: `${expense.submittedBy || expense.loggedBy || 'Staff'} - ${expense.id}`,
        status: 'Executed',
        timestamp: new Date().toISOString()
      });
    }

    // TRIGGER 19.1: Expense Tier 1 Approved -> Fast-track to Owner
    if (eventType === 'expense_tier1_approved') {
      const expense = eventData?.expense || eventData || {};
      const amt = Number(expense.amount) || 0;
      expense.status = 'Tier 2 Approved';

      const owner = (db.team || []).find(t => (t.role || '').toLowerCase().includes('founder') || (t.role || '').toLowerCase().includes('director') || (t.accessLevel || '').toLowerCase().includes('admin'));
      const targetId = owner?.telegramId || process.env.OWNER_TELEGRAM_ID;

      const msgText = `💰 *EXPENSE CLAIM VERIFIED — READY FOR DISBURSEMENT*\n\n` +
        `📋 Claim ID: *${expense.id || 'EXP-NEW'}*\n` +
        `👤 Submitted By: *${expense.submittedBy || expense.loggedBy || 'Staff Member'}*\n` +
        `💵 Amount: *BDT ${amt.toLocaleString()}*\n\n` +
        `Click below to release electronic disbursement.`;

      if (targetId) {
        sendTelegramNotification(targetId, msgText, [
          [{ text: '💸 Release Disbursement', callback_data: `disburse_expense_t3:${expense.id}` }],
          [{ text: '🔍 Inspect in Admin Portal', url: `https://gro10x-ai.vercel.app/admin` }]
        ], true);
      }
    }

    // TRIGGER 19.2: Expense Tier 1.5 Approved -> Route to Owner
    if (eventType === 'expense_tier1_5_approved') {
      const expense = eventData.expense;
      expense.status = 'Tier 2 Approved';

      const owner = (db.team || []).find(t => (t.role || '').toLowerCase().includes('founder') || (t.role || '').toLowerCase().includes('director') || (t.accessLevel || '').toLowerCase().includes('admin'));
      const targetId = owner?.telegramId || process.env.OWNER_TELEGRAM_ID;

      const msgText = `💰 *EXPENSE OPS APPROVED — READY FOR DISBURSEMENT*\n\n` +
        `📋 Claim ID: *${expense.id}*\n` +
        `👤 Submitted By: *${expense.submittedBy}*\n` +
        `💵 Amount: *BDT ${(Number(expense.amount) || 0).toLocaleString()}*\n\n` +
        `Click below to release electronic disbursement.`;

      if (targetId) {
        sendTelegramNotification(targetId, msgText, [
          [{ text: '💸 Release Disbursement', callback_data: `disburse_expense_t3:${expense.id}` }],
          [{ text: '🔍 Inspect in Admin Portal', url: `https://gro10x-ai.vercel.app/admin` }]
        ], true);
      }
    }

    // TRIGGER 20: New Leave Request Submitted -> Alert Founder / Admin (AUT-020)
    if (eventType === 'leave_submitted') {
      const leave = eventData.leave || eventData || {};
      const staffRaw = leave.staffName || leave.employeeName || leave.employee_name || 'Staff';
      const staffName = staffRaw.split(' ')[0].toLowerCase();
      const staffObj = (db.team || []).find(t => (t.name || '').toLowerCase().includes(staffName));

      const owner = (db.team || []).find(t => (t.role || '').toLowerCase().includes('founder') || (t.role || '').toLowerCase().includes('director') || (t.accessLevel || '').toLowerCase().includes('admin'));
      const targetManager = (staffObj && staffObj.reportsTo ? (db.team || []).find(t => t.id === staffObj.reportsTo) : null) || owner || { telegramId: process.env.OWNER_TELEGRAM_ID };

      const msgText = `🌴 *NEW LEAVE REQUEST SUBMITTED (PENDING MANAGER REVIEW)*\n\n` +
        `📋 Leave ID: *${leave.id || 'N/A'}*\n` +
        `👤 Staff: *${leave.staffName || leave.employeeName || 'Staff'}*\n` +
        `🌴 Type: *${leave.type || leave.leaveType || 'Leave'}*\n` +
        `📅 Dates: *${leave.startDate || leave.start_date} to ${leave.endDate || leave.end_date}* (${leave.totalDays || 1} Days)\n` +
        `📝 Reason: *${leave.reason || 'Not specified'}*\n\n` +
        `Click below to review leave request.`;

      const targetId = targetManager?.telegramId || process.env.OWNER_TELEGRAM_ID;
      if (targetId) {
        sendTelegramNotification(targetId, msgText, [
          [
            { text: '✅ Approve Leave', callback_data: `approve_leave:${leave.id}` },
            { text: '❌ Reject Leave', callback_data: `reject_leave:${leave.id}` }
          ],
          [{ text: '🔍 Inspect in Manager Portal', url: `https://gro10x-ai.vercel.app/manager` }]
        ], true);
      }

      recordAutomationLog(db, {
        id: `LOG-${Date.now()}`,
        rule: 'AUT-020 (Leave Submitted Alert)',
        event: eventType,
        target: `${staffRaw} - ${leaveId}`,
        status: 'Executed',
        timestamp: new Date().toISOString()
      });
    }

    // TRIGGER: Leave Manager Approved -> Alert Owner for Final Sign-off
    if (eventType === 'leave_manager_approved') {
      const leave = eventData.leave || eventData || {};
      const iftekhar = (db.team || []).find(t => t.id === 'PBD-001');
      const firoz = (db.team || []).find(t => t.id === 'PBD-000');

      const msgText = `👑 *LEAVE MANAGER APPROVED — AWAITING OWNER FINAL SIGN-OFF*\n\n` +
        `📋 Leave ID: *${leave.id || 'N/A'}*\n` +
        `👤 Staff: *${leave.staffName || leave.employeeName || leave.employee_name || 'Staff'}*\n` +
        `🌴 Type: *${leave.type || leave.leaveType || leave.leave_type || 'Leave'}*\n` +
        `📅 Dates: *${leave.startDate || leave.start_date} to ${leave.endDate || leave.end_date}*\n` +
        `✍️ Manager Approved By: *${leave.managerReviewedBy || leave.manager_reviewed_by || 'Line Manager'}*\n\n` +
        `Click below to issue final leave sign-off.`;

      const buttons = [
        [{ text: '👑 Final Leave Sign-off', callback_data: `approve_leave_owner:${leave.id}` }],
        [{ text: '❌ Decline Leave', callback_data: `reject_leave:${leave.id}` }],
        [{ text: '🔍 Inspect in Admin Portal', url: `https://gro10x-ai.vercel.app/admin` }]
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
        target: `${leave.staffName || leave.employeeName || 'Staff'} (${leave.id || ''})`,
        status: 'Executed',
        timestamp: new Date().toISOString()
      });
    }

    // TRIGGER: Individual EOD Report Submitted -> Notify Manager, MD & Department Group
    if (eventType === 'eod_submitted') {
      const eod = eventData.eod || eventData || {};
      const staffRaw = eod.staffName || eod.employeeName || eod.employee_name || 'Team Member';
      const staffObj = (db.team || []).find(t => (t.name || '').toLowerCase() === staffRaw.toLowerCase()) || (db.team || [])[0];
      const dept = staffObj?.department || 'Operations';

      const lineManager = (db.team || []).find(t => (t.department || '').toLowerCase() === dept.toLowerCase() && (t.accessLevel || '').includes('Manager'));
      const owner = (db.team || []).find(t => (t.role || '').toLowerCase().includes('founder') || (t.role || '').toLowerCase().includes('director') || (t.accessLevel || '').toLowerCase().includes('admin')) || { telegramId: process.env.OWNER_TELEGRAM_ID };
      const tasksCompleted = eod.tasksCompleted || eod.tasksDone || eod.tasks_done || 'None';
      const tasksInProgress = eod.tasksInProgress || eod.tasksTomorrow || eod.tasks_tomorrow || 'None';
      const blockers = eod.blockers || 'None';
      const subTime = eod.submittedAt ? new Date(eod.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      const msgText = `📋 *NEW EOD REPORT LOGGED*\n\n` +
        `👤 Staff: *${staffRaw}* (${dept})\n` +
        `✅ *Completed:* ${tasksCompleted}\n` +
        `⏳ *In Progress / Tomorrow:* ${tasksInProgress}\n` +
        `🚧 *Blockers:* ${blockers}\n\n` +
        `Submitted at ${subTime}`;

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
        target: `${staffRaw}`,
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
        const msgText = `📋 *GRO10X 7:30 PM DEPARTMENT EOD DIGEST*\n` +
          `🏢 Department: *${dept}*\n\n` +
          `✅ *Reports Logged Today:* ${todayEods.length} Submissions\n` +
          `🔴 *Blockers Flagged:* ${blockersCount} Action Item(s)\n\n` +
          `🌐 Open Manager Portal: https://gro10x-ai.vercel.app/manager`;

        const targetId = mgr.telegramId || process.env.OWNER_TELEGRAM_ID;
        if (targetId) {
          sendTelegramNotification(targetId, msgText, null, true);
        }
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

    // TRIGGER 22: Task Overdue Alert
    if (eventType === 'task_overdue') {
      const task = eventData.task;
      const firstName = (task.assignee || '').split(' ')[0].toLowerCase();
      const assignee = (db.team || []).find(t => (t.name || '').toLowerCase().includes(firstName));
      const manager = assignee?.reportsTo
        ? (db.team || []).find(t => t.id === assignee.reportsTo)
        : (db.team || []).find(t => t.id === 'PBD-001');

      const msg = `⏰ *TASK OVERDUE ALERT*\n\n` +
        `• Task: *${task.title}*\n` +
        `• Client: *${task.client || 'Agency'}*\n` +
        `• Stage: *${task.stage}*\n` +
        `• Due: *${task.due_date || task.dueDate || 'Past Due'}*\n\n` +
        `Please update the task stage or request an extension.`;

      if (assignee?.telegramId) sendTelegramNotification(assignee.telegramId, msg, null, true);
      if (manager?.telegramId && manager.telegramId !== assignee?.telegramId) {
        sendTelegramNotification(manager.telegramId, msg, null, true);
      }

      recordAutomationLog(db, {
        id: `LOG-${Date.now()}`,
        rule: 'AUT-OVERDUE (Task Overdue Alert)',
        event: eventType,
        target: task.title,
        status: 'Executed',
        timestamp: new Date().toISOString()
      });
    }

    // TRIGGER 23: Monthly Payroll Reminder (25th)
    if (eventType === 'payroll_reminder') {
      const finManager = (db.team || []).find(t => t.id === 'PBD-029' || (t.role || '').toLowerCase().includes('finance'));
      const owner = (db.team || []).find(t => t.id === 'PBD-001');
      const totalSalary = (db.team || []).reduce((s, t) => s + (t.base_salary || t.baseSalary || 0), 0);
      const headCount = (db.team || []).filter(t => t.id !== 'PBD-000').length;

      const msg = `💰 *MONTHLY PAYROLL REMINDER (25th)*\n\n` +
        `• Total Headcount: *${headCount} Employees*\n` +
        `• Estimated Payroll: *BDT ${totalSalary.toLocaleString()}*\n\n` +
        `Please ensure all salary & bonus disbursements are prepared before month end.`;

      if (finManager?.telegramId) sendTelegramNotification(finManager.telegramId, msg, null, true);
      if (owner?.telegramId && owner.telegramId !== finManager?.telegramId) {
        sendTelegramNotification(owner.telegramId, msg, null, true);
      }

      recordAutomationLog(db, {
        id: `LOG-${Date.now()}`,
        rule: 'AUT-PAYROLL (Monthly Payroll Reminder)',
        event: eventType,
        target: 'Finance & Owner',
        status: 'Executed',
        timestamp: new Date().toISOString()
      });
    }

    // TRIGGER 24: Client Onboarded -> Notify Production Lead (AUT-022)
    if (eventType === 'client_onboarded') {
      const client = eventData.client || eventData || {};
      const clientName = client.clientName || client.name || client.company || 'New Client';
      const contact = client.contactPerson || client.contact_person || client.name || 'Client Lead';
      const lead = (db.team || []).find(t => t.id === 'PBD-001') || (db.team || [])[0];

      if (lead?.telegramId) {
        sendTelegramNotification(lead.telegramId,
          `🎉 *NEW CLIENT ONBOARDED*\n\n` +
          `👤 Client: *${clientName}*\n` +
          `📞 Contact: *${contact}*\n\n` +
          `Please ensure project onboarding and specialist assignment are set up in the portal.`,
          null, true
        );
      }

      recordAutomationLog(db, {
        id: `LOG-${Date.now()}`,
        rule: 'AUT-022 (Client Onboarded Alert)',
        event: eventType,
        target: clientName,
        status: 'Executed',
        timestamp: new Date().toISOString()
      });
    }

    // TRIGGER 25: Product QC Approved -> Alert DBM & Broadcast SSE (AUT-030)
    if (eventType === 'product_qc_approved') {
      const { brandId, productCode, productName, approvedBy, dbmTelegramId, dbmName } = eventData || {};
      const targetName = productCode ? `${productCode} (${productName || 'Product'})` : 'Product';

      if (dbmTelegramId) {
        const msgText =
          `🎉 *PRODUCT QC APPROVED!*\n\n` +
          `✅ Your product *${productCode}* (${productName || 'Catalog SKU'}) has been approved by ${approvedBy || 'Admin'}.\n` +
          `💰 *Listing Incentive Earned:* +$6.99 USD\n` +
          `🚀 Status: Marked LIVE for Etsy Storefront.`;
        sendTelegramNotification(dbmTelegramId, msgText, [
          [{ text: '🛍️ Open Studio', url: 'https://gro10x-ai.vercel.app/dbm#studio' }]
        ], true);
      }

      if (typeof broadcast === 'function') {
        broadcast('product_qc_update', { brandId, productCode, status: 'Live', approvedBy });
        broadcast('brands_updated', { brandId, productCode });
      }

      recordAutomationLog(db, {
        id: `LOG-${Date.now()}`,
        rule: 'AUT-030 (DBM Product QC Approved)',
        event: eventType,
        target: targetName,
        status: 'Executed',
        timestamp: new Date().toISOString()
      });
    }

    // TRIGGER 26: DigiVault Payment Verified -> Broadcast SSE & Update Pipeline (AUT-031)
    if (eventType === 'digi_payment_verified') {
      const { orderId, orderNumber, productName, customerName, salePrice, verifiedBy } = eventData || {};
      const targetName = orderNumber || orderId || 'DigiVault Order';

      if (typeof broadcast === 'function') {
        broadcast('digistore_order_updated', { orderId, orderNumber, paymentStatus: 'verified', verifiedBy });
      }

      recordAutomationLog(db, {
        id: `LOG-${Date.now()}`,
        rule: 'AUT-031 (DigiVault Payment Verified)',
        event: eventType,
        target: targetName,
        status: 'Executed',
        timestamp: new Date().toISOString()
      });
    }

    // TRIGGER 27: DBM Standup Submitted -> Log Streak & Broadcast (AUT-032)
    if (eventType === 'dbm_standup_submitted') {
      const { dbmName, empCode, productsCompleted, hoursWorked } = eventData || {};
      const targetName = dbmName || empCode || 'Brand Manager';

      if (typeof broadcast === 'function') {
        broadcast('eod_update', { empCode, name: dbmName, productsCompleted });
      }

      recordAutomationLog(db, {
        id: `LOG-${Date.now()}`,
        rule: 'AUT-032 (DBM Standup Submitted)',
        event: eventType,
        target: targetName,
        status: 'Executed',
        timestamp: new Date().toISOString()
      });
    }

    const logs = db.automationLogs || [];
    if (logs.length > 50) db.automationLogs = logs.slice(0, 50);

  } catch (err) {
    console.error('Automation engine error:', err);
  }
}

/**
 * Check posts scheduled for today or past due and trigger dispatch alerts via Supabase
 */
async function checkScheduledSocialDispatches(db, writeDB, broadcast) {
  try {
    const { supabase } = require('./supabase');
    const todayStr = new Date().toISOString().split('T')[0];

    const { data: posts, error } = await supabase.from('social_posts')
      .select('*')
      .or('status.eq.Approved,status.eq.Scheduled')
      .lte('scheduled_date', todayStr);

    if (error || !posts || posts.length === 0) return;

    for (const post of posts) {
      await supabase.from('social_posts').update({
        status: 'Due Today',
        updated_at: new Date().toISOString()
      }).eq('id', post.id);

      processAutomationEvent('social_post_dispatch_alert', { post }, db || { clients: [], team: [] }, writeDB, broadcast);
    }
  } catch (err) {
    console.warn('checkScheduledSocialDispatches error:', err.message);
  }
}


// ══════════════════════════════════════════════════════════════════════════════
// SCHEDULED JOBS — Morning Briefing & EOD Summary
// Runs inside the server process via setInterval (no cron lib needed)
// ══════════════════════════════════════════════════════════════════════════════

let _schedulerDb = null;
let _schedulerWriteDB = null;
let _schedulerBroadcast = null;
let _schedulerStarted = false;

function getBDTime() {
  // Bangladesh Standard Time (BST) = Asia/Dhaka (UTC+6)
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Dhaka',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
    weekday: 'short'
  });
  const parts = Object.fromEntries(formatter.formatToParts(now).map(p => [p.type, p.value]));

  const h = parseInt(parts.hour, 10);
  const m = parseInt(parts.minute, 10);
  const dayMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const day = dayMap[parts.weekday] !== undefined ? dayMap[parts.weekday] : now.getDay();
  const dayName = parts.weekday;
  const dateKey = `${parts.year}-${parts.month}-${parts.day}`;

  const timeString = now.toLocaleTimeString('en-US', {
    timeZone: 'Asia/Dhaka',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  return { h, m, day, dayName, timeString, dateKey, now, bd: now };
}

function buildMorningBriefing(db) {
  const team = db.team || [];
  const inStudio = team.filter(t => t.status === 'In Studio').length;
  const onShoot = team.filter(t => t.status === 'On Field Shoot').length;
  const onLeave = team.filter(t => t.status === 'On Leave').length;
  const offline = team.length - inStudio - onShoot - onLeave;

  const PENDING_EXP_STATUSES = ['Tier 1 Pending', 'Tier 1 Approved', 'Finance Verified', 'Owner Approved'];
  const pendingExpenses = (db.expenses || []).filter(e => PENDING_EXP_STATUSES.includes(e.status)).length;
  const pendingExpAmt = (db.expenses || [])
    .filter(e => PENDING_EXP_STATUSES.includes(e.status))
    .reduce((s, e) => s + (Number(e.amount) || 0), 0);

  const pendingInvoices = (db.invoices || []).filter(i => i.status !== 'Paid' && i.status !== 'Draft');
  const pendingInvAmt = pendingInvoices.reduce((s, i) => s + (i.amount || 0), 0);

  const clientsInReview = (db.tasks || []).filter(t => t.stage === 'Client Review').length;
  const clientsInEdit = (db.tasks || []).filter(t => t.stage === 'Editing' || t.stage === 'Post Production').length;
  const pendingAgreements = (db.team || []).filter(t => t.agreementStage === 2 || t.agreement_stage === 2).length;

  const { timeString, dayName } = getBDTime();

  let msg = `☀️ *Good morning, this is your ${dayName} briefing!*\n` +
    `────────────────────────\n\n` +
    `📊 *Team Live (${timeString} BD)*\n` +
    `  🟢 ${inStudio} In Studio  🎬 ${onShoot} On Shoot  🌴 ${onLeave} Leave  ⬛ ${offline} Offline\n\n`;

  if (pendingAgreements > 0 || pendingExpenses > 0) {
    msg += `✍️ *Pending Your Approval*\n`;
    if (pendingAgreements > 0) msg += `  • ${pendingAgreements} Employment Agreement(s) awaiting final seal\n`;
    if (pendingExpenses > 0) msg += `  • ${pendingExpenses} Expense(s) — BDT ${pendingExpAmt.toLocaleString()} to disburse\n`;
    msg += `\n`;
  }

  msg += `💰 *Finance Snapshot*\n` +
    `  • Outstanding Invoices: ${pendingInvoices.length} (BDT ${pendingInvAmt.toLocaleString()})\n\n` +
    `🎬 *Campaign Pipeline*\n` +
    `  • ${clientsInReview} deliverable(s) in Client Review\n` +
    `  • ${clientsInEdit} in Editing / Post Production\n` +
    `────────────────────────`;

  return msg;
}

function buildEODSummary(db) {
  const team = db.team || [];
  const todayStr = new Date().toLocaleDateString('en-CA');
  const todayISO = new Date().toISOString().split('T')[0];

  // Who clocked in today
  const attendance = db.attendance || [];
  const clockedToday = attendance.filter(a =>
    (a.clockInTime || a.clock_in_time) && (a.date === todayStr || a.date === todayISO || !a.date)
  );

  // EOD reports submitted today
  const eodReports = db.eodReports || db.eod_reports || [];
  const eodToday = eodReports.filter(r =>
    r.date === todayStr || r.date === todayISO ||
    (r.submittedAt && (r.submittedAt.startsWith(todayStr) || r.submittedAt.startsWith(todayISO))) ||
    (r.created_at && (r.created_at.startsWith(todayStr) || r.created_at.startsWith(todayISO)))
  );

  // Expenses submitted today
  const expenses = db.expenses || [];
  const expToday = expenses.filter(e =>
    e.date === todayStr || e.date === todayISO ||
    (e.createdAt && (e.createdAt.startsWith(todayStr) || e.createdAt.startsWith(todayISO))) ||
    (e.created_at && (e.created_at.startsWith(todayStr) || e.created_at.startsWith(todayISO)))
  );

  let msg = `🌙 *Evening Summary — End of Day*
`;
  msg += `────────────────────────

`;

  msg += `📊 *Attendance Today*
`;
  msg += `  • ${clockedToday.length} team member(s) clocked in
`;
  if (team.length - clockedToday.length > 0) {
    msg += `  • ${team.length - clockedToday.length} did not log attendance
`;
  }
  msg += `
`;

  msg += `📋 *EOD Reports*
`;
  if (eodToday.length > 0) {
    msg += `  • ${eodToday.length} report(s) submitted today
`;
    eodToday.slice(0, 3).forEach(r => {
      msg += `  — ${r.employeeName || 'Team Member'}: ${(r.summary || r.tasks || '').slice(0, 60)}...
`;
    });
  } else {
    msg += `  • No EOD reports received today
`;
  }
  msg += `
`;

  if (expToday.length > 0) {
    const expTotal = expToday.reduce((s, e) => s + (e.amount || 0), 0);
    msg += `🧾 *Expenses Filed Today*
`;
    msg += `  • ${expToday.length} claim(s) — BDT ${expTotal.toLocaleString()} total

`;
  }

  msg += `────────────────────────
`;
  msg += `_Have a great evening! See you tomorrow._ 💜`;

  return msg;
}

// ─── Chairman's Strategic Briefing (board-level, different from MD's operational view) ───
function buildChairmanBriefing(db) {
  const team = db.team || [];
  const { timeString, dayName } = getBDTime();

  // Finance
  const invoices = db.invoices || [];
  const monthStr = new Date().toISOString().slice(0, 7);
  const paidThisMonth = invoices.filter(i => i.status === 'Paid' && (i.paidAt || i.issueDate || '').startsWith(monthStr));
  const revThisMonth = paidThisMonth.reduce((s, i) => s + (i.amount || 0), 0);
  const pendingInvoices = invoices.filter(i => i.status !== 'Paid' && i.status !== 'Draft');
  const pendingInvAmt = pendingInvoices.reduce((s, i) => s + (i.amount || 0), 0);
  const salaryTotal = team.reduce((s, t) => s + (t.baseSalary || 0), 0);

  // HR
  const activeEmployees = team.filter(t => t.id !== 'PBD-000').length;
  const pendingAgreements = team.filter(t => t.agreementStage && t.agreementStage < 3 && !t.agreementComplete).length;
  const onLeave = team.filter(t => t.status === 'On Leave').length;
  const allLeaves = db.leaveRequests || db.leaves || [];
  const pendingLeaves = allLeaves.filter(l => l.status === 'Pending' || l.status === 'Pending Manager Approval' || l.status === 'Pending Line Review').length;

  // BD Pipeline
  const leads = db.leads || [];
  const activeLeads = leads.filter(l => l.status !== 'Won' && l.status !== 'Lost').length;
  const pipelineValue = leads.filter(l => l.status !== 'Won' && l.status !== 'Lost').reduce((s, l) => s + (l.value || 0), 0);
  const wonThisMonth = leads.filter(l => l.status === 'Won' && (l.wonAt || '').startsWith(monthStr)).length;

  // Clients
  const clients = db.clients || [];
  const activeClients = clients.filter(c => c.status === 'Active Retainer').length;
  const inReview = (db.tasks || []).filter(t => t.stage === 'Client Review').length;

  let msg = `🏛️ *Chairman's ${dayName} Board Briefing (${timeString} BD)*
`;
  msg += `────────────────────────

`;

  msg += `💰 *Financial Health*
`;
  msg += `  • Revenue (this month): BDT ${revThisMonth.toLocaleString()}
`;
  msg += `  • Outstanding invoices: ${pendingInvoices.length} — BDT ${pendingInvAmt.toLocaleString()}
`;
  msg += `  • Monthly payroll commitment: BDT ${salaryTotal.toLocaleString()}

`;

  msg += `👥 *HR Status*
`;
  msg += `  • Active employees: ${activeEmployees}
`;
  if (pendingAgreements > 0) msg += `  • ⚠️ ${pendingAgreements} agreement(s) pending completion
`;
  if (pendingLeaves > 0) msg += `  • 🌴 ${pendingLeaves} leave request(s) pending approval
`;
  msg += `  • ${onLeave} on leave today

`;

  msg += `📈 *Business Development*
`;
  msg += `  • Active leads in pipeline: ${activeLeads}
`;
  if (pipelineValue > 0) msg += `  • Estimated pipeline value: BDT ${pipelineValue.toLocaleString()}
`;
  if (wonThisMonth > 0) msg += `  • Deals won this month: ${wonThisMonth}

`;

  msg += `🎬 *Client Health*
`;
  msg += `  • Active retainers: ${activeClients}
`;
  msg += `  • Deliverables in client review: ${inReview}
`;
  msg += `────────────────────────`;

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

      // ── Morning Briefing: 9:15 AM BD (Mon–Thu & Sun, skip Friday & Saturday)
      if (h === 9 && m === 15 && bd.getDay() !== 5 && bd.getDay() !== 6 && _lastMorningFired !== todayKey) {
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

      // ── EOD Summary: 8:00 PM BD (Mon–Thu & Sun, skip Friday & Saturday)
      if (h === 20 && m === 0 && bd.getDay() !== 5 && bd.getDay() !== 6 && _lastEODFired !== todayKey) {
        _lastEODFired = todayKey;
        const { sendTelegramNotification } = require('./bot');
        const eodMsg = buildEODSummary(db);
        owners.forEach(owner => {
          sendTelegramNotification(owner.telegramId, eodMsg, null, true);
        });
      }
    } catch (e) {
      // Silent fail — scheduler must never crash the server
    }
  }, 60 * 1000);
}

const automation = {
  trigger: async (eventType, eventData) => {
    try {
      let dbSnapshot = { team: [], clients: [], tasks: [], expenses: [], leaves: [], eod_reports: [], eodReports: [] };
      if (isSupabaseConfigured && isSupabaseConfigured()) {
        try {
          const [pRes, cRes, tRes, expRes, lRes, eodRes] = await Promise.all([
            supabase.from('profiles').select('*').limit(500),
            supabase.from('clients').select('*').limit(500),
            supabase.from('tasks').select('*').limit(500),
            supabase.from('expenses').select('*').limit(500),
            supabase.from('leaves').select('*').limit(500),
            supabase.from('eod_reports').select('*').order('created_at', { ascending: false }).limit(200)
          ]);
          dbSnapshot.team = (pRes?.data || []).map(p => ({
            ...p,
            id: p.emp_code || p.id,
            telegramId: p.telegram_id,
            accessLevel: p.access_level || p.role
          }));
          dbSnapshot.clients = (cRes?.data || []).map(c => ({
            ...c,
            telegramId: c.telegram_id
          }));
          dbSnapshot.tasks = tRes?.data || [];
          dbSnapshot.expenses = expRes?.data || [];
          dbSnapshot.leaves = lRes?.data || [];
          dbSnapshot.eod_reports = eodRes?.data || [];
          dbSnapshot.eodReports = eodRes?.data || [];
        } catch (dbErr) {
          console.warn('[Automation] Snapshot fetch note:', dbErr.message);
        }
      }
      return processAutomationEvent(eventType, eventData, dbSnapshot, () => {}, broadcast);
    } catch (err) {
      console.warn(`[Automation] trigger(${eventType}) warning:`, err.message);
    }
  }
};

module.exports = {
  automation,
  processAutomationEvent,
  checkScheduledSocialDispatches,
  startScheduledJobs,
  buildMorningBriefing,
  buildEODSummary,
  buildChairmanBriefing
};

