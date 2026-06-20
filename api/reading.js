
'use strict';
const Anthropic = require('@anthropic-ai/sdk');
const { buildFullChart, HOUSE_SIGNIF } = require('./ephemeris');
 
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
 
// ── Master system prompt — one-percent astrologer ──
const MASTER_SYSTEM = `You are the most knowledgeable Tamil Jyotish astrologer alive. You have 40 years of direct practice and have memorised Brihat Parasara Hora Shastra, Jaimini Sutras, Phala Deepika, Saravali, and classical Tamil Nadi texts. Families travel from distant villages to consult you. Your reputation rests entirely on accuracy.
 
YOUR KNOWLEDGE IS COMPLETE:
— You know every Yoga: how it forms, when it activates, what it gives, what cancels it
— You know every Dosha: exact conditions, exact nullification rules, exact severity
— You know Dasha system completely: which Mahadasha period gave what result, what the current period is activating RIGHT NOW, what is coming
— You know planetary strength (Bala): exalted planets give full results, debilitated give reversed results, own-sign gives steady results, friendly gives 75%, neutral gives 50%, enemy gives 25%
— You know house significations deeply: which planets ruling which houses create which results when conjoined or aspecting
— You know transit effects (Gochara): especially Saturn and Jupiter transits over natal Moon
— You know Neecha Bhanga: exactly when a debilitated planet becomes a Raja Yoga
— You know Vipareeta Raja Yoga: exactly when 6th/8th/12th lords in dusthanas create unexpected power
— You know exact Mangal Dosha rules and all 8 cancellation conditions
— You know Kaal Sarpa: ascending vs descending, which houses Rahu-Ketu occupy, what it gives, what reduces it
— You know Nakshatra qualities: each nakshatra's deity, symbol, nature, what kind of person it produces
— You know Nadi: Vata/Pitta/Kapha constitution and how it affects health, temperament, longevity
 
WHAT YOU NEVER DO:
— Never give vague statements like "good results expected" — always say WHY (which planet in which house)
— Never miss a Dosha — check all classical Doshas
— Never miss a Yoga — check all major Yogas
— Never say a Dosha is active without checking ALL nullification conditions
— Never guess — if you are citing a planet's position, it must match the chart given
— Never use bullet points — only flowing paragraphs with clear headings
— Never be generic — every sentence must be specific to THIS person's chart
 
FORMAT:
— === SECTION TITLE === for main sections
— --- Sub Heading --- for sub-topics inside sections
— 2 detailed paragraphs minimum under every sub-heading
— Speak directly to the person as "you"
— Be warm, authoritative, specific`;
 
