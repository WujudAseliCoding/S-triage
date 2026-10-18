/**
 * S-Triage deterministic triage-support rule engine.
 *
 * SCOPE / HONESTY NOTE (read docs/esi-implementation-notes.md):
 *   S-Triage targets Indonesian primary-care facilities (FKTP: puskesmas/klinik),
 *   NOT an emergency department. The Emergency Severity Index (ESI) v4 is a
 *   five-level ED triage tool and therefore is NOT implemented here as such.
 *   This module implements a small, explicitly-enumerated set of *danger-sign*
 *   and *high-risk* decision rules adapted from ESI v4 for the app's existing
 *   operational categories (P1 / P2 / P3). It must NOT be presented as a
 *   compliant ESI v4 algorithm and it never emits ESI levels 1-5.
 *
 * Determinism contract:
 *   Same validated structured input + same RULE_VERSION => identical output.
 *   No network, no clock, no randomness, no reliance on LLM free text for the
 *   final category (the raw complaint is only used by a conservative
 *   danger-keyword scan when structured extraction is unavailable).
 */

export const RULE_VERSION = 'fkpt-adapted-2026.10.1';

/** Operational categories (existing app vocabulary). P0 is never produced by the engine. */
export const CATEGORY = {
  P1: 'P1', // Gawat darurat / Merah - immediate
  P2: 'P2', // Darurat tidak gawat / Kuning - urgent
  P3: 'P3', // Tidak gawat tidak darurat / Hijau - non-urgent
};

export const CLASSIFICATION_STATUS = {
  SUPPORTED: 'SUPPORTED', // a verified rule fired and its required inputs were present
  REVIEW_REQUIRED: 'REVIEW_REQUIRED', // information missing / contradictory - clinician must decide
  TECHNICAL_FAILURE: 'TECHNICAL_FAILURE', // extraction unavailable and no safe determination possible
};

/**
 * Controlled red-flag vocabulary for ESI Decision Point A
 * (handbook Ch.2 "Decision Point A: Is the Patient Dying?", Figure 2-2 / Table 2-1).
 * Each code maps to a verifiable handbook criterion.
 */
export const RED_FLAGS = {
  unresponsive: 'Decision Point A: unresponsive (P or U on AVPU)',
  apneic: 'Decision Point A: apneic (not breathing)',
  pulseless: 'Decision Point A: pulseless',
  severe_respiratory_distress: 'Decision Point A: severe respiratory distress',
  acute_mental_status_change: 'Decision Point A: acute mental status changes',
  airway_compromise: 'Decision Point A: unable to maintain a patent airway',
};

/**
 * Controlled high-risk vocabulary for ESI Decision Point B
 * (handbook Ch.2 "Decision Point B: Should the Patient Wait?" and Ch.3 high-risk examples).
 */
export const HIGH_RISK_FLAGS = {
  possible_acs_chest_pain: 'Ch.2 high-risk example: active chest pain suspicious for ACS, stable',
  possible_stroke: 'Ch.2 high-risk example: signs of stroke but does not meet level-1 criteria',
  possible_ectopic_pregnancy: 'Ch.2 high-risk example: rule-out ectopic pregnancy, hemodynamically stable',
  immunocompromised_with_fever: 'Ch.2 high-risk example: immunocompromised (e.g. chemotherapy) with fever',
  possible_anaphylaxis: 'Ch.3 high-risk: anaphylaxis risk (e.g. throat tightening after exposure)',
  severe_abdominal_pain: 'Ch.3 high-risk: severe abdominal pain (especially elderly)',
  suicidal_or_homicidal: 'Ch.2 high-risk example: suicidal or homicidal patient',
  ongoing_seizure: 'Ch.2: seizures may require urgent (not necessarily level-1) intervention',
  severe_bleeding: 'Ch.3 high-risk: significant or ongoing bleeding',
  suspected_meningitis: 'Ch.3 clinical portrait: fever + stiff neck / rash suggests meningitis',
  severe_dehydration_infant: 'Ch.5 case: infant with dehydration is up-triaged',
};

