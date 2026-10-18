import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import app from '../../src/app.js';
import sequelize from '../../src/config/database.js';
import { TriagePatient, Queue } from '../../src/models/index.js';

/**
 * API / integration tests.
 *
 * These exercise the real Express app (routing, Zod validation, response
 * shaping, the human-verification endpoint) with the persistence layer stubbed
 * so they run without an external PostgreSQL/Supabase instance.
 */

const ORIGINAL_KEY = process.env.WAY_API_KEY;
const originals = {};
let server;
let base;

function stubPersistence() {
  originals.transaction = sequelize.transaction;
  originals.tpCreate = TriagePatient.create;
  originals.tpFindByPk = TriagePatient.findByPk;
  originals.queueCount = Queue.count;
  originals.queueCreate = Queue.create;
  originals.queueFindOne = Queue.findOne;

  sequelize.transaction = async () => ({ commit: async () => {}, rollback: async () => {} });

  TriagePatient.create = async (values) => ({ id: '11111111-1111-1111-1111-111111111111', ...values, save: async () => {} });
  Queue.count = async () => 0;
  Queue.create = async (values) => ({ id: '22222222-2222-2222-2222-222222222222', ...values });
}

function restorePersistence() {
  sequelize.transaction = originals.transaction;
  TriagePatient.create = originals.tpCreate;
  TriagePatient.findByPk = originals.tpFindByPk;
  Queue.count = originals.queueCount;
  Queue.create = originals.queueCreate;
  Queue.findOne = originals.queueFindOne;
}

const post = (path, body) =>
  fetch(`${base}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

before(async () => {
  delete process.env.WAY_API_KEY; // force deterministic keyword fallback
  stubPersistence();
  await new Promise((resolve) => { server = app.listen(0, resolve); });
  base = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  restorePersistence();
  if (ORIGINAL_KEY !== undefined) process.env.WAY_API_KEY = ORIGINAL_KEY;
  await new Promise((resolve) => server.close(resolve));
});

test('GET /api/health returns OK', async () => {
  const res = await fetch(`${base}/api/health`);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.status, 'OK');
});

test('POST /api/triage/register validates input (400 with field errors)', async () => {
  const res = await post('/api/triage/register', { nama_pasien: 'A' });
  assert.equal(res.status, 400);
  const body = await res.json();
  assert.equal(body.status, 'error');
  assert.ok(Array.isArray(body.errors) && body.errors.length > 0);
});

test('POST /api/triage/register: unknown route params are ignored (schema-safe)', async () => {
  const res = await post('/api/triage/register', {
    nama_pasien: 'Budi',
    umur: 40,
    jenis_kelamin: 'L',
    keluhan_utama: 'Batuk ringan',
    unexpected: 'ignored by schema',
  });
  assert.equal(res.status, 201);
});

test('POST /api/triage/register returns the auditable classification block', async () => {
  const res = await post('/api/triage/register', {
    nama_pasien: 'Siti',
    umur: 60,
    jenis_kelamin: 'P',
    keluhan_utama: 'Nyeri dada kiri menjalar ke lengan, keringat dingin',
    tanda_vital: { spo2: 97 },
  });
  assert.equal(res.status, 201);
  const { data } = await res.json();
  assert.ok(data.patient.id);
  assert.ok(data.queue.nomor_antrean);
  const c = data.classification;
  assert.equal(c.rule_version, 'fkpt-adapted-2026.10.1');
  assert.equal(c.queue_category, 'P2');
  assert.equal(c.review_required, false);
  assert.ok(Array.isArray(c.applied_rule_ids) && c.applied_rule_ids.length > 0);
  assert.equal(c.esi_supported, false);
  assert.equal(c.esi_level, null);
  assert.ok(typeof c.alasan_esi === 'string' && c.alasan_esi.length > 0);
  assert.ok(c.supporting_facts.length > 0);
});

test('POST /api/triage/register: API accepts a staff override and records it separately', async () => {
  const res = await post('/api/triage/register', {
    nama_pasien: 'Andi',
    umur: 30,
    jenis_kelamin: 'L',
    keluhan_utama: 'Batuk ringan',
    prioritas_triage: 'P1',
  });
  assert.equal(res.status, 201);
  const { data } = await res.json();
  assert.equal(data.patient.final_prioritas, 'P1'); // staff override
  assert.equal(data.patient.ai_recommended_category, 'P3'); // engine recommendation preserved
});

test('POST /api/triage/intake returns a patient-safe payload (no classification leak)', async () => {
  const res = await post('/api/triage/intake', {
    nama_pasien: 'Rina',
    umur: 28,
    jenis_kelamin: 'P',
    keluhan_utama: 'Pilek dan bersin',
  });
  assert.equal(res.status, 201);
  const { data } = await res.json();
  assert.ok(data.referensi);
  assert.equal(data.queue.nomor_antrean[0] !== undefined, true);
  assert.equal(data.classification, undefined);
  assert.equal(data.ai_recommended_category, undefined);
});

test('PUT /api/triage/patients/:id/verify rejects a changed priority without a reason', async () => {
  TriagePatient.findByPk = async () => ({
    id: 'x', ai_recommended_category: 'P3', prioritas_triage: 'P3', nomor_antrean: 'C-01', save: async () => {},
  });
  const res = await fetch(`${base}/api/triage/patients/x/verify`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ final_prioritas: 'P1' }),
  });
  assert.equal(res.status, 400);
});

test('PUT /api/triage/patients/:id/verify records the clinician decision', async () => {
  Queue.findOne = async () => null;
  const patient = {
    id: 'x', ai_recommended_category: 'P3', prioritas_triage: 'P3', review_required: true,
    save: async () => { patient.saved = true; },
  };
  TriagePatient.findByPk = async () => patient;
  const res = await fetch(`${base}/api/triage/patients/x/verify`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ final_prioritas: 'P2', override_reason: 'Perburukan kondisi saat asesmen.' }),
  });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.data.final_prioritas, 'P2');
  assert.equal(body.data.changed, true);
  assert.equal(body.data.review_required, false);
  assert.equal(patient.saved, true);
});

test('PUT /api/triage/patients/:id/verify: agreeing with the AI needs no reason', async () => {
  Queue.findOne = async () => null;
  TriagePatient.findByPk = async () => ({
    id: 'y', ai_recommended_category: 'P2', prioritas_triage: 'P2', save: async () => {},
  });
  const res = await fetch(`${base}/api/triage/patients/y/verify`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ final_prioritas: 'P2' }),
  });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.data.changed, false);
});

test('unknown route returns a structured 404', async () => {
  const res = await fetch(`${base}/api/does-not-exist`);
  assert.equal(res.status, 404);
  const body = await res.json();
  assert.equal(body.status, 'error');
});
