
'use strict';
const { NAK_NAMES, NAK_LORD, NAK_GANA, NAK_NADI, NAK_YONI, RASI_NAMES } = require('./ephemeris');
 
// ── Yoni compatibility (complete table from classical texts) ──
// Friendly yoni pairs (score 4 or 3)
const YONI_FRIENDLY = {
  Horse:['Horse'],       // same = 4
  Elephant:['Elephant'], Sheep:['Sheep'], Serpent:['Serpent'],
  Dog:['Dog'],           Cat:['Cat'],     Rat:['Rat'],
  Cow:['Cow'],           Buffalo:['Buffalo'],
  Tiger:['Deer'],        Deer:['Tiger'],   // friendly pair = 3
  Monkey:['Mongoose'],   Mongoose:['Monkey'],
  Lion:['Lion']
};
const YONI_ENEMY = {
  // True enemy pairs (score 0)
  Horse:['Buffalo'],   Buffalo:['Horse'],
  Dog:['Deer'],        Deer:['Dog'],
  Serpent:['Mongoose'],Mongoose:['Serpent'],
  Rat:['Cat'],         Cat:['Rat'],
  Elephant:['Lion'],   Lion:['Elephant'],
  Sheep:['Monkey'],    Monkey:['Sheep'],
  Tiger:['Cow'],       Cow:['Tiger']
};
 
function getYoniScore(b, g) {
  if (b === g) return { score: 4, note: `Same Yoni (${b}) — excellent sexual and physical harmony` };
  if (YONI_FRIENDLY[b]?.includes(g) || YONI_FRIENDLY[g]?.includes(b))
    return { score: 3, note: `Friendly Yoni (${b}–${g}) — good harmony` };
  if (YONI_ENEMY[b]?.includes(g) || YONI_ENEMY[g]?.includes(b))
    return { score: 0, note: `Enemy Yoni (${b}–${g}) — physical incompatibility` };
  return { score: 2, note: `Neutral Yoni (${b}–${g}) — acceptable` };
}
 
// ── Rajju (5 groups, each group has Ascending/Descending sub-type) ──
// Nakshatra numbers 1-27
// Siro (head): 7,8,9 | 16,17,18 | 25,26,27
// Kanta (neck): 1,2,3 | 10,11,12 | 19,20,21
// Nabhi (navel): 4,5,6 | 13,14,15 | 22,23,24
// Wait — classical Tamil Rajju is different from North Indian
// Tamil Rajju (5 types, cyclic):
const RAJJU_MAP = {
  1:'Pada',  2:'Nabhi', 3:'Nabhi', 4:'Kanta', 5:'Kanta',
  6:'Siro',  7:'Siro',  8:'Nabhi', 9:'Nabhi', 10:'Kanta',
  11:'Kanta',12:'Pada', 13:'Pada', 14:'Nabhi',15:'Nabhi',
  16:'Kanta',17:'Kanta',18:'Siro', 19:'Siro', 20:'Nabhi',
  21:'Nabhi',22:'Kanta',23:'Kanta',24:'Pada', 25:'Pada',
  26:'Nabhi',27:'Nabhi'
};
 
function getRajju(nakIdx) {
  return RAJJU_MAP[nakIdx + 1] || 'Pada';
}
 
// ── Vedha pairs (obstacles) — classical list ──
const VEDHA_PAIRS = [
  [1,18],[2,16],[3,14],[4,12],[5,20],[6,22],[7,24],
  [8,9],[10,25],[11,26],[13,27],[15,21],[17,19]
];
 
// ── Vasiyam pairs (attraction) ──
// Boy Rasi → can control Girl Rasi
const VASIYAM = {
  'Mesha':   ['Vrischika','Kumbha'],
  'Rishabha':['Kataka','Tula'],
  'Mithuna': ['Kanya'],
  'Kataka':  ['Vrischika','Dhanu'],
  'Simha':   ['Tula'],
  'Kanya':   ['Mithuna','Meena'],
  'Tula':    ['Makara','Mesha'],
  'Vrischika':['Kataka'],
  'Dhanu':   ['Meena'],
  'Makara':  ['Mesha'],
  'Kumbha':  ['Mesha'],
  'Meena':   ['Makara']
};
 