/**
 * Rule catalog. Every rule is explicit, ordered, cited, and deterministic.
 * `step` follows the adapted decision sequence: A (immediate) -> B (high risk) -> C (default).
 */
export const RULES = [
  {
    id: 'A1-red-flag',
    step: 'A',
    severity: CATEGORY.P1,
    source: 'ESI v4 Handbook Ch.2, Decision Point A (Fig 2-2), Table 2-1, level-1 examples',
    describe: (ctx) => {
      const hits = ctx.redFlags.filter((f) => f in RED_FLAGS);
      return hits.length
        ? `Tanda bahaya langsung: ${hits.join(', ')}`
        : null;
    },
  },
  {
    id: 'A2-spo2-below-90',
    step: 'A',
    severity: CATEGORY.P1,
    source: 'ESI v4 Handbook Ch.2, Decision Point A: "SpO2 < 90 percent" is a level-1 criterion',
    describe: (ctx) =>
      ctx.vitals.verified && typeof ctx.vitals.spo2 === 'number' && ctx.vitals.spo2 < 90
        ? `SpO2 ${ctx.vitals.spo2}% (< 90%)`
        : null,
  },
  {
    id: 'B1-high-risk-condition',
    step: 'B',
    severity: CATEGORY.P2,
    source: 'ESI v4 Handbook Ch.2 Decision Point B + Ch.3 high-risk situations',
    describe: (ctx) => {
      const hits = ctx.highRiskFlags.filter((f) => f in HIGH_RISK_FLAGS);
      return hits.length
        ? `Situasi berisiko tinggi: ${hits.join(', ')}`
        : null;
    },
  },
  {
    id: 'B2-mental-status',
    step: 'B',
    severity: CATEGORY.P2,
    source: 'ESI v4 Handbook Ch.2, Decision Point B: "confused, lethargic or disoriented"',
    describe: (ctx) =>
      ctx.mentalStatus === 'confused_lethargic_disoriented'
        ? 'Perubahan status mental (bingung/letargi/disorientasi)'
        : null,
  },
  {
    id: 'B3-severe-pain',
    step: 'B',
    severity: CATEGORY.P2,
    source:
      'ESI v4 Handbook Ch.2: severe pain/distress = rating >= 7 on a 0-10 scale',
    describe: (ctx) =>
      typeof ctx.painScale === 'number' && ctx.painScale >= 7
        ? `Skala nyeri ${ctx.painScale}/10 (>= 7)`
        : null,
  },
  {
    id: 'B4-pediatric-fever-neonate',
    step: 'B',
    severity: CATEGORY.P2,
    source:
      'ESI v4 Handbook Ch.5, Table 5-1 (1-28 days, fever > 38.0 C => at least level 2)',
    describe: (ctx) =>
      ctx.ageDays !== null &&
      ctx.ageDays <= 28 &&
      ctx.vitals.verified &&
      typeof ctx.vitals.suhu === 'number' &&
      ctx.vitals.suhu > 38.0
        ? `Neonatus (${ctx.ageDays} hari) dengan suhu ${ctx.vitals.suhu} C (> 38.0 C)`
        : null,
  },
  {
    id: 'B5-pediatric-fever-infant',
    step: 'B',
    severity: CATEGORY.P2,
    source:
      'ESI v4 Handbook Ch.5, Table 5-1 (1-3 months, fever > 38.0 C => consider level 2)',
    describe: (ctx) =>
      ctx.ageMonths !== null &&
      ctx.ageMonths > 28 / 30.4375 &&
      ctx.ageMonths <= 3 &&
      ctx.vitals.verified &&
      typeof ctx.vitals.suhu === 'number' &&
      ctx.vitals.suhu > 38.0
        ? `Bayi (${ctx.ageMonths} bulan) dengan suhu ${ctx.vitals.suhu} C (> 38.0 C)`
        : null,
  },
  {
    id: 'C1-default-non-urgent',
    step: 'C',
    severity: CATEGORY.P3,
    source:
      'Adapted default: tidak ada kriteria danger/high-risk (Step A/B) yang terpenuhi pada informasi yang tersedia',
    describe: () =>
      'Tidak ditemukan kriteria bahaya langsung maupun risiko tinggi pada informasi yang tersedia',
  },
];

