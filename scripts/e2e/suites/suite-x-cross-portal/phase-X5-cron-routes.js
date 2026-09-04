/**
 * scripts/e2e/suites/suite-x-cross-portal/phase-X5-cron-routes.js
 * Suite X - Phase X5: Edge Cron Schedulers, Automation & Security
 * 
 * Tests:
 * X5.1: vercel.json Cron Jobs Configuration Integrity (>=7 crons)
 * X5.2: authorizeCron Middleware Security Guard Enforcement
 * X5.3: DigiVault Renewals Cron Route Execution (/api/cron/digivault-renewals)
 * X5.4: Weekly Lead Pipeline Digest Route Execution (/api/cron/weekly-lead-summary)
 * X5.5: Automation Briefing Engine (buildMorningBriefing & buildEODSummary)
 * X5.6: System Service Health & Multi-Portal Availability Check
 */

const path = require('path');
const http = require('http');
const { BASE_URL, wait, TestTracker } = require('../../utils');

async function runPhaseX5(page) {
  const tracker = new TestTracker('Suite X - Phase X5: Edge Cron Schedulers & Automations');
  console.log('\n--- ⏰ Running Suite X - Phase X5: Cron & Automations ---');

  await tracker.runStep('X5.1', 'vercel.json Cron Jobs Configuration Integrity (>=7 crons)', async () => {
    const vercelConfig = require(path.join(process.cwd(), 'vercel.json'));
    tracker.assert(Array.isArray(vercelConfig.crons), 'vercel.json must have crons array');
    tracker.assert(vercelConfig.crons.length >= 7, `vercel.json must contain at least 7 cron schedules, found ${vercelConfig.crons.length}`);

    // Verify paths exist in crons configuration
    const paths = vercelConfig.crons.map(c => c.path);
    tracker.assert(paths.some(p => p.includes('briefing') || p.includes('morning')), 'Missing morning briefing cron');
    tracker.assert(paths.some(p => p.includes('summary') || p.includes('eod')), 'Missing EOD summary cron');
  });

  await tracker.runStep('X5.2', 'authorizeCron Middleware Security Guard Enforcement', async () => {
    // Calling cron route with invalid secret must be blocked with HTTP 401
    const unauthStatus = await new Promise((resolve) => {
      const req = http.get(`${BASE_URL}/api/cron/digivault-renewals`, {
        headers: { 'x-cron-secret': 'INVALID_EXPLOIT_ATTEMPT' }
      }, (res) => {
        resolve(res.statusCode);
      });
      req.on('error', () => resolve(null));
    });
    tracker.assert(unauthStatus === 401, `Unauthorized cron attempt must receive 401, got ${unauthStatus}`);
  });

  await tracker.runStep('X5.3', 'DigiVault Renewals Cron Route Execution (/api/cron/digivault-renewals)', async () => {
    const cronSecret = process.env.CRON_SECRET || 'gro10x_cron_secret';
    const result = await new Promise((resolve) => {
      const req = http.get(`${BASE_URL}/api/cron/digivault-renewals`, {
        headers: {
          'Authorization': `Bearer ${cronSecret}`,
          'x-cron-secret': cronSecret,
          'x-vercel-cron': '1'
        }
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(data) });
          } catch (e) {
            resolve({ status: res.statusCode, raw: data });
          }
        });
      });
      req.on('error', () => resolve(null));
    });

    tracker.assert(result && result.status === 200, `Expected 200 from digivault-renewals, got ${result?.status}`);
    tracker.assert(result.body && result.body.success, 'digivault-renewals should return success: true');
  });

  await tracker.runStep('X5.4', 'Weekly Lead Pipeline Digest Route Execution (/api/cron/lead-pipeline-summary)', async () => {
    const cronSecret = process.env.CRON_SECRET || 'gro10x_cron_secret';
    const result = await new Promise((resolve) => {
      const req = http.get(`${BASE_URL}/api/cron/lead-pipeline-summary`, {
        headers: {
          'Authorization': `Bearer ${cronSecret}`,
          'x-cron-secret': cronSecret,
          'x-vercel-cron': '1'
        }
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(data) });
          } catch (e) {
            resolve({ status: res.statusCode, raw: data });
          }
        });
      });
      req.on('error', () => resolve(null));
    });

    tracker.assert(result && result.status === 200, `Expected 200 from lead-pipeline-summary, got ${result?.status}`);
    tracker.assert(result.body && result.body.success, 'lead-pipeline-summary should return success: true');
  });

  await tracker.runStep('X5.5', 'Automation Briefing Engine (buildMorningBriefing & buildEODSummary)', async () => {
    const automationService = require(path.join(process.cwd(), 'src/services/automation'));
    tracker.assert(typeof automationService.buildMorningBriefing === 'function', 'buildMorningBriefing must be defined');
    tracker.assert(typeof automationService.buildEODSummary === 'function', 'buildEODSummary must be defined');
  });

  await tracker.runStep('X5.6', 'System Service Health & Multi-Portal Availability Check', async () => {
    const rootStatus = await new Promise((resolve) => {
      const req = http.get(`${BASE_URL}/`, (res) => {
        resolve(res.statusCode);
      });
      req.on('error', () => resolve(null));
    });
    tracker.assert(rootStatus === 200, `Root website should return HTTP 200, got ${rootStatus}`);
  });

  return tracker.getSummary();
}

module.exports = { runPhaseX5 };
