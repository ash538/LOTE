const express = require('express');
const ref = require('../../portal/data/reference');

const router = express.Router();

// Everything the portal frontend needs to render its static sections,
// in one payload. Individual slices are also exposed below.
router.get('/', (req, res) => {
  res.json({
    corridors: ref.CORRIDORS,
    scenarios: ref.SCENARIOS,
    languages: ref.ALL_LANGS,
    methodOptions: ref.METHOD_OPTS,
    orgTypes: ref.ORG_TYPES,
    segments: ref.SEGMENTS,
    personas: ref.PERSONAS,
    factors: ref.FACTORS,
    recommendations: ref.RECS,
    interventions: ref.INTERVENTIONS,
    cagView: ref.CAG_VIEW,
    cultures: ref.CULTURE,
    assets: ref.ASSETS,
    roadmap: ref.ROADMAP,
    journey: ref.JOURNEY,
    strategy: ref.STRAT,
    measurement: ref.MEASURE,
  });
});

// Language profiles: scoring matrix + guidance merged per language
router.get('/languages', (req, res) => {
  const out = ref.ALL_LANGS.map((name) => ({
    name,
    ...ref.LANG[name],
    note: ref.LANGNOTE[name] || '',
    message: ref.MESSAGE[name] || null,
    channels: ref.CHANNELS[name] || [],
    behaviouralRead: ref.LANGINSIGHT[name] || null,
  }));
  res.json(out);
});

router.get('/languages/:name', (req, res) => {
  const name = req.params.name;
  if (!ref.LANG[name]) return res.status(404).json({ error: `Unknown language: ${name}` });
  res.json({
    name,
    ...ref.LANG[name],
    note: ref.LANGNOTE[name] || '',
    message: ref.MESSAGE[name] || null,
    channels: ref.CHANNELS[name] || [],
    behaviouralRead: ref.LANGINSIGHT[name] || null,
  });
});

// Translation Decision Tool: ranked language priorities for a corridor + scenario
router.get('/prioritise', (req, res) => {
  const corridor = req.query.corridor || ref.CORRIDORS[0];
  const scenario = req.query.scenario || ref.SCENARIOS[0];
  if (!ref.DATA[corridor]) {
    return res.status(400).json({ error: `Unknown corridor: ${corridor}`, valid: ref.CORRIDORS });
  }
  if (!ref.WEIGHTS[scenario]) {
    return res.status(400).json({ error: `Unknown scenario: ${scenario}`, valid: ref.SCENARIOS });
  }
  const rows = ref.compute(corridor, scenario).map((r) => ({
    language: r.lang,
    score: +r.score.toFixed(1),
    tier: r.tier,
    reach: r.reach,
    lowEnglish: r.low,
    commercialLens: +r.commercial.toFixed(2),
    socialLens: +r.social.toFixed(2),
    lensRead: ref.READTXT[r.read],
    lead: r.L.lead,
    format: r.L.format,
    indicative: (ref.DATA_FLAG[corridor] || []).includes(r.lang),
  }));
  res.json({ corridor, scenario, weights: ref.WEIGHTS[scenario], results: rows });
});

// Area & Communities lookup: postcode ("2166") or LGA ("lga:Fairfield")
router.get('/areas', (req, res) => {
  const corridor = req.query.corridor;
  if (corridor) {
    if (!ref.DATA[corridor]) {
      return res.status(400).json({ error: `Unknown corridor: ${corridor}`, valid: ref.CORRIDORS });
    }
    return res.json(ref.areaOptions(corridor));
  }
  res.json({
    postcodes: Object.keys(ref.AREA).map((pc) => ({ token: pc, suburb: ref.AREA[pc].s, state: ref.AREA[pc].st })),
    lgas: ref.LGA_DETAIL.map((l) => ({ token: `lga:${l.n}`, name: l.n, state: l.st })),
  });
});

router.get('/areas/:token', (req, res) => {
  const resolved = ref.areaResolve(req.params.token);
  if (!resolved) return res.status(404).json({ error: `Unknown area token: ${req.params.token}` });
  res.json({ ...resolved, suggestedLanguages: ref.areaTokenLangs(req.params.token, 6) });
});

module.exports = router;