/** Conservative danger keywords used ONLY when structured extraction is unavailable. */
export const CONSERVATIVE_DANGER_KEYWORDS = [
  'tidak sadar',
  'tidak bernyawa',
  'henti jantung',
  'henti napas',
  'tidak bernapas',
  'tidak bernafas',
  'sesak berat',
  'sesak napas berat',
  'sulit bernapas',
  'nyeri dada',
  'kejang',
  'pingsan',
  'perdarahan hebat',
  'perdarahan banyak',
  'bibir biru',
  'biru',
  'syok',
  'unresponsive',
  'tidak responsif',
  'gasping',
  'anafilaksis',
];

const HIGH_RISK_KEYWORD_HINTS = [
  'stroke',
  'lumpuh',
  'bicara pelo',
  'mulut mencong',
  'gejala stroke',
  'hamil di luar kandungan',
  'ektopik',
  'kemo',
  'imunokompromi',
  'bunuh diri',
  'melukai diri',
  'anafilaksis',
  'bengkak tenggorokan',
  'meningitis',
  'kaku leher',
  'demam + kaku leher',
];

export const KNOWN_RED_FLAG_ORDER = Object.keys(RED_FLAGS);
export const KNOWN_HIGH_RISK_ORDER = Object.keys(HIGH_RISK_FLAGS);

const asArray = (value) => (Array.isArray(value) ? value : []);
const num = (value) => (typeof value === 'number' && Number.isFinite(value) ? value : null);

/**
 * Normalize raw engine input into a deterministic context object.
 * Accepts the structured extraction + clinician-measured vitals.
 */
export function buildContext(input = {}) {
  const redFlags = asArray(input.red_flags).filter((f) => typeof f === 'string');
  const highRiskFlags = asArray(input.high_risk_flags).filter((f) => typeof f === 'string');
  const missing = asArray(input.missing_information).filter((f) => typeof f === 'string');

  const vitals = input.vitals || {};
  // Only clinician-measured vitals participate in vital-sign rules.
  const verified = input.vitals_verified === true;

  return {
    ageYears: num(input.age_years),
    ageMonths: num(input.age_months),
    ageDays: num(input.age_days),
    vitals: {
      verified,
      spo2: num(vitals.spo2),
      suhu: num(vitals.suhu),
      nadi: num(vitals.nadi),
      pernapasan: num(vitals.pernapasan),
      sistole: num(vitals.sistole),
      diastole: num(vitals.diastole),
    },
    mentalStatus: typeof input.mental_status === 'string' ? input.mental_status : 'unknown',
    painScale: num(input.pain_scale),
    knownConditions: asArray(input.known_conditions).filter((f) => typeof f === 'string'),
    redFlags,
    highRiskFlags,
    missingInformation: missing,
    chiefComplaint: typeof input.chief_complaint === 'string' ? input.chief_complaint : '',
    extractionAvailable: input.extraction_available !== false,
  };
}

/**
 * Evaluate the adapted decision sequence.
 * @param {object} input - structured, validated input (see buildContext).
 * @returns {object} auditable classification result.
 */
