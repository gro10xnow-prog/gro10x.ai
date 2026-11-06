// PassKoro - 40 Original DVSA-Style UK Driving Theory Questions
// Strictly original scenarios grounded in the UK Highway Code (Zero Crown Copyright text)
// Author: Zarif Rahman (Rapid Prototyper, GRO10X Foundry Lab)

export const THEORY_TOPICS = [
  "All Topics",
  "Alertness",
  "Road Signs & Markings",
  "Safety Margins",
  "Hazard Awareness",
  "Motorway Rules",
  "Rules of the Road",
  "Vehicle Handling",
  "Incidents & Documents"
];

export const THEORY_QUESTIONS = [
  // --- TOPIC 1: ALERTNESS (5 Questions) ---
  {
    id: "th-01",
    topic: "Alertness",
    question: "You are driving on a quiet motorway late at night and your eyes begin to feel heavy. What must you do?",
    options: [
      "Open your driver window and turn on loud radio music",
      "Pull up on the hard shoulder immediately and take a 10-minute nap",
      "Leave the motorway at the next exit and find a safe, legal parking spot to rest",
      "Increase your vehicle speed so you reach home before falling asleep"
    ],
    correctIndex: 2,
    explanationEn: "Never attempt to fight severe tiredness while driving. Hard shoulders are strictly for breakdowns and emergencies. You must exit the motorway, park safely, drink a caffeinated drink, and take a minimum 15-minute nap.",
    explanationBn: "গাড়ি চালানোর সময় ঘুম ঘুম বা চোখের পাতা ভারী লাগলে কখনোই তা অবহেলা করবেন না। মোটরওয়ের হার্ড শোল্ডারে শুধু ইমার্জেন্সি ছাড়া ঘুমানো নিষেধ। পরবর্তী এক্সিট দিয়ে বের হয়ে নিরাপদ কোনো পার্কিংয়ে যান, চা/কফি খান এবং অন্তত ১৫ মিনিট ঘুমিয়ে নিন।",
    tip: "নিয়ম: ঘুম পেলে এক্সিট নিয়ে নিরাপদ জায়গায় ১৫ মিনিট বিশ্রাম।"
  },
  {
    id: "th-02",
    topic: "Alertness",
    question: "You need to answer an urgent mobile phone call while driving. When is it legally permitted to hold and use your phone?",
    options: [
      "Only when your vehicle is stationary at red traffic lights",
      "Only in a genuine emergency when calling 999 or 112 and it is unsafe to stop",
      "Whenever you are driving below 20 mph in a residential zone",
      "If you keep one hand firmly on the steering wheel"
    ],
    correctIndex: 1,
    explanationEn: "Under UK law, holding a handheld mobile phone while driving is strictly illegal—even when stopped at traffic lights or queued in traffic. The only exception is making a 999 or 112 call in an emergency where stopping is unsafe.",
    explanationBn: "যুক্তরাজ্যের আইনে গাড়ি চালানোর সময় হাতে মোবাইল ধরা সম্পূর্ণ বেআইনি—এমনকি ট্রাফিক সিগন্যালে গাড়ি থামানো থাকলেও ধরা যাবে না। একমাত্র ব্যতিক্রম: যদি জরুরি বিপদে ৯৯৯ বা ১১২ এ কল করতে হয় এবং গাড়ি থামানো অনিরাপদ হয়।",
    tip: "মনে রাখুন: ট্রাফিকে দাঁড়ানো থাকলেও ফোন হাতে নিলে ৬ পয়েন্ট পেনাল্টি ও £200 জরিমানা।"
  },
  {
    id: "th-03",
    topic: "Alertness",
    question: "What should you do before making a U-turn in a two-way street?",
    options: [
      "Give an arm signal out of the window to stop oncoming cars",
      "Look over your shoulders and check all blind spots thoroughly",
      "Flash your headlights twice and accelerate quickly",
      "Engage your hazard warning lights before starting the turn"
    ],
    correctIndex: 1,
    explanationEn: "Before carrying out any turn or manoeuvre across a carriageway, you must look around thoroughly and check all blind spots to ensure no cyclists, motorcyclists, or pedestrians are approaching.",
    explanationBn: "রাস্তায় গাড়ি ইউ-টার্ন (U-turn) করার আগে শুধু লুকিং গ্লাসে তাকানো যথেষ্ট নয়। আপনার ঘাড় ঘুরিয়ে চারপাশের ব্লাইন্ড স্পট (Blind spots) পরীক্ষা করতে হবে, যাতে কোনো পথচারী বা সাইকেল চালক আড়ালে না থাকে।",
    tip: "টিপস: ম্যানুভার করার আগে অবশ্যই অন্ধ-বিন্দু (Blind spot) চেক করুন।"
  },
  {
    id: "th-04",
    topic: "Alertness",
    question: "Why should you be especially cautious when overtaking a large goods vehicle (HGV) in heavy rain?",
    options: [
      "The vehicle's engine noise will drown out your horn",
      "Heavy spray from the lorry's tyres will severely reduce your visibility",
      "The lorry driver will speed up to protect their lane",
      "Your vehicle's braking distance will decrease automatically"
    ],
    correctIndex: 1,
    explanationEn: "Large HGVs produce massive spray off their tyres on wet roads. This water spray can momentarily blind your windscreen, making lane positioning and seeing brake lights ahead difficult.",
    explanationBn: "ভারী বৃষ্টির দিনে বড় লরি বা ট্রাককে ওভারটেক করার সময় তাদের চাকা থেকে প্রচুর পানির ছিটা (Water spray) ছিটকে আসে। এতে আপনার উইন্ডস্ক্রিনের সামনের সবকিছু এক মুহূর্তের জন্য ঝাপসা হয়ে যেতে পারে।",
    tip: "বৃষ্টিতে লরি পার হওয়ার আগে ওয়াইপার ফুল স্পিডে দিন ও নিরাপদ দূরত্ব রাখুন।"
  },
  {
    id: "th-05",
    topic: "Alertness",
    question: "You have just passed your practical driving test. What is the probationary period under the New Drivers Act?",
    options: [
      "12 months",
      "2 years",
      "3 years",
      "5 years"
    ],
    correctIndex: 1,
    explanationEn: "Under the Road Traffic (New Drivers) Act, your driving licence will be revoked if you accumulate 6 or more penalty points within 2 years of passing your first practical test.",
    explanationBn: "ড্রাইভিং টেস্ট পাস করার পর প্রথম ২ বছর হলো প্রবেশনারি পিরিয়ড (New Drivers Act)। এই ২ বছরের মধ্যে মোট ৬ বা তার বেশি পেনাল্টি পয়েন্ট পেলে আপনার লাইসেন্স বাতিল হয়ে যাবে এবং আবার পরীক্ষা দিতে হবে।",
    tip: "২ বছরের মধ্যে ৬ পয়েন্ট = লাইসেন্স বাতিল।"
  },

  // --- TOPIC 2: ROAD SIGNS & MARKINGS (6 Questions) ---
  {
    id: "th-06",
    topic: "Road Signs & Markings",
    question: "What is the primary meaning of a circular road sign with a red border?",
    options: [
      "It gives positive instruction or mandatory action",
      "It tells you what you MUST NOT do (prohibition)",
      "It provides tourist and route information",
      "It indicates an upcoming steep hill hazard"
    ],
    correctIndex: 1,
    explanationEn: "In the UK Highway Code, red circles are prohibitory orders—they tell road users what they must not do (e.g. maximum speed limit, no entry, no overtaking). Blue circles give positive mandatory orders.",
    explanationBn: "যুক্তরাজ্যের ট্রাফিক নিয়মে লাল বর্ডারের গোল সাইন মানেই কোনো কিছু করা নিষেধ (Prohibitory)। যেমন: সর্বোচ্চ গতিসীমা, প্রবেশ নিষেধ। আর নীল রঙের গোল সাইন মানে আপনাকে কাজটি অবশ্যই করতে হবে।",
    tip: "লাল গোল = নিষেধ (Don't do it) · নীল গোল = আদেশ (Must do it)।"
  },
  {
    id: "th-07",
    topic: "Road Signs & Markings",
    question: "When are you permitted to stop on zig-zag road markings alongside a zebra crossing?",
    options: [
      "Only for a few seconds to let a passenger drop off quickly",
      "Never, stopping or overtaking on zig-zag lines is strictly prohibited",
      "Only between 7:00 PM and 7:00 AM on weekdays",
      "If you leave your vehicle hazard warning flashers on"
    ],
    correctIndex: 1,
    explanationEn: "White zig-zag markings near pedestrian crossings are zero-tolerance zones. You must NEVER park, wait, or overtake the moving or stationary vehicle nearest the crossing, as this blocks pedestrians' view of approaching traffic.",
    explanationBn: "জেব্রা ক্রসিংয়ের দুই পাশের সাদা আঁকাবাঁকা (Zig-zag) দাগের উপর গাড়ি থামানো, যাত্রী নামানো বা ওভারটেক করা কঠোরভাবে নিষেধ। কারণ এটি পথচারীর দৃষ্টি আটকে দেয় এবং মারাত্মক দুর্ঘটনার ঝুঁকি তৈরি করে।",
    tip: "জিগ-জ্যাগ লাইন = নো স্টপিং, নো ওভারটেকিং (কখনোই না)।"
  },
  {
    id: "th-08",
    topic: "Road Signs & Markings",
    question: "You approach a yellow box junction with criss-cross lines. When may you enter and wait in the box?",
    options: [
      "Whenever you are turning left into a side street",
      "Only when you wish to turn right and are prevented from turning solely by oncoming traffic",
      "Whenever the vehicle ahead of you has entered the box",
      "At any time if traffic lights are green"
    ],
    correctIndex: 1,
    explanationEn: "You must NOT enter the yellow box junction unless your exit road is clear. The only legal exception is when you are turning right and are waiting only for oncoming traffic or other right-turning vehicles to clear.",
    explanationBn: "হলুদ বক্স জংশনে (Yellow Box) আপনার বের হওয়ার রাস্তা খালি না থাকলে ঢোকা নিষেধ। তবে একটিমাত্র ব্যতিক্রম: আপনি যদি ডানে (Right turn) ঘুরতে চান এবং শুধুমাত্র সামনের দিক থেকে আসা গাড়ির কারণে আটকে থাকেন, তবে বক্সে ঢুকে অপেক্ষা করতে পারবেন।",
    tip: "বক্স জংশন নিয়ম: ডানে মোড় নেওয়ার সময় সামনে গাড়ি থাকলে ঢোকা যাবে, সোজা যেতে রাস্তা খালি থাকা চাই।"
  },
  {
    id: "th-09",
    topic: "Road Signs & Markings",
    question: "What does a triangular road sign facing upward (apex pointing up) indicate to drivers?",
    options: [
      "A mandatory command",
      "A warning of potential danger ahead",
      "A motorway entry slip road",
      "A national speed limit zone"
    ],
    correctIndex: 1,
    explanationEn: "Triangular signs pointing upwards give warnings of hazards or road conditions ahead (e.g. sharp bend, pedestrian crossing, crossroads).",
    explanationBn: "উপরের দিকে মুখ করা তিনকোনা (ত্রিকোণ) ট্রাফিক সাইন সবসময় সামনের কোনো সম্ভাব্য বিপদের সতর্কতা (Warning) নির্দেশ করে। যেমন: বাঁক, পথচারী পারাপার বা স্কুল জোন।",
    tip: "তিনকোনা সাইন = সামনে বিপদ বা সতর্কতা (Warning)।"
  },
  {
    id: "th-10",
    topic: "Road Signs & Markings",
    question: "You see double white lines along the centre of the road where the line closest to you is broken (dashed). What does this mean?",
    options: [
      "You may cross the lines to overtake if it is safe and can complete it before the line becomes solid",
      "You are entering a 20 mph zone",
      "Neither side of the road is permitted to overtake under any circumstances",
      "The lane is reserved for high-occupancy vehicles only"
    ],
    correctIndex: 0,
    explanationEn: "When double white lines separate lanes and the line nearest to your side is broken, you may cross or straddle it to overtake if it is safe and your manoeuvre finishes before the line turns continuous solid.",
    explanationBn: "রাস্তার মাঝখানের দুটি সাদা লাইনের মধ্যে আপনার দিকের লাইনটি যদি কাটা কাটা (Dashed) হয়, তবে রাস্তা পরিষ্কার ও নিরাপদ থাকলে আপনি ওভারটেক করতে পারবেন। তবে আপনার দিকের দাগ শক্ত (Solid) হলে পার হওয়া নিষেধ।",
    tip: "আপনার দিকে কাটা দাগ = ওভারটেক করা যাবে যদি নিরাপদ হয়।"
  },
  {
    id: "th-11",
    topic: "Road Signs & Markings",
    question: "What does a circular sign displaying a white background with a single black diagonal stripe mean?",
    options: [
      "No entry for motor vehicles",
      "National speed limit applies",
      "Road closed ahead due to roadworks",
      "End of priority route"
    ],
    correctIndex: 1,
    explanationEn: "A white circular sign with a diagonal black stripe signifies the National Speed Limit. For cars, this is 60 mph on single carriageways and 70 mph on dual carriageways and motorways (unless street lighting implies 30 mph).",
    explanationBn: "সাদা গোল সাইনের ওপর একটি কালো কোণাকুণি দাগ মানে 'National Speed Limit'। সাধারণ গাড়ির জন্য এর অর্থ: সিঙ্গেল ক্যারেজওয়েতে ৬০ মাইল এবং ডুয়েল ক্যারেজওয়ে বা মোটরওয়েতে ৭০ মাইল প্রতি ঘণ্টা।",
    tip: "সাদা গোলে কালো দাগ = ন্যাশনাল স্পিড লিমিট (Single: 60, Dual: 70)।"
  },

  // --- TOPIC 3: SAFETY MARGINS & STOPPING DISTANCES (5 Questions) ---
  {
    id: "th-12",
    topic: "Safety Margins",
    question: "In dry conditions on a high-speed road, what is the minimum safe following time behind the vehicle ahead?",
    options: [
      "1 second",
      "2 seconds",
      "4 seconds",
      "10 seconds"
    ],
    correctIndex: 1,
    explanationEn: "In dry conditions, you must maintain at least a two-second separation gap between your car and the vehicle in front (the 'two-second rule'). Use a stationary roadside object to count: 'Only a fool breaks the two-second rule'.",
    explanationBn: "শুকনো রাস্তায় সামনের গাড়ি থেকে আপনার ন্যূনতম ২ সেকেন্ডের দূরত্ব (2-second rule) বজায় রাখতে হবে। সামনের গাড়ি কোনো ল্যাম্পপোস্ট পার হলে গুনবেন: এক হাজার এক, এক হাজার দুই। এর আগে আপনি পার হলে দূরত্ব কম আছে।",
    tip: "শুকনো রাস্তা = ২ সেকেন্ড গ্যাপ · ভেজা রাস্তা = দ্বিগুণ (৪ সেকেন্ড)।"
  },
  {
    id: "th-13",
    topic: "Safety Margins",
    question: "When driving on wet or rain-soaked roads, how does your overall stopping distance change compared to dry conditions?",
    options: [
      "It stays approximately the same if you have anti-lock brakes (ABS)",
      "It is doubled (up to twice as long)",
      "It is ten times longer",
      "It decreases because tyres cool faster"
    ],
    correctIndex: 1,
    explanationEn: "Wet roads offer substantially less tyre grip. In wet weather, your total stopping distance will be at least DOUBLE that of dry conditions. On icy roads, it can be up to TEN times longer.",
    explanationBn: "রাস্তা ভেজা থাকলে গাড়ির টায়ারের গ্রিপ কমে যায়। ফলে গাড়ি থামার মোট দূরত্ব (Stopping distance) শুকনো রাস্তার তুলনায় অন্তত দ্বিগুণ (২ গুণ) বেড়ে যায়। বরফে তা ১০ গুণ পর্যন্ত বাড়ে।",
    tip: "বৃষ্টি/ভেজা রাস্তা = ২ গুণ দূরত্ব · বরফ/আইসি রাস্তা = ১০ গুণ দূরত্ব।"
  },
  {
    id: "th-14",
    topic: "Safety Margins",
    question: "What is the typical overall stopping distance for a car travelling at 50 mph in good, dry conditions?",
    options: [
      "23 metres (75 feet)",
      "36 metres (118 feet)",
      "53 metres (175 feet)",
      "96 metres (315 feet)"
    ],
    correctIndex: 2,
    explanationEn: "At 50 mph, thinking distance is 15 metres (50 feet) and braking distance is 38 metres (125 feet), giving a total stopping distance of 53 metres (175 feet), which is roughly 13 car lengths.",
    explanationBn: "৫০ মাইল গতিতে শুকনো রাস্তায় একটি গাড়ি সম্পূর্ণ থামতে মোট ৫৩ মিটার (১৭৫ ফুট বা প্রায় ১৩টি গাড়ির দৈর্ঘ্য) দূরত্ব প্রয়োজন হয়। এর মধ্যে ১৫ মিটার চিন্তা করার সময় পার হয় এবং বাকি ৩৮ মিটার ব্রেক করার পর।",
    tip: "৫০ mph গতি = ৫৩ মিটার থামার দূরত্ব (১৩টি গাড়ির সমান)।"
  },
  {
    id: "th-15",
    topic: "Safety Margins",
    question: "What causes a vehicle to 'aquaplane' on a flooded or wet road?",
    options: [
      "The brake discs locking up prematurely",
      "A layer of water building up between the tyres and road surface, causing complete loss of steering control",
      "Low engine oil pressure in cold rain",
      "Overinflated rear shock absorbers"
    ],
    correctIndex: 1,
    explanationEn: "Aquaplaning occurs when tyres can no longer displace water fast enough, riding up on a film of water. Steering becomes light and ineffective. Do NOT brake violently; ease off the accelerator gently until tyres regain grip.",
    explanationBn: "একোয়াপ্লেনিং (Aquaplaning) হয় যখন চাকা এবং রাস্তার মাঝে পানির আস্তরণ জমে এবং টায়ার রাস্তা থেকে গ্রিপ হারিয়ে ফেলে। স্টিয়ারিং একদম হালকা হয়ে যায়। এই অবস্থায় হঠাৎ ব্রেক চাপবেন না, আলতো করে এক্সিলারেটর থেকে পা সরিয়ে নিন।",
    tip: "একোয়াপ্লেনিং হলে হঠাৎ ব্রেক নয়, এক্সিলারেটর থেকে ধীরে পা তুলুন।"
  },
  {
    id: "th-16",
    topic: "Safety Margins",
    question: "You are being closely tailgated by an impatient driver on a single carriageway. What should you do?",
    options: [
      "Tap your brake pedal repeatedly to warn the driver to back off",
      "Gradually ease your speed and increase your following distance to the vehicle ahead",
      "Accelerate up to 10 mph over the speed limit to widen the gap",
      "Switch on your rear fog lights to dazzle them"
    ],
    correctIndex: 1,
    explanationEn: "If a vehicle tailgates you dangerously, never brake-test or retaliate. Gently increase your own separation distance from any car in front so that if you must stop, you can brake smoothly without the tailgater crashing into you.",
    explanationBn: "পেছনের গাড়ি যদি খুব কাছে এসে চাপ দেয় (Tailgating), তবে কখনোই হঠাৎ ব্রেক চাপবেন না বা রাগ দেখাবেন না। আপনার সামনের গাড়ি থেকে নিজের দূরত্ব একটু বাড়িয়ে নিন, যাতে জরুরি মুহূর্তে আপনাকে ধীরে ব্রেক করতে সুবিধা হয়।",
    tip: "পেছনে কেউ চাপ দিলে সামনের গাড়ি থেকে নিজের দূরত্ব বাড়িয়ে নিন।"
  },

  // --- TOPIC 4: HAZARD AWARENESS & VULNERABLE USERS (6 Questions) ---
  {
    id: "th-17",
    topic: "Hazard Awareness",
    question: "You approach a pedestrian crossing with flashing amber twin beacons (Pelican crossing). The lights switch to flashing amber. What should you do?",
    options: [
      "Proceed immediately because flashing amber gives vehicles priority",
      "Give way to any pedestrians already crossing on the road; proceed only if the crossing is completely clear",
      "Stop and wait until the light turns solid green regardless of pedestrians",
      "Sound your horn to hurry pedestrians along"
    ],
    correctIndex: 1,
    explanationEn: "At a Pelican crossing, the flashing amber light means you must give way to any pedestrians who are already on the crossing. If the crossing is clear, you may proceed without waiting for green.",
    explanationBn: "পেলিকান ক্রসিংয়ে (Pelican crossing) হলুদ বাতি ফ্ল্যাশ করলে যদি কোনো পথচারী এখনও রাস্তায় থাকে, তবে তাকে পার হতে দিতে হবে। রাস্তা সম্পূর্ণ পরিষ্কার থাকলে সবুজ বাতির অপেক্ষা না করেই আপনি যেতে পারবেন।",
    tip: "ফ্ল্যাশিং অ্যাম্বার = পথচারী থাকলে থামুন, পরিষ্কার থাকলে এগিয়ে যান।"
  },
  {
    id: "th-18",
    topic: "Hazard Awareness",
    question: "Why should you allow extra room when passing a cyclist on a windy day?",
    options: [
      "Cyclists travel at much higher speeds in windy conditions",
      "Sudden gusts of wind could blow the cyclist off balance and into your path",
      "Bicycles produce heavy crosswind turbulence for cars",
      "Cyclists cannot hear engine sounds in high wind"
    ],
    correctIndex: 1,
    explanationEn: "Wind gusts can push a cyclist sideways into traffic without warning. Give cyclists at least 1.5 metres of clearance at speeds up to 30 mph, and more space at higher speeds or in windy conditions.",
    explanationBn: "বাতাসের দিনে সাইকেল চালককে ওভারটেক করার সময় বাড়তি জায়গা (অন্তত ১.৫ মিটার) দিন। কারণ বাতাসের আকস্মিক ঝাপটায় সাইকেল চালক ভারসাম্য হারিয়ে আপনার গাড়ির সামনে চলে আসতে পারেন।",
    tip: "সাইকেল পার হতে অন্তত ১.৫ মিটার ফাঁকা জায়গা রাখুন।"
  },
  {
    id: "th-19",
    topic: "Hazard Awareness",
    question: "What hazard should you anticipate when driving past a row of parked cars on your left?",
    options: [
      "Car doors suddenly opening or children stepping out into the road without looking",
      "Parked cars suddenly turning their headlights on high beam",
      "Tyres on parked cars bursting due to heat",
      "Road signs falling off poles"
    ],
    correctIndex: 0,
    explanationEn: "Parked cars conceal pedestrians, especially children, and drivers or passengers may swing doors open directly into your path. Look for exhaust fumes, turned front wheels, or heads inside parked cars.",
    explanationBn: "রাস্তার পাশে সারিবদ্ধ পার্ক করা গাড়ির পাশ দিয়ে যাওয়ার সময় সাবধান থাকুন—হঠাৎ করে গাড়ির দরজা খুলে যেতে পারে বা কোনো শিশু দৌড় দিয়ে রাস্তায় চলে আসতে পারে। গাড়ির চাকা বাঁকা আছে কিনা বা ভেতরে মানুষ আছে কিনা খেয়াল রাখুন।",
    tip: "পার্ক করা গাড়ি = হঠাৎ দরজা খোলা বা শিশু বের হওয়ার ঝুঁকি।"
  },
  {
    id: "th-20",
    topic: "Hazard Awareness",
    question: "You see horse riders ahead on a country road. How should you overtake them safely?",
    options: [
      "Sound your horn gently to notify the horse of your presence",
      "Slow down to a maximum of 10 mph, keep wide berth (at least 2 metres), and pass without revving the engine",
      "Accelerate quickly past them to get out of the horse's way",
      "Flash your main headlights until the rider moves onto the verge"
    ],
    correctIndex: 1,
    explanationEn: "Horses are easily frightened by loud noises and sudden movements. Under Highway Code rules, pass horses at no more than 10 mph, allowing at least 2 metres of space, without revving your engine or honking.",
    explanationBn: "ঘোড়া বা ঘোড়সওয়ার পার হওয়ার সময় গাড়ির গতি কমিয়ে সর্বোচ্চ ১০ মাইল করুন, অন্তত ২ মিটার ফাঁকা দূরত্ব রাখুন এবং হর্ন বা অতিরিক্ত ইঞ্জিন সাউন্ড করবেন না। ঘোড়া ভয় পেলে মারাত্মক দুর্ঘটনা হতে পারে।",
    tip: "ঘোড়া পার হওয়ার নিয়ম: গতি সর্বোচ্চ ১০ mph, দূরত্ব অন্তত ২ মিটার, নো হর্ন।"
  },
  {
    id: "th-21",
    topic: "Hazard Awareness",
    question: "What does a pedestrian carrying a white stick with a red reflective band indicate?",
    options: [
      "The person is deaf only",
      "The person is both deaf and blind",
      "The person is a school crossing patrol officer off-duty",
      "The person has a temporary physical leg injury"
    ],
    correctIndex: 1,
    explanationEn: "A white walking cane indicates that a pedestrian has visual impairment. If the cane has a red band or rings, it indicates that the pedestrian is deafblind.",
    explanationBn: "পথচারীর হাতে সাদা লাঠি থাকলে তিনি দৃষ্টিপ্রতিবন্ধী। আর সেই সাদা লাঠিতে যদি লাল রঙের ব্যান্ড বা রিং থাকে, তবে বুঝতে হবে তিনি দৃষ্টি এবং শ্রবণ উভয় প্রতিবন্ধী (Deafblind)। বাড়তি সতর্কতা অবলম্বন করুন।",
    tip: "সাদা লাঠিতে লাল ফিতা = অন্ধ এবং বধির (Deafblind)।"
  },
  {
    id: "th-22",
    topic: "Hazard Awareness",
    question: "You are approaching a roundabout and see a large articulated lorry in the left lane indicating right. Why is the lorry positioned this way?",
    options: [
      "The lorry driver made an error and missed the turn",
      "The lorry needs extra space to swing its long trailer around the roundabout without mounting the kerb",
      "Lorries are legally required to use the left lane at all roundabouts",
      "The lorry is about to reverse into an industrial estate"
    ],
    correctIndex: 1,
    explanationEn: "Long articulated vehicles take a wide path on roundabouts and tight corners. The tractor unit may straddle the left lane to prevent the trailer wheels from clipping the central island or kerb. Give them ample room and do not undertake.",
    explanationBn: "বড় লম্বা লরি ডানে ঘুরতে গিয়েও অনেক সময় বামের লেনে থাকে। কারণ পেছনের লম্বা অংশ যাতে ফুটপাতে না ওঠে, সেজন্য তাদের ঘুরতে বাড়তি জায়গার (Swing) প্রয়োজন হয়। কখনোই লরির পাশে ফাঁকা জায়গায় ঢুকবেন না।",
    tip: "বড় লরি বাঁক নেওয়ার সময় প্রশস্ত জায়গা নেয়—তাদের পেছনের লেন আটকে যাবেন না।"
  },

  // --- TOPIC 5: MOTORWAY RULES (5 Questions) ---
  {
    id: "th-23",
    topic: "Motorway Rules",
    question: "What does an illuminated Red 'X' displayed above a lane on a smart motorway gantry signify?",
    options: [
      "You may use the lane only if driving at 20 mph or less",
      "The lane is strictly closed; you must move out of it safely and immediately",
      "The hard shoulder is open for rush hour use",
      "Speed cameras in that lane are temporarily turned off"
    ],
    correctIndex: 1,
    explanationEn: "A Red 'X' above any motorway lane (including the hard shoulder) means that lane is closed due to an incident, breakdown, or roadworkers. Driving in a Red 'X' lane is illegal, dangerous, and carries an automatic penalty.",
    explanationBn: "স্মার্ট মোটরওয়েতে কোনো লেনের ওপর লাল 'X' চিহ্ন জ্বলে ওঠার অর্থ সেই লেনটি সম্পূর্ণ বন্ধ। সামনে হয়তো কোনো গাড়ি বিকল হয়েছে বা দুর্ঘটনা ঘটেছে। দ্রুত ও নিরাপদে অন্য লেনে সরে যেতে হবে; এই লেনে চালানো দণ্ডনীয় অপরাধ।",
    tip: "লাল 'X' = লেন বন্ধ (Lane closed, do not use)।"
  },
  {
    id: "th-24",
    topic: "Motorway Rules",
    question: "When are you permitted to drive on the hard shoulder of a motorway?",
    options: [
      "Whenever normal lanes are congested and moving at under 15 mph",
      "In an emergency, breakdown, or when directed by an active sign or traffic officer",
      "To undertake a slow-moving lorry in lane 1",
      "Whenever you need to check your satellite navigation device"
    ],
    correctIndex: 1,
    explanationEn: "The hard shoulder is strictly reserved for genuine breakdowns and emergencies, or when dynamic smart motorway overhead signs indicate it is open as an active running lane (showing a speed limit rather than a Red X).",
    explanationBn: "মোটরওয়ের হার্ড শোল্ডার শুধুমাত্র গাড়ি নষ্ট হলে বা জরুরি বিপদের সময় ব্যবহারের জন্য। অথবা স্মার্ট মোটরওয়েতে যদি ওপরের সাইনে স্পিড লিমিট দেখায় (হার্ড শোল্ডার ওপেন থাকে), তখন চালানো যাবে। জ্যাম এড়াতে বা ফোন দেখতে ঢোকা সম্পূর্ণ নিষেধ।",
    tip: "হার্ড শোল্ডার = শুধুমাত্র ইমার্জেন্সি ও ব্রেকডাউন।"
  },
  {
    id: "th-25",
    topic: "Motorway Rules",
    question: "What is the primary purpose of the right-hand lane (Lane 3 or 4) on a multi-lane motorway?",
    options: [
      "For continuous high-speed cruising at 70 mph",
      "For overtaking slower-moving vehicles only; you must return to the left when clear",
      "Reserved exclusively for commercial passenger coaches",
      "For heavy goods vehicles over 7.5 tonnes"
    ],
    correctIndex: 1,
    explanationEn: "UK motorways follow the rule: stay in the left-hand lane unless overtaking. The middle and right lanes are overtaking lanes only. Once you have passed slower traffic, move safely back to the left lane.",
    explanationBn: "যুক্তরাজ্যের মোটরওয়েতে নিয়ম হলো সবসময় বামের লেনে (Lane 1) গাড়ি চালাবেন। ডানপাশের লেনগুলো শুধুমাত্র ধীরগতির গাড়িকে ওভারটেক করার জন্য। ওভারটেক শেষ হলে আবার নিরাপদে বামের লেনে ফিরে আসবেন (Lane hogging নিষেধ)।",
    tip: "মোটরওয়ে নিয়ম: বামে ড্রাইভ করুন, ডানে শুধু ওভারটেক।"
  },
  {
    id: "th-26",
    topic: "Motorway Rules",
    question: "What colour are the reflective studs (cat's eyes) located between the hard shoulder and the main motorway carriageway?",
    options: [
      "Red",
      "Amber",
      "White",
      "Green"
    ],
    correctIndex: 0,
    explanationEn: "Motorway studs: RED studs mark the boundary between the hard shoulder and the carriageway; AMBER studs mark the right-hand edge by the central reservation; WHITE studs separate traffic lanes; GREEN studs mark slip-road exits and entries.",
    explanationBn: "মোটরওয়ের রিফ্লেক্টিভ স্টাড (Cat's eyes): হার্ড শোল্ডার ও মূল রাস্তার মাঝে থাকে লাল (Red); ডিভাইডার বা সেন্ট্রাল রিজার্ভেশনে অ্যাম্বার/হলুদ; লেনের মাঝে সাদা; আর স্লিপ রোড বা এক্সিটে সবুজ।",
    tip: "স্টাডস রঙ: লাল = হার্ড শোল্ডার · অ্যাম্বার = সেন্ট্রাল রিজার্ভেশন · সবুজ = স্লিপ রোড।"
  },
  {
    id: "th-27",
    topic: "Motorway Rules",
    question: "Your car breaks down on a smart motorway without a hard shoulder. What should you try to reach if possible?",
    options: [
      "Stop in Lane 1 and wave your arms to alert other drivers",
      "An Emergency Refuge Area (ERA) marked with a blue sign and orange SOS telephone",
      "Cross to the central reservation and climb the crash barrier",
      "Reverse back to the previous junction"
    ],
    correctIndex: 1,
    explanationEn: "If your car develops a fault on an all-lane-running smart motorway, try to exit at the next junction or pull into an Emergency Refuge Area (ERA). Switch on hazard flashers, get occupants out via passenger doors behind the barrier, and call National Highways.",
    explanationBn: "স্মার্ট মোটরওয়েতে হার্ড শোল্ডার না থাকলে গাড়ি নষ্ট হলে চেষ্টা করুন পরবর্তী Emergency Refuge Area (ERA)-তে ঢোকার। সেখানে নীল সাইন ও কমলা রঙের এসওএস ফোন থাকে। গাড়ি থেকে বাম পাশের দরজা দিয়ে বের হয়ে ব্যারিকেডের ওপারে দাঁড়ান।",
    tip: "স্মার্ট মোটরওয়ে ব্রেকডাউন = Emergency Refuge Area (ERA) খুঁজে নিন।"
  },

  // --- TOPIC 6: RULES OF THE ROAD & PRIORITY (5 Questions) ---
  {
    id: "th-28",
    topic: "Rules of the Road",
    question: "When approaching an unmarked crossroads with no priority signs or road markings, who has priority?",
    options: [
      "The vehicle travelling faster",
      "Traffic approaching from the larger road",
      "No one has automatic priority; you must approach with caution and prepare to stop",
      "The driver turning right"
    ],
    correctIndex: 2,
    explanationEn: "At unmarked crossroads where neither road has markings or signs, NO ONE has legal priority. All road users must slow down, look both ways, and proceed only when safe.",
    explanationBn: "যে চাররাস্তার মোড়ে (Unmarked crossroads) কোনো রোড সাইন বা সাদা দাগ নেই, সেখানে কারও কোনো অগ্রাধিকার (Priority) নেই। আপনাকে সাবধানে গতি কমিয়ে দুই দিকে দেখে নিশ্চিত হয়ে যেতে হবে।",
    tip: "চিহ্নহীন চাররাস্তা = কারও প্রায়োরিটি নেই, দুজনকেই সাবধানে থামতে হবে।"
  },
  {
    id: "th-29",
    topic: "Rules of the Road",
    question: "At a mini-roundabout, which traffic must you give way to?",
    options: [
      "Traffic approaching from your left only",
      "Traffic approaching from your right",
      "Vehicles signalling to turn left",
      "Only heavy commercial trucks"
    ],
    correctIndex: 1,
    explanationEn: "Just like standard roundabouts, at mini-roundabouts you must give way to traffic approaching from your right, unless signs or markings indicate otherwise. All vehicles should avoid driving over the painted central circle if practical.",
    explanationBn: "মিনি-রাউন্ডঅ্যাবাউটে সাধারণ রাউন্ডঅ্যাবাউটের মতোই আপনার ডান দিক (Right) থেকে আসা ট্রাফিককে অগ্রাধিকার দিতে হবে। চেষ্টা করবেন মাঝখানের আঁকা গোলকের ওপর দিয়ে সরাসরি না চালিয়ে গোল হয়ে ঘুরতে।",
    tip: "রাউন্ডঅ্যাবাউটের মূল নিয়ম: সবসময় ডান দিক থেকে আসা গাড়িকে পথ দিন।"
  },
  {
    id: "th-30",
    topic: "Rules of the Road",
    question: "When is it legal to overtake a vehicle on its left-hand side (undertake) on a multi-lane road?",
    options: [
      "Whenever you are running late for an appointment",
      "When traffic is moving in slow queues and the queue in your lane is moving faster than the queue on your right",
      "At night when road lighting is illuminated",
      "Whenever the car ahead is driving below 40 mph"
    ],
    correctIndex: 1,
    explanationEn: "Undertaking on the left is generally illegal and dangerous. The primary exception is in slow-moving congested queues where your lane naturally moves faster than the lane to your right, or when the car ahead is signalling to turn right.",
    explanationBn: "যুক্তরাজ্যে বাম পাশ দিয়ে ওভারটেক (Undertake) করা সাধারণত বেআইনি। তবে যদি ভারী ট্রাফিকে ধীরগতির সারি থাকে এবং আপনার সারির গাড়ি স্বাভাবিকভাবেই ডানপাশের সারির চেয়ে দ্রুত চলে, তখন তা করা বৈধ।",
    tip: "বাম দিয়ে ওভারটেক নিষেধ, শুধু ধীরগতির জ্যামে নিজের লেন দ্রুত চললে ব্যতিক্রম।"
  },
  {
    id: "th-31",
    topic: "Rules of the Road",
    question: "In which situation are you legally permitted to sound your vehicle horn while driving in a built-up area?",
    options: [
      "Between 11:30 PM and 7:00 AM to greet a neighbour",
      "To warn other road users of danger or your presence in a hazardous situation",
      "To express frustration at a stationary vehicle at a green light",
      "Whenever overtaking any vehicle inside a 20 mph zone"
    ],
    correctIndex: 1,
    explanationEn: "A horn must only be used while driving to warn others of danger. In built-up areas (roads with 30 mph street lighting), you must NOT use the horn between 11:30 PM and 7:00 AM unless another vehicle poses a danger.",
    explanationBn: "গাড়ির হর্ন শুধুমাত্র বিপদের সতর্কতা দেওয়ার জন্য। আবাসিক এলাকায় রাত ১১:৩০ থেকে সকাল ৭:০০ পর্যন্ত হর্ন বাজানো সম্পূর্ণ নিষিদ্ধ, যদি না অন্য কোনো গাড়ি সরাসরি বিপদের কারণ ঘটায়।",
    tip: "হর্ন শুধু বিপদের জন্য · রাত ১১:৩০ থেকে সকাল ৭:০০ পর্যন্ত হর্ন বাজানো নিষেধ।"
  },
  {
    id: "th-32",
    topic: "Rules of the Road",
    question: "What is the national speed limit for a standard passenger car on an unlit single carriageway road?",
    options: [
      "30 mph",
      "50 mph",
      "60 mph",
      "70 mph"
    ],
    correctIndex: 2,
    explanationEn: "For standard cars and motorcycles, the national speed limit on a single carriageway (one road carrying traffic in both directions without a physical central reservation) is 60 mph.",
    explanationBn: "মাঝখানে ডিভাইডার ছাড়া সাধারণ সিঙ্গেল ক্যারেজওয়ে রাস্তায় প্রাইভেট কারের জন্য জাতীয় গতিসীমা (National Speed Limit) হলো ৬০ মাইল প্রতি ঘণ্টা (60 mph)।",
    tip: "সিঙ্গেল ক্যারেজওয়ে = 60 mph · ডুয়েল ক্যারেজওয়ে/মোটরওয়ে = 70 mph।"
  },

  // --- TOPIC 7: VEHICLE HANDLING & WEATHER CONDITIONS (4 Questions) ---
  {
    id: "th-33",
    topic: "Vehicle Handling",
    question: "When should you switch on your front or rear fog lights?",
    options: [
      "Whenever it is raining lightly after dark",
      "Only when visibility is seriously reduced to 100 metres (328 feet) or less",
      "Whenever driving through a road tunnel during daytime",
      "To increase your visibility on country lanes at all times"
    ],
    correctIndex: 1,
    explanationEn: "Fog lights should only be used when visibility is seriously reduced to 100 metres (about the length of a football pitch). You MUST switch them off as soon as visibility improves, as they dazzle drivers behind.",
    explanationBn: "ফগ লাইট (Fog lights) শুধুমাত্র তখনই জ্বালাবেন যখন কুয়াশা বা বৃষ্টির কারণে দৃষ্টিসীমা ১০০ মিটার বা তার নিচে নেমে যায়। দৃষ্টিসীমা স্বাভাবিক হওয়ার সাথে সাথে ফগ লাইট বন্ধ করতে হবে, না হলে পেছনের চালকের চোখ ধাঁধিয়ে যাবে।",
    tip: "ফগ লাইট: শুধু ১০০ মিটারের কম দেখতে পেলে জ্বালাবেন, দৃশ্যমান হলে সাথে সাথে বন্ধ।"
  },
  {
    id: "th-34",
    topic: "Vehicle Handling",
    question: "What is the legal minimum tyre tread depth across the central three-quarters of a car tyre?",
    options: [
      "1.0 mm",
      "1.6 mm",
      "2.5 mm",
      "3.0 mm"
    ],
    correctIndex: 1,
    explanationEn: "In the UK, the legal minimum tyre tread depth for cars is 1.6 mm across the central three-quarters of the breadth of the tyre, and around the entire outer circumference. Driving with bald tyres carries a £2,500 fine and 3 points per tyre.",
    explanationBn: "যুক্তরাজ্যে প্রাইভেট কারের টায়ারের সর্বনিম্ন আইনি ট্রেড ডেপথ (Tread depth) হলো ১.৬ মিলিমিটার (1.6 mm), যা টায়ারের মাঝের তিন-চতুর্থাংশ জুড়ে থাকতে হবে। টায়ার ক্ষয়প্রাপ্ত হলে প্রতি টায়ারে £2,500 পর্যন্ত জরিমানা ও ৩ পয়েন্ট হতে পারে।",
    tip: "টায়ার ট্রেড মিনিমাম = ১.৬ মিমি (1.6 mm)।"
  },
  {
    id: "th-35",
    topic: "Vehicle Handling",
    question: "Your car begins to skid on a patch of black ice. What should you do to regain steering control?",
    options: [
      "Slam your foot hard on the footbrake and yank the handbrake",
      "Gently steer into the direction of the skid and do not brake abruptly",
      "Shift immediately into neutral and rev the engine",
      "Steer firmly in the opposite direction of the rear skid"
    ],
    correctIndex: 1,
    explanationEn: "If the rear of your car skids (e.g. rear slides right), steer smoothly in that same direction (steer right) to realign the wheels. Do NOT slam on the brakes, as locked wheels eliminate all steering ability.",
    explanationBn: "ব্ল্যাক আইসে গাড়ি স্কিড করলে কখনোই হঠাৎ শক্ত ব্রেক চাপবেন না। গাড়ি যেদিকে পিছলে যাচ্ছে (যেমন পেছনের অংশ ডানে গেলে), স্টিয়ারিং সেদিকেই আলতো করে ঘোরান (Steer into the skid) এবং পা এক্সিলারেটর থেকে সরিয়ে নিন।",
    tip: "স্কিড সামলানো: যেদিকে গাড়ি পিছলায় সেদিকেই স্টিয়ারিং ঘোরান, শক্ত ব্রেক নয়।"
  },
  {
    id: "th-36",
    topic: "Vehicle Handling",
    question: "Why is coasting (travelling in neutral or with the clutch held down for long periods) considered unsafe?",
    options: [
      "It drastically increases fuel consumption",
      "It reduces driver control because engine braking is lost and vehicle speed increases rapidly downhill",
      "It causes your headlights to flicker",
      "It locks up the steering column"
    ],
    correctIndex: 1,
    explanationEn: "Coasting disengages the engine from the driven wheels. You lose engine braking, meaning the car can quickly gather uncontrolled speed on downhill slopes, placing excessive strain on friction brakes and causing brake fade.",
    explanationBn: "নিউট্রাল গিয়ারে বা ক্লাচ চেপে রেখে গাড়ি চালানোকে কোস্টিং (Coasting) বলে। এটি বিপজ্জনক কারণ এতে ইঞ্জিনের স্বাভাবিক ব্রেকিং ক্ষমতা (Engine braking) নষ্ট হয় এবং ঢালু রাস্তায় গাড়ির গতি অনিয়ন্ত্রিতভাবে বেড়ে গিয়ে ব্রেক অকেজো হতে পারে।",
    tip: "কোস্টিং করবেন না: ইঞ্জিন ব্রেকিং হারিয়ে গাড়ি অনিয়ন্ত্রিত হয়ে পড়ে।"
  },

  // --- TOPIC 8: INCIDENTS, DOCUMENTS & EMERGENCIES (4 Questions) ---
  {
    id: "th-37",
    topic: "Incidents & Documents",
    question: "You are the first to arrive at the scene of a road traffic collision. What is the very first priority?",
    options: [
      "Offer warm food and drinks to all injured people",
      "Ensure your own safety and warn approaching traffic (turn on hazard warning lights)",
      "Move all casualties onto the pavement immediately",
      "Start taking photographs for insurance claims"
    ],
    correctIndex: 1,
    explanationEn: "Your first action at an incident must be protecting yourself and the scene from further crashes: switch on hazard warning flashers, put on a high-vis jacket, keep your own vehicle in a safe position, and call 999.",
    explanationBn: "দুর্ঘটনার স্থানে পৌঁছালে সবার আগে নিজের ও অন্যদের নিরাপত্তা নিশ্চিত করতে হবে। আপনার গাড়ির হ্যাজার্ড লাইট অন করুন, যাতে পেছনের গাড়িগুলো দেখতে পায়। নিজে নিরাপদ না হয়ে আহতদের কাছে যাবেন না এবং সাথে সাথে ৯৯৯ এ কল দিন।",
    tip: "দুর্ঘটনায় প্রথম কাজ: নিজের নিরাপত্তা নিশ্চিত করা ও পেছনের ট্রাফিককে সতর্ক করা।"
  },
  {
    id: "th-38",
    topic: "Incidents & Documents",
    question: "What must you have in place before you can legally drive a motor vehicle on public roads in the UK?",
    options: [
      "Full comprehensive insurance, a valid driving licence, and valid tax/MOT",
      "At least third-party insurance, an appropriate driving licence, and vehicle excise duty (tax) and MOT",
      "A membership with a roadside breakdown recovery service",
      "A dashcam installed on the front windscreen"
    ],
    correctIndex: 1,
    explanationEn: "Under UK law, to drive on a public road you must have at least Third-Party Motor Insurance, a valid driving licence for that category of vehicle, up-to-date Vehicle Excise Duty (road tax), and a valid MOT test certificate (if the vehicle is over 3 years old).",
    explanationBn: "যুক্তরাজ্যের রাস্তায় গাড়ি চালাতে হলে আইনিভাবে ন্যূনতম থাকতে হবে: ১. থার্ড-পার্টি ইন্স্যুরেন্স (Insurance), ২. বৈধ ড্রাইভিং লাইসেন্স (Licence), ৩. রোড ট্যাক্স (Vehicle Tax), এবং ৪. তিন বছরের পুরানো গাড়ির ক্ষেত্রে বৈধ MOT সার্টিফিকেট।",
    tip: "রাস্তায় নামার ৪টি শর্ত: লাইসেন্স, ইন্স্যুরেন্স, ট্যাক্স এবং MOT।"
  },
  {
    id: "th-39",
    topic: "Incidents & Documents",
    question: "When are you NOT allowed to use a red warning triangle to alert approaching traffic?",
    options: [
      "On an unlit rural single carriageway",
      "On a motorway",
      "On a suburban residential avenue",
      "On a dual carriageway slip road"
    ],
    correctIndex: 1,
    explanationEn: "You must NEVER place a red warning triangle on a motorway. The danger from high-speed motorway traffic when walking down the carriageway is too great. Use hazard flashers and stay behind the safety barrier.",
    explanationBn: "মোটরওয়েতে কখনোই লাল ওয়ার্নিং ট্রায়াঙ্গল (Warning triangle) বসাবেন না! কারণ হাই-স্পিড ট্রাফিকের মধ্যে হেঁটে ট্রায়াঙ্গল রাখতে যাওয়া অত্যন্ত প্রাণঘাতী। শুধুমাত্র সাধারণ রাস্তায় ৪৫ মিটার দূরে ট্রায়াঙ্গল রাখা যায়।",
    tip: "মোটরওয়েতে ওয়ার্নিং ট্রায়াঙ্গল ব্যবহার সম্পূর্ণ নিষেধ।"
  },
  {
    id: "th-40",
    topic: "Incidents & Documents",
    question: "You are involved in a collision that causes damage to another vehicle. If nobody is present, what must you do by law?",
    options: [
      "Drive away and report it within 30 days if the owner contacts you",
      "Leave your name, address, and registration number on a note, and report the collision to police within 24 hours",
      "Wait 5 minutes and then leave without doing anything",
      "Post a photo of the car on community social media"
    ],
    correctIndex: 1,
    explanationEn: "If you hit an unattended parked vehicle or property, you must stop, leave your details (name, contact, vehicle registration) securely on the damaged vehicle, and report the incident to the police as soon as possible and within 24 hours.",
    explanationBn: "পার্ক করা কোনো গাড়িতে ধাক্কা লাগলে এবং মালিক উপস্থিত না থাকলে, আপনাকে অবশ্যই আপনার নাম, ঠিকানা ও গাড়ির নম্বর চিরকুটে লিখে রেখে যেতে হবে এবং ২৪ ঘণ্টার মধ্যে নিকটস্থ থানায় পুলিশকে রিপোর্ট করতে হবে।",
    tip: "গাড়িতে আঘাত লাগলে চিরকুটে নাম-ঠিকানা রেখে ২৪ ঘণ্টার মধ্যে পুলিশে রিপোর্ট করুন।"
  }
];
