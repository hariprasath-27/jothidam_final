
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
 
  const pastDashas = d.dashaSequence
    .filter(ds => new Date(ds.endDate) < new Date())
    .slice(-4)
    .map(ds => `${ds.lord} Dasha: ${ds.startDate.slice(0,7)} to ${ds.endDate.slice(0,7)}`)
    .join('\n');
 
  const antarLines = d.antardashas.map(a =>
    `${d.current?.lord}-${a.lord}: ${a.startDate.slice(0,7)} to ${a.endDate.slice(0,7)}${a === d.currentAntar ? ' CURRENT' : ''}`
  ).join('\n');
 
  const nextDasha = d.dashaSequence.filter(ds => new Date(ds.startDate) > new Date())[0];
  const curMaha  = d.current?.lord;
  const curAntar = d.currentAntar?.lord;
 
  const moonH = p['Moon']?.house;
  const sunH  = p['Sun']?.house;
  const marsH = p['Mars']?.house;
  const mercH = p['Mercury']?.house;
  const jupH  = p['Jupiter']?.house;
  const venH  = p['Venus']?.house;
  const satH  = p['Saturn']?.house;
  const lagnaLordH = chart.lagna.lordHouse;
  const rasiLordH  = p[chart.rasi.lord]?.house;
  const h2  = chart.houses[2]?.join(',')  || 'Empty';
  const h5  = chart.houses[5]?.join(',')  || 'Empty';
  const h6  = chart.houses[6]?.join(',')  || 'Empty';
  const h7  = chart.houses[7]?.join(',')  || 'Empty';
  const h8  = chart.houses[8]?.join(',')  || 'Empty';
  const h10 = chart.houses[10]?.join(',') || 'Empty';
  const h11 = chart.houses[11]?.join(',') || 'Empty';
 
  return `You are Jothida Pandithar, a master Tamil Jyotish astrologer with 40 years of experience. Write a detailed, flowing reading for ${person.name}. Speak directly to them as "you". Never use bullet points — only paragraphs. Every statement must cite the exact planet and house number.
 
TODAY: ${today} | Name: ${person.name} | Age: ${age} | Gender: ${person.gender||''}
DOB: ${chart.input.dob} | Time: ${chart.input.tob} | Place: ${chart.input.place}
LAGNA: ${chart.lagna.rasi} Lord: ${chart.lagna.lord} in H${lagnaLordH}
RASI: ${chart.rasi.name} Lord: ${chart.rasi.lord} in H${rasiLordH}
NAKSHATRA: ${chart.nakshatra.name} Pada ${chart.nakshatra.pada} Lord: ${chart.nakshatra.lord} Gana: ${chart.nakshatra.gana} Nadi: ${chart.nakshatra.nadi}
PLANETS:
${planetLines}
HOUSES:
${houseLines}
YOGAS:
${yogaLines}
DASHA: ${curMaha} Mahadasha (${d.current?.startDate?.slice(0,7)} to ${d.current?.endDate?.slice(0,7)})
ANTARDASHA: ${curAntar} Bhukti CURRENT
ALL ANTARDASHAS: ${antarLines}
PAST DASHAS: ${pastDashas}
NEXT MAHADASHA: ${nextDasha?.lord} from ${nextDasha?.startDate?.slice(0,7)}
${question ? `QUESTION: ${question}` : ''}
 
Write the complete reading with these sections. Each section must have flowing paragraphs — no bullet points, no dashes, only connected prose. Cite planet+house in every sentence.
 
=== CHARACTER & PERSONALITY ===
Two detailed paragraphs: physical appearance and personality from ${chart.lagna.rasi} Lagna with lord in H${lagnaLordH}. Emotional nature from Moon in H${moonH} and ${chart.nakshatra.name} Nakshatra. Strengths, weaknesses, how they think and what drives them.
 
=== WHAT HAS HAPPENED IN LIFE ===
Two detailed paragraphs covering each past Dasha period with approximate years. What happened in childhood, teenage years, early adulthood based on each Dasha lord's placement in the chart.
 
=== CURRENT PERIOD ${curMaha} DASHA ${curAntar} BHUKTI ===
Two detailed paragraphs on what is happening right now as of ${today}. What ${curMaha} in H${p[curMaha]?.house} activates. What ${curAntar} Bhukti adds. Career, relationships, finances, inner life right now. Key opportunities and challenges.
 
=== CAREER AND EDUCATION ===
Two detailed paragraphs. H10 (${h10}), Sun in H${sunH}, Mercury in H${mercH}, Saturn in H${satH}. Specific professions, natural gifts, when career peaks, which Dasha brings breakthrough.
 
=== WEALTH AND FINANCES ===
One detailed paragraph. H2 (${h2}), H11 (${h11}), Jupiter in H${jupH}. How wealth comes, best financial years, lean periods.
 
=== MARRIAGE AND RELATIONSHIPS ===
Two detailed paragraphs. H7 (${h7}), Venus in H${venH}, Jupiter in H${jupH}. Partner's nature, love or arranged, timing, Mars in H${marsH} Mangal Dosha if present and remedy.
 
=== CHILDREN ===
One detailed paragraph. H5 (${h5}), Jupiter in H${jupH}. Prospects, timing, relationship with children.
 
=== HEALTH ===
One detailed paragraph. Lagna lord in H${lagnaLordH}, H6 (${h6}), H8 (${h8}). Constitution, vulnerable areas, which Dasha periods to be careful.
 
=== NEXT 5 YEARS YEAR BY YEAR ===
One paragraph per year from ${yr} to ${yr+5}. Each year: which Antardasha is running, what to expect in career, money, relationships, health. Which year is best, which needs caution.
 
=== DOSHAS AND PARIHARAMS ===
Two detailed paragraphs. Every Dosha present: exact problem it causes. Complete remedy — specific temple name, deity, day, mantra with count, gemstone with finger and metal, colour to wear or donate.${question ? `
 
=== ANSWER TO YOUR QUESTION ===
One detailed paragraph answering "${question}" with specific astrological reasoning and timing.` : ''}`;
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
 
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
    });
 
    const reading = message.content.map(c => c.text || '').join('');
    res.status(200).json({ ok: true, chart, reading });
 
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
};
