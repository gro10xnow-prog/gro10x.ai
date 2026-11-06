/**
 * tests/passkoro_prototype.test.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Forensic Verification Suite for PassKoro Prototype (V1)
 * Author: Zarif Rahman (Rapid Prototyper, GRO10X Foundry Lab)
 * 
 * Verifies all Mandatory Brief Invariants & Executive Corrections:
 * 1. Canonical Routes & Asset Ingress (/prototypes/passkoro)
 * 2. 40 Original DVSA-style Questions with rich Bangla explanations & tips
 * 3. 30 Vector Road Signs with inline SVG, Bangla meaning & memory tips
 * 4. Life in the UK (3 Honest MCQs) & Visa English (SELT Speaking/Listening Cards)
 * 5. Teacher Dashboard Invariants (Z1: Saturday 7:45 PM UK solo, Z2: £2,400 income,
 *    Z3: 12/12 capacity & June 2027, Z5: "Anamika Apu" greeting)
 * 6. Phone-First & Zero Horizontal Scroll Integrity (360px - 430px)
 * ─────────────────────────────────────────────────────────────────────────────
 */

const request = require('supertest');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const app = require('../server');

// Helper to reliably load ESM data modules in Jest CommonJS runtime
function loadEsmModule(relPath) {
  const fullPath = path.resolve(__dirname, relPath);
  let content = fs.readFileSync(fullPath, 'utf8');
  content = content.replace(/export\s+const\s+([A-Za-z0-9_]+)\s*=/g, 'const $1 = exports.$1 =');
  const sandbox = { exports: {} };
  vm.createContext(sandbox);
  vm.runInContext(content, sandbox);
  return sandbox.exports;
}

