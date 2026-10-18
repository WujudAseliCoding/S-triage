/**
 * Synthetic evaluation dataset for S-Triage triage classification.
 *
 * IMPORTANT (honesty):
 *  - These are SYNTHETIC cases created for functional/consistency testing.
 *  - Reference labels were authored by the implementer from the ESI-v4-derived
 *    rule specification in `esiRuleEngine.js` and the handbook sections cited
 *    there. They have NOT been reviewed by a qualified clinician.
 *  - Therefore the metrics computed from this file measure CONSISTENCY against
 *    this reference set, NOT clinical validity or real-world effectiveness.
 *  - Labels are stored here, separate from the production prompt and from any
 *    model prediction, to avoid test-data leakage into the operational path.
 *
 * Categories use the app's operational vocabulary: P1 (immediate) > P2 (urgent)
 * > P3 (non-urgent). P0 (deceased) is intentionally excluded: it is a
 * human-confirmed outcome, never an automated classification.
 *
 * `structured` describes the validated facts the rule engine would receive; it
 * is used for the engine-only evaluation. `complaint`/`vitals` drive the
 * end-to-end (keyword-extraction + engine) and baseline evaluations.
 */

export const CASES = [
  { id: 'C01', complaint: 'Pasien tidak sadar sejak 5 menit', reference: 'P1', structured: { red_flags: ['unresponsive'], mental_status: 'unresponsive_or_acute_change' } },
  { id: 'C02', complaint: 'Tidak bernapas dan tidak ada denyut nadi', reference: 'P1', structured: { red_flags: ['apneic', 'pulseless'], mental_status: 'unresponsive_or_acute_change' } },
  { id: 'C03', complaint: 'Sesak napas sangat berat, bibir membiru', reference: 'P1', structured: { red_flags: ['severe_respiratory_distress'], mental_status: 'normal' } },
  { id: 'C04', complaint: 'Sesak dan lemas', vitals: { spo2: 86 }, verified: true, reference: 'P1', structured: { red_flags: [], mental_status: 'normal' } },
  { id: 'C05', complaint: 'Pingsan dan tidak responsif saat dibangunkan', reference: 'P1', structured: { red_flags: ['unresponsive'], mental_status: 'unresponsive_or_acute_change' } },
  { id: 'C06', complaint: 'Berdiri lalu jatuh, tidak sadar', reference: 'P1', structured: { red_flags: ['unresponsive'], mental_status: 'unresponsive_or_acute_change' } },

  { id: 'C07', complaint: 'Nyeri dada kiri seperti ditekan sejak 20 menit', reference: 'P2', structured: { high_risk_flags: ['possible_acs_chest_pain'], mental_status: 'normal' } },
  { id: 'C08', complaint: 'Mulut mencong dan bicara pelo sejak 1 jam', reference: 'P2', structured: { high_risk_flags: ['possible_stroke'], mental_status: 'normal' } },
  { id: 'C09', complaint: 'Nyeri perut hebat skala 9', pain: 9, reference: 'P2', structured: { high_risk_flags: ['severe_abdominal_pain'], pain_scale: 9, mental_status: 'normal' } },
  { id: 'C10', complaint: 'Demam setelah kemoterapi', reference: 'P2', structured: { high_risk_flags: ['immunocompromised_with_fever'], mental_status: 'normal' } },
  { id: 'C11', complaint: 'Muntah darah sejak pagi', reference: 'P2', structured: { high_risk_flags: ['severe_bleeding'], mental_status: 'normal' } },
  { id: 'C12', complaint: 'Bayi demam', age: 15, satuan: 'Hari', vitals: { suhu: 38.4 }, verified: true, reference: 'P2', structured: { high_risk_flags: [], mental_status: 'normal' } },
  { id: 'C13', complaint: 'Bayi rewel dan demam', age: 2, satuan: 'Bulan', vitals: { suhu: 38.6 }, verified: true, reference: 'P2', structured: { high_risk_flags: [], mental_status: 'normal' } },
  { id: 'C14', complaint: 'Kejang berlangsung 2 menit', reference: 'P2', structured: { high_risk_flags: ['ongoing_seizure'], mental_status: 'normal' } },
  { id: 'C15', complaint: 'Bingung dan lemas berat sejak pagi', reference: 'P2', structured: { high_risk_flags: [], mental_status: 'confused_lethargic_disoriented' } },
  { id: 'C16', complaint: 'Nyeri hebat pada tungkai skala 8 setelah jatuh', pain: 8, reference: 'P2', structured: { pain_scale: 8, mental_status: 'normal' } },
  { id: 'C17', complaint: 'Hamil muda dengan perdarahan dan nyeri perut bawah', reference: 'P2', structured: { high_risk_flags: ['possible_ectopic_pregnancy'], mental_status: 'normal' } },
  { id: 'C18', complaint: 'Demam dan kaku leher', reference: 'P2', structured: { high_risk_flags: ['suspected_meningitis'], mental_status: 'normal' } },
  { id: 'C19', complaint: 'Anak demam kejang setelah imunisasi', reference: 'P2', structured: { high_risk_flags: ['ongoing_seizure'], mental_status: 'normal' } },

  { id: 'C20', complaint: 'Batuk kering dan pilek sejak 2 hari', reference: 'P3', structured: { mental_status: 'normal' } },
  { id: 'C21', complaint: 'Gatal-gatal pada kulit punggung', reference: 'P3', structured: { mental_status: 'normal' } },
  { id: 'C22', complaint: 'Luka lecet ringan di lutut', reference: 'P3', structured: { mental_status: 'normal' } },
  { id: 'C23', complaint: 'Kontrol jahitan seminggu yang lalu', reference: 'P3', structured: { mental_status: 'normal' } },
  { id: 'C24', complaint: 'Sakit gigi ringan', reference: 'P3', structured: { mental_status: 'normal' } },
  { id: 'C25', complaint: 'Pusing ringan setelah kurang tidur', reference: 'P3', structured: { mental_status: 'normal' } },
  { id: 'C26', complaint: 'Mual dan muntah sekali setelah makan', reference: 'P3', structured: { mental_status: 'normal' } },
  { id: 'C27', complaint: 'Pegal-pegal dan pegal linu', reference: 'P3', structured: { mental_status: 'normal' } },
  { id: 'C28', complaint: 'Periksa tekanan darah rutin', reference: 'P3', structured: { mental_status: 'normal' } },
  { id: 'C29', complaint: 'Alergi kulit ringan setelah makan telur', reference: 'P3', structured: { mental_status: 'normal' } },
  { id: 'C30', complaint: 'Anak batuk pilek tanpa sesak', reference: 'P3', structured: { mental_status: 'normal' } },
];

