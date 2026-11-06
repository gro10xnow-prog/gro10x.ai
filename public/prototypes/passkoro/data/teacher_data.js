// PassKoro - Teacher Dashboard Data & Student Roster
// Grounded strictly in executive corrections Z1, Z2, Z3, Z5
// Author: Zarif Rahman (Rapid Prototyper, GRO10X Foundry Lab)

export const TEACHER_PROFILE = {
  name: "Anamika Apu",
  title: "Lead Theory & Life in the UK Instructor",
  center: "London & Sylhet Diaspora Hub",
  avatarUrl: "👩‍🏫"
};

export const CURRENT_BATCH = {
  batchId: "BATCH-NOV26",
  batchName: "November 2026 Driving Theory Cohort",
  capacity: "12/12 Students Enrolled (Cohort Full)",
  startDate: "1 November 2026",
  nextClass: {
    schedule: "Saturday · 7:45 PM UK", // Z1: No date, Apu alone
    instructor: "Anamika Apu (Solo)",
    topic: "Smart Motorways, High-Speed Roads & Red 'X' Enforcement",
    zoomLink: "https://zoom.us/j/demo-passkoro-anamika",
    duration: "90 Minutes"
  },
  metrics: {
    enrolledStudents: 12,
    mocksCompleted: 84,
    avgReadiness: 74,
    projectedIncomeGbp: 2400, // Z2: 12 x £200 = £2,400
    feePerStudent: 200,
    isSampleData: true
  }
};

