/**
 * src/routes/projects.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Projects & Custom Workflow Management APIs (ClickUp Hierarchy Phase 1)
 * ─────────────────────────────────────────────────────────────────────────────
 */

const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/rbac');
const { supabase } = require('../services/supabase');
const { broadcast } = require('../services/sse');

function mapProject(p) {
  if (!p) return null;
  return {
    id: p.id,
    clientId: p.client_id,
    clientName: p.client_name,
    name: p.name,
    description: p.description || '',
    department: p.department || 'Production',
    workflowType: p.workflow_type || 'video_production',
    status: p.status || 'Active',
    startDate: p.start_date,
    dueDate: p.due_date,
    budget: Number(p.budget) || 0,
    createdAt: p.created_at,
    updatedAt: p.updated_at
  };
}

// GET Projects
router.get('/', requireAuth, async (req, res) => {
  try {
    const { clientId, department } = req.query;
    let query = supabase.from('projects').select('*').order('created_at', { ascending: false });

    if (clientId) query = query.eq('client_id', clientId);
    if (department) query = query.eq('department', department);

    const { data, error } = await query;
    if (error) throw error;

    res.json((data || []).map(mapProject));
  } catch (err) {
    console.error('Projects GET error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST Create Project
router.post('/', requireAuth, async (req, res) => {
  try {
    const { clientId, clientName, name, description, department, workflowType, startDate, dueDate, budget } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Project name is required' });
    }

    const payload = {
      client_id: clientId || null,
      client_name: clientName || 'Agency',
      name: name.trim(),
      description: description || '',
      department: department || 'Production',
      workflow_type: workflowType || 'video_production',
      status: 'Active',
      start_date: startDate || null,
      due_date: dueDate || null,
      budget: Number(budget) || 0
    };

    const { data, error } = await supabase.from('projects').insert([payload]).select().single();
    if (error) throw error;

    const project = mapProject(data);
    broadcast('project_update', project);

    res.json({ success: true, project });
  } catch (err) {
    console.error('Projects POST error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// PUT Update Project
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, status, department, workflowType, dueDate, budget } = req.body;

    const updatePayload = {
      updated_at: new Date().toISOString()
    };
    if (name !== undefined) updatePayload.name = name;
    if (description !== undefined) updatePayload.description = description;
    if (status !== undefined) updatePayload.status = status;
    if (department !== undefined) updatePayload.department = department;
    if (workflowType !== undefined) updatePayload.workflow_type = workflowType;
    if (dueDate !== undefined) updatePayload.due_date = dueDate;
    if (budget !== undefined) updatePayload.budget = Number(budget) || 0;

    const { data, error } = await supabase.from('projects').update(updatePayload).eq('id', id).select().single();
    if (error) throw error;

    const project = mapProject(data);
    broadcast('project_update', project);

    res.json({ success: true, project });
  } catch (err) {
    console.error('Projects PUT error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// DELETE Project (Admin only)
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('projects').delete().eq('id', id);
    if (error) throw error;

    broadcast('project_update', { deletedId: id });
    res.json({ success: true });
  } catch (err) {
    console.error('Projects DELETE error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────
// WORKFLOW TEMPLATES APIs
// ─────────────────────────────────────────────

router.get('/workflows', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase.from('project_workflows').select('*');
    if (error) {
      return res.json([
        { id: 'wf-video', name: 'Video Production', stages: ['Briefing', 'Scripting', 'Shooting', 'Editing', 'Client Review', 'Approved'] },
        { id: 'wf-social', name: 'Social Media', stages: ['Draft', 'Design', 'Review', 'Scheduled', 'Published'] },
        { id: 'wf-brand', name: 'Brand Identity', stages: ['Strategy', 'Concepts', 'Refinement', 'Guidelines', 'Delivered'] }
      ]);
    }
    res.json(data || []);
  } catch (err) {
    console.error('Workflows GET error:', err.message);
    res.status(500).json({ error: err.message });
  }
});
router.get('/spaces', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase.from('spaces').select('*').order('name', { ascending: true });
    if (error) {
      // Fallback if spaces table not yet migrated
      return res.json([
        { id: 'space-internal', name: 'Internal Agency', type: 'department', icon: '🏢' },
        { id: 'space-clients', name: 'Client Retainers', type: 'client', icon: '🟣' }
      ]);
    }
    res.json(data || []);
  } catch (err) {
    console.error('Spaces GET error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST Create Space
router.post('/spaces', requireAuth, async (req, res) => {
  try {
    const { name, type, color, icon, clientId } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'Space name is required' });

    const payload = {
      name: name.trim(),
      type: type || 'client',
      client_id: clientId || null,
      color: color || '#a855f7',
      icon: icon || '📁'
    };

    const { data, error } = await supabase.from('spaces').insert([payload]).select().single();
    if (error) throw error;

    res.json({ success: true, space: data });
  } catch (err) {
    console.error('Spaces POST error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
