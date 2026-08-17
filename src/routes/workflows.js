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
 * Admin only — Updates or creates workflow stage definitions
 * Body example: { "influencer": { "name": "Influencer Outreach", "icon": "🌟", "stages": ["Briefing", "Outreach", "Draft", "Approved"] } }
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
      else {
        const { data: appSetData } = await supabase
          .from('app_settings')
          .select('value')
          .eq('key', 'workflow_stages')
          .maybeSingle();
        if (appSetData && appSetData.value) currentStages = { ...DEFAULT_WORKFLOW_TYPES, ...appSetData.value };
      }
    } else {
      const db = await readDB();
      if (db.settings && db.settings.workflow_stages) {
        currentStages = { ...DEFAULT_WORKFLOW_TYPES, ...db.settings.workflow_stages };
      }
    }

    // Merge updates (supports updating existing workflows AND adding new custom workflows)
    const mergedStages = { ...currentStages };
    Object.keys(updates).forEach(wfKey => {
      const updateItem = updates[wfKey];
      if (Array.isArray(updateItem.stages)) {
        mergedStages[wfKey] = {
          name: updateItem.name || (mergedStages[wfKey]?.name || wfKey),
          icon: updateItem.icon || (mergedStages[wfKey]?.icon || '⚡'),
          stages: updateItem.stages
        };
      }
    });

    // Save to persistence (both settings and app_settings tables for resilience)
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('settings').upsert({
          key: 'workflow_stages',
          value: mergedStages,
          updated_at: new Date().toISOString()
        }, { onConflict: 'key' });
      } catch (e) {}

      try {
        await supabase.from('app_settings').upsert({
          key: 'workflow_stages',
          value: mergedStages,
          updated_at: new Date().toISOString()
        }, { onConflict: 'key' });
      } catch (e) {}
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

/**
 * DELETE /api/workflows/:wfKey
 * Admin only — Deletes a custom workflow pipeline
 */
router.delete('/:wfKey', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { wfKey } = req.params;
    const CORE_KEYS = ['video', 'social', 'branding', 'dev'];
    if (CORE_KEYS.includes(wfKey)) {
      return res.status(400).json({ error: 'Cannot delete core system default workflow' });
    }

    let currentStages = DEFAULT_WORKFLOW_TYPES;
    if (isSupabaseConfigured()) {
      const { data } = await supabase.from('settings').select('value').eq('key', 'workflow_stages').maybeSingle();
      if (data && data.value) currentStages = { ...DEFAULT_WORKFLOW_TYPES, ...data.value };
    }

    const mergedStages = { ...currentStages };
    delete mergedStages[wfKey];

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('settings').upsert({
          key: 'workflow_stages',
          value: mergedStages,
          updated_at: new Date().toISOString()
        }, { onConflict: 'key' });
      } catch (e) {}

      try {
        await supabase.from('app_settings').upsert({
          key: 'workflow_stages',
          value: mergedStages,
          updated_at: new Date().toISOString()
        }, { onConflict: 'key' });
      } catch (e) {}
    }

    broadcast('workflow_stages_update', mergedStages);
    res.json({ success: true, workflows: mergedStages, deletedKey: wfKey });
  } catch (err) {
    console.error('[Workflows API] Error deleting workflow:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
