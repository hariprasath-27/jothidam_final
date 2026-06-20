'use strict';
const Anthropic = require('@anthropic-ai/sdk');
const { buildFullChart } = require('./ephemeris');

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function buildShortPrompt(chart, person, question) {
  const p = chart.planets;
  const d = chart.dasha;
  const today = new Date().toLocaleDateString('en-IN',{day:'2-digit',month:'long',year:'numeric'});
  const age = Math.floor((Date.now()-new Date(chart.input.dob))/(365.25*24*3600*1000));
  const planetLines = Object.entries(p).map(([name,data])=>
    `${name}: ${data.rasi} H${data.house} ${data.degInRasi.toFixed(1)}° ${data.status}`
  ).join(' | ');
  const houseOccupants = Object.entries(chart.houses)
    .filter(([,pl])=>pl.length)
    .map(([h,pl])=>`H${h}:${pl.join(',')}`)
    .join(' | ');
  const yogaLines = chart.yogas.map(y=>`${y.name}`).join(', ');
  return `You are Jothida Pandithar, master Tamil Jyotish astrologer. Give a complete detailed reading. Cite planet+house for every point. Use === SECTION === headers.

TODAY: ${today}
Name: ${person.name} | Age: ${age} | Gender: ${person.gender||''}
DOB: ${chart.input.dob} | Time: ${chart.input.tob} | Place: ${chart.input.place}

LAGNA: ${chart.lagna.rasi} (Lord: ${chart.lagna.lord} in H${chart.lagna.lordHouse})
RASI: ${chart.rasi.name} (Lord: ${chart.rasi.lord} in H${p[chart.rasi.lord]?.house})
NAKSHATRA: ${chart.nakshatra.name} Pada ${chart.nakshatra.pada} | Lord: ${chart.nakshatra.lord} | Gana: ${chart.nakshatra.gana} | Nadi: ${chart.nakshatra.nadi}

PLANETS: ${planetLines}
HOUSES: ${houseOccupants}
YOGAS: ${yogaLines}

DASHA: ${d.current?.lord} Mahadasha (${d.current?.startDate?.slice(0,7)} to ${d.current?.endDate?.slice(0,7)})
ANTARDASHA: ${d.currentAntar?.lord} Bhukti (ends ${d.currentAntar?.endDate?.slice(0,7)})
PAST DASHAS: ${d.dashaSequence.filter(ds=>new Date(ds.endDate)<new Date()).slice(-3).map(ds=>`${ds.lord}(${ds.startDate.slice(0,4)}-${ds.endDate.slice(0,4)})`).join(' → ')}
NEXT: ${d.dashaSequence.filter(ds=>new Date(ds.startDate)>new Date()).slice(0,2).map(ds=>`${ds.lord}(${ds.startDate.slice(0,4)}-${ds.endDate.slice(0,4)})`).join(' → ')}
${question?`QUESTION: ${question}`:''}

Write a FULL reading covering ALL these sections with specific details, years, and astrological reasons:

=== CHARACTER & PERSONALITY ===
=== WHAT HAS HAPPENED IN LIFE (Past Dashas) ===
=== CURRENT PERIOD (${d.current?.lord}-${d.currentAntar?.lord} Bhukti) ===
=== CAREER & EDUCATION ===
=== WEALTH & FINANCES ===
=== MARRIAGE & RELATIONSHIPS ===
=== CHILDREN ===
=== HEALTH ===
=== NEXT 5 YEARS (year by year) ===
=== DOSHAS & PARIHARAMS ===`;
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin","*");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: 'POST only' });
  try {
    const { dob, tob, place, name, gender, question, lagna, rasi, nakshatra } = req.body;
    if (!dob || !tob || !place || !name)
      return res.status(400).json({ error: 'dob, tob, place, name required' });
    const chart = buildFullChart(dob, tob, place, {
      lagna: lagna || undefined,
      rasi:  rasi  || undefined,
      nakshatra: nakshatra || undefined,
    });
    const prompt = buildShortPrompt(chart, { name, gender: gender||'not specified' }, question);
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
