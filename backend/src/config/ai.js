import 'dotenv/config';

/**
 * Low-level Way (Gutech) AI Gateway client.
 *
 * Only backend-side code uses this; the API key is read from the backend
 * environment (WAY_API_KEY) and is never exposed to the frontend. Secrets and
 * patient-identifying data are never logged.
 */

export const AI_GATEWAY = {
  url: process.env.WAY_API_URL || 'https://api-way.gutech.dev/v1/chat/completions',
  model: process.env.WAY_API_MODEL || 'gutech/fast',
  get hasKey() {
    return Boolean(process.env.WAY_API_KEY);
  },
};

export const DEFAULT_TIMEOUT_MS = Number(process.env.WAY_API_TIMEOUT_MS || 12000);

/**
 * Call the gateway chat-completions endpoint.
 * @throws {Error} on timeout, non-2xx response, or malformed envelope.
 * @returns {Promise<string>} the assistant message content.
 */
export async function callWayGateway({ messages, temperature = 0, timeoutMs = DEFAULT_TIMEOUT_MS, responseFormat = { type: 'json_object' } }) {
  if (!AI_GATEWAY.hasKey) {
    const err = new Error('WAY_API_KEY tidak diset.');
    err.code = 'NO_API_KEY';
    throw err;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(AI_GATEWAY.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.WAY_API_KEY}`,
      },
      body: JSON.stringify({
        model: AI_GATEWAY.model,
        messages,
        temperature,
        ...(responseFormat ? { response_format: responseFormat } : {}),
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const error = new Error(`AI gateway error status ${response.status}`);
      error.code = 'GATEWAY_HTTP_ERROR';
      error.status = response.status;
      throw error;
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== 'string' || !content.trim()) {
      const error = new Error('AI gateway mengembalikan respons kosong.');
      error.code = 'EMPTY_RESPONSE';
      throw error;
    }
    return content;
  } catch (error) {
    if (error.name === 'AbortError') {
      const timeout = new Error('Permintaan ke AI gateway melebihi batas waktu.');
      timeout.code = 'TIMEOUT';
      throw timeout;
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * @deprecated The LLM must not select the final triage category.
 * Kept only for backward compatibility with older callers. New code must use
 * `classifyPatient` from services/triage/classificationService.js.
 */
export const analyzeTriageWithAI = async (keluhan, vitalSigns = {}) => {
  const { classifyPatient } = await import('../services/triage/classificationService.js');
  const result = await classifyPatient({ nama_pasien: '', umur: 0, keluhan_utama: keluhan, tanda_vital: vitalSigns });
  return {
    prioritas_triage: result.classification.queue_category,
    skor_urgensi: result.classification.queue_category === 'P1' ? 5 : result.classification.queue_category === 'P2' ? 3 : 1,
    analisis_ai: result.classification.alasan_esi,
  };
};

export default { AI_GATEWAY, callWayGateway, analyzeTriageWithAI };
