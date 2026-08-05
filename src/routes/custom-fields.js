/**
 * src/routes/custom-fields.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Custom Fields API (ClickUp Phase 0.6.4)
 * ─────────────────────────────────────────────────────────────────────────────
 */

const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { supabase } = require('../services/supabase');
const { broadcast } = require('../services/sse');

const FALLBACK_CUSTOM_FIELDS = [
  { id: 'cf-deliverable-url', name: 'Deliverable Link', fieldType: 'text', options: [], projectId: null },
  { id: 'cf-resolution', name: 'Video Resolution', fieldType: 'dropdown', options: ['1080p Full HD', '4K UHD', 'Vertical 9:16 Reel'], projectId: null },
  { id: 'cf-revision-round', name: 'Revision Round', fieldType: 'number', options: [], projectId: null }
];

let memoryCustomFields = [...FALLBACK_CUSTOM_FIELDS];

function mapCustomField(f) {
  if (!f) return null;
  let opts = f.options || [];
  if (typeof opts === 'string') {
    try { opts = JSON.parse(opts); } catch(e) { opts = []; }
  }
  return {
    id: f.id,
    name: f.name,
    fieldType: f.field_type || f.fieldType || 'text',
    options: opts,
    projectId: f.project_id || f.projectId || null,
    createdAt: f.created_at || new Date().toISOString()
  };
}

// GET /api/custom-fields — List fields (optional ?projectId=...)
router.get('/', requireAuth, async (req, res) => {
  try {
    const { projectId } = req.query;
    let query = supabase.from('custom_fields').select('*').order('created_at', { ascending: true });

    if (projectId) {
      query = query.or(`project_id.is.null,project_id.eq.${projectId}`);
    }

    const { data, error } = await query;
    if (error) return res.json(memoryCustomFields);

    const result = (data || []).map(mapCustomField);
    res.json(result.length > 0 ? result : memoryCustomFields);
  } catch (err) {
    res.json(memoryCustomFields);
  }
});

// POST /api/custom-fields — Create a custom field
router.post('/', requireAuth, async (req, res) => {
  try {
    const { name, fieldType, options, projectId } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Field name is required' });
    }

    const newId = `cf-${Date.now()}`;
    const payload = {
      id: newId,
      name: name.trim(),
      field_type: fieldType || 'text',
      options: options || [],
      project_id: projectId || null
    };

    let field = null;
    try {
      const { data, error } = await supabase.from('custom_fields').insert([payload]).select().single();
      if (!error && data) field = mapCustomField(data);
    } catch (e) {}

    if (!field) {
      field = mapCustomField(payload);
      memoryCustomFields.push(field);
    }

    broadcast('custom_field_update', { action: 'create', field });
    res.json({ success: true, field });
  } catch (err) {
    console.error('Custom Field POST error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/custom-fields/:id — Delete a custom field definition
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    try {
      await supabase.from('task_custom_field_values').delete().eq('field_id', id);
      await supabase.from('custom_fields').delete().eq('id', id);
    } catch(e) {}

    memoryCustomFields = memoryCustomFields.filter(f => f.id !== id);

    broadcast('custom_field_update', { action: 'delete', deletedId: id });
    res.json({ success: true });
  } catch (err) {
    console.error('Custom Field DELETE error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