export const STUDENTS_ROSTER = [
  {
    id: "std-01",
    name: "Tanvir Ahmed",
    location: "Tower Hamlets, London",
    readiness: 94,
    lastMockScore: "10/10",
    lastMockDate: "Today · 2:15 PM",
    daysInactive: 0,
    status: "ready", // ready, warning, alert
    statusLabel: "Exam Ready",
    weakTopics: ["Vehicle Handling"],
    mockHistory: [
      { date: "1 Nov", score: 8 },
      { date: "3 Nov", score: 9 },
      { date: "5 Nov", score: 10 }
    ],
    phone: "+44 7700 900142",
    notes: "Consistently scoring 90%+. Confident on smart motorway rules."
  },
  {
    id: "std-02",
    name: "Sultana Begum",
    location: "Newham, London",
    readiness: 58,
    lastMockScore: "6/10",
    lastMockDate: "4 days ago",
    daysInactive: 4,
    status: "alert",
    statusLabel: "At Risk",
    weakTopics: ["Road Signs & Markings", "Stopping Distances"],
    mockHistory: [
      { date: "28 Oct", score: 5 },
      { date: "1 Nov", score: 6 },
      { date: "2 Nov", score: 6 }
    ],
    phone: "+44 7700 900284",
    notes: "Struggling with triangular vs circular signs. Needs Bengali voice breakdown for stopping distance arithmetic."
  },
  {
    id: "std-03",
    name: "Nazmul Huda",
    location: "Oldham, Manchester",
    readiness: 62,
    lastMockScore: "7/10",
    lastMockDate: "3 days ago",
    daysInactive: 3,
    status: "warning",
    statusLabel: "Needs Practice",
    weakTopics: ["Safety Margins", "Motorway Rules"],
    mockHistory: [
      { date: "29 Oct", score: 6 },
      { date: "1 Nov", score: 6 },
      { date: "3 Nov", score: 7 }
    ],
    phone: "+44 7700 900391",
    notes: "Has improved from 50% to 70%. Needs reminder to take timed mock before Saturday."
  },
  {
    id: "std-04",
    name: "Farhana Kabir",
    location: "Luton, Bedfordshire",
    readiness: 88,
    lastMockScore: "9/10",
    lastMockDate: "Yesterday · 8:40 PM",
    daysInactive: 1,
    status: "ready",
    statusLabel: "On Track",
    weakTopics: ["Vulnerable Road Users"],
    mockHistory: [
      { date: "2 Nov", score: 8 },
      { date: "4 Nov", score: 9 },
      { date: "5 Nov", score: 9 }
    ],
    phone: "+44 7700 900415",
    notes: "Very consistent learner. Attends all Zoom Q&As."
  },
  {
    id: "std-05",
    name: "Rina Akter",
    location: "Birmingham",
    readiness: 46,
    lastMockScore: "5/10",
    lastMockDate: "5 days ago",
    daysInactive: 5,
    status: "alert",
    statusLabel: "At Risk",
    weakTopics: ["Hazard Awareness", "Alertness & Fatigue"],
    mockHistory: [
      { date: "26 Oct", score: 4 },
      { date: "30 Oct", score: 5 },
      { date: "1 Nov", score: 5 }
    ],
    phone: "+44 7700 900572",
    notes: "Missed last weekend class. Requested one-to-one revision in Sylheti on stopping distances."
  },
  {
    id: "std-06",
    name: "Mohammed Al-Amin",
    location: "Whitechapel, London",
    readiness: 79,
    lastMockScore: "8/10",
    lastMockDate: "Today · 11:10 AM",
    daysInactive: 0,
    status: "warning",
    statusLabel: "Improving",
    weakTopics: ["Road Signs (Prohibitory)"],
    mockHistory: [
      { date: "1 Nov", score: 7 },
      { date: "3 Nov", score: 7 },
      { date: "6 Nov", score: 8 }
    ],
    phone: "+44 7700 900681",
    notes: "Good progress. On verge of green tier."
  },
  {
    id: "std-07",
    name: "Jannat Ara",
    location: "Ilford, Essex",
    readiness: 92,
    lastMockScore: "10/10",
    lastMockDate: "Today · 9:30 AM",
    daysInactive: 0,
    status: "ready",
    statusLabel: "Exam Ready",
    weakTopics: ["None (Solid across all 8)"],
    mockHistory: [
      { date: "2 Nov", score: 9 },
      { date: "4 Nov", score: 9 },
      { date: "6 Nov", score: 10 }
    ],
    phone: "+44 7700 900799",
    notes: "Booked practical driving theory test for 24 November in Ilford."
  },
  {
    id: "std-08",
    name: "Shafiqur Rahman",
    location: "Bradford, Yorkshire",
    readiness: 65,
    lastMockScore: "7/10",
    lastMockDate: "Yesterday · 6:15 PM",
    daysInactive: 1,
    status: "warning",
    statusLabel: "Needs Practice",
    weakTopics: ["Smart Motorway Rules", "Emergency Refuge"],
    mockHistory: [
      { date: "30 Oct", score: 5 },
      { date: "2 Nov", score: 6 },
      { date: "5 Nov", score: 7 }
    ],
    phone: "+44 7700 900823",
    notes: "Practicing regularly on mobile. Needs to review red 'X' gantry laws."
  }
];

export const COURSES_PIPELINE = [
  {
    id: "crs-theory",
    title: "Driving Theory UK (Car)",
    badge: "Active Cohort · Live",
    badgeType: "live",
    enrolledText: "12 / 12 Enrolled (Full)",
    priceInfo: "£200 / student",
    statusDescription: "Running now: 4-week intensive with Anamika Apu. Zoom live Saturdays + daily bilingual mock tracking."
  },
  {
    id: "crs-life-in-uk",
    title: "Life in the UK Test (Citizenship)",
    badge: "Opens June 2027", // Z3: honest upcoming status
    badgeType: "upcoming",
    enrolledText: "Curriculum & Question Bank Mapped",
    priceInfo: "£250 / student (Projected)",
    statusDescription: "Next cohort launches June 2027. Full 24-chapter official syllabus explained in plain Bengali."
  },
  {
    id: "crs-visa-english",
    title: "Visa English (SELT B1 / A2)",
    badge: "Upcoming Course",
    badgeType: "upcoming",
    enrolledText: "Speaking & Listening Drill Sets Ready",
    priceInfo: "£200 / student (Projected)",
    statusDescription: "1-on-1 speaking prompts, audio examiner drills, and exam-day reassurance for Home Office visa requirements."
  }
];
