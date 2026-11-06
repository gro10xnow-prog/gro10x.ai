// PassKoro - Visa English (SELT B1 / A2) Prompt Cards
// Strictly Speaking & Listening format (Home Office approved SELT style, NOT MCQs)
// Author: Zarif Rahman (Rapid Prototyper, GRO10X Foundry Lab)

export const VISA_ENGLISH_PROMPTS = [
  {
    id: "selt-01",
    phase: "Phase 1: Topic Presentation & Discussion (5 Mins)",
    title: "Topic 1: My Daily Work & Commute in the UK",
    cefrLevel: "SELT B1 (Indefinite Leave to Remain / Citizenship)",
    examinerPrompt: "Could you tell me about your typical working day, how you travel to work, and what you enjoy most about your job?",
    sampleResponseEn: "I work as a healthcare assistant in a local care home in East London. I usually wake up at 6:30 AM and take the bus, which takes about 25 minutes. What I enjoy most is communicating with elderly residents and helping them with their meals and daily comfort.",
    explanationBn: "পরীক্ষক আপনাকে আপনার দৈনন্দিন কাজ ও যাতায়াত সম্পর্কে ৩-৪ বাক্য বলতে বলবেন। জটিল ইংরেজি না বলে সহজ বাক্যে সময়, যানবাহনের নাম ও কাজের ভালো লাগার একটি কারণ গুছিয়ে বলুন।",
    keyVocab: ["Healthcare assistant", "Commute by bus", "Elderly residents", "Daily routine"],
    examinerFollowUp: "What do you do if your bus is delayed or cancelled?",
    modelFollowUpEn: "If the bus is delayed, I immediately check the transport app and take the Underground instead, or call my manager to inform them.",
    modelFollowUpBn: "বিকল্প উত্তর: বাস লেট হলে টিউব (আন্ডারগ্রাউন্ড) নেই বা ম্যানেজারকে ফোন দিয়ে জানিয়ে দেই।"
  },
  {
    id: "selt-02",
    phase: "Phase 2: Interactive Conversation & Problem Solving",
    title: "Scenario: Booking an Urgent GP Appointment",
    cefrLevel: "SELT B1 / A2 (Spouse Visa Extension / Settlement)",
    examinerPrompt: "Imagine I am the receptionist at your GP surgery. You have had severe toothache and headache for two days and need to see a doctor today. Speak to me and book an appointment.",
    sampleResponseEn: "Hello, good morning. My name is Nazmul Huda, date of birth 14th of March 1988. I have been suffering from severe toothache and fever since yesterday. Could you please check if there is an emergency appointment available today with a doctor?",
    explanationBn: "জিপি সার্জারিতে কথা বলার সময় ৩টি তথ্য পরিষ্কারভাবে বলবেন: ১. আপনার পুরো নাম ও জন্মতারিখ, ২. কী সমস্যা কতদিন ধরে হচ্ছে, এবং ৩. আজ কোনো অ্যাপয়েন্টমেন্ট আছে কিনা সেই অনুরোধ।",
    keyVocab: ["Date of birth", "Severe pain / fever", "Emergency appointment", "Available slot"],
    examinerFollowUp: "There are no doctor appointments today, but we have an advanced nurse at 3:15 PM. Would you like that?",
    modelFollowUpEn: "Yes, 3:15 PM with the nurse is fine, thank you. Could you please send me a confirmation SMS?",
    modelFollowUpBn: "সহজ সম্মতি: হ্যাঁ, ৩:১৫ এর নার্সের টাইমটি দিন এবং মোবাইলে কনফার্মেশন এসএমএস পাঠাতে অনুরোধ করুন।"
  },
  {
    id: "selt-03",
    phase: "Phase 3: Listening Comprehension & Information Extraction",
    title: "Listening Clip: Train Announcement at London Euston",
    cefrLevel: "SELT B1 (General Listening & Retelling)",
    examinerPrompt: "Listen to the station announcement and explain where the train is going, which platform it departs from, and what passengers should do with their luggage.",
    transcriptEn: "May I have your attention please on Platform 3. The 14:45 Avanti West Coast service to Manchester Piccadilly is ready for boarding. Please ensure all personal luggage is kept with you at all times. Passengers requiring special assistance should notify platform staff immediately.",
    comprehensionSummaryBn: "ঘোষণার মূল ৩টি তথ্য মনে রাখুন: ট্রেনটি যাচ্ছে ম্যাঞ্চেস্টার পিকাডিলি (Manchester Piccadilly), ছাড়বে প্ল্যাটফর্ম ৩ (Platform 3) থেকে দুপুর ২:৪৫ এ, এবং যাত্রীদের নিজেদের লাগেজ সবসময় সাথে রাখার নির্দেশ দেওয়া হয়েছে।",
    passCriteria: "Candidate must identify destination (Manchester), platform number (3), and safety instruction in clear spoken English."
  }
];
