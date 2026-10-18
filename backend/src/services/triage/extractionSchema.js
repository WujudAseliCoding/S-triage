import { z } from 'zod';
import { KNOWN_RED_FLAG_ORDER, KNOWN_HIGH_RISK_ORDER } from './esiRuleEngine.js';

/**
 * Zod schema for the LLM *information-extraction* output.
 *
 * The model is NOT allowed to choose a triage category here. It may only report
 * what the patient/clinician actually supplied, explicitly mark unknowns, and
 * flag *potential* warning signs for deterministic verification downstream.
 *
 * Controlled vocabularies (danger/high-risk codes) come from the rule engine so
 * the deterministic stage never depends on free-form model prose.
 */

export const MENTAL_STATUS = {
  NORMAL: 'normal',
  CONFUSED_LETHARGIC_DISORIENTED: 'confused_lethargic_disoriented',
  UNRESPONSIVE_OR_ACUTE_CHANGE: 'unresponsive_or_acute_change',
  UNKNOWN: 'unknown',
};

const provenance = z.enum(['patient', 'clinician', 'inferred']);

export const symptomSchema = z.object({
  name: z.string().min(1),
  onset: z.string().nullable().optional().default(null),
  duration: z.string().nullable().optional().default(null),
  details: z.string().nullable().optional().default(null),
  source: provenance.default('patient'),
});

export const reportedVitalSchema = z.object({
  spo2: z.number().nullable().optional().default(null),
  suhu: z.number().nullable().optional().default(null),
  nadi: z.number().nullable().optional().default(null),
  pernapasan: z.number().nullable().optional().default(null),
  sistole: z.number().nullable().optional().default(null),
  diastole: z.number().nullable().optional().default(null),
});

export const extractionSchema = z.object({
  factual_summary: z.string().min(1),
  chief_complaint_summary: z.string().min(1),
  symptoms: z.array(symptomSchema).default([]),
  // Potential warning signs, to be verified against deterministic rules.
  warning_signs: z.array(z.string()).default([]),
  red_flags: z
    .array(z.enum(KNOWN_RED_FLAG_ORDER.length ? KNOWN_RED_FLAG_ORDER : ['unresponsive']))
    .default([]),
  high_risk_flags: z
    .array(z.enum(KNOWN_HIGH_RISK_ORDER.length ? KNOWN_HIGH_RISK_ORDER : ['possible_stroke']))
    .default([]),
  // Patient-reported vitals (not clinician-measured) with explicit provenance.
  reported_vitals: reportedVitalSchema.default({}),
  mental_status: z.enum(Object.values(MENTAL_STATUS)).default(MENTAL_STATUS.UNKNOWN),
  pain_scale: z.number().min(0).max(10).nullable().optional().default(null),
  // Fields the model could not determine from the supplied text.
  missing_information: z.array(z.string()).default([]),
});

/** JSON Schema-ish description embedded in the prompt (hand-authored, no extra dep). */
export const EXTRACTION_OUTPUT_CONTRACT = {
  factual_summary: 'Ringkasan faktual netral dari informasi yang benar-benar diberikan.',
  chief_complaint_summary: 'Ringkasan singkat keluhan utama.',
  symptoms: [
    {
      name: 'nama gejala',
      onset: 'kapan mulai (null bila tidak disebut)',
      duration: 'durasi (null bila tidak disebut)',
      details: 'detail tambahan (null bila tidak disebut)',
      source: 'patient | clinician | inferred',
    },
  ],
  warning_signs: ['daftar tanda bahaya sebagai frasa singkat (boleh kosong)'],
  red_flags: KNOWN_RED_FLAG_ORDER,
  high_risk_flags: KNOWN_HIGH_RISK_ORDER,
  reported_vitals: {
    spo2: 'angka atau null',
    suhu: 'angka atau null',
    nadi: 'angka atau null',
    pernapasan: 'angka atau null',
    sistole: 'angka atau null',
    diastole: 'angka atau null',
  },
  mental_status: Object.values(MENTAL_STATUS),
  pain_scale: 'angka 0-10 atau null',
  missing_information: ['daftar informasi penting yang tidak tersedia'],
};

/**
 * Validate a raw model response object.
 * @returns {{ok: true, data: object} | {ok: false, error: string, issues?: any}}
 */
export function validateExtraction(raw) {
  const parsed = extractionSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: 'Ekstraksi tidak sesuai skema.',
      issues: parsed.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
    };
  }
  return { ok: true, data: parsed.data };
}

/**
 * Build the extraction result when the LLM stage fails entirely.
 * Marks everything unknown; the rule engine then forces review/escalation.
 */
export function failedExtraction(reason) {
  return {
    factual_summary: 'Ekstraksi otomatis tidak tersedia.',
    chief_complaint_summary: '',
    symptoms: [],
    warning_signs: [],
    red_flags: [],
    high_risk_flags: [],
    reported_vitals: {},
    mental_status: MENTAL_STATUS.UNKNOWN,
    pain_scale: null,
    missing_information: [`Ekstraksi otomatis gagal: ${reason}`],
    extraction_failed: true,
  };
}

export default { extractionSchema, validateExtraction, failedExtraction, EXTRACTION_OUTPUT_CONTRACT, MENTAL_STATUS };
