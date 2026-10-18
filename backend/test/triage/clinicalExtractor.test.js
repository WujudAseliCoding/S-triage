import { test, before, after, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseModelJson,
  keywordExtraction,
  extractClinicalInformation,
} from '../../src/services/triage/clinicalExtractor.js';
import { validateExtraction, failedExtraction } from '../../src/services/triage/extractionSchema.js';

const ORIGINAL_KEY = process.env.WAY_API_KEY;
const ORIGINAL_FETCH = globalThis.fetch;

afterEach(() => {
  if (ORIGINAL_KEY === undefined) delete process.env.WAY_API_KEY;
  else process.env.WAY_API_KEY = ORIGINAL_KEY;
  globalThis.fetch = ORIGINAL_FETCH;
});

const gatewayResponse = (content, { ok = true, status = 200 } = {}) => async () => ({
  ok,
  status,
  json: async () => ({ choices: [{ message: { content } }] }),
});

const VALID_EXTRACTION = {
  factual_summary: 'Pasien mengeluh batuk kering.',
  chief_complaint_summary: 'Batuk kering',
  symptoms: [{ name: 'batuk', onset: '2 hari', duration: '2 hari', details: null, source: 'patient' }],
  warning_signs: [],
  red_flags: [],
  high_risk_flags: [],
  reported_vitals: {},
  mental_status: 'normal',
  pain_scale: null,
  missing_information: ['tanda vital'],
};

test('parseModelJson: plain, fenced, and prose-wrapped JSON', () => {
  assert.deepEqual(parseModelJson('{"a":1}'), { a: 1 });
  assert.deepEqual(parseModelJson('```json\n{"a":1}\n```'), { a: 1 });
  assert.deepEqual(parseModelJson('Here you go: {"a":1} thanks'), { a: 1 });
  assert.throws(() => parseModelJson('not json at all'));
});

test('validateExtraction: accepts valid, rejects missing fields, rejects invented enum values', () => {
  assert.equal(validateExtraction(VALID_EXTRACTION).ok, true);
  assert.equal(validateExtraction({ chief_complaint_summary: 'x' }).ok, false);
  const invented = validateExtraction({ ...VALID_EXTRACTION, red_flags: ['definitely_not_a_code'] });
  assert.equal(invented.ok, false);
  const badMental = validateExtraction({ ...VALID_EXTRACTION, mental_status: 'coma' });
  assert.equal(badMental.ok, false);
});

test('keywordExtraction detects danger and high-risk without any model', () => {
  const r = keywordExtraction('Pasien tidak sadar dan sesak napas berat, nyeri dada');
  assert.ok(r.red_flags.includes('unresponsive'));
  assert.ok(r.red_flags.includes('severe_respiratory_distress'));
  assert.ok(r.high_risk_flags.includes('possible_acs_chest_pain'));
  assert.equal(r.extraction_mode, 'keyword_fallback');
});

test('failedExtraction is explicitly marked and never claims a category', () => {
  const f = failedExtraction('timeout');
  assert.equal(f.extraction_failed, true);
  assert.equal(f.mental_status, 'unknown');
});

test('extraction: no API key -> keyword fallback (ok, not a failure)', async () => {
  delete process.env.WAY_API_KEY;
  const r = await extractClinicalInformation('batuk ringan');
  assert.equal(r.mode, 'keyword_fallback');
  assert.equal(r.ok, true);
});

test('extraction: valid model JSON -> llm mode with validated data', async () => {
  process.env.WAY_API_KEY = 'test-key';
  globalThis.fetch = gatewayResponse(JSON.stringify(VALID_EXTRACTION));
  const r = await extractClinicalInformation('batuk kering 2 hari');
  assert.equal(r.mode, 'llm');
  assert.equal(r.data.chief_complaint_summary, 'Batuk kering');
});

test('extraction: invalid JSON -> keyword fallback with recorded error', async () => {
  process.env.WAY_API_KEY = 'test-key';
  globalThis.fetch = gatewayResponse('this is not json');
  const r = await extractClinicalInformation('nyeri dada');
  assert.equal(r.mode, 'keyword_fallback');
  assert.match(r.error, /JSON/);
  assert.ok(r.data.high_risk_flags.includes('possible_acs_chest_pain'));
});

test('extraction: schema mismatch -> keyword fallback (never presented as valid)', async () => {
  process.env.WAY_API_KEY = 'test-key';
  globalThis.fetch = gatewayResponse(JSON.stringify({ ...VALID_EXTRACTION, red_flags: ['made_up'] }));
  const r = await extractClinicalInformation('batuk');
  assert.equal(r.mode, 'keyword_fallback');
  assert.match(r.error, /Skema/);
});

test('extraction: gateway HTTP error -> explicit failure', async () => {
  process.env.WAY_API_KEY = 'test-key';
  globalThis.fetch = gatewayResponse('', { ok: false, status: 500 });
  const r = await extractClinicalInformation('batuk');
  assert.equal(r.mode, 'failed');
  assert.equal(r.ok, false);
  assert.equal(r.data.extraction_failed, true);
});

test('extraction: empty model result -> explicit failure', async () => {
  process.env.WAY_API_KEY = 'test-key';
  globalThis.fetch = gatewayResponse('');
  const r = await extractClinicalInformation('batuk');
  assert.equal(r.mode, 'failed');
  assert.equal(r.code, 'EMPTY_RESPONSE');
});

test('extraction: timeout -> explicit failure (AbortError mapped)', async () => {
  process.env.WAY_API_KEY = 'test-key';
  globalThis.fetch = (url, opts) =>
    new Promise((_resolve, reject) => {
      opts.signal.addEventListener('abort', () => {
        const err = new Error('aborted');
        err.name = 'AbortError';
        reject(err);
      });
    });
  const r = await extractClinicalInformation('batuk', { timeoutMs: 15 });
  assert.equal(r.mode, 'failed');
  assert.equal(r.code, 'TIMEOUT');
});

test('extraction: empty complaint -> failure, never a classification', async () => {
  const r = await extractClinicalInformation('   ');
  assert.equal(r.mode, 'failed');
});
