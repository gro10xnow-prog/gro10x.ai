const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/rbac');
const { supabase } = require('../services/supabase');
const { broadcast } = require('../services/sse');
const cache = require('../services/cache');

function broadcastTaskEvent(eventType, data) {
  cache.delByPrefix('tasks:');
  try {
    return broadcast(eventType, data);
  } catch (e) {}
}

const { readDB, writeDB } = require('../services/db');
const { isSupabaseConfigured } = require('../services/supabase');
const { getBadge } = require('../utils/xp');
const { sendTelegramNotification } = require('../services/bot');

function mapTask(t) {
  if (!t) return null;
  const assigneesArr = Array.isArray(t.assignees) && t.assignees.length > 0 
    ? t.assignees 
    : (t.assignee ? [t.assignee] : ['Unassigned']);

  return {
    id: t.id,
    title: t.title,
    client: t.client || t.company || 'Agency',
    company: t.company || t.client || 'Agency',
    space: t.space || t.client || 'Internal Agency',
    clientId: t.client_id || t.clientId,
    projectId: t.project_id || t.projectId,
    parentTaskId: t.parent_task_id || t.parentTaskId,
    blockedBy: t.blocked_by || t.blockedBy,
    stage: t.stage || 'Briefing',
    customStatus: t.custom_status || t.stage || 'To Do',
    statusCategory: t.status_category || 'open',
    priority: t.priority || 'Medium',
    assignee: t.assignee || assigneesArr[0],
    assignees: assigneesArr,
    assigneeId: t.assignee_id || t.assigneeId,
    dueDate: t.due_date || t.dueDate,
    department: t.department,
    category: t.category || t.workflow_type,
    workflowType: t.workflow_type || t.category || 'video',
    workflow_type: t.workflow_type || t.category || 'video',
    description: t.description || '',
    labels: t.labels || [],
    customFields: t.custom_fields || t.customFields || {},
    estimatedHours: Number(t.estimated_hours || t.estimatedHours) || 8,
    loggedHours: Number(t.logged_hours || t.loggedHours) || 0,
    sortOrder: Number(t.sort_order || t.sortOrder) || 0,
    qcApprovedBy: t.qc_approved_by,
    qcApprovedAt: t.qc_approved_at,
    qcFeedback: t.qc_feedback,
    qcRejectedBy: t.qc_rejected_by,
    qcRejectedAt: t.qc_rejected_at,
    reassignedBy: t.reassigned_by,
    reassignReason: t.reassign_reason,
    createdAt: t.created_at || t.createdAt,
    updatedAt: t.updated_at || t.updatedAt
  };
}

