'use strict';
const Anthropic = require('@anthropic-ai/sdk');
const { buildFullChart } = require('./ephemeris');
const { calcPorutham } = require('./matching');
const { buildMatchPrompt } = require('./prompts');

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin","*");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: 'POST only' });

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
    const prompt = buildMatchPrompt(chart1, chart2, person1, person2, matchResult);

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4000,
      system: 'You are a master Tamil Jyotish astrologer specializing in marriage compatibility. Give precise, chart-specific analysis. Use === SECTION === headers.',
      messages: [{ role: 'user', content: prompt }],
    });

    const reading = message.content.map(c => c.text || '').join('');
    res.status(200).json({ ok: true, chart1, chart2, matchResult, reading });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
};
