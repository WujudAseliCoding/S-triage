import { extractClinicalInformation, keywordExtraction } from './clinicalExtractor.js';
import { evaluateTriage, evaluateDegraded, RULE_VERSION, CLASSIFICATION_STATUS } from './esiRuleEngine.js';
import { MENTAL_STATUS } from './extractionSchema.js';

/**
 * Classification service: LLM extraction -> schema validation -> deterministic
 * rule evaluation -> auditable structured result.
 *
 * The final operational category comes ONLY from the deterministic rule engine.
 * A staff override (prioritas_override) is recorded separately and never mixes
 * with the AI recommendation.
 */

const SATUAN_VALID = ['tahun', 'bulan', 'hari'];

export function normalizeAge(umur, satuanUmur = 'tahun') {
  const value = Number(umur);
  if (!Number.isFinite(value) || value <= 0) {
    return { age_years: null, age_months: null, age_days: null };
  }
  const raw = String(satuanUmur || 'tahun').toLowerCase();
  const unit = SATUAN_VALID.includes(raw) ? raw : 'tahun';
  if (unit === 'bulan') {
    return { age_years: value / 12, age_months: value, age_days: value * 30.4375 };
  }
  if (unit === 'hari') {
    return { age_years: value / 365.25, age_months: value / 30.4375, age_days: value };
  }
  return { age_years: value, age_months: value * 12, age_days: value * 365.25 };
}

const VITAL_KEYS = ['sistole', 'diastole', 'nadi', 'pernapasan', 'suhu', 'spo2'];

export function hasVerifiedVitals(tandaVital) {
  if (!tandaVital || typeof tandaVital !== 'object') return false;
  return VITAL_KEYS.some((k) => typeof tandaVital[k] === 'number' && Number.isFinite(tandaVital[k]));
}

export function legacyScoreForCategory(category) {
  if (category === 'P1') return 5;
  if (category === 'P2') return 3;
  return 1;
}

/**
 * @param {{nama_pasien?: string, umur: number, satuan_umur?: string, keluhan_utama: string, tanda_vital?: object, extraction?: object}} input
 */
export async function classifyPatient(input) {
  const keluhan = input.keluhan_utama;
  const vitals = input.tanda_vital || {};
  const vitalsVerified = hasVerifiedVitals(vitals);
  const age = normalizeAge(input.umur, input.satuan_umur);

  const extraction = await extractClinicalInformation(keluhan);

  let classification;
  if (extraction.mode === 'failed' || extraction.data?.extraction_failed) {
    // Never let a failed extraction suppress a warning: degrade conservatively.
    classification = evaluateDegraded({
      rawText: keluhan,
      vitals,
      vitals_verified: vitalsVerified,
      ...age,
    });
  } else {
    const data = extraction.data;
    classification = evaluateTriage({
      chief_complaint: keluhan,
      red_flags: data.red_flags,
      high_risk_flags: data.high_risk_flags,
      mental_status: data.mental_status || MENTAL_STATUS.UNKNOWN,
      // Prefer the model-extracted pain score when present, else the clinician value.
      pain_scale: data.pain_scale ?? input.skala_nyeri ?? null,
      vitals,
      vitals_verified: vitalsVerified,
      age_years: age.age_years,
      age_months: age.age_months,
      age_days: age.age_days,
      missing_information: data.missing_information,
      extraction_available: true,
    });
  }

  const aiSummary =
    extraction.data?.factual_summary ||
    (extraction.mode === 'keyword_fallback'
      ? keywordExtraction(keluhan).factual_summary
      : 'Ringkasan AI tidak tersedia.');

  return {
    extraction: {
      mode: extraction.mode,
      ok: extraction.ok,
      error: extraction.error || null,
      data: extraction.data,
    },
    classification,
    skor_urgensi: legacyScoreForCategory(classification.queue_category),
    analisis_ai: aiSummary,
  };
}

export { RULE_VERSION, CLASSIFICATION_STATUS };
export default { classifyPatient, normalizeAge, hasVerifiedVitals, legacyScoreForCategory, RULE_VERSION };
