/**
 * src/services/bot/handlers/creative.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Creative Director Telegram Bot Handlers:
 * - Design Queue (Rich Cards, Asset Type Pills, Mini App WebApp Buttons)
 * - Review Room
 * - My Team / Design Team (with live workload capacity badges)
 * ─────────────────────────────────────────────────────────────────────────────
 */

const { supabase } = require('../../supabase');
const state = require('../../state');

/**
 * Handle "🎨 Design Queue"
 * Lists all active graphic design, creative, and branding tasks with status and quick actions.
 */
async function handleDesignQueue(teamBot, msg) {
  const chatId = msg.chat.id;
  try {
    const emp = await state.getEmployeeByTelegramId(chatId);
    if (!emp) {
      return teamBot.sendMessage(chatId, '⚠️ Account not verified. Please verify your phone number first.');
    }

    let tasks = [];
    if (supabase) {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .not('stage', 'in', '("Done","Completed","Published","Cancelled")')
        .order('created_at', { ascending: false })
        .limit(12);

      if (error) throw error;
      tasks = (data || []).filter(t => {
        const cat = (t.category || t.department || t.workflow_type || t.title || '').toLowerCase();
        const stage = (t.stage || '').toLowerCase();
        return cat.includes('design') || cat.includes('graphic') || cat.includes('brand') ||
               cat.includes('art') || cat.includes('social') || cat.includes('posm') ||
               stage.includes('design') || stage.includes('draft');
      });

      // If category filter returned none, show the top active tasks
      if (tasks.length === 0 && data && data.length > 0) {
        tasks = data.slice(0, 5);
      }
    }

    if (tasks.length === 0) {
      const options = {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              { text: '📱 Open Task Board', web_app: { url: 'https://gro10x-ai.vercel.app/team-miniapp?tab=tasks' } },
              { text: '➕ Create Creative Task', web_app: { url: 'https://gro10x-ai.vercel.app/team-miniapp?tab=tasks&action=new' } }
            ]
          ]
        }
      };
      return teamBot.sendMessage(chatId, `🎨 *DESIGN & CREATIVE QUEUE*\n\n✅ All design deliverables are up to date! No pending design tasks.`, options);
    }

    let headerText = `🎨 *CREATIVE & DESIGN PIPELINE (${tasks.length} Active Deliverables)*\n` +
      `📅 ${new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}\n\n` +
      `_Tap below to review visual assets or update deliverable stage:_`;

    teamBot.sendMessage(chatId, headerText, { parse_mode: 'Markdown' });

    for (const [idx, t] of tasks.entries()) {
      const stage = t.stage || 'Draft';
      const stageIcon = stage.includes('Review') ? '👁️' : (stage.includes('QC') ? '🔍' : (stage.includes('Draft') ? '✏️' : '📌'));
      const catTag = (t.category || t.workflow_type || 'Design Deliverable').toUpperCase();

      let card = `${idx + 1}. *${t.title}*\n`;
      card += `   🏷️ \`${catTag}\`\n`;
      card += `   🏢 Client: *${t.client || 'Agency Internal'}*\n`;
      card += `   👤 Designer: *${t.assignee || 'Unassigned'}*\n`;
      card += `   ${stageIcon} Stage: *${stage}* | 📅 Due: \`${t.due_date || t.dueDate || 'ASAP'}\``;

      const inlineKeyboard = [
        [
          { text: '👁️ Review Deliverable', web_app: { url: `https://gro10x-ai.vercel.app/reviewroom?taskId=${t.id}` } },
          { text: '📋 Task Card', web_app: { url: `https://gro10x-ai.vercel.app/team-miniapp?tab=tasks&taskId=${t.id}` } }
        ]
      ];

      teamBot.sendMessage(chatId, card, {
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: inlineKeyboard }
      }).catch(() => {});
    }
  } catch (err) {
    console.error('[Creative Bot] handleDesignQueue error:', err.message);
    teamBot.sendMessage(chatId, '⚠️ Error fetching design queue.');
  }
}

