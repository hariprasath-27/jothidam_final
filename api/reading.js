
'use strict';
const Anthropic = require('@anthropic-ai/sdk');
const { buildFullChart } = require('./ephemeris');
 
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
 
function buildPrompt(chart, person, question) {
  const p = chart.planets;
  const d = chart.dasha;
  const today = new Date().toLocaleDateString('en-IN',{day:'2-digit',month:'long',year:'numeric'});
  const age = Math.floor((Date.now()-new Date(chart.input.dob))/(365.25*24*3600*1000));
  const yr = new Date().getFullYear();
 
  const planetLines = Object.entries(p).map(([name,data])=>
    `${name}: ${data.rasi} H${data.house} ${data.degInRasi.toFixed(1)}deg ${data.status}`
  ).join('\n');
 
  const houseLines = Object.entries(chart.houses)
    .map(([h,pl])=>`H${h}: ${pl.length ? pl.join(', ') : 'Empty'}`)
    .join('\n');
 
  const yogaLines = chart.yogas.map(y=>`[${y.type.toUpperCase()}] ${y.name}: ${y.desc}`).join('\n');
 
  const pastDashas = d.dashaSequence.filter(ds=>new Date(ds.endDate)<new Date())
    .slice(-4).map(ds=>`${ds.lord} Dasha: ${ds.startDate.slice(0,7)} to ${ds.endDate.slice(0,7)}`).join('\n');
 
  const antarLines = d.antardashas.map(a=>
    `${d.current?.lord}-${a.lord}: ${a.startDate.slice(0,7)} to ${a.endDate.slice(0,7)}${a===d.currentAntar?' CURRENT':''}`
  ).join('\n');
 
  const nextDasha = d.dashaSequence.filter(ds=>new Date(ds.startDate)>new Date())[0];
  const moonH = p['Moon']?.house;
  const sunH = p['Sun']?.house;
  const marsH = p['Mars']?.house;
  const mercH = p['Mercury']?.house;
  const jupH = p['Jupiter']?.house;
  const venH = p['Venus']?.house;
  const satH = p['Saturn']?.house;
  const lagnaLordH = chart.lagna.lordHouse;
  const rasiLordH = p[chart.rasi.lord]?.house;
  const h2  = chart.houses[2]?.join(',')  || 'Empty';
  const h5  = chart.houses[5]?.join(',')  || 'Empty';
  const h6  = chart.houses[6]?.join(',')  || 'Empty';
  const h7  = chart.houses[7]?.join(',')  || 'Empty';
  const h8  = chart.houses[8]?.join(',')  || 'Empty';
  const h10 = chart.houses[10]?.join(',') || 'Empty';
  const h11 = chart.houses[11]?.join(',') || 'Empty';
  const curMaha  = d.current?.lord;
  const curAntar = d.currentAntar?.lord;
 
  return `You are Jothida Pandithar, the most revered Tamil Jyotish astrologer with 40 years of mastery. You give readings so accurate and profound that people travel from distant villages to sit with you. You speak with warmth, depth, and authority. You never rush. You never summarise. You go deep into every section.
 
RULES YOU MUST NEVER BREAK:
1. NEVER use bullet points, dashes as lists, or numbered lists anywhere. Only flowing connected paragraphs.
2. Every sentence must name the exact planet AND house number AND the astrological reason.
3. Every section must have at least 3 full deep paragraphs. Never write short sections.
4. Speak directly to ${person.name} as "you" throughout — warm, personal, like a trusted wise elder.
5. Be specific with years and ages. Never be vague.
 
TODAY: ${today}
Name: ${person.name} | Age: ${age} | Gender: ${person.gender||''}
DOB: ${chart.input.dob} | Time: ${chart.input.tob} | Place: ${chart.input.place}
 
LAGNA: ${chart.lagna.rasi} (${chart.lagna.rasiEn}) Lord: ${chart.lagna.lord} in H${lagnaLordH}
RASI: ${chart.rasi.name} (${chart.rasi.en}) Lord: ${chart.rasi.lord} in H${rasiLordH}
NAKSHATRA: ${chart.nakshatra.name} Pada ${chart.nakshatra.pada} Lord: ${chart.nakshatra.lord} Gana: ${chart.nakshatra.gana} Nadi: ${chart.nakshatra.nadi} Yoni: ${chart.nakshatra.yoni}
 
PLANETS:
${planetLines}
 
HOUSES:
${houseLines}
 
YOGAS:
${yogaLines}
 
DASHA:
Past: ${pastDashas}
Current Mahadasha: ${curMaha} (${d.current?.startDate?.slice(0,7)} to ${d.current?.endDate?.slice(0,7)})
Antardashas: ${antarLines}
Next: ${nextDasha?.lord} from ${nextDasha?.startDate?.slice(0,7)}
${question ? `QUESTION: ${question}` : ''}
 
Write the complete reading. Every section deep and thorough.
 
=== CHARACTER & PERSONALITY ===
Write 4 full paragraphs: physical appearance from ${chart.lagna.rasi} Lagna, core personality from ${chart.rasi.name} Rasi lord in H${rasiLordH}, emotional nature from Moon in H${moonH}, soul instincts from ${chart.nakshatra.name} Nakshatra ${chart.nakshatra.gana} Gana. Deep strengths and weaknesses. How they think and what drives them. How others see them versus who they truly are.
 
=== WHAT HAS HAPPENED IN LIFE ===
Write 4 full paragraphs reading each past Dasha period with years and ages. What happened in childhood, teenage years, early adulthood. Connect each Dasha lord's position in the chart to real life events — education, family, relationships, career beginnings, challenges, turning points.
 
=== CURRENT PERIOD ${curMaha} MAHADASHA ${curAntar} BHUKTI ===
Write 4 full paragraphs on right now as of ${today}. Explain ${curMaha} Mahadasha fully — where it sits, what houses it rules, what it activates. Then ${curAntar} Bhukti — how it combines. What ${person.name} is experiencing now in career, relationships, finances, inner life. What opportunities must not be missed. What dangers to navigate. The overall lesson of this period.
 
=== CAREER AND EDUCATION ===
Write 4 full paragraphs. H10 (${h10}), 10th lord, Sun in H${sunH}, Mercury in H${mercH}, Saturn in H${satH}. Specific professions that suit them and why astrologically. Natural career gifts. When career takes off — which Dasha. Obstacles and why. Higher education from H5. Specific years for career breakthroughs.
 
=== WEALTH AND FINANCES ===
Write 3 full paragraphs. H2 (${h2}), H11 (${h11}), Jupiter in H${jupH}. How wealth comes — job, business, inheritance. Strongest wealth years. Lean periods. Their relationship with money. Long-term financial picture.
 
=== MARRIAGE AND RELATIONSHIPS ===
Write 4 full paragraphs. H7 (${h7}), 7th lord, Venus in H${venH}, Jupiter in H${jupH}. Nature and qualities of destined partner. Love or arranged and why. Timing — which Dasha period. Married life harmony and challenges. How they behave in relationships. Mars in H${marsH} — Mangal Dosha impact and full remedy if present.
 
=== CHILDREN ===
Write 2 full paragraphs. H5 (${h5}), Jupiter in H${jupH}, 5th lord. Prospects and timing for children. Relationship with children. Intelligence and creativity from H5.
 
=== HEALTH ===
Write 3 full paragraphs. Lagna lord in H${lagnaLordH}, H6 (${h6}), H8 (${h8}). Physical constitution from ${chart.lagna.rasi} Lagna and ${chart.nakshatra.nadi} Nadi. Vulnerable body parts and disease tendencies. Which Dasha periods need health care. Mental health from Moon in H${moonH}. Lifestyle guidance.
 
=== NEXT 5 YEARS YEAR BY YEAR ===
Write one full paragraph for each year ${yr} to ${yr+5}. For each year: exact Antardasha running, what it means in this chart, career, money, relationships, health outlook. Which year is most powerful. Which needs most caution. Practical guidance for each year.
 
=== DOSHAS AND PARIHARAMS ===
Write 3 full paragraphs. For every Dosha in this chart: what problem it creates and why astrologically. Complete remedy — actual temple name in Tamil Nadu or Kerala, presiding deity, specific day, exact mantra and number of times, gemstone with finger and metal, colour, food to donate, specific ritual. Make remedies so clear ${person.name} can do them this week.${question ? `
 
=== ANSWER TO YOUR QUESTION ===
Write 2 full paragraphs answering "${question}" with specific astrological reasoning and clear timing.` : ''}`;
}
 
module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
 
  try {
    const { dob, tob, place, name, gender, question, lagna, rasi, nakshatra } = req.body;
    if (!dob || !tob || !place || !name)
      return res.status(400).json({ error: 'dob, tob, place, name required' });
 
    const chart = buildFullChart(dob, tob, place, {
      lagna: lagna || undefined,
      rasi: rasi || undefined,
      nakshatra: nakshatra || undefined,
    });
 
    const prompt = buildPrompt(chart, { name, gender: gender || '' }, question);
 
    // Regular JSON response — works on Vercel free tier
    // Using claude-sonnet-4-6 with 6000 tokens for deep detailed reading
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 6000,
      messages: [{ role: 'user', content: prompt }],
    });
 
    const reading = message.content.map(c => c.text || '').join('');
    res.status(200).json({ ok: true, chart, reading });
 
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
};
