
'use strict';
const { julian, solar, moonposition } = require('astronomia');
 
// ── Lahiri Ayanamsha (Chitrapaksha) - IAU standard for Jyotish ──
function getLahiriAyanamsha(jd) {
  const T = (jd - 2451545.0) / 36525;
  return 23.85 + 0.013604167 * T - 0.000000139 * T * T;
}
 
function norm(x) { return ((x % 360) + 360) % 360; }
function sid(trop, ayan) { return norm(trop - ayan); }
function toRad(d) { return d * Math.PI / 180; }
function toDeg(r) { return r * 180 / Math.PI; }
function normH(h) { return ((h - 1 + 12) % 12) + 1; } // keep house 1-12
 
// ── Core tables ──
const RASI_NAMES  = ['Mesha','Rishabha','Mithuna','Kataka','Simha','Kanya','Tula','Vrischika','Dhanu','Makara','Kumbha','Meena'];
const RASI_EN     = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const RASI_TAMIL  = ['மேஷம்','ரிஷபம்','மிதுனம்','கடகம்','சிம்மம்','கன்னி','துலாம்','விருச்சிகம்','தனுசு','மகரம்','கும்பம்','மீனம்'];
const RASI_LORD   = ['Mars','Venus','Mercury','Moon','Sun','Mercury','Venus','Mars','Jupiter','Saturn','Saturn','Jupiter'];
const RASI_EXALT  = {Sun:0,Moon:1,Mars:9,Mercury:5,Jupiter:3,Venus:11,Saturn:6};
const RASI_DEBIL  = {Sun:6,Moon:7,Mars:3,Mercury:11,Jupiter:9,Venus:5,Saturn:0};
const RASI_OWN    = {Sun:[4],Moon:[3],Mars:[0,7],Mercury:[2,5],Jupiter:[8,11],Venus:[1,6],Saturn:[9,10]};
// Mooltrikona signs (stronger than own, weaker than exalt)
const RASI_MOOL   = {Sun:4,Moon:1,Mars:0,Mercury:5,Jupiter:8,Venus:6,Saturn:9};
// Planetary friendships (permanent)
const FRIENDS = {
  Sun:['Moon','Mars','Jupiter'], Moon:['Sun','Mercury'],
  Mars:['Sun','Moon','Jupiter'], Mercury:['Sun','Venus'],
  Jupiter:['Sun','Moon','Mars'], Venus:['Mercury','Saturn'],
  Saturn:['Mercury','Venus']
};
const ENEMIES = {
  Sun:['Saturn','Venus'], Moon:['Rahu','Ketu'],
  Mars:['Mercury'], Mercury:['Moon'],
  Jupiter:['Mercury','Venus'], Venus:['Sun','Moon'],
  Saturn:['Sun','Moon','Mars']
};
 
// House karakatvas (significations)
const HOUSE_SIGNIF = {
  1:'self, body, personality, health, appearance, longevity',
  2:'wealth, family, speech, food, savings, right eye, face',
  3:'siblings, courage, short travel, communication, hands, ears',
  4:'mother, home, property, vehicles, education, happiness, chest',
  5:'children, intelligence, romance, past merit, stomach, creativity',
  6:'enemies, disease, debt, competition, service, digestion',
  7:'spouse, partnerships, business, marriage, lower abdomen',
  8:'longevity, occult, sudden events, inheritance, transformation, chronic illness',
  9:'father, luck, dharma, spirituality, long travel, religion, thighs',
  10:'career, status, actions, fame, authority, government, knees',
  11:'gains, income, elder siblings, desires, friends, left ear, ankles',
  12:'loss, expenditure, foreign, liberation, bed pleasures, left eye, feet'
};
 
// Nakshatra complete data
const NAK_NAMES  = ['Ashwini','Bharani','Krittika','Rohini','Mrigashira','Ardra','Punarvasu','Pushya','Ashlesha',
  'Magha','Purva Phalguni','Uttara Phalguni','Hasta','Chitra','Swati','Vishakha','Anuradha','Jyeshtha',
  'Mula','Purva Ashadha','Uttara Ashadha','Shravana','Dhanishtha','Shatabhisha',
  'Purva Bhadrapada','Uttara Bhadrapada','Revati'];
const NAK_TAMIL  = ['அஸ்வினி','பரணி','கார்த்திகை','ரோகிணி','மிருகசீரிடம்','திருவாதிரை','புனர்பூசம்','பூசம்','ஆயில்யம்',
  'மகம்','பூரம்','உத்திரம்','ஹஸ்தம்','சித்திரை','சுவாதி','விசாகம்','அனுஷம்','கேட்டை',
  'மூலம்','பூராடம்','உத்திராடம்','திருவோணம்','அவிட்டம்','சதயம்','பூரட்டாதி','உத்திரட்டாதி','ரேவதி'];
const NAK_LORD   = ['Ketu','Venus','Sun','Moon','Mars','Rahu','Jupiter','Saturn','Mercury',
  'Ketu','Venus','Sun','Moon','Mars','Rahu','Jupiter','Saturn','Mercury',
  'Ketu','Venus','Sun','Moon','Mars','Rahu','Jupiter','Saturn','Mercury'];
const NAK_YEARS  = {Ketu:7,Venus:20,Sun:6,Moon:10,Mars:7,Rahu:18,Jupiter:16,Saturn:19,Mercury:17};
const NAK_GANA   = ['Deva','Manushya','Rakshasa','Manushya','Deva','Manushya','Deva','Deva','Rakshasa',
  'Rakshasa','Manushya','Manushya','Deva','Rakshasa','Deva','Rakshasa','Deva','Rakshasa',
  'Rakshasa','Manushya','Manushya','Deva','Rakshasa','Rakshasa','Manushya','Manushya','Deva'];
const NAK_NADI   = ['Vata','Pitta','Kapha','Kapha','Pitta','Vata','Vata','Pitta','Kapha',
  'Kapha','Pitta','Vata','Vata','Pitta','Kapha','Kapha','Pitta','Vata',
  'Vata','Pitta','Kapha','Kapha','Pitta','Vata','Vata','Pitta','Kapha'];
const NAK_YONI   = ['Horse','Elephant','Sheep','Serpent','Serpent','Dog','Cat','Sheep','Cat',
  'Rat','Rat','Cow','Buffalo','Tiger','Buffalo','Tiger','Deer','Deer',
  'Dog','Monkey','Mongoose','Monkey','Lion','Horse','Lion','Cow','Elephant'];
