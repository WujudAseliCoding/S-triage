/**
 * Runs the offline classification evaluation against the synthetic reference set.
 *
 *   npm run eval -w backend      (or: node test/evaluation/runEvaluation.js)
 *
 * NOTE: reference labels are synthetic/implementer-authored (see dataset.js).
 * Results measure CONSISTENCY with that reference set, not clinical validity.
 */
import { CASES, PARAPHRASE_CASES } from './dataset.js';
import { summarize, LABELS } from './metrics.js';
import { evaluateTriage, RULE_VERSION, CLASSIFICATION_STATUS } from '../../src/services/triage/esiRuleEngine.js';
import { classifyPatient, normalizeAge } from '../../src/services/triage/classificationService.js';

/**
 * Faithful re-implementation of the ORIGINAL keyword classifier
 * (backend/src/config/ai.js @ git 915e4ef, `fallbackTriageAnalysis`).
 * Used ONLY as a baseline for honest before/after comparison.
 */
export function baselinePredict(keluhan, vitalSigns = {}) {
  const t = String(keluhan || '').toLowerCase();
  if (t.includes('meninggal') || t.includes('mati') || t.includes('tidak bernyawa')) return 'P0';
  if (
    t.includes('sesak napas berat') || t.includes('nyeri dada kiri') || t.includes('jantung') ||
    t.includes('tidak sadar') || t.includes('pingsan') || t.includes('kejang') ||
    t.includes('perdarahan hebat') || (vitalSigns.spo2 && vitalSigns.spo2 < 90)
  ) return 'P1';
  if (
    t.includes('sesak') || t.includes('nyeri hebat') || t.includes('patah tulang') ||
    t.includes('fraktur') || t.includes('luka bakar') || t.includes('asma') ||
    (vitalSigns.suhu && vitalSigns.suhu >= 39)
  ) return 'P2';
  return 'P3';
}

const isCategory = (c) => LABELS.includes(c);

function engineResultFor(c) {
  const age = normalizeAge(c.age ?? 40, c.satuan ?? 'Tahun');
  const structured = c.structured || {};
  return evaluateTriage({
    chief_complaint: c.complaint,
    red_flags: structured.red_flags || [],
    high_risk_flags: structured.high_risk_flags || [],
    mental_status: structured.mental_status || 'normal',
    pain_scale: structured.pain_scale ?? c.pain ?? null,
    vitals: c.vitals || {},
    vitals_verified: c.verified === true,
    ...age,
  });
}

export async function evaluateSet(cases) {
  const enginePairs = [];
  const e2ePairs = [];
  const baselinePairs = [];
  let engineUndetermined = 0;
  let e2eUndetermined = 0;
  const e2eModes = { llm: 0, keyword_fallback: 0, failed: 0 };
  const perCase = [];

  for (const c of cases) {
    const eng = engineResultFor(c);
    if (isCategory(eng.category)) enginePairs.push({ reference: c.reference, predicted: eng.category });
    else engineUndetermined += 1;

    const e2e = await classifyPatient({
      nama_pasien: 'Evaluasi',
      umur: c.age ?? 40,
      satuan_umur: c.satuan ?? 'Tahun',
      keluhan_utama: c.complaint,
      tanda_vital: c.vitals || {},
      skala_nyeri: c.pain,
    });
    if (isCategory(e2e.classification.category)) e2ePairs.push({ reference: c.reference, predicted: e2e.classification.category });
    else e2eUndetermined += 1;

    const mode = e2e.extraction?.mode || 'failed';
    e2eModes[mode] = (e2eModes[mode] || 0) + 1;

    const base = baselinePredict(c.complaint, c.vitals || {});
    baselinePairs.push({ reference: c.reference, predicted: base });

    perCase.push({
      id: c.id,
      reference: c.reference,
      engine: eng.category ?? 'REVIEW',
      e2e: e2e.classification.category ?? 'REVIEW',
      mode,
      baseline: base,
    });
  }

  return {
    counts: { cases: cases.length, engineUndetermined, e2eUndetermined, e2eModes },
    engine: summarize(enginePairs, { undetermined: engineUndetermined, total: cases.length }),
    endToEnd: summarize(e2ePairs, { undetermined: e2eUndetermined, total: cases.length }),
    baseline: summarize(baselinePairs, { undetermined: 0, total: cases.length }),
    perCase,
  };
}

export async function runEvaluation() {
  const base = await evaluateSet(CASES);
  const paraphrase = await evaluateSet(PARAPHRASE_CASES);
  return { ruleVersion: RULE_VERSION, base, paraphrase };
}

function pct(x) {
  return x === null || x === undefined ? 'n/a' : `${(x * 100).toFixed(1)}%`;
}

function printSection(title, s, modes) {
  console.log(`\n=== ${title} ===`);
  console.log(`classified: ${s.evaluated}/${s.total}   undetermined(review): ${s.undetermined} (${pct(s.reviewRequiredRate)})`);
  if (modes) {
    console.log(`extraction modes: llm=${modes.llm || 0}  keyword_fallback=${modes.keyword_fallback || 0}  failed=${modes.failed || 0}`);
  }
  console.log(`accuracy: ${pct(s.accuracy)}   macroF1: ${pct(s.macroF1)}`);
  console.log(`under-triage: ${s.errors.under}   over-triage: ${s.errors.over}   correct: ${s.errors.correct}`);
  console.log('per-class  precision / recall / f1 / support');
  for (const l of LABELS) {
    const m = s.perClass[l];
    console.log(`  ${l}   ${pct(m.precision)} / ${pct(m.recall)} / ${pct(m.f1)} / ${m.support}`);
  }
  console.log('confusion (rows=reference, cols=predicted):');
  console.log('        ' + LABELS.join('    '));
  for (const r of LABELS) {
    console.log(`  ${r}    ` + LABELS.map((c) => String(s.confusion[r][c]).padStart(3)).join('    '));
  }
}

async function main() {
  const r = await runEvaluation();
  console.log('S-Triage classification evaluation');
  console.log(`rule_version=${r.ruleVersion}`);
  console.log('Reference labels are SYNTHETIC / implementer-authored (not clinically reviewed).');
  console.log('Metrics measure consistency vs the reference set, not clinical validity.');
  console.log(`\n## Base set (${r.base.counts.cases} cases)`);
  printSection('A. Deterministic rule engine (gold structured input) — spec conformance', r.base.engine);
  printSection('B. End-to-end pipeline (extraction + engine; live LLM when WAY_API_KEY is set)', r.base.endToEnd, r.base.counts.e2eModes);
  printSection('C. Baseline (original keyword classifier)', r.base.baseline);
  console.log('\nPer-case (base):');
  for (const c of r.base.perCase) {
    console.log(`  ${c.id}  ref=${c.reference}  engine=${c.engine}  e2e=${c.e2e} (${c.mode})  baseline=${c.baseline}`);
  }

  console.log(`\n## Paraphrase robustness set (${r.paraphrase.counts.cases} cases; keyword fallback is NOT tuned to these)`);
  printSection('D. Rule engine (gold structured input)', r.paraphrase.engine);
  printSection('E. End-to-end pipeline (extraction + engine)', r.paraphrase.endToEnd, r.paraphrase.counts.e2eModes);
  console.log('\nPer-case (paraphrase):');
  for (const c of r.paraphrase.perCase) {
    console.log(`  ${c.id}  ref=${c.reference}  engine=${c.engine}  e2e=${c.e2e} (${c.mode})  baseline=${c.baseline}`);
  }
}

if (process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('test/evaluation/runEvaluation.js')) {
  main();
}

export default { runEvaluation, evaluateSet, baselinePredict };
