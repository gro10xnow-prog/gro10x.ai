const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { requireManager } = require('../middleware/rbac');
const { supabase, isSupabaseConfigured } = require('../services/supabase');

router.get('/:table', requireAuth, requireManager, async (req, res) => {
  try {
    const table = req.params.table;
    const allowedTables = ['tasks', 'clients', 'invoices', 'leads', 'attendance', 'expenses', 'leaves', 'team'];

    if (!allowedTables.includes(table)) {
      return res.status(400).json({ error: 'Invalid table for export.' });
    }

    let data = [];
    if (isSupabaseConfigured()) {
      const dbTable = table === 'team' ? 'profiles' : table;
      const { data: dbData, error } = await supabase.from(dbTable).select('*');
      if (error) throw error;
      data = dbData || [];
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${table}_export_${new Date().toISOString().split('T')[0]}.csv"`);

    if (!data || data.length === 0) {
      return res.send('id\n');
    }

    // Convert JSON to CSV
    const headers = Object.keys(data[0]);
    const csvRows = [];
    
    // Add headers
    csvRows.push(headers.map(h => `"${String(h).replace(/"/g, '""')}"`).join(','));

    // Add rows
    data.forEach(row => {
      const values = headers.map(header => {
        const val = row[header];
        if (val === null || val === undefined) return '""';
        return `"${String(val).replace(/"/g, '""')}"`;
      });
      csvRows.push(values.join(','));
    });

    const csvString = csvRows.join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${table}_export_${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csvString);
  } catch (error) {
    console.error(`Export error for table ${req.params.table}:`, error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
