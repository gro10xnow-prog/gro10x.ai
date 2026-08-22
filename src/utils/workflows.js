/**
 * src/utils/workflows.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Canonical Workflow Stages and Category Mapper.
 * Keeps Bot and Web Workspace stage advancement synchronized.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const WORKFLOW_MAP = {
  video: ['Briefing', 'Scripting', 'Shooting', 'Editing', 'Internal QC', 'Client Review', 'Approved'],
  social: ['Draft', 'Graphic Design', 'Copy Review', 'Scheduled', 'Published'],
  branding: ['Strategy', 'Concepts', 'Client Refinement', 'Master Delivered'],
  development: ['Backlog', 'In Dev', 'Code Review', 'QA Testing', 'Deployed'],
  default: ['To Do', 'In Progress', 'In Review', 'Done']
};

/**
 * Determines stage sequence based on task metadata.
 * @param {object} task
 * @returns {string[]}
 */
function getTaskStages(task) {
  if (!task) return WORKFLOW_MAP.default;
  const category = (task.category || task.workflow_type || task.workflowType || task.department || task.title || '').toLowerCase();
  
  if (category.includes('video') || category.includes('edit') || category.includes('animat') || category.includes('shoot')) {
    return WORKFLOW_MAP.video;
  }
  if (category.includes('social') || category.includes('content') || category.includes('post') || category.includes('posm')) {
    return WORKFLOW_MAP.social;
  }
  if (category.includes('brand') || category.includes('identity') || category.includes('design') || category.includes('3d')) {
    return WORKFLOW_MAP.branding;
  }
  if (category.includes('dev') || category.includes('tech') || category.includes('software') || category.includes('code')) {
    return WORKFLOW_MAP.development;
  }
  return WORKFLOW_MAP.default;
}

module.exports = {
  WORKFLOW_MAP,
  getTaskStages
};