/**
 * Handle "👁️ Review Room"
 * Lists deliverables currently awaiting Creative Review or Client Approval.
 */
async function handleReviewRoom(teamBot, msg) {
  const chatId = msg.chat.id;
  try {
    let reviewTasks = [];
    if (supabase) {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .or('stage.ilike.%review%,stage.ilike.%qc%,stage.ilike.%client%')
        .not('stage', 'in', '("Done","Completed","Published","Cancelled")')
        .order('created_at', { ascending: false })
        .limit(8);

      if (error) throw error;
      reviewTasks = data || [];
    }

    let text = `👁️ *GRO10X — CREATIVE REVIEW ROOM*\n` +
      `📅 ${new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}\n\n`;

    if (reviewTasks.length === 0) {
      text += `✅ *No deliverables currently waiting in review queue.*\n\n` +
        `All client and internal QC reviews are cleared!`;
    } else {
      text += `*Deliverables Awaiting Review (${reviewTasks.length}):*\n\n`;
      reviewTasks.forEach((t, i) => {
        text += `${i + 1}. *${t.title}*\n`;
        text += `   🏢 Client: *${t.client || 'Agency'}* | Stage: *${t.stage}*\n`;
        text += `   👤 Assignee: ${t.assignee || 'Creative Specialist'}\n\n`;
      });
    }

    const options = {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '🎬 Open Interactive Review Room', web_app: { url: 'https://gro10x-ai.vercel.app/reviewroom' } }
          ],
          [
            { text: '🌐 Open Manager Portal', web_app: { url: 'https://gro10x-ai.vercel.app/manager#tasks' } }
          ]
        ]
      }
    };

    teamBot.sendMessage(chatId, text, options);
  } catch (err) {
    console.error('[Creative Bot] handleReviewRoom error:', err.message);
    teamBot.sendMessage(chatId, '⚠️ Error fetching Review Room status.');
  }
}

/**
 * Handle "👥 My Team" / "👥 Design Team"
 * Lists all department specialists with live attendance status, workload capacity badges, and XP.
 */
async function handleMyTeam(teamBot, msg) {
  const chatId = msg.chat.id;
  try {
    const emp = await state.getEmployeeByTelegramId(chatId);
    const myDept = (emp?.department || '').toLowerCase();

    let team = [];
    let openTasks = [];
    if (supabase) {
      const [profRes, taskRes] = await Promise.all([
        supabase.from('profiles').select('*').order('name', { ascending: true }),
        supabase.from('tasks').select('assignee, assignee_id, stage').not('stage', 'in', '("Done","Completed","Published","Cancelled")')
      ]);

      const allMembers = profRes.data || [];
      openTasks = taskRes.data || [];

      if (myDept && !myDept.includes('operation') && !myDept.includes('executive') && !myDept.includes('management')) {
        team = allMembers.filter(m => (m.department || '').toLowerCase().includes(myDept));
      } else {
        team = allMembers;
      }
      if (team.length === 0) team = allMembers;
    } else {
      team = await state.getAllTeam();
    }

    const deptName = emp?.department || 'Department';
    let text = `👥 *${deptName.toUpperCase()} ROSTER & LIVE WORKLOAD (${team.length} Members)*\n` +
      `📅 ${new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}\n\n`;

    team.forEach((m, i) => {
      const status = m.status || 'Offline';
      const statusIcon = status === 'In Studio' ? '🟢' : (status === 'On Field Shoot' ? '🎬' : (status === 'On Leave' ? '🌴' : '⬛'));
      const xp = m.xp || 0;
      const badge = m.badge || '🌱 Recruit';

      // Compute individual active workload
      const memberTasks = openTasks.filter(t => (t.assignee && t.assignee.includes(m.name)) || t.assignee_id === m.emp_code || t.assignee_id === m.id);
      const taskCount = memberTasks.length;
      const loadBadge = taskCount >= 5 ? '🔴 Overloaded' : (taskCount >= 3 ? '🟡 Busy' : '🟢 Optimal');

      text += `${i + 1}. *${m.name}* (${m.emp_code || m.id || 'N/A'})\n`;
      text += `   💼 ${m.role || 'Specialist'}\n`;
      text += `   ${statusIcon} Status: *${status}* | Load: *${taskCount} tasks* [${loadBadge}]\n`;
      text += `   ⭐ ${badge} (${xp} XP)\n\n`;
    });

    const options = {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '🌴 Review Department Leaves', callback_data: 'cmd_mgr_leaves' },
            { text: '📊 Full Roster (Web)', web_app: { url: 'https://gro10x-ai.vercel.app/manager#team' } }
          ]
        ]
      }
    };

    teamBot.sendMessage(chatId, text, options);
  } catch (err) {
    console.error('[Creative Bot] handleMyTeam error:', err.message);
    teamBot.sendMessage(chatId, '⚠️ Error fetching department team roster.');
  }
}