export function evaluateTriage(input = {}) {
  const ctx = buildContext(input);
  const appliedRuleIds = [];
  const supportingFacts = [];
  let category = null;
  let decisionStep = null;

  const run = (rule) => {
    const reason = rule.describe(ctx);
    if (!reason) return false;
    appliedRuleIds.push(rule.id);
    supportingFacts.push({ rule_id: rule.id, detail: reason, source: rule.source });
    if (category === null || rule.severity === CATEGORY.P1) category = rule.severity;
    if (decisionStep === null) decisionStep = rule.step;
    return true;
  };

  // --- Step A: immediate life threat ---
  for (const rule of RULES.filter((r) => r.step === 'A')) run(rule);

  // --- Step B: high risk / should not wait ---
  if (category !== CATEGORY.P1) {
    for (const rule of RULES.filter((r) => r.step === 'B')) run(rule);
  }

  // --- Determine whether the available information is adequate ---
  const hasComplaintText = ctx.chiefComplaint.trim().length > 0;
  const complaintRulesFired = appliedRuleIds.length > 0;
  const insufficient = [];
  if (!ctx.extractionAvailable) {
    insufficient.push('Ekstraksi terstruktur tidak tersedia (kegagalan teknis).');
  } else if (!hasComplaintText && !complaintRulesFired) {
    insufficient.push('Tidak ada informasi keluhan terstruktur yang dapat dinilai.');
  }

  // --- Step C: default non-urgent, only when the screen was adequate ---
  if (category === null && ctx.extractionAvailable && insufficient.length === 0) {
    const defaultRule = RULES.find((r) => r.id === 'C1-default-non-urgent');
    if (defaultRule) run(defaultRule);
  }

  // --- Insufficient-information handling ---
  const missingInformation = [...ctx.missingInformation];
  if (!ctx.vitals.verified && !insufficient.length) {
    missingInformation.push('Tanda vital terverifikasi belum tersedia (hanya menggerakkan aturan up-triage).');
  }
  if (ctx.mentalStatus === 'unknown' && !insufficient.length) {
    missingInformation.push('Status mental pasien belum dinilai.');
  }

  let classificationStatus;
  let provisional = false;
  let escalation = { required: false, rule_ids: [], reason: null };

  if (category === CATEGORY.P1) {
    classificationStatus = CLASSIFICATION_STATUS.SUPPORTED;
    escalation = {
      required: true,
      rule_ids: appliedRuleIds.filter((id) => id.startsWith('A')),
      reason: 'Terdapat tanda bahaya langsung; perlu penanganan segera sesuai prosedur fasilitas.',
    };
  } else if (category === CATEGORY.P2) {
    classificationStatus = CLASSIFICATION_STATUS.SUPPORTED;
    escalation = {
      required: true,
      rule_ids: appliedRuleIds.filter((id) => id.startsWith('B')),
      reason: 'Pasien tidak boleh menunggu lama; perlu penilaian klinis cepat.',
    };
  } else if (!ctx.extractionAvailable) {
    classificationStatus = CLASSIFICATION_STATUS.TECHNICAL_FAILURE;
    provisional = true;
  } else if (insufficient.length > 0) {
    classificationStatus = CLASSIFICATION_STATUS.REVIEW_REQUIRED;
    provisional = true;
  } else {
    classificationStatus = CLASSIFICATION_STATUS.SUPPORTED;
  }

  // Provisional queue placement: never default to the non-urgent bucket.
  let queueCategory = category;
  if (queueCategory === null) {
    queueCategory = CATEGORY.P2; // safety-first provisional bucket pending human review
    provisional = true;
    if (classificationStatus === CLASSIFICATION_STATUS.SUPPORTED) {
      classificationStatus = CLASSIFICATION_STATUS.REVIEW_REQUIRED;
    }
  }

  const allMissing = [...new Set([...missingInformation, ...insufficient])];

  return {
    rule_version: RULE_VERSION,
    classification_status: classificationStatus,
    category,
    queue_category: queueCategory,
    provisional,
    review_required: classificationStatus !== CLASSIFICATION_STATUS.SUPPORTED,
    escalation,
    decision_step: decisionStep,
    applied_rule_ids: appliedRuleIds,
    supporting_facts: supportingFacts,
    missing_information: allMissing,
    resource_assessment: {
      status: 'not_assessed',
      reason:
        'Penilaian kebutuhan sumber daya (ESI Decision Point C) tidak diterapkan pada konteks FKTP dan tidak boleh disimpulkan dari teks keluhan saja.',
    },
    esi_supported: false,
    esi_level: null,
    alasan_esi: buildReason({ classificationStatus, category, supportingFacts, allMissing, provisional }),
  };
}

