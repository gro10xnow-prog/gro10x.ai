// PassKoro - Phone-First Application State Engine & Interactive Controller
// Author: Zarif Rahman (Rapid Prototyper, GRO10X Foundry Lab)

import { THEORY_TOPICS, THEORY_QUESTIONS } from './data/questions.js';
import { ROAD_SIGNS } from './data/signs.js';
import { LIFE_IN_UK_SAMPLES } from './data/life_in_uk.js';
import { VISA_ENGLISH_PROMPTS } from './data/visa_english.js';
import { TEACHER_PROFILE, CURRENT_BATCH, STUDENTS_ROSTER, COURSES_PIPELINE } from './data/teacher_data.js';

// Audio Clips Lookup Table (F3)
const AUDIO_CLIPS = {
  'th-01': '/prototypes/passkoro/audio/pk-audio-th-01.mp3',
  'th-06': '/prototypes/passkoro/audio/pk-audio-th-06.mp3',
  'th-12': '/prototypes/passkoro/audio/pk-audio-th-12.mp3',
  'th-17': '/prototypes/passkoro/audio/pk-audio-th-17.mp3',
  'th-23': '/prototypes/passkoro/audio/pk-audio-th-23.mp3',
  'liuk-01': '/prototypes/passkoro/audio/pk-audio-liuk-1.mp3',
  'liuk-02': '/prototypes/passkoro/audio/pk-audio-liuk-2.mp3',
  'liuk-03': '/prototypes/passkoro/audio/pk-audio-liuk-3.mp3'
};

// Global Audio Controller
let currentAudio = null;
let currentAudioId = null;

function stopCurrentAudio() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
    currentAudioId = null;
  }
  document.querySelectorAll('.audio-play-pill').forEach(btn => {
    if (!btn.disabled) {
      btn.innerHTML = '<span>▶</span> শুনুন (ভয়েস গাইড)';
      btn.classList.remove('is-playing');
    }
  });
  document.querySelectorAll('.wave-bar').forEach(wb => {
    wb.style.animationPlayState = 'paused';
  });
}

function toggleAudio(clipId, btnElement, waveContainer) {
  const audioSrc = AUDIO_CLIPS[clipId];
  if (!audioSrc) return;

  if (currentAudio && currentAudioId === clipId) {
    if (currentAudio.paused) {
      currentAudio.play();
      btnElement.innerHTML = '<span>⏸️</span> থামুন (Pause)';
      btnElement.classList.add('is-playing');
      if (waveContainer) {
        waveContainer.querySelectorAll('.wave-bar').forEach(wb => wb.style.animationPlayState = 'running');
      }
    } else {
      currentAudio.pause();
      btnElement.innerHTML = '<span>▶</span> শুনুন (ভয়েস গাইড)';
      btnElement.classList.remove('is-playing');
      if (waveContainer) {
        waveContainer.querySelectorAll('.wave-bar').forEach(wb => wb.style.animationPlayState = 'paused');
      }
    }
  } else {
    stopCurrentAudio();
    currentAudio = new Audio(audioSrc);
    currentAudioId = clipId;
    currentAudio.play().then(() => {
      btnElement.innerHTML = '<span>⏸️</span> থামুন (Pause)';
      btnElement.classList.add('is-playing');
      if (waveContainer) {
        waveContainer.querySelectorAll('.wave-bar').forEach(wb => wb.style.animationPlayState = 'running');
      }
    }).catch(e => console.warn('Audio play error:', e));

    currentAudio.onended = () => {
      btnElement.innerHTML = '<span>▶</span> শুনুন (ভয়েস গাইড)';
      btnElement.classList.remove('is-playing');
      if (waveContainer) {
        waveContainer.querySelectorAll('.wave-bar').forEach(wb => wb.style.animationPlayState = 'paused');
      }
      currentAudio = null;
      currentAudioId = null;
    };
  }
}

// Application Global State
const state = {
  activeRole: 'student', // 'student' or 'teacher'
  studentSubView: 'home', // 'home', 'practice', 'mock', 'signs', 'hazard', 'progress'
  
  // Practice Mode State (F1: Isolated Per-Question State)
  practiceTopic: 'All Topics',
  filteredQuestions: [...THEORY_QUESTIONS],
  currentPracticeIdx: 0,
  practiceUserAnswers: {}, // questionId -> selectedIndex
  practiceExplanationOpen: {}, // questionId -> boolean
  
  // Interactive Life in the UK State (F2)
  lifeUKUserAnswers: {}, // questionId -> selectedIndex
  lifeUKDrawerOpen: {}, // questionId -> boolean
  
  // Mock Test State
  mockActive: false,
  mockQuestions: [],
  currentMockIdx: 0,
  mockUserAnswers: {}, // index -> selectedOption
  mockTimerSeconds: 12 * 60, // 12 minutes
  mockTimerInterval: null,
  
  // Signs State
  signsCategory: 'all',

  // Active Modals & Selected Student
  selectedStudentForNudge: null,
  selectedStudentForDetail: null
};

// Safe DOM Query Helper
const $ = (id) => document.getElementById(id);