const NAK_DEITY  = ['Ashwini Kumaras','Yama','Agni','Brahma/Prajapati','Soma (Moon)','Rudra','Aditi','Brihaspati','Serpents',
  'Pitrus (Ancestors)','Bhaga','Aryaman','Savitar','Vishwakarma','Vayu','Indra/Agni','Mitra','Indra',
  'Nirrti','Apah (Waters)','Vishvedeva','Vishnu','8 Vasus','Varuna','Ajakapada','Ahirbudhnya','Pushan'];
const NAK_SYMBOL = ['Horse head','Yoni','Flame/Razor','Cart/Ox','Deer head','Diamond/Teardrop','Bow/Quiver','Flower/Circle','Coiled serpent',
  'Royal throne','Hammock/Fig tree','Bed/Fig tree','Hand/Fist','Pearl/Bright lamp','Coral/Sword','Potter\'s wheel/Triumphal arch','Lotus','Circular talisman',
  'Bunch of roots','Elephant tusk/Fan','Elephant tusk','Ear/Three footprints','Drum/Flute','Empty circle','Sword/Front legs of funeral cot','Snake in water','Fish/Pair of fish'];
const NAK_QUALITY= ['Deva','Manushya','Rakshasa','Manushya','Deva','Manushya','Deva','Deva','Rakshasa',
  'Rakshasa','Manushya','Manushya','Deva','Rakshasa','Deva','Rakshasa','Deva','Rakshasa',
  'Rakshasa','Manushya','Manushya','Deva','Rakshasa','Rakshasa','Manushya','Manushya','Deva'];
// Nakshatra type: Movable(Chara), Fixed(Sthira), Dual(Dwiswabhava), Sharp(Tikshna), Soft(Mridu), Mixed(Misra), Fierce(Ugra)
const NAK_TYPE   = ['Chara','Ugra','Misra','Sthira','Mridu','Tikshna','Chara','Mridu','Tikshna',
  'Ugra','Ugra','Sthira','Chara','Tikshna','Chara','Misra','Mridu','Tikshna',
  'Tikshna','Ugra','Sthira','Mridu','Chara','Chara','Ugra','Sthira','Mridu'];
 
const DASHA_ORDER = ['Ketu','Venus','Sun','Moon','Mars','Rahu','Jupiter','Saturn','Mercury'];
 
// ── Planet strength status ──
function getPlanetStatus(name, rasiIdx) {
  if (name === 'Rahu' || name === 'Ketu') {
    // Rahu exalted in Mithuna/Rishabha (traditional), debil in Dhanu/Vrischika
    if (rasiIdx === 1 || rasiIdx === 2) return 'Exalted (Uchham)';
    if (rasiIdx === 7 || rasiIdx === 8) return 'Debilitated (Neecham)';
    return 'Shadow planet';
  }
  if (RASI_EXALT[name] === rasiIdx) return 'Exalted (Uchham)';
  if (RASI_DEBIL[name] === rasiIdx) return 'Debilitated (Neecham)';
  if (RASI_MOOL[name] === rasiIdx) return 'Mooltrikona';
  if (RASI_OWN[name]?.includes(rasiIdx)) return 'Own Sign (Swakshetra)';
  const lord = RASI_LORD[rasiIdx];
  if (FRIENDS[name]?.includes(lord)) return 'Friendly sign';
  if (ENEMIES[name]?.includes(lord)) return 'Enemy sign';
  return 'Neutral sign';
}
 
function getHouseNum(lagnaRasiIdx, planetRasiIdx) {
  return ((planetRasiIdx - lagnaRasiIdx + 12) % 12) + 1;
}
 
// ── Aspect calculation ──
// Returns houses a planet aspects (Jyotish special aspects)
function getAspects(planetName, houseNum) {
  const aspects = [normH(houseNum + 6)]; // all planets aspect 7th from themselves
  if (planetName === 'Mars')    aspects.push(normH(houseNum+3), normH(houseNum+7));
  if (planetName === 'Jupiter') aspects.push(normH(houseNum+4), normH(houseNum+8));
  if (planetName === 'Saturn')  aspects.push(normH(houseNum+2), normH(houseNum+9));
  if (planetName === 'Rahu' || planetName === 'Ketu') {
    aspects.push(normH(houseNum+4), normH(houseNum+8)); // Rahu/Ketu aspect 5th and 9th
  }
  return aspects;
}
 
// ── Shadbala simplified (strength score 0-100) ──
function getSimplifiedBala(name, rasiIdx, house) {
  let score = 50;
  const status = getPlanetStatus(name, rasiIdx);
  if (status.includes('Exalted'))     score += 30;
  if (status.includes('Mooltrikona')) score += 20;
  if (status.includes('Own'))         score += 15;
  if (status.includes('Friendly'))    score += 10;
  if (status.includes('Debilitated')) score -= 25;
  if (status.includes('Enemy'))       score -= 10;
  // Digbala (directional strength)
  const digbala = {Sun:10,Mars:10,Jupiter:1,Mercury:4,Moon:4,Venus:7,Saturn:7};
  if (digbala[name] && house === digbala[name]) score += 15;
  // Kendra boost
  if ([1,4,7,10].includes(house)) score += 5;
  if ([5,9].includes(house))      score += 3;
  return Math.min(100, Math.max(0, score));
}
 
