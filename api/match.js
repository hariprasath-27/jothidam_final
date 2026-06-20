
'use strict';
const Anthropic = require('@anthropic-ai/sdk');
const { buildFullChart } = require('./ephemeris');
const { calcPorutham } = require('./matching');
 
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
 
const MASTER_SYSTEM = `You are the most knowledgeable Tamil Jyotish astrologer alive. You have 40 years of practice and have mastered all classical texts including Brihat Parasara Hora Shastra, Tamil Nadi texts, and the complete science of marriage matching (Vivaha Porutham).
 
YOUR MARRIAGE MATCHING KNOWLEDGE IS COMPLETE:
— You know all 10 Poruthams: their exact scoring, meaning, and life impact
— You know Rajju Dosha: same Rajju threatens spousal longevity — the most critical factor
— You know Nadi Dosha: same Nadi (Vata/Pitta/Kapha) causes child health issues and temperament clashes — critical
— You know Vedha: blocking nakshatra pairs that create karmic obstacles
— You know Nadi Dosha nullification: same Rasi cancels Nadi Dosha; same Nakshatra cancels it
— You know Mangal Dosha in both charts: if both have it, it cancels; explain exactly
— You know Rasi compatibility: 2-12 and 6-8 relationships are problematic; 5-9 and 4-10 are excellent
— You know Yoni: enemy yoni pairs create physical incompatibility; same yoni is ideal
— You know Ganam: Deva-Rakshasa is incompatible; same gana is best
— You know how individual charts support or weaken the match: 7th house strength, Venus, Jupiter
— You know marriage timing from both Dashas: which period is most auspicious for both
— You know Pariharams: specific temples, mantras, rituals for every Dosha
 
WHAT YOU NEVER DO:
— Never say a Dosha is active without checking ALL nullification conditions
— Never miss explaining what EACH porutham means in daily married life
— Never give vague remedies — always name actual temples and exact mantras
— Never use bullet points — only flowing paragraphs
— Never be generic — every sentence must cite specific porutham scores or planet positions
 
FORMAT:
— === SECTION === for main sections
— --- Sub Heading --- inside sections
— 2 detailed paragraphs minimum under every sub-heading
— Cite exact porutham score (e.g. "Nadi scores 0/8 because...") in every relevant sentence
— Speak warmly — parents and families are reading this`;
 
function buildPersonSummary(chart, name) {
  const p = chart.planets;
  const d = chart.dasha;
  return `${name}: DOB ${chart.input.dob} | Place ${chart.input.place}
  Lagna: ${chart.lagna.rasi} (Lord ${chart.lagna.lord} H${chart.lagna.lordHouse} ${chart.lagna.lordStatus})
  Rasi: ${chart.rasi.name} | Nakshatra: ${chart.nakshatra.name} Pada ${chart.nakshatra.pada}
  Gana: ${chart.nakshatra.gana} | Nadi: ${chart.nakshatra.nadi} | Yoni: ${chart.nakshatra.yoni}
  H7 (marriage): ${chart.houses[7]?.join(',') || 'Empty'} | Venus: ${p.Venus?.rasi} H${p.Venus?.house} ${p.Venus?.status}
  Jupiter: ${p.Jupiter?.rasi} H${p.Jupiter?.house} ${p.Jupiter?.status}
  Mars: ${p.Mars?.rasi} H${p.Mars?.house} ${p.Mars?.status}
  Current Dasha: ${d.current?.lord} H${p[d.current?.lord]?.house} → ${d.currentAntar?.lord} Bhukti (ends ${d.currentAntar?.endDate?.slice(0,7)})`;
}
 