// ── Rasi compatibility — correct classical rules ──
// CORRECT: Count from boy to girl rasi (not absolute diff)
// 2-12 (2nd and 12th) = bad
// 6-8 (6th and 8th) = bad  
// Same = neutral (score 4)
// 5-9, 4-10 = excellent
// 3-11, 1-7 = good
// Others = neutral
function getRasiScore(bIdx, gIdx) {
  // Count from boy to girl
  const boyToGirl = ((gIdx - bIdx + 12) % 12) + 1; // 1-12
  const girlToBoy = ((bIdx - gIdx + 12) % 12) + 1;
 
  // Same rasi
  if (bIdx === gIdx) return { score: 4, note: `Same Rasi (${RASI_NAMES[bIdx]}) — can be good or bad depending on other factors`, pass: true };
 
  // 2-12 relationship (2nd from each other in either direction)
  if (boyToGirl === 2 || girlToBoy === 2)
    return { score: 0, note: `2-12 relationship (${RASI_NAMES[bIdx]}–${RASI_NAMES[gIdx]}) — inauspicious, financial and domestic tension`, pass: false };
 
  // 6-8 relationship
  if (boyToGirl === 6 || girlToBoy === 6)
    return { score: 0, note: `6-8 relationship (${RASI_NAMES[bIdx]}–${RASI_NAMES[gIdx]}) — conflict, health issues`, pass: false };
 
  // 5-9 (most auspicious)
  if (boyToGirl === 5 || girlToBoy === 5 || boyToGirl === 9 || girlToBoy === 9)
    return { score: 7, note: `5-9 relationship (${RASI_NAMES[bIdx]}–${RASI_NAMES[gIdx]}) — excellent, harmonious, auspicious`, pass: true };
 
  // 4-10 (good)
  if (boyToGirl === 4 || girlToBoy === 4 || boyToGirl === 10 || girlToBoy === 10)
    return { score: 6, note: `4-10 relationship (${RASI_NAMES[bIdx]}–${RASI_NAMES[gIdx]}) — good, stable`, pass: true };
 
  // 3-11 (good)
  if (boyToGirl === 3 || girlToBoy === 3 || boyToGirl === 11 || girlToBoy === 11)
    return { score: 5, note: `3-11 relationship (${RASI_NAMES[bIdx]}–${RASI_NAMES[gIdx]}) — favorable`, pass: true };
 
  // 1-7 (neutral/ok)
  if (boyToGirl === 7)
    return { score: 4, note: `7th relationship (${RASI_NAMES[bIdx]}–${RASI_NAMES[gIdx]}) — neutral, acceptable`, pass: true };
 
  return { score: 4, note: `Neutral Rasi relationship (${RASI_NAMES[bIdx]}–${RASI_NAMES[gIdx]})`, pass: true };
}
 
// ── Nadi Dosha Nullification ──
function checkNadiNullification(bChart, gChart) {
  const nullifiers = [];
  // Rule 1: Different Nakshatra but same Nadi — check if same Rasi (nullifies)
  if (bChart.rasi.index === gChart.rasi.index)
    nullifiers.push('Same Rasi — Nadi Dosha is cancelled when Rasi is same');
  // Rule 2: Same Nakshatra (very rare, but nullifies)
  if (bChart.nakshatra.index === gChart.nakshatra.index)
    nullifiers.push('Same Nakshatra — Nadi Dosha cancelled');
  // Rule 3: Same Nakshatra lord but different Nakshatras — partial reduction
  if (bChart.nakshatra.lord === gChart.nakshatra.lord && bChart.nakshatra.index !== gChart.nakshatra.index)
    nullifiers.push('Same Nakshatra lord — Nadi effect reduced');
  return nullifiers;
}
 
