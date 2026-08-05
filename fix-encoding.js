const fs = require('fs');

let content = fs.readFileSync('src/services/automation.js', 'utf8');

const morningRegex = /function buildMorningBriefing\(db\) \{[\s\S]*?return msg;\n\}/;
const eodRegex = /function buildEODSummary\(db\) \{[\s\S]*?return msg;\n\}/;
const chairmanRegex = /function buildChairmanBriefing\(db\) \{[\s\S]*?return msg;\n\}/;

const cleanMorning = `function buildMorningBriefing(db) {
  const team = db.team || [];
  const inStudio = team.filter(t => t.status === 'In Studio').length;
  const onShoot = team.filter(t => t.status === 'On Field Shoot').length;
  const onLeave = team.filter(t => t.status === 'On Leave').length;
  const offline = team.length - inStudio - onShoot - onLeave;

  const pendingAgreements = team.filter(t => t.agreementStage === 1 || (t.agreementStage === 2 && true)).length;
  const pendingExpenses = (db.expenses || []).filter(e => e.status === 'Tier 3 Pending').length;
  const pendingExpAmt = (db.expenses || [])
    .filter(e => e.status === 'Tier 3 Pending')
    .reduce((s, e) => s + (e.amount || 0), 0);

  const pendingInvoices = (db.invoices || []).filter(i => i.status !== 'Paid' && i.status !== 'Draft');
  const pendingInvAmt = pendingInvoices.reduce((s, i) => s + (i.amount || 0), 0);

  const clientsInReview = (db.tasks || []).filter(t => t.stage === 'Client Review').length;
  const clientsInEdit = (db.tasks || []).filter(t => t.stage === 'Editing' || t.stage === 'Post Production').length;

  const now = getBDTime().bd;
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  let msg = \`☀️ *Good morning, this is your \${dayNames[now.getDay()]} briefing!*\n\`;
  msg += \`────────────────────────\n\n\`;

  msg += \`📊 *Team Live (\${now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })} BD)*\n\`;
  msg += \`  🟢 \${inStudio} In Studio  \`;
  msg += \`🎬 \${onShoot} On Shoot  \`;
  msg += \`🌴 \${onLeave} Leave  \`;
  msg += \`➔ \${offline} Offline\n\n\`;

  if (pendingAgreements > 0 || pendingExpenses > 0) {
    msg += \`✍️ *Pending Your Approval*\n\`;
    if (pendingAgreements > 0) msg += \`  • \${pendingAgreements} Employment Agreement(s) awaiting final seal\n\`;
    if (pendingExpenses > 0) msg += \`  • \${pendingExpenses} Expense(s) — BDT \${pendingExpAmt.toLocaleString()} to disburse\n\`;
    msg += \`\n\`;
  }

  msg += \`💰 *Finance Snapshot*\n\`;
  msg += \`  • Outstanding Invoices: \${pendingInvoices.length} (BDT \${pendingInvAmt.toLocaleString()})\n\n\`;

  msg += \`🎬 *Campaign Pipeline*\n\`;
  msg += \`  • \${clientsInReview} deliverable(s) in Client Review\n\`;
  msg += \`  • \${clientsInEdit} in Editing / Post Production\n\`;
  msg += \`────────────────────────\`;

  return msg;
}`;

const cleanEod = `function buildEODSummary(db) {
  const team = db.team || [];
  const todayStr = new Date().toLocaleDateString('en-CA');

  const clockedToday = (db.attendance || []).filter(a =>
    a.clockInTime && (a.date === todayStr || !a.date)
  );

  const eodToday = (db.eodReports || []).filter(r =>
    r.date === todayStr || r.submittedAt?.startsWith(todayStr)
  );

  const expToday = (db.expenses || []).filter(e =>
    e.date === todayStr || e.createdAt?.startsWith(todayStr)
  );

  let msg = \`🌙 *Evening Summary — End of Day*\n\`;
  msg += \`────────────────────────\n\n\`;

  msg += \`📊 *Attendance Today*\n\`;
  msg += \`  • \${clockedToday.length} team member(s) clocked in\n\`;
  if (team.length - clockedToday.length > 0) {
    msg += \`  • \${team.length - clockedToday.length} did not log attendance\n\`;
  }
  msg += \`\n\`;

  msg += \`📊 *EOD Reports*\n\`;
  if (eodToday.length > 0) {
    msg += \`  • \${eodToday.length} report(s) submitted today\n\`;
    eodToday.slice(0, 3).forEach(r => {
      msg += \`  — \${r.employeeName || 'Team Member'}: \${(r.summary || r.tasks || '').slice(0, 60)}...\n\`;
    });
  } else {
    msg += \`  • No EOD reports received today\n\`;
  }
  msg += \`\n\`;

  if (expToday.length > 0) {
    const expTotal = expToday.reduce((s, e) => s + (e.amount || 0), 0);
    msg += \`🧾 *Expenses Filed Today*\n\`;
    msg += \`  • \${expToday.length} claim(s) — BDT \${expTotal.toLocaleString()} total\n\n\`;
  }

  msg += \`────────────────────────\n\`;
  msg += \`_Have a great evening! See you tomorrow._ 💜\`;

  return msg;
}`;

