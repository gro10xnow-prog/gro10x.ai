const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { requireManager } = require('../middleware/rbac');
const { readDB } = require('../services/db');

// GET Manager KPIs for Department
router.get('/kpis', requireAuth, requireManager, async (req, res) => {
  const db = await readDB();
  const dept = (req.query.dept || req.user.department || 'Operations').toLowerCase();

  const team = db.team || [];
  const tasks = db.tasks || [];
  const expenses = db.expenses || [];

  const deptTeam = dept.includes('all') || dept.includes('management') || dept.includes('operations')
    ? team
    : team.filter(t => (t.department || '').toLowerCase().includes(dept));

  const totalTasks = tasks.length || 1;
  const completedTasks = tasks.filter(t => (t.stage || '').toLowerCase().includes('approved') || (t.stage || '').toLowerCase().includes('done')).length;
  const taskCompletionRate = Math.round((completedTasks / totalTasks) * 100);

  const inStudioCount = deptTeam.filter(t => (t.status || '').toLowerCase().includes('studio')).length;
  const fieldShootCount = deptTeam.filter(t => (t.status || '').toLowerCase().includes('shoot') || (t.status || '').toLowerCase().includes('field')).length;
  const onLeaveCount = deptTeam.filter(t => (t.status || '').toLowerCase().includes('leave')).length;

  const totalExpensesBdt = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  res.json({
    dept: req.query.dept || req.user.department || 'Operations',
    taskCompletionRate,
    totalTasks,
    completedTasks,
    crewStatus: {
      inStudio: inStudioCount,
      fieldShoot: fieldShootCount,
      onLeave: onLeaveCount,
      totalTeam: deptTeam.length
    },
    totalExpensesBdt,
    pendingLeavesCount: (db.leaves || []).filter(l => l.status === 'Pending Line Review').length,
    pendingExpensesCount: (db.expenses || []).filter(e => !e.tier1?.approved).length
  });
});

module.exports = router;
