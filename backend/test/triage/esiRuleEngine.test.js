import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  evaluateTriage,
  evaluateDegraded,
  conservativeRawScan,
  buildContext,
  RULE_VERSION,
  CLASSIFICATION_STATUS,
} from '../../src/services/triage/esiRuleEngine.js';

const benign = () => ({ chief_complaint: 'batuk ringan sejak 2 hari', mental_status: 'normal' });

test('rule engine: version is exposed and deterministic', () => {
  assert.equal(RULE_VERSION, 'fkpt-adapted-2026.10.1');
  const a = evaluateTriage({ chief_complaint: 'demam 2 hari', red_flags: ['unresponsive'] });
  const b = evaluateTriage({ chief_complaint: 'demam 2 hari', red_flags: ['unresponsive'] });
  assert.deepEqual(a, b);
});

test('A: red flag -> P1 SUPPORTED with escalation', () => {
  const r = evaluateTriage({ chief_complaint: 'tidak sadar', red_flags: ['unresponsive'], mental_status: 'unresponsive_or_acute_change' });
  assert.equal(r.category, 'P1');
  assert.equal(r.classification_status, CLASSIFICATION_STATUS.SUPPORTED);
  assert.equal(r.decision_step, 'A');
  assert.equal(r.escalation.required, true);
  assert.ok(r.applied_rule_ids.includes('A1-red-flag'));
});

test('A: SpO2 < 90 (verified vitals) -> P1', () => {
  const r = evaluateTriage({ ...benign(), vitals: { spo2: 88 }, vitals_verified: true });
  assert.equal(r.category, 'P1');
  assert.ok(r.applied_rule_ids.includes('A2-spo2-below-90'));
});

test('A: SpO2 < 90 is ignored when vitals are not clinician-verified', () => {
  const r = evaluateTriage({ ...benign(), vitals: { spo2: 88 }, vitals_verified: false });
  assert.notEqual(r.category, 'P1');
  assert.ok(!r.applied_rule_ids.includes('A2-spo2-below-90'));
});

test('B: high-risk condition -> P2', () => {
  const r = evaluateTriage({ ...benign(), high_risk_flags: ['possible_acs_chest_pain'] });
  assert.equal(r.category, 'P2');
  assert.equal(r.decision_step, 'B');
  assert.equal(r.escalation.required, true);
});

test('B: severe pain >= 7 -> P2, 6 -> not P2', () => {
  assert.equal(evaluateTriage({ ...benign(), pain_scale: 8 }).category, 'P2');
  assert.equal(evaluateTriage({ ...benign(), pain_scale: 6 }).category, 'P3');
});

test('B: pediatric fever thresholds (verified vitals only)', () => {
  const neonate = evaluateTriage({ chief_complaint: 'demam', age_days: 10, age_months: 0.3, vitals: { suhu: 38.5 }, vitals_verified: true });
  assert.equal(neonate.category, 'P2');
  assert.ok(neonate.applied_rule_ids.includes('B4-pediatric-fever-neonate'));

  const afebrile = evaluateTriage({ chief_complaint: 'demam', age_days: 10, age_months: 0.3, vitals: { suhu: 37.2 }, vitals_verified: true });
  assert.equal(afebrile.category, 'P3');

  const notVerified = evaluateTriage({ chief_complaint: 'demam', age_days: 10, age_months: 0.3, vitals: { suhu: 38.5 }, vitals_verified: false });
  assert.equal(notVerified.category, 'P3');
});

test('decision order: earlier step A wins over later step B', () => {
  const r = evaluateTriage({ ...benign(), red_flags: ['apneic'], high_risk_flags: ['possible_stroke'], pain_scale: 9 });
  assert.equal(r.category, 'P1');
  assert.equal(r.decision_step, 'A');
  assert.deepEqual(r.applied_rule_ids, ['A1-red-flag']);
});

