/**
 * src/routes/workflows.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Workflow Stages & Customization API v1.0
 * Handles single-source-of-truth stage definitions across Web Admin & Telegram Mini App.
 * Mounted at: /api/workflows
 * ─────────────────────────────────────────────────────────────────────────────
 */

const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/rbac');
const { supabase, isSupabaseConfigured } = require('../services/supabase');
const { readDB, writeDB } = require('../services/db');
const { broadcast } = require('../services/sse');

// Default fallback stage definitions across 4 workflows
const DEFAULT_WORKFLOW_TYPES = {
  video: {
    icon: '🎬',
    name: 'Video Production',
    stages: ['Briefing', 'Scripting', 'Shooting', 'Editing', 'Internal QC', 'Client Review', 'Approved']
  },
  social: {
    icon: '📢',
    name: 'Social & Content',
    stages: ['Briefing', 'Content Draft', 'Design', 'Copy Review', 'Client Approval', 'Scheduled', 'Published']
  },
  branding: {
    icon: '🎨',
    name: 'Branding & Design',
    stages: ['Briefing', 'Strategy', 'Concept Design', 'Client Refinement', 'Final Delivery', 'Approved']
  },
  dev: {
    icon: '💻',
    name: 'Dev & Tech',
    stages: ['Briefing', 'Wireframe', 'Development', 'QA Testing', 'Client UAT', 'Approved']
  }
};

/**
 * GET /api/workflows/stages
 * Public / Authenticated — Returns all workflow stage definitions
 */
router.get('/stages', async (req, res) => {
  try {
    let stagesData = DEFAULT_WORKFLOW_TYPES;

    if (isSupabaseConfigured()) {
      const { data } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'workflow_stages')
        .maybeSingle();

      if (data && data.value && Object.keys(data.value).length > 0) {
        stagesData = { ...DEFAULT_WORKFLOW_TYPES, ...data.value };
      }
    } else {
      const db = await readDB();
      if (db.settings && db.settings.workflow_stages) {
        stagesData = { ...DEFAULT_WORKFLOW_TYPES, ...db.settings.workflow_stages };
      }
    }

    res.json(stagesData);
  } catch (err) {
    console.error('[Workflows API] Error fetching stage definitions:', err.message);
    res.json(DEFAULT_WORKFLOW_TYPES);
  }
});

/**
 * PUT /api/workflows/stages
 * Admin only — Updates stage definitions for one or all workflow types
 * Body example: { "video": { "stages": ["Briefing", "Shooting", "Editing", "Approved"] } }
 */
router.put('/stages', requireAuth, requireAdmin, async (req, res) => {
  try {
    const updates = req.body;
    if (!updates || typeof updates !== 'object') {
      return res.status(400).json({ error: 'Invalid request body' });
    }

    // Load existing settings
    let currentStages = DEFAULT_WORKFLOW_TYPES;
    if (isSupabaseConfigured()) {
      const { data } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'workflow_stages')
        .maybeSingle();
      if (data && data.value) currentStages = { ...DEFAULT_WORKFLOW_TYPES, ...data.value };
    } else {
      const db = await readDB();
      if (db.settings && db.settings.workflow_stages) {
        currentStages = { ...DEFAULT_WORKFLOW_TYPES, ...db.settings.workflow_stages };
      }
    }

    // Merge updates
    const mergedStages = { ...currentStages };
    Object.keys(updates).forEach(wfKey => {
      if (mergedStages[wfKey]) {
        if (Array.isArray(updates[wfKey].stages)) {
          mergedStages[wfKey] = {
            ...mergedStages[wfKey],
            stages: updates[wfKey].stages,
            ...(updates[wfKey].name ? { name: updates[wfKey].name } : {}),
            ...(updates[wfKey].icon ? { icon: updates[wfKey].icon } : {})
          };
        }
      }
    });

    // Save to persistence
    if (isSupabaseConfigured()) {
      await supabase.from('settings').upsert({
        key: 'workflow_stages',
        value: mergedStages,
        updated_at: new Date().toISOString()
      }, { onConflict: 'key' });
    } else {
      const db = await readDB();
      db.settings = db.settings || {};
      db.settings.workflow_stages = mergedStages;
      await writeDB(db);
    }

    // Broadcast SSE update
    broadcast('workflow_stages_update', mergedStages);

    res.json({ success: true, workflows: mergedStages });
  } catch (err) {
    console.error('[Workflows API] Error updating stages:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