// --- 1. INITIALIZATION ON DOM READY ---
document.addEventListener('DOMContentLoaded', () => {
  initRoleSwitcher();
  initStudentSubnav();
  initCourseCardEvents();
  initPracticeEngine();
  initMockEngine();
  initRoadSigns();
  initHazardSimulation();
  initTeacherDashboard();
  initModalEvents();
  
  // Initialize default views
  renderTopicFilterPills();
  renderPracticeQuestion();
  renderRoadSigns();
  renderTeacherRoster();
  renderTeacherCourses();
});

// --- 2. ROLE SWITCHER (STUDENT <-> TEACHER) ---
function initRoleSwitcher() {
  const btnStudent = $('btn-role-student');
  const btnTeacher = $('btn-role-teacher');
  const studentContainer = $('student-container');
  const teacherContainer = $('teacher-container');
  const roleBadge = $('role-status-badge');

  btnStudent.addEventListener('click', () => switchRole('student'));
  btnTeacher.addEventListener('click', () => switchRole('teacher'));

  function switchRole(role) {
    stopCurrentAudio();
    state.activeRole = role;
    if (role === 'student') {
      btnStudent.classList.add('active');
      btnTeacher.classList.remove('active');
      studentContainer.classList.add('active');
      teacherContainer.classList.remove('active');
      roleBadge.textContent = 'Student Mode';
      roleBadge.style.color = 'var(--cyan)';
      roleBadge.style.borderColor = 'var(--border-cyan)';
    } else {
      btnTeacher.classList.add('active');
      btnStudent.classList.remove('active');
      teacherContainer.classList.add('active');
      studentContainer.classList.remove('active');
      roleBadge.textContent = "Apu's Dashboard";
      roleBadge.style.color = 'var(--emerald)';
      roleBadge.style.borderColor = 'var(--border-emerald)';
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

// --- 3. STUDENT SUB-NAVIGATION ---
function initStudentSubnav() {
  const subnavBtns = document.querySelectorAll('.subnav-pill-btn');
  subnavBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetSub = btn.getAttribute('data-sub');
      showStudentSubView(targetSub);
    });
  });

  const btnQuickContinue = $('btn-quick-continue');
  if (btnQuickContinue) {
    btnQuickContinue.addEventListener('click', () => {
      showStudentSubView('practice');
    });
  }
}

function showStudentSubView(subName) {
  stopCurrentAudio();
  state.studentSubView = subName;
  
  // Update subnav pills
  document.querySelectorAll('.subnav-pill-btn').forEach(b => {
    b.classList.toggle('active', b.getAttribute('data-sub') === subName);
  });

  // Hide all sub-panels
  const subPanels = [
    'sub-student-home',
    'sub-student-practice',
    'sub-student-mock',
    'sub-student-signs',
    'sub-student-hazard',
    'sub-student-progress'
  ];
  subPanels.forEach(pId => {
    const el = $(pId);
    if (el) el.classList.remove('active');
  });

  // Activate target
  const targetEl = $(`sub-student-${subName}`);
  if (targetEl) targetEl.classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// --- 4. COURSE CARDS CLICK EVENTS ---
function initCourseCardEvents() {
  const cardTheory = $('card-course-theory');
  if (cardTheory) {
    cardTheory.addEventListener('click', () => showStudentSubView('practice'));
  }

  const cardLifeUK = $('card-course-lifeuk');
  if (cardLifeUK) {
    cardLifeUK.addEventListener('click', openLifeUKSamplesModal);
  }

  const cardVisa = $('card-course-visa');
  if (cardVisa) {
    cardVisa.addEventListener('click', openVisaSamplesModal);
  }
}

// --- 5. THEORY PRACTICE ENGINE (F1: ISOLATED PER-QUESTION STATE & F3 REAL AUDIO) ---
function initPracticeEngine() {
  const btnPrev = $('btn-practice-prev');
  const btnNext = $('btn-practice-next');
  const btnToggleBangla = $('btn-toggle-bangla');
  const btnPlayVoice = $('btn-play-voice-demo');

  btnPrev.addEventListener('click', () => {
    if (state.currentPracticeIdx > 0) {
      state.currentPracticeIdx--;
      renderPracticeQuestion();
    }
  });

  btnNext.addEventListener('click', () => {
    if (state.currentPracticeIdx < state.filteredQuestions.length - 1) {
      state.currentPracticeIdx++;
      renderPracticeQuestion();
    }
  });

  btnToggleBangla.addEventListener('click', () => {
    const q = state.filteredQuestions[state.currentPracticeIdx];
    if (!q) return;
    state.practiceExplanationOpen[q.id] = !state.practiceExplanationOpen[q.id];
    const drawer = $('practice-explanation-drawer');
    drawer.classList.toggle('open', !!state.practiceExplanationOpen[q.id]);
  });

  btnPlayVoice.addEventListener('click', () => {
    const q = state.filteredQuestions[state.currentPracticeIdx];
    if (!q) return;
    const waveBox = $('practice-explanation-drawer').querySelector('.audio-wave-bars');
    toggleAudio(q.id, btnPlayVoice, waveBox);
  });
}

function renderTopicFilterPills() {
  const container = $('topic-filter-container');
  if (!container) return;

  container.innerHTML = THEORY_TOPICS.map(topic => `
    <button class="topic-pill ${topic === state.practiceTopic ? 'active' : ''}" data-topic="${topic}">
      ${topic}
    </button>
  `).join('');

  container.querySelectorAll('.topic-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      stopCurrentAudio();
      const selected = btn.getAttribute('data-topic');
      state.practiceTopic = selected;
      
      container.querySelectorAll('.topic-pill').forEach(b => b.classList.toggle('active', b === btn));
      
      if (selected === 'All Topics') {
        state.filteredQuestions = [...THEORY_QUESTIONS];
      } else {
        state.filteredQuestions = THEORY_QUESTIONS.filter(q => q.topic === selected);
      }
      state.currentPracticeIdx = 0;
      renderPracticeQuestion();
    });
  });
}