// GET Tasks (Supports ?dept=, ?assignee=, ?label=, ?limit=, ?page= filters)
router.get('/', requireAuth, async (req, res) => {
  try {
    const { dept, assignee, label, parentId } = req.query;
    const limit = Math.min(parseInt(req.query.limit) || 100, 500);
    const page = Math.max(parseInt(req.query.page) || 0, 0);
    const offset = page * limit;

    const cacheKey = `tasks:list:${dept || ''}:${assignee || ''}:${parentId || ''}:${label || ''}:${limit}:${page}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    let tasks = [];

    if (supabase && isSupabaseConfigured()) {
      try {
        let query = supabase.from('tasks').select('*').order('created_at', { ascending: false }).range(offset, offset + limit - 1);

        // ── MULTI-TENANT CLIENT SCOPING ─────────────────────────────
        const isClientUser = req.user && (
          req.user.role === 'Client' || req.user.role === 'client' ||
          req.user.linkedType === 'client' ||
          (req.user.accessLevel && String(req.user.accessLevel).toLowerCase().includes('client'))
        );

        if (isClientUser) {
          const clientId = req.user.clientId || req.user.linkedId;
          const clientName = req.user.profile?.name || req.user.name || req.user.company;
          if (clientId && clientName) {
            query = query.or(`client_id.eq.${clientId},client.eq.${clientName},client.eq.${clientId}`);
          } else if (clientId) {
            query = query.or(`client_id.eq.${clientId},client.eq.${clientId}`);
          } else if (clientName) {
            query = query.eq('client', clientName);
          } else {
            return res.json([]);
          }
        }
        // ─────────────────────────────────────────────────────────────

        if (dept) {
          query = query.or(`department.ilike.%${dept}%,category.ilike.%${dept}%`);
        }
        if (assignee) {
          query = query.or(`assignee.ilike.%${assignee}%,assignee_id.eq.${assignee},assignee_id.ilike.%${assignee}%`);
        }
        if (parentId) {
          query = query.eq('parent_task_id', parentId);
        }

        const { data, error } = await query;
        if (!error && Array.isArray(data)) {
          tasks = data;
        }
      } catch (e) {
        console.warn('[Tasks API] Supabase query warning:', e.message);
      }
    }

    if (tasks.length === 0) {
      const db = await readDB();
      let rawTasks = db.tasks || [];
      if (req.user?.linkedType === 'client' && req.user?.linkedId) {
        const cName = (req.user.company || req.user.name || '').toLowerCase();
        rawTasks = rawTasks.filter(t => t.clientId === req.user.linkedId || (cName && (t.client || '').toLowerCase().includes(cName)));
      }
      tasks = rawTasks.slice(offset, offset + limit);
    }

    // Load labels & custom field values for tasks
    let taskLabelsMap = {};
    let taskCFVMap = {};

    if (supabase && isSupabaseConfigured()) {
      try {
        const [tlsRes, cfvRes] = await Promise.all([
          supabase.from('task_labels').select('task_id, label_id, labels(id, name, color)').then(null, () => ({ data: null })),
          supabase.from('task_custom_field_values').select('task_id, field_id, value').then(null, () => ({ data: null }))
        ]);

        if (tlsRes.data) {
          tlsRes.data.forEach(tl => {
            if (!taskLabelsMap[tl.task_id]) taskLabelsMap[tl.task_id] = [];
            if (tl.labels) {
              taskLabelsMap[tl.task_id].push({ id: tl.labels.id, name: tl.labels.name, color: tl.labels.color });
            }
          });
        }

        if (cfvRes.data) {
          cfvRes.data.forEach(cfv => {
            if (!taskCFVMap[cfv.task_id]) taskCFVMap[cfv.task_id] = {};
            taskCFVMap[cfv.task_id][cfv.field_id] = cfv.value;
          });
        }
      } catch(e) {}
    }

    let mapped = tasks.map(t => mapTask({
      ...t,
      labels: taskLabelsMap[t.id] || t.labels || [],
      custom_fields: taskCFVMap[t.id] || t.custom_fields || {}
    }));

    if (label) {
      mapped = mapped.filter(t => (t.labels || []).some(l => l.name.toLowerCase() === label.toLowerCase() || l.id === label));
    }

    cache.set(cacheKey, mapped, 30000);
    res.json(mapped);
  } catch (err) {
    console.error('Tasks GET error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST Create new Task
router.post('/', requireAuth, async (req, res) => {
  try {
    const rawUuid = require('crypto').randomUUID ? require('crypto').randomUUID() : String(Date.now());
    const newId = `TSK-${rawUuid.split('-')[0].toUpperCase()}`;

    let assigneeUuid = null;
    const rawAssigneeId = req.body.assignee_id || req.body.assigneeId;
    if (rawAssigneeId && supabase && isSupabaseConfigured()) {
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawAssigneeId);
      if (isUUID) {
        assigneeUuid = rawAssigneeId;
      } else {
        try {
          const { data: prof } = await supabase.from('profiles').select('id').eq('emp_code', rawAssigneeId).maybeSingle();
          if (prof) assigneeUuid = prof.id;
        } catch (e) {}
      }
    }

    const rawClientId = req.body.client_id || req.body.clientId;
    const isClientUUID = rawClientId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawClientId);
    const clientUuid = isClientUUID ? rawClientId : null;

    // Default due date: 3 days in future if omitted
    const defaultDueDate = new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0];
    const dueDateVal = (req.body.due_date && req.body.due_date.trim()) ? req.body.due_date.trim() : (req.body.dueDate && req.body.dueDate.trim()) ? req.body.dueDate.trim() : defaultDueDate;

    const fullPayload = {
      id: newId,
      title: req.body.title || 'Untitled Task',
      client: req.body.client || req.body.company || 'General Agency',
      client_id: clientUuid,
      stage: req.body.stage || 'Briefing',
      priority: req.body.priority || 'Medium',
      assignee: req.body.assignee || 'Unassigned',
      assignee_id: assigneeUuid,
      due_date: dueDateVal,
      department: req.body.department || null,
      category: req.body.category || req.body.workflow_type || null,
      description: req.body.description || '',
      estimated_hours: Number(req.body.estimated_hours || req.body.estimatedHours) || 8,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    let task = null;

    if (supabase && isSupabaseConfigured()) {
      try {
        // 1. Try insert with full payload
        const { data, error } = await supabase.from('tasks').insert([fullPayload]).select().single();
        if (!error && data) {
          task = mapTask(data);
        } else {
          // 2. Try with standard UUID primary key in case DB uses UUID type
          const uuidPayload = { ...fullPayload, id: rawUuid };
          const { data: uData, error: uErr } = await supabase.from('tasks').insert([uuidPayload]).select().single();
          if (!uErr && uData) {
            task = mapTask({ ...uData, id: newId });
          } else {
            // 3. Try with core standard columns
            const corePayload = {
              title: fullPayload.title,
              client: fullPayload.client,
              stage: fullPayload.stage,
              priority: fullPayload.priority,
              assignee: fullPayload.assignee,
              due_date: dueDateVal,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
            if (assigneeUuid) corePayload.assignee_id = assigneeUuid;
            if (clientUuid) corePayload.client_id = clientUuid;

            const { data: cData } = await supabase.from('tasks').insert([corePayload]).select().single();
            if (cData) {
              task = mapTask({ ...cData, ...fullPayload, id: cData.id || newId });
            }
          }
        }
      } catch (e) {
        console.warn('[Tasks API] Supabase tasks insert safe fallback:', e.message);
      }
    }

    // Always ensure task exists in return
    if (!task) {
      task = mapTask(fullPayload);
    }

    // Insert label associations non-blockingly if labelIds provided
    if (req.body.labelIds && Array.isArray(req.body.labelIds) && req.body.labelIds.length > 0 && supabase && isSupabaseConfigured()) {
      try {
        const rows = req.body.labelIds.map(lId => ({ task_id: task.id || newId, label_id: lId }));
        supabase.from('task_labels').insert(rows).then(null, () => {});
      } catch(e) {}
    }

    // Insert custom field values non-blockingly if customFields object provided
    if (req.body.customFields && typeof req.body.customFields === 'object' && supabase && isSupabaseConfigured()) {
      try {
        const rows = Object.entries(req.body.customFields).map(([fId, val]) => ({
          task_id: task.id || newId,
          field_id: fId,
          value: String(val || '')
        }));
        if (rows.length > 0) {
          supabase.from('task_custom_field_values').insert(rows).then(null, () => {});
        }
      } catch(e) {}
    }

    // Fire SSE broadcast non-blockingly
    try {
      broadcastTaskEvent('task_update', [task]);

      // Telegram push to assignee if assigned
      const targetAssigneeId = task.assigneeId || rawAssigneeId;
      if (targetAssigneeId && supabase && isSupabaseConfigured()) {
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetAssigneeId);
        let q = supabase.from('profiles').select('name, telegram_id');
        if (isUUID) q = q.eq('id', targetAssigneeId);
        else q = q.eq('emp_code', targetAssigneeId);

        q.maybeSingle().then(({ data: prof }) => {
          if (prof?.telegram_id) {
            const { sendTelegramNotification } = require('../services/bot');
            sendTelegramNotification(
              prof.telegram_id,
              `📋 *New Task Assigned to You!*\n\n` +
              `🎯 *${task.title}*\n` +
              `🏢 Client: ${task.client || 'Agency'}\n` +
              `📅 Due: ${task.dueDate || 'ASAP'}\n` +
              `⚡ Priority: *${task.priority || 'Medium'}*\n` +
              `📌 Starting Stage: *${task.stage || 'Briefing'}*\n\n` +
              `_Open your bot menu or web panel to view and progress your task._`,
              null, true
            );
          }
        }).catch(err => console.warn('[Tasks API] Telegram notification warning:', err.message));
      }
    } catch (e) {}

    return res.status(201).json({ success: true, task });
  } catch (err) {
    console.error('Task POST error:', err.message);
    return res.status(500).json({ error: err.message || 'Task creation failed' });
  }
});
// POST Bulk Operations
router.post('/bulk', requireAuth, async (req, res) => {
  try {
    const { action, taskIds, stage, assignee, labelId } = req.body;
    if (!action || !taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
      return res.status(400).json({ error: 'Valid action and taskIds array required' });
    }

    if (action === 'delete') {
      const { error } = await supabase.from('tasks').delete().in('id', taskIds);
      if (error) throw error;
    } else if (action === 'stage') {
      const { error } = await supabase.from('tasks').update({ stage, updated_at: new Date().toISOString() }).in('id', taskIds);
      if (error) throw error;
    } else if (action === 'assign') {
      const { error } = await supabase.from('tasks').update({ assignee, updated_at: new Date().toISOString() }).in('id', taskIds);
      if (error) throw error;
    } else if (action === 'label') {
      if (labelId) {
        const rows = taskIds.map(id => ({ task_id: id, label_id: labelId }));
        const { error } = await supabase.from('task_labels').upsert(rows, { onConflict: 'task_id,label_id' });
        if (error) throw error;
      }
    } else {
      return res.status(400).json({ error: 'Unknown action' });
    }

    broadcastTaskEvent('task_update', { bulkUpdate: true });
    res.json({ success: true, count: taskIds.length });
  } catch (err) {
    console.error('Task bulk POST error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// PUT Update Task Stage / Assignee
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { updated_at: new Date().toISOString() };
    let data = null;

    if (supabase && isSupabaseConfigured()) {
      try {
        const updates = { ...req.body, updated_at: new Date().toISOString() };
        delete updates.id;
        const { data: updated, error } = await supabase.from('tasks').update(updates).eq('id', id).select().maybeSingle();
        if (!error && updated) data = updated;
      } catch (dbErr) {
        console.warn('[Tasks API] PUT note:', dbErr.message);
      }
    }

    if (!data) {
      const db = await readDB();
      const idx = (db.tasks || []).findIndex(t => t.id === id);
      if (idx !== -1) {
        db.tasks[idx] = { ...db.tasks[idx], ...req.body, updatedAt: new Date().toISOString() };
        data = db.tasks[idx];
        await writeDB(db);
      }
    }

    if (!data) return res.status(404).json({ error: 'Task not found' });

    const task = mapTask(data);
    const { data: allTasks } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
    broadcastTaskEvent('task_update', (allTasks || []).map(mapTask));

    // QC Gate Notification if moved to Internal QC
    if (req.body.stage === 'Internal QC') {
      try {
        const qcCode = process.env.QC_REVIEWER_CODE || 'PBD-006';
        const { data: ruhul } = await supabase.from('profiles').select('*').eq('emp_code', qcCode).maybeSingle();
        if (ruhul?.telegram_id) {
          sendTelegramNotification(ruhul.telegram_id,
            `🔍 *Internal QC Review Required*\n\n• Task: *${task.title}*\n• Client: *${task.client || 'Agency'}*\n• Submitted by: *${task.assignee || 'Visualizer'}*\n\nPlease review and either approve for client delivery or send back for revision.`,
            [
              [{ text: '✅ QC Approve → Client Review', url: `https://gro10x-ai.vercel.app/admin?tab=tasks&action=qc-approve&id=${task.id}` }],
              [{ text: '✏️ Send Back for Revision', url: `https://gro10x-ai.vercel.app/admin?tab=tasks&action=qc-reject&id=${task.id}` }]
            ],
            true
          );
        }
      } catch(e) {}
    }

    res.json({ success: true, task });
  } catch (err) {
    console.error('Task PUT error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// PATCH Update Task Stage (Mini App & Board Handoffs)
router.patch(['/:id', '/:id/stage'], requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const stage = req.body.stage || req.body.status || req.body.custom_status;
    if (!stage) {
      return res.status(400).json({ error: 'stage is required' });
    }
    const newStage = stage;

    let data = null;
    if (supabase && isSupabaseConfigured()) {
      try {
        // Fetch existing task to check blockers
        const { data: existing } = await supabase.from('tasks').select('*').eq('id', id).maybeSingle();
        if (existing && existing.blocked_by) {
          const { data: blocker } = await supabase.from('tasks').select('stage').eq('id', existing.blocked_by).maybeSingle();
          if (blocker && blocker.stage !== 'Approved') {
            return res.status(400).json({ error: `Cannot advance task. Blocked by task ${existing.blocked_by}` });
          }
        }

        const updates = { stage: newStage, custom_status: newStage, updated_at: new Date().toISOString() };
        if (req.body.custom_fields) {
          const mergedCustom = typeof existing?.custom_fields === 'object' && existing.custom_fields !== null
            ? { ...existing.custom_fields, ...req.body.custom_fields }
            : req.body.custom_fields;
          updates.custom_fields = mergedCustom;
        }

        const { data: updated, error } = await supabase.from('tasks').update(updates).eq('id', id).select().maybeSingle();
        if (!error && updated) data = updated;
      } catch (dbErr) {
        console.warn('[Tasks API] PATCH note:', dbErr.message);
      }
    }

    if (!data) {
      const db = await readDB();
      const idx = (db.tasks || []).findIndex(t => t.id === id);
      if (idx !== -1) {
        db.tasks[idx].stage = newStage;
        db.tasks[idx].custom_status = newStage;
        if (req.body.custom_fields) {
          db.tasks[idx].custom_fields = { ...(db.tasks[idx].custom_fields || {}), ...req.body.custom_fields };
        }
        data = db.tasks[idx];
        await writeDB(db);
      } else {
        data = { id, stage: newStage, custom_status: newStage, custom_fields: req.body.custom_fields || null, title: 'Task' };
      }
    }

    const task = mapTask(data);

    // Award +15 XP on task completion (only once — if transitioning from an incomplete stage)
    const completedStages = ['done', 'completed', 'approved', 'published'];
    const wasDone = completedStages.includes((existing?.stage || '').toLowerCase());
    const isNowDone = completedStages.includes((stage || '').toLowerCase());

    if (isNowDone && !wasDone && data.assignee_id) {
      try {
        const empCode = data.assignee_id;
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(empCode);
        let pQuery = supabase.from('profiles').select('xp, badge, telegram_id, custom_fields');
        if (isUUID) pQuery = pQuery.eq('id', empCode);
        else pQuery = pQuery.eq('emp_code', empCode);
        const { data: prof } = await pQuery.maybeSingle();
        if (prof) {
          const newXP = (prof.xp || 0) + 15;
          const oldBadge = prof.badge || '🌱 Recruit';
          const badge = getBadge(newXP);
          const leveledUp = badge !== oldBadge;

          const existingLog = prof.custom_fields?.xp_log || [];
          const xpLog = [...existingLog.slice(-49), {
            event: 'task_complete',
            delta: 15,
            total: newXP,
            badge,
            taskId: id,
            ts: new Date().toISOString()
          }];

          const customFields = { ...(prof.custom_fields || {}), xp_log: xpLog };

          let uQuery = supabase.from('profiles').update({
            xp: newXP,
            badge,
            custom_fields: customFields,
            updated_at: new Date().toISOString()
          });
          if (isUUID) uQuery = uQuery.eq('id', empCode);
          else uQuery = uQuery.eq('emp_code', empCode);
          await uQuery;
          broadcastTaskEvent('team_update', [{ emp_code: empCode, xp: newXP, badge }]);

          if (leveledUp && prof.telegram_id) {
            try {
              const { sendTelegramNotification } = require('../services/bot');
              await sendTelegramNotification(prof.telegram_id,
                `🏆 *YOU LEVELED UP!*\n\n` +
                `Congratulations! You've advanced to a new specialist rank:\n\n` +
                `🎖️ *Rank:* ${badge}\n` +
                `⭐ *Total XP:* ${newXP.toLocaleString()} XP\n\n` +
                `_Keep delivering outstanding work to reach the next tier! 🚀_`,
                null,
                true
              );
            } catch (notifErr) {
              console.warn('[Tasks XP Level-Up] Notification warning:', notifErr.message);
            }
          }
        }
      } catch (xpErr) {
        console.warn('Task completion XP update warning:', xpErr.message);
      }
    }

    const { data: allTasks } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
    broadcastTaskEvent('task_update', (allTasks || []).map(mapTask));

    let autoReviewId = null;
    if (stage === 'Client Review') {
      try {
        const { randomUUID } = require('crypto');
        const reviewId = `REV-${randomUUID().split('-')[0].toUpperCase()}`;
        const defaultVideoUrl = 'https://assets.mixkit.co/videos/preview/mixkit-set-of-plateaus-seen-from-the-sky-in-a-sunset-26070-large.mp4';
        const targetTitle = (task && task.title) || (data && data.title) || 'Creative Deliverable';
        const targetClient = (task && task.client) || (data && data.client) || 'Agency Client';
        const targetWorkflow = (task && task.workflow_type) || (data && data.workflow_type) || 'video';

        const reviewPayload = {
          id: reviewId,
          project_id: id,
          project_name: targetTitle,
          client: targetClient,
          active_version: 'v1',
          versions: ['v1'],
          media_type: targetWorkflow === 'branding' ? 'image' : 'video',
          media_url: defaultVideoUrl,
          poster_url: null,
          resolved_count: 0,
          total_count: 0,
          created_at: new Date().toISOString()
        };
        // Only create if no existing review for this task/project
        if (supabase && isSupabaseConfigured()) {
          const { data: existingReview } = await supabase.from('reviews').select('id').eq('project_id', id).maybeSingle();
          if (!existingReview) {
            const { data: newReview } = await supabase.from('reviews').insert([reviewPayload]).select().single();
            if (newReview) {
              autoReviewId = newReview.id;
              broadcastTaskEvent('review_update', [newReview]);
            }
          } else {
            autoReviewId = existingReview.id;
          }
        } else {
          autoReviewId = reviewId;
        }
      } catch (revErr) {
        console.warn('Auto-create review room failed (non-fatal):', revErr.message);
      }
    }

    // Fire automation with review_id for deep-link URL
    try {
      const { processAutomationEvent } = require('../services/automation');
      const dbSnapshot = await readDB().catch(() => ({ clients: [], team: [] }));
      await processAutomationEvent('task_stage_change', {
        task,
        stage,
        reviewId: autoReviewId
      }, dbSnapshot, writeDB, broadcast);
    } catch (autoErr) {
      console.warn('Automation event skipped (non-fatal):', autoErr.message);
    }

    // Send email notification to client if deliverable is in Client Review
    if (stage === 'Client Review') {
      try {
        const { sendDeliverableReadyEmail } = require('../services/resend');
        let clientEmail = null;
        let clientName = task.client || 'Valued Partner';
        if (supabase && isSupabaseConfigured()) {
          const { data: cData } = await supabase.from('clients')
            .select('email, contact_email, name')
            .or(`id.eq.${task.client_id || task.client},name.ilike.%${task.client}%`)
            .maybeSingle();
          if (cData) {
            clientEmail = cData.email || cData.contact_email;
            if (cData.name) clientName = cData.name;
          }
        }
        if (clientEmail) {
          sendDeliverableReadyEmail({
            clientEmail,
            clientName,
            taskTitle: task.title,
            reviewUrl: `https://gro10x-ai.vercel.app/client#review`
          }).catch(() => {});
        }
      } catch (e) {}
    }

    res.json({ success: true, task, reviewId: autoReviewId });
  } catch (err) {
    console.error('Task PATCH stage error:', err.message);
    res.status(500).json({ error: err.message });
  }
});


