// PassKoro - 30 Vector UK Road Signs Pack
// Scalable crisp SVG vectors, Highway Code metadata, Bangla translations, and memory tips
// Author: Zarif Rahman (Rapid Prototyper, GRO10X Foundry Lab)

export const ROAD_SIGNS = [
  {
    id: "sign-01",
    category: "Prohibitory (Red Circle)",
    nameEn: "Maximum Speed Limit: 30 mph",
    nameBn: "সর্বোচ্চ গতিসীমা ৩০ মাইল/ঘণ্টা",
    tipBn: "লাল বৃত্ত মানে নিষেধ। ৩০ এর বেশি গতিতে গাড়ি চালানো সম্পূর্ণ বেআইনি।",
    svg: `<svg viewBox="0 0 100 100" class="sign-svg"><circle cx="50" cy="50" r="46" fill="#fff" stroke="#D32F2F" stroke-width="10"/><text x="50" y="62" font-family="'Space Grotesk', sans-serif" font-weight="900" font-size="38" text-anchor="middle" fill="#000">30</text></svg>`
  },
  {
    id: "sign-02",
    category: "Prohibitory (Red Circle)",
    nameEn: "Maximum Speed Limit: 20 mph",
    nameBn: "সর্বোচ্চ গতিসীমা ২০ মাইল/ঘণ্টা (আবাসিক জোন)",
    tipBn: "স্কুল বা আবাসিক এলাকায় পথচারীদের সুরক্ষায় এই গতিসীমা মানা বাধ্যতামূলক।",
    svg: `<svg viewBox="0 0 100 100" class="sign-svg"><circle cx="50" cy="50" r="46" fill="#fff" stroke="#D32F2F" stroke-width="10"/><text x="50" y="62" font-family="'Space Grotesk', sans-serif" font-weight="900" font-size="38" text-anchor="middle" fill="#000">20</text></svg>`
  },
  {
    id: "sign-03",
    category: "Prohibitory (Red Circle)",
    nameEn: "No Entry for Vehicular Traffic",
    nameBn: "সকল যানবাহনের প্রবেশ নিষেধ (No Entry)",
    tipBn: "একমুখী রাস্তা বা বের হওয়ার পথে থাকে। ভুল করেও গাড়ি নিয়ে ঢুকবেন না।",
    svg: `<svg viewBox="0 0 100 100" class="sign-svg"><circle cx="50" cy="50" r="48" fill="#D32F2F"/><rect x="14" y="42" width="72" height="16" rx="2" fill="#fff"/></svg>`
  },
  {
    id: "sign-04",
    category: "Priority (Special Shape)",
    nameEn: "STOP and Give Way",
    nameBn: "থামুন এবং অগ্রাধিকার দিন (STOP)",
    tipBn: "একমাত্র অষ্টভুজ সাইন। রাস্তা সম্পূর্ণ ফাঁকা থাকলেও গাড়ি সম্পূর্ণ থামাতেই হবে।",
    svg: `<svg viewBox="0 0 100 100" class="sign-svg"><polygon points="30,4 70,4 96,30 96,70 70,96 30,96 4,70 4,30" fill="#D32F2F" stroke="#fff" stroke-width="3"/><text x="50" y="62" font-family="'Space Grotesk', sans-serif" font-weight="900" font-size="28" text-anchor="middle" fill="#fff">STOP</text></svg>`
  },
  {
    id: "sign-05",
    category: "Priority (Special Shape)",
    nameEn: "Give Way to Traffic on Major Road",
    nameBn: "প্রধান রাস্তার ট্রাফিককে পথ দিন (Give Way)",
    tipBn: "উল্টো তিনকোনা সাইন। প্রধান রোডের ট্রাফিক পার না হওয়া পর্যন্ত অপেক্ষা করুন।",
    svg: `<svg viewBox="0 0 100 100" class="sign-svg"><polygon points="50,94 6,12 94,12" fill="#fff" stroke="#D32F2F" stroke-width="10"/><text x="50" y="38" font-family="'Space Grotesk', sans-serif" font-weight="800" font-size="12" text-anchor="middle" fill="#000">GIVE</text><text x="50" y="52" font-family="'Space Grotesk', sans-serif" font-weight="800" font-size="12" text-anchor="middle" fill="#000">WAY</text></svg>`
  },
  {
    id: "sign-06",
    category: "National Limit",
    nameEn: "National Speed Limit Applies",
    nameBn: "জাতীয় গতিসীমা প্রযোজ্য (National Speed Limit)",
    tipBn: "সিঙ্গেল ক্যারেজওয়েতে ৬০ mph, ডুয়েল ক্যারেজওয়ে ও মোটরওয়েতে ৭০ mph।",
    svg: `<svg viewBox="0 0 100 100" class="sign-svg"><circle cx="50" cy="50" r="46" fill="#fff" stroke="#333" stroke-width="2"/><line x1="84" y1="16" x2="16" y2="84" stroke="#000" stroke-width="12"/></svg>`
  },
  {
    id: "sign-07",
    category: "Prohibitory (Red Circle)",
    nameEn: "No Waiting / No Parking",
    nameBn: "পার্কিং বা অপেক্ষা করা নিষেধ (No Waiting)",
    tipBn: "একটি লাল দাগ মানে অপেক্ষা করা নিষেধ। বোর্ডে সময় উল্লেখ থাকে।",
    svg: `<svg viewBox="0 0 100 100" class="sign-svg"><circle cx="50" cy="50" r="46" fill="#1565C0" stroke="#D32F2F" stroke-width="10"/><line x1="18" y1="18" x2="82" y2="82" stroke="#D32F2F" stroke-width="10"/></svg>`
  },
  {
    id: "sign-08",
    category: "Prohibitory (Red Circle)",
    nameEn: "Clearway (No Stopping at Any Time)",
    nameBn: "ক্লিয়ারওয়ে: যেকোনো সময় গাড়ি থামানো সম্পূর্ণ নিষেধ",
    tipBn: "লাল ক্রস X মানে জরুরি অবস্থা ছাড়া ১ সেকেন্ডের জন্যও গাড়ি থামানো যাবে না।",
    svg: `<svg viewBox="0 0 100 100" class="sign-svg"><circle cx="50" cy="50" r="46" fill="#1565C0" stroke="#D32F2F" stroke-width="10"/><line x1="18" y1="18" x2="82" y2="82" stroke="#D32F2F" stroke-width="10"/><line x1="82" y1="18" x2="18" y2="82" stroke="#D32F2F" stroke-width="10"/></svg>`
  },
  {
    id: "sign-09",
    category: "Prohibitory (Red Circle)",
    nameEn: "No Right Turn",
    nameBn: "ডানে মোড় নেওয়া নিষেধ (No Right Turn)",
    tipBn: "জংশনে লাল ক্রসে কাটা তীর দেখলে ডানে মোড় নেওয়া যাবে না।",
    svg: `<svg viewBox="0 0 100 100" class="sign-svg"><circle cx="50" cy="50" r="46" fill="#fff" stroke="#D32F2F" stroke-width="10"/><path d="M42,75 L42,48 L58,48 L58,40 L72,52 L58,64 L58,56 L50,56 L50,75 Z" fill="#000"/><line x1="20" y1="20" x2="80" y2="80" stroke="#D32F2F" stroke-width="9"/></svg>`
  },
  {
    id: "sign-10",
    category: "Prohibitory (Red Circle)",
    nameEn: "No Left Turn",
    nameBn: "বামে মোড় নেওয়া নিষেধ (No Left Turn)",
    tipBn: "বামের তীর লাল দাগে কাটা থাকলে জংশনে বামে যাওয়া যাবে না।",
    svg: `<svg viewBox="0 0 100 100" class="sign-svg"><circle cx="50" cy="50" r="46" fill="#fff" stroke="#D32F2F" stroke-width="10"/><path d="M58,75 L58,48 L42,48 L42,40 L28,52 L42,64 L42,56 L50,56 L50,75 Z" fill="#000"/><line x1="20" y1="20" x2="80" y2="80" stroke="#D32F2F" stroke-width="9"/></svg>`
  },
  {
    id: "sign-11",
    category: "Prohibitory (Red Circle)",
    nameEn: "No U-Turns Allowed",
    nameBn: "ইউ-টার্ন করা সম্পূর্ণ নিষেধ (No U-Turn)",
    tipBn: "রাস্তায় গাড়ি ঘুরিয়ে বিপরীত দিকে যাওয়া আইনত নিষিদ্ধ।",
    svg: `<svg viewBox="0 0 100 100" class="sign-svg"><circle cx="50" cy="50" r="46" fill="#fff" stroke="#D32F2F" stroke-width="10"/><path d="M36,75 L36,46 C36,34 64,34 64,46 L64,56 L72,56 L60,70 L48,56 L56,56 L56,46 C56,40 44,40 44,46 L44,75 Z" fill="#000"/><line x1="20" y1="20" x2="80" y2="80" stroke="#D32F2F" stroke-width="9"/></svg>`
  },
  {
    id: "sign-12",
    category: "Prohibitory (Red Circle)",
    nameEn: "No Overtaking",
    nameBn: "ওভারটেকিং নিষেধ (No Overtaking)",
    tipBn: "লাল গাড়ি ওভারটেক করছে মানে এই রাস্তায় কাউকে ওভারটেক করা যাবে না।",
    svg: `<svg viewBox="0 0 100 100" class="sign-svg"><circle cx="50" cy="50" r="46" fill="#fff" stroke="#D32F2F" stroke-width="10"/><rect x="25" y="42" width="22" height="26" rx="4" fill="#D32F2F"/><rect x="53" y="42" width="22" height="26" rx="4" fill="#000"/></svg>`
  },
  {
    id: "sign-13",
    category: "Mandatory (Blue Circle)",
    nameEn: "Ahead Only",
    nameBn: "শুধু সোজা এগিয়ে যান (Ahead Only)",
    tipBn: "নীল বৃত্ত মানে বাধ্যতামূলক আদেশ। ডানে বা বামে মোড় নেওয়া যাবে না।",
    svg: `<svg viewBox="0 0 100 100" class="sign-svg"><circle cx="50" cy="50" r="48" fill="#1565C0"/><polygon points="50,18 68,44 56,44 56,82 44,82 44,44 32,44" fill="#fff"/></svg>`
  },
  {
    id: "sign-14",
    category: "Mandatory (Blue Circle)",
    nameEn: "Turn Left Ahead",
    nameBn: "সামনে অবশ্যই বামে মোড় নিন",
    tipBn: "নীল বৃত্তের সাদা বাঁকা তীর। সামনের মোড়ে বামে যেতেই হবে।",
    svg: `<svg viewBox="0 0 100 100" class="sign-svg"><circle cx="50" cy="50" r="48" fill="#1565C0"/><path d="M65,80 L65,55 C65,40 50,32 38,32 L38,20 L18,38 L38,56 L38,44 C45,44 53,48 53,55 L53,80 Z" fill="#fff"/></svg>`
  },
  {
    id: "sign-15",
    category: "Mandatory (Blue Circle)",
    nameEn: "Turn Right Ahead",
    nameBn: "সামনে অবশ্যই ডানে মোড় নিন",
    tipBn: "নীল বৃত্তের সাদা বাঁকা তীর। সামনের মোড়ে ডানে যেতেই হবে।",
    svg: `<svg viewBox="0 0 100 100" class="sign-svg"><circle cx="50" cy="50" r="48" fill="#1565C0"/><path d="M35,80 L35,55 C35,40 50,32 62,32 L62,20 L82,38 L62,56 L62,44 C55,44 47,48 47,55 L47,80 Z" fill="#fff"/></svg>`
  },
  {
    id: "sign-16",
    category: "Mandatory (Blue Circle)",
    nameEn: "Mini-Roundabout",
    nameBn: "মিনি-রাউন্ডঅ্যাবাউট (ডানের ট্রাফিককে পথ দিন)",
    tipBn: "তিনটি বৃত্তাকার তীর। ডান দিক থেকে আসা গাড়িকে পথ দিন।",
    svg: `<svg viewBox="0 0 100 100" class="sign-svg"><circle cx="50" cy="50" r="48" fill="#1565C0"/><path d="M50,22 A28,28 0 1,0 78,50 L70,44 L72,62 L90,60 L82,54 A38,38 0 1,1 50,12 Z" fill="#fff"/></svg>`
  },
  {
    id: "sign-17",
    category: "Warning (Red Triangle)",
    nameEn: "Pedestrian Crossing Ahead",
    nameBn: "সামনে পথচারী পারাপার (জেব্রা ক্রসিং)",
    tipBn: "তিনকোনা সতর্কতা সাইন। গতি কমিয়ে পথচারীদের পথ দিতে প্রস্তুত থাকুন।",
    svg: `<svg viewBox="0 0 100 100" class="sign-svg"><polygon points="50,8 6,90 94,90" fill="#fff" stroke="#D32F2F" stroke-width="10"/><circle cx="50" cy="42" r="6" fill="#000"/><path d="M48,50 L52,50 L56,66 L62,78 L54,80 L50,68 L46,80 L38,78 Z" fill="#000"/><rect x="30" y="82" width="40" height="4" fill="#000"/></svg>`
  },
  {
    id: "sign-18",
    category: "Warning (Red Triangle)",
    nameEn: "School Crossing Patrol / Children Ahead",
    nameBn: "স্কুল জোন: সামনে শিশুরা রাস্তা পার হতে পারে",
    tipBn: "স্কুল খোলার ও ছুটির সময় গতি ২০ এ নামিয়ে আনুন এবং চরম সতর্ক থাকুন।",
    svg: `<svg viewBox="0 0 100 100" class="sign-svg"><polygon points="50,8 6,90 94,90" fill="#fff" stroke="#D32F2F" stroke-width="10"/><circle cx="44" cy="38" r="5" fill="#000"/><path d="M40,46 L48,46 L46,72 L42,72 Z" fill="#000"/><circle cx="60" cy="48" r="4" fill="#000"/><path d="M56,54 L64,54 L62,74 L58,74 Z" fill="#000"/></svg>`
  },
  {
    id: "sign-19",
    category: "Warning (Red Triangle)",
    nameEn: "Crossroads Ahead",
    nameBn: "সামনে চাররাস্তার মোড় (Crossroads)",
    tipBn: "সামনে সমান অগ্রাধিকারের চাররাস্তা। ডান ও বাম উভয় দিক দেখে পার হোন।",
    svg: `<svg viewBox="0 0 100 100" class="sign-svg"><polygon points="50,8 6,90 94,90" fill="#fff" stroke="#D32F2F" stroke-width="10"/><rect x="46" y="38" width="8" height="42" fill="#000"/><rect x="30" y="55" width="40" height="8" fill="#000"/></svg>`
  },
  {
    id: "sign-20",
    category: "Warning (Red Triangle)",
    nameEn: "Traffic Signals Ahead",
    nameBn: "সামনে ট্রাফিক সিগন্যাল লাইট",
    tipBn: "দৃষ্টিসীমার বাইরে ট্রাফিক বাতি থাকলে এই সতর্কবার্তা দেওয়া হয়।",
    svg: `<svg viewBox="0 0 100 100" class="sign-svg"><polygon points="50,8 6,90 94,90" fill="#fff" stroke="#D32F2F" stroke-width="10"/><rect x="42" y="38" width="16" height="40" rx="3" fill="#000"/><circle cx="50" cy="45" r="4" fill="#D32F2F"/><circle cx="50" cy="58" r="4" fill="#FFA000"/><circle cx="50" cy="71" r="4" fill="#388E3C"/></svg>`
  },
  {
    id: "sign-21",
    category: "Warning (Red Triangle)",
    nameEn: "Roundabout Ahead",
    nameBn: "সামনে রাউন্ডঅ্যাবাউট (গোলচত্বর)",
    tipBn: "সামনে রাউন্ডঅ্যাবাউট আসছে। গতি কমিয়ে ডানের ট্রাফিকের জন্য প্রস্তুত হন।",
    svg: `<svg viewBox="0 0 100 100" class="sign-svg"><polygon points="50,8 6,90 94,90" fill="#fff" stroke="#D32F2F" stroke-width="10"/><circle cx="50" cy="58" r="16" fill="none" stroke="#000" stroke-width="5" stroke-dasharray="10,4"/></svg>`
  },
  {
    id: "sign-22",
    category: "Warning (Red Triangle)",
    nameEn: "Double Bend (First to Left)",
    nameBn: "সামনে দ্বিমুখী বিপজ্জনক বাঁক (প্রথমে বামে)",
    tipBn: "আঁকাবাঁকা রাস্তা। ওভারটেক করবেন না এবং গতি কমিয়ে নিয়ন্ত্রণে রাখুন।",
    svg: `<svg viewBox="0 0 100 100" class="sign-svg"><polygon points="50,8 6,90 94,90" fill="#fff" stroke="#D32F2F" stroke-width="10"/><path d="M50,40 L40,55 L58,68 L48,82" fill="none" stroke="#000" stroke-width="7" stroke-linecap="round"/></svg>`
  },
  {
    id: "sign-23",
    category: "Warning (Red Triangle)",
    nameEn: "Road Narrows on Both Sides",
    nameBn: "সামনে দুই পাশ থেকেই রাস্তা সরু হয়ে গেছে",
    tipBn: "রাস্তা সংকুচিত হচ্ছে। সামনের বড় গাড়িকে জায়গা দিতে প্রস্তুত থাকুন।",
    svg: `<svg viewBox="0 0 100 100" class="sign-svg"><polygon points="50,8 6,90 94,90" fill="#fff" stroke="#D32F2F" stroke-width="10"/><line x1="34" y1="82" x2="44" y2="40" stroke="#000" stroke-width="7"/><line x1="66" y1="82" x2="56" y2="40" stroke="#000" stroke-width="7"/></svg>`
  },
  {
    id: "sign-24",
    category: "Warning (Red Triangle)",
    nameEn: "Road Hump / Speed Cushion Ahead",
    nameBn: "সামনে স্পিড ব্রেকার / রোড হাম্প",
    tipBn: "গাড়ির নিচে ঘষা এড়াতে ও যাত্রীদের সুরক্ষায় গতি ২০ এর নিচে নামান।",
    svg: `<svg viewBox="0 0 100 100" class="sign-svg"><polygon points="50,8 6,90 94,90" fill="#fff" stroke="#D32F2F" stroke-width="10"/><path d="M26,72 L36,72 Q50,44 64,72 L74,72" fill="none" stroke="#000" stroke-width="6" stroke-linecap="round"/></svg>`
  },
  {
    id: "sign-25",
    category: "Warning (Red Triangle)",
    nameEn: "Slippery Road Surface Ahead",
    nameBn: "সামনে রাস্তা পিচ্ছিল (Slippery Road)",
    tipBn: "হঠাৎ ব্রেক চাপবেন না বা হঠাৎ স্টিয়ারিং ঘুরাবেন না। গিয়ার কমিয়ে ড্রাইভ করুন।",
    svg: `<svg viewBox="0 0 100 100" class="sign-svg"><polygon points="50,8 6,90 94,90" fill="#fff" stroke="#D32F2F" stroke-width="10"/><rect x="42" y="44" width="16" height="20" rx="3" fill="#000"/><path d="M36,78 Q42,70 48,78 Q54,84 62,76" fill="none" stroke="#000" stroke-width="4"/></svg>`
  },
  {
    id: "sign-26",
    category: "Warning (Red Triangle)",
    nameEn: "Steep Hill Downwards (10%)",
    nameBn: "সামনে খাড়া ঢালু রাস্তা নামছে (১০% ঢাল)",
    tipBn: "গাড়ির ব্রেক গরম হয়ে অকেজো হওয়া ঠেকাতে লোয়ার গিয়ার ব্যবহার করুন।",
    svg: `<svg viewBox="0 0 100 100" class="sign-svg"><polygon points="50,8 6,90 94,90" fill="#fff" stroke="#D32F2F" stroke-width="10"/><polygon points="30,55 70,78 30,78" fill="#000"/><text x="40" y="70" font-family="'Space Grotesk', sans-serif" font-weight="900" font-size="10" fill="#fff">10%</text></svg>`
  },
  {
    id: "sign-27",
    category: "Information (Blue Rectangle)",
    nameEn: "Motorway Begins",
    nameBn: "মোটরওয়ে শুরু (Motorway Regulations Apply)",
    tipBn: "মোটরওয়ে শুরু। লার্নার ড্রাইভার (ইনস্ট্রাক্টর ছাড়া), পথচারী ও সাইকেল প্রবেশ নিষেধ।",
    svg: `<svg viewBox="0 0 100 100" class="sign-svg"><rect x="10" y="10" width="80" height="80" rx="6" fill="#1565C0"/><line x1="28" y1="80" x2="36" y2="20" stroke="#fff" stroke-width="6"/><line x1="72" y1="80" x2="64" y2="20" stroke="#fff" stroke-width="6"/><rect x="22" y="44" width="56" height="8" fill="#fff"/></svg>`
  },
  {
    id: "sign-28",
    category: "Information (Blue Rectangle)",
    nameEn: "Emergency Refuge Area (ERA)",
    nameBn: "ইমার্জেন্সি রিফিউজ এরিয়া (স্মার্ট মোটরওয়ে)",
    tipBn: "হার্ড শোল্ডার ছাড়া মোটরওয়েতে গাড়ি নষ্ট হলে এখানে ঢুকে কমলা এসওএস ফোন নিন।",
    svg: `<svg viewBox="0 0 100 100" class="sign-svg"><rect x="10" y="10" width="80" height="80" rx="6" fill="#1565C0"/><rect x="24" y="24" width="52" height="52" rx="4" fill="#FF6D00"/><text x="50" y="58" font-family="'Space Grotesk', sans-serif" font-weight="900" font-size="20" text-anchor="middle" fill="#fff">SOS</text></svg>`
  },
  {
    id: "sign-29",
    category: "Information (Blue Rectangle)",
    nameEn: "With-Flow Bus Lane",
    nameBn: "বাস লেন (নির্ধারিত সময়ে অন্যান্য গাড়ির প্রবেশ নিষেধ)",
    tipBn: "সাইনে উল্লেখিত সময়ে প্রাইভেট কার বাস লেনে ঢুকলে সিসিটিভি ক্যামেরায় জরিমানা হবে।",
    svg: `<svg viewBox="0 0 100 100" class="sign-svg"><rect x="10" y="10" width="80" height="80" rx="6" fill="#1565C0"/><rect x="25" y="32" width="50" height="26" rx="4" fill="#fff"/><circle cx="36" cy="62" r="5" fill="#1565C0"/><circle cx="64" cy="62" r="5" fill="#1565C0"/></svg>`
  },
  {
    id: "sign-30",
    category: "Information (Blue Rectangle)",
    nameEn: "One-Way Street",
    nameBn: "একমুখী রাস্তা (One-Way Street)",
    tipBn: "রাস্তায় সব গাড়ি একই দিকে চলছে। উল্টো দিক থেকে কোনো গাড়ি আসবে না।",
    svg: `<svg viewBox="0 0 100 100" class="sign-svg"><rect x="15" y="10" width="70" height="80" rx="6" fill="#1565C0"/><polygon points="50,22 66,45 56,45 56,76 44,76 44,45 34,45" fill="#fff"/></svg>`
  }
];