function renderPracticeQuestion() {
  stopCurrentAudio();
  const q = state.filteredQuestions[state.currentPracticeIdx];
  if (!q) return;

  $('practice-count-badge').textContent = `${state.filteredQuestions.length} Questions Available`;
  $('practice-topic-label').textContent = q.topic;
  $('practice-q-num').textContent = `Question ${state.currentPracticeIdx + 1} of ${state.filteredQuestions.length}`;
  $('practice-q-text').textContent = q.question;

  const answeredIdx = state.practiceUserAnswers[q.id];
  const isAnswered = answeredIdx !== undefined;

  // Options List
  const optionsList = $('practice-options-list');
  const letters = ['A', 'B', 'C', 'D'];

  optionsList.innerHTML = q.options.map((opt, i) => {
    let classes = 'option-btn';
    if (isAnswered) {
      if (i === q.correctIndex) classes += ' selected-correct';
      else if (i === answeredIdx) classes += ' selected-wrong';
    }
    return `
      <button class="${classes}" data-opt-idx="${i}">
        <span class="option-letter">${letters[i]}</span>
        <span style="flex:1;">${opt}</span>
      </button>
    `;
  }).join('');

  // Handle Option Click
  optionsList.querySelectorAll('.option-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const chosen = parseInt(btn.getAttribute('data-opt-idx'), 10);
      state.practiceUserAnswers[q.id] = chosen;
      state.practiceExplanationOpen[q.id] = true;
      renderPracticeQuestion();
    });
  });

  // Feedback Message (F1: strictly display:none and empty if unanswered)
  const feedback = $('practice-feedback-msg');
  if (isAnswered) {
    feedback.style.display = 'block';
    if (answeredIdx === q.correctIndex) {
      feedback.style.background = 'rgba(0, 223, 137, 0.15)';
      feedback.style.color = 'var(--emerald)';
      feedback.innerHTML = `✓ <strong>Correct!</strong> সঠিক উত্তর হয়েছে। নিচে ব্যাখ্যাটি বাংলায় পড়ুন।`;
    } else {
      feedback.style.background = 'rgba(239, 68, 68, 0.15)';
      feedback.style.color = 'var(--red)';
      feedback.innerHTML = `✕ <strong>Incorrect.</strong> সঠিক উত্তরটি চিহ্নিত করা হয়েছে। ব্যাখ্যাটি বাংলায় পড়ুন।`;
    }
  } else {
    feedback.style.display = 'none';
    feedback.innerHTML = '';
  }

  // Explanation Drawer (F1: strictly closed unless user has opened it for this question)
  const drawer = $('practice-explanation-drawer');
  if (state.practiceExplanationOpen[q.id]) {
    drawer.classList.add('open');
  } else {
    drawer.classList.remove('open');
  }

  // Explanations text
  $('practice-bn-explanation').innerHTML = q.explanationBn;
  $('practice-memory-tip').innerHTML = `💡 <strong>মনে রাখার টিপস:</strong> ${q.tip}`;

  // Configure Audio Button for this question (F3: Honest State)
  const audioBtn = $('btn-play-voice-demo');
  const waveBars = drawer.querySelector('.audio-wave-bars');
  const dialectTag = drawer.querySelector('.audio-demo-player .text-muted-sm');

  const clipSrc = AUDIO_CLIPS[q.id];
  if (clipSrc) {
    audioBtn.disabled = false;
    audioBtn.style.opacity = '1';
    audioBtn.style.cursor = 'pointer';
    audioBtn.style.background = 'var(--emerald)';
    audioBtn.style.color = '#000';
    audioBtn.style.border = 'none';
    audioBtn.innerHTML = '<span>▶</span> শুনুন (ভয়েস গাইড)';
    if (waveBars) waveBars.style.display = 'flex';
    if (dialectTag) dialectTag.textContent = 'Sylhet/London Dialect (Helio Voice)';
  } else {
    audioBtn.disabled = true;
    audioBtn.style.opacity = '0.6';
    audioBtn.style.cursor = 'default';
    audioBtn.style.background = 'rgba(255, 255, 255, 0.06)';
    audioBtn.style.color = 'var(--text-sub)';
    audioBtn.style.border = '1px solid var(--border-subtle)';
    audioBtn.innerHTML = '<span>🎙️</span> অডিও নমুনা শীঘ্রই আসছে';
    if (waveBars) waveBars.style.display = 'none';
    if (dialectTag) dialectTag.textContent = 'Audio sample coming soon';
  }

  // Next/Prev button states
  $('btn-practice-prev').disabled = state.currentPracticeIdx === 0;
  $('btn-practice-next').disabled = state.currentPracticeIdx >= state.filteredQuestions.length - 1;
}