// ── Planet positions ──
function getPlanetPositions(jdUT) {
  const T = (jdUT - 2451545.0) / 36525;
  const ayan = getLahiriAyanamsha(jdUT);
  function n360(x){ return ((x%360)+360)%360; }
 
  // Moon — high accuracy
  const moonPos  = moonposition.position(jdUT);
  const moonTrop = norm(toDeg(moonPos.lon));
  const moonSid  = sid(moonTrop, ayan);
 
  // Sun — high accuracy
  const sunTrop  = norm(solar.apparentLongitude(jdUT) * 180 / Math.PI);
  const sunSid   = sid(sunTrop, ayan);
 
  // Mercury — VSOP87 simplified
  const Mmer = n360(174.7948 + 4.09233445*T*36525);
  const merTrop = n360(252.2509 + 149472.6746*T
    + 23.44*Math.sin(toRad(Mmer)) + 2.98*Math.sin(toRad(2*Mmer)) - 0.14*Math.sin(toRad(3*Mmer)) - 77.4561);
 
  // Venus
  const Mven = n360(212.2606 + 58517.8041*T);
  const venTrop = n360(181.9798 + 58517.8157*T
    + 0.7758*Math.sin(toRad(Mven)) + 0.0033*Math.sin(toRad(2*Mven)) - 131.5637);
 
  // Mars
  const Mmar = n360(19.3730 + 19140.2993*T);
  const marTrop = n360(355.4332 + 19140.2993*T
    + 10.6912*Math.sin(toRad(Mmar)) + 0.6228*Math.sin(toRad(2*Mmar)) + 0.0503*Math.sin(toRad(3*Mmar)) - 286.5016);
 
  // Jupiter
  const Mjup = n360(20.9 + 3034.906*T);
  const jupTrop = n360(34.3515 + 3034.9057*T
    + 5.5549*Math.sin(toRad(Mjup)) + 0.1683*Math.sin(toRad(2*Mjup)) - 0.0072*Math.sin(toRad(3*Mjup)) - 14.3312);
 
  // Saturn
  const Msat = n360(317.0207 + 1222.1138*T);
  const satTrop = n360(50.0775 + 1222.1138*T
    + 6.3585*Math.sin(toRad(Msat)) + 0.2204*Math.sin(toRad(2*Msat)) - 0.0108*Math.sin(toRad(3*Msat)) - 92.8553);
 
  // Rahu/Ketu — accurate mean node
  const rahuTrop = n360(125.044555 - 1934.136261*T + 0.0020708*T*T);
  const ketuTrop = n360(rahuTrop + 180);
 
  const raw = {
    Sun:{trop:sunTrop}, Moon:{trop:moonTrop}, Mars:{trop:marTrop},
    Mercury:{trop:merTrop}, Jupiter:{trop:jupTrop}, Venus:{trop:venTrop},
    Saturn:{trop:satTrop}, Rahu:{trop:rahuTrop}, Ketu:{trop:ketuTrop},
  };
 
  for (const [name, p] of Object.entries(raw)) {
    p.sid       = sid(p.trop, ayan);
    p.rasiIdx   = Math.floor(p.sid / 30);
    p.rasi      = RASI_NAMES[p.rasiIdx];
    p.rasiEn    = RASI_EN[p.rasiIdx];
    p.rasiTamil = RASI_TAMIL[p.rasiIdx];
    p.degInRasi = p.sid % 30;
    p.nakIdx    = Math.floor(p.sid / (360/27));
    p.nakshatra = NAK_NAMES[p.nakIdx];
    p.nakshatraTamil = NAK_TAMIL[p.nakIdx];
    p.pada      = Math.floor((p.sid % (360/27)) / ((360/27)/4)) + 1;
    p.nakLord   = NAK_LORD[p.nakIdx];
    p.nakDeity  = NAK_DEITY[p.nakIdx];
    p.nakSymbol = NAK_SYMBOL[p.nakIdx];
  }
  return { planets: raw, ayanamsha: ayan };
}
 
// ── Lagna calculation ──
function calcLagna(jdUT, lat, lon) {
  const T = (jdUT - 2451545.0) / 36525;
  const ayan = getLahiriAyanamsha(jdUT);
  let gmst = 280.46061837 + 360.98564736629*(jdUT-2451545) + 0.000387933*T*T - T*T*T/38710000;
  gmst = norm(gmst);
  const lst   = norm(gmst + lon);
  const eps   = toRad(23.439291111 - 0.013004167*T);
  const latR  = toRad(lat);
  const ramcR = toRad(lst);
  const y     = Math.cos(ramcR);
  const x     = -(Math.sin(eps)*Math.tan(latR) + Math.cos(eps)*Math.sin(ramcR));
  const ascTrop = norm(toDeg(Math.atan2(y, x)));
  const ascSid  = sid(ascTrop, ayan);
  const lagnaIdx= Math.floor(ascSid / 30);
  return {
    tropLon: ascTrop, sidLon: ascSid, degInRasi: ascSid % 30,
    rasiIdx: lagnaIdx, rasi: RASI_NAMES[lagnaIdx],
    rasiEn: RASI_EN[lagnaIdx], rasiTamil: RASI_TAMIL[lagnaIdx],
    lord: RASI_LORD[lagnaIdx],
  };
}
 
// ── Dasha calculation ──
function calcDasha(dob, nakIdx, nakDegInNak) {
  const nakLord       = NAK_LORD[nakIdx];
  const nakFraction   = nakDegInNak / (360/27);
  const balanceYears  = (1 - nakFraction) * NAK_YEARS[nakLord];
  const birthMs       = new Date(dob).getTime();
  const startLordIdx  = DASHA_ORDER.indexOf(nakLord);
  const dashaSequence = [];
  let cumYears = 0;
 
  for (let i = 0; i < 27; i++) {
    const lord    = DASHA_ORDER[(startLordIdx + i) % 9];
    const years   = i === 0 ? balanceYears : NAK_YEARS[lord];
    const startMs = birthMs + cumYears * 365.25 * 24 * 3600 * 1000;
    const endMs   = startMs + years * 365.25 * 24 * 3600 * 1000;
    dashaSequence.push({
      lord, years: parseFloat(years.toFixed(2)),
      startDate: new Date(startMs).toISOString().slice(0,10),
      endDate:   new Date(endMs).toISOString().slice(0,10),
    });
    cumYears += years;
  }
 
  const now     = Date.now();
  const current = dashaSequence.find(d => new Date(d.startDate)<=now && new Date(d.endDate)>now);
 
  // Antardashas
  let antardashas = [];
  if (current) {
    const mStart      = new Date(current.startDate).getTime();
    const mYears      = current.years;
    const aStartLordIdx = DASHA_ORDER.indexOf(current.lord);
    let aCum = 0;
    for (let j = 0; j < 9; j++) {
      const aLord   = DASHA_ORDER[(aStartLordIdx + j) % 9];
      const aYrs    = (mYears * NAK_YEARS[aLord]) / 120;
      const aStartMs= mStart + aCum * 365.25 * 24 * 3600 * 1000;
      const aEndMs  = aStartMs + aYrs * 365.25 * 24 * 3600 * 1000;
      antardashas.push({
        lord: aLord, years: parseFloat(aYrs.toFixed(2)),
        startDate: new Date(aStartMs).toISOString().slice(0,10),
        endDate:   new Date(aEndMs).toISOString().slice(0,10),
      });
      aCum += aYrs;
    }
  }
 
  // Praryantar dashas for current antardasha
  let prayantardashas = [];
  const currentAntar = antardashas.find(a => new Date(a.startDate)<=now && new Date(a.endDate)>now);
  if (currentAntar && current) {
    const paStart     = new Date(currentAntar.startDate).getTime();
    const paYears     = currentAntar.years;
    const paStartIdx  = DASHA_ORDER.indexOf(currentAntar.lord);
    let paCum = 0;
    for (let k = 0; k < 9; k++) {
      const paLord   = DASHA_ORDER[(paStartIdx + k) % 9];
      const paYrs    = (paYears * NAK_YEARS[paLord]) / 120;
      const paStartMs= paStart + paCum * 365.25 * 24 * 3600 * 1000;
      const paEndMs  = paStartMs + paYrs * 365.25 * 24 * 3600 * 1000;
      prayantardashas.push({
        lord: paLord, years: parseFloat(paYrs.toFixed(3)),
        startDate: new Date(paStartMs).toISOString().slice(0,10),
        endDate:   new Date(paEndMs).toISOString().slice(0,10),
      });
      paCum += paYrs;
    }
  }
 
  return { dashaSequence, current, antardashas, currentAntar, prayantardashas };
}
 