function buildChartContext(chart, person, age, today) {
  const p = chart.planets;
  const d = chart.dasha;
 
  const planetLines = Object.entries(p).map(([n,x]) =>
    `${n}: ${x.rasi} H${x.house} ${x.degInRasi.toFixed(2)}° | ${x.status} | Bala:${x.bala} | Nakshatra:${x.nakshatra} P${x.pada} | Aspects H:${x.aspects?.join(',')}`
  ).join('\n');
 
  const yogaLines = chart.yogas.map(y =>
    `[${y.type.toUpperCase()}${y.nullified ? ' NULLIFIED' : ''}] ${y.name}: ${y.desc}${y.nullifiers?.length ? ' | NULLIFIED BY: ' + y.nullifiers.join('; ') : ''}`
  ).join('\n');
 
  const houseLines = Object.entries(chart.houses)
    .map(([h, pl]) => `H${h} (${HOUSE_SIGNIF[h]?.split(',')[0]}): ${pl.length ? pl.join(', ') : 'Empty'}`)
    .join('\n');
 
  const aspectLines = Object.entries(chart.houseAspects || {})
    .filter(([, pl]) => pl.length)
    .map(([h, pl]) => `H${h} aspected by: ${pl.join(', ')}`)
    .join(' | ');
 
  const antarLines = d.antardashas.map(a =>
    `${d.current?.lord}-${a.lord}: ${a.startDate.slice(0,7)} to ${a.endDate.slice(0,7)}${a === d.currentAntar ? ' ← NOW' : ''}`
  ).join('\n');
 
  const prayantarLines = d.prayantardashas?.map(a =>
    `${d.current?.lord}-${d.currentAntar?.lord}-${a.lord}: ${a.startDate.slice(0,7)} to ${a.endDate.slice(0,7)}`
  ).join('\n') || '';
 
  const pastDashas = d.dashaSequence
    .filter(ds => new Date(ds.endDate) < new Date())
    .slice(-5)
    .map(ds => `${ds.lord}: ${ds.startDate.slice(0,7)} to ${ds.endDate.slice(0,7)} (${ds.years.toFixed(1)} yrs)`)
    .join('\n');
 
  const futureDashas = d.dashaSequence
    .filter(ds => new Date(ds.startDate) > new Date())
    .slice(0, 4)
    .map(ds => `${ds.lord}: ${ds.startDate.slice(0,7)} to ${ds.endDate.slice(0,7)} (${ds.years.toFixed(1)} yrs)`)
    .join('\n');
 
  return `═══ VERIFIED BIRTH CHART ═══
Person: ${person.name} | Age: ${age} | Gender: ${person.gender || ''} | Today: ${today}
DOB: ${chart.input.dob} | Time: ${chart.input.tob} | Place: ${chart.input.place}
Ayanamsha: Lahiri ${chart.ayanamsha}° (Sidereal)
 
LAGNA: ${chart.lagna.rasi} (${chart.lagna.rasiEn}) ${chart.lagna.degInRasi.toFixed(2)}°
  Lord: ${chart.lagna.lord} in H${chart.lagna.lordHouse} — ${chart.lagna.lordStatus}
RASI: ${chart.rasi.name} (${chart.rasi.en}) | Lord: ${chart.rasi.lord} in H${p[chart.rasi.lord]?.house}
NAKSHATRA: ${chart.nakshatra.name} (${chart.nakshatra.tamil}) Pada ${chart.nakshatra.pada}
  Lord: ${chart.nakshatra.lord} | Deity: ${chart.nakshatra.deity} | Symbol: ${chart.nakshatra.symbol}
  Gana: ${chart.nakshatra.gana} | Nadi: ${chart.nakshatra.nadi} | Yoni: ${chart.nakshatra.yoni} | Type: ${chart.nakshatra.type}
 
ALL 9 PLANETS:
${planetLines}
 
HOUSES (occupants):
${houseLines}
 
HOUSE ASPECTS:
${aspectLines}
 
ALL YOGAS & DOSHAS (nullification checked):
${yogaLines}
 
VIMSHOTTARI DASHA:
Past Dashas:
${pastDashas}
 
Current Mahadasha: ${d.current?.lord} in H${p[d.current?.lord]?.house} (${d.current?.status || p[d.current?.lord]?.status})
  Period: ${d.current?.startDate} → ${d.current?.endDate}
Current Antardasha: ${d.currentAntar?.lord} in H${p[d.currentAntar?.lord]?.house}
  Period: ${d.currentAntar?.startDate} → ${d.currentAntar?.endDate}
 
Praryantar Dashas in current Antardasha:
${prayantarLines}
 
All Antardashas in ${d.current?.lord} Mahadasha:
${antarLines}
 
Upcoming Mahadashas:
${futureDashas}`;
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
 
    const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
    const age   = Math.floor((Date.now() - new Date(dob)) / (365.25 * 24 * 3600 * 1000));
    const yr    = new Date().getFullYear();
    const p     = chart.planets;
    const d     = chart.dasha;
    const curM  = d.current?.lord;
    const curA  = d.currentAntar?.lord;
    const cs    = buildChartContext(chart, { name, gender }, age, today);
 
    // ── 3 parallel calls — each section focused ──
    const [r1, r2, r3] = await Promise.all([
 
      // CALL 1 — Who they are + what happened + right now
      anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2000,
        system: MASTER_SYSTEM,
        messages: [{ role: 'user', content: `${cs}
 
Write Part 1. Two paragraphs under every sub-heading. No bullet points.
 
=== CHARACTER & PERSONALITY ===
--- Physical Appearance & Presence from ${chart.lagna.rasi} Lagna (Lord ${chart.lagna.lord} in H${chart.lagna.lordHouse} ${chart.lagna.lordStatus}) ---
--- Emotional Nature from Moon in H${p.Moon?.house} in ${p.Moon?.nakshatra} Nakshatra ---
--- Soul Character from ${chart.nakshatra.name} (${chart.nakshatra.deity} deity, ${chart.nakshatra.type} nature) ---
--- Key Strengths, Deep Weaknesses, What Drives ${name} ---
 
=== WHAT HAS HAPPENED IN LIFE ===
--- Childhood (${d.dashaSequence[0]?.lord} Dasha, ${d.dashaSequence[0]?.startDate?.slice(0,4)}–${d.dashaSequence[1]?.startDate?.slice(0,4)}): ${p[d.dashaSequence[0]?.lord]?.status} in H${p[d.dashaSequence[0]?.lord]?.house} ---
--- Growing Years (${d.dashaSequence[1]?.lord} Dasha, ${d.dashaSequence[1]?.startDate?.slice(0,4)}–${d.dashaSequence[2]?.startDate?.slice(0,4)}) ---
--- Recent Past (${d.dashaSequence.filter(ds=>new Date(ds.endDate)<new Date()).slice(-1)[0]?.lord} Dasha before current) ---
 
=== RIGHT NOW — ${curM} MAHADASHA ${curA} BHUKTI ===
--- ${curM} in H${p[curM]?.house} (${p[curM]?.status}, Bala ${p[curM]?.bala}): What It Is Activating ---
--- ${curA} in H${p[curA]?.house} (${p[curA]?.status}): What It Is Adding Right Now ---
--- Exact Opportunities Open Now & Specific Dangers to Navigate ---` }]
      }),
 
      // CALL 2 — Career, Wealth, Marriage, Children, Health
      anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 3000,
        system: MASTER_SYSTEM,
        messages: [{ role: 'user', content: `${cs}
 
Write Part 2. Two paragraphs under every sub-heading. No bullet points.
 
=== CAREER & EDUCATION ===
--- Natural Profession & Talents (H10: ${chart.houses[10]?.join(',') || 'Empty'}, 10th lord, Sun H${p.Sun?.house}) ---
--- When Career Peaks: Exact Dasha Periods & Years ---
 
=== WEALTH & FINANCES ===
--- How Wealth Comes (H2: ${chart.houses[2]?.join(',') || 'Empty'}, H11: ${chart.houses[11]?.join(',') || 'Empty'}, Jupiter H${p.Jupiter?.house} ${p.Jupiter?.status}) ---
--- Best Financial Years & Lean Periods Based on Dasha ---
 
=== MARRIAGE & RELATIONSHIPS ===
--- Life Partner: Nature, Qualities, Love or Arranged (H7: ${chart.houses[7]?.join(',') || 'Empty'}, Venus H${p.Venus?.house} ${p.Venus?.status}) ---
--- Marriage Timing: Which Exact Dasha Period & Approximate Year ---
--- Married Life: Harmony, Challenges, What ${name} Needs in a Partner ---
--- Mangal Dosha: ${chart.yogas.find(y => y.name.includes('Mangal'))?.name || 'Not present'} — Full Analysis ---
 
=== CHILDREN ===
--- Children Prospects, Timing (H5: ${chart.houses[5]?.join(',') || 'Empty'}, Jupiter H${p.Jupiter?.house}) ---
 
=== HEALTH ===
--- Physical Constitution (${chart.nakshatra.nadi} Nadi, Lagna lord H${chart.lagna.lordHouse}) & Vulnerable Areas ---
--- Health Timeline: Which Dasha Periods Need Care (H6: ${chart.houses[6]?.join(',') || 'Empty'}, H8: ${chart.houses[8]?.join(',') || 'Empty'}) ---` }]
      }),
 
      // CALL 3 — Next 5 years + Doshas & Remedies
      anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 3000,
        system: MASTER_SYSTEM,
        messages: [{ role: 'user', content: `${cs}
 
Write Part 3. Two paragraphs under every sub-heading. No bullet points.
 
=== NEXT 5 YEARS — YEAR BY YEAR ===
--- ${yr}: Antardasha running, exact events likely in career, money, relationships, health ---
--- ${yr+1}: Antardasha, what opens and what to avoid ---
--- ${yr+2}: Antardasha, major turning points ---
--- ${yr+3}: Antardasha, themes and predictions ---
--- ${yr+4}: Antardasha, what this year holds ---
 
=== SPECIAL STRENGTHS OF THIS CHART ===
--- Exceptional Yogas Present and Their Specific Life Gifts ---
--- The Strongest Planet in the Chart and What It Promises ---
 
=== DOSHAS & PARIHARAMS ===
--- For Every Dosha in the Chart: Is It ACTIVE or NULLIFIED? Exact Reason Either Way ---
--- Complete Remedy for Every ACTIVE Dosha: Specific temple (name it), deity, day, mantra with exact count, gemstone with finger and metal, colour, food donation ---
${question ? `\n=== ANSWER TO YOUR QUESTION ===\n--- ${question}: Specific Astrological Answer with Timing ---` : ''}` }]
      }),
    ]);
 
    const reading = [r1, r2, r3]
      .map(r => r.content.map(c => c.text || '').join(''))
      .join('\n\n');
 
    res.status(200).json({ ok: true, chart, reading });
 
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
};