// --- 6. SCALED TIMED MOCK TEST (10 QUESTIONS IN 12 MINUTES) ---
function initMockEngine() {
  const btnStart = $('btn-start-mock-now');
  const btnNext = $('btn-mock-next');
  const btnPrev = $('btn-mock-prev');
  const btnSubmit = $('btn-mock-submit-early');
  const btnRetake = $('btn-mock-retake');
  const btnReviewBn = $('btn-mock-review-bn');

  btnStart.addEventListener('click', startMockExam);
  btnRetake.addEventListener('click', startMockExam);
  
  // F4d: Opens in-place mock review modal with all 10 questions and explanations
  btnReviewBn.addEventListener('click', openMockReviewModal);

  btnPrev.addEventListener('click', () => {
    if (state.currentMockIdx > 0) {
      state.currentMockIdx--;
      renderMockQuestion();
    }
  });

  btnNext.addEventListener('click', () => {
    if (state.currentMockIdx < state.mockQuestions.length - 1) {
      state.currentMockIdx++;
      renderMockQuestion();
    } else {
      finishMockExam();
    }
  });

  btnSubmit.addEventListener('click', () => {
    if (confirm('Are you sure you want to finish and submit your mock exam?')) {
      finishMockExam();
    }
  });
}

function startMockExam() {
  stopCurrentAudio();
  state.mockActive = true;
  state.currentMockIdx = 0;
  state.mockUserAnswers = {};
  state.mockTimerSeconds = 12 * 60; // 12 mins

  const shuffled = [...THEORY_QUESTIONS].sort(() => 0.5 - Math.random());
  state.mockQuestions = shuffled.slice(0, 10);

  $('mock-intro-box').style.display = 'none';
  $('mock-results-card').style.display = 'none';
  $('mock-active-card').style.display = 'flex';

  clearInterval(state.mockTimerInterval);
  state.mockTimerInterval = setInterval(() => {
    state.mockTimerSeconds--;
    if (state.mockTimerSeconds <= 0) {
      clearInterval(state.mockTimerInterval);
      finishMockExam();
    }
    updateMockTimerDisplay();
  }, 1000);
  updateMockTimerDisplay();

  renderMockQuestion();
}

function updateMockTimerDisplay() {
  const mins = Math.floor(state.mockTimerSeconds / 60);
  const secs = state.mockTimerSeconds % 60;
  $('mock-timer-display').textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function renderMockQuestion() {
  const q = state.mockQuestions[state.currentMockIdx];
  if (!q) return;

  $('mock-question-counter').textContent = `Question ${state.currentMockIdx + 1} of 10`;
  const pct = ((state.currentMockIdx + 1) / 10) * 100;
  $('mock-progress-bar').style.width = `${pct}%`;

  $('mock-q-text').textContent = q.question;

  const letters = ['A', 'B', 'C', 'D'];
  const chosenIdx = state.mockUserAnswers[state.currentMockIdx];

  const optionsList = $('mock-options-list');
  optionsList.innerHTML = q.options.map((opt, i) => `
    <button class="option-btn ${chosenIdx === i ? 'selected-correct' : ''}" data-mock-opt="${i}">
      <span class="option-letter">${letters[i]}</span>
      <span style="flex:1;">${opt}</span>
    </button>
  `).join('');

  optionsList.querySelectorAll('.option-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const optIdx = parseInt(btn.getAttribute('data-mock-opt'), 10);
      state.mockUserAnswers[state.currentMockIdx] = optIdx;
      renderMockQuestion();
    });
  });

  $('btn-mock-prev').disabled = state.currentMockIdx === 0;
  $('btn-mock-next').textContent = state.currentMockIdx === 9 ? 'Finish & Submit →' : 'Next →';
}

function finishMockExam() {
  clearInterval(state.mockTimerInterval);
  state.mockActive = false;

  let correctCount = 0;
  const topicBreakdown = {};

  state.mockQuestions.forEach((q, idx) => {
    const userChoice = state.mockUserAnswers[idx];
    const isCorrect = userChoice === q.correctIndex;
    if (isCorrect) correctCount++;

    if (!topicBreakdown[q.topic]) {
      topicBreakdown[q.topic] = { total: 0, correct: 0 };
    }
    topicBreakdown[q.topic].total++;
    if (isCorrect) topicBreakdown[q.topic].correct++;
  });

  $('mock-active-card').style.display = 'none';
  const resultsCard = $('mock-results-card');
  resultsCard.style.display = 'block';

  const isPass = correctCount >= 9; // F4b: Scaled pass mark 9 of 10 (90%)
  const badge = $('mock-result-badge');
  badge.textContent = isPass ? 'PASS (EXAM READY)' : 'NEEDS PRACTICE (RETAKE)';
  badge.className = `badge-tag ${isPass ? 'badge-live' : 'badge-alert'}`;

  const scoreEl = $('mock-result-score');
  scoreEl.textContent = `Score: ${correctCount} / 10`;
  scoreEl.style.color = isPass ? 'var(--emerald)' : 'var(--amber)';

  const subEl = $('mock-result-sub');
  subEl.textContent = isPass 
    ? 'Congratulations! You achieved the 9 / 10 pass mark on this scaled demo. Anamika Apu has been notified of your result.' 
    : 'Keep practicing! Review your answers below and try another mock.';

  // Render Topic breakdown list
  const listEl = $('mock-topic-breakdown-list');
  listEl.innerHTML = Object.keys(topicBreakdown).map(t => {
    const d = topicBreakdown[t];
    const pct = Math.round((d.correct / d.total) * 100);
    return `
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <span>${t}</span>
        <span style="font-weight:700; color:${pct >= 80 ? 'var(--emerald)' : 'var(--amber)'};">${d.correct}/${d.total} (${pct}%)</span>
      </div>
    `;
  }).join('');
}