// ── Comprehensive Yoga & Dosha detection ──
function detectYogas(planets, lagnaIdx) {
  const yogas = [];
  const p     = planets;
 
  // Helper
  const H = (planet) => getHouseNum(lagnaIdx, p[planet]?.rasiIdx || 0);
  const ST= (planet) => getPlanetStatus(planet, p[planet]?.rasiIdx || 0);
  const KENDRA = [1,4,7,10];
  const TRIKONA= [1,5,9];
  const DUSTHANA=[6,8,12];
 
  // ── 1. Pancha Mahapurusha Yogas ──
  for (const [name, data] of Object.entries(p)) {
    const h  = H(name);
    const st = getPlanetStatus(name, data.rasiIdx);
    if (!KENDRA.includes(h)) continue;
    if (st.includes('Exalted') || st.includes('Own') || st.includes('Mooltrikona')) {
      const yNames = {Mars:'Ruchaka',Mercury:'Bhadra',Jupiter:'Hamsa',Venus:'Malavya',Saturn:'Shasha'};
      if (yNames[name]) yogas.push({
        name:`${yNames[name]} Yoga`, type:'good', planet:name, house:h,
        desc:`${name} ${st} in H${h} — ${yNames[name]} Yoga gives exceptional ${
          name==='Mars'?'courage, physical strength, leadership':
          name==='Mercury'?'intelligence, eloquence, business acumen':
          name==='Jupiter'?'wisdom, spirituality, respected status':
          name==='Venus'?'beauty, luxury, artistic gifts, happy marriage':
          'discipline, longevity, authority, land'}`
      });
    }
  }
 
  // ── 2. Gajakesari Yoga ──
  const jupFromMoon = ((p.Jupiter.rasiIdx - p.Moon.rasiIdx + 12)%12)+1;
  if (KENDRA.includes(jupFromMoon))
    yogas.push({name:'Gajakesari Yoga',type:'good',planet:'Jupiter',
      desc:`Jupiter in H${jupFromMoon} from Moon — intelligence like an elephant, fame, wealth, respected in society`});
 
  // ── 3. Saraswati Yoga ──
  if ([...KENDRA,...TRIKONA,[2,11].flat()].includes(H('Jupiter')) &&
      [...KENDRA,...TRIKONA,[2,11].flat()].includes(H('Venus')) &&
      [...KENDRA,...TRIKONA,[2,11].flat()].includes(H('Mercury')))
    yogas.push({name:'Saraswati Yoga',type:'good',
      desc:'Jupiter, Venus, Mercury all strong — exceptional intellect, arts, learning, multiple talents'});
 
  // ── 4. Dhana Yogas ──
  // Lords of 2,5,9,11 in each other's houses or conjunct
  const l2=RASI_LORD[(lagnaIdx+1)%12], l5=RASI_LORD[(lagnaIdx+4)%12];
  const l9=RASI_LORD[(lagnaIdx+8)%12], l11=RASI_LORD[(lagnaIdx+10)%12];
  const dhanaSet = new Set([l2,l5,l9,l11]);
  let dhanaCount = 0;
  dhanaSet.forEach(lord => {
    const lH = H(lord);
    if ([2,5,9,11].includes(lH)) dhanaCount++;
  });
  if (dhanaCount >= 2)
    yogas.push({name:'Dhana Yoga',type:'good',
      desc:`${dhanaCount} wealth house lords (2,5,9,11) in each other's houses — strong financial prosperity`});
 
  // ── 5. Raja Yogas — lords of Kendra + Trikona connected ──
  const kendraLords = new Set([1,4,7,10].map(h=>RASI_LORD[(lagnaIdx+h-1)%12]));
  const trikonaLords= new Set([1,5,9].map(h=>RASI_LORD[(lagnaIdx+h-1)%12]));
  let rajaYogaCount = 0;
  kendraLords.forEach(kl => {
    if (trikonaLords.has(kl)) return; // same planet rules both — even better
    trikonaLords.forEach(tl => {
      if (kl === tl) return;
      const klH = H(kl), tlH = H(tl);
      if (klH === tlH || // conjunct
          Math.abs(p[kl]?.sid - p[tl]?.sid) < 10 || // within 10 deg
          getAspects(kl, klH).includes(tlH)) { // aspect each other
        rajaYogaCount++;
      }
    });
  });
  if (rajaYogaCount > 0)
    yogas.push({name:`Raja Yoga (${rajaYogaCount} combinations)`,type:'good',
      desc:`Kendra and Trikona lords connected — authority, power, success, recognition in career`});
 
  // ── 6. Chandra Mangala Yoga ──
  if (Math.abs(p.Moon.sid - p.Mars.sid) < 10 ||
      getAspects('Mars', H('Mars')).includes(H('Moon')))
    yogas.push({name:'Chandra Mangala Yoga',type:'good',
      desc:'Moon and Mars connected — strong earning ability, mother connection to property, bold emotions'});
 
  // ── 7. Budhaditya Yoga ──
  if (Math.abs(p.Sun.sid - p.Mercury.sid) < 15)
    yogas.push({name:'Budhaditya Yoga',type:'good',
      desc:'Sun and Mercury conjunct — sharp intelligence, good communication, respect from authority, analytical mind'});
 
  // ── 8. Amala Yoga ──
  const h10FromMoon = normH(((p.Moon.rasiIdx + 9) % 12) + 1);
  // Check if benefics (Jupiter, Venus, Mercury) are in H10 from Moon or Lagna
  ['Jupiter','Venus','Mercury'].forEach(ben => {
    if (H(ben) === 10 || getHouseNum(p.Moon.rasiIdx, p[ben].rasiIdx) === 10)
      yogas.push({name:`Amala Yoga (${ben})`,type:'good',
        desc:`${ben} in H10 from Lagna/Moon — spotless reputation, professional excellence, remembered for good deeds`});
  });
 
  // ── 9. Vipareeta Raja Yogas ──
  const l6=RASI_LORD[(lagnaIdx+5)%12], l8=RASI_LORD[(lagnaIdx+7)%12], l12=RASI_LORD[(lagnaIdx+11)%12];
  if (DUSTHANA.includes(H(l6)) && l6!==l8 && l6!==l12)
    yogas.push({name:'Vipareeta Raja Yoga — Harsha',type:'good',
      desc:'6th lord in dusthana — defeats enemies, gains from adversity, success through service and hard work'});
  if (DUSTHANA.includes(H(l8)) && l8!==l6 && l8!==l12)
    yogas.push({name:'Vipareeta Raja Yoga — Sarala',type:'good',
      desc:'8th lord in dusthana — great longevity, fearless nature, gains from occult, hidden or ancestral sources'});
  if (DUSTHANA.includes(H(l12)) && l12!==l6 && l12!==l8)
    yogas.push({name:'Vipareeta Raja Yoga — Vimala',type:'good',
      desc:'12th lord in dusthana — pure character, spiritual inclination, gains from foreign or spiritual sources'});
 
  // ── 10. Mangal Dosha with full nullification ──
  const marsH = H('Mars');
  if ([1,2,4,7,8,12].includes(marsH)) {
    const nullifiers = [];
    const marsSt = ST('Mars');
    // Rule 1: Mars in own or exalted sign
    if (marsSt.includes('Exalted') || marsSt.includes('Own') || marsSt.includes('Mooltrikona'))
      nullifiers.push(`Mars is ${marsSt} — Dosha greatly reduced`);
    // Rule 2: Aries or Scorpio Lagna (Mars rules Lagna)
    if ([0,7].includes(lagnaIdx))
      nullifiers.push('Mesha/Vrischika Lagna — Mars rules the Lagna so Dosha is cancelled');
    // Rule 3: Mars in H1 of Mesha, Kataka, Simha, Makara, Kumbha Lagnas
    if (marsH===1 && [0,3,4,9,10].includes(lagnaIdx))
      nullifiers.push(`Mars in H1 for ${RASI_NAMES[lagnaIdx]} Lagna — Dosha cancelled`);
    // Rule 4: Jupiter aspects Mars
    if (getAspects('Jupiter', H('Jupiter')).includes(marsH))
      nullifiers.push('Jupiter aspects Mars — Dosha cancelled by Guru\'s grace');
    // Rule 5: Mars in H8 for Kataka or Simha Lagna — not Dosha
    if (marsH===8 && [3,4].includes(lagnaIdx))
      nullifiers.push('Mars in H8 for Kataka/Simha Lagna — not Mangal Dosha');
    // Rule 6: Mars in H12 of Tula Lagna
    if (marsH===12 && lagnaIdx===6)
      nullifiers.push('Mars in H12 for Tula Lagna — not Mangal Dosha');
    // Rule 7: Benefic in H7 reduces Dosha
    if (['Jupiter','Venus','Mercury'].some(b=>H(b)===7))
      nullifiers.push('Benefic planet in H7 reduces Mangal Dosha effect on marriage');
    // Rule 8: Spouse also has Mangal Dosha — cancels each other
    const nullified = nullifiers.length >= 1;
    yogas.push({
      name: nullified ? 'Mangal Dosha — NULLIFIED' : 'Mangal Dosha — ACTIVE',
      type: nullified ? 'warn' : 'bad',
      planet:'Mars', house:marsH, nullified, nullifiers,
      desc: nullified
        ? `Mars in H${marsH} creates Mangal Dosha BUT nullified because: ${nullifiers.join('; ')}.`
        : `Mars in H${marsH} — Mangal Dosha ACTIVE. Creates delays, friction in marriage, health issues for spouse. Partner should also have Mangal Dosha. Remedies required.`
    });
  }
 
  // ── 11. Kaal Sarpa Yoga with nullification ──
  const rahuSid  = p.Rahu.sid;
  const ketuSid  = p.Ketu.sid;
  const pNames7  = ['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn'];
  const rMin     = Math.min(rahuSid,ketuSid);
  const rMax     = Math.max(rahuSid,ketuSid);
  const arc      = rMax - rMin;
  let allInArc=0, allOutArc=0;
  pNames7.forEach(n=>{ const s=p[n].sid; if(s>=rMin&&s<=rMax)allInArc++; else allOutArc++; });
  if (allInArc===7 || allOutArc===7) {
    const ksNull = [];
    // Any planet within 5 deg of Rahu or Ketu
    pNames7.forEach(n=>{
      if(Math.abs(p[n].sid-rahuSid)<5||Math.abs(p[n].sid-ketuSid)<5)
        ksNull.push(`${n} conjunct node — breaks Kaal Sarpa`);
    });
    if(KENDRA.includes(H('Jupiter'))||TRIKONA.includes(H('Jupiter')))
      ksNull.push('Jupiter in Kendra/Trikona — reduces Kaal Sarpa effect');
    if(KENDRA.includes(H('Venus')))
      ksNull.push('Venus in Kendra — softens Kaal Sarpa');
    if(['Exalted','Own','Mooltrikona'].some(s=>ST('Moon').includes(s)))
      ksNull.push('Strong Moon — reduces Kaal Sarpa mental suffering');
    const ksType = arc < 180 ? 'Ascending (Rahu ahead — more difficult)' : 'Descending (Ketu ahead — spiritual)';
    yogas.push({
      name: ksNull.length ? 'Kaal Sarpa Yoga — PARTIALLY REDUCED' : 'Kaal Sarpa Yoga — ACTIVE',
      type: ksNull.length ? 'warn' : 'bad', nullified:ksNull.length>0, nullifiers:ksNull,
      desc: `${ksType}. All 7 planets between Rahu-Ketu axis. ${ksNull.length?'Partially reduced: '+ksNull.join('; '):'Intense karmic life, periodic obstacles, delays in major life events, sudden reversals, liberation after 45-48.'}`
    });
  }
 
  // ── 12. Neecha Bhanga Raja Yoga (complete rules) ──
  for (const [name, data] of Object.entries(p)) {
    if (!getPlanetStatus(name, data.rasiIdx).includes('Debilitated')) continue;
    const nbrNull = [];
    const debilSignIdx   = RASI_DEBIL[name];
    const exaltSignIdx   = RASI_EXALT[name];
    if(exaltSignIdx===undefined) continue;
    const debilSignLord  = RASI_LORD[debilSignIdx];
    const exaltSignLord  = RASI_LORD[exaltSignIdx];
    // Rule 1: Lord of debilitation sign in Kendra from Lagna
    if(KENDRA.includes(H(debilSignLord)))
      nbrNull.push(`Lord of debilitation sign ${debilSignLord} in Kendra (H${H(debilSignLord)})`);
    // Rule 2: Lord of exaltation sign in Kendra from Lagna
    if(KENDRA.includes(H(exaltSignLord)))
      nbrNull.push(`Lord of exaltation sign ${exaltSignLord} in Kendra (H${H(exaltSignLord)})`);
    // Rule 3: Debilitated planet itself in Kendra
    if(KENDRA.includes(H(name)))
      nbrNull.push(`${name} itself in Kendra (H${H(name)})`);
    // Rule 4: Lord of exaltation sign conjunct debilitated planet (within 10 deg)
    if(Math.abs(p[name].sid - p[exaltSignLord]?.sid)<10)
      nbrNull.push(`${exaltSignLord} (exaltation sign lord) conjunct ${name}`);
    // Rule 5: Debilitated planet conjunct exaltation lord
    if(Math.abs(p[name].sid - p[debilSignLord]?.sid)<10)
      nbrNull.push(`${debilSignLord} (debilitation sign lord) conjunct ${name}`);
    // Rule 6: Full Moon (Moon in exaltation or strong) when Moon is debilitated
    if(name==='Moon' && p.Moon.sid>170 && p.Moon.sid<190)
      nbrNull.push('Near full Moon reduces lunar debilitation');
 
    if(nbrNull.length>0)
      yogas.push({name:`${name} Neecha Bhanga Raja Yoga`,type:'good',planet:name,
        nullified:false,
        desc:`${name} debilitated in ${data.rasi} BUT Neecha Bhanga Raja Yoga applies: ${nbrNull.join('; ')} — turns weakness into extraordinary strength and Raja Yoga`});
    else
      yogas.push({name:`${name} Neecham — ACTIVE`,type:'bad',planet:name,
        desc:`${name} debilitated in ${data.rasi} with no cancellation — weakened significations, delays and struggles in ${name==='Sun'?'authority, father, government':name==='Moon'?'mind, mother, emotions':name==='Mars'?'courage, siblings, property':name==='Mercury'?'intelligence, education, speech':name==='Jupiter'?'wealth, children, wisdom':name==='Venus'?'marriage, comforts, arts':'career, longevity, discipline'}`});
  }
 
  // ── 13. Graha Yuddha (Planetary War) ──
  const warPlanets = ['Mars','Mercury','Jupiter','Venus','Saturn'];
  for(let i=0;i<warPlanets.length;i++) for(let j=i+1;j<warPlanets.length;j++){
    const diff = Math.abs(p[warPlanets[i]].sid - p[warPlanets[j]].sid);
    if(diff<1||diff>359){
      // Winner: planet with higher latitude (or brighter) — use Mars>Venus>Jupiter>Mercury>Saturn order
      const hierarchy = ['Mars','Venus','Jupiter','Mercury','Saturn'];
      const winner = hierarchy.find(pl=>pl===warPlanets[i])||warPlanets[i];
      const loser  = warPlanets[i]===winner?warPlanets[j]:warPlanets[i];
      yogas.push({name:`Graha Yuddha: ${warPlanets[i]} vs ${warPlanets[j]}`,type:'warn',
        desc:`${warPlanets[i]} and ${warPlanets[j]} within 1° — Planetary War. ${winner} wins, ${loser}'s significations are weakened during this period.`});
    }
  }
 
  // ── 14. Guru Chandala Yoga ──
  if(Math.abs(p.Jupiter.sid - p.Rahu.sid)<10)
    yogas.push({name:'Guru Chandala Yoga',type:'warn',
      desc:'Jupiter conjunct Rahu — unconventional wisdom, breaks from tradition, foreign or unorthodox teacher, obsessive learning'});
 
  // ── 15. Rahu-Venus conjunction ──
  if(Math.abs(p.Rahu.sid - p.Venus.sid)<10)
    yogas.push({name:'Rahu-Venus Conjunction',type:'warn',
      desc:'Rahu conjunct Venus — intense desires, unconventional relationships, artistic obsession, possibility of foreign partner'});
 
  // ── 16. Kemdrum Yoga (Moon alone, no planets in adjacent houses) ──
  const moonHouse = H('Moon');
  const adjH1 = normH(moonHouse-1), adjH2 = normH(moonHouse+1);
  const planetsExcludeSunRahuKetu = ['Mars','Mercury','Jupiter','Venus','Saturn'];
  const noAdjacentPlanets = planetsExcludeSunRahuKetu.every(
    pl => H(pl)!==adjH1 && H(pl)!==adjH2 && H(pl)!==moonHouse
  );
  if(noAdjacentPlanets){
    // Check nullification: Moon in Kendra, or aspected by benefic, or conjunct benefic
    const kemNull=[];
    if(KENDRA.includes(moonHouse)) kemNull.push('Moon in Kendra — Kemdrum cancelled');
    if(['Jupiter','Venus'].some(b=>getAspects(b,H(b)).includes(moonHouse)))
      kemNull.push('Benefic aspects Moon — Kemdrum reduced');
    yogas.push({
      name: kemNull.length?'Kemdrum Yoga — REDUCED':'Kemdrum Yoga — ACTIVE',
      type:'warn', nullified:kemNull.length>0, nullifiers:kemNull,
      desc: kemNull.length
        ? `Moon isolated in H${moonHouse} but ${kemNull.join('; ')} — mental loneliness reduced`
        : `Moon alone in H${moonHouse} with no planets in adjacent houses — periods of mental isolation, self-reliance, emotional sensitivity`
    });
  }
 
  // ── 17. Shasha Yoga check (Saturn in Kendra in own/exalt) ──
  // Already covered in Pancha Mahapurusha but add extra check
  if(KENDRA.includes(H('Saturn')) && ['Exalted','Own','Mooltrikona'].some(s=>ST('Saturn').includes(s)))
    ; // already detected above
 
  // ── 18. Current year Gochara summary (transits of Saturn and Jupiter) ──
  // This is computed separately in prompts but note it here
 
  return yogas;
}
 
