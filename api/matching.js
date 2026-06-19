'use strict';
const { NAK_NAMES, NAK_LORD, NAK_GANA, NAK_NADI, NAK_YONI, RASI_NAMES } = require('./ephemeris');

const DASHA_ORDER = ['Ketu','Venus','Sun','Moon','Mars','Rahu','Jupiter','Saturn','Mercury'];

// Yoni compatibility table
const YONI_FRIENDS = {
  Horse:['Horse'],Elephant:['Elephant'],Sheep:['Sheep'],Serpent:['Serpent'],
  Dog:['Dog'],Cat:['Cat'],Rat:['Rat'],Cow:['Cow'],Buffalo:['Buffalo'],
  Tiger:['Deer'],Deer:['Tiger'],Monkey:['Mongoose'],Mongoose:['Monkey'],Lion:['Lion']
};
const YONI_ENEMIES = {
  Horse:['Buffalo'],Buffalo:['Horse'],Dog:['Deer'],Deer:['Dog'],
  Serpent:['Mongoose'],Mongoose:['Serpent'],Rat:['Cat'],Cat:['Rat'],
  Elephant:['Lion'],Lion:['Elephant'],Sheep:['Monkey'],Monkey:['Sheep'],
  Tiger:['Cow'],Cow:['Tiger']
};

// Rajju groups - 5 types, same rajju is forbidden
const RAJJU_GROUPS = {
  Pada:  [2,6,10,14,18,22,26], // feet
  Kati:  [3,7,11,15,19,23,27], // waist
  Nabhi: [4,8,12,16,20,24],    // navel
  Kanta: [1,5,9,13,17,21,25],  // neck
  Siro:  [0]                    // head (Abhijit)
};

function getRajju(nakIdx) {
  const n = nakIdx + 1;
  if (RAJJU_GROUPS.Pada.includes(n)) return 'Pada';
  if (RAJJU_GROUPS.Kati.includes(n)) return 'Kati';
  if (RAJJU_GROUPS.Nabhi.includes(n)) return 'Nabhi';
  if (RAJJU_GROUPS.Kanta.includes(n)) return 'Kanta';
  return 'Siro';
}

// Vedha pairs (these nakshatra pairs create obstacles)
const VEDHA_PAIRS = [[1,18],[2,16],[3,14],[4,12],[5,20],[6,22],[7,24],[8,9],[10,25],[11,26],[13,27],[15,21],[17,19]];

// Vasiyam - attraction between Rasis
const VASIYAM_PAIRS = [
  ['Mesha','Vrischika'],['Rishabha','Kataka'],['Mithuna','Kanya'],
  ['Kataka','Vrischika'],['Simha','Tula'],['Kanya','Mithuna'],
  ['Tula','Makara'],['Vrischika','Kataka'],['Dhanu','Meena'],
  ['Makara','Mesha'],['Kumbha','Mesha'],['Meena','Makara']
];

