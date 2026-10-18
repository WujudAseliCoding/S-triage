import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeAge,
  hasVerifiedVitals,
  legacyScoreForCategory,
  classifyPatient,
} from '../../src/services/triage/classificationService.js';

const ORIGINAL_KEY = process.env.WAY_API_KEY;
afterEach(() => {
  if (ORIGINAL_KEY === undefined) delete process.env.WAY_API_KEY;
  else process.env.WAY_API_KEY = ORIGINAL_KEY;
});

test('normalizeAge converts years, months and days consistently', () => {
  assert.deepEqual(normalizeAge(40, 'Tahun').age_years, 40);
  assert.equal(normalizeAge(6, 'Bulan').age_months, 6);
  assert.ok(Math.abs(normalizeAge(6, 'Bulan').age_days - 6 * 30.4375) < 1e-9);
  assert.equal(normalizeAge(10, 'Hari').age_days, 10);
  assert.deepEqual(normalizeAge(0, 'Tahun'), { age_years: null, age_months: null, age_days: null });
  assert.deepEqual(normalizeAge('nope'), { age_years: null, age_months: null, age_days: null });
});

test('hasVerifiedVitals only true for numeric vitals', () => {
  assert.equal(hasVerifiedVitals({ spo2: 98 }), true);
  assert.equal(hasVerifiedVitals({ spo2: 'low' }), false);
  assert.equal(hasVerifiedVitals({}), false);
  assert.equal(hasVerifiedVitals(null), false);
});

test('legacyScoreForCategory keeps the old 1-5 scale for compatibility', () => {
  assert.equal(legacyScoreForCategory('P1'), 5);
  assert.equal(legacyScoreForCategory('P2'), 3);
  assert.equal(legacyScoreForCategory('P3'), 1);
});

test('classifyPatient: end-to-end (keyword fallback) separates extraction from rules', async () => {
  delete process.env.WAY_API_KEY;
  const r = await classifyPatient({
    nama_pasien: 'Uji',
    umur: 55,
    keluhan_utama: 'Nyeri dada kiri menjalar ke lengan sejak 30 menit, keringat dingin',
    tanda_vital: {},
  });
  assert.equal(r.extraction.mode, 'keyword_fallback');
  assert.equal(r.classification.queue_category, 'P2');
  assert.equal(r.classification.classification_status, 'SUPPORTED');
  assert.ok(r.classification.applied_rule_ids.length > 0);
  assert.ok(r.analisis_ai.length > 0);
});

test('classifyPatient: a failed extraction cannot yield a plain non-urgent label', async () => {
  delete process.env.WAY_API_KEY;
  // empty complaint triggers failure mode inside the pipeline
  const r = await classifyPatient({ nama_pasien: 'Uji', umur: 30, keluhan_utama: '', tanda_vital: {} });
  assert.notEqual(r.classification.category, 'P3');
  assert.equal(r.classification.review_required, true);
});