// ── City coordinates ──
const CITY_COORDS = {
  'kottayam':{lat:9.5916,lon:76.5222,tz:5.5,name:'Kottayam, Kerala'},
  'chennai':{lat:13.0827,lon:80.2707,tz:5.5,name:'Chennai, Tamil Nadu'},
  'mumbai':{lat:19.0760,lon:72.8777,tz:5.5,name:'Mumbai, Maharashtra'},
  'delhi':{lat:28.6139,lon:77.2090,tz:5.5,name:'New Delhi'},
  'bangalore':{lat:12.9716,lon:77.5946,tz:5.5,name:'Bangalore, Karnataka'},
  'bengaluru':{lat:12.9716,lon:77.5946,tz:5.5,name:'Bangalore, Karnataka'},
  'hyderabad':{lat:17.3850,lon:78.4867,tz:5.5,name:'Hyderabad, Telangana'},
  'kolkata':{lat:22.5726,lon:88.3639,tz:5.5,name:'Kolkata, West Bengal'},
  'pune':{lat:18.5204,lon:73.8567,tz:5.5,name:'Pune, Maharashtra'},
  'ahmedabad':{lat:23.0225,lon:72.5714,tz:5.5,name:'Ahmedabad, Gujarat'},
  'coimbatore':{lat:11.0168,lon:76.9558,tz:5.5,name:'Coimbatore, Tamil Nadu'},
  'madurai':{lat:9.9252,lon:78.1198,tz:5.5,name:'Madurai, Tamil Nadu'},
  'trivandrum':{lat:8.5241,lon:76.9366,tz:5.5,name:'Thiruvananthapuram, Kerala'},
  'thiruvananthapuram':{lat:8.5241,lon:76.9366,tz:5.5,name:'Thiruvananthapuram, Kerala'},
  'kozhikode':{lat:11.2588,lon:75.7804,tz:5.5,name:'Kozhikode, Kerala'},
  'thrissur':{lat:10.5276,lon:76.2144,tz:5.5,name:'Thrissur, Kerala'},
  'ernakulam':{lat:9.9816,lon:76.2999,tz:5.5,name:'Ernakulam, Kerala'},
  'kochi':{lat:9.9312,lon:76.2673,tz:5.5,name:'Kochi, Kerala'},
  'salem':{lat:11.6643,lon:78.1460,tz:5.5,name:'Salem, Tamil Nadu'},
  'tirunelveli':{lat:8.7139,lon:77.7567,tz:5.5,name:'Tirunelveli, Tamil Nadu'},
  'trichy':{lat:10.7905,lon:78.7047,tz:5.5,name:'Tiruchirappalli, Tamil Nadu'},
  'tiruchirappalli':{lat:10.7905,lon:78.7047,tz:5.5,name:'Tiruchirappalli, Tamil Nadu'},
  'vellore':{lat:12.9165,lon:79.1325,tz:5.5,name:'Vellore, Tamil Nadu'},
  'mysore':{lat:12.2958,lon:76.6394,tz:5.5,name:'Mysore, Karnataka'},
  'mysuru':{lat:12.2958,lon:76.6394,tz:5.5,name:'Mysore, Karnataka'},
  'vijayawada':{lat:16.5062,lon:80.6480,tz:5.5,name:'Vijayawada, Andhra Pradesh'},
  'visakhapatnam':{lat:17.6868,lon:83.2185,tz:5.5,name:'Visakhapatnam, Andhra Pradesh'},
  'vizag':{lat:17.6868,lon:83.2185,tz:5.5,name:'Visakhapatnam, Andhra Pradesh'},
  'nagpur':{lat:21.1458,lon:79.0882,tz:5.5,name:'Nagpur, Maharashtra'},
  'surat':{lat:21.1702,lon:72.8311,tz:5.5,name:'Surat, Gujarat'},
  'jaipur':{lat:26.9124,lon:75.7873,tz:5.5,name:'Jaipur, Rajasthan'},
  'lucknow':{lat:26.8467,lon:80.9462,tz:5.5,name:'Lucknow, Uttar Pradesh'},
  'kanpur':{lat:26.4499,lon:80.3319,tz:5.5,name:'Kanpur, Uttar Pradesh'},
  'patna':{lat:25.5941,lon:85.1376,tz:5.5,name:'Patna, Bihar'},
  'bhopal':{lat:23.2599,lon:77.4126,tz:5.5,name:'Bhopal, Madhya Pradesh'},
  'indore':{lat:22.7196,lon:75.8577,tz:5.5,name:'Indore, Madhya Pradesh'},
  'nashik':{lat:19.9975,lon:73.7898,tz:5.5,name:'Nashik, Maharashtra'},
  'vadodara':{lat:22.3072,lon:73.1812,tz:5.5,name:'Vadodara, Gujarat'},
  'rajkot':{lat:22.3039,lon:70.8022,tz:5.5,name:'Rajkot, Gujarat'},
  'varanasi':{lat:25.3176,lon:82.9739,tz:5.5,name:'Varanasi, Uttar Pradesh'},
  'amritsar':{lat:31.6340,lon:74.8723,tz:5.5,name:'Amritsar, Punjab'},
  'chandigarh':{lat:30.7333,lon:76.7794,tz:5.5,name:'Chandigarh'},
  'guwahati':{lat:26.1445,lon:91.7362,tz:5.5,name:'Guwahati, Assam'},
  'bhubaneswar':{lat:20.2961,lon:85.8245,tz:5.5,name:'Bhubaneswar, Odisha'},
  'raipur':{lat:21.2514,lon:81.6296,tz:5.5,name:'Raipur, Chhattisgarh'},
  'mangalore':{lat:12.9141,lon:74.8560,tz:5.5,name:'Mangalore, Karnataka'},
  'mangaluru':{lat:12.9141,lon:74.8560,tz:5.5,name:'Mangalore, Karnataka'},
  'hubli':{lat:15.3647,lon:75.1240,tz:5.5,name:'Hubli, Karnataka'},
  'belgaum':{lat:15.8497,lon:74.4977,tz:5.5,name:'Belagavi, Karnataka'},
  'palakkad':{lat:10.7867,lon:76.6548,tz:5.5,name:'Palakkad, Kerala'},
  'kollam':{lat:8.8932,lon:76.6141,tz:5.5,name:'Kollam, Kerala'},
  'kannur':{lat:11.8745,lon:75.3704,tz:5.5,name:'Kannur, Kerala'},
  'trichur':{lat:10.5276,lon:76.2144,tz:5.5,name:'Thrissur, Kerala'},
  'thanjavur':{lat:10.7870,lon:79.1378,tz:5.5,name:'Thanjavur, Tamil Nadu'},
  'tanjore':{lat:10.7870,lon:79.1378,tz:5.5,name:'Thanjavur, Tamil Nadu'},
  'nagercoil':{lat:8.1833,lon:77.4119,tz:5.5,name:'Nagercoil, Tamil Nadu'},
  'kumbakonam':{lat:10.9602,lon:79.3845,tz:5.5,name:'Kumbakonam, Tamil Nadu'},
  'pondicherry':{lat:11.9416,lon:79.8083,tz:5.5,name:'Pondicherry'},
  'puducherry':{lat:11.9416,lon:79.8083,tz:5.5,name:'Puducherry'},
  'tirupati':{lat:13.6288,lon:79.4192,tz:5.5,name:'Tirupati, Andhra Pradesh'},
  'nellore':{lat:14.4426,lon:79.9865,tz:5.5,name:'Nellore, Andhra Pradesh'},
  'karimnagar':{lat:18.4386,lon:79.1288,tz:5.5,name:'Karimnagar, Telangana'},
  'warangal':{lat:17.9784,lon:79.5941,tz:5.5,name:'Warangal, Telangana'},
};
 
