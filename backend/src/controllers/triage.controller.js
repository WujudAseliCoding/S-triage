import { TriagePatient, Queue } from '../models/index.js';
import { triageInputSchema } from '../schema/triage.schema.js';
import { classifyPatient, legacyScoreForCategory } from '../services/triage/classificationService.js';
import sequelize from '../config/database.js';

const PREFIX_BY_CATEGORY = { P1: 'A', P2: 'B', P3: 'C', P0: 'D' };

/** Generate the next per-day queue number for a category prefix. */
async function nextQueueNumber(category, transaction) {
  const prefix = PREFIX_BY_CATEGORY[category] || 'C';
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const count = await Queue.count({
    where: {
      createdAt: { [sequelize.Sequelize.Op.between]: [todayStart, todayEnd] },
      nomor_antrean: { [sequelize.Sequelize.Op.like]: `${prefix}%` },
    },
    transaction,
  });
  return `${prefix}-${String(count + 1).padStart(2, '0')}`;
}

/**
 * Runs the full pipeline (extraction -> validation -> deterministic rules) and,
 * optionally, persists the patient + queue.
 */
async function runRegistration(validatedData) {
  const { classification, extraction, analisis_ai } = await classifyPatient({
    nama_pasien: validatedData.nama_pasien,
    umur: validatedData.umur,
    satuan_umur: validatedData.satuan_umur,
    keluhan_utama: validatedData.keluhan_utama,
    tanda_vital: validatedData.tanda_vital,
    skala_nyeri: validatedData.skala_nyeri,
  });

  // Staff override (if supplied) wins for the operative queue category, but the
  // AI recommendation is preserved separately.
  const overrideCategory = validatedData.prioritas_triage || null;
  const operativeCategory = overrideCategory || classification.queue_category;

  const transaction = await sequelize.transaction();
  try {
    const patient = await TriagePatient.create({
      nama_pasien: validatedData.nama_pasien,
      umur: validatedData.umur,
      satuan_umur: validatedData.satuan_umur || 'Tahun',
      jenis_kelamin: validatedData.jenis_kelamin,
      keluhan_utama: validatedData.keluhan_utama,
      tanda_vital: validatedData.tanda_vital || {},
      skala_nyeri: validatedData.skala_nyeri ?? null,
      prioritas_triage: operativeCategory,
      skor_urgensi: legacyScoreForCategory(classification.queue_category),
      analisis_ai,
      ai_recommended_category: classification.queue_category,
      classification_status: classification.classification_status,
      review_required: classification.review_required,
      rule_version: classification.rule_version,
      extraction_mode: extraction.mode,
      alasan_esi: classification.alasan_esi,
      ai_recommendation: classification,
      final_prioritas: overrideCategory,
      override_reason: overrideCategory ? 'Ditetapkan petugas saat pendaftaran.' : null,
    }, { transaction });

    const nomorAntrean = await nextQueueNumber(operativeCategory, transaction);
    const queue = await Queue.create({
      nomor_antrean: nomorAntrean,
      status: 'WAITING',
      triage_patient_id: patient.id,
    }, { transaction });

    await transaction.commit();
    return { patient, queue, classification, extraction, operativeCategory };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

function patientPublicView(patient, queue) {
  return {
    id: patient.id,
    nama_pasien: patient.nama_pasien,
    status: queue.status,
    referensi: `SIM-${new Date().getFullYear()}-${String(patient.id).slice(0, 6).toUpperCase()}`,
    queue: { id: queue.id, nomor_antrean: queue.nomor_antrean, status: queue.status },
  };
}

/**
 * STAFF registration: full auditable result. (Prototype: unauthenticated; see docs.)
 */
export const registerTriagePatient = async (req, res, next) => {
  try {
    const validatedData = triageInputSchema.parse(req.body);
    const { patient, queue, classification, extraction } = await runRegistration(validatedData);

    return res.status(201).json({
      status: 'success',
      message: 'Pasien berhasil didaftarkan dan antrean telah digenerate.',
      data: {
        patient: {
          id: patient.id,
          nama_pasien: patient.nama_pasien,
          prioritas_triage: patient.prioritas_triage,
          ai_recommended_category: patient.ai_recommended_category,
          final_prioritas: patient.final_prioritas,
          skor_urgensi: patient.skor_urgensi,
          analisis_ai: patient.analisis_ai,
          alasan_esi: patient.alasan_esi,
          classification_status: patient.classification_status,
          review_required: patient.review_required,
        },
        classification,
        extraction: {
          mode: extraction.mode,
          ok: extraction.ok,
          error: extraction.error || null,
          data: extraction.data,
        },
        queue: { id: queue.id, nomor_antrean: queue.nomor_antrean, status: queue.status },
      },
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        status: 'error',
        message: 'Validasi data gagal.',
        errors: error.issues || error.errors,
      });
    }
    next(error);
  }
};

/**
 * PUBLIC patient intake: limited response. Patients must not receive the
 * AI classification (avoids the illusion of an official triage decision).
 */
export const patientIntake = async (req, res, next) => {
  try {
    const validatedData = triageInputSchema.parse(req.body);
    const { patient, queue } = await runRegistration(validatedData);
    return res.status(201).json({
      status: 'success',
      message: 'Pengajuan diterima. Menunggu verifikasi petugas.',
      data: patientPublicView(patient, queue),
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        status: 'error',
        message: 'Validasi data gagal.',
        errors: error.issues || error.errors,
      });
    }
    next(error);
  }
};

