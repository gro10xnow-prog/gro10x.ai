require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { supabase, isSupabaseConfigured } = require('../src/services/supabase');

async function seed() {
  if (!isSupabaseConfigured()) {
    console.error('❌ Supabase is not configured in .env. Please check SUPABASE_URL and SUPABASE_ANON_KEY.');
    process.exit(1);
  }

  const dbPath = path.join(__dirname, '../data/db.json');
  const dbData = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

  console.log('🚀 Starting Supabase Seeding from db.json...\n');

  // 1. Seed Clients
  if (dbData.clients && dbData.clients.length > 0) {
    const clientsPayload = dbData.clients.map(c => ({
      id: c.id,
      name: c.name,
      contact_person: c.contactPerson,
      email: c.email,
      phone: c.phone,
      whatsapp: c.whatsapp,
      status: c.status,
      category: c.category,
      total_spent: c.totalSpent,
      active_campaigns: c.activeCampaigns || []
    }));

    const { data, error } = await supabase.from('clients').upsert(clientsPayload, { onConflict: 'id' });
    if (error) console.error('❌ Clients seed error:', error.message);
    else console.log(`✅ Clients seeded: ${clientsPayload.length} records.`);
  }

  // 2. Seed Services
  if (dbData.services && dbData.services.length > 0) {
    const servicesPayload = dbData.services.map(s => ({
      id: s.id,
      title: s.title,
      category: s.category,
      price: s.price,
      description: s.description,
      included_features: s.includedFeatures || [],
      is_public: s.public !== false
    }));

    const { data, error } = await supabase.from('services').upsert(servicesPayload, { onConflict: 'id' });
    if (error) console.error('❌ Services seed error:', error.message);
    else console.log(`✅ Services seeded: ${servicesPayload.length} records.`);
  }

  // 3. Seed Team / Profiles
  if (dbData.team && dbData.team.length > 0) {
    const profilesPayload = dbData.team.map(t => ({
      emp_code: t.id,
      name: t.name,
      role: t.role,
      department: t.department,
      telegram_id: t.telegramId,
      phone: t.phone,
      base_salary: t.baseSalary,
      commission_rate: t.commissionRate,
      earned_commissions: t.earnedCommissions,
      status: t.status,
      active_bookings: t.activeBookings
    }));

    const { data, error } = await supabase.from('profiles').upsert(profilesPayload, { onConflict: 'emp_code' });
    if (error) console.error('❌ Profiles seed error:', error.message);
    else console.log(`✅ Profiles/Team seeded: ${profilesPayload.length} records.`);
  }

  // 4. Seed Tasks
  if (dbData.tasks && dbData.tasks.length > 0) {
    const tasksPayload = dbData.tasks.map(t => ({
      id: t.id,
      title: t.title,
      client: t.client,
      stage: t.stage,
      priority: t.priority,
      assignee: t.assignee,
      due_date: t.dueDate
    }));

    const { data, error } = await supabase.from('tasks').upsert(tasksPayload, { onConflict: 'id' });
    if (error) console.error('❌ Tasks seed error:', error.message);
    else console.log(`✅ Tasks seeded: ${tasksPayload.length} records.`);
  }

  // 5. Seed Reviews
  if (dbData.reviews && dbData.reviews.length > 0) {
    const reviewsPayload = dbData.reviews.map(r => ({
      id: r.id,
      project_id: r.projectId,
      project_name: r.projectName,
      client: r.client,
      active_version: r.activeVersion,
      versions: r.versions || [],
      media_type: r.mediaType || 'video',
      media_url: r.mediaUrl,
      poster_url: r.posterUrl,
      resolved_count: r.resolvedCount || 0,
      total_count: r.totalCount || 0
    }));

    const { data, error } = await supabase.from('reviews').upsert(reviewsPayload, { onConflict: 'id' });
    if (error) console.error('❌ Reviews seed error:', error.message);
    else console.log(`✅ Reviews seeded: ${reviewsPayload.length} records.`);
  }

  // 6. Seed Invoices
  if (dbData.invoices && dbData.invoices.length > 0) {
    const invoicesPayload = dbData.invoices.map(i => ({
      id: i.id,
      client_id: i.clientId,
      client_name: i.clientName,
      date: i.date,
      due_date: i.dueDate,
      amount: i.amount,
      tax_rate: i.taxRate || 15,
      discount: i.discount || 0,
      status: i.status,
      items: i.items || []
    }));

    const { data, error } = await supabase.from('invoices').upsert(invoicesPayload, { onConflict: 'id' });
    if (error) console.error('❌ Invoices seed error:', error.message);
    else console.log(`✅ Invoices seeded: ${invoicesPayload.length} records.`);
  }

  // 7. Seed Expenses
  if (dbData.expenses && dbData.expenses.length > 0) {
    const expensesPayload = dbData.expenses.map(e => ({
      id: e.id,
      title: e.title,
      category: e.category,
      amount: e.amount,
      date: e.date,
      logged_by: e.loggedBy
    }));

    const { data, error } = await supabase.from('expenses').upsert(expensesPayload, { onConflict: 'id' });
    if (error) console.error('❌ Expenses seed error:', error.message);
    else console.log(`✅ Expenses seeded: ${expensesPayload.length} records.`);
  }

  // 8. Seed Assets
  if (dbData.assets && dbData.assets.length > 0) {
    const assetsPayload = dbData.assets.map(a => ({
      id: a.id,
      name: a.name,
      serial: a.serial,
      category: a.category,
      purchase_price: a.purchasePrice,
      monthly_depreciation: a.monthlyDepreciation,
      condition: a.condition,
      assigned_to: a.assignedTo
    }));

    const { data, error } = await supabase.from('assets').upsert(assetsPayload, { onConflict: 'id' });
    if (error) console.error('❌ Assets seed error:', error.message);
    else console.log(`✅ Assets seeded: ${assetsPayload.length} records.`);
  }

  // 9. Seed Attendance
  if (dbData.attendance && dbData.attendance.length > 0) {
    const attendancePayload = dbData.attendance.map((a, idx) => ({
      employee_id: a.employeeId || a.id || `EMP-${idx}`,
      name: a.name || 'Team Member',
      status: a.status || 'In Studio',
      clock_in_time: a.clockInTime || '09:00 AM',
      location: a.location || 'Niketon Studio',
      date: a.date || new Date().toISOString().split('T')[0]
    }));

    const { data, error } = await supabase.from('attendance').upsert(attendancePayload, { onConflict: 'employee_id,date' });
    if (error) {
      // Fallback insert if onConflict fail
      const { error: insErr } = await supabase.from('attendance').insert(attendancePayload);
      if (insErr) console.error('❌ Attendance seed notice:', insErr.message);
      else console.log(`✅ Attendance seeded: ${attendancePayload.length} records.`);
    } else {
      console.log(`✅ Attendance seeded: ${attendancePayload.length} records.`);
    }
  }

  // 10. Seed Social Posts
  if (dbData.posts && dbData.posts.length > 0) {
    const postsPayload = dbData.posts.map(p => ({
      id: p.id,
      client_id: p.clientId || '',
      client_name: p.clientName || 'General Client',
      platform: p.platform || 'Facebook',
      title: p.title || 'Untitled Post',
      caption: p.caption || '',
      scheduled_date: p.scheduledDate || new Date().toISOString().split('T')[0],
      scheduled_time: p.scheduledTime || '18:00',
      assigned_publisher: p.assignedPublisher || 'Sabrin Akhtar',
      status: p.status || 'Pending Client Approval'
    }));

    const { data, error } = await supabase.from('social_posts').upsert(postsPayload, { onConflict: 'id' });
    if (error) console.error('❌ Social Posts seed error:', error.message);
    else console.log(`✅ Social Posts seeded: ${postsPayload.length} records.`);
  }

  // 11. Seed Quotes
  if (dbData.quotes && dbData.quotes.length > 0) {
    const quotesPayload = dbData.quotes.map(q => ({
      id: q.id,
      client_name: q.clientName || 'Client Proposal',
      amount: q.amount || 0,
      status: q.status || 'Draft',
      date: q.date || new Date().toISOString().split('T')[0],
      items: q.items || []
    }));

    const { data, error } = await supabase.from('quotes').upsert(quotesPayload, { onConflict: 'id' });
    if (error) console.error('❌ Quotes seed error:', error.message);
    else console.log(`✅ Quotes seeded: ${quotesPayload.length} records.`);
  }

  console.log('\n🎉 Seeding completed!');
}

seed().catch(err => {
  console.error('Fatal seed error:', err);
  process.exit(1);
});