const cleanChairman = `function buildChairmanBriefing(db) {
  const team = db.team || [];
  const now = getBDTime().bd;
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const invoices = db.invoices || [];
  const monthStr = now.toISOString().slice(0, 7);
  const paidThisMonth = invoices.filter(i => i.status === 'Paid' && (i.paidAt || i.issueDate || '').startsWith(monthStr));
  const revThisMonth = paidThisMonth.reduce((s, i) => s + (i.amount || 0), 0);
  const pendingInvoices = invoices.filter(i => i.status !== 'Paid' && i.status !== 'Draft');
  const pendingInvAmt = pendingInvoices.reduce((s, i) => s + (i.amount || 0), 0);
  const salaryTotal = team.reduce((s, t) => s + (t.baseSalary || 0), 0);

  const activeEmployees = team.filter(t => t.id !== 'PBD-000').length;
  const pendingAgreements = team.filter(t => t.agreementStage && t.agreementStage < 3 && !t.agreementComplete).length;
  const onLeave = team.filter(t => t.status === 'On Leave').length;
  const pendingLeaves = (db.leaveRequests || []).filter(l => l.status === 'Pending Manager Approval').length;

  const leads = db.leads || [];
  const activeLeads = leads.filter(l => l.status !== 'Won' && l.status !== 'Lost').length;
  const pipelineValue = leads.filter(l => l.status !== 'Won' && l.status !== 'Lost').reduce((s, l) => s + (l.value || 0), 0);
  const wonThisMonth = leads.filter(l => l.status === 'Won' && (l.wonAt || '').startsWith(monthStr)).length;

  const clients = db.clients || [];
  const activeClients = clients.filter(c => c.status === 'Active Retainer').length;
  const inReview = (db.tasks || []).filter(t => t.stage === 'Client Review').length;

  let msg = \`🏢 *Chairman's \${dayNames[now.getDay()]} Board Briefing*\n\`;
  msg += \`────────────────────────\n\n\`;

  msg += \`💰 *Financial Health*\n\`;
  msg += \`  • Revenue (this month): BDT \${revThisMonth.toLocaleString()}\n\`;
  msg += \`  • Outstanding invoices: \${pendingInvoices.length} — BDT \${pendingInvAmt.toLocaleString()}\n\`;
  msg += \`  • Monthly Fixed Payroll: BDT \${salaryTotal.toLocaleString()}\n\n\`;

  msg += \`👥 *Human Capital*\n\`;
  msg += \`  • \${activeEmployees} active crew members (\${onLeave} on leave today)\n\`;
  msg += \`  • \${pendingAgreements} pending employment agreements\n\n\`;

  msg += \`🌐 *Growth & Pipeline*\n\`;
  msg += \`  • \${activeClients} active retainer clients (\${inReview} campaigns in review)\n\`;
  msg += \`  • \${wonThisMonth} new leads won this month\n\`;
  msg += \`  • \${activeLeads} active leads in pipeline (Est. BDT \${pipelineValue.toLocaleString()})\n\`;
  
  msg += \`────────────────────────\n\`;
  msg += \`_Purplebot OS — Executive Summary_\`;

  return msg;
}`;

content = content.replace(morningRegex, cleanMorning);
content = content.replace(eodRegex, cleanEod);
content = content.replace(chairmanRegex, cleanChairman);

fs.writeFileSync('src/services/automation.js', content, 'utf8');
console.log('Fixed encodings!');