/**
 * Handle "✂️ My Edit Queue" / "🎨 My 3D Task Queue"
 * Shows individual specialist's active video/3D tasks with 1-tap QC submit
 */
async function handleMyEditQueue(teamBot, msg) {
  const chatId = msg.chat.id;
  try {
    const emp = await state.getEmployeeByTelegramId(chatId);
    if (!emp) {
      return teamBot.sendMessage(chatId, '⚠️ Account not verified. Please verify your phone number first.');
    }

    const firstName = (emp.name || '').split(' ')[0];
    const empCode = emp.emp_code || emp.id;

    let tasks = [];
    if (supabase) {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .or(`assignee_id.eq.${empCode},assignee.ilike.%${firstName}%`)
        .not('stage', 'in', '("Approved","Done","Completed","Published","Cancelled")')
        .order('created_at', { ascending: false })
        .limit(8);

      if (error) throw error;
      tasks = data || [];
    }

    if (tasks.length === 0) {
      return teamBot.sendMessage(chatId, `✂️ *My Edit Queue*\n\n✅ No active tasks in your queue right now! All caught up.`, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '📱 Open Web Workspace', web_app: { url: 'https://gro10x-ai.vercel.app/crew#tasks' } }]
          ]
        }
      });
    }

    teamBot.sendMessage(chatId, `✂️ *MY PRODUCTION QUEUE (${tasks.length} Active)*\n_Tap Submit for QC when a draft or render is complete:_`, { parse_mode: 'Markdown' });

    for (const [idx, t] of tasks.entries()) {
      const stage = t.stage || 'Editing';
      let card = `${idx + 1}. *${t.title}*\n`;
      card += `   🏢 Client: *${t.client || 'Agency'}*\n`;
      card += `   📌 Stage: *${stage}* | 📅 Due: \`${t.due_date || t.dueDate || 'ASAP'}\``;

      const inlineKeyboard = [
        [
          { text: '📤 Submit for QC Review', callback_data: `task_advance:${t.id}:Internal QC` },
          { text: '📱 Open Deliverables', web_app: { url: `https://gro10x-ai.vercel.app/crew#deliverables` } }
        ]
      ];

      teamBot.sendMessage(chatId, card, {
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: inlineKeyboard }
      }).catch(() => {});
    }
  } catch (err) {
    console.error('[Creative Bot] handleMyEditQueue error:', err.message);
    teamBot.sendMessage(chatId, '⚠️ Error fetching edit queue.');
  }
}

/**
 * Handle "📤 Submit for Review" / "📤 Submit Render"
 */
async function handleSubmitForReview(teamBot, msg) {
  return handleMyEditQueue(teamBot, msg);
}

module.exports = {
  handleDesignQueue,
  handleReviewRoom,
  handleMyTeam,
  handleMyEditQueue,
  handleSubmitForReview
};
