
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
 
  return `You are Jothida Pandithar, master Tamil Jyotish astrologer with 40 years experience. Write a deeply detailed reading for ${person.name}.
 
FORMATTING RULES — FOLLOW EXACTLY:
- Use === SECTION TITLE === for every main section header
- Use --- Sub Topic --- for sub-headings inside each section
- Write 2 to 3 paragraphs under each sub-heading
- Never use bullet points or dashes as lists
- Every sentence must name the exact planet and house number
- Speak directly to ${person.name} as "you"
- Be specific with years and ages always
 
TODAY: ${today} | Name: ${person.name} | Age: ${age} | Gender: ${person.gender||''}
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
 
DASHA: ${curMaha} Mahadasha (${d.current?.startDate?.slice(0,7)} to ${d.current?.endDate?.slice(0,7)})
CURRENT ANTARDASHA: ${curAntar} Bhukti
ALL ANTARDASHAS:
${antarLines}
PAST DASHAS:
${pastDashas}
NEXT MAHADASHA: ${nextDasha?.lord} from ${nextDasha?.startDate?.slice(0,7)}
${question ? `QUESTION FROM ${person.name}: ${question}` : ''}
 
Now write the full reading using === and --- formatting as shown below. Every section must be detailed.
 
=== CHARACTER & PERSONALITY ===
 
--- Physical Appearance & First Impression ---
Two paragraphs on how ${person.name} looks and presents to the world from ${chart.lagna.rasi} Lagna. What ${chart.lagna.lord} in H${lagnaLordH} adds to the physical self.
 
--- Inner Nature & Emotional World ---
Two paragraphs on the inner personality from ${chart.rasi.name} Rasi with its lord in H${rasiLordH}. The emotional world from Moon in H${moonH}. How they feel things deeply inside versus what they show outside.
 
--- Soul Nature & Core Drives ---
Two paragraphs on ${chart.nakshatra.name} Nakshatra with ${chart.nakshatra.gana} Gana and ${chart.nakshatra.nadi} Nadi. What drives ${person.name} at the soul level. Their deepest strengths and genuine blind spots.
 
=== WHAT HAS HAPPENED IN LIFE ===
 
--- Childhood & Early Years ---
Two paragraphs on the earliest Dasha periods. What the Dasha lords' positions in the chart brought during childhood years. Key events, family environment, early shaping influences.
 
--- Teenage Years & Education ---
Two paragraphs on the Dasha period covering ages 12 to 18. What this lord in its house position caused. Education, friendships, challenges, first ambitions.
 
--- Early Adulthood ---
Two paragraphs on the most recent past Dasha covering ages 18 to now. Career beginnings, relationships, turning points, what was gained and what was lost.
 
=== CURRENT PERIOD — ${curMaha} DASHA ${curAntar} BHUKTI ===
 
--- What ${curMaha} Mahadasha Means For You ---
Two paragraphs explaining ${curMaha} placed in H${p[curMaha]?.house}. Which houses it rules. What major themes it has activated since it started. How this Mahadasha has been reshaping ${person.name}'s life.
 
--- What ${curAntar} Bhukti Is Bringing Right Now ---
Two paragraphs on ${curAntar} placed in H${p[curAntar]?.house}. Whether it harmonises or creates tension with the Mahadasha lord. What is specifically active right now in career, relationships, finances, and inner life.
 
--- Opportunities & Warnings For This Period ---
Two paragraphs on what ${person.name} must not miss right now and what dangers to navigate carefully in this exact Dasha-Bhukti combination.
 
=== CAREER & EDUCATION ===
 
--- Natural Career Path ---
Two paragraphs on H10 (${h10}), 10th lord, Sun in H${sunH}. What profession is written in the stars. The specific fields and roles that suit ${person.name} and the astrological reason.
 
--- Career Timeline & Peak Years ---
Two paragraphs on Mercury in H${mercH} and Saturn in H${satH}. When career truly takes off. Which specific Dasha period brings the big breakthrough. The years of peak professional achievement.
 
=== WEALTH & FINANCES ===
 
--- How Money Comes ---
Two paragraphs on H2 (${h2}), H11 (${h11}), Jupiter in H${jupH}. Whether wealth comes through job, business, or other means. Their natural relationship with money.
 
--- Financial Timeline ---
Two paragraphs on the best financial years and the lean periods based on Dasha. When abundance arrives and when to be careful.
 
=== MARRIAGE & RELATIONSHIPS ===
 
--- Your Life Partner ---
Two paragraphs on H7 (${h7}), Venus in H${venH}, Jupiter in H${jupH}. The nature, character, and qualities of the destined life partner. Love or arranged marriage and why astrologically.
 
--- Marriage Timing & Married Life ---
Two paragraphs on which Dasha period brings marriage and approximate timing. What married life looks like — areas of deep harmony and areas of challenge. How ${person.name} gives and receives love.
 
--- Mangal Dosha & Remedy ---
Two paragraphs on Mars in H${marsH}. Whether Mangal Dosha is present and exactly what effect it has. The specific remedy.
 
=== CHILDREN ===
 
--- Children & Family ---
Two paragraphs on H5 (${h5}) and Jupiter in H${jupH}. Prospects for children and timing. The kind of parent ${person.name} will be and the relationship with their children.
 
=== HEALTH ===
 
--- Physical Constitution ---
Two paragraphs on Lagna lord in H${lagnaLordH} and ${chart.nakshatra.nadi} Nadi constitution. The fundamental body type and immunity. Which body parts are strong and which are vulnerable.
 
--- Health Warnings & Care Periods ---
Two paragraphs on H6 (${h6}), H8 (${h8}) and their lords. Specific disease tendencies to watch. Which Dasha periods need extra health care. Mental and emotional health from Moon in H${moonH}.
 
=== NEXT 5 YEARS — YEAR BY YEAR ===
 
--- ${yr} ---
One paragraph: which Antardasha is running, what it means in this chart, what to expect and what to do this year.
 
--- ${yr+1} ---
One paragraph: Antardasha, what it brings for career, money, relationships, health.
 
--- ${yr+2} ---
One paragraph: Antardasha, what it brings and key focus area.
 
--- ${yr+3} ---
One paragraph: Antardasha, major events and themes.
 
--- ${yr+4} ---
One paragraph: Antardasha, what this year holds.
 
--- ${yr+5} ---
One paragraph: Antardasha, the year's promise and challenges.
 
=== DOSHAS & PARIHARAMS ===
 
--- Doshas Present In This Chart ---
Two paragraphs naming every Dosha, what problem each creates, and the astrological reason.
 
--- Complete Remedies ---
Two paragraphs giving the full remedy for each Dosha — specific temple name in Tamil Nadu or Kerala, presiding deity, day of week, exact mantra and number of times to chant, gemstone with finger and metal, colour to wear, food to donate. Make every remedy practical and doable immediately.${question ? `
 
=== ANSWER TO YOUR QUESTION ===
 
--- ${question} ---
Two paragraphs giving a specific, honest, astrologically reasoned answer with clear timing.` : ''}`;
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
      rasi:  rasi  || undefined,
      nakshatra: nakshatra || undefined,
    });
 
    const prompt = buildPrompt(chart, { name, gender: gender || '' }, question);
 
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
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