export default CASES;

/**
 * Paraphrase / synonym cases. These deliberately use wording that the offline
 * keyword fallback does NOT cover, to expose the gap between the deterministic
 * keyword mode and the intended LLM extraction path. Reference labels follow
 * the same specification as above (synthetic / not clinically reviewed).
 */
export const PARAPHRASE_CASES = [
  { id: 'P01', complaint: 'Dada seperti ditindih benda berat sejak 15 menit', reference: 'P2', structured: { high_risk_flags: ['possible_acs_chest_pain'], mental_status: 'normal' } },
  { id: 'P02', complaint: 'Mulut miring dan tangan kanan lemah mendadak', reference: 'P2', structured: { high_risk_flags: ['possible_stroke'], mental_status: 'normal' } },
  { id: 'P03', complaint: 'Tubuh kebiruan dan tampak sulit bernapas', reference: 'P1', structured: { red_flags: ['severe_respiratory_distress'], mental_status: 'normal' } },
  { id: 'P04', complaint: 'Luka robek cukup dalam, darah banyak keluar', reference: 'P2', structured: { high_risk_flags: ['severe_bleeding'], mental_status: 'normal' } },
  { id: 'P05', complaint: 'Nyeri perut tembus ke punggung, riwayat tekanan darah tinggi', reference: 'P2', structured: { high_risk_flags: ['severe_abdominal_pain'], mental_status: 'normal' } },
  { id: 'P06', complaint: 'Sedang menjalani kemoterapi, badan panas dingin', reference: 'P2', structured: { high_risk_flags: ['immunocompromised_with_fever'], mental_status: 'normal' } },
  { id: 'P07', complaint: 'Hidung tersumbat dan bersin-bersin', reference: 'P3', structured: { mental_status: 'normal' } },
  { id: 'P08', complaint: 'Gigi berdenyut nyeri saat mengunyah', reference: 'P3', structured: { mental_status: 'normal' } },
];

