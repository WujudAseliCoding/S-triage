/**
 * Small, dependency-free classification metrics.
 * Categories are ordinal: P1 (most urgent) > P2 > P3.
 */

export const LABELS = ['P1', 'P2', 'P3'];
const RANK = { P1: 1, P2: 2, P3: 3 };

export function confusionMatrix(pairs) {
  const m = {};
  for (const ref of LABELS) {
    m[ref] = {};
    for (const pred of LABELS) m[ref][pred] = 0;
  }
  for (const { reference, predicted } of pairs) {
    if (!LABELS.includes(reference) || !LABELS.includes(predicted)) continue;
    m[reference][predicted] += 1;
  }
  return m;
}

export function accuracy(pairs) {
  const valid = pairs.filter((p) => LABELS.includes(p.reference) && LABELS.includes(p.predicted));
  if (!valid.length) return null;
  return valid.filter((p) => p.reference === p.predicted).length / valid.length;
}

export function perClassMetrics(pairs) {
  const out = {};
  for (const label of LABELS) {
    const tp = pairs.filter((p) => p.reference === label && p.predicted === label).length;
    const fp = pairs.filter((p) => p.reference !== label && p.predicted === label).length;
    const fn = pairs.filter((p) => p.reference === label && p.predicted !== label).length;
    const precision = tp + fp === 0 ? 0 : tp / (tp + fp);
    const recall = tp + fn === 0 ? 0 : tp / (tp + fn);
    const f1 = precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall);
    out[label] = { tp, fp, fn, precision, recall, f1, support: tp + fn };
  }
  return out;
}

export function macroF1(pairs) {
  const pc = perClassMetrics(pairs);
  const withSupport = LABELS.filter((l) => pc[l].support > 0);
  if (!withSupport.length) return null;
  return withSupport.reduce((s, l) => s + pc[l].f1, 0) / withSupport.length;
}

/**
 * Under-triage: predicted category is LESS urgent than the reference (rank is
 * numerically higher). Over-triage: predicted is MORE urgent than reference.
 * Correct: equal. Undetermined (no supported prediction) is counted separately.
 */
export function triageErrors(pairs) {
  const valid = pairs.filter((p) => LABELS.includes(p.reference) && LABELS.includes(p.predicted));
  let under = 0;
  let over = 0;
  let correct = 0;
  for (const { reference, predicted } of valid) {
    if (reference === predicted) correct += 1;
    else if (RANK[predicted] > RANK[reference]) under += 1;
    else over += 1;
  }
  return { under, over, correct, total: valid.length };
}

export function summarize(pairs, { undetermined = 0, total = pairs.length } = {}) {
  return {
    total,
    evaluated: pairs.length,
    undetermined,
    accuracy: accuracy(pairs),
    macroF1: macroF1(pairs),
    perClass: perClassMetrics(pairs),
    confusion: confusionMatrix(pairs),
    errors: triageErrors(pairs),
    reviewRequiredRate: total === 0 ? 0 : undetermined / total,
  };
}

export default { LABELS, confusionMatrix, accuracy, perClassMetrics, macroF1, triageErrors, summarize };
