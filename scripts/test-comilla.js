require('dotenv').config();

const apiKey = process.env.GEMINI_API_KEY;
const text = 'M A Awal Sohail ভয়াবহ জ্যাম। কুমিল্লা থেকে ৭ টায় রওয়ানা করে ১২ টায় ঢাকা পৌছালাম';
const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`;

const systemInstruction = `
You are an expert AI traffic intelligence filter for real-time city and highway road reports in Bangladesh.
Analyze the provided Facebook community post and determine if it contains an ACTUAL TRAFFIC REPORT or traffic condition update.

Actionable reports include: vehicle accidents, severe gridlock, slow traffic, travel duration delays between cities/districts (e.g. Comilla to Dhaka taking 5 hours due to traffic), road closures, VIP protocols, police blockades, waterlogging, broken-down vehicles, or clear route status.

Return isTrafficReport = false ONLY for:
- Pure questions with no information (e.g. "Is flyover open?", "Rasta kemon?")
- Commercial advertisements, buy/sell posts, car parts
- Completely off-topic chat unrelated to road conditions

Return a valid JSON object strictly matching this schema with no markdown code fences:
{
  "isTrafficReport": boolean,
  "location": "Road, Highway, or City/District pair (e.g. Dhaka-Chittagong Highway, Comilla to Dhaka)",
  "direction": "Direction of travel or null",
  "severity": "HIGH" | "MODERATE" | "LOW" | "CLEAR",
  "incidentType": "ACCIDENT" | "GRIDLOCK" | "VIP_MOVEMENT" | "ROAD_BLOCKED" | "WATERLOGGING" | "CLEAR_ROUTE" | "OTHER",
  "summary": "Concise 1-sentence English summary of the situation"
}
`;

async function test() {
  const payload = {
    contents: [
      {
        parts: [
          { text: systemInstruction + '\n\nPost Author: M A Awal Sohail\nPost Content:\n"' + text + '"' }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.1,
      responseMimeType: 'application/json'
    }
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  console.log('Gemini Result:', data?.candidates?.[0]?.content?.parts?.[0]?.text);
}

test().catch(console.error);