// ── Mangal Dosha in marriage context ──
function checkMangalDosha(chart, label) {
  const marsHouse = chart.planets?.Mars?.house;
  if (!marsHouse) return null;
  if (![1,2,4,7,8,12].includes(marsHouse)) return null;
  // Check if nullified
  const nullifiers = [];
  if (chart.planets.Mars.status.includes('Exalted') || chart.planets.Mars.status.includes('Own'))
    nullifiers.push('Mars exalted/own sign');
  if ([0,7].includes(chart.lagna.rasiIdx)) nullifiers.push('Mesha/Vrischika Lagna');
  const jupAspectsMars = chart.planets.Jupiter.aspects?.includes(marsHouse);
  if (jupAspectsMars) nullifiers.push('Jupiter aspects Mars');
  return { house: marsHouse, nullified: nullifiers.length > 0, nullifiers, label };
}
 
// ── Main calculation ──
function calcPorutham(boyChart, girlChart) {
  const bNakIdx  = boyChart.nakshatra.index;
  const gNakIdx  = girlChart.nakshatra.index;
  const bRasiIdx = boyChart.rasi.index;
  const gRasiIdx = girlChart.rasi.index;
  const bGana    = boyChart.nakshatra.gana;
  const gGana    = girlChart.nakshatra.gana;
  const bNadi    = boyChart.nakshatra.nadi;
  const gNadi    = girlChart.nakshatra.nadi;
  const bYoni    = boyChart.nakshatra.yoni;
  const gYoni    = girlChart.nakshatra.yoni;
 
  const results = {};
 
  // ── 1. DINAM ──
  // Count from boy to girl, divide by 9, remainder NOT 1,3,5,7 = good
  const dinam    = ((gNakIdx - bNakIdx + 27) % 27) + 1;
  const dinRem   = dinam % 9 || 9;
  const dinPass  = ![1,3,5,7].includes(dinRem);
  results['Dinam'] = {
    score: dinPass ? 3 : 0, max: 3, pass: dinPass, critical: false,
    note: `Boy→Girl count: ${dinam}, remainder: ${dinRem} — ${dinPass ? 'Auspicious (good health and longevity)' : 'Inauspicious'}`,
    meaning: 'Health, longevity, friendship'
  };
 
  // ── 2. GANAM ──
  const ganaTable = {
    'Deva-Deva': { score:6, note:'Same Deva gana — excellent, virtuous and harmonious', pass:true },
    'Manushya-Manushya': { score:6, note:'Same Manushya gana — excellent, practical balance', pass:true },
    'Rakshasa-Rakshasa': { score:6, note:'Same Rakshasa gana — acceptable, both strong-willed', pass:true },
    'Deva-Manushya': { score:5, note:'Deva-Manushya — good, complementary natures', pass:true },
    'Manushya-Deva': { score:5, note:'Manushya-Deva — good, complementary natures', pass:true },
    'Deva-Rakshasa': { score:0, note:'Deva-Rakshasa — incompatible temperaments, constant friction', pass:false },
    'Rakshasa-Deva': { score:0, note:'Rakshasa-Deva — incompatible temperaments', pass:false },
    'Manushya-Rakshasa': { score:2, note:'Manushya-Rakshasa — challenging but manageable with effort', pass:false },
    'Rakshasa-Manushya': { score:2, note:'Rakshasa-Manushya — challenging but manageable', pass:false },
  };
  const ganaKey = `${bGana}-${gGana}`;
  const ganaResult = ganaTable[ganaKey] || { score:3, note:'Neutral Gana combination', pass:true };
  results['Ganam'] = { ...ganaResult, max: 6, critical: false, meaning: 'Temperament, personality compatibility' };
 
  // ── 3. MAHENDRAM ──
  // Count from girl to boy nak. If 4,7,10,13,16,19,22,25 = good
  const mah = ((bNakIdx - gNakIdx + 27) % 27) + 1;
  const mahPass = [4,7,10,13,16,19,22,25].includes(mah);
  results['Mahendram'] = {
    score: mahPass ? 2 : 0, max: 2, pass: mahPass, critical: false,
    note: `Girl→Boy count: ${mah} — ${mahPass ? 'Mahendram present — prosperity and long happy married life' : 'No Mahendram'}`,
    meaning: 'Prosperity, good fortune in marriage'
  };
 
  // ── 4. STHREE DHIRGHAM ──
  // Count from boy nak to girl nak. If >= 7 = good for girl's prosperity
  // Note: Some traditions say >7, some say >=9. Using >=7 (traditional Tamil rule)
  const sd = ((gNakIdx - bNakIdx + 27) % 27) + 1;
  const sdPass = sd >= 7;
  results['Sthree Dhirgham'] = {
    score: sdPass ? 2 : 0, max: 2, pass: sdPass, critical: false,
    note: `Boy→Girl distance: ${sd} nakshatras — ${sdPass ? 'Good (≥7) — wife prospers' : 'Too close (<7) — may affect wife\'s prosperity'}`,
    meaning: 'Wife\'s prosperity and happiness'
  };
 
  // ── 5. YONI ──
  const yoniResult = getYoniScore(bYoni, gYoni);
  results['Yoni'] = {
    score: yoniResult.score, max: 4, pass: yoniResult.score >= 2, critical: false,
    note: yoniResult.note,
    meaning: 'Physical compatibility, intimate harmony'
  };
 
  // ── 6. RASI ──
  const rasiResult = getRasiScore(bRasiIdx, gRasiIdx);
  results['Rasi'] = {
    score: rasiResult.score, max: 7, pass: rasiResult.pass, critical: false,
    note: rasiResult.note,
    meaning: 'Mental compatibility, family harmony'
  };
 
  // ── 7. RAJJU ──  CRITICAL
  const bRajju = getRajju(bNakIdx);
  const gRajju = getRajju(gNakIdx);
  const rajjuPass = bRajju !== gRajju;
  results['Rajju'] = {
    score: rajjuPass ? 8 : 0, max: 8, pass: rajjuPass, critical: true,
    note: `${bRajju}–${gRajju}: ${rajjuPass
      ? 'Different Rajju — good, no threat to longevity'
      : `SAME RAJJU (${bRajju}) — CRITICAL DOSHA. Classical texts warn this threatens longevity and health of spouse`}`,
    meaning: 'Longevity of the couple — most critical factor'
  };
 
  // ── 8. VEDHAM ──  CRITICAL
  const bN = bNakIdx + 1, gN = gNakIdx + 1;
  const hasVedha = VEDHA_PAIRS.some(([a,b]) => (a===bN&&b===gN)||(a===gN&&b===bN));
  results['Vedham'] = {
    score: hasVedha ? 0 : 2, max: 2, pass: !hasVedha, critical: true,
    note: hasVedha
      ? `Vedha present between Nakshatra ${bN} and ${gN} — obstacles, misfortune in marriage`
      : 'No Vedha — auspicious, no obstacles',
    meaning: 'Absence of karmic obstacles in marriage'
  };
 
  // ── 9. VASIYAM ──
  const bRasiName = RASI_NAMES[bRasiIdx], gRasiName = RASI_NAMES[gRasiIdx];
  const boyControlsGirl = VASIYAM[bRasiName]?.includes(gRasiName);
  const girlControlsBoy = VASIYAM[gRasiName]?.includes(bRasiName);
  let vasiyamScore = 1, vasiyamNote = 'Neutral — no special attraction';
  if (boyControlsGirl && girlControlsBoy) { vasiyamScore=2; vasiyamNote='Mutual Vasiyam — strong mutual attraction and control'; }
  else if (boyControlsGirl) { vasiyamScore=2; vasiyamNote=`Boy's Rasi controls Girl's — husband leads, wife follows happily`; }
  else if (girlControlsBoy) { vasiyamScore=2; vasiyamNote=`Girl's Rasi controls Boy's — wife has strong influence`; }
  results['Vasiyam'] = {
    score: vasiyamScore, max: 2, pass: true, critical: false,
    note: vasiyamNote,
    meaning: 'Attraction, influence between couple'
  };
 
  // ── 10. NADI ──  CRITICAL
  const nadiSame = bNadi === gNadi;
  const nadiNull = nadiSame ? checkNadiNullification(boyChart, girlChart) : [];
  const nadiNullified = nadiNull.length > 0;
  results['Nadi'] = {
    score: nadiSame && !nadiNullified ? 0 : 8,
    max: 8, pass: !nadiSame || nadiNullified, critical: true,
    nullified: nadiNullified,
    nullifiers: nadiNull,
    note: nadiSame
      ? (nadiNullified
          ? `Same Nadi (${bNadi}) BUT NULLIFIED: ${nadiNull.join('; ')}`
          : `SAME NADI (${bNadi}) — CRITICAL DOSHA. Health of children at risk, temperament clashes. Remedies mandatory.`)
      : `Different Nadi (${bNadi}–${gNadi}) — Excellent. Healthy children, complementary temperaments.`,
    meaning: 'Children\'s health, constitutional compatibility — most important'
  };
 
  // ── Extra factors from full charts if available ──
  const mangalBoy  = boyChart.planets  ? checkMangalDosha(boyChart,  'Boy') : null;
  const mangalGirl = girlChart.planets ? checkMangalDosha(girlChart, 'Girl') : null;
 
  // Mangal Dosha mutual cancellation
  const mangalNotes = [];
  if (mangalBoy && mangalGirl && !mangalBoy.nullified && !mangalGirl.nullified)
    mangalNotes.push({ type:'good', note:'Both have Mangal Dosha — they cancel each other out. Marriage is fine.' });
  else if (mangalBoy && !mangalBoy.nullified)
    mangalNotes.push({ type:'warn', note:`Boy has active Mangal Dosha (Mars in H${mangalBoy.house}). Girl should also have Mangal Dosha or remedies required.` });
  else if (mangalGirl && !mangalGirl.nullified)
    mangalNotes.push({ type:'warn', note:`Girl has active Mangal Dosha (Mars in H${mangalGirl.house}). Boy should also have Mangal Dosha or remedies required.` });
  else if (mangalBoy?.nullified)
    mangalNotes.push({ type:'good', note:`Boy's Mangal Dosha nullified (${mangalBoy.nullifiers.join(', ')})` });
  else if (mangalGirl?.nullified)
    mangalNotes.push({ type:'good', note:`Girl's Mangal Dosha nullified (${mangalGirl.nullifiers.join(', ')})` });
 
  // ── Totals and verdict ──
  const totalScore = Object.values(results).reduce((s,r)=>s+r.score,0);
  const maxScore   = Object.values(results).reduce((s,r)=>s+r.max,0);
  const pct = Math.round((totalScore/maxScore)*100);
 
  const criticalFails = Object.entries(results)
    .filter(([,r])=>r.critical && !r.pass)
    .map(([k])=>k);
 
  // Verdict with nuance
  let verdict, recommendation, overallHealth;
  // Rajju and Nadi are the two most critical
  const rajjuFail = !results['Rajju'].pass;
  const nadiFail  = !results['Nadi'].pass;
 
  if (rajjuFail) {
    verdict = 'Not Recommended';
    recommendation = 'Rajju Dosha is present — this is traditionally the most serious obstacle. Classical texts strongly advise against this match.';
    overallHealth = 'red';
  } else if (nadiFail) {
    verdict = 'Conditional — Serious Remedy Required';
    recommendation = 'Nadi Dosha is present. Marriage possible but requires Grade-A Pariharams completed before marriage. Children\'s health at risk without remedy.';
    overallHealth = 'amber';
  } else if (pct >= 75) {
    verdict = 'Excellent Match';
    recommendation = 'Highly recommended. Strong compatibility across all factors.';
    overallHealth = 'green';
  } else if (pct >= 60) {
    verdict = 'Good Match';
    recommendation = 'Good compatibility. Proceed with confidence.';
    overallHealth = 'green';
  } else if (pct >= 45) {
    verdict = 'Acceptable Match';
    recommendation = 'Acceptable compatibility. Address specific concerns through remedies.';
    overallHealth = 'amber';
  } else {
    verdict = 'Below Average';
    recommendation = 'Multiple concerns present. Detailed consultation recommended before proceeding.';
    overallHealth = 'amber';
  }
 
  return {
    results, totalScore, maxScore, pct,
    verdict, recommendation, overallHealth,
    criticalFails, mangalNotes,
    boyNakshatra: NAK_NAMES[bNakIdx],
    girlNakshatra: NAK_NAMES[gNakIdx],
    boyRasi: RASI_NAMES[bRasiIdx],
    girlRasi: RASI_NAMES[gRasiIdx],
  };
}
 
module.exports = { calcPorutham };
