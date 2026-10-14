/**
 * scripts/clean-reports.js
 * ─────────────────────────────────────────────────────────────────────────────
 * GRO10X OS — Test Artifact & Screenshot Report Pruning Utility
 * 
 * Scans E2E report directories for historical `run-*` runs,
 * preserves the latest 3 runs for audit history, and safely prunes older
 * directories to prevent local repository storage bloat.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const fs = require('fs');
const path = require('path');

const TARGET_DIRS = [
  path.join(__dirname, 'e2e-client', 'reports'),
  path.join(__dirname, 'e2e', 'reports'),
  path.join(__dirname, 'e2e-prospect', 'reports')
];

const KEEP_LATEST = 3;

function pruneDirectoryRuns(reportsDir) {
  if (!fs.existsSync(reportsDir)) {
    console.log(`ℹ️ Directory does not exist, skipping: ${reportsDir}`);
    return { found: 0, kept: 0, pruned: 0 };
  }

  const entries = fs.readdirSync(reportsDir, { withFileTypes: true });
  const runDirs = entries
    .filter(entry => entry.isDirectory() && entry.name.startsWith('run-'))
    .map(entry => {
      const fullPath = path.join(reportsDir, entry.name);
      const stat = fs.statSync(fullPath);
      return {
        name: entry.name,
        path: fullPath,
        mtime: stat.mtimeMs
      };
    })
    .sort((a, b) => b.mtime - a.mtime); // Newest first

  const total = runDirs.length;
  if (total === 0) {
    console.log(`ℹ️ No historical 'run-*' directories found in: ${reportsDir}`);
    return { found: 0, kept: 0, pruned: 0 };
  }

  const toKeep = runDirs.slice(0, KEEP_LATEST);
  const toPrune = runDirs.slice(KEEP_LATEST);

  console.log(`\n📂 Scanning: ${reportsDir}`);
  console.log(`   Found: ${total} total historical run(s)`);
  console.log(`   Keeping latest ${toKeep.length}:`);
  toKeep.forEach(r => console.log(`     ✅ ${r.name}`));

  if (toPrune.length > 0) {
    console.log(`   Pruning ${toPrune.length} obsolete run(s):`);
    toPrune.forEach(r => {
      try {
        fs.rmSync(r.path, { recursive: true, force: true });
        console.log(`     🗑️ Removed: ${r.name}`);
      } catch (err) {
        console.error(`     ❌ Failed to remove ${r.name}: ${err.message}`);
      }
    });
  } else {
    console.log(`   ✨ No pruning required (<= ${KEEP_LATEST} runs present).`);
  }

  return { found: total, kept: toKeep.length, pruned: toPrune.length };
}

function main() {
  console.log('🧹 [GRO10X Maintenance] Starting E2E Screenshot & Artifact Pruning...');
  console.log(`   Retention Policy: Keep latest ${KEEP_LATEST} runs per target`);

  let totalFound = 0;
  let totalKept = 0;
  let totalPruned = 0;

  for (const dir of TARGET_DIRS) {
    const stats = pruneDirectoryRuns(dir);
    totalFound += stats.found;
    totalKept += stats.kept;
    totalPruned += stats.pruned;
  }

  console.log('\n─────────────────────────────────────────────────────────────────────────────');
  console.log(`🎯 Pruning Complete: Scanned ${totalFound} | Preserved ${totalKept} | Pruned ${totalPruned}`);
  console.log('─────────────────────────────────────────────────────────────────────────────\n');
}

if (require.main === module) {
  main();
}

module.exports = { pruneDirectoryRuns, main };
