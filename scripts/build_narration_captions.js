const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const pdfText = fs.readFileSync('Presentation Speech/NHFL Board Presentation/NARRATION-TEXTS.txt', 'utf8');

// Clean PDF page markers
const cleanedText = pdfText.replace(/--\s*\d+\s*of\s*\d+\s*--/g, '').replace(/\r/g, '');

const slideRegex = /(slide-\d{2}[^\n]*)/g;
const splits = cleanedText.split(slideRegex);

const slidesData = [];
// splits[0] is preamble before slide-00
for (let i = 1; i < splits.length; i += 2) {
  const header = splits[i].trim();
  const body = splits[i+1].trim();
  
  const m = header.match(/slide-(\d{2})(?:-intro)?\.mp3\s*\(([\d\.]+)s\)/);
  const slideIndex = parseInt(m[1], 10);
  const reportedDuration = parseFloat(m[2]);
  
  // Clean text and split on Bangla danda "।"
  const rawSentences = body.split('।')
    .map(s => s.replace(/\s+/g, ' ').trim())
    .filter(s => s.length > 0)
    .map(s => s + '।');
    
  slidesData.push({
    slideIndex,
    header,
    reportedDuration,
    rawSentences
  });
}

// Measure actual audio file durations from public/pitch/nhf/assets/narration/
const narrationDir = 'public/pitch/nhf/assets/narration';
const files = [
  'slide-00-intro.mp3',
  'slide-01.mp3',
  'slide-02.mp3',
  'slide-03.mp3',
  'slide-04.mp3',
  'slide-05.mp3',
  'slide-06.mp3',
  'slide-07.mp3',
  'slide-08.mp3',
  'slide-09.mp3',
  'slide-10.mp3',
  'slide-11.mp3'
];

const processedSlides = [];

slidesData.forEach((s, idx) => {
  const filename = files[s.slideIndex];
  const fullAudioPath = path.join(narrationDir, filename);
  const actualDurStr = execSync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${fullAudioPath}"`).toString().trim();
  const actualDuration = parseFloat(actualDurStr);
  
  // Calculate total character count of all sentences
  const totalChars = s.rawSentences.reduce((acc, sent) => acc + sent.length, 0);
  
  let currentStart = 0;
  const sentenceTimings = s.rawSentences.map((sentence, sIdx) => {
    const sentDur = (sentence.length / totalChars) * actualDuration;
    const start = currentStart;
    const end = (sIdx === s.rawSentences.length - 1) ? actualDuration : (start + sentDur);
    currentStart = end;
    return {
      index: sIdx,
      sentence,
      start: parseFloat(start.toFixed(2)),
      end: parseFloat(end.toFixed(2)),
      duration: parseFloat(sentDur.toFixed(2))
    };
  });
  
  processedSlides.push({
    slideIndex: s.slideIndex,
    audioFile: `/pitch/nhf/assets/narration/${filename}`,
    filename,
    actualDuration: parseFloat(actualDuration.toFixed(2)),
    reportedDuration: s.reportedDuration,
    sentencesCount: sentenceTimings.length,
    sentences: sentenceTimings
  });
});

fs.writeFileSync('public/pitch/nhf/assets/narration_data.json', JSON.stringify(processedSlides, null, 2));
fs.writeFileSync('public/pitch/nhf/assets/NARRATION-TEXTS.md', cleanedText);
fs.writeFileSync('public/pitch/nhf/assets/narration/NARRATION-TEXTS.md', cleanedText);

// Also copy VOICE-SPEC if exists or create reference
const voiceSpec = `# NHFL Digital Presenter — Voice Specification
- Voice Model: Helio
- Language: Bengali (bn)
- Speed: 85% (0.85x measured pace for boardroom gravitas)
- Tone: Formal institutional, crisp banking terminology, high clarity
`;
fs.writeFileSync('public/pitch/nhf/assets/VOICE-SPEC.md', voiceSpec);
fs.writeFileSync('public/pitch/nhf/assets/narration/VOICE-SPEC.md', voiceSpec);

console.log('Processed', processedSlides.length, 'slides successfully!');
processedSlides.forEach(p => {
  console.log(`Slide ${p.slideIndex} (${p.filename}): ${p.actualDuration}s, ${p.sentencesCount} sentences`);
});