function getCityCoords(place) {
  const key = place.toLowerCase().trim().split(',')[0].trim().replace(/\./g,'');
  return CITY_COORDS[key] || null;
}
 
// ── Build complete chart ──
function buildFullChart(dob, tob, place, overrides = {}) {
  const [year, month, day] = dob.split('-').map(Number);
  const [hh, mm] = tob.split(':').map(Number);
 
  const coords = getCityCoords(place);
  if (!coords) throw new Error(`City "${place}" not found. Try a nearby major city name.`);
 
  const utcHours = hh - coords.tz + mm/60;
  const utcDay   = day + utcHours/24;
  const jdUT     = julian.CalendarGregorianToJD(year, month, utcDay);
 
  const { planets, ayanamsha } = getPlanetPositions(jdUT);
  const lagna = calcLagna(jdUT, coords.lat, coords.lon);
 
  let lagnaIdx = lagna.rasiIdx;
  if (overrides.lagna) {
    const idx = RASI_NAMES.indexOf(overrides.lagna);
    if (idx >= 0) { lagnaIdx = idx; lagna.rasiIdx = idx; lagna.rasi = RASI_NAMES[idx]; lagna.rasiEn = RASI_EN[idx]; lagna.rasiTamil = RASI_TAMIL[idx]; lagna.lord = RASI_LORD[idx]; }
  }
  if (overrides.rasi) {
    const idx = RASI_NAMES.indexOf(overrides.rasi);
    if (idx >= 0) { planets.Moon.rasiIdx = idx; planets.Moon.rasi = RASI_NAMES[idx]; }
  }
 
  for (const [name, p] of Object.entries(planets)) {
    p.house   = getHouseNum(lagnaIdx, p.rasiIdx);
    p.status  = getPlanetStatus(name, p.rasiIdx);
    p.bala    = getSimplifiedBala(name, p.rasiIdx, p.house);
    p.aspects = getAspects(name, p.house);
    p.houseSignif = HOUSE_SIGNIF[p.house];
  }
 
  // Nakshatra — honour user override if provided, else calculate from Moon
  let moonNakIdx   = planets.Moon.nakIdx;
  let moonDegInNak = planets.Moon.sid % (360/27);
 
  if (overrides.nakshatra) {
    const nIdx = NAK_NAMES.indexOf(overrides.nakshatra);
    if (nIdx >= 0) {
      moonNakIdx    = nIdx;
      moonDegInNak  = (360/27) * 0.5; // middle of nakshatra for dasha calc
      planets.Moon.nakIdx    = nIdx;
      planets.Moon.nakshatra = NAK_NAMES[nIdx];
      planets.Moon.nakLord   = NAK_LORD[nIdx];
      planets.Moon.pada      = 2; // default pada 2 if not specified
    }
  }
 
  const nakshatra = {
    name:     NAK_NAMES[moonNakIdx],
    tamil:    NAK_TAMIL[moonNakIdx],
    lord:     NAK_LORD[moonNakIdx],
    gana:     NAK_GANA[moonNakIdx],
    nadi:     NAK_NADI[moonNakIdx],
    yoni:     NAK_YONI[moonNakIdx],
    pada:     planets.Moon.pada,
    index:    moonNakIdx,
    degInNak: parseFloat(moonDegInNak.toFixed(4)),
    deity:    NAK_DEITY[moonNakIdx],
    symbol:   NAK_SYMBOL[moonNakIdx],
    type:     NAK_TYPE[moonNakIdx],
  };
 
  const dasha = calcDasha(dob, moonNakIdx, moonDegInNak);
  const yogas = detectYogas(planets, lagnaIdx);
 
  const houses = {};
  for (let h = 1; h <= 12; h++) houses[h] = [];
  for (const [name, p] of Object.entries(planets)) houses[p.house].push(name);
 
  const lagnaLord        = RASI_LORD[lagnaIdx];
  const lagnaLordPlanet  = planets[lagnaLord];
 
  // Planet aspects on each house
  const houseAspects = {};
  for (let h = 1; h <= 12; h++) houseAspects[h] = [];
  for (const [name, p] of Object.entries(planets)) {
    p.aspects.forEach(ah => {
      if (!houseAspects[ah]) houseAspects[ah] = [];
      houseAspects[ah].push(name);
    });
  }
 
  return {
    input: { dob, tob, place, coords },
    jd: jdUT,
    ayanamsha: parseFloat(ayanamsha.toFixed(4)),
    lagna: {
      ...lagna, rasiIdx: lagnaIdx,
      rasi: RASI_NAMES[lagnaIdx], rasiEn: RASI_EN[lagnaIdx], rasiTamil: RASI_TAMIL[lagnaIdx],
      lord: lagnaLord, lordHouse: lagnaLordPlanet?.house, lordStatus: lagnaLordPlanet?.status,
    },
    rasi: {
      name: planets.Moon.rasi, tamil: planets.Moon.rasiTamil, en: planets.Moon.rasiEn,
      lord: RASI_LORD[planets.Moon.rasiIdx], index: planets.Moon.rasiIdx,
    },
    nakshatra,
    planets,
    houses,
    houseAspects,
    dasha,
    yogas,
    houseSignif: HOUSE_SIGNIF,
    metadata: { calculatedAt: new Date().toISOString(), method: 'Lahiri Ayanamsha, Sidereal, Whole Sign Houses' }
  };
}
 
module.exports = {
  buildFullChart, RASI_NAMES, RASI_EN, RASI_TAMIL, RASI_LORD, RASI_EXALT, RASI_DEBIL,
  NAK_NAMES, NAK_TAMIL, NAK_LORD, NAK_YEARS, NAK_GANA, NAK_NADI, NAK_YONI, NAK_DEITY,
  DASHA_ORDER, getCityCoords, HOUSE_SIGNIF, getHouseNum, getAspects
};
 