function buildReason({ classificationStatus, category, supportingFacts, allMissing, provisional }) {
  const parts = [];
  if (supportingFacts.length) {
    parts.push(`Aturan yang diterapkan: ${supportingFacts.map((f) => `${f.rule_id} (${f.detail})`).join('; ')}.`);
  }
  if (classificationStatus === CLASSIFICATION_STATUS.SUPPORTED) {
    parts.push(`Kategori operasional ${category} didukung oleh aturan terverifikasi pada input yang tersedia.`);
  } else if (classificationStatus === CLASSIFICATION_STATUS.REVIEW_REQUIRED) {
    parts.push(
      `Informasi belum memadai untuk penetapan yang dapat didukung; klasifikasi sementara = ${category}. Wajib diverifikasi tenaga medis.${provisional ? ' Nilai bersifat sementara.' : ''}`,
    );
  } else if (classificationStatus === CLASSIFICATION_STATUS.TECHNICAL_FAILURE) {
    parts.push(
      `Klasifikasi otomatis tidak dapat diselesaikan (kegagalan teknis). Nilai ${category} bersifat sementara demi keselamatan; wajib diverifikasi tenaga medis.`,
    );
  }
  if (allMissing.length) {
    parts.push(`Informasi yang belum tersedia: ${allMissing.join('; ')}.`);
  }
  parts.push('Aplikasi ini adalah alat bantu triase; keputusan akhir tetap pada tenaga medis.');
  return parts.join(' ');
}

/**
 * Conservative scan of raw complaint text. Used ONLY when structured extraction
 * is unavailable, so that a failed model call cannot suppress an obvious warning.
 */
export function conservativeRawScan(rawText = '') {
  const text = String(rawText).toLowerCase();
  const danger = CONSERVATIVE_DANGER_KEYWORDS.filter((k) => text.includes(k));
  const highRisk = HIGH_RISK_KEYWORD_HINTS.filter((k) => text.includes(k));
  return { dangerKeywords: danger, highRiskKeywords: highRisk };
}

/**
 * Evaluate when structured extraction is unavailable/failed.
 * Uses the conservative raw scan; never returns a plain non-urgent classification.
 */
export function evaluateDegraded({ rawText, vitals, vitals_verified, age_years, age_months, age_days }) {
  const scan = conservativeRawScan(rawText);
  const result = evaluateTriage({
    chief_complaint: rawText,
    red_flags: scan.dangerKeywords.length ? ['severe_respiratory_distress'] : [],
    high_risk_flags: scan.highRiskKeywords,
    vitals,
    vitals_verified,
    age_years,
    age_months,
    age_days,
    extraction_available: false,
    missing_information: [
      'Ekstraksi gejala terstruktur gagal/ tidak tersedia; hanya pemindaian kata kunci darurat yang dijalankan.',
    ],
  });
  if (scan.dangerKeywords.length === 0 && scan.highRiskKeywords.length === 0) {
    result.classification_status = CLASSIFICATION_STATUS.REVIEW_REQUIRED;
    result.review_required = true;
    result.provisional = true;
  }
  return result;
}

export default {
  RULE_VERSION,
  CATEGORY,
  CLASSIFICATION_STATUS,
  RED_FLAGS,
  HIGH_RISK_FLAGS,
  RULES,
  buildContext,
  evaluateTriage,
  evaluateDegraded,
  conservativeRawScan,
  KNOWN_RED_FLAG_ORDER,
  KNOWN_HIGH_RISK_ORDER,
};