test('C: adequate negative screen -> P3 SUPPORTED (not review)', () => {
  const r = evaluateTriage(benign());
  assert.equal(r.category, 'P3');
  assert.equal(r.classification_status, CLASSIFICATION_STATUS.SUPPORTED);
  assert.equal(r.review_required, false);
  assert.ok(r.applied_rule_ids.includes('C1-default-non-urgent'));
});

test('missing information -> REVIEW_REQUIRED, category null, provisional queue never P3', () => {
  const r = evaluateTriage({ mental_status: 'normal' }); // no complaint text at all
  assert.equal(r.category, null);
  assert.equal(r.classification_status, CLASSIFICATION_STATUS.REVIEW_REQUIRED);
  assert.equal(r.review_required, true);
  assert.equal(r.provisional, true);
  assert.equal(r.queue_category, 'P2');
});

test('never returns P0 (deceased is a human-confirmed outcome, not an AI output)', () => {
  for (const input of [
    { chief_complaint: 'pasien meninggal', red_flags: ['unresponsive'] },
    { chief_complaint: 'tidak bernyawa' },
    benign(),
  ]) {
    const r = evaluateTriage(input);
    assert.notEqual(r.category, 'P0');
    assert.notEqual(r.queue_category, 'P0');
  }
});

test('invalid / malformed inputs do not throw and are coerced', () => {
  const r = evaluateTriage({ red_flags: 'unresponsive', high_risk_flags: 42, vitals: 'nope', vitals_verified: 'yes', pain_scale: 'x', age_days: 'y', mental_status: 7, chief_complaint: null });
  assert.equal(r.classification_status, CLASSIFICATION_STATUS.REVIEW_REQUIRED);
  assert.equal(r.category, null);
  assert.deepEqual(r.applied_rule_ids, []);
});

test('reason is generated from executed rules, not prose', () => {
  const r = evaluateTriage({ ...benign(), high_risk_flags: ['possible_stroke'] });
  assert.ok(r.alasan_esi.includes('B1-high-risk-condition'));
  assert.ok(r.supporting_facts.some((f) => f.rule_id === 'B1-high-risk-condition'));
  assert.equal(r.resource_assessment.status, 'not_assessed');
  assert.equal(r.esi_supported, false);
  assert.equal(r.esi_level, null);
});

test('unknown vitals are recorded as missing information but do not block a screen', () => {
  const r = evaluateTriage(benign());
  assert.ok(r.missing_information.some((m) => /Tanda vital terverifikasi belum tersedia/.test(m)));
  assert.equal(r.classification_status, CLASSIFICATION_STATUS.SUPPORTED);
});

test('degraded evaluation: danger keyword -> P1 and never suppressed', () => {
  const r = evaluateDegraded({ rawText: 'pasien sesak napas berat dan nyeri dada', vitals: {}, vitals_verified: false, age_years: 50 });
  assert.equal(r.category, 'P1');
  assert.equal(r.classification_status, CLASSIFICATION_STATUS.SUPPORTED);
  assert.equal(r.escalation.required, true);
});

test('degraded evaluation: benign text -> REVIEW_REQUIRED (never a plain P3)', () => {
  const r = evaluateDegraded({ rawText: 'batuk ringan', vitals: {}, vitals_verified: false, age_years: 20 });
  assert.equal(r.classification_status, CLASSIFICATION_STATUS.REVIEW_REQUIRED);
  assert.equal(r.category, null);
  assert.equal(r.review_required, true);
});

test('conservative raw scan finds danger and high-risk keywords', () => {
  const scan = conservativeRawScan('NYERI DADA dan sesak napas berat, riwayat stroke');
  assert.ok(scan.dangerKeywords.includes('nyeri dada'));
  assert.ok(scan.highRiskKeywords.includes('stroke'));
});

test('buildContext keeps only recognized flag codes out of free text', () => {
  const ctx = buildContext({ red_flags: ['unresponsive', 'totally_made_up'], high_risk_flags: [] });
  assert.deepEqual(ctx.redFlags, ['unresponsive', 'totally_made_up']);
});