/** Retrieves all triage patients (audit fields included). */
export const getTriagePatients = async (req, res, next) => {
  try {
    const patients = await TriagePatient.findAll({
      include: [{ model: Queue, as: 'queue' }],
      order: [['createdAt', 'DESC']],
    });
    return res.json({ status: 'success', data: patients });
  } catch (error) {
    next(error);
  }
};

/** Retrieves a single triage patient. */
export const getTriagePatientById = async (req, res, next) => {
  try {
    const patient = await TriagePatient.findByPk(req.params.id, {
      include: [{ model: Queue, as: 'queue' }],
    });
    if (!patient) {
      return res.status(404).json({ status: 'error', message: 'Pasien tidak ditemukan.' });
    }
    return res.json({ status: 'success', data: patient });
  } catch (error) {
    next(error);
  }
};

/**
 * HUMAN VERIFICATION: records the clinician's final decision separately from
 * the AI recommendation. Changing the recommendation requires a reason.
 */
export const verifyTriagePatient = async (req, res, next) => {
  try {
    const patient = await TriagePatient.findByPk(req.params.id);
    if (!patient) {
      return res.status(404).json({ status: 'error', message: 'Pasien tidak ditemukan.' });
    }

    const { final_prioritas, override_reason, reviewer_id } = req.body || {};
    const allowed = ['P1', 'P2', 'P3', 'P0'];
    if (!allowed.includes(final_prioritas)) {
      return res.status(400).json({
        status: 'error',
        message: 'final_prioritas harus salah satu dari P1, P2, P3, P0.',
      });
    }

    const changed = final_prioritas !== patient.ai_recommended_category;
    if (changed && (!override_reason || override_reason.trim().length < 3)) {
      return res.status(400).json({
        status: 'error',
        message: 'Alasan perubahan wajib diisi bila prioritas berbeda dari rekomendasi AI.',
      });
    }

    patient.final_prioritas = final_prioritas;
    patient.reviewed_by = reviewer_id || req.user?.id || null;
    patient.reviewed_at = new Date();
    patient.override_reason = override_reason || null;
    patient.prioritas_triage = final_prioritas;
    patient.review_required = false;
    await patient.save();

    // Keep the queue number prefix consistent with the confirmed priority.
    const queue = await Queue.findOne({ where: { triage_patient_id: patient.id } });
    if (queue && queue.nomor_antrean[0] !== PREFIX_BY_CATEGORY[final_prioritas]) {
      queue.nomor_antrean = await nextQueueNumber(final_prioritas, null);
      await queue.save();
    }

    return res.json({
      status: 'success',
      message: 'Prioritas final tersimpan terpisah dari rekomendasi AI.',
      data: {
        id: patient.id,
        ai_recommended_category: patient.ai_recommended_category,
        final_prioritas: patient.final_prioritas,
        changed,
        override_reason: patient.override_reason,
        reviewed_at: patient.reviewed_at,
        review_required: patient.review_required,
      },
    });
  } catch (error) {
    next(error);
  }
};

export default {
  registerTriagePatient,
  patientIntake,
  getTriagePatients,
  getTriagePatientById,
  verifyTriagePatient,
};
