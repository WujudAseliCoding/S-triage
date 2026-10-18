import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { runEvaluation, evaluateSet, baselinePredict } from './runEvaluation.js';

const ORIGINAL_KEY = process.env.WAY_API_KEY;

// The offline evaluation must be deterministic and network-free.
before(() => { delete process.env.WAY_API_KEY; });
after(() => {
  if (ORIGINAL_KEY === undefined) delete process.env.WAY_API_KEY;
  else process.env.WAY_API_KEY = ORIGINAL_KEY;
});

test('evaluation: rule engine conforms to the reference specification on both sets', async () => {
  const r = await runEvaluation();
  assert.equal(r.base.counts.cases, 30);
  assert.equal(r.paraphrase.counts.cases, 8);
  assert.equal(r.base.engine.accuracy, 1);
  assert.equal(r.paraphrase.engine.accuracy, 1);
});

test('evaluation: the on/offline pipeline is at least as good as the original baseline', async () => {
  const r = await runEvaluation();
  assert.ok(r.base.endToEnd.accuracy >= r.base.baseline.accuracy);
  assert.ok(r.paraphrase.endToEnd.accuracy >= r.paraphrase.baseline.accuracy);
});

test('evaluation: baseline reproduces the historical classifier behaviour', () => {
  assert.equal(baselinePredict('pasien meninggal'), 'P0');
  assert.equal(baselinePredict('sesak napas berat'), 'P1');
  assert.equal(baselinePredict('demam dengan suhu tinggi', { suhu: 39.5 }), 'P2');
  assert.equal(baselinePredict('batuk ringan'), 'P3');
});

test('evaluation: results are deterministic (same input -> same output)', async () => {
  const a = await evaluateSet([{ id: 'X', complaint: 'nyeri dada kiri', reference: 'P2', structured: { high_risk_flags: ['possible_acs_chest_pain'] } }]);
  const b = await evaluateSet([{ id: 'X', complaint: 'nyeri dada kiri', reference: 'P2', structured: { high_risk_flags: ['possible_acs_chest_pain'] } }]);
  assert.deepEqual(a.engine, b.engine);
  assert.deepEqual(a.perCase, b.perCase);
});

test('evaluation: no prediction is ever P0 in the reference-labelled sets', async () => {
  const r = await runEvaluation();
  for (const c of [...r.base.perCase, ...r.paraphrase.perCase]) {
    assert.notEqual(c.engine, 'P0');
    assert.notEqual(c.e2e, 'P0');
  }
});