// F4d: In-Place Mock Review Modal
function openMockReviewModal() {
  const container = $('mock-review-questions-container');
  const letters = ['A', 'B', 'C', 'D'];
  
  let correctCount = 0;
  state.mockQuestions.forEach((q, idx) => {
    if (state.mockUserAnswers[idx] === q.correctIndex) correctCount++;
  });
  $('mock-review-score-badge').textContent = `Score: ${correctCount} / 10`;

  container.innerHTML = state.mockQuestions.map((q, idx) => {
    const userChoice = state.mockUserAnswers[idx];
    const isCorrect = userChoice === q.correctIndex;

    return `
      <div class="card-surface" style="padding:12px; background:var(--bg-surface-elevated); border:1px solid var(--border-subtle);">
        <div style="display:flex; justify-content:space-between; align-items:center; font-size:11px; margin-bottom:6px;">
          <span style="font-weight:700; color:var(--text-sub);">MOCK QUESTION ${idx + 1} OF 10 · ${q.topic}</span>
          <span class="badge-tag ${isCorrect ? 'badge-live' : 'badge-alert'}">${isCorrect ? 'CORRECT' : 'INCORRECT'}</span>
        </div>

        <div style="font-weight:700; font-size:13.5px; color:#fff; line-height:1.4; margin-bottom:8px;">
          ${q.question}
        </div>

        <div class="options-list" style="margin-bottom:8px;">
          ${q.options.map((opt, i) => {
            let optClass = 'option-btn';
            if (i === q.correctIndex) optClass += ' selected-correct';
            else if (i === userChoice && !isCorrect) optClass += ' selected-wrong';
            return `
              <div class="${optClass}" style="cursor:default; min-height:38px; padding:8px 10px;">
                <span class="option-letter">${letters[i]}</span>
                <span style="flex:1; font-size:12px;">${opt}</span>
              </div>
            `;
          }).join('')}
        </div>

        <div style="background:rgba(0,0,0,0.4); border:1px solid var(--border-subtle); border-radius:6px; padding:10px;">
          <div class="bn-text" style="font-size:12px; color:#E2E8F0; line-height:1.5;">
            <strong>বাংলা ব্যাখ্যা:</strong> ${q.explanationBn}
          </div>
          <div class="sign-tip bn-text" style="color:var(--emerald); margin-top:4px;">
            💡 <strong>মনে রাখার টিপস:</strong> ${q.tip}
          </div>
        </div>
      </div>
    `;
  }).join('');

  $('modal-mock-review').classList.add('active');
}

// --- 7. ROAD SIGNS PACK (~30 INLINE VECTORS) ---
function initRoadSigns() {
  const categoryPills = document.querySelectorAll('#signs-category-strip .topic-pill');
  categoryPills.forEach(pill => {
    pill.addEventListener('click', () => {
      categoryPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      state.signsCategory = pill.getAttribute('data-signcat');
      renderRoadSigns();
    });
  });
}

function renderRoadSigns() {
  const container = $('signs-list-container');
  if (!container) return;

  const filtered = state.signsCategory === 'all'
    ? ROAD_SIGNS
    : ROAD_SIGNS.filter(s => s.category === state.signsCategory);

  container.innerHTML = filtered.map(sign => `
    <div class="sign-card">
      <div class="sign-svg-box">
        ${sign.svg}
      </div>
      <div class="sign-info-col">
        <div class="sign-en-name">${sign.nameEn}</div>
        <div class="sign-bn-name">${sign.nameBn}</div>
        <div class="sign-tip">${sign.tipBn}</div>
      </div>
    </div>
  `).join('');
}

// --- 8. HAZARD PERCEPTION SIMULATION (F4e & C2: Dynamic Timing Tiers) ---
let hazardStartTime = 0;

function resetHazardSimulation() {
  const feedback = $('hazard-score-feedback');
  if (feedback) {
    feedback.textContent = 'গাড়িটি কাছে এসে বাঁক নেওয়ার মুহূর্তে লাল বাটনে ক্লিক করুন!';
    feedback.style.color = 'var(--text-sub)';
  }
  hazardStartTime = Date.now() + 1800;
}