module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
 
  try {
    const { person1, person2 } = req.body;
    if (!person1?.dob || !person2?.dob)
      return res.status(400).json({ error: 'Both persons data required' });
 
    const chart1 = buildFullChart(person1.dob, person1.tob || '06:00', person1.place, {
      lagna: person1.lagna, rasi: person1.rasi, nakshatra: person1.nakshatra,
    });
    const chart2 = buildFullChart(person2.dob, person2.tob || '06:00', person2.place, {
      lagna: person2.lagna, rasi: person2.rasi, nakshatra: person2.nakshatra,
    });
 
    const matchResult = calcPorutham(chart1, chart2);
    const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
 
    const porLines = Object.entries(matchResult.results).map(([name, r]) =>
      `${name} (max ${r.max}): ${r.score}/${r.max} | ${r.pass ? 'PASS' : 'FAIL'}${r.critical ? ' ⚠CRITICAL' : ''}${r.nullified ? ' [NULLIFIED]' : ''} | ${r.note} | Measures: ${r.meaning}`
    ).join('\n');
 
    const mangalStr = matchResult.mangalNotes?.map(m => `[${m.type.toUpperCase()}] ${m.note}`).join('\n') || 'No Mangal Dosha issues';
 
    const p1sum = buildPersonSummary(chart1, person1.name);
    const p2sum = buildPersonSummary(chart2, person2.name);
 
    const matchContext = `TODAY: ${today}
 
═══ ${person1.name} ═══
${p1sum}
 
═══ ${person2.name} ═══
${p2sum}
 
═══ 10 PORUTHAM RESULTS ═══
${porLines}
 
TOTAL: ${matchResult.totalScore}/${matchResult.maxScore} (${matchResult.pct}%)
VERDICT: ${matchResult.verdict}
CRITICAL FAILS: ${matchResult.criticalFails.length ? matchResult.criticalFails.join(', ') : 'None'}
MANGAL DOSHA: ${mangalStr}
BOY RASI-GIRL RASI RELATIONSHIP: ${matchResult.results['Rasi']?.note}
RAJJU: ${matchResult.results['Rajju']?.note}
NADI: ${matchResult.results['Nadi']?.note}`;
 
    // ── 2 parallel calls for match reading ──
    const [r1, r2] = await Promise.all([
 
      // CALL 1 — Porutham analysis + compatibility + individual chart support
      anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2500,
        system: MASTER_SYSTEM,
        messages: [{ role: 'user', content: `${matchContext}
 
Write Part 1 of the marriage compatibility reading. Two paragraphs under every sub-heading. No bullet points. Cite exact porutham scores.
 
=== OVERALL COMPATIBILITY ===
--- Total Score ${matchResult.totalScore}/${matchResult.maxScore} (${matchResult.pct}%) — What It Means for This Couple ---
--- The Strongest Points of This Match ---
 
=== 10 PORUTHAM — COMPLETE ANALYSIS ===
--- Rajju (${matchResult.results['Rajju']?.score}/${matchResult.results['Rajju']?.max}): Longevity Analysis — Pass or Fail and Exact Life Impact ---
--- Nadi (${matchResult.results['Nadi']?.score}/${matchResult.results['Nadi']?.max}): Children Health & Temperament — ACTIVE or NULLIFIED with Reason ---
--- Vedham (${matchResult.results['Vedham']?.score}/${matchResult.results['Vedham']?.max}) & Rajju: Karmic Obstacles Analysis ---
--- Rasi (${matchResult.results['Rasi']?.score}/${matchResult.results['Rasi']?.max}): ${matchResult.boyRasi}–${matchResult.girlRasi} Relationship — Mental Compatibility ---
--- Ganam (${matchResult.results['Ganam']?.score}/${matchResult.results['Ganam']?.max}): Temperament Compatibility — Daily Life Impact ---
--- Yoni (${matchResult.results['Yoni']?.score}/${matchResult.results['Yoni']?.max}): Physical Harmony — ${matchResult.results['Yoni']?.note} ---
--- Dinam, Mahendram, Sthree Dhirgham, Vasiyam: Remaining 4 Poruthams ---
 
=== EMOTIONAL & MENTAL COMPATIBILITY ===
--- How Their Minds and Emotions Work Together Day to Day ---
--- Where They Will Agree Naturally & Where Friction Will Arise ---
 
=== PHYSICAL & INTIMATE COMPATIBILITY ===
--- Yoni Porutham Impact on Physical Life ---
--- Mangal Dosha in Both Charts: ${mangalStr} ---
 
=== FINANCIAL COMPATIBILITY ===
--- Combined Financial Strength from Both Individual Charts ---
--- How They Will Handle Money Together ---
 
=== CHILDREN & FAMILY LIFE ===
--- Nadi Dosha Impact on Children (ACTIVE or NULLIFIED — state exactly) ---
--- Family Life, Home Environment, Parenting Style Together ---` }]
      }),
 
      // CALL 2 — Marriage timing + Doshas + Remedies + Final verdict
      anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2500,
        system: MASTER_SYSTEM,
        messages: [{ role: 'user', content: `${matchContext}
 
Write Part 2 of the marriage compatibility reading. Two paragraphs under every sub-heading. No bullet points.
 
=== INDIVIDUAL CHART SUPPORT FOR MARRIAGE ===
--- ${person1.name}'s 7th House Strength: What It Promises for Marriage ---
--- ${person2.name}'s 7th House Strength: What It Promises for Marriage ---
 
=== BEST TIME TO MARRY ===
--- Best Year and Period Based on ${person1.name}'s Dasha Timeline ---
--- Best Year and Period Based on ${person2.name}'s Dasha Timeline ---
--- The Ideal Marriage Window Where Both Dashas Align ---
 
=== DOSHAS — ACTIVE OR NULLIFIED ===
--- Every Critical Dosha: State ACTIVE or NULLIFIED, Exact Reason, Exact Impact if Active ---
--- Mangal Dosha in Both Charts: Cross-Analysis and Conclusion ---
 
=== COMPLETE PARIHARAMS ===
--- Remedy for Nadi Dosha (if active): Specific temple name in Tamil Nadu or Kerala, deity, day, mantra with count, gemstone ---
--- Remedy for Rasi Dosha (if active): Complete remedy ---
--- Remedy for Any Other Active Dosha ---
 
=== FINAL RECOMMENDATION ===
--- Complete Verdict for the Families: Should They Proceed, With What Conditions ---
--- What This Marriage Will Look Like in 5 Years, 15 Years, 30 Years ---` }]
      }),
    ]);
 
    const reading = [r1, r2]
      .map(r => r.content.map(c => c.text || '').join(''))
      .join('\n\n');
 
    res.status(200).json({ ok: true, chart1, chart2, matchResult, reading });
 
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
};
