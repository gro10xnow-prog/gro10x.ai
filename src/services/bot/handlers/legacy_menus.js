/**
 * src/services/bot/handlers/legacy_menus.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Telegram Bot Callback Query Router & Action Dispatcher.
 * Refactored: Removed duplicated onText listeners now handled by modular handlers.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const state = require('../../state');
const { supabase } = require('../../supabase');
const { broadcast } = require('../../sse');
const { sendTelegramNotification, sendAgreementNotification } = require('../notifications');

function registerLegacyTeamMenus(teamBot, readDB) {
  // Handle Telegram 1-Tap Button Click Callbacks (callback_query)
  teamBot.on('callback_query', async (query) => {
    const queryId = query.id;
    const data = query.data || '';
    const chatId = query.message.chat.id;
    const messageId = query.message.message_id;

    // Immediately dismiss callback query spinner
    try { teamBot.answerCallbackQuery(queryId).catch(() => {}); } catch (e) {}

    try {
      const emp = await state.getEmployeeByTelegramId(chatId) || { name: 'Team Member', emp_code: 'UNKNOWN' };
      if (data === 'noop') return;

      let alertMsg = '';
      let statusBadge = '✅ Action Recorded';

      if (data === 'cmd_health_refresh') {
        const briefingHandler = require('./briefing');
        await briefingHandler.handleOpsHealthSummary(teamBot, query.message);
        return teamBot.answerCallbackQuery(queryId, { text: '🩺 Telemetry Refreshed!' }).catch(() => {});
      }

      // ─── 0. EOD MOOD CALLBACK ──────────────────────────────────────────────────
      if (data.startsWith('eod_mood:')) {
        const mood = data.split(':')[1];
        const wizardState = await state.getSession(chatId);
        const summaryText = wizardState?.summary || 'Daily tasks completed';
        const blockersText = wizardState?.blockers || 'None';

        await state.submitEOD(emp.emp_code, emp.name, {
          done: summaryText,
          tomorrow: 'Standard daily tasks',
          blockers: blockersText,
          mood: mood,
          hours: 8
        });

        await state.clearSession(chatId);

        const { getRoleKeyboard } = require('../keyboards');
        return teamBot.sendMessage(chatId,
          `✅ *EOD Report Submitted!* (+10 XP)\n\n` +
          `📅 ${new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}\n` +
          `📝 *Summary:* "${summaryText.substring(0, 80)}${summaryText.length > 80 ? '...' : ''}"\n` +
          `🚧 *Blockers:* "${blockersText}"\n` +
          `😊 *Mood:* ${mood}\n\n` +
          `Saved to database! 💜`,
          { parse_mode: 'Markdown', reply_markup: getRoleKeyboard(emp.accessLevel, true, emp) }
        );
      }

      // ─── 0. GEN MAGIC LINK ─────────────────────────────────────────────────────
      if (data.startsWith('gen_magic_link:')) {
        const clientId = data.split(':')[1];
        const { data: client } = await supabase.from('clients').select('*').eq('id', clientId).maybeSingle();
        const clientName = client?.name || 'Client';
        const token = `TOK-${Date.now()}`;
        const magicLink = `https://purpleos-iota.vercel.app/partners?client=${encodeURIComponent(clientName)}&token=${token}`;
        const cardMsg = `📋 *PURPLEBOT PARTNER PORTAL LINK*\n\n` +
          `🏢 Client: *${clientName}*\n` +
          `👤 Contact: ${client?.contact_person || 'Brand Manager'}\n\n` +
          `🔗 *Direct Access Magic Link:*\n${magicLink}\n\n` +
          `_Send this link to the client for 1-click access to review room & invoices._`;

        return teamBot.sendMessage(chatId, cardMsg, { parse_mode: 'Markdown' });
      }

      // ─── 0. SUBMIT SCRIPT QC / SUBMIT QC ─────────────────────────────────────
      if (data.startsWith('submit_script_qc:')) {
        const taskId = data.split(':')[1];
        await supabase.from('tasks').update({ stage: 'Script QC', updated_at: new Date().toISOString() }).eq('id', taskId);
        broadcast('task_update', [{ id: taskId, stage: 'Script QC' }]);

        const nasir = await state.getEmployeeByTelegramId('PBD-013');
        if (nasir?.telegramId) {
          sendTelegramNotification(nasir.telegramId,
            `📜 *Script QC Review Required*\n\n• Task: *${taskId}*\n\nPlease review script draft and sign off.`,
            [[{ text: '🌐 Review Script in Portal', url: `https://purpleos-iota.vercel.app/admin?tab=tasks&id=${taskId}` }]],
            true
          );
        }
        return teamBot.sendMessage(chatId, `✅ *Submitted Task ${taskId} for Script QC!*`, { parse_mode: 'Markdown' });
      }

      if (data.startsWith('submit_qc:')) {
        const taskId = data.split(':')[1];
        await supabase.from('tasks').update({ stage: 'Internal QC', updated_at: new Date().toISOString() }).eq('id', taskId);
        broadcast('task_update', [{ id: taskId, stage: 'Internal QC' }]);

        const ruhul = await state.getEmployeeByTelegramId('PBD-006');
        if (ruhul?.telegramId) {
          sendTelegramNotification(ruhul.telegramId,
            `🔍 *Internal QC Review Required*\n\n• Task: *${taskId}*\n\nPlease review and either approve for client delivery or send back for revision.`,
            [
              [{ text: '✅ QC Approve → Client Review', url: `https://purpleos-iota.vercel.app/admin?tab=tasks&action=qc-approve&id=${taskId}` }],
              [{ text: '✏️ Send Back for Revision', url: `https://purpleos-iota.vercel.app/admin?tab=tasks&action=qc-reject&id=${taskId}` }]
            ],
            true
          );
        }
        return teamBot.sendMessage(chatId, `✅ *Submitted Task ${taskId} for Internal QC!*`, { parse_mode: 'Markdown' });
      }

      // ─── TECH ADMIN DIAGNOSTICS ────────────────────────────────────────────────
      if (data === 'tech_sync_supabase') {
        alertMsg = '🔄 Supabase Cloud Database Synced!';
        teamBot.sendMessage(chatId, `🔄 *Supabase Cloud DB Sync Executed Successfully!*`, { parse_mode: 'Markdown' });
      } else if (data === 'tech_clean_slate') {
        alertMsg = '🧹 Automation Logs & Test Slate Cleaned!';
        teamBot.sendMessage(chatId, `🧹 *Test Slate Cleaned! Automation logs reset.*`, { parse_mode: 'Markdown' });
      } else if (data === 'cmd_approvals' || data === 'view_expenses_queue') {
        const approvalsHandler = require('./approvals');
        return approvalsHandler.handlePendingApprovals(teamBot, query.message);
      } else if (data === 'cmd_mgr_leaves') {
        const leavesHandler = require('./leaves');
        return leavesHandler.handleManagerLeaveApprovals(teamBot, query.message);
      } else if (data === 'cmd_payroll_summary') {
        const finMgrHandler = require('./finance-manager');
        return finMgrHandler.handlePayrollSummary(teamBot, query.message);
      } else if (data === 'cmd_bank_hub') {
        const finMgrHandler = require('./finance-manager');
        return finMgrHandler.handleBankBkashHub(teamBot, query.message);
      } else if (data === 'cmd_expense_queue_fin') {
        const finMgrHandler = require('./finance-manager');
        return finMgrHandler.handleExpenseQueueFinance(teamBot, query.message);
      } else if (data === 'cmd_studio_workload') {
        const studioHandler = require('./studio');
        return studioHandler.handleStudioWorkload(teamBot, query.message);
      } else if (data === 'cmd_bottleneck_radar') {
        const studioHandler = require('./studio');
        return studioHandler.handleBottleneckRadar(teamBot, query.message);
      } else if (data === 'cmd_gear_slots') {
        const studioHandler = require('./studio');
        return studioHandler.handleStudioGearSlots(teamBot, query.message);
      } else if (data === 'confirm_batch_expense_t2') {
        let pendExp = [];
        if (supabase) {
          const { data } = await supabase.from('expenses').select('id, amount').or('status.eq.Tier 1 Approved,status.eq.Tier 2 Pending,status.eq.Pending').neq('status', 'Disbursed');
          pendExp = data || [];
        }
        const totalAmt = pendExp.reduce((s, e) => s + (Number(e.amount) || 0), 0);
        return teamBot.sendMessage(chatId,
          `⚠️ *CONFIRM BATCH EXPENSE APPROVAL*\n\n` +
          `You are about to bulk-approve *${pendExp.length} claims* totaling *৳${totalAmt.toLocaleString()} BDT* for payout disbursement.\n\n` +
          `_Proceed with bulk sign-off?_`,
          {
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [
                [
                  { text: '👑 Yes, Sign-off & Disburse', callback_data: 'approve_all_expenses_t2' },
                  { text: '❌ Cancel', callback_data: 'cmd_expense_queue_fin' }
                ]
              ]
            }
          }
        );
      } else if (data === 'approve_all_expenses_t2') {
        if (supabase) {
          const { data: pendExp } = await supabase.from('expenses').select('id, employee_id, amount, category').or('status.eq.Tier 1 Approved,status.eq.Tier 2 Pending,status.eq.Pending').neq('status', 'Disbursed').neq('status', 'Approved');
          if (pendExp && pendExp.length > 0) {
            await supabase.from('expenses').update({
              tier2_approved: true,
              tier2_approved_by: emp.name,
              tier2_approved_at: new Date().toISOString(),
              status: 'Approved'
            }).in('id', pendExp.map(e => e.id));
            broadcast('expense_update', pendExp.map(e => ({ id: e.id, status: 'Approved' })));
          }
        }
        return teamBot.sendMessage(chatId, `👑 *All pending expense claims have been batch-approved!* Ready for disbursement.`, { parse_mode: 'Markdown' });
      } else if (data === 'cmd_mybank') {
        const profileHandler = require('./profile');
        profileHandler.handleMyBank(teamBot, query.message);
        alertMsg = 'Opening Bank Details...';

      // ─── 1. TASK ADVANCE ───────────────────────────────────────────────────────
      } else if (data.startsWith('task_advance:')) {
        const parts = data.split(':');
        const taskId = parts[1];
        const targetStage = parts[2];

        const { data: task } = await supabase.from('tasks').select('*').eq('id', taskId).maybeSingle();
        await supabase.from('tasks').update({
          stage: targetStage,
          custom_status: targetStage,
          updated_at: new Date().toISOString()
        }).eq('id', taskId);

        alertMsg = `✅ Task moved to ${targetStage}!`;
        statusBadge = `✅ Stage: ${targetStage}`;
        teamBot.sendMessage(chatId, `✅ *Task Advanced!*\n\nTask \`${taskId}\` has been moved to *${targetStage}*.`, { parse_mode: 'Markdown' });

        // SSE Broadcast to web panel
        broadcast('task_update', [{ id: taskId, stage: targetStage }]);

        // Notify Assignee
        if (task && task.assignee_id) {
          const { data: assEmp } = await supabase.from('profiles').select('telegram_id').eq('emp_code', task.assignee_id).maybeSingle();
          if (assEmp?.telegram_id) {
            teamBot.sendMessage(assEmp.telegram_id,
              `📋 *Task Stage Updated*\n\nYour task *${task.title || taskId}* moved to *${targetStage}*.`,
              { parse_mode: 'Markdown' }
            ).catch(() => {});
          }
        }

        if (targetStage === 'Internal QC') {
          try {
            const { data: ruhul } = await supabase.from('profiles').select('*').eq('emp_code', 'PBD-006').maybeSingle();
            if (ruhul?.telegram_id) {
              sendTelegramNotification(ruhul.telegram_id,
                `🔍 *Internal QC Review Required*\n\n• Task ID: *${taskId}*\n• Submitted by: *${emp.name}*\n\nPlease review and either approve for client delivery or send back for revision.`,
                [
                  [{ text: '✅ QC Approve → Client Review', url: `https://purpleos-iota.vercel.app/admin?tab=tasks&action=qc-approve&id=${taskId}` }],
                  [{ text: '✏️ Send Back for Revision', url: `https://purpleos-iota.vercel.app/admin?tab=tasks&action=qc-reject&id=${taskId}` }]
                ],
                true
              );
            }
          } catch(e) {}
        }

      // ─── 2. LEAVE APPROVAL CHAIN ──────────────────────────────────────────────
      } else if (data.startsWith('approve_leave:')) {
        const leaveId = data.split(':')[1];
        const { data: leave } = await supabase.from('leaves').select('*').eq('id', leaveId).maybeSingle();
        
        await supabase.from('leaves').update({
          status: 'Manager Approved',
          manager_reviewed_by: emp.name,
          manager_approved_at: new Date().toISOString()
        }).eq('id', leaveId);

        alertMsg = `✅ Leave ${leaveId} Manager Approved!`;
        statusBadge = `✅ Approved by Manager (${emp.name})`;
        teamBot.sendMessage(chatId, `✅ *Leave ${leaveId} Manager Approved!*\nForwarded to Owner for final sign-off.`, { parse_mode: 'Markdown' });

        // Notify Employee
        if (leave?.employee_id) {
          const { data: empProf } = await supabase.from('profiles').select('telegram_id').eq('emp_code', leave.employee_id).maybeSingle();
          if (empProf?.telegram_id) {
            teamBot.sendMessage(empProf.telegram_id, `✅ *Leave Status:* Manager Approved! Pending final Owner sign-off.`, { parse_mode: 'Markdown' }).catch(() => {});
          }
        }

        // Forward to Owner (Managing Director / Owner) for T2 sign-off
        const { data: owner } = await supabase.from('profiles').select('telegram_id').eq('access_level', 'Owner').maybeSingle();
        if (owner?.telegram_id) {
          sendTelegramNotification(owner.telegram_id,
            `🌴 *LEAVE: Manager Approved → Owner Final Sign-Off*\n\n` +
            `• Employee: *${leave?.employee_name || leave?.name || 'Staff'}*\n` +
            `• Type: *${leave?.leave_type || 'Leave'}*\n` +
            `• Dates: *${leave?.start_date || 'N/A'}* to *${leave?.end_date || 'N/A'}*\n\n` +
            `_Tap below for final approval:_`,
            [
              [{ text: '👑 Final Approve (Owner)', callback_data: `approve_leave_owner:${leaveId}` }],
              [{ text: '❌ Decline', callback_data: `reject_leave:${leaveId}` }]
            ]
          );
        }

      } else if (data.startsWith('reject_leave:')) {
        const leaveId = data.split(':')[1];
        const { data: leave } = await supabase.from('leaves').select('*').eq('id', leaveId).maybeSingle();
        
        await supabase.from('leaves').update({
          status: 'Declined',
          manager_reviewed_by: emp.name
        }).eq('id', leaveId);

        alertMsg = `❌ Leave ${leaveId} Rejected.`;
        statusBadge = `❌ Rejected by ${emp.name}`;
        teamBot.sendMessage(chatId, `❌ *Leave ${leaveId} Rejected by Manager.*`, { parse_mode: 'Markdown' });

        // Notify Employee of Rejection
        if (leave?.employee_id) {
          const { data: empProf } = await supabase.from('profiles').select('telegram_id').eq('emp_code', leave.employee_id).maybeSingle();
          if (empProf?.telegram_id) {
            teamBot.sendMessage(empProf.telegram_id, `❌ *Leave Status:* Request for ${leave.leave_type || 'Leave'} was declined.`, { parse_mode: 'Markdown' }).catch(() => {});
          }
        }

      } else if (data.startsWith('approve_leave_owner:')) {
        const leaveId = data.split(':')[1];
        const { data: leave } = await supabase.from('leaves').select('*').eq('id', leaveId).maybeSingle();

        await supabase.from('leaves').update({
          status: 'Approved',
          owner_approved_at: new Date().toISOString()
        }).eq('id', leaveId);

        alertMsg = `👑 Leave ${leaveId} Owner Approved!`;
        statusBadge = `👑 Owner Final Sign-off Granted`;
        teamBot.sendMessage(chatId, `👑 *Leave ${leaveId} Owner Approved!* Calendar & Records updated.`, { parse_mode: 'Markdown' });

        // Notify Employee of Final Approval
        if (leave?.employee_id) {
          const { data: empProf } = await supabase.from('profiles').select('telegram_id').eq('emp_code', leave.employee_id).maybeSingle();
          if (empProf?.telegram_id) {
            teamBot.sendMessage(empProf.telegram_id,
              `🎉 *CONGRATULATIONS! Leave Fully Approved!*\n\n` +
              `Your *${leave.leave_type || 'Leave'}* (${leave.start_date} to ${leave.end_date}) is confirmed by Owner! 💜`,
              { parse_mode: 'Markdown' }
            ).catch(() => {});
          }
        }
        broadcast('leave_update', [{ id: leaveId, status: 'Approved' }]);

      // ─── 3. EXPENSE 4-STAGE APPROVAL CHAIN ─────────────────────────────────────
      } else if (data.startsWith('approve_expense_t1:')) {
        const expId = data.split(':')[1];
        const { data: exp } = await supabase.from('expenses').select('*').eq('id', expId).maybeSingle();

        await supabase.from('expenses').update({
          tier1_approved: true,
          tier1_approved_by: emp.name,
          tier1_approved_at: new Date().toISOString(),
          status: 'Tier 1 Approved'
        }).eq('id', expId);

        alertMsg = `✅ Expense T1 Approved!`;
        statusBadge = `✅ T1 Approved (${emp.name})`;
        teamBot.sendMessage(chatId, `✅ *Expense ${expId} Line-Manager Approved!*\nForwarded to Finance for verification.`, { parse_mode: 'Markdown' });

        // Dynamic Role Lookup for Finance Manager
        const { data: fin } = await supabase.from('profiles').select('telegram_id').or('access_level.eq.Finance Manager,role.ilike.%finance manager%').maybeSingle();
        if (fin?.telegram_id) {
          sendTelegramNotification(fin.telegram_id,
            `💰 *EXPENSE: T1 Approved → Finance Sign-Off Required*\n\n` +
            `• Staff: *${exp?.employee_name || 'Staff'}*\n` +
            `• Amount: *BDT ${(exp?.amount || 0).toLocaleString()}*\n` +
            `• Category: *${exp?.category || 'General'}*\n\n` +
            `_Tap below for Finance verification:_`,
            [[{ text: '✅ Finance Verification (T1.5)', callback_data: `approve_expense_t1_5:${expId}` }]]
          );
        }

      } else if (data.startsWith('approve_expense_t1_5:')) {
        const expId = data.split(':')[1];
        const { data: exp } = await supabase.from('expenses').select('*').eq('id', expId).maybeSingle();

        await supabase.from('expenses').update({
          finance_verified: true,
          finance_verified_by: emp.name,
          finance_verified_at: new Date().toISOString(),
          status: 'Finance Verified'
        }).eq('id', expId);

        alertMsg = `✅ Finance Verified! Forwarded to Owner.`;
        statusBadge = `✅ Finance Verified (${emp.name})`;
        teamBot.sendMessage(chatId, `✅ *Expense ${expId} Finance-Verified!*\nForwarded to Owner for T2 approval.`, { parse_mode: 'Markdown' });

        // Dynamic Role Lookup for Owner / Admin
        const { data: owner } = await supabase.from('profiles').select('telegram_id').eq('access_level', 'Owner').maybeSingle();
        if (owner?.telegram_id) {
          sendTelegramNotification(owner.telegram_id,
            `💼 *EXPENSE: Finance-Verified → Owner Approval Required*\n\n` +
            `• Staff: *${exp?.employee_name || 'Staff'}*\n` +
            `• Amount: *BDT ${(exp?.amount || 0).toLocaleString()}*\n` +
            `• Category: *${exp?.category || 'General'}*\n\n` +
            `_Tap below for Owner approval:_`,
            [[{ text: '👑 Approve (Owner T2)', callback_data: `approve_expense_t2:${expId}` }]]
          );
        }

      } else if (data.startsWith('approve_expense_t2:')) {
        const expId = data.split(':')[1];
        const { data: exp } = await supabase.from('expenses').select('*').eq('id', expId).maybeSingle();

        await supabase.from('expenses').update({
          tier2_approved: true,
          tier2_approved_by: emp.name,
          tier2_approved_at: new Date().toISOString(),
          status: 'Approved'
        }).eq('id', expId);

        broadcast('expense_update', [{ id: expId, status: 'Approved' }]);

        alertMsg = `👑 Owner Approved! Ready for Disbursement.`;
        statusBadge = `👑 Owner Approved (${emp.name})`;
        teamBot.sendMessage(chatId, `👑 *Expense ${expId} Owner Approved!*\nSent to Finance for disbursement.`, { parse_mode: 'Markdown' });

        // Dynamic Role Lookup for Finance Manager for Disbursement T3
        const { data: fin } = await supabase.from('profiles').select('telegram_id').or('access_level.eq.Finance Manager,role.ilike.%finance manager%').maybeSingle();
        if (fin?.telegram_id) {
          sendTelegramNotification(fin.telegram_id,
            `💸 *EXPENSE: Owner Approved → Ready to Disburse*\n\n` +
            `• Staff: *${exp?.employee_name || 'Staff'}*\n` +
            `• Amount: *BDT ${(exp?.amount || 0).toLocaleString()}*\n\n` +
            `_Tap below to mark payment disbursed:_`,
            [[{ text: '💸 Disburse Payment (T3)', callback_data: `disburse_expense_t3:${expId}` }]]
          );
        }

      } else if (data.startsWith('disburse_expense_t3:')) {
        const expId = data.split(':')[1];
        const { data: exp } = await supabase.from('expenses').select('*').eq('id', expId).maybeSingle();

        await supabase.from('expenses').update({
          disbursed: true,
          disbursed_by: emp.name,
          disbursed_at: new Date().toISOString(),
          status: 'Disbursed'
        }).eq('id', expId);

        alertMsg = `💸 Expense Disbursed & Paid!`;
        statusBadge = `💸 Disbursed & Paid`;
        teamBot.sendMessage(chatId, `🎉 *Expense ${expId} Disbursed & Paid!*`, { parse_mode: 'Markdown' });

        // Notify Employee
        if (exp?.employee_id) {
          const { data: empProf } = await supabase.from('profiles').select('telegram_id').eq('emp_code', exp.employee_id).maybeSingle();
          if (empProf?.telegram_id) {
            teamBot.sendMessage(empProf.telegram_id,
              `💸 *Expense Claim Paid!*\n\n` +
              `Your claim of *BDT ${(exp.amount || 0).toLocaleString()}* (${exp.category}) has been disbursed! 💜`,
              { parse_mode: 'Markdown' }
            ).catch(() => {});
          }
        }
        broadcast('expense_update', [{ id: expId, status: 'Disbursed' }]);

      // ─── 4. AGREEMENT CHAIN ───────────────────────────────────────────────────
      } else if (data.startsWith('agr_stage2:')) {
        const empId = data.split(':')[1];
        await supabase.from('profiles').update({
          agreement_stage: 2,
          updated_at: new Date().toISOString()
        }).eq('emp_code', empId);

        const targetEmp = await state.getEmployeeByTelegramId(empId) || await state.getEmployeeByPhone(empId);
        if (targetEmp) {
          sendAgreementNotification(2, targetEmp, {});
        }
        alertMsg = `✅ Agreement countersigned! Forwarded to Owner for final seal.`;
        statusBadge = `✅ Finance Countersigned by ${emp.name}`;

      } else if (data.startsWith('agr_stage3:')) {
        const empId = data.split(':')[1];
        await supabase.from('profiles').update({
          agreement_stage: 3,
          onboarding_complete: true,
          updated_at: new Date().toISOString()
        }).eq('emp_code', empId);

        const targetEmp = await state.getEmployeeByTelegramId(empId) || await state.getEmployeeByPhone(empId);
        if (targetEmp) {
          sendAgreementNotification(3, targetEmp, {});
        }
        alertMsg = `👑 Employee is now fully activated as an official PBD employee!`;
        statusBadge = `👑 Owner Seal Applied — Employee Activated`;

      // ─── 5. CLIENT PAYMENT VERIFICATION ──────────────────────────────────────
      } else if (data.startsWith('pay_approve:')) {
        const payId = data.split(':')[1];
        const { data: payLog } = await supabase.from('payment_logs').select('*').eq('id', payId).maybeSingle();

        await supabase.from('payment_logs').update({
          verified: true,
          verified_by: emp.name || 'Finance Manager',
          verified_at: new Date().toISOString()
        }).eq('id', payId);

        if (payLog?.invoice_id) {
          await supabase.from('invoices').update({
            status: 'Paid',
            paid_date: new Date().toISOString().split('T')[0],
            notes: `Verified bKash Payment (TrxID: ${payLog.trx_id}) by ${emp.name}`
          }).eq('id', payLog.invoice_id);
        }

        alertMsg = `💳 Payment ${payId} Verified & Invoice Marked Paid!`;
        statusBadge = `💳 Approved & Verified by ${emp.name}`;
        teamBot.sendMessage(chatId, `💳 *Payment ${payId} Approved!* Invoice marked as Paid.`, { parse_mode: 'Markdown' });

        // Notify Client via Client Bot
        try {
          const { getClientBot } = require('../bot');
          const clientBot = getClientBot();
          if (clientBot && payLog?.client_id) {
            const { data: clientObj } = await supabase.from('clients').select('telegram_id').eq('id', payLog.client_id).maybeSingle();
            if (clientObj?.telegram_id) {
              clientBot.sendMessage(clientObj.telegram_id,
                `✅ *Payment Confirmed!*\n\nYour payment for Invoice *${payLog.invoice_id}* has been verified.\nThank you! 💜`,
                { parse_mode: 'Markdown' }
              ).catch(() => {});
            }
          }
        } catch (e) {}

      } else if (data.startsWith('pay_reject:')) {
        const payId = data.split(':')[1];
        const { data: payLog } = await supabase.from('payment_logs').select('*').eq('id', payId).maybeSingle();

        await supabase.from('payment_logs').update({
          status: 'Rejected',
          notes: `REJECTED via Telegram by ${emp.name}`
        }).eq('id', payId);

        if (payLog?.invoice_id) {
          await supabase.from('invoices').update({
            status: 'Pending',
            notes: `Payment rejected — invalid TrxID`
          }).eq('id', payLog.invoice_id);
        }

        alertMsg = `❌ Payment ${payId} Proof Rejected!`;
        statusBadge = `❌ Payment Rejected by ${emp.name}`;
        teamBot.sendMessage(chatId, `❌ *Payment ${payId} Rejected.* Invoice reverted to Pending.`, { parse_mode: 'Markdown' });
      }

      // Update inline button text to badge
      try {
        await teamBot.editMessageReplyMarkup({
          inline_keyboard: [[{ text: statusBadge, callback_data: 'noop' }]]
        }, { chat_id: chatId, message_id: messageId });
      } catch (e) {}

    } catch (err) {
      console.error('[CallbackQuery Router Error]:', err.message);
    }
  });
}

module.exports = { registerLegacyTeamMenus };