function calcPorutham(boyChart, girlChart) {
  const bNakIdx = boyChart.nakshatra.index;
  const gNakIdx = girlChart.nakshatra.index;
  const bRasiIdx = boyChart.rasi.index;
  const gRasiIdx = girlChart.rasi.index;
  const bGana = boyChart.nakshatra.gana;
  const gGana = girlChart.nakshatra.gana;
  const bNadi = boyChart.nakshatra.nadi;
  const gNadi = girlChart.nakshatra.nadi;
  const bYoni = boyChart.nakshatra.yoni;
  const gYoni = girlChart.nakshatra.yoni;

  const results = {};

  // 1. DINAM (Day star) — count from boy to girl nak, divide by 9, check remainder
  const dinam = ((gNakIdx - bNakIdx + 27) % 27) + 1;
  const dinRem = dinam % 9 || 9;
  const dinPass = ![1,3,5,7].includes(dinRem);
  results['Dinam'] = {
    score: dinPass ? 3 : 0, max: 3,
    pass: dinPass,
    note: `Count ${dinam}, rem ${dinRem} — ${dinPass ? 'Auspicious' : 'Inauspicious'}`,
    critical: false
  };

  // 2. GANAM — nature compatibility
  let ganaScore = 0, ganaNote = '';
  if (bGana === gGana) { ganaScore = 6; ganaNote = 'Same gana — best'; }
  else if ((bGana==='Deva'&&gGana==='Manushya')||(bGana==='Manushya'&&gGana==='Deva')) { ganaScore=3; ganaNote='Deva-Manushya — acceptable'; }
  else if (bGana==='Deva'&&gGana==='Rakshasa') { ganaScore=0; ganaNote='Deva-Rakshasa — incompatible'; }
  else if (bGana==='Manushya'&&gGana==='Rakshasa') { ganaScore=0; ganaNote='Manushya-Rakshasa — conflict'; }
  else { ganaScore=3; ganaNote='Acceptable combination'; }
  results['Ganam'] = { score: ganaScore, max: 6, pass: ganaScore>=3, note: `${bGana}–${gGana}: ${ganaNote}`, critical: false };

  // 3. MAHENDRAM — count from girl to boy, good if 4,7,10,13,16,19,22,25
  const mah = ((bNakIdx - gNakIdx + 27) % 27) + 1;
  const mahPass = [4,7,10,13,16,19,22,25].includes(mah);
  results['Mahendram'] = { score: mahPass?2:0, max:2, pass:mahPass, note:`Count ${mah} from girl to boy`, critical:false };

  // 4. STHREE DHIRGHAM — distance from boy to girl must be > 7 nakshatras
  const sd = ((gNakIdx - bNakIdx + 27) % 27) + 1;
  const sdPass = sd > 7;
  results['Sthree Dhirgham'] = { score:sdPass?2:0, max:2, pass:sdPass, note:`Distance ${sd} nakshatras — ${sdPass?'OK (>7)':'Too close (<7)'}`, critical:false };

  // 5. YONI — animal compatibility
  let yoniScore = 0, yoniNote = '';
  if (bYoni === gYoni) { yoniScore=4; yoniNote='Same yoni — excellent'; }
  else if (YONI_FRIENDS[bYoni]?.includes(gYoni)||YONI_FRIENDS[gYoni]?.includes(bYoni)) { yoniScore=3; yoniNote='Friendly yoni'; }
  else if (YONI_ENEMIES[bYoni]?.includes(gYoni)||YONI_ENEMIES[gYoni]?.includes(bYoni)) { yoniScore=0; yoniNote='Enemy yoni — incompatible'; }
  else { yoniScore=2; yoniNote='Neutral yoni'; }
  results['Yoni'] = { score:yoniScore, max:4, pass:yoniScore>=2, note:`${bYoni}–${gYoni}: ${yoniNote}`, critical:false };

  // 6. RASI — moon sign compatibility
  const rasiDiff = Math.abs(bRasiIdx - gRasiIdx);
  let rasiScore = 0, rasiNote = '';
  if (rasiDiff === 0) { rasiScore=0; rasiNote='Same Rasi — usually inauspicious'; }
  else if ([2,6,8,11].includes(rasiDiff)||[2,6,8,11].includes(12-rasiDiff)) { rasiScore=0; rasiNote='2-12, 6-8 relationship — avoid'; }
  else if ([4,5].includes(rasiDiff)||[4,5].includes(12-rasiDiff)) { rasiScore=7; rasiNote='5-9 position — excellent'; }
  else { rasiScore=4; rasiNote='Neutral Rasi relationship'; }
  results['Rasi'] = { score:rasiScore, max:7, pass:rasiScore>=4, note:`${RASI_NAMES[bRasiIdx]}–${RASI_NAMES[gRasiIdx]}: ${rasiNote}`, critical:false };

  // 7. RAJJU — CRITICAL — same rajju = bad
  const bRajju = getRajju(bNakIdx);
  const gRajju = getRajju(gNakIdx);
  const rajjuPass = bRajju !== gRajju;
  results['Rajju'] = {
    score: rajjuPass?8:0, max:8, pass:rajjuPass,
    note:`${bRajju}–${gRajju}: ${rajjuPass?'Different Rajju — good':'SAME RAJJU — critical problem, shortens lifespan'}`,
    critical: true
  };

  // 8. VEDHAM — same Vedha pair is bad
  const bN = bNakIdx+1, gN = gNakIdx+1;
  const hasVedha = VEDHA_PAIRS.some(([a,b]) => (a===bN&&b===gN)||(a===gN&&b===bN));
  results['Vedham'] = {
    score: hasVedha?0:2, max:2, pass:!hasVedha,
    note: hasVedha?'Vedha present — obstacles and misfortune':'No Vedha — auspicious',
    critical:true
  };

  // 9. VASIYAM — attraction/control
  const bRasiName = RASI_NAMES[bRasiIdx], gRasiName = RASI_NAMES[gRasiIdx];
  const hasVasiyam = VASIYAM_PAIRS.some(([a,b]) => (a===bRasiName&&b===gRasiName)||(a===gRasiName&&b===bRasiName));
  results['Vasiyam'] = {
    score:hasVasiyam?2:1, max:2, pass:true,
    note:hasVasiyam?'Vasiyam present — strong attraction':'Neutral — no special attraction',
    critical:false
  };

  // 10. NADI — CRITICAL — same Nadi is bad
  const nadiSame = bNadi === gNadi;
  results['Nadi'] = {
    score: nadiSame?0:8, max:8, pass:!nadiSame,
    note:`${bNadi}–${gNadi}: ${nadiSame?'SAME NADI — critical Dosha, health issues for children':'Different Nadi — excellent'}`,
    critical:true
  };

  // Totals
  const totalScore = Object.values(results).reduce((s,r)=>s+r.score,0);
  const maxScore   = Object.values(results).reduce((s,r)=>s+r.max,0);
  const pct = Math.round((totalScore/maxScore)*100);

  // Critical fails
  const criticalFails = Object.entries(results)
    .filter(([,r])=>r.critical && !r.pass)
    .map(([k])=>k);

  let verdict = '', recommendation = '';
  if (criticalFails.length >= 2) {
    verdict='Very Poor'; recommendation='Not recommended — critical Doshas present';
  } else if (criticalFails.length === 1) {
    verdict='Needs Remedy'; recommendation='Proceed with specific remedies for ' + criticalFails.join(', ');
  } else if (pct >= 75) {
    verdict='Excellent'; recommendation='Highly recommended — very good compatibility';
  } else if (pct >= 60) {
    verdict='Good'; recommendation='Good match — proceed with confidence';
  } else if (pct >= 45) {
    verdict='Average'; recommendation='Acceptable — discuss specific concerns';
  } else {
    verdict='Below Average'; recommendation='Consult astrologer before proceeding';
  }

  return { results, totalScore, maxScore, pct, verdict, recommendation, criticalFails };
}

module.exports = { calcPorutham };