// PATCH Set Task Dependency (Blocker)
router.patch('/:id/dependency', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { blockedBy } = req.body;

    const updates = { blocked_by: blockedBy || null, updated_at: new Date().toISOString() };
    const { data, error } = await supabase.from('tasks').update(updates).eq('id', id).select().single();
    if (error) throw error;

    const task = mapTask(data);
    const { data: allTasks } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
    broadcastTaskEvent('task_update', (allTasks || []).map(mapTask));

    res.json({ success: true, task });
  } catch (err) {
    console.error('Task dependency error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/tasks/:id/qc-approve
router.post('/:id/qc-approve', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const approverId = req.user.linkedId || req.user.id || 'EMP-001';
    const updates = {
      stage: 'Client Review',
      qc_approved_by: approverId,
      qc_approved_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase.from('tasks').update(updates).eq('id', id).select().single();
    if (error) throw error;

    const task = mapTask(data);
    const { data: allTasks } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
    broadcastTaskEvent('task_update', (allTasks || []).map(mapTask));

    res.json({ success: true, task });
  } catch (err) {
    console.error('Task QC Approve error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/tasks/:id/qc-reject
router.post('/:id/qc-reject', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const rejectorId = req.user.linkedId || req.user.id || 'EMP-001';
    const updates = {
      stage: 'Briefing',
      qc_feedback: req.body.feedback || req.body.notes || 'Revisions needed.',
      qc_rejected_by: rejectorId,
      qc_rejected_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase.from('tasks').update(updates).eq('id', id).select().single();
    if (error) throw error;

    const task = mapTask(data);
    const { data: allTasks } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
    broadcastTaskEvent('task_update', (allTasks || []).map(mapTask));

    // Trigger automation event to alert assignee via Telegram
    try {
      const { processAutomationEvent } = require('../services/automation');
      const { data: teamProfiles } = await supabase.from('profiles').select('*');
      processAutomationEvent('task_qc_rejected', { task, feedback: updates.qc_feedback }, { team: teamProfiles || [], tasks: allTasks || [] }, () => {}, broadcastTaskEvent);
    } catch (e) {}

    res.json({ success: true, task });
  } catch (err) {
    console.error('Task QC Reject error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST Reassign Task
router.post('/:id/reassign', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = {
      assignee: req.body.newAssignee || 'Unassigned',
      reassigned_by: req.user?.name || 'Internal Operations',
      reassign_reason: req.body.reason || 'Workload balancing',
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase.from('tasks').update(updates).eq('id', id).select().single();
    if (error) throw error;

    const task = mapTask(data);
    const { data: allTasks } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
    broadcastTaskEvent('task_update', (allTasks || []).map(mapTask));

    // Trigger automation event to alert new assignee via Telegram
    try {
      const { processAutomationEvent } = require('../services/automation');
      const { data: teamProfiles } = await supabase.from('profiles').select('*');
      processAutomationEvent('task_reassigned', { task, newAssignee: updates.assignee }, { team: teamProfiles || [], tasks: allTasks || [] }, () => {}, broadcastTaskEvent);
    } catch (e) {}

    res.json({ success: true, task });
  } catch (err) {
    console.error('Task Reassign error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ──────── STUDIO & GEAR BOOKINGS ────────
router.get('/studio-bookings', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase.from('studio_bookings').select('*').order('created_at', { ascending: false });
    if (error) throw error;

    res.json((data || []).map(b => ({
      id: b.id,
      resourceName: b.resource_name,
      resourceType: b.resource_type,
      slot: b.slot,
      bookedByName: b.booked_by_name,
      notes: b.notes,
      status: b.status,
      createdAt: b.created_at
    })));
  } catch (err) {
    console.error('Studio Bookings GET error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.post('/studio-bookings', requireAuth, async (req, res) => {
  try {
    const newId = `SB-${Date.now()}`;
    const payload = {
      id: newId,
      resource_name: req.body.resourceName || 'Main Studio Room',
      resource_type: req.body.resourceType || 'Studio',
      slot: req.body.slot || 'Full Day',
      booked_by_name: req.body.bookedByName || req.user?.name || 'Staff Member',
      notes: req.body.notes || '',
      status: 'Confirmed'
    };

    const { data, error } = await supabase.from('studio_bookings').insert([payload]).select().single();
    if (error) throw error;

    const booking = {
      id: data.id,
      resourceName: data.resource_name,
      resourceType: data.resource_type,
      slot: data.slot,
      bookedByName: data.booked_by_name,
      notes: data.notes,
      status: data.status,
      createdAt: data.created_at
    };

    const { data: allBookings } = await supabase.from('studio_bookings').select('*');
    broadcastTaskEvent('studio_booking_update', allBookings || []);

    res.json({ success: true, booking });
  } catch (err) {
    console.error('Studio Booking POST error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// DELETE Task (Admin only)
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) throw error;

    const { data: allTasks } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
    broadcastTaskEvent('task_update', (allTasks || []).map(mapTask));

    res.json({ success: true });
  } catch (err) {
    console.error('Task DELETE error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────
// SUBTASKS APIs (ClickUp Hierarchy Phase 1)
// ─────────────────────────────────────────────

// GET Subtasks for a task
router.get('/:id/subtasks', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase.from('subtasks').select('*').eq('task_id', id).order('created_at', { ascending: true });
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    console.error('Subtasks GET error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST Create subtask
router.post('/:id/subtasks', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, assignee } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Subtask title is required' });
    }

    const payload = {
      task_id: id,
      title: title.trim(),
      assignee: assignee || null,
      completed: false
    };

    const { data, error } = await supabase.from('subtasks').insert([payload]).select().single();
    if (error) throw error;

    broadcastTaskEvent('subtask_update', { taskId: id, action: 'create', subtask: data });
    res.json({ success: true, subtask: data });
  } catch (err) {
    console.error('Subtask POST error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// PATCH Toggle subtask completion
router.patch('/subtasks/:subtaskId/toggle', requireAuth, async (req, res) => {
  try {
    const { subtaskId } = req.params;
    const { completed, user } = req.body;

    const updatePayload = {
      completed: Boolean(completed),
      completed_at: completed ? new Date().toISOString() : null,
      completed_by: user || req.user?.name || 'User'
    };

    const { data, error } = await supabase.from('subtasks').update(updatePayload).eq('id', subtaskId).select().single();
    if (error) throw error;

    broadcastTaskEvent('subtask_update', { taskId: data.task_id, action: 'toggle', subtask: data });
    res.json({ success: true, subtask: data });
  } catch (err) {
    console.error('Subtask TOGGLE error:', err.message);
    res.status(500).json({ error: err.message });
  }
});


// GET /api/tasks/:id/comments
router.get('/:id/comments', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase.from('task_comments').select('*').eq('task_id', id).order('created_at', { ascending: true });
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    console.error('Comments GET error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/tasks/:id/comments
router.post('/:id/comments', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userName = req.user?.name || 'Team Member';
    if (!content) return res.status(400).json({ error: 'Comment content required' });

    const { data, error } = await supabase.from('task_comments').insert([{ task_id: id, author_name: userName, content }]).select().single();
    if (error) throw error;
    
    broadcastTaskEvent('task_comment_added', { taskId: id, comment: data });
    res.json({ success: true, comment: data });
  } catch (err) {
    console.error('Comments POST error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/tasks/:id/time-logs
router.get('/:id/time-logs', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase.from('time_logs').select('*').eq('task_id', id).order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    console.error('Time logs GET error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/tasks/:id/log-time
router.post('/:id/log-time', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { hours, note } = req.body;
    const logged = Number(hours) || 0;
    if (logged <= 0) return res.status(400).json({ error: 'Hours must be greater than 0' });

    const userName = req.user?.name || 'Team Member';
    
    // Insert into time_logs
    const { data: logEntry, error: logError } = await supabase.from('time_logs').insert([{ task_id: id, user_name: userName, duration_hours: logged, note }]).select().single();
    if (logError && !logError.message.includes('relation "public.time_logs" does not exist')) {
      throw logError;
    }

    // Update tasks table
    const { data: existing } = await supabase.from('tasks').select('logged_hours').eq('id', id).maybeSingle();
    if (!existing) {
      return res.status(404).json({ error: 'Task not found' });
    }
    const newLogged = (Number(existing?.logged_hours) || 0) + logged;
    const { data, error } = await supabase.from('tasks').update({ logged_hours: newLogged, updated_at: new Date().toISOString() }).eq('id', id).select().maybeSingle();
    if (error) throw error;

    broadcastTaskEvent('task_time_logged', { taskId: id, log: logEntry });
    res.json({ success: true, task: mapTask(data), log: logEntry });
  } catch (err) {
    console.error('Task log-time POST error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/tasks/:id/labels — Add label to task
router.post('/:id/labels', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { labelId } = req.body;
    if (!labelId) return res.status(400).json({ error: 'labelId is required' });

    const { error } = await supabase.from('task_labels').insert([{ task_id: id, label_id: labelId }]);
    if (error && !error.message.includes('duplicate')) throw error;

    broadcastTaskEvent('task_label_update', { taskId: id, action: 'add', labelId });
    res.json({ success: true });
  } catch (err) {
    console.error('Task Add Label error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/tasks/:id/labels/:labelId — Remove label from task
router.delete('/:id/labels/:labelId', requireAuth, async (req, res) => {
  try {
    const { id, labelId } = req.params;
    const { error } = await supabase.from('task_labels').delete().eq('task_id', id).eq('label_id', labelId);
    if (error) throw error;

    broadcastTaskEvent('task_label_update', { taskId: id, action: 'remove', labelId });
    res.json({ success: true });
  } catch (err) {
    console.error('Task Delete Label error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
