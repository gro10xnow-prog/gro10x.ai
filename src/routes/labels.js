/**
 * src/routes/labels.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Custom Labels (Tags) API (ClickUp Phase 0.6.1)
 * ─────────────────────────────────────────────────────────────────────────────
 */

const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/rbac');
const { supabase } = require('../services/supabase');
const { broadcast } = require('../services/sse');

// Default fallback labels if DB query fails or table empty
const FALLBACK_LABELS = [
  { id: 'lbl-urgent', name: 'Urgent', color: '#ef4444', projectId: null },
  { id: 'lbl-bug', name: 'Bug', color: '#dc2626', projectId: null },
  { id: 'lbl-design', name: 'Design', color: '#ec4899', projectId: null },
  { id: 'lbl-copywriting', name: 'Copywriting', color: '#8b5cf6', projectId: null },
  { id: 'lbl-client-review', name: 'Client Review', color: '#f59e0b', projectId: null },
  { id: 'lbl-video-edit', name: 'Video Edit', color: '#3b82f6', projectId: null },
  { id: 'lbl-approved', name: 'Approved', color: '#10b981', projectId: null }
];

let memoryLabels = [...FALLBACK_LABELS];

function mapLabel(l) {
  if (!l) return null;
  return {
    id: l.id,
    name: l.name,
    color: l.color || '#3b82f6',
    projectId: l.project_id || l.projectId || null,
    createdAt: l.created_at || new Date().toISOString()
  };
}

// GET /api/labels — List labels (supports ?projectId=...)
router.get('/', requireAuth, async (req, res) => {
  try {
    const { projectId } = req.query;
    let query = supabase.from('labels').select('*').order('name', { ascending: true });

    if (projectId) {
      query = query.or(`project_id.is.null,project_id.eq.${projectId}`);
    }

    const { data, error } = await query;
    if (error) {
      return res.json(memoryLabels);
    }

    const result = (data || []).map(mapLabel);
    res.json(result.length > 0 ? result : memoryLabels);
  } catch (err) {
    res.json(memoryLabels);
  }
});

// POST /api/labels — Create a custom label
router.post('/', requireAuth, async (req, res) => {
  try {
    const { name, color, projectId } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Label name is required' });
    }

    const newId = `lbl-${Date.now()}`;
    const payload = {
      id: newId,
      name: name.trim(),
      color: color || '#3b82f6',
      project_id: projectId || null
    };

    let label = null;
    try {
      const { data, error } = await supabase.from('labels').insert([payload]).select().single();
      if (!error && data) label = mapLabel(data);
    } catch(e) {}

    if (!label) {
      label = mapLabel(payload);
      memoryLabels.push(label);
    }

    broadcast('label_update', { action: 'create', label });
    res.json({ success: true, label });
  } catch (err) {
    console.error('Labels POST error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/labels/:id — Delete label (Admin or Auth)
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    try {
      await supabase.from('task_labels').delete().eq('label_id', id);
      await supabase.from('labels').delete().eq('id', id);
    } catch(e) {}

    memoryLabels = memoryLabels.filter(l => l.id !== id);

    broadcast('label_update', { action: 'delete', deletedId: id });
    res.json({ success: true });
  } catch (err) {
    console.error('Labels DELETE error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