function initHazardSimulation() {
  const btnHazardTap = $('btn-hazard-tap');
  const feedback = $('hazard-score-feedback');

  resetHazardSimulation();

  if (btnHazardTap) {
    btnHazardTap.addEventListener('click', () => {
      const now = Date.now();
      const diff = (now - hazardStartTime) / 1000;

      if (diff < 0) {
        // C2: Warning without unverified official attribution
        feedback.innerHTML = `
          <span style="color:var(--amber);">⚠️ বিপদ শুরু হওয়ার আগেই ক্লিক করেছেন — সময়মতো ক্লিক করুন (০ পয়েন্ট)</span>
        `;
        return;
      }

      let points = 1;
      let msgBn = '';
      if (diff < 1.0) {
        points = 5;
        msgBn = '🎯 ৫ পয়েন্ট! নিখুঁত প্রতিক্রিয়া — বিপদ শুরুর প্রথম সেকেন্ডেই শনাক্ত করেছেন।';
      } else if (diff < 1.8) {
        points = 4;
        msgBn = '✓ ৪ পয়েন্ট! ভালো টাইমিং — বিপদ দৃশ্যমান হওয়ার সাথে সাথেই ক্লিক করেছেন।';
      } else if (diff < 2.6) {
        points = 3;
        msgBn = '⚠️ ৩ পয়েন্ট! সন্তোষজনক — তবে আরেকটু দ্রুত বিপদ চোখে পড়া দরকার।';
      } else if (diff < 3.4) {
        points = 2;
        msgBn = '⚠️ ২ পয়েন্ট! কিছুটা দেরিতে প্রতিক্রিয়া।';
      } else {
        points = 1;
        msgBn = '⚠️ ১ পয়েন্ট! অতি বিলম্বে প্রতিক্রিয়া।';
      }

      feedback.innerHTML = `
        <span style="font-size:16px;">🎯</span> <strong style="color:var(--emerald);">${points} OUT OF 5 POINTS!</strong><br>
        <span class="bn-text" style="font-size:12px; color:#E2E8F0;">${msgBn}</span>
      `;

      hazardStartTime = Date.now() + 2500;
    });
  }
}

// --- 9. TEACHER DASHBOARD (APU'S VIEW) ---
function initTeacherDashboard() {
  // Bound via renderTeacherRoster()
}

function renderTeacherRoster() {
  const container = $('teacher-roster-container');
  if (!container) return;

  container.innerHTML = STUDENTS_ROSTER.map(s => {
    let statusClass = 'status-ready';
    let badgeClass = 'badge-ready';
    if (s.status === 'alert') {
      statusClass = 'status-alert';
      badgeClass = 'badge-alert';
    } else if (s.status === 'warning') {
      statusClass = 'status-warning';
      badgeClass = 'badge-warn';
    }

    return `
      <div class="student-card-item ${statusClass}" data-student-id="${s.id}">
        <div class="student-row-top">
          <div class="student-name-col">
            <span class="student-name">${s.name}</span>
            <span class="student-location">${s.location}</span>
          </div>
          <span class="student-status-badge ${badgeClass}">${s.statusLabel}</span>
        </div>

        <div class="student-metrics-row">
          <div>Readiness: <strong style="color:var(--emerald);">${s.readiness}%</strong></div>
          <div>Last Mock: <strong>${s.lastMockScore}</strong></div>
          <div>Active: <span style="color:var(--text-sub);">${s.lastMockDate}</span></div>
        </div>

        <div class="student-action-btns">
          <button class="btn-nudge-whatsapp" data-nudge-id="${s.id}">
            <span>📲</span> WhatsApp Nudge
          </button>
          <button class="btn-view-student" data-view-id="${s.id}">
            <span>🔍</span> View Student
          </button>
        </div>
      </div>
    `;
  }).join('');

  // Attach event handlers
  container.querySelectorAll('.btn-nudge-whatsapp').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const sId = btn.getAttribute('data-nudge-id');
      const student = STUDENTS_ROSTER.find(item => item.id === sId);
      if (student) openWhatsAppNudgeModal(student);
    });
  });

  container.querySelectorAll('.btn-view-student').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const sId = btn.getAttribute('data-view-id');
      const student = STUDENTS_ROSTER.find(item => item.id === sId);
      if (student) openStudentDetailModal(student);
    });
  });
}

function renderTeacherCourses() {
  const container = $('teacher-courses-pipeline');
  if (!container) return;

  container.innerHTML = COURSES_PIPELINE.map(c => `
    <div class="card-surface" style="padding:12px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
        <span class="badge-tag ${c.badgeType === 'live' ? 'badge-live' : 'badge-upcoming'}">${c.badge}</span>
        <span style="font-size:11px; color:var(--text-muted); font-weight:700;">${c.enrolledText}</span>
      </div>
      <div style="font-family:var(--font-display); font-weight:700; font-size:14.5px; color:#fff;">${c.title}</div>
      <p style="font-size:12px; color:var(--text-sub); margin-top:2px;">${c.statusDescription}</p>
      <div style="font-size:11px; color:var(--emerald); font-weight:700; margin-top:4px;">${c.priceInfo}</div>
    </div>
  `).join('');
}

