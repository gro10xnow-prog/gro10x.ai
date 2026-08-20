/**
 * src/utils/name.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Intelligent Honorific-Aware Name Engine for PurpleOS.
 * Accurately extracts preferred first names and strips prefixes/titles.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const HONORIFICS = new Set([
  'md.', 'md', 'mohammad', 'mohammed', 'muhammad', 'muhammed',
  'dr.', 'dr', 'doctor',
  'engr.', 'engr', 'engineer',
  'prof.', 'prof', 'professor',
  'mr.', 'mr', 'mister',
  'mrs.', 'mrs',
  'ms.', 'ms', 'miss',
  'adv.', 'adv', 'advocate',
  'alhaj', 'al-haj', 'haji',
  'barrister', 'bar.'
]);

/**
 * Extracts the true preferred first name for a person.
 * Strips known honorific prefixes and returns the first actual given name.
 * 
 * Examples:
 *   "Md. Zahin Khandaker"    -> "Zahin"
 *   "Mohammad Borhan Uddin"  -> "Borhan"
 *   "Dr. Ayman Sadiq"        -> "Ayman"
 *   "Engr. Mahmudul Hasan"   -> "Mahmudul"
 *   "Tasin Traders"          -> "Tasin"
 *   "Mehedi"                 -> "Mehedi"
 */
function getFirstName(fullName) {
  if (!fullName || typeof fullName !== 'string') return 'Team Member';
  const clean = fullName.trim();
  if (!clean) return 'Team Member';

  const parts = clean.split(/\s+/);
  if (parts.length === 1) return parts[0];

  const firstLower = parts[0].toLowerCase().replace(/[,:]/g, '');
  if (HONORIFICS.has(firstLower) && parts.length > 1) {
    // Check if the second part is also an honorific (e.g., "Alhaj Md. Rafiq")
    const secondLower = parts[1].toLowerCase().replace(/[,:]/g, '');
    if (HONORIFICS.has(secondLower) && parts.length > 2) {
      return parts[2];
    }
    return parts[1];
  }

  return parts[0];
}

/**
 * Strips honorific prefix from full name while preserving the rest of the name.
 * 
 * Example:
 *   "Md. Zahin Khandaker" -> "Zahin Khandaker"
 *   "Dr. Ayman Sadiq"     -> "Ayman Sadiq"
 */
function getPreferredName(fullName) {
  if (!fullName || typeof fullName !== 'string') return '';
  const clean = fullName.trim();
  const parts = clean.split(/\s+/);
  if (parts.length === 1) return parts[0];

  const firstLower = parts[0].toLowerCase().replace(/[,:]/g, '');
  if (HONORIFICS.has(firstLower) && parts.length > 1) {
    const secondLower = parts[1].toLowerCase().replace(/[,:]/g, '');
    if (HONORIFICS.has(secondLower) && parts.length > 2) {
      return parts.slice(2).join(' ');
    }
    return parts.slice(1).join(' ');
  }

  return clean;
}

/**
 * Checks if a task assignee string matches a given employee name or ID.
 */
function matchesAssignee(taskAssignee, empName, empCode = null) {
  if (!taskAssignee) return false;
  const tAssign = String(taskAssignee).trim().toLowerCase();

  if (empCode && tAssign.includes(String(empCode).trim().toLowerCase())) {
    return true;
  }

  if (empName) {
    const cleanEmp = String(empName).trim().toLowerCase();
    if (tAssign === cleanEmp) return true;

    const preferred = getPreferredName(empName).toLowerCase();
    if (preferred && tAssign.includes(preferred)) return true;

    const firstName = getFirstName(empName).toLowerCase();
    if (firstName && firstName.length > 2 && tAssign.includes(firstName)) return true;
  }

  return false;
}

module.exports = {
  getFirstName,
  getPreferredName,
  matchesAssignee,
  HONORIFICS
};
