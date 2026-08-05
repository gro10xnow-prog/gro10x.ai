/**
 * src/routes/task-templates.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Task Templates & Automations Router (ClickUp Phase 0.6.6 - 0.6.9)
 * ─────────────────────────────────────────────────────────────────────────────
 */

const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { supabase } = require('../services/supabase');
const { broadcast } = require('../services/sse');

const FALLBACK_TEMPLATES = [
  {
    id: 'tmpl-reels',
    name: 'Social Media Reel Campaign',
    department: 'Production',
    description: 'Standard 10-Reels package workflow from concept to delivery',
    subtasks: ['Creative Briefing & Scripting', 'Studio / Field Shoot', 'Rough Cut Edit', 'Motion Graphics & Subtitles', 'Color Grading & Master Cut', 'Client Review Handoff'],
    estimatedHours: 12.00,
    priority: 'High'
  },
  {
    id: 'tmpl-branding',
    name: '360 Branding & Identity System',
    department: 'Design',
    description: 'Corporate branding identity assets & guidelines book',
    subtasks: ['Brand Questionnaire', 'Logo Vector Concepts', 'Color Palette & Typography', 'Brand Guidelines PDF', 'Social Media POSM Assets'],
    estimatedHours: 20.00,
    priority: 'Medium'
  },
  {
    id: 'tmpl-tvc',
    name: 'TVC Commercial Production',
    department: 'Production',
    description: 'Cinema-grade video TVC production workflow',
    subtasks: ['Storyboard & Script Lock', 'Talent & Location Scouting', 'Cinema 4K Shoot Day', 'Audio Voiceover Recording', 'VFX & Final Master Cut'],
    estimatedHours: 40.00,
    priority: 'High'
  }
];

let memoryTemplates = [...FALLBACK_TEMPLATES];

function mapTemplate(t) {
  if (!t) return null;
  let subtasks = t.subtasks || [];
  if (typeof subtasks === 'string') {
    try { subtasks = JSON.parse(subtasks); } catch(e) { subtasks = []; }
  }
  return {
    id: t.id,
    name: t.name,
    department: t.department || 'Production',
    description: t.description || '',
    subtasks,
    estimatedHours: Number(t.estimated_hours || t.estimatedHours) || 8.0,
    priority: t.priority || 'Medium',
    createdAt: t.created_at || new Date().toISOString()
  };
}

// GET /api/task-templates — List blueprints
router.get('/', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase.from('task_templates').select('*').order('name', { ascending: true });
    if (error) return res.json(memoryTemplates);

    const result = (data || []).map(mapTemplate);
    res.json(result.length > 0 ? result : memoryTemplates);
  } catch (err) {
    res.json(memoryTemplates);
  }
});

// POST /api/task-templates — Create a template blueprint
router.post('/', requireAuth, async (req, res) => {
  try {
    const { name, department, description, subtasks, estimatedHours, priority } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Template name is required' });
    }

    const newId = `tmpl-${Date.now()}`;
    const payload = {
      id: newId,
      name: name.trim(),
      department: department || 'Production',
      description: description || '',
      subtasks: subtasks || [],
      estimated_hours: Number(estimatedHours) || 8.00,
      priority: priority || 'Medium'
    };

    let template = null;
    try {
      const { data, error } = await supabase.from('task_templates').insert([payload]).select().single();
      if (!error && data) template = mapTemplate(data);
    } catch (e) {}

    if (!template) {
      template = mapTemplate(payload);
      memoryTemplates.push(template);
    }

    broadcast('template_update', { action: 'create', template });
    res.json({ success: true, template });
  } catch (err) {
    console.error('Task Template POST error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/task-templates/:id/instantiate — Instantiate task + subtasks from template
router.post('/:id/instantiate', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { client, assignee, dueDate } = req.body;

    // Find template
    let template = memoryTemplates.find(t => t.id === id);
    try {
      const { data } = await supabase.from('task_templates').select('*').eq('id', id).maybeSingle();
      if (data) template = mapTemplate(data);
    } catch(e) {}

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    // Generate Task ID
    const countNum = Date.now() % 10000;
    const taskId = `TSK-TMPL-${countNum}`;

    const taskPayload = {
      id: taskId,
      title: `${template.name} - ${client || 'Agency Client'}`,
      client: client || 'Agency Client',
      stage: 'Briefing',
      priority: template.priority || 'Medium',
      assignee: assignee || 'Unassigned',
      department: template.department,
      estimated_hours: template.estimatedHours,
      due_date: dueDate || new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0]
    };

    try {
      await supabase.from('tasks').insert([taskPayload]);
    } catch(e) {}

    // Generate Subtasks
    const subtaskTitles = template.subtasks || [];
    const subtaskRows = subtaskTitles.map((stTitle, idx) => ({
      id: `st-${taskId}-${idx}`,
      task_id: taskId,
      title: stTitle,
      assignee: assignee || null,
      completed: false
    }));

    if (subtaskRows.length > 0) {
      try {
        await supabase.from('subtasks').insert(subtaskRows);
      } catch(e) {}
    }

    broadcast('task_update', { action: 'instantiate_template', taskId });
    res.json({
      success: true,
      taskId,
      title: taskPayload.title,
      subtasksCreated: subtaskTitles.length
    });
  } catch (err) {
    console.error('Task Template Instantiate error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/task-templates/:id — Delete template blueprint
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    try {
      await supabase.from('task_templates').delete().eq('id', id);
    } catch(e) {}

    memoryTemplates = memoryTemplates.filter(t => t.id !== id);

    broadcast('template_update', { action: 'delete', deletedId: id });
    res.json({ success: true });
  } catch (err) {
    console.error('Task Template DELETE error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
