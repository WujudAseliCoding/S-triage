import { callWayGateway, AI_GATEWAY } from '../../config/ai.js';
import { validateExtraction, failedExtraction, EXTRACTION_OUTPUT_CONTRACT, MENTAL_STATUS } from './extractionSchema.js';
import { conservativeRawScan, RED_FLAGS, HIGH_RISK_FLAGS } from './esiRuleEngine.js';

/**
 * LLM information-extraction stage.
 *
 * Responsibility: turn a free-text complaint into a *validated structured*
 * representation. It must NOT decide the triage category. Every failure mode
 * (no key, timeout, non-2xx, invalid JSON, schema mismatch, empty result)
 * degrades to either a deterministic keyword extraction or an explicit failure
 * object, never to a fabricated confident classification.
 */

const SYSTEM_PROMPT = [
  'Anda adalah komponen EKSTRAKSI INFORMASI (bukan penentu prioritas) untuk sistem triase FKTP.',
  'Tugas: ubah keluhan bebas menjadi data terstruktur JSON.',
  'ATURAN KERAS:',
  '1. JANGAN menentukan atau menyebut kategori prioritas/urgensi (P1/P2/P3/P0), level ESI, atau diagnosis.',
  '2. JANGAN mengarang gejala, tanda vital, hasil lab, riwayat, atau temuan yang tidak disebutkan.',
  '3. Tandai dengan jelas apa yang diberikan pasien vs disimpulkan. Gunakan source="inferred" hanya untuk flag.',
  '4. Bidang yang tidak diketahui WAJIB null (untuk nilai tunggal) atau [] (untuk daftar), dan dicatat pada missing_information.',
  '5. red_flags/high_risk_flags HANYA boleh berisi kode dari daftar yang diberikan.',
  '6. Balas HANYA JSON murni tanpa markdown.',
].join('\n');

/**
 * @param {string} keluhan
 * @returns {string} user prompt
 */
export function buildExtractionPrompt(keluhan) {
  return [
    'Keluhan pasien (teks asli, jangan diubah maknanya):',
    `"""${keluhan}"""`,
    '',
    'Keluarkan JSON dengan struktur berikut:',
    JSON.stringify(EXTRACTION_OUTPUT_CONTRACT, null, 2),
    '',
    'Kode red_flags yang diizinkan:',
    Object.keys(RED_FLAGS).join(', '),
    'Kode high_risk_flags yang diizinkan:',
    Object.keys(HIGH_RISK_FLAGS).join(', '),
  ].join('\n');
}

/** Strip markdown fences and parse JSON, tolerating surrounding prose. */
export function parseModelJson(content) {
  if (typeof content !== 'string') {
    throw new Error('Konten model bukan string.');
  }
  let text = content.trim();
  text = text.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  try {
    return JSON.parse(text);
  } catch {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start >= 0 && end > start) {
      return JSON.parse(text.slice(start, end + 1));
    }
    throw new Error('JSON tidak valid pada respons model.');
  }
}

/**
 * Deterministic keyword-based extraction used when the LLM is unavailable.
 * Conservative: it only adds *more* concern, never removes it.
 */
