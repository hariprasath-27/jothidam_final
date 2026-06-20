
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
 
  const planetLines = Object.entries(p)
    .map(([n,data])=>`${n}:${data.rasi} H${data.house} ${data.status.split(' ')[0]}`)
    .join(' | ');
 
  const yogaLines = chart.yogas.map(y=>`${y.name}`).join(', ');
 
  const pastDashas = d.dashaSequence
    .filter(ds=>new Date(ds.endDate)<new Date()).slice(-3)
    .map(ds=>`${ds.lord}(${ds.startDate.slice(0,4)}-${ds.endDate.slice(0,4)})`).join(' > ');
 
  const antarLines = d.antardashas.map(a=>
    `${d.current?.lord}-${a.lord}:${a.startDate.slice(0,7)}-${a.endDate.slice(0,7)}${a===d.currentAntar?'*':''}`
  ).join(' | ');
 
  const nextDasha = d.dashaSequence.filter(ds=>new Date(ds.startDate)>new Date())[0];
  const curMaha  = d.current?.lord;
  const curAntar = d.currentAntar?.lord;
  const curMahaH = p[curMaha]?.house;
  const curAntarH= p[curAntar]?.house;
 
  const moonH=p['Moon']?.house, sunH=p['Sun']?.house, marsH=p['Mars']?.house;
  const mercH=p['Mercury']?.house, jupH=p['Jupiter']?.house;
  const venH=p['Venus']?.house, satH=p['Saturn']?.house;
  const lagnaLordH=chart.lagna.lordHouse, rasiLordH=p[chart.rasi.lord]?.house;
  const h2=chart.houses[2]?.join(',')||'Empty', h5=chart.houses[5]?.join(',')||'Empty';
  const h6=chart.houses[6]?.join(',')||'Empty', h7=chart.houses[7]?.join(',')||'Empty';
  const h8=chart.houses[8]?.join(',')||'Empty', h10=chart.houses[10]?.join(',')||'Empty';
  const h11=chart.houses[11]?.join(',')||'Empty';
 
  return `You are Jothida Pandithar, master Tamil Jyotish astrologer 40 years experience. Write for ${person.name}, age ${age}, ${today}, ${chart.input.place}.
 
LAGNA:${chart.lagna.rasi} lord:${chart.lagna.lord} H${lagnaLordH} | RASI:${chart.rasi.name} lord:${chart.rasi.lord} H${rasiLordH} | NAK:${chart.nakshatra.name} P${chart.nakshatra.pada} lord:${chart.nakshatra.lord} Gana:${chart.nakshatra.gana} Nadi:${chart.nakshatra.nadi}
PLANETS: ${planetLines}
H2:${h2} H5:${h5} H6:${h6} H7:${h7} H8:${h8} H10:${h10} H11:${h11}
YOGAS: ${yogaLines}
PAST DASHAS: ${pastDashas}
NOW: ${curMaha} Mahadasha H${curMahaH} | ${curAntar} Bhukti H${curAntarH} | ends:${d.currentAntar?.endDate?.slice(0,7)}
ANTARDASHAS: ${antarLines}
NEXT: ${nextDasha?.lord} from ${nextDasha?.startDate?.slice(0,7)}
${question?`Q: ${question}`:''}
 
FORMAT RULES: Use === TITLE === for sections. Use --- Sub Heading --- inside sections. Write 2 paragraphs under each sub-heading. No bullet points. Speak as "you" to ${person.name}. Cite planet+house in every sentence.
 
=== CHARACTER & PERSONALITY ===
--- Physical Nature & Appearance ---
--- Inner Personality & Emotional World ---
--- Soul Drives & Core Strengths ---
 
=== LIFE SO FAR ===
--- Childhood (past dashas until age 12) ---
--- Teenage & Early Adult Years ---
--- Recent Past (last dasha before current) ---
 
=== RIGHT NOW — ${curMaha} DASHA ${curAntar} BHUKTI ===
--- What ${curMaha} in H${curMahaH} Is Activating ---
--- What ${curAntar} in H${curAntarH} Bhukti Brings ---
--- Opportunities & Warnings Now ---
 
=== CAREER & EDUCATION ===
--- Your Natural Path & Talents ---
--- When Career Peaks (Dasha timing) ---
 
=== WEALTH & FINANCES ===
--- How Money Comes To You ---
--- Best & Lean Financial Years ---
 
=== MARRIAGE & RELATIONSHIPS ===
--- Your Life Partner ---
--- Marriage Timing & Married Life ---
--- Mangal Dosha & Remedy ---
 
=== CHILDREN ===
--- Children & Family Life ---
 
=== HEALTH ===
--- Physical Constitution & Vulnerabilities ---
--- Health Warnings & Care Periods ---
 
=== NEXT 5 YEARS ===
--- ${yr} ---
--- ${yr+1} ---
--- ${yr+2} ---
--- ${yr+3} ---
--- ${yr+4} ---
 
=== DOSHAS & PARIHARAMS ===
--- Doshas Present ---
--- Complete Remedies (temples, mantras, gemstones) ---
${question?`\n=== ANSWER TO YOUR QUESTION ===\n--- ${question} ---`:''}
 
Write all sections now with full detail.`;
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
      lagna: lagna||undefined, rasi: rasi||undefined, nakshatra: nakshatra||undefined,
    });
 
    const prompt = buildPrompt(chart, { name, gender: gender||'' }, question);
 
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
    });
 
    const reading = message.content.map(c=>c.text||'').join('');
    res.status(200).json({ ok: true, chart, reading });
 
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
};