describe('PassKoro (V1) — Forensic Attainment & Acceptance Suite', () => {

  // --- GATE 1: CANONICAL ROUTES & ASSET INGRESS ---
  describe('Gate 1: Canonical Routes & Asset Ingress', () => {
    test('GET /prototypes/passkoro returns HTTP 200 with PassKoro HTML', async () => {
      const res = await request(app).get('/prototypes/passkoro');
      expect(res.status).toBe(200);
      expect(res.text).toContain('Pass');
      expect(res.text).toContain('Koro');
      expect(res.text).toContain('Space Grotesk');
      expect(res.text).toContain('Noto Sans Bengali');
    });

    test('GET /prototypes/passkoro/ trailing slash returns HTTP 200 with both Student & Teacher views', async () => {
      const res = await request(app).get('/prototypes/passkoro/');
      expect(res.status).toBe(200);
      expect(res.text).toContain('id="student-container"');
      expect(res.text).toContain('id="teacher-container"');
      expect(res.text).toContain('id="btn-role-student"');
      expect(res.text).toContain('id="btn-role-teacher"');
      expect(res.text).toContain('id="practice-question-card"');
      expect(res.text).toContain('id="modal-whatsapp-nudge"');
    });

    test('All core source files exist on disk in public/prototypes/passkoro/', () => {
      const baseDir = path.join(__dirname, '../public/prototypes/passkoro');
      const requiredFiles = [
        'index.html',
        'styles.css',
        'app.js',
        'data/questions.js',
        'data/signs.js',
        'data/life_in_uk.js',
        'data/visa_english.js',
        'data/teacher_data.js'
      ];

      requiredFiles.forEach(file => {
        const fullPath = path.join(baseDir, file);
        expect(fs.existsSync(fullPath)).toBe(true);
        const stat = fs.statSync(fullPath);
        expect(stat.size).toBeGreaterThan(100);
      });
    });
  });

  // --- GATE 2: 40 ORIGINAL DVSA-STYLE QUESTIONS WITH BANGLA EXPLANATIONS ---
  describe('Gate 2: 40 Original Questions & Bilingual Explanation Rigor', () => {
    let questionsModule;

    beforeAll(() => {
      questionsModule = loadEsmModule('../public/prototypes/passkoro/data/questions.js');
    });

    test('Dataset contains exactly 40 original questions', () => {
      expect(questionsModule.THEORY_QUESTIONS).toBeDefined();
      expect(questionsModule.THEORY_QUESTIONS.length).toBe(40);
    });

    test('Every question conforms to the required bilingual schema', () => {
      questionsModule.THEORY_QUESTIONS.forEach(q => {
        expect(q.id).toBeDefined();
        expect(typeof q.topic).toBe('string');
        expect(q.question.length).toBeGreaterThan(15);
        expect(Array.isArray(q.options)).toBe(true);
        expect(q.options.length).toBe(4);
        expect(q.correctIndex).toBeGreaterThanOrEqual(0);
        expect(q.correctIndex).toBeLessThanOrEqual(3);
        expect(typeof q.explanationEn).toBe('string');
        expect(q.explanationEn.length).toBeGreaterThan(20);
        expect(typeof q.explanationBn).toBe('string');
        expect(q.explanationBn.length).toBeGreaterThan(20);
        expect(typeof q.tip).toBe('string');
      });
    });

    test('Topic distribution covers all core Highway Code domains', () => {
      const topicCounts = {};
      questionsModule.THEORY_QUESTIONS.forEach(q => {
        topicCounts[q.topic] = (topicCounts[q.topic] || 0) + 1;
      });

      expect(topicCounts['Alertness']).toBe(5);
      expect(topicCounts['Road Signs & Markings']).toBe(6);
      expect(topicCounts['Safety Margins']).toBe(5);
      expect(topicCounts['Hazard Awareness']).toBe(6);
      expect(topicCounts['Motorway Rules']).toBe(5);
      expect(topicCounts['Rules of the Road']).toBe(5);
      expect(topicCounts['Vehicle Handling']).toBe(4);
      expect(topicCounts['Incidents & Documents']).toBe(4);
    });

    test('Zero Crown copyright infringement — all questions use original scenarios', () => {
      const forbiddenPhrases = [
        'Crown copyright',
        'Official DVSA Guide to Driving',
        'Stationery Office'
      ];
      questionsModule.THEORY_QUESTIONS.forEach(q => {
        forbiddenPhrases.forEach(phrase => {
          expect(q.question).not.toContain(phrase);
          expect(q.explanationEn).not.toContain(phrase);
        });
      });
    });
  });

  // --- GATE 3: 30 INLINE SVG ROAD SIGNS WITH BANGLA MEANING ---
  describe('Gate 3: 30 Vector Road Signs & Memory Tips (Z4)', () => {
    let signsModule;

    beforeAll(() => {
      signsModule = loadEsmModule('../public/prototypes/passkoro/data/signs.js');
    });

    test('Contains exactly 30 vector road signs', () => {
      expect(signsModule.ROAD_SIGNS).toBeDefined();
      expect(signsModule.ROAD_SIGNS.length).toBe(30);
    });

    test('Every sign contains inline SVG and bilingual memory metadata', () => {
      signsModule.ROAD_SIGNS.forEach(sign => {
        expect(sign.id).toBeDefined();
        expect(sign.category).toBeDefined();
        expect(sign.nameEn).toBeDefined();
        expect(sign.nameBn).toBeDefined();
        expect(sign.tipBn).toBeDefined();
        expect(sign.svg).toContain('<svg');
        expect(sign.svg).toContain('</svg>');
        expect(sign.svg).toContain('viewBox="0 0 100 100"');
      });
    });

    test('All 4 Highway Code sign families are represented', () => {
      const categories = signsModule.ROAD_SIGNS.map(s => s.category);
      expect(categories).toContain('Prohibitory (Red Circle)');
      expect(categories).toContain('Warning (Red Triangle)');
      expect(categories).toContain('Mandatory (Blue Circle)');
      expect(categories).toContain('Information (Blue Rectangle)');
    });
  });

  // --- GATE 4: COURSE 2 & 3 PREVIEWS (LIFE IN UK & VISA ENGLISH Z4) ---
  describe('Gate 4: Multi-Course Strategy (Life in the UK & Visa English SELT)', () => {
    let lifeUKModule, visaModule;

    beforeAll(() => {
      lifeUKModule = loadEsmModule('../public/prototypes/passkoro/data/life_in_uk.js');
      visaModule = loadEsmModule('../public/prototypes/passkoro/data/visa_english.js');
    });

    test('Life in the UK contains 3 honest sample MCQs with Bengali explanations', () => {
      expect(lifeUKModule.LIFE_IN_UK_SAMPLES.length).toBe(3);
      lifeUKModule.LIFE_IN_UK_SAMPLES.forEach(q => {
        expect(q.options.length).toBe(4);
        expect(q.correctIndex).toBeGreaterThanOrEqual(0);
        expect(q.explanationBn.length).toBeGreaterThan(15);
      });
    });

    test('Visa English contains speaking and listening prompt cards, NOT MCQs (Z4)', () => {
      expect(visaModule.VISA_ENGLISH_PROMPTS.length).toBe(3);
      visaModule.VISA_ENGLISH_PROMPTS.forEach(prompt => {
        expect(prompt.options).toBeUndefined(); // Strictly NOT MCQs
        expect(prompt.examinerPrompt).toBeDefined();
        expect(prompt.phase).toBeDefined();
        expect(prompt.explanationBn || prompt.comprehensionSummaryBn).toBeDefined();
      });
    });
  });

  // --- GATE 5: TEACHER DASHBOARD & EXECUTIVE CORRECTIONS (Z1, Z2, Z3, Z5) ---
  describe("Gate 5: Apu's Teacher Dashboard & Executive Corrections", () => {
    let teacherModule;

    beforeAll(() => {
      teacherModule = loadEsmModule('../public/prototypes/passkoro/data/teacher_data.js');
    });

    test('Z5: Teacher profile identifies Anamika Apu', () => {
      expect(teacherModule.TEACHER_PROFILE.name).toBe('Anamika Apu');
    });

    test('Z1: Next class scheduled for "Saturday · 7:45 PM UK" with no date and solo instructor', () => {
      const nextClass = teacherModule.CURRENT_BATCH.nextClass;
      expect(nextClass.schedule).toBe('Saturday · 7:45 PM UK');
      expect(nextClass.schedule).not.toMatch(/\d{1,2}\s+(November|Nov)/i);
      expect(nextClass.instructor).toContain('Anamika Apu');
      expect(nextClass.instructor).not.toContain('Anushka Ray');
    });

    test('Z2: Revenue strictly equals £2,400 (12 students × £200 fee) labelled sample data', () => {
      const metrics = teacherModule.CURRENT_BATCH.metrics;
      expect(metrics.enrolledStudents).toBe(12);
      expect(metrics.feePerStudent).toBe(200);
      expect(metrics.projectedIncomeGbp).toBe(2400); // 12 × 200 = 2400
      expect(metrics.isSampleData).toBe(true);
    });

    test('Z3: Batch capacity is internally consistent (12/12) and Life in UK opens June 2027', () => {
      expect(teacherModule.CURRENT_BATCH.capacity).toContain('12/12');
      const lifeCourse = teacherModule.COURSES_PIPELINE.find(c => c.id === 'crs-life-in-uk');
      expect(lifeCourse).toBeDefined();
      expect(lifeCourse.badge).toContain('June 2027');
    });

    test('Student roster flags at-risk students with valid WhatsApp nudge links', () => {
      expect(teacherModule.STUDENTS_ROSTER.length).toBeGreaterThanOrEqual(8);
      const atRiskStudents = teacherModule.STUDENTS_ROSTER.filter(s => s.status === 'alert');
      expect(atRiskStudents.length).toBeGreaterThanOrEqual(2);
      
      const sultana = teacherModule.STUDENTS_ROSTER.find(s => s.name === 'Sultana Begum');
      expect(sultana).toBeDefined();
      expect(sultana.status).toBe('alert');
      expect(sultana.daysInactive).toBe(4);
    });
  });

  // --- GATE 6: PHONE-FIRST & ZERO HORIZONTAL SCROLL INVARIANT ---
  describe('Gate 6: Phone-First & Zero Horizontal Scroll Integrity', () => {
    test('styles.css contains phone-first container max-width and overflow-x rules', () => {
      const cssPath = path.join(__dirname, '../public/prototypes/passkoro/styles.css');
      const cssContent = fs.readFileSync(cssPath, 'utf8');

      expect(cssContent).toContain('--phone-width: 430px');
      expect(cssContent).toContain('box-sizing: border-box');
      expect(cssContent).toContain('overflow-x: hidden');
      expect(cssContent).toContain('font-family: var(--font-bangla)');
      expect(cssContent).toContain('letter-spacing: normal');
    });

    test('index.html contains responsive viewport meta tag with viewport-fit=cover', () => {
      const htmlPath = path.join(__dirname, '../public/prototypes/passkoro/index.html');
      const htmlContent = fs.readFileSync(htmlPath, 'utf8');

      expect(htmlContent).toContain('<meta name="viewport"');
      expect(htmlContent).toContain('width=device-width');
      expect(htmlContent).toContain('viewport-fit=cover');
    });
  });

});
