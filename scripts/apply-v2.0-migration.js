const { supabase, isSupabaseConfigured } = require('../src/services/supabase');
const fs = require('fs');
const path = require('path');

async function applyMigration() {
  if (!isSupabaseConfigured()) {
    console.error('❌ Supabase is not configured.');
    process.exit(1);
  }

  console.log('🚀 Running v2.0 ClickUp Hierarchy & Workflows Migration setup...');

  // 1. Seed default project workflows if project_workflows table exists or can receive rows
  const defaultWorkflows = [
    {
      workflow_name: 'Video Production Workflow',
      department: 'Content Production',
      stages: [
        { name: 'Strategy', category: 'open', color: '#94a3b8' },
        { name: 'Scripting', category: 'open', color: '#3b82f6' },
        { name: 'Shooting', category: 'in_progress', color: '#eab308' },
        { name: 'Editing', category: 'in_progress', color: '#a855f7' },
        { name: 'Client Review', category: 'review', color: '#f59e0b' },
        { name: 'Approved', category: 'completed', color: '#10b981' }
      ]
    },
    {
      workflow_name: 'Software & Tech Workflow',
      department: 'Website, Tech & AI',
      stages: [
        { name: 'Backlog', category: 'open', color: '#64748b' },
        { name: 'In Progress', category: 'in_progress', color: '#3b82f6' },
        { name: 'Code Review', category: 'review', color: '#a855f7' },
        { name: 'Staging QA', category: 'review', color: '#f59e0b' },
        { name: 'Production Deployed', category: 'completed', color: '#10b981' }
      ]
    },
    {
      workflow_name: 'Design & Graphics Workflow',
      department: 'Design & Post-Production',
      stages: [
        { name: 'Brief Received', category: 'open', color: '#94a3b8' },
        { name: 'Concept & Draft', category: 'in_progress', color: '#3b82f6' },
        { name: 'Internal Review', category: 'review', color: '#a855f7' },
        { name: 'Client Review', category: 'review', color: '#f59e0b' },
        { name: 'Final Assets Delivered', category: 'completed', color: '#10b981' }
      ]
    }
  ];

  try {
    const { data: existingWf, error: wfErr } = await supabase.from('project_workflows').select('*');
    if (wfErr) {
      console.log('⚠️ project_workflows table not yet created on Supabase. Execute SQL in Supabase Dashboard SQL Editor:');
      console.log('--------------------------------------------------');
      console.log(fs.readFileSync(path.join(__dirname, '../supabase/migrations/20260802_v2.0_clickup_hierarchy.sql'), 'utf8'));
      console.log('--------------------------------------------------');
    } else if (!existingWf || existingWf.length === 0) {
      const { data: inserted, error: insErr } = await supabase.from('project_workflows').insert(defaultWorkflows).select();
      if (insErr) console.error('Error inserting default workflows:', insErr.message);
      else console.log(`✅ Inserted ${inserted.length} default workflows into project_workflows.`);
    } else {
      console.log(`ℹ️ project_workflows table already has ${existingWf.length} entries.`);
    }
  } catch (err) {
    console.error('Migration runner error:', err.message);
  }

  // 2. Seed a default Master Project for testing
  try {
    const { data: existingProjects } = await supabase.from('projects').select('*');
    if (existingProjects && existingProjects.length === 0) {
      const sampleProject = {
        name: 'Agency General Creative & Campaign Pipeline 2026',
        client_name: 'Internal Agency',
        department: 'Production',
        workflow_type: 'video_production',
        status: 'Active',
        description: 'Master project container for ongoing agency deliverables & campaigns'
      };
      const { data: insertedProj } = await supabase.from('projects').insert([sampleProject]).select();
      if (insertedProj) console.log('✅ Created initial Master Project container.');
    }
  } catch (e) {
    console.warn('Could not seed initial master project:', e.message);
  }

  console.log('✨ v2.0 Migration Runner completed!');
}

applyMigration();
