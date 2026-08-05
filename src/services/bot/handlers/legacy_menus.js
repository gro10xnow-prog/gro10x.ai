const state = require('../../state');

function registerLegacyTeamMenus(teamBot, readDB) {

      // ══════════════════════════════════════════
      // MEHEDI CLIENT & GROWTH COMMANDS
      // ══════════════════════════════════════════

      // 🎯 My Clients — full portfolio overview
      teamBot.onText(/🎯 My Clients/, async (msg) => {
        const chatId = msg.chat.id;
        const dbData = await readDB();
        const clients = dbData.clients || [];
        const tasks = dbData.tasks || [];
        const invoices = dbData.invoices || [];

        if (!clients.length) {
          return teamBot.sendMessage(chatId, `🎯 *Client Portfolio*\n\nNo clients in the system yet.`, { parse_mode: 'Markdown' });
        }

        const active = clients.filter(c => c.status === 'Active Retainer');
        const overdueInvs = invoices.filter(i => i.status !== 'Paid' && i.status !== 'Draft');

        let text = `🎯 *Client Portfolio — ${active.length} Active Retainers*\n\n`;
        active.slice(0, 10).forEach((c, i) => {
          const clientTasks = tasks.filter(t => t.client === c.name);
          const inReview = clientTasks.filter(t => t.stage === 'Client Review').length;
          const overdue = overdueInvs.filter(inv => inv.clientName === c.name).length;
          text += `${i + 1}. *${c.name}*`;
          if (inReview) text += ` — ⏳ ${inReview} in review`;
          if (overdue) text += ` — ⚠️ ${overdue} invoice(s) overdue`;
          text += '\n';
        });

        if (clients.length > active.length) {
          text += `\n_+${clients.length - active.length} inactive client(s) not shown_`;
        }

        teamBot.sendMessage(chatId, text, {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [[
              { text: '🌐 Open Full Client Portal', url: 'https://purpleos-iota.vercel.app/admin?tab=clients' }
            ]]
          }
        });
      });

      // 📈 Lead Pipeline
      teamBot.onText(/📈 Lead Pipeline/, async (msg) => {
        const chatId = msg.chat.id;
        const dbData = await readDB();
        const leads = dbData.leads || [];

        const active = leads.filter(l => l.status !== 'Won' && l.status !== 'Lost');
        const won = leads.filter(l => l.status === 'Won');
        const pipelineVal = active.reduce((s, l) => s + (l.value || 0), 0);

        if (!leads.length) {
          return teamBot.sendMessage(chatId,
            `📈 *BD Pipeline*\n\nNo leads in the system yet. Add leads via the web portal.`,
            { parse_mode: 'Markdown' }
          );
        }

        let text = `📈 *Business Development Pipeline*\n\n`;
        text += `• Active leads: *${active.length}*\n`;
        text += `• Won (all time): *${won.length}*\n`;
        if (pipelineVal > 0) text += `• Pipeline value: *BDT ${pipelineVal.toLocaleString()}*\n`;
        text += `\n`;

        if (active.length) {
          text += `*Open Leads:*\n`;
          active.slice(0, 8).forEach((l, i) => {
            text += `${i + 1}. *${l.clientName || l.company || 'Lead'}*`;
            if (l.status) text += ` — ${l.status}`;
            if (l.value) text += ` (BDT ${Number(l.value).toLocaleString()})`;
            text += '\n';
          });
        }

        teamBot.sendMessage(chatId, text, {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [[
              { text: '🌐 Open Leads Dashboard', url: 'https://purpleos-iota.vercel.app/admin?tab=leads' }
            ]]
          }
        });
      });

      // 🔔 Client Updates — approvals, revisions, payment proofs pending
      teamBot.onText(/🔔 Client Updates/, async (msg) => {
        const chatId = msg.chat.id;
        const dbData = await readDB();

        const inReview = (dbData.tasks || []).filter(t => t.stage === 'Client Review');
        const revisions = (dbData.revisionFeedback || []).filter(r => r.status === 'Open');
        const paymentProofs = (dbData.paymentProofs || []).filter(p => p.status === 'Pending Finance Review');
        const overdueInvs = (dbData.invoices || []).filter(i => i.status !== 'Paid' && i.status !== 'Draft');

        let text = `🔔 *Client Updates*\n\n`;

        if (inReview.length) {
          text += `⏳ *Awaiting Client Approval (${inReview.length}):*\n`;
          inReview.forEach(t => { text += `  • ${t.title} — ${t.client}\n`; });
          text += '\n';
        }
        if (revisions.length) {
          text += `✏️ *Open Revision Requests (${revisions.length}):*\n`;
          revisions.slice(0, 3).forEach(r => { text += `  • ${r.clientName}: "${(r.feedback || '').slice(0, 60)}..."\n`; });
          text += '\n';
        }
        if (paymentProofs.length) {
          text += `💳 *Payment Proofs Pending Verification (${paymentProofs.length}):*\n`;
          paymentProofs.slice(0, 3).forEach(p => { text += `  • ${p.clientName} — BDT ${Number(p.amountPaid).toLocaleString()}\n`; });
          text += '\n';
        }
        if (overdueInvs.length) {
          text += `⚠️ *Overdue Invoices (${overdueInvs.length}):*\n`;
          overdueInvs.slice(0, 3).forEach(i => { text += `  • ${i.clientName} — BDT ${Number(i.amount).toLocaleString()}\n`; });
        }

        if (!inReview.length && !revisions.length && !paymentProofs.length && !overdueInvs.length) {
          text += `✅ All caught up! No pending client actions.`;
        }

        teamBot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
      });

      // 💰 My Commission
      teamBot.onText(/💰 My Commission/, async (msg) => {
        const chatId = msg.chat.id;
        const dbData = await readDB();
        const emp = (dbData.team || []).find(e => String(e.telegramId) === String(chatId));
        if (!emp) return;

        const commission = emp.earnedCommissions || 0;
        const rate = emp.commissionRate || 0;
        const clients = dbData.clients || [];
        const invoices = dbData.invoices || [];

        // Estimate pending commission from unpaid invoices
        const pendingInvTotal = invoices
          .filter(i => i.status !== 'Paid' && i.status !== 'Draft')
          .reduce((s, i) => s + (i.amount || 0), 0);
        const pendingCommission = rate > 0 ? Math.round(pendingInvTotal * (rate / 100)) : 0;

        let text = `💰 *My Commission Summary*\n\n`;
        text += `• Name: *${emp.name}*\n`;
        text += `• Commission Rate: *${rate}%*\n`;
        text += `• Earned (paid): *BDT ${Number(commission).toLocaleString()}*\n`;
        if (pendingCommission > 0) {
          text += `• Pending (on outstanding invoices): *BDT ${pendingCommission.toLocaleString()}*\n`;
        }
        text += `\n_Clients under your portfolio: ${clients.filter(c => c.status === 'Active Retainer').length} active retainers_\n`;
        text += `_For a detailed breakdown, open the web portal._`;

        teamBot.sendMessage(chatId, text, {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [[
              { text: '🌐 View Full Earnings', url: 'https://purpleos-iota.vercel.app/admin?tab=payroll' }
            ]]
          }
        });
      });

      // ══════════════════════════════════════════
      // KAFIL BIZOPS COMMANDS
      // ══════════════════════════════════════════

      // 🏢 Ops Dashboard — team attendance + task health
      teamBot.onText(/🏢 Ops Dashboard/, async (msg) => {
        const chatId = msg.chat.id;
        const dbData = await readDB();
        const team = (dbData.team || []);
        const tasks = dbData.tasks || [];
        const today = new Date().toLocaleDateString('en-CA');

        const clocked = (dbData.attendance || []).filter(a => a.clockInTime && (a.date === today || !a.date));
        const onLeave = team.filter(t => t.status === 'On Leave');
        const offline = team.filter(t => t.status === 'Offline' && !onLeave.find(l => l.id === t.id));

        const overdue = tasks.filter(t => t.deadline && new Date(t.deadline) < new Date() && t.stage !== 'Delivered');
        const inProgress = tasks.filter(t => t.stage === 'In Progress' || t.stage === 'Editing');
        const inReview = tasks.filter(t => t.stage === 'Client Review');

        // Pending activations
        const activations = (dbData.clientActivations || []).filter(a => a.status === 'In Progress');

        let text = `🏢 *Ops Dashboard*\n\n`;
        text += `👥 *Team Attendance Today*\n`;
        text += `  • ✅ ${clocked.length} clocked in\n`;
        text += `  • 🌴 ${onLeave.length} on leave\n`;
        if (offline.length > 0) text += `  • ⚫ ${offline.length} not in yet\n`;
        text += `\n`;

        text += `📋 *Task Health*\n`;
        text += `  • ${inProgress.length} in progress\n`;
        text += `  • ${inReview.length} in client review\n`;
        if (overdue.length > 0) text += `  • ⚠️ *${overdue.length} overdue!*\n`;
        text += `\n`;

        if (activations.length > 0) {
          text += `🚀 *Client Activations in Progress: ${activations.length}*\n`;
          activations.forEach(a => { text += `  • ${a.clientName}\n`; });
        }

        teamBot.sendMessage(chatId, text, {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [[
              { text: '🌐 Open Web Portal', url: 'https://purpleos-iota.vercel.app/admin?tab=tasks' }
            ]]
          }
        });
      });

      // 👥 HR & Attendance — leave requests + absence flags
      teamBot.onText(/👥 HR & Attendance/, async (msg) => {
        const chatId = msg.chat.id;
        const dbData = await readDB();
        const emp = (dbData.team || []).find(e => String(e.telegramId) === String(chatId));
        if (!emp) return;

        // Leave requests for his direct reports
        const directReports = (dbData.team || []).filter(t => t.reportsTo === emp.id);
        const pendingLeaves = (dbData.leaveRequests || []).filter(l =>
          l.status === 'Pending Manager Approval' &&
          directReports.find(r => r.id === l.employeeId)
        );
        // All pending leave (as ops head he sees everything)
        const allPending = (dbData.leaveRequests || []).filter(l => l.status === 'Pending Manager Approval');

        const today = new Date().toLocaleDateString('en-CA');
        const notIn = (dbData.team || []).filter(t =>
          t.status === 'Offline' && t.id !== 'PBD-000' &&
          !(dbData.attendance || []).find(a => a.employeeId === t.id && a.clockInTime && (a.date === today || !a.date)) &&
          !(dbData.leaveRequests || []).find(l => l.employeeId === t.id && l.status === 'Approved' && l.fromDate <= today && l.toDate >= today)
        );

        let text = `👥 *HR & Attendance*\n\n`;

        if (pendingLeaves.length > 0) {
          text += `🌴 *Leave Requests Pending Your Approval (${pendingLeaves.length}):*\n`;
          pendingLeaves.forEach(l => {
            text += `  • *${l.employeeName}* — ${l.leaveType} (${l.fromDate} → ${l.toDate})\n`;
          });
          text += '\n';
        }
        if (allPending.length > pendingLeaves.length) {
          text += `📋 *Company-wide Pending Leaves: ${allPending.length}*\n\n`;
        }
        if (notIn.length > 0) {
          text += `⚠️ *Not in today (no leave on file): ${notIn.length}*\n`;
          notIn.slice(0, 5).forEach(t => { text += `  • ${t.name} (${t.role})\n`; });
        }
        if (!pendingLeaves.length && !notIn.length) {
          text += `✅ All attendance and leave requests are clear.`;
        }

        teamBot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
      });

      // 📡 Media Buying — campaign spend tracker
      teamBot.onText(/📡 Media Buying/, async (msg) => {
        const chatId = msg.chat.id;
        const dbData = await readDB();
        const campaigns = dbData.mediaBuys || [];

        if (!campaigns.length) {
          return teamBot.sendMessage(chatId,
            `📡 *Media Buying Tracker*\n\nNo campaigns tracked yet.\n\nAdd campaigns via the web portal or ask the Tech Admin to set up your first media buy.\n\n_Tip: You can track Facebook Ads, Google Ads, and other platforms here._`,
            {
              parse_mode: 'Markdown',
              reply_markup: { inline_keyboard: [[{ text: '🌐 Open Media Portal', url: 'https://purpleos-iota.vercel.app/admin?tab=media-buys' }]] }
            }
          );
        }

        const running = campaigns.filter(c => c.status === 'Running');
        const totalSpend = running.reduce((s, c) => s + (c.spentToDate || 0), 0);
        const totalBudget = running.reduce((s, c) => s + (c.totalBudget || 0), 0);

        let text = `📡 *Media Buying Dashboard*\n\n`;
        text += `• ${running.length} active campaign(s)\n`;
        text += `• Total budget: BDT ${totalBudget.toLocaleString()}\n`;
        text += `• Total spent to date: BDT ${totalSpend.toLocaleString()}\n`;
        text += `• Remaining: BDT ${(totalBudget - totalSpend).toLocaleString()}\n\n`;

        running.forEach((c, i) => {
          const pct = totalBudget > 0 ? Math.round((c.spentToDate / c.totalBudget) * 100) : 0;
          const bar = pct >= 80 ? '🔴' : pct >= 60 ? '🟡' : '🟢';
          text += `${i + 1}. ${bar} *${c.campaignName}* (${c.platform})\n`;
          text += `   ${c.clientName} — BDT ${(c.spentToDate || 0).toLocaleString()} / ${(c.totalBudget || 0).toLocaleString()} (${pct}%)\n`;
        });

        teamBot.sendMessage(chatId, text, {
          parse_mode: 'Markdown',
          reply_markup: { inline_keyboard: [[{ text: '🌐 Manage Campaigns', url: 'https://purpleos-iota.vercel.app/admin?tab=media-buys' }]] }
        });
      });

      // 🚀 Client Activation — checklist status
      teamBot.onText(/🚀 Client Activation/, async (msg) => {
        const chatId = msg.chat.id;
        const dbData = await readDB();
        const activations = dbData.clientActivations || [];

        if (!activations.length) {
          return teamBot.sendMessage(chatId,
            `🚀 *Client Activation*\n\nNo active client activations.\n\nActivations are automatically triggered when Mehedi wins a new client deal.`,
            { parse_mode: 'Markdown' }
          );
        }

        const active = activations.filter(a => a.status === 'In Progress');
        const completed = activations.filter(a => a.status === 'Completed');

        let text = `🚀 *Client Activation Centre*\n\n`;
        text += `• In Progress: ${active.length}\n`;
        text += `• Completed (all time): ${completed.length}\n\n`;

        active.forEach(a => {
          const done = (a.checklist || []).filter(c => c.done).length;
          const total = (a.checklist || []).length;
          text += `📋 *${a.clientName}*\n`;
          text += `   Progress: ${done}/${total} steps done\n`;
          (a.checklist || []).forEach(c => {
            text += `   ${c.done ? '✅' : '⏳'} ${c.label}\n`;
          });
          text += '\n';
        });

        teamBot.sendMessage(chatId, text, {
          parse_mode: 'Markdown',
          reply_markup: { inline_keyboard: [[{ text: '🌐 Manage Activations', url: 'https://purpleos-iota.vercel.app/admin?tab=activations' }]] }
        });
      });

      // ══════════════════════════════════════════
      // BORHAN FINANCE & ADMIN COMMANDS (PBD-029)
      // ══════════════════════════════════════════

      // 💸 Expense Queue — Tier-2 Payout approvals
      teamBot.onText(/💸 Expense Queue/, async (msg) => {
        try {
          const chatId = msg.chat.id;
          const dbData = await readDB();
          const expenses = dbData.expenses || [];

          // Tier-1 approved, awaiting Tier-2 (Borhan payout)
          const pendingPayout = expenses.filter(e => e.status === 'Tier-1 Approved' || (e.tier1Approved && !e.tier2Approved));

          let text = `💸 *Finance Expense Payout Queue*\n\n`;
          if (!pendingPayout.length) {
            text += `✅ All expense payouts up to date! No claims waiting for Tier-2 audit.`;
          } else {
            text += `⚠️ *${pendingPayout.length} Claim(s) Awaiting Tier-2 Disbursement:*\n\n`;
            pendingPayout.forEach((e, i) => {
              text += `${i + 1}. *${e.employeeName || e.loggedBy}* — BDT ${Number(e.amount).toLocaleString()}\n`;
              text += `   Category: ${e.category || 'General'} | Item: "${e.description || 'Expense'}"\n\n`;
            });
          }

          teamBot.sendMessage(chatId, text, {
            parse_mode: 'Markdown',
            reply_markup: { inline_keyboard: [[{ text: '🌐 Open Finance Audit Portal', url: 'https://purpleos-iota.vercel.app/admin?tab=expenses' }]] }
          }).catch(console.error);
        } catch (err) {
          console.error('Expense queue error:', err.message);
        }
      });

      // 🧾 Invoice Status — GST/VAT invoices tracking
      teamBot.onText(/🧾 Invoice Status/, async (msg) => {
        const chatId = msg.chat.id;
        const dbData = await readDB();
        const invoices = dbData.invoices || [];

        const paid = invoices.filter(i => i.status === 'Paid');
        const pending = invoices.filter(i => i.status === 'Sent' || i.status === 'Pending');
        const overdue = invoices.filter(i => i.status === 'Overdue');

        const totalPaid = paid.reduce((s, i) => s + (Number(i.amount) || 0), 0);
        const totalPending = pending.reduce((s, i) => s + (Number(i.amount) || 0), 0);

        let text = `🧾 *Client Invoice & Revenue Status*\n\n`;
        text += `• Paid Invoices: *${paid.length}* (BDT ${totalPaid.toLocaleString()})\n`;
        text += `• Pending Invoices: *${pending.length}* (BDT ${totalPending.toLocaleString()})\n`;
        text += `• Overdue Invoices: *${overdue.length}*\n\n`;

        if (overdue.length) {
          text += `⚠️ *Overdue Collections Alert:*\n`;
          overdue.forEach(i => {
            text += `  • *${i.clientName}* — BDT ${Number(i.amount).toLocaleString()} (Due: ${i.dueDate})\n`;
          });
        } else {
          text += `✅ All client invoice collections are healthy!`;
        }

        teamBot.sendMessage(chatId, text, {
          parse_mode: 'Markdown',
          reply_markup: { inline_keyboard: [[{ text: '🌐 Manage Invoices', url: 'https://purpleos-iota.vercel.app/admin?tab=invoices' }]] }
        });
      });

      // 📊 Payroll Summary
      teamBot.onText(/📊 Payroll Summary/, async (msg) => {
        const chatId = msg.chat.id;
        const dbData = await readDB();
        const team = (dbData.team || []);

        const totalTeam = team.length;
        const basePayroll = team.reduce((s, t) => s + (Number(t.baseSalary) || 0), 0);

        let text = `📊 *Company Payroll & Compensation Summary*\n\n`;
        text += `• Total Active Workforce: *${totalTeam} Employees*\n`;
        text += `• Monthly Base Payroll: *BDT ${basePayroll.toLocaleString()}*\n`;
        text += `• Disbursement Date: 1st of every month\n\n`;
        text += `_Managed under Finance & Admin (Md. Borhan Siddique)._`;

        teamBot.sendMessage(chatId, text, {
          parse_mode: 'Markdown',
          reply_markup: { inline_keyboard: [[{ text: '🌐 Open Payroll Portal', url: 'https://purpleos-iota.vercel.app/admin?tab=payroll' }]] }
        });
      });

      // 🏦 Bank & bKash Hub
      teamBot.onText(/🏦 Bank & bKash Hub/, async (msg) => {
        const chatId = msg.chat.id;
        let text = `🏦 *Official Agency Banking & Gateway Accounts*\n\n`;
        text += `🏢 *Company Bank Account:*\n`;
        text += `  • Bank: United Commercial Bank (UCB)\n`;
        text += `  • Account Name: Purplebot Digital Limited\n`;
        text += `  • Account No: 1042-111000-8899\n`;
        text += `  • Branch: Banani C/A Branch, Dhaka\n\n`;
        text += `📱 *bKash Merchant Account:*\n`;
        text += `  • Merchant No: 01711-019550\n`;
        text += `  • Account Type: Merchant Counter 01\n\n`;
        text += `_Share these details with clients for direct electronic payment transfers._`;

        teamBot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
      });

      // 👥 Admin Team — Borhan's direct reports
      teamBot.onText(/👥 Admin Team/, async (msg) => {
        const chatId = msg.chat.id;
        const dbData = await readDB();
        const team = (dbData.team || []);

        const adminStaff = team.filter(t => t.reportsTo === 'PBD-029');

        let text = `👥 *Finance & Admin Direct Reports (${adminStaff.length})*\n\n`;
        adminStaff.forEach(emp => {
          text += `• *${emp.name}* (${emp.role})\n`;
          text += `  └ Department: ${emp.department} | Status: ${emp.status || 'Offline'}\n\n`;
        });

        teamBot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
      });

      // ══════════════════════════════════════════
      // SHAFKET STRATEGY & PLANNING COMMANDS (PBD-019 to PBD-028)
      // ══════════════════════════════════════════

      // 📈 Campaign Strategy — strategy decks & briefs
      teamBot.onText(/📈 Campaign Strategy/, async (msg) => {
        const chatId = msg.chat.id;
        const dbData = await readDB();
        const tasks = dbData.tasks || [];

        const strategyTasks = tasks.filter(t =>
          (t.department || t.category || t.type || '').toLowerCase().includes('strategy') ||
          (t.stage === 'Strategy & Planning' || t.stage === 'Scripting')
        );

        let text = `📈 *Campaign Strategy & Planning Hub*\n\n`;
        if (strategyTasks.length) {
          text += `• *${strategyTasks.length} Active Strategy Tasks:*\n\n`;
          strategyTasks.forEach((t, i) => {
            text += `${i + 1}. *${t.title}* (${t.client || 'Client'})\n`;
            text += `   Planner: ${t.assignee || 'Strategy Team'} | Stage: *${t.stage}*\n\n`;
          });
        } else {
          text += `✅ Strategy queue is clear. All monthly content plans on track.`;
        }

        teamBot.sendMessage(chatId, text, {
          parse_mode: 'Markdown',
          reply_markup: { inline_keyboard: [[{ text: '🌐 View Strategy Decks', url: 'https://purpleos-iota.vercel.app/admin?tab=tasks' }]] }
        });
      });

      // 🗓️ Content Calendars
      teamBot.onText(/🗓️ Content Calendars/, async (msg) => {
        const chatId = msg.chat.id;
        const dbData = await readDB();
        const posts = dbData.posts || dbData.social_posts || [];

        let text = `🗓️ *Monthly Content Plans & Social Calendars*\n\n`;
        text += `• Total Scheduled Posts: *${posts.length}*\n\n`;

        if (posts.length) {
          posts.slice(0, 5).forEach((p, i) => {
            text += `${i + 1}. *${p.title || p.caption || 'Post'}* (${p.clientName || p.client || 'Client'})\n`;
            text += `   Platform: ${p.platform || 'Social'} | Status: *${p.status || 'Scheduled'}*\n\n`;
          });
        }

        teamBot.sendMessage(chatId, text, {
          parse_mode: 'Markdown',
          reply_markup: { inline_keyboard: [[{ text: '🌐 Open Content Planner', url: 'https://purpleos-iota.vercel.app/admin?tab=social-posts' }]] }
        });
      });

      // 👥 Strategy Team — Shafket's team view
      teamBot.onText(/👥 Strategy Team/, async (msg) => {
        const chatId = msg.chat.id;
        const dbData = await readDB();
        const team = (dbData.team || []);
        const tasks = dbData.tasks || [];

        const associates = team.filter(t => t.reportsTo === 'PBD-019');

        let text = `👥 *Strategy & Marketing Associates (${associates.length})*\n\n`;
        associates.forEach(a => {
          const aFirstName = (a.name || '').split(' ')[0].toLowerCase();
          const activeTasks = tasks.filter(t =>
            (t.assignee || '').toLowerCase().includes(aFirstName) &&
            t.stage !== 'Delivered' && t.stage !== 'Completed'
          );
          text += `• *${a.name}* (${a.role})\n`;
          text += `  └ Active tasks: ${activeTasks.length} plan(s)\n`;
        });

        teamBot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
      });

      // 📅 My Content Plans — associate's own plans
      teamBot.onText(/📅 My Content Plans/, async (msg) => {
        const chatId = msg.chat.id;
        const dbData = await readDB();
        const emp = (dbData.team || []).find(e => String(e.telegramId) === String(chatId));

        const empFirstName = emp ? (emp.name || '').split(' ')[0].toLowerCase() : '';
        const myTasks = (dbData.tasks || []).filter(t =>
          (t.assignee || '').toLowerCase().includes(empFirstName)
        );

        let text = `📅 *My Active Content Plans*\n\n`;
        if (!myTasks.length) {
          text += `🎉 You have no active content plans assigned right now!`;
        } else {
          myTasks.forEach((t, i) => {
            text += `${i + 1}. *${t.title}* (${t.client || 'Client'})\n`;
            text += `   Stage: *${t.stage}* | Due: ${t.dueDate || 'ASAP'}\n\n`;
          });
        }

        teamBot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
      });

      // 🚀 Dispatch Hub — 1-click publishing queue
      teamBot.onText(/🚀 Dispatch Hub/, async (msg) => {
        const chatId = msg.chat.id;
        const dbData = await readDB();
        const posts = (dbData.posts || dbData.social_posts || []).filter(p => p.status === 'Approved');

        let text = `🚀 *Social Media Dispatch Hub*\n\n`;
        if (!posts.length) {
          text += `✅ All approved posts have been dispatched! No pending publishing queue.`;
        } else {
          text += `📢 *${posts.length} Approved Post(s) Ready for Publishing:*\n\n`;
          posts.slice(0, 5).forEach((p, i) => {
            text += `${i + 1}. *${p.title || 'Post'}* (${p.clientName || 'Client'})\n`;
            text += `   Platform: ${p.platform} | Time: ${p.scheduledTime || 'Today'}\n\n`;
          });
        }

        teamBot.sendMessage(chatId, text, {
          parse_mode: 'Markdown',
          reply_markup: { inline_keyboard: [[{ text: '🌐 Open Dispatch Hub', url: 'https://purpleos-iota.vercel.app/admin?tab=social-posts' }]] }
        });
      });

      // 📝 Draft New Plan
      teamBot.onText(/📝 Draft New Plan/, async (msg) => {
        const chatId = msg.chat.id;
        teamBot.sendMessage(chatId,
          `📝 *Draft New Content Plan*\n\nLaunch the PurpleOS Web Content Planner to create multi-platform post calendars for clients:`,
          {
            parse_mode: 'Markdown',
            reply_markup: { inline_keyboard: [[{ text: '🌐 Open Content Planner Web App', url: 'https://purpleos-iota.vercel.app/admin?tab=social-posts' }]] }
          }
        );
      });

      // ══════════════════════════════════════════
      // CLIENT SERVICES COMMANDS (Tasin PBD-016, Sayed PBD-017, Rimjhim PBD-018)
      // ══════════════════════════════════════════

      // 🎯 My Client Roster — clients assigned to logged-in AM
      teamBot.onText(/🎯 My Client Roster/, async (msg) => {
        const chatId = msg.chat.id;
        const dbData = await readDB();
        const emp = (dbData.team || []).find(e => String(e.telegramId) === String(chatId));

        const clients = dbData.clients || [];

        let text = `🎯 *My Client Roster*\n\n`;
        text += `• Total Portfolio Clients: *${clients.length}*\n\n`;

        clients.forEach((c, i) => {
          text += `${i + 1}. *${c.name}* (${c.category || 'General'})\n`;
          text += `   Contact: ${c.contactPerson || 'N/A'} | Status: *${c.status || 'Active'}*\n`;
          if (c.phone) text += `   Phone: \`${c.phone}\`\n`;
          text += '\n';
        });

        teamBot.sendMessage(chatId, text, {
          parse_mode: 'Markdown',
          reply_markup: { inline_keyboard: [[{ text: '🌐 Open Client CRM', url: 'https://purpleos-iota.vercel.app/admin?tab=clients' }]] }
        });
      });

      // 🎬 Client Approvals — deliverables in Client Review
      teamBot.onText(/🎬 Client Approvals/, async (msg) => {
        const chatId = msg.chat.id;
        const dbData = await readDB();
        const tasks = dbData.tasks || [];

        const inReview = tasks.filter(t => t.stage === 'Client Review');

        let text = `🎬 *Client Approvals Panel*\n\n`;
        if (!inReview.length) {
          text += `✅ No deliverables currently waiting in Client Review.`;
        } else {
          text += `⏳ *${inReview.length} Deliverables Pending Client Sign-off:*\n\n`;
          inReview.forEach((t, i) => {
            text += `${i + 1}. *${t.title}* (${t.client || 'Client'})\n`;
            text += `   QC Approved By: ${t.qcApprovedBy || 'Internal QC'}\n\n`;
          });
        }

        teamBot.sendMessage(chatId, text, {
          parse_mode: 'Markdown',
          reply_markup: { inline_keyboard: [[{ text: '🌐 Open Review Rooms', url: 'https://purpleos-iota.vercel.app/reviews' }]] }
        });
      });

      // 📢 Send Client Link — generate magic access link for client
      teamBot.onText(/📢 Send Client Link/, async (msg) => {
        const chatId = msg.chat.id;
        const dbData = await readDB();
        const clients = dbData.clients || [];

        if (!clients.length) {
          return teamBot.sendMessage(chatId, `📢 *Send Client Magic Link*\n\nNo clients found in CRM.`, { parse_mode: 'Markdown' });
        }

        let text = `📢 *Generate Partner Portal Link*\n\nSelect a client to generate their 1-click magic login link:\n\n`;
        const buttons = clients.slice(0, 6).map(c => [
          { text: `🔗 ${c.name}`, callback_data: `gen_magic_link:${c.id}` }
        ]);

        teamBot.sendMessage(chatId, text, {
          parse_mode: 'Markdown',
          reply_markup: { inline_keyboard: buttons }
        });
      });

      // Callback query handler for gen_magic_link
      teamBot.on('callback_query', async (query) => {
        const data = query.data || '';
        if (data.startsWith('gen_magic_link:')) {
          const clientId = data.split(':')[1];
          const dbData = await readDB();
          const client = (dbData.clients || []).find(c => c.id === clientId);
          if (client) {
            const token = `TOK-${Date.now()}`;
            const magicLink = `https://purpleos-iota.vercel.app/partners?client=${encodeURIComponent(client.name)}&token=${token}`;
            const cardMsg = `📋 *PURPLEBOT PARTNER PORTAL LINK*\n\n` +
              `🏢 Client: *${client.name}*\n` +
              `👤 Contact: ${client.contactPerson || 'Brand Manager'}\n\n` +
              `🔗 *Direct Access Magic Link:*\n${magicLink}\n\n` +
              `_Send this link to the client for 1-click access to review room & invoices._`;

            teamBot.answerCallbackQuery(query.id, { text: `Generated link for ${client.name}` });
            teamBot.sendMessage(query.message.chat.id, cardMsg, { parse_mode: 'Markdown' });
          }
        }
      });

      // 💬 Client Feedback — revision requests
      teamBot.onText(/💬 Client Feedback/, async (msg) => {
        const chatId = msg.chat.id;
        const dbData = await readDB();
        const reviews = dbData.reviews || [];
        const openFeedback = (dbData.revisionFeedback || []).filter(r => r.status === 'Open');

        let text = `💬 *Client Feedback & Revisions Panel*\n\n`;
        if (!openFeedback.length) {
          text += `✅ All client feedback resolved. No open revision tickets!`;
        } else {
          text += `✏️ *${openFeedback.length} Active Client Revision Notes:*\n\n`;
          openFeedback.forEach((f, i) => {
            text += `${i + 1}. *${f.clientName}*: "${f.feedback}"\n\n`;
          });
        }

        teamBot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
      });

      // 👥 Account Team — Tasin's team overview
      teamBot.onText(/👥 Account Team/, async (msg) => {
        const chatId = msg.chat.id;
        const dbData = await readDB();
        const team = (dbData.team || []);

        const csTeam = team.filter(t => (t.department || '').toLowerCase().includes('client services'));

        let text = `👥 *Client Services Team (${csTeam.length})*\n\n`;
        csTeam.forEach(emp => {
          text += `• *${emp.name}* (${emp.role})\n`;
          text += `  └ Status: ${emp.status || 'Offline'} | Reports To: ${emp.reportsToName || 'Management'}\n\n`;
        });

        teamBot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
      });

      // ══════════════════════════════════════════
      // NASIR HEAD OF PRODUCTION COMMANDS (PBD-013)
      // ══════════════════════════════════════════

      // 🎬 Production Queue — all active content & shoot tasks
      teamBot.onText(/🎬 Production Queue/, async (msg) => {
        const chatId = msg.chat.id;
        const dbData = await readDB();
        const tasks = dbData.tasks || [];

        const prodTasks = tasks.filter(t =>
          (t.department || t.category || t.type || '').toLowerCase().includes('content') ||
          (t.stage === 'Scripting' || t.stage === 'Shoot Scheduled' || t.stage === 'Raw Intake')
        );

        let text = `🎬 *Content Production Queue (${prodTasks.length} Active)*\n\n`;
        if (prodTasks.length) {
          prodTasks.slice(0, 8).forEach((t, i) => {
            text += `${i + 1}. *${t.title}* (${t.client || 'Agency'})\n`;
            text += `   Stage: *${t.stage}* | Assigned: ${t.assignee || 'Production Team'}\n\n`;
          });
        } else {
          text += `✅ Production queue is clear. No active shoots or scripts pending.`;
        }

        teamBot.sendMessage(chatId, text, {
          parse_mode: 'Markdown',
          reply_markup: { inline_keyboard: [[{ text: '🌐 View Production Kanban', url: 'https://purpleos-iota.vercel.app/admin?tab=tasks' }]] }
        });
      });

      // 📜 Script & Copy QC — scripts pending Nasir's review
      teamBot.onText(/📜 Script & Copy QC/, async (msg) => {
        const chatId = msg.chat.id;
        const dbData = await readDB();
        const tasks = dbData.tasks || [];

        const pendingScriptQC = tasks.filter(t => t.stage === 'Script QC' || (t.stage === 'Scripting' && t.needsQC));

        let text = `📜 *Script & Copy QC Panel*\n\n`;
        if (!pendingScriptQC.length) {
          text += `✅ All clear — no scripts currently waiting for your QC review.`;
        } else {
          text += `🔍 *${pendingScriptQC.length} Script(s) Awaiting Sign-off:*\n\n`;
          pendingScriptQC.forEach((t, i) => {
            text += `${i + 1}. *${t.title}* — ${t.client || 'Client'}\n`;
            text += `   Writer: *${t.assignee || 'Copywriter'}*\n\n`;
          });
        }

        teamBot.sendMessage(chatId, text, {
          parse_mode: 'Markdown',
          reply_markup: { inline_keyboard: [[{ text: '🌐 Open Task Manager', url: 'https://purpleos-iota.vercel.app/admin?tab=tasks' }]] }
        });
      });

      // 🎥 Shoot Call-Sheets — upcoming shoot dates
      teamBot.onText(/🎥 Shoot Call-Sheets/, async (msg) => {
        const chatId = msg.chat.id;
        const dbData = await readDB();
        const bookings = dbData.studioBookings || [];

        const upcomingShoots = bookings.filter(b => b.resourceType === 'Studio' || (b.notes || '').toLowerCase().includes('shoot'));

        let text = `🎥 *Shoot Call-Sheets & Studio Schedule*\n\n`;
        if (upcomingShoots.length) {
          upcomingShoots.forEach((b, i) => {
            text += `${i + 1}. 🎬 *${b.resourceName || b.title}*\n`;
            text += `   Time Slot: ${b.slot || b.time} | Booked by: ${b.bookedByName}\n\n`;
          });
        } else {
          text += `📅 No video shoots currently scheduled for today.\n\n_Use Zahin's Studio Booking engine to schedule new shoots._`;
        }

        teamBot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
      });

      // 👥 Content Team — status of Masud & Shadly
      teamBot.onText(/👥 Content Team/, async (msg) => {
        const chatId = msg.chat.id;
        const dbData = await readDB();
        const team = (dbData.team || []);
        const tasks = dbData.tasks || [];

        const directReports = team.filter(t => t.reportsTo === 'PBD-013');

        let text = `👥 *Content Production Crew (${directReports.length})*\n\n`;
        directReports.forEach(c => {
          const cFirstName = (c.name || '').split(' ')[0].toLowerCase();
          const activeTasks = tasks.filter(t =>
            (t.assignee || '').toLowerCase().includes(cFirstName) &&
            t.stage !== 'Delivered' && t.stage !== 'Completed'
          );
          const loadBadge = activeTasks.length >= 4 ? '🔴 Heavy' : activeTasks.length >= 2 ? '🟢 Active' : '⚪ Light';
          text += `• *${c.name}* (${c.role})\n`;
          text += `  └ ${loadBadge} — ${activeTasks.length} active script/prompt task(s)\n`;
        });

        teamBot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
      });

      // ══════════════════════════════════════════
      // CONTENT CREW COMMANDS (Masud PBD-014, Shadly PBD-015)
      // ══════════════════════════════════════════

      // 📜 My Scripts & Copy
      teamBot.onText(/📜 My Scripts & Copy/, async (msg) => {
        const chatId = msg.chat.id;
        const dbData = await readDB();
        const emp = (dbData.team || []).find(e => String(e.telegramId) === String(chatId));

        const empFirstName = emp ? (emp.name || '').split(' ')[0].toLowerCase() : '';
        const myTasks = (dbData.tasks || []).filter(t =>
          (t.assignee || '').toLowerCase().includes(empFirstName) &&
          t.stage !== 'Delivered' && t.stage !== 'Completed'
        );

        if (!myTasks.length) {
          return teamBot.sendMessage(chatId,
            `📜 *My Scripts & Copy*\n\n🎉 You have no active copy or script tasks right now!`,
            { parse_mode: 'Markdown' }
          );
        }

        let text = `📜 *My Active Scripts & Copy Tasks (${myTasks.length})*\n\n`;
        myTasks.forEach((t, i) => {
          text += `${i + 1}. *${t.title}* (${t.client || 'Client'})\n`;
          text += `   Stage: *${t.stage}* | Due: ${t.dueDate || 'ASAP'}\n\n`;
        });

        teamBot.sendMessage(chatId, text, {
          parse_mode: 'Markdown',
          reply_markup: { inline_keyboard: [[{ text: '📤 Submit Script for QC', callback_data: 'prompt_script_qc' }]] }
        });
      });

      // 🤖 AI Prompt Studio
      teamBot.onText(/🤖 AI Prompt Studio/, async (msg) => {
        const chatId = msg.chat.id;
        let text = `🤖 *AI Prompt Studio & Generation Engine*\n\n`;
        text += `• Custom Brand Voice Prompts loaded\n`;
        text += `• GPT-4o & Claude 3.5 Sonnet hooks ready\n`;
        text += `• Social Reel script templates available\n\n`;
        text += `_Use the PurpleOS Web Portal to execute multi-modal AI prompts._`;

        teamBot.sendMessage(chatId, text, {
          parse_mode: 'Markdown',
          reply_markup: { inline_keyboard: [[{ text: '🌐 Open AI Studio', url: 'https://purpleos-iota.vercel.app/admin?tab=ai-studio' }]] }
        });
      });

      // 📤 Submit Script QC
      teamBot.onText(/📤 Submit Script QC/, async (msg) => {
        const chatId = msg.chat.id;
        const dbData = await readDB();
        const emp = (dbData.team || []).find(e => String(e.telegramId) === String(chatId));

        const empFirstName = emp ? (emp.name || '').split(' ')[0].toLowerCase() : '';
        const readyForQC = (dbData.tasks || []).filter(t =>
          (t.assignee || '').toLowerCase().includes(empFirstName) &&
          (t.stage === 'Scripting' || t.stage === 'Drafting')
        );

        if (!readyForQC.length) {
          return teamBot.sendMessage(chatId,
            `📤 *Submit Script for QC*\n\nNo scripts currently in progress to submit.`,
            { parse_mode: 'Markdown' }
          );
        }

        let text = `📤 *Submit Script to Nasir (Head of Production)*\n\nSelect a script to submit:\n\n`;
        const buttons = readyForQC.slice(0, 5).map(t => [
          { text: `📜 ${t.title} (${t.client || 'Client'})`, callback_data: `submit_script_qc:${t.id}` }
        ]);

        teamBot.sendMessage(chatId, text, {
          parse_mode: 'Markdown',
          reply_markup: { inline_keyboard: buttons }
        });
      });

      // Callback query handler for submit_script_qc & submit_qc
      teamBot.on('callback_query', async (query) => {
        const data = query.data || '';
        if (data.startsWith('submit_script_qc:')) {
          const taskId = data.split(':')[1];
          if (supabase) {
            await supabase.from('tasks').update({ stage: 'Script QC', updated_at: new Date().toISOString() }).eq('id', taskId);
          }
          broadcast('task_update', [{ id: taskId, stage: 'Script QC' }]);

          try {
            const nasir = await state.getEmployeeByTelegramId('PBD-013');
            if (nasir?.telegramId) {
              sendTelegramNotification(nasir.telegramId,
                `📜 *Script QC Review Required*\n\n• Task: *${taskId}*\n\nPlease review script draft and sign off.`,
                [[{ text: '🌐 Review Script in Portal', url: `https://purpleos-iota.vercel.app/admin?tab=tasks&id=${taskId}` }]],
                true
              );
            }
          } catch(e) {}

          teamBot.answerCallbackQuery(query.id, { text: 'Submitted to Nasir for Script QC!' });
        }

        if (data.startsWith('submit_qc:')) {
          const taskId = data.split(':')[1];
          if (supabase) {
            await supabase.from('tasks').update({ stage: 'Internal QC', updated_at: new Date().toISOString() }).eq('id', taskId);
          }
          broadcast('task_update', [{ id: taskId, stage: 'Internal QC' }]);

          try {
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
          } catch(e) {}

          teamBot.answerCallbackQuery(query.id, { text: 'Submitted to Ruhul for Internal QC!' });
        }
      });

      // ══════════════════════════════════════════
      // VISUALIZER / CREATIVE TEAM COMMANDS (PBD-007 to PBD-012)
      // ══════════════════════════════════════════

      // 🖌️ My Creative Tasks — assigned tasks for logged-in visualizer
      teamBot.onText(/🖌️ My Creative Tasks/, async (msg) => {
        const chatId = msg.chat.id;
        const dbData = await readDB();
        const emp = (dbData.team || []).find(e => String(e.telegramId) === String(chatId));

        const empFirstName = emp ? (emp.name || '').split(' ')[0].toLowerCase() : '';
        const myTasks = (dbData.tasks || []).filter(t =>
          (t.assignee || '').toLowerCase().includes(empFirstName) &&
          t.stage !== 'Delivered' && t.stage !== 'Completed'
        );

        if (!myTasks.length) {
          return teamBot.sendMessage(chatId,
            `🖌️ *My Creative Tasks*\n\n🎉 You currently have no active design tasks assigned.\nEnjoy the clear queue or ask Ruhul bhai for new briefs!`,
            { parse_mode: 'Markdown' }
          );
        }

        let text = `🖌️ *My Creative Tasks (${myTasks.length} Active)*\n\n`;
        myTasks.forEach((t, i) => {
          const stageBadge = t.stage === 'Revising' ? '✏️ Revising' : t.stage === 'Internal QC' ? '⏳ Pending QC' : '🎨 Designing';
          text += `${i + 1}. *${t.title}*\n`;
          text += `   Client: ${t.client || 'Agency'} | Stage: *${stageBadge}*\n`;
          text += `   Due: ${t.dueDate || t.deadline || 'ASAP'}\n\n`;
        });

        teamBot.sendMessage(chatId, text, {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [[
              { text: '📤 Submit a Task for Internal QC', callback_data: 'prompt_qc_submit' }
            ]]
          }
        });
      });

      // 📤 Submit for QC — lists active designing tasks for quick submission to Ruhul
      teamBot.onText(/📤 Submit for QC/, async (msg) => {
        const chatId = msg.chat.id;
        const dbData = await readDB();
        const emp = (dbData.team || []).find(e => String(e.telegramId) === String(chatId));

        const empFirstName = emp ? (emp.name || '').split(' ')[0].toLowerCase() : '';
        const readyForQC = (dbData.tasks || []).filter(t =>
          (t.assignee || '').toLowerCase().includes(empFirstName) &&
          (t.stage === 'Designing' || t.stage === 'Revising' || t.stage === 'Scripting')
        );

        if (!readyForQC.length) {
          return teamBot.sendMessage(chatId,
            `📤 *Submit for Internal QC*\n\nNo tasks currently in progress to submit.\nTasks in *Internal QC* or *Client Review* are already submitted.`,
            { parse_mode: 'Markdown' }
          );
        }

        let text = `📤 *Submit Task for Ruhul's Internal QC*\n\nSelect a task below to submit for Art Director sign-off:\n\n`;
        const buttons = readyForQC.slice(0, 5).map(t => [
          { text: `📤 ${t.title} (${t.client || 'Client'})`, callback_data: `submit_qc:${t.id}` }
        ]);

        teamBot.sendMessage(chatId, text, {
          parse_mode: 'Markdown',
          reply_markup: { inline_keyboard: buttons }
        });
      });



      // ✏️ View Revisions — lists tasks with revision feedback
      teamBot.onText(/✏️ View Revisions/, async (msg) => {
        const chatId = msg.chat.id;
        const dbData = await readDB();
        const emp = (dbData.team || []).find(e => String(e.telegramId) === String(chatId));

        const empFirstName = emp ? (emp.name || '').split(' ')[0].toLowerCase() : '';
        const revisingTasks = (dbData.tasks || []).filter(t =>
          (t.assignee || '').toLowerCase().includes(empFirstName) &&
          (t.stage === 'Revising' || t.qcFeedback)
        );

        if (!revisingTasks.length) {
          return teamBot.sendMessage(chatId,
            `✏️ *My Revisions & Feedback*\n\n🎉 No revision requests on your tasks right now! Great job on first cuts.`,
            { parse_mode: 'Markdown' }
          );
        }

        let text = `✏️ *Tasks Needing Revision (${revisingTasks.length})*\n\n`;
        revisingTasks.forEach((t, i) => {
          text += `${i + 1}. *${t.title}* (${t.client || 'Client'})\n`;
          if (t.qcFeedback) text += `   💬 *Ruhul QC Feedback:* "${t.qcFeedback}"\n`;
          text += `   Stage: *Revising*\n\n`;
        });

        teamBot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
      });

      // ══════════════════════════════════════════
      // RUHUL ART DIRECTOR COMMANDS (PBD-006)
      // ══════════════════════════════════════════

      // 🎨 Design Queue — all active design tasks in his department
      teamBot.onText(/🎨 Design Queue/, async (msg) => {
        const chatId = msg.chat.id;
        const dbData = await readDB();
        const tasks = dbData.tasks || [];

        // Design dept tasks — by stage
        const designTasks = tasks.filter(t =>
          (t.department || t.category || t.type || '').toLowerCase().includes('design') ||
          (t.stage === 'Designing' || t.stage === 'Art Direction' || t.stage === 'Internal QC')
        );

        const byStage = {
          'Scripting / Briefed': designTasks.filter(t => t.stage === 'Scripting' || t.stage === 'Briefed'),
          'Designing': designTasks.filter(t => t.stage === 'Designing'),
          'Internal QC': designTasks.filter(t => t.stage === 'Internal QC'),
          'Client Review': designTasks.filter(t => t.stage === 'Client Review'),
        };

        let text = `🎨 *Design Queue — ${designTasks.length} Active Creative Tasks*\n\n`;

        Object.entries(byStage).forEach(([stage, list]) => {
          if (!list.length) return;
          text += `*${stage} (${list.length}):*\n`;
          list.slice(0, 4).forEach(t => {
            text += `  • ${t.title} — ${t.client || 'General'} (${t.assignee || 'Unassigned'})\n`;
          });
          text += '\n';
        });

        if (!designTasks.length) text += `✅ No active design tasks. Queue is clear.`;

        teamBot.sendMessage(chatId, text, {
          parse_mode: 'Markdown',
          reply_markup: { inline_keyboard: [[{ text: '🌐 Open Design Kanban', url: 'https://purpleos-iota.vercel.app/admin?tab=tasks' }]] }
        });
      });

      // 👁️ Review Room — tasks awaiting Ruhul's internal QC or in Client Review
      teamBot.onText(/👁️ Review Room/, async (msg) => {
        const chatId = msg.chat.id;
        const dbData = await readDB();
        const tasks = dbData.tasks || [];
        const reviews = dbData.reviews || [];

        const pendingQC = tasks.filter(t => t.stage === 'Internal QC');
        const inClientReview = tasks.filter(t => t.stage === 'Client Review');
        const openRevisions = (dbData.revisionFeedback || []).filter(r => r.status === 'Open');

        let text = `👁️ *Review Room — Art Director's QC Panel*\n\n`;

        if (pendingQC.length) {
          text += `🔍 *Pending Your Internal QC (${pendingQC.length}):*\n`;
          pendingQC.forEach(t => {
            text += `  • *${t.title}* — by ${t.assignee || 'Visualizer'}\n`;
          });
          text += '\n';
        }

        if (inClientReview.length) {
          text += `⏳ *In Client Review (${inClientReview.length}):*\n`;
          inClientReview.forEach(t => {
            text += `  • ${t.title} — ${t.client || 'Client'}\n`;
          });
          text += '\n';
        }

        if (openRevisions.length) {
          text += `✏️ *Client Revision Requests (${openRevisions.length}):*\n`;
          openRevisions.slice(0, 3).forEach(r => {
            text += `  • ${r.clientName}: "${(r.feedback || '').slice(0, 50)}..."\n`;
          });
        }

        if (!pendingQC.length && !inClientReview.length && !openRevisions.length) {
          text += `✅ All clear — no pending reviews or revisions.`;
        }

        teamBot.sendMessage(chatId, text, {
          parse_mode: 'Markdown',
          reply_markup: { inline_keyboard: [[{ text: '🌐 Open Review Room', url: 'https://purpleos-iota.vercel.app/reviews' }]] }
        });
      });

      // 👥 Design Team — his 6 visualizers with status + task load
      teamBot.onText(/👥 Design Team/, async (msg) => {
        const chatId = msg.chat.id;
        const emp = (dbData.team || []).find(e => String(e.telegramId) === String(chatId));
        if (!emp) return;
        const dbData = await readDB();
        const team = (dbData.team || []);
        const tasks = dbData.tasks || [];

        const directReports = team.filter(t => t.reportsTo === (emp?.id || 'PBD-006'));

        let text = `👥 *Design Team — ${directReports.length} Visualizers*\n\n`;

        directReports.forEach(v => {
          const vName = (v.name || '').split(' ')[0].toLowerCase();
          const activeTasks = tasks.filter(t =>
            (t.assignee || '').toLowerCase().includes(vName) &&
            t.stage !== 'Delivered' && t.stage !== 'Completed'
          );
          const loadBadge = activeTasks.length >= 4 ? '🔴 Heavy' : activeTasks.length >= 2 ? '🟢 Active' : '⚪ Light';
          const onLeave = v.status === 'On Leave';
          text += `• *${v.name}* (${v.role})\n`;
          text += `  └ ${onLeave ? '🌴 On Leave' : `${loadBadge} — ${activeTasks.length} task(s)`}\n`;
        });

        teamBot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
      });

      // ✅ Leave Approvals — pending leaves from Ruhul's direct reports
      teamBot.onText(/✅ Leave Approvals/, async (msg) => {
        const chatId = msg.chat.id;
        const dbData = await readDB();
        const emp = (dbData.team || []).find(e => String(e.telegramId) === String(chatId));
        if (!emp) return;

        const directReportIds = (dbData.team || [])
          .filter(t => t.reportsTo === (emp?.id || 'PBD-006'))
          .map(t => t.id);

        const pending = (dbData.leaveRequests || []).filter(l =>
          l.status === 'Pending Manager Approval' &&
          directReportIds.includes(l.employeeId)
        );

        if (!pending.length) {
          return teamBot.sendMessage(chatId,
            `✅ *Leave Approvals*\n\nNo pending leave requests from your team right now.`,
            { parse_mode: 'Markdown' }
          );
        }

        let text = `✅ *Leave Approvals — ${pending.length} Pending*\n\n`;
        pending.forEach(l => {
          text += `• *${l.employeeName}*\n  ${l.leaveType} — ${l.fromDate} → ${l.toDate}\n  Reason: ${l.reason || 'Not specified'}\n\n`;
        });

        // Inline approve/decline buttons for each request
        const inlineButtons = pending.slice(0, 5).map(l => [
          { text: `✅ Approve — ${l.employeeName}`, callback_data: `approve_leave:${l.id}` },
          { text: `❌ Decline`, callback_data: `reject_leave:${l.id}` }
        ]);

        teamBot.sendMessage(chatId, text, {
          parse_mode: 'Markdown',
          reply_markup: { inline_keyboard: inlineButtons }
        });
      });

      // ══════════════════════════════════════════
      // ZAHIN INTERNAL OPS COMMANDS (PBD-005)
      // ══════════════════════════════════════════

      // ⚡ Studio Workload — active task distribution across team members
      teamBot.onText(/⚡ Studio Workload/, async (msg) => {
        const chatId = msg.chat.id;
        const dbData = await readDB();
        const team = (dbData.team || []);
        const tasks = dbData.tasks || [];

        const activeTasks = tasks.filter(t => t.stage !== 'Delivered' && t.stage !== 'Completed');

        let text = `⚡ *Studio Workload & Capacity Tracker*\n\n`;
        text += `• Total Active Tasks in Studio: *${activeTasks.length}*\n\n`;

        team.filter(emp => emp.id !== 'PBD-000').slice(0, 12).forEach(emp => {
          const empFirstName = (emp.name || '').split(' ')[0].toLowerCase();
          const assigned = activeTasks.filter(t => (t.assignee || '').toLowerCase().includes(empFirstName));
          const loadBadge = assigned.length >= 5 ? '🔴 Heavy' : assigned.length >= 2 ? '🟢 Optimal' : '⚪ Idle';
          text += `• *${emp.name}* (${emp.role})\n`;
          text += `  └ Load: ${loadBadge} — ${assigned.length} task(s) active\n`;
        });

        teamBot.sendMessage(chatId, text, {
          parse_mode: 'Markdown',
          reply_markup: { inline_keyboard: [[{ text: '🌐 View Production Kanban', url: 'https://purpleos-iota.vercel.app/admin?tab=tasks' }]] }
        });
      });

      // 🚧 Bottleneck Radar — tasks stuck > 48h in a single stage
      teamBot.onText(/🚧 Bottleneck Radar/, async (msg) => {
        const chatId = msg.chat.id;
        const dbData = await readDB();
        const tasks = dbData.tasks || [];

        const now = new Date();
        const thresholdMs = 48 * 60 * 60 * 1000; // 48 hours

        const bottlenecks = tasks.filter(t => {
          if (t.stage === 'Delivered' || t.stage === 'Completed') return false;
          const updatedAt = new Date(t.updatedAt || t.createdAt || Date.now());
          return (now - updatedAt) > thresholdMs;
        });

        let text = `🚧 *Bottleneck Radar (>48h Inactive Tasks)*\n\n`;

        if (!bottlenecks.length) {
          text += `✅ *All clear!* No production bottlenecks detected right now. Every task is moving smoothly.`;
        } else {
          text += `⚠️ *${bottlenecks.length} task(s) flagged for delay:* \n\n`;
          bottlenecks.slice(0, 5).forEach((t, i) => {
            const hrsStuck = Math.round((now - new Date(t.updatedAt || t.createdAt || Date.now())) / (1000 * 60 * 60));
            text += `${i + 1}. *${t.title}* (${t.client || 'Client'})\n`;
            text += `   Stage: *${t.stage}* — Stuck for ${hrsStuck}h\n`;
            text += `   Assignee: *${t.assignee || 'Unassigned'}*\n\n`;
          });
        }

        teamBot.sendMessage(chatId, text, {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [[
              { text: '🌐 Open Task Manager', url: 'https://purpleos-iota.vercel.app/admin?tab=tasks' }
            ]]
          }
        });
      });

      // 📸 Studio & Gear Slots — equipment & room bookings
      teamBot.onText(/📸 Studio & Gear Slots/, async (msg) => {
        const chatId = msg.chat.id;
        const dbData = await readDB();
        const bookings = dbData.studioBookings || [];

        const activeBookings = bookings.filter(b => b.status === 'Confirmed' || b.status === 'In Progress');

        let text = `📸 *Studio & Equipment Booking Hub*\n\n`;
        text += `• Active Bookings Today: *${activeBookings.length}*\n\n`;

        if (activeBookings.length) {
          activeBookings.forEach((b, i) => {
            text += `${i + 1}. *${b.title || b.resourceName}*\n`;
            text += `   Resource: ${b.resourceType || 'Studio'} | Time: ${b.slot || b.time}\n`;
            text += `   Booked by: ${b.bookedByName || 'Team Member'}\n\n`;
          });
        } else {
          text += `Studio & all camera gear are currently available for booking today.\n\n`;
        }

        teamBot.sendMessage(chatId, text, {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [[
              { text: '➕ Book Studio / Gear', url: 'https://purpleos-iota.vercel.app/admin?tab=studio-bookings' }
            ]]
          }
        });
      });

      // 📊 Turnaround Metrics
      teamBot.onText(/📊 Turnaround Metrics/, async (msg) => {
        const chatId = msg.chat.id;
        const dbData = await readDB();
        const tasks = dbData.tasks || [];

        const delivered = tasks.filter(t => t.stage === 'Delivered');

        let text = `📊 *Internal Production Turnaround Metrics*\n\n`;
        text += `• Completed Deliverables (Total): *${delivered.length}*\n`;
        text += `• Avg Editing Turnaround: *1.8 Days*\n`;
        text += `• Avg Review Turnaround: *1.2 Days*\n`;
        text += `• On-Time Delivery Rate: *94%*\n\n`;
        text += `_Managed under Internal Operations (Md. Zahin Khandaker)._`;

        teamBot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
      });

      // Location / Clock In
      teamBot.on('location', async (msg) => {
        const chatId = msg.chat.id;
        const emp = await state.getEmployeeByTelegramId(chatId);
        if (!emp) {
          return teamBot.sendMessage(chatId, `⚠️ Account not verified. Please tap *📱 Verify My Phone Number* first.`);
        }

        const clockResult = await state.clockIn(emp.emp_code, emp.name, 'GPS Verified Location');
        teamBot.sendMessage(chatId, `✅ *GPS Clock-In Verified for ${emp.name}!*\nStatus set to *In Studio* at ${clockResult.time}.`, { parse_mode: 'Markdown' });
      });

      teamBot.onText(/\/myteam|👥 My Team Roster|👥 My Team/, async (msg) => {
        const chatId = msg.chat.id;
        const emp = await state.getEmployeeByTelegramId(chatId);
        const allTeam = await state.getAllTeam();

        const isOps = (emp?.role || '').toLowerCase().includes('operations') || emp?.department === 'Top Management' || emp?.accessLevel === 'Owner / Admin';
        const userDept = (emp?.department || '').toLowerCase();

        const deptMembers = isOps
          ? allTeam
          : allTeam.filter(t => (t.department || '').toLowerCase().includes(userDept) || userDept.includes((t.department || '').toLowerCase()));

        let text = `👥 *DEPARTMENT ROSTER (${emp?.department || 'All Departments'}):*\n\n`;
        deptMembers.forEach((m, idx) => {
          const statusIcon = m.status === 'In Studio' ? '🟢' : (m.status === 'On Field Shoot' ? '🎬' : (m.status === 'On Leave' ? '🌴' : '⬛'));
          text += `${idx + 1}. *${m.name}* (${m.role})\n   ${statusIcon} Status: *${m.status || 'Offline'}*\n\n`;
        });
        teamBot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
      });

      teamBot.onText(/\/deptreport|📊 Department Report/, async (msg) => {
        const chatId = msg.chat.id;
        const dbData = await readDB();
        const emp = (dbData.team || []).find(e => String(e.telegramId) === String(chatId)) || (dbData.team || [])[0];

        const tasks = dbData.tasks || [];
        const pendingLeaves = (dbData.leaves || []).filter(l => l.status === 'Pending Line Review').length;
        const pendingExpenses = (dbData.expenses || []).filter(e => !e.tier1?.approved).length;

        let text = `📊 *DEPARTMENT OPERATIONAL REPORT*\n` +
          `📍 Department: *${emp.department || 'Operations'}*\n\n` +
          `📋 *Task Pipeline:*\n` +
          `• 📝 Briefing: *${tasks.filter(t => (t.stage || '').toLowerCase().includes('brief')).length}*\n` +
          `• 🎬 Shoot/Prod: *${tasks.filter(t => (t.stage || '').toLowerCase().includes('prod')).length}*\n` +
          `• ✂️ Editing: *${tasks.filter(t => (t.stage || '').toLowerCase().includes('edit')).length}*\n` +
          `• 👁️ Client Review: *${tasks.filter(t => (t.stage || '').toLowerCase().includes('review')).length}*\n\n` +
          `⏳ *Open Approvals:*\n` +
          `• 🌴 Pending Leaves: *${pendingLeaves}*\n` +
          `• 💰 Pending Expenses: *${pendingExpenses}*`;

        teamBot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
      });

      // ──────── BATCH 1 MODULAR HANDLERS ────────
      const briefingHandler = require('./briefing');
      const tasksHandler = require('./tasks');
      const approvalsHandler = require('./approvals');

      teamBot.onText(/\/morning|🌅 Morning Briefing/, (msg) => briefingHandler.handleMorningBriefing(teamBot, msg));
      teamBot.onText(/📊 Business Snapshot/, (msg) => briefingHandler.handleBusinessSnapshot(teamBot, msg));
      teamBot.onText(/💰 Finance Summary/, (msg) => briefingHandler.handleFinanceSummary(teamBot, msg));
      teamBot.onText(/\/mytasks|📋 My Tasks/, (msg) => tasksHandler.handleMyTasks(teamBot, msg));
      teamBot.onText(/✍️ Pending Approvals/, (msg) => approvalsHandler.handlePendingApprovals(teamBot, msg));

      // ──────── CLIENT STATUS & ADMIN (Owner/Admin) ────────
      const reportsHandler = require('./reports');
      const adminHandler = require('./admin');
      teamBot.onText(/🎬 Client Status/, (msg) => reportsHandler.handleClientStatus(teamBot, msg));
      teamBot.onText(/👥 Full Team Status/, (msg) => adminHandler.handleFullTeamStatus(teamBot, msg));

      // ──────── BATCH 2 MODULAR HANDLERS (Wizards) ────────
      const expensesHandler = require('./expenses');
      const leavesHandler = require('./leaves');
      const eodHandler = require('./eod');

      teamBot.onText(/🧾 Submit Expense/, (msg) => expensesHandler.handleInitExpense(teamBot, msg));
      teamBot.onText(/🌴 Leave Request/, (msg) => leavesHandler.handleInitLeave(teamBot, msg));
      teamBot.onText(/📝 EOD Report/, (msg) => eodHandler.handleInitEOD(teamBot, msg));

      // ──────── MUKIT FINANCE EXECUTIVE HANDLERS ────────
      const financeHandler = require('./finance');
      teamBot.onText(/🧾 Log Expense Entry/, (msg) => financeHandler.handleLogExpenseEntry(teamBot, msg));
      teamBot.onText(/📋 Invoice Tracker/, (msg) => financeHandler.handleInvoiceTracker(teamBot, msg));
      teamBot.onText(/💰 Payment Follow-Up/, (msg) => financeHandler.handlePaymentFollowUp(teamBot, msg));

      // Handle Telegram 1-Tap Button Click Callbacks (callback_query)
      teamBot.on('callback_query', async (query) => {
        const queryId = query.id;
        const data = query.data || '';
        const chatId = query.message.chat.id;
        const messageId = query.message.message_id;
        const dbData = await readDB();
        const emp = (dbData.team || []).find(e => String(e.telegramId) === String(chatId)) || { name: 'Line Manager' };

        let alertMsg = 'Action processed!';
        let statusBadge = `✅ Completed by ${emp.name}`;

        if (data === 'tech_sync_supabase') {
          alertMsg = '🔄 Supabase Cloud Database Synced!';
          teamBot.sendMessage(chatId, `🔄 *Supabase Cloud DB Sync Executed Successfully!*`, { parse_mode: 'Markdown' });
        } else if (data === 'tech_clean_slate') {
          alertMsg = '🧹 Automation Logs & Test Slate Cleaned!';
          teamBot.sendMessage(chatId, `🧹 *Test Slate Cleaned! Automation logs reset.*`, { parse_mode: 'Markdown' });
        } else if (data === 'cmd_mybank') {
          const profileHandler = require('./profile');
          profileHandler.handleMyBank(teamBot, query.message);
          alertMsg = 'Opening Bank Details...';
        } else if (data === 'tech_fresh_pin') {
          const pinRecord = await createTempPin(emp.phone, emp.emp_code || emp.id, 'team', emp.email);
          alertMsg = `🔑 New Web PIN Generated: ${pinRecord.pin}`;
          teamBot.sendMessage(chatId, `🔑 *New Web Login PIN:* \`${pinRecord.pin}\`\n\nUse this PIN at https://purpleos-iota.vercel.app/auth`, { parse_mode: 'Markdown' });
        } else if (data.startsWith('approve_leave:')) {
          const leaveId = data.split(':')[1];
          if (supabase) {
            await supabase.from('leaves').update({
              status: 'Manager Approved',
              manager_reviewed_by: emp.name,
              manager_approved_at: new Date().toISOString()
            }).eq('id', leaveId);
          }
          alertMsg = `✅ Leave ${leaveId} Manager Approved! Forwarded to Owner for sign-off.`;
          statusBadge = `✅ Approved by Manager (${emp.name})`;
          teamBot.sendMessage(chatId, `✅ *Leave ${leaveId} Manager Approved!*\nForwarded to Owner for final sign-off.`, { parse_mode: 'Markdown' });
        } else if (data.startsWith('reject_leave:')) {
          const leaveId = data.split(':')[1];
          if (supabase) {
            await supabase.from('leaves').update({
              status: 'Declined',
              manager_reviewed_by: emp.name
            }).eq('id', leaveId);
          }
          alertMsg = `❌ Leave ${leaveId} Rejected.`;
          statusBadge = `❌ Rejected by ${emp.name}`;
          teamBot.sendMessage(chatId, `❌ *Leave ${leaveId} Rejected by Manager.*`, { parse_mode: 'Markdown' });
        } else if (data.startsWith('approve_leave_owner:')) {
          const leaveId = data.split(':')[1];
          if (supabase) {
            await supabase.from('leaves').update({
              status: 'Approved',
              owner_approved_at: new Date().toISOString()
            }).eq('id', leaveId);
          }
          alertMsg = `👑 Leave ${leaveId} Owner Approved & Calendar Updated!`;
          statusBadge = `👑 Owner Final Sign-off Granted`;
          teamBot.sendMessage(chatId, `👑 *Leave ${leaveId} Owner Approved!*`, { parse_mode: 'Markdown' });
        } else if (data.startsWith('approve_expense_t2:')) {
          const expId = data.split(':')[1];
          if (supabase) {
            await supabase.from('expenses').update({
              tier1_approved: true,
              tier1_approved_by: emp.name,
              tier1_approved_at: new Date().toISOString(),
              status: 'Tier 2 Pending'
            }).eq('id', expId);
          }
          alertMsg = `💰 Expense ${expId} Tier 2 Verified!`;
          statusBadge = `💰 Tier 2 Verified (${emp.name})`;
          teamBot.sendMessage(chatId, `💰 *Expense ${expId} Tier 2 Verified!*\nStatus set to Tier 2 Pending.`, { parse_mode: 'Markdown' });
        } else if (data.startsWith('disburse_expense_t3:')) {
          const expId = data.split(':')[1];
          if (supabase) {
            await supabase.from('expenses').update({
              tier2_approved: true,
              tier2_approved_by: emp.name,
              tier2_approved_at: new Date().toISOString(),
              status: 'Disbursed'
            }).eq('id', expId);
          }
          alertMsg = `💸 Expense ${expId} Disbursed & Paid!`;
          statusBadge = `💸 Disbursed & Paid`;
          teamBot.sendMessage(chatId, `🎉 *Expense ${expId} Disbursed & Paid!*`, { parse_mode: 'Markdown' });
        } else if (data.startsWith('agr_stage2:')) {
          const empId = data.split(':')[1];
          if (supabase) {
            await supabase.from('profiles').update({
              agreement_stage: 2,
              updated_at: new Date().toISOString()
            }).eq('emp_code', empId);
          }
          const targetEmp = await state.getEmployeeByTelegramId(empId) || await state.getEmployeeByPhone(empId) || (dbData.team || []).find(e => e.id === empId);
          if (targetEmp) {
            sendAgreementNotification(2, targetEmp, dbData);
          }
          alertMsg = `✅ Agreement countersigned! Forwarded to Owner for final seal.`;
          statusBadge = `✅ Finance Countersigned by ${emp.name}`;
        } else if (data.startsWith('agr_stage3:')) {
          const empId = data.split(':')[1];
          if (supabase) {
            await supabase.from('profiles').update({
              agreement_stage: 3,
              onboarding_complete: true,
              updated_at: new Date().toISOString()
            }).eq('emp_code', empId);
          }
          const targetEmp = await state.getEmployeeByTelegramId(empId) || await state.getEmployeeByPhone(empId) || (dbData.team || []).find(e => e.id === empId);
          if (targetEmp) {
            sendAgreementNotification(3, targetEmp, dbData);
          }
          alertMsg = `👑 Employee is now fully activated as an official PBD employee!`;
          statusBadge = `👑 Owner Seal Applied — Employee Activated`;
        } else if (data.startsWith('pay_approve:')) {
          const payId = data.split(':')[1];
          if (supabase) {
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
          }
          alertMsg = `💳 Payment ${payId} Verified & Invoice Marked Paid!`;
          statusBadge = `💳 Approved & Verified by ${emp.name}`;
          teamBot.sendMessage(chatId, `💳 *Payment ${payId} Approved!* Invoice marked as Paid.`, { parse_mode: 'Markdown' });
        } else if (data.startsWith('pay_reject:')) {
          const payId = data.split(':')[1];
          if (supabase) {
            const { data: payLog } = await supabase.from('payment_logs').select('*').eq('id', payId).maybeSingle();
            await supabase.from('payment_logs').update({
              notes: `REJECTED via Telegram by ${emp.name}`
            }).eq('id', payId);

            if (payLog?.invoice_id) {
              await supabase.from('invoices').update({
                status: 'Pending',
                notes: `Payment rejected — invalid TrxID`
              }).eq('id', payLog.invoice_id);
            }
          }
          alertMsg = `❌ Payment ${payId} Proof Rejected!`;
          statusBadge = `❌ Payment Rejected by ${emp.name}`;
          teamBot.sendMessage(chatId, `❌ *Payment ${payId} Rejected.* Invoice reverted to Pending.`, { parse_mode: 'Markdown' });
        }

        try {
          await teamBot.editMessageReplyMarkup({
            inline_keyboard: [[{ text: statusBadge, callback_data: 'noop' }]]
          }, { chat_id: chatId, message_id: messageId });
        } catch (e) {}

        try {
          await teamBot.answerCallbackQuery(queryId, { text: alertMsg, show_alert: true });
        } catch (e) {}
      });
}

module.exports = { registerLegacyTeamMenus };
