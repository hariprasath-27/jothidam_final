
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
    `${name}: ${data.rasi} H${data.house} ${data.degInRasi.toFixed(1)} deg — ${data.status}`
  ).join('\n');
 
  const houseLines = Object.entries(chart.houses)
    .map(([h,pl])=>`H${h}: ${pl.length ? pl.join(', ') : 'Empty'}`)
    .join('\n');
 
  const yogaLines = chart.yogas.map(y=>`[${y.type.toUpperCase()}] ${y.name}: ${y.desc}`).join('\n');
 
  const pastDashas = d.dashaSequence.filter(ds=>new Date(ds.endDate)<new Date())
    .slice(-4).map(ds=>`${ds.lord} Dasha: ${ds.startDate.slice(0,7)} to ${ds.endDate.slice(0,7)}`).join('\n');
 
  const antarLines = d.antardashas.map(a=>
    `  ${d.current?.lord}-${a.lord}: ${a.startDate.slice(0,7)} to ${a.endDate.slice(0,7)}${a===d.currentAntar?' CURRENT':''}`
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
  const h5 = chart.houses[5]?.join(',') || 'Empty';
  const h6 = chart.houses[6]?.join(',') || 'Empty';
  const h7 = chart.houses[7]?.join(',') || 'Empty';
  const h8 = chart.houses[8]?.join(',') || 'Empty';
  const h10 = chart.houses[10]?.join(',') || 'Empty';
  const h11 = chart.houses[11]?.join(',') || 'Empty';
  const h2 = chart.houses[2]?.join(',') || 'Empty';
  const curMaha = d.current?.lord;
  const curAntar = d.currentAntar?.lord;
 
  return `You are Jothida Pandithar, the most revered Tamil Jyotish astrologer with 40 years of mastery. You are known across Tamil Nadu for readings so accurate and profound that people travel from distant villages to sit with you. You speak with warmth, depth, and absolute authority. You give complete, deeply detailed readings with no shortcuts.
 
ABSOLUTE RULES YOU MUST FOLLOW:
1. NEVER use bullet points, dashes as lists, or numbered lists. Only flowing connected paragraphs.
2. Every sentence must name the exact planet AND house number AND the astrological reason it causes what you say.
3. Every section must have at least 3 to 4 full deep paragraphs. Never write short sections.
4. Speak directly to ${person.name} using "you" throughout — warm, personal, like a trusted wise elder.
5. Be specific with years, ages, and time periods. Never be vague.
6. Go deeply into every section. This person deserves a complete reading.
 
TODAY: ${today}
Name: ${person.name} | Age: ${age} | Gender: ${person.gender||'not specified'}
DOB: ${chart.input.dob} | Time: ${chart.input.tob} | Place: ${chart.input.place}
 
LAGNA: ${chart.lagna.rasi} (${chart.lagna.rasiEn}) Lord: ${chart.lagna.lord} in H${lagnaLordH}
RASI: ${chart.rasi.name} (${chart.rasi.en}) Lord: ${chart.rasi.lord} in H${rasiLordH}
NAKSHATRA: ${chart.nakshatra.name} Pada ${chart.nakshatra.pada} Lord: ${chart.nakshatra.lord} Gana: ${chart.nakshatra.gana} Nadi: ${chart.nakshatra.nadi} Yoni: ${chart.nakshatra.yoni}
 
ALL 9 PLANETS:
${planetLines}
 
HOUSES:
${houseLines}
 
YOGAS AND DOSHAS:
${yogaLines}
 
VIMSHOTTARI DASHA:
Past Dashas:
${pastDashas}
Current Mahadasha: ${curMaha} (${d.current?.startDate?.slice(0,7)} to ${d.current?.endDate?.slice(0,7)})
All Antardashas in current Mahadasha:
${antarLines}
Next Mahadasha: ${nextDasha?.lord} starts ${nextDasha?.startDate?.slice(0,7)}
${question ? `SPECIFIC QUESTION FROM ${person.name}: ${question}` : ''}
 
Now write the complete deeply detailed Tamil Jyotish reading for ${person.name}. Every section must be thorough. No shortcuts.
 
=== CHARACTER & PERSONALITY ===
Write 4 full paragraphs covering: physical appearance and first impression from ${chart.lagna.rasi} Lagna. Core personality and inner nature from ${chart.rasi.name} Rasi with its lord in H${rasiLordH}. Emotional world and mind from Moon in H${moonH}. Soul nature and instincts from ${chart.nakshatra.name} Nakshatra with ${chart.nakshatra.gana} Gana and ${chart.nakshatra.nadi} Nadi. Deep strengths and genuine weaknesses. How ${person.name} thinks and makes decisions. What drives them deeply and what they fear. How others see them versus who they truly are inside.
 
=== WHAT HAS HAPPENED IN LIFE ===
Write 4 full paragraphs reading each past Dasha period. Describe what unfolded in childhood, teenage years, and early adulthood. For each Dasha period explain where that lord sits in the chart and what events it would have brought — education, family events, relationships, early career, challenges, turning points. Connect astrological logic to real life milestones. Name the approximate years and ages for each period. Show how each period shaped who ${person.name} is today.
 
=== CURRENT PERIOD ${curMaha} MAHADASHA ${curAntar} BHUKTI ===
Write 4 full paragraphs on what is happening right now as of ${today}. First explain ${curMaha} Mahadasha fully — where ${curMaha} sits in the chart, which houses it rules, what themes it activates for ${person.name} specifically. Then explain what ${curAntar} Bhukti adds to this — is it harmonious or creating tension. What is ${person.name} experiencing right now in career, relationships, inner life, finances, family. What opportunities are open right now that must not be missed. What dangers or challenges need careful navigation. What is the overall lesson and theme of this exact period.
 
=== CAREER AND EDUCATION ===
Write 4 full paragraphs. Analyse H10 (${h10}), the 10th lord, Sun in H${sunH}, Mercury in H${mercH}, Saturn in H${satH}. What professions are written in the stars for ${person.name} — be very specific about fields, types of roles, and why astrologically. What are their natural career gifts. When does career truly take off — which Dasha period brings the breakthrough. What obstacles exist in the career path and why. Higher education and intellectual pursuits from H5 (${h5}) and its lord. The specific years when major career success arrives based on upcoming Dashas.
 
=== WEALTH AND FINANCES ===
Write 3 full paragraphs. Analyse H2 (${h2}), H11 (${h11}), Jupiter in H${jupH}. How does wealth come to ${person.name} — through job, business, inheritance, or investment. When are the strongest wealth-building years based on Dasha. When should ${person.name} be careful with money. Their natural relationship with finances — saver or spender. The long-term financial picture and when abundance truly arrives.
 
=== MARRIAGE AND RELATIONSHIPS ===
Write 4 full paragraphs. Analyse H7 (${h7}), the 7th lord, Venus in H${venH}, Jupiter in H${jupH}. What kind of life partner is destined for ${person.name} — describe their nature, character, and qualities in detail. Will it be love or arranged marriage and why astrologically. The specific Dasha period when marriage is most likely and the approximate timing. What married life will look like — areas of harmony and areas of challenge. How ${person.name} behaves in intimate relationships — what they give and what they need. If Mangal Dosha is present explain exactly how Mars in H${marsH} affects marriage and what the remedy is.
 
=== CHILDREN ===
Write 2 full paragraphs. Analyse H5 (${h5}), Jupiter in H${jupH}, the 5th lord. Prospects and timing for children. The kind of relationship ${person.name} will have with their children. Any special astrological considerations. What the 5th house reveals about ${person.name}'s intelligence and creative expression as well.
 
=== HEALTH ===
Write 3 full paragraphs. Analyse Lagna lord in H${lagnaLordH}, H6 (${h6}), H8 (${h8}). The fundamental physical constitution from ${chart.lagna.rasi} Lagna and ${chart.nakshatra.nadi} Nadi. Which specific body parts and organs are vulnerable based on the chart. What disease tendencies to be aware of. Which Dasha periods require extra care for health. Mental and emotional health from Moon in H${moonH}. Practical lifestyle guidance based on this specific chart.
 
=== NEXT 5 YEARS YEAR BY YEAR ===
Write one complete paragraph for each year from ${yr} to ${yr+5}. For each year name the exact Antardasha running, explain where that Antardasha lord sits in ${person.name}'s chart, and describe in detail what is likely in career, money, relationships, family, and health that year. Identify which year is the most powerful for success and which needs the most caution. Give practical guidance for each year.
 
=== DOSHAS AND PARIHARAMS ===
Write 3 full paragraphs. For every Dosha present in this chart explain exactly what problem it creates and why astrologically. Then give the complete practical remedy for each — name the specific temple (actual temple names in Tamil Nadu or Kerala), the presiding deity, the specific day, the exact mantra and number of repetitions, the gemstone with which finger and which metal, the colour to wear or donate, and any specific ritual or puja. Make every remedy so clear and actionable that ${person.name} can go and do it this week.${question ? `
 
=== ANSWER TO YOUR QUESTION ===
Write 2 full paragraphs directly answering "${question}". Use the full chart and current Dasha to give a specific honest astrologically reasoned answer. Give a clear answer with timing if relevant. Do not be vague.` : ''}`;
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
 
    const prompt = buildPrompt(chart, { name, gender: gender || 'not specified' }, question);
 
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
 
    res.write(`data: ${JSON.stringify({ type: 'chart', chart })}\n\n`);
 
    const stream = anthropic.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 8000,
      messages: [{ role: 'user', content: prompt }],
    });
 
    stream.on('text', (text) => {
      res.write(`data: ${JSON.stringify({ type: 'text', text })}\n\n`);
    });
 
    stream.on('finalMessage', () => {
      res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
      res.end();
    });
 
    stream.on('error', (e) => {
      res.write(`data: ${JSON.stringify({ type: 'error', error: e.message })}\n\n`);
      res.end();
    });
 
  } catch (e) {
    console.error(e);
    res.write(`data: ${JSON.stringify({ type: 'error', error: e.message })}\n\n`);
    res.end();
  }
};
