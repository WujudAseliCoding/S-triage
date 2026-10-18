import api from './api';

/**
 * Triage API wrappers.
 *
 * `submitPatientIntake` is the public, login-less path used by the patient
 * form. It intentionally receives a limited payload (no classification).
 */
export async function submitPatientIntake(payload) {
  const { data } = await api.post('/triage/intake', payload);
  return data.data;
}

/** Staff registration: returns the full auditable classification block. */
export async function registerTriage(payload) {
  const { data } = await api.post('/triage/register', payload);
  return data.data;
}

/** Records the clinician's final decision separately from the AI recommendation. */
export async function verifyTriage(patientId, payload) {
  const { data } = await api.put(`/triage/patients/${patientId}/verify`, payload);
  return data.data;
}

export default { submitPatientIntake, registerTriage, verifyTriage };