// --- 10. MODALS LOGIC ---
function initModalEvents() {
  // WhatsApp nudge modal
  const btnCloseNudge = $('btn-close-nudge-modal');
  const btnDismissNudge = $('btn-dismiss-nudge');
  if (btnCloseNudge) btnCloseNudge.addEventListener('click', () => $('modal-whatsapp-nudge').classList.remove('active'));
  if (btnDismissNudge) btnDismissNudge.addEventListener('click', () => $('modal-whatsapp-nudge').classList.remove('active'));

  // Student Detail modal
  const btnCloseStudent = $('btn-close-student-modal');
  const btnCloseStudentDetail = $('btn-close-student-detail');
  if (btnCloseStudent) btnCloseStudent.addEventListener('click', () => $('modal-student-drilldown').classList.remove('active'));
  if (btnCloseStudentDetail) btnCloseStudentDetail.addEventListener('click', () => $('modal-student-drilldown').classList.remove('active'));

  // Life in UK samples modal
  const btnCloseLifeUK = $('btn-close-lifeuk-modal');
  const btnCloseLifeUKSamples = $('btn-close-lifeuk-samples');
  if (btnCloseLifeUK) btnCloseLifeUK.addEventListener('click', () => {
    stopCurrentAudio();
    $('modal-lifeuk-samples').classList.remove('active');
  });
  if (btnCloseLifeUKSamples) btnCloseLifeUKSamples.addEventListener('click', () => {
    stopCurrentAudio();
    $('modal-lifeuk-samples').classList.remove('active');
  });

  // Visa English samples modal
  const btnCloseVisa = $('btn-close-visa-modal');
  const btnCloseVisaSamples = $('btn-close-visa-samples');
  if (btnCloseVisa) btnCloseVisa.addEventListener('click', () => $('modal-visa-samples').classList.remove('active'));
  if (btnCloseVisaSamples) btnCloseVisaSamples.addEventListener('click', () => $('modal-visa-samples').classList.remove('active'));

  // Mock Review modal (F4d)
  const btnCloseMockRev = $('btn-close-mock-review');
  const btnDismissMockRev = $('btn-dismiss-mock-review');
  if (btnCloseMockRev) btnCloseMockRev.addEventListener('click', () => $('modal-mock-review').classList.remove('active'));
  if (btnDismissMockRev) btnDismissMockRev.addEventListener('click', () => $('modal-mock-review').classList.remove('active'));
}

function openWhatsAppNudgeModal(student) {
  state.selectedStudentForNudge = student;
  $('nudge-student-name').textContent = student.name;

  const weakTopicStr = student.weakTopics.join(', ');
  const messageText = `Assalamu Alaikum ${student.name}! Anamika Apu here from PassKoro.\n\nI noticed you haven't taken a practice mock in ${student.daysInactive} days, and ${weakTopicStr} were a bit tricky last time. Let's do 10 quick questions before our live Saturday class (7:45 PM UK) so you stay in the green zone! 🚗💨\n\nTap here to practice: https://gro10x-ai.vercel.app/prototypes/passkoro/`;

  $('nudge-message-preview').innerHTML = messageText.replace(/\n/g, '<br>');

  const waLink = `https://wa.me/?text=${encodeURIComponent(messageText)}`;
  $('btn-trigger-wa-live').setAttribute('href', waLink);

  $('modal-whatsapp-nudge').classList.add('active');
}

function openStudentDetailModal(student) {
  state.selectedStudentForDetail = student;
  $('modal-student-name').textContent = student.name;
  $('modal-student-loc').textContent = student.location;
  $('modal-student-readiness').textContent = `${student.readiness}%`;
  $('modal-student-lastmock').textContent = student.lastMockScore;
  $('modal-student-weak').textContent = student.weakTopics.join(' · ');
  $('modal-student-notes').textContent = student.notes;

  $('modal-student-drilldown').classList.add('active');
}

// F2: Interactive Life in the UK Sample Cards with Working Audio
function openLifeUKSamplesModal() {
  renderLifeUKSamples();
  $('modal-lifeuk-samples').classList.add('active');
}