export function keywordExtraction(keluhan) {
  const text = String(keluhan || '').toLowerCase();
  const scan = conservativeRawScan(text);

  const redFlags = [];
  if (/tidak sadar|tidak responsif|unresponsive|penurunan kesadaran/.test(text)) redFlags.push('unresponsive');
  if (/henti napas|tidak bernaf|tidak bernapas|apnea/.test(text)) redFlags.push('apneic');
  if (/henti jantung|tidak ada nadi|pulseless/.test(text)) redFlags.push('pulseless');
  if (/sesak[^.]{0,25}berat|sulit bernafas|sulit bernapas|gasping|sesak hebat/.test(text)) {
    redFlags.push('severe_respiratory_distress');
  }

  const highRiskFlags = [];
  if (/nyeri dada|dada terasa ditekan/.test(text)) highRiskFlags.push('possible_acs_chest_pain');
  if (/stroke|lumpuh|bicara pelo|mulut mencong/.test(text)) highRiskFlags.push('possible_stroke');
  if (/kemo|imunokompromi|daya tahan tubuh turun/.test(text)) highRiskFlags.push('immunocompromised_with_fever');
  if (/ektopik|hamil di luar kandungan|hamil[^.]{0,40}(perdarahan|kram|nyeri perut)/.test(text)) {
    highRiskFlags.push('possible_ectopic_pregnancy');
  }
  if (/perdarahan hebat|perdarahan banyak|muntah darah|bab berdarah/.test(text)) highRiskFlags.push('severe_bleeding');
  if (/bunuh diri|melukai diri/.test(text)) highRiskFlags.push('suicidal_or_homicidal');
  if (/kaku leher|meningitis/.test(text)) highRiskFlags.push('suspected_meningitis');
  if (/kejang/.test(text)) highRiskFlags.push('ongoing_seizure');

  let mentalStatus = MENTAL_STATUS.UNKNOWN;
  if (/bingung|letargi|lemas berat|disorientasi/.test(text)) {
    mentalStatus = MENTAL_STATUS.CONFUSED_LETHARGIC_DISORIENTED;
  }
  if (/tidak sadar|penurunan kesadaran/.test(text)) {
    mentalStatus = MENTAL_STATUS.UNRESPONSIVE_OR_ACUTE_CHANGE;
  }

  const warningSigns = [...new Set([...scan.dangerKeywords, ...scan.highRiskKeywords])];

  return {
    factual_summary: `Ekstraksi berbasis kata kunci (tanpa AI) dari keluhan: "${String(keluhan || '').slice(0, 200)}"`,
    chief_complaint_summary: String(keluhan || '').slice(0, 200),
    symptoms: [],
    warning_signs: warningSigns,
    red_flags: [...new Set(redFlags)],
    high_risk_flags: [...new Set(highRiskFlags)],
    reported_vitals: {},
    mental_status: mentalStatus,
    pain_scale: null,
    missing_information: [
      'Ekstraksi dilakukan tanpa model LLM (mode kata kunci); gejala terstruktur tidak tersedia.',
    ],
    extraction_mode: 'keyword_fallback',
  };
}

/**
 * Run the extraction stage.
 * @param {string} keluhan
 * @param {{timeoutMs?: number}} [opts]
 * @returns {Promise<{data: object, ok: boolean, mode: 'llm'|'keyword_fallback'|'failed', error?: string}>}
 */
export async function extractClinicalInformation(keluhan, opts = {}) {
  const text = typeof keluhan === 'string' ? keluhan.trim() : '';
  if (!text) {
    return { ok: false, mode: 'failed', data: failedExtraction('keluhan kosong'), error: 'Keluhan kosong.' };
  }

  if (!AI_GATEWAY.hasKey) {
    return { ok: true, mode: 'keyword_fallback', data: keywordExtraction(text) };
  }

  try {
    const content = await callWayGateway({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildExtractionPrompt(text) },
      ],
      temperature: 0,
      timeoutMs: opts.timeoutMs,
    });

    let raw;
    try {
      raw = parseModelJson(content);
    } catch (error) {
      // Invalid JSON -> deterministic fallback, never a fabricated classification.
      return { ok: true, mode: 'keyword_fallback', data: keywordExtraction(text), error: `JSON tidak valid: ${error.message}` };
    }

    const validated = validateExtraction(raw);
    if (!validated.ok) {
      return {
        ok: true,
        mode: 'keyword_fallback',
        data: keywordExtraction(text),
        error: `Skema tidak sesuai: ${validated.error}`,
      };
    }

    return { ok: true, mode: 'llm', data: validated.data };
  } catch (error) {
    const mode = error.code === 'NO_API_KEY' ? 'keyword_fallback' : 'failed';
    if (mode === 'keyword_fallback') {
      return { ok: true, mode, data: keywordExtraction(text), error: error.message };
    }
    return { ok: false, mode: 'failed', data: failedExtraction(error.message), error: error.message, code: error.code };
  }
}

export default {
  SYSTEM_PROMPT,
  buildExtractionPrompt,
  parseModelJson,
  keywordExtraction,
  extractClinicalInformation,
  MENTAL_STATUS,
};
