'use strict';
const Anthropic = require('@anthropic-ai/sdk');
const { buildFullChart } = require('./ephemeris');
 
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
 
function getChartSummary(chart, person, age, today) {
  const p = chart.planets;
  const d = chart.dasha;
  const planetLines = Object.entries(p)
    .map(([n,data])=>`${n}:${data.rasi} H${data.house} ${data.status.split(' ')[0]}`)
    .join(' | ');
  const yogaLines = chart.yogas.map(y=>y.name).join(', ');
  const pastDashas = d.dashaSequence
    .filter(ds=>new Date(ds.endDate)<new Date()).slice(-3)
    .map(ds=>`${ds.lord}(${ds.startDate.slice(0,4)}-${ds.endDate.slice(0,4)})`).join(' > ');
  const antarLines = d.antardashas.map(a=>
    `${d.current?.lord}-${a.lord}:${a.startDate.slice(0,7)}-${a.endDate.slice(0,7)}${a===d.currentAntar?'*':''}`
  ).join(' | ');
  const nextDasha = d.dashaSequence.filter(ds=>new Date(ds.startDate)>new Date())[0];
  const p2 = (key) => chart.houses[key]?.join(',')||'Empty';
 
  return `Name:${person.name} | Age:${age} | Today:${today} | DOB:${chart.input.dob} | Place:${chart.input.place}
LAGNA:${chart.lagna.rasi} lord:${chart.lagna.lord} H${chart.lagna.lordHouse} | RASI:${chart.rasi.name} lord:${chart.rasi.lord} H${p[chart.rasi.lord]?.house} | NAK:${chart.nakshatra.name} P${chart.nakshatra.pada} lord:${chart.nakshatra.lord} Gana:${chart.nakshatra.gana} Nadi:${chart.nakshatra.nadi}
PLANETS: ${planetLines}
H2:${p2(2)} H5:${p2(5)} H6:${p2(6)} H7:${p2(7)} H8:${p2(8)} H10:${p2(10)} H11:${p2(11)}
YOGAS: ${yogaLines}
PAST DASHAS: ${pastDashas}
NOW: ${d.current?.lord} Mahadasha H${p[d.current?.lord]?.house} | ${d.currentAntar?.lord} Bhukti H${p[d.currentAntar?.lord]?.house} ends:${d.currentAntar?.endDate?.slice(0,7)}
ANTARDASHAS: ${antarLines}
NEXT MAHADASHA: ${nextDasha?.lord} from ${nextDasha?.startDate?.slice(0,7)}`;
}
 
function buildPrompt1(chart, person, question, age, today) {
  const d = chart.dasha;
  const p = chart.planets;
  const curMaha = d.current?.lord;
  const curAntar = d.currentAntar?.lord;
 
  return `You are Jothida Pandithar, master Tamil Jyotish astrologer with 40 years experience.
RULES: Use === TITLE === for sections. Use --- Sub Heading --- inside sections. Write 2 detailed paragraphs under EVERY sub-heading. No bullet points ever. Speak as "you" to ${person.name}. Cite planet+house in every sentence. Be specific with years and ages.
 
CHART:
${getChartSummary(chart, person, age, today)}
${question ? `QUESTION: ${question}` : ''}
 
Write PART 1 of the reading covering exactly these sections:
 
=== CHARACTER & PERSONALITY ===
--- Physical Nature & Appearance ---
--- Inner Personality & Emotional World ---
--- Soul Drives & Core Strengths ---
 
=== LIFE SO FAR ===
--- Childhood Years (${parseInt(chart.input.dob)+0} to age 12) ---
--- Teenage & Early Adult Years ---
--- Recent Past (last Dasha before current) ---
 
=== RIGHT NOW — ${curMaha} DASHA ${curAntar} BHUKTI ===
--- What ${curMaha} in H${p[curMaha]?.house} Is Activating ---
--- What ${curAntar} in H${p[curAntar]?.house} Bhukti Brings ---
--- Opportunities & Warnings Right Now ---
 
=== CAREER & EDUCATION ===
--- Your Natural Path & Talents ---
--- When Career Peaks & Key Dasha Years ---
 
=== WEALTH & FINANCES ===
--- How Money Comes To You ---
--- Best Financial Years & Lean Periods ---
 
Write all 5 sections fully now with 2 detailed paragraphs under each sub-heading.`;
}
 
function buildPrompt2(chart, person, question, age, today, yr) {
  const d = chart.dasha;
  const p = chart.planets;
 
  return `You are Jothida Pandithar, master Tamil Jyotish astrologer with 40 years experience.
RULES: Use === TITLE === for sections. Use --- Sub Heading --- inside sections. Write 2 detailed paragraphs under EVERY sub-heading. No bullet points ever. Speak as "you" to ${person.name}. Cite planet+house in every sentence. Be specific with years and ages.
 
CHART:
${getChartSummary(chart, person, age, today)}
${question ? `QUESTION: ${question}` : ''}
 
Write PART 2 of the reading covering exactly these sections:
 
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
--- Doshas Present In This Chart ---
--- Complete Remedies (temples, mantras, gemstones) ---
${question ? `\n=== ANSWER TO YOUR QUESTION ===\n--- ${question} ---` : ''}
 
Write all sections fully now with 2 detailed paragraphs under each sub-heading.`;
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
 
    const today = new Date().toLocaleDateString('en-IN',{day:'2-digit',month:'long',year:'numeric'});
    const age   = Math.floor((Date.now()-new Date(dob))/(365.25*24*3600*1000));
    const yr    = new Date().getFullYear();
 
    const p1 = buildPrompt1(chart, { name, gender: gender||'' }, question, age, today);
    const p2 = buildPrompt2(chart, { name, gender: gender||'' }, question, age, today, yr);
 
    // Run both calls in parallel
    const [msg1, msg2] = await Promise.all([
      anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 3000,
        messages: [{ role: 'user', content: p1 }],
      }),
      anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 3000,
        messages: [{ role: 'user', content: p2 }],
      }),
    ]);
 
    const reading =
      msg1.content.map(c=>c.text||'').join('') +
      '\n\n' +
      msg2.content.map(c=>c.text||'').join('');
 
    res.status(200).json({ ok: true, chart, reading });
 
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
};