function renderLifeUKSamples() {
  const container = $('lifeuk-samples-container');
  const letters = ['A', 'B', 'C', 'D'];

  container.innerHTML = LIFE_IN_UK_SAMPLES.map((q, idx) => {
    const answeredIdx = state.lifeUKUserAnswers[q.id];
    const isAnswered = answeredIdx !== undefined;
    const isCorrect = isAnswered && answeredIdx === q.correctIndex;
    const isDrawerOpen = state.lifeUKDrawerOpen[q.id];
    const clipId = `liuk-0${idx + 1}`;
    const isAudioPlaying = currentAudio && currentAudioId === clipId && !currentAudio.paused;

    return `
      <div class="card-surface" style="padding:14px; background:var(--bg-surface-elevated); border:1px solid var(--border-subtle);">
        <div style="display:flex; justify-content:space-between; align-items:center; font-size:11px; color:var(--cyan); font-weight:700; margin-bottom:6px;">
          <span>SAMPLE ${idx + 1} OF 3</span>
          <span style="color:var(--text-sub);">${q.topic}</span>
        </div>

        <div style="font-weight:700; font-size:14px; color:#fff; line-height:1.4; margin-bottom:10px;">
          ${q.question}
        </div>

        <div class="options-list" style="margin-bottom:8px;">
          ${q.options.map((opt, i) => {
            let optClass = 'option-btn';
            if (isAnswered) {
              if (i === q.correctIndex) optClass += ' selected-correct';
              else if (i === answeredIdx) optClass += ' selected-wrong';
            }
            return `
              <button class="${optClass}" data-liuk-qid="${q.id}" data-liuk-opt="${i}">
                <span class="option-letter">${letters[i]}</span>
                <span style="flex:1;">${opt}</span>
              </button>
            `;
          }).join('')}
        </div>

        ${isAnswered ? `
          <div style="font-size:12px; font-weight:700; padding:6px 10px; border-radius:6px; margin-bottom:8px; background:${isCorrect ? 'rgba(0,223,137,0.15)' : 'rgba(239,68,68,0.15)'}; color:${isCorrect ? 'var(--emerald)' : 'var(--red)'};">
            ${isCorrect ? '✓ Correct! সঠিক উত্তর হয়েছে।' : '✕ Incorrect. সঠিক উত্তরটি চিহ্নিত করা হয়েছে।'}
          </div>
        ` : ''}

        <button class="bn-toggle-btn" data-liuk-toggle="${q.id}" style="width:100%; justify-content:center; padding:8px 12px; font-size:12.5px; min-height:38px;">
          <span>🔊</span> বাংলায় বুঝুন ও অডিও ${isDrawerOpen ? '▲' : '▼'}
        </button>

        <div class="explanation-drawer ${isDrawerOpen ? 'open' : ''}" id="liuk-drawer-${q.id}" style="margin-top:8px;">
          <div class="audio-demo-player">
            <button class="audio-play-pill ${isAudioPlaying ? 'is-playing' : ''}" data-liuk-audio="${clipId}">
              <span>${isAudioPlaying ? '⏸️' : '▶'}</span> ${isAudioPlaying ? 'থামুন (Pause)' : 'শুনুন (Helio Voice)'}
            </button>
            <div class="audio-wave-bars">
              <div class="wave-bar" style="animation-play-state:${isAudioPlaying ? 'running' : 'paused'}"></div>
              <div class="wave-bar" style="animation-play-state:${isAudioPlaying ? 'running' : 'paused'}"></div>
              <div class="wave-bar" style="animation-play-state:${isAudioPlaying ? 'running' : 'paused'}"></div>
              <div class="wave-bar" style="animation-play-state:${isAudioPlaying ? 'running' : 'paused'}"></div>
            </div>
            <span class="text-muted-sm" style="font-size:10px;">Bengali Voice Explanation</span>
          </div>

          <div class="bn-text" style="font-size:12.5px; color:#E2E8F0; margin-top:6px;">
            ${q.explanationBn}
          </div>

          <div class="sign-tip bn-text" style="color:var(--emerald); margin-top:4px;">
            💡 <strong>মনে রাখার টিপস:</strong> ${q.tip}
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Bind option clicks
  container.querySelectorAll('button[data-liuk-qid]').forEach(btn => {
    btn.addEventListener('click', () => {
      const qId = btn.getAttribute('data-liuk-qid');
      const optIdx = parseInt(btn.getAttribute('data-liuk-opt'), 10);
      state.lifeUKUserAnswers[qId] = optIdx;
      state.lifeUKDrawerOpen[qId] = true;
      renderLifeUKSamples();
    });
  });

  // Bind drawer toggle
  container.querySelectorAll('button[data-liuk-toggle]').forEach(btn => {
    btn.addEventListener('click', () => {
      const qId = btn.getAttribute('data-liuk-toggle');
      state.lifeUKDrawerOpen[qId] = !state.lifeUKDrawerOpen[qId];
      renderLifeUKSamples();
    });
  });

  // Bind audio button
  container.querySelectorAll('button[data-liuk-audio]').forEach(btn => {
    btn.addEventListener('click', () => {
      const clipId = btn.getAttribute('data-liuk-audio');
      const waveBox = btn.parentElement.querySelector('.audio-wave-bars');
      toggleAudio(clipId, btn, waveBox);
    });
  });
}

function openVisaSamplesModal() {
  const container = $('visa-samples-container');
  container.innerHTML = VISA_ENGLISH_PROMPTS.map((p) => `
    <div style="background:var(--bg-surface-elevated); padding:12px; border-radius:8px; border:1px solid var(--border-subtle);">
      <div style="font-size:10.5px; color:var(--cyan); font-weight:700; text-transform:uppercase;">${p.phase}</div>
      <div style="font-weight:700; font-size:14px; color:#fff; margin:4px 0 6px;">${p.title}</div>
      
      <div style="background:rgba(0,240,255,0.06); border-left:3px solid var(--cyan); padding:8px 10px; font-size:12.5px; margin-bottom:8px;">
        <strong>Examiner Prompt:</strong> "${p.examinerPrompt}"
      </div>

      ${p.sampleResponseEn ? `
        <div style="font-size:12px; color:#E2E8F0; margin-bottom:6px;">
          <strong>Model Spoken Response:</strong> "${p.sampleResponseEn}"
        </div>
      ` : ''}

      ${p.transcriptEn ? `
        <div style="font-size:12px; color:#CBD5E1; margin-bottom:6px; font-style:italic;">
          "${p.transcriptEn}"
        </div>
      ` : ''}

      <div class="bn-text" style="font-size:12px; color:var(--emerald); background:rgba(0,0,0,0.35); padding:8px; border-radius:6px;">
        <strong>বাংলা গাইড:</strong> ${p.explanationBn || p.comprehensionSummaryBn}
      </div>
    </div>
  `).join('');

  $('modal-visa-samples').classList.add('active');
}
