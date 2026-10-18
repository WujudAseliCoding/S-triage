import { Op } from 'sequelize';
import { TriagePatient, Queue, Referral, User } from '../models/index.js';
import { triageInputSchema, triageVerifySchema } from '../schema/triage.schema.js';
import { renumberQueuesForDay } from '../utils/queueNumber.js';
import { classifyPatient, legacyScoreForCategory } from '../services/triage/classificationService.js';
import sequelize from '../config/database.js';

const zodErrorResponse = (res, error) =>
  res.status(400).json({
    status: 'error',
    message: error.issues?.[0]?.message || 'Validasi data gagal.',
    errors: (error.issues || []).map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    })),
  });

/**
 * Runs the full pipeline (LLM extraction -> schema validation -> deterministic
 * rules) and, optionally, persists the patient + queue.
 *
 * The operational category comes ONLY from the deterministic rule engine. A
 * staff override (`prioritas_triage`) wins for the operative queue category but
 * is recorded separately from the AI recommendation (`prioritas_ai`).
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
      nik: validatedData.nik || null,
      tanggal_lahir: validatedData.tanggal_lahir || null,
      umur: validatedData.umur,
      satuan_umur: validatedData.satuan_umur || 'tahun',
      jenis_kelamin: validatedData.jenis_kelamin,
      keluhan_utama: validatedData.keluhan_utama,
      waktu_mulai_keluhan: validatedData.waktu_mulai_keluhan || null,
      alergi_obat: validatedData.alergi_obat || null,
      tanda_vital: validatedData.tanda_vital || {},
      skala_nyeri: validatedData.skala_nyeri ?? null,
      prioritas_triage: operativeCategory,
      prioritas_ai: classification.queue_category,
      skor_urgensi: legacyScoreForCategory(classification.queue_category),
      analisis_ai,
      status_verifikasi: 'BELUM_DIVERIFIKASI',
      // --- audit / accountability (deterministic engine) ---
      classification_status: classification.classification_status,
      review_required: classification.review_required,
      rule_version: classification.rule_version,
      extraction_mode: extraction.mode,
      alasan_esi: classification.alasan_esi,
      ai_recommendation: classification,
    }, { transaction });

    // Buat entri antrean (Queue) baru. Nomor antrean final ditentukan setelah
    // ini oleh renumberQueuesForDay(): seluruh antrean hari itu diurutkan dari
    // tingkat risiko paling tinggi dalam satu deret harian yang digabung
    // (tanpa prefix A/B/C/D).
    const queue = await Queue.create({
      nomor_antrean: '00',
      status: 'WAITING',
      triage_patient_id: patient.id,
    }, { transaction });

    await renumberQueuesForDay(queue.createdAt, transaction);
    await queue.reload({ transaction });

    await transaction.commit();
    return { patient, queue, classification, extraction, operativeCategory, overrideCategory };
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
    // Kategori operasional awal (provisional). Dikirim agar indikator warna di
    // halaman pasien SAMA dengan Manajemen Antrean; petugas tetap dapat
    // mengubahnya setelah verifikasi/asesmen. Bukan ESI level.
    prioritas_triage: patient.prioritas_triage,
    queue: { id: queue.id, nomor_antrean: queue.nomor_antrean, status: queue.status },
  };
}

/**
 * STAFF registration: full auditable result. (Prototype: unauthenticated; see docs.)
 */
export const registerTriagePatient = async (req, res, next) => {
  try {
    const validatedData = triageInputSchema.parse(req.body);
    const { patient, queue, classification, extraction, overrideCategory } = await runRegistration(validatedData);

    return res.status(201).json({
      status: 'success',
      message: 'Pasien berhasil didaftarkan dan antrean telah digenerate.',
      data: {
        patient: {
          id: patient.id,
          nama_pasien: patient.nama_pasien,
          prioritas_triage: patient.prioritas_triage,
          prioritas_ai: patient.prioritas_ai,
          // Aliases kept for the staff classification panel & existing callers.
          ai_recommended_category: patient.prioritas_ai,
          final_prioritas: overrideCategory,
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
      return zodErrorResponse(res, error);
    }
    next(error);
  }
};

/**
 * PUBLIC patient intake: limited response. It includes the provisional
 * operative category so the patient's queue indicator uses the SAME colour as
 * the staff queue (product decision); the full auditable classification block
 * and the AI internals are still not exposed.
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
      return zodErrorResponse(res, error);
    }
    next(error);
  }
};

/**
 * Mengambil daftar seluruh pasien triase
 * Query `verifikasi`: pending (menunggu verifikasi) | done (sudah diverifikasi) | all (default)
 * Pasien yang menunggu verifikasi diurutkan berdasarkan prioritas klinis, lalu waktu masuk terlama.
 */
export const getTriagePatients = async (req, res, next) => {
  try {
    const { verifikasi = 'all' } = req.query;

    const where = {};
    if (verifikasi === 'pending') {
      where.status_verifikasi = 'BELUM_DIVERIFIKASI';
    } else if (verifikasi === 'done') {
      where.status_verifikasi = { [Op.in]: ['DIVERIFIKASI', 'OVERRIDDEN'] };
    }

    const order = verifikasi === 'pending'
      ? [
          [sequelize.literal(`
            CASE
              WHEN "TriagePatient"."prioritas_triage" = 'P1' THEN 1
              WHEN "TriagePatient"."prioritas_triage" = 'P2' THEN 2
              WHEN "TriagePatient"."prioritas_triage" = 'P3' THEN 3
              WHEN "TriagePatient"."prioritas_triage" = 'P0' THEN 4
              ELSE 5
            END
          `), 'ASC'],
          ['createdAt', 'ASC'],
        ]
      : [['createdAt', 'DESC']];

    const [patients, pending, done] = await Promise.all([
      TriagePatient.findAll({
        where,
        include: [
          { model: Queue, as: 'queue' }
        ],
        order,
        limit: 200,
      }),
      TriagePatient.count({ where: { status_verifikasi: 'BELUM_DIVERIFIKASI' } }),
      TriagePatient.count({ where: { status_verifikasi: { [Op.in]: ['DIVERIFIKASI', 'OVERRIDDEN'] } } }),
    ]);

    return res.json({
      status: 'success',
      data: patients,
      meta: { pending, done },
    });
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

    const { final_prioritas, override_reason } = req.body || {};
    const allowed = ['P1', 'P2', 'P3', 'P0'];
    if (!allowed.includes(final_prioritas)) {
      return res.status(400).json({
        status: 'error',
        message: 'final_prioritas harus salah satu dari P1, P2, P3, P0.',
      });
    }

    const aiCategory = patient.prioritas_ai || patient.prioritas_triage || null;
    const changed = final_prioritas !== aiCategory;
    if (changed && (!override_reason || override_reason.trim().length < 3)) {
      return res.status(400).json({
        status: 'error',
        message: 'Alasan perubahan wajib diisi bila prioritas berbeda dari rekomendasi AI.',
      });
    }

    patient.prioritas_triage = final_prioritas; // operative/final category
    patient.alasan_override = override_reason || null;
    patient.review_required = false;
    patient.status_verifikasi = changed ? 'OVERRIDDEN' : 'DIVERIFIKASI';
    patient.petugas_verifikator_id = req.user?.id || null;
    patient.nama_verifikator = req.user?.nama || null;
    patient.waktu_verifikasi = new Date();
    await patient.save();

    // Bila prioritas berubah, urutkan ulang nomor antrean hari itu.
    const queue = await Queue.findOne({ where: { triage_patient_id: patient.id } });
    if (queue && changed) {
      await renumberQueuesForDay(queue.createdAt);
      await queue.reload();
    }

    return res.json({
      status: 'success',
      message: 'Prioritas final tersimpan terpisah dari rekomendasi AI.',
      data: {
        id: patient.id,
        ai_recommended_category: patient.prioritas_ai,
        final_prioritas: patient.prioritas_triage,
        changed,
        override_reason: patient.alasan_override,
        status_verifikasi: patient.status_verifikasi,
        reviewed_at: patient.waktu_verifikasi,
        review_required: patient.review_required,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mengedit data pasien oleh perawat. Dengan `verifikasi: true`, data ditandai terverifikasi
 * beserta identitas verifikator & waktunya. Mengubah prioritas dari rekomendasi AI wajib
 * disertai alasan (status menjadi OVERRIDDEN).
 */
export const updateTriagePatient = async (req, res, next) => {
  try {
    const data = triageVerifySchema.parse(req.body);

    const patient = await TriagePatient.findByPk(req.params.id, {
      include: [
        { model: Queue, as: 'queue' }
      ],
    });
    if (!patient) {
      return res.status(404).json({
        status: 'error',
        message: 'Pasien tidak ditemukan.',
      });
    }

    // Data lama (sebelum fitur verifikasi) belum punya prioritas_ai: gunakan prioritas saat ini sebagai acuan.
    if (!patient.prioritas_ai) {
      patient.prioritas_ai = patient.prioritas_triage;
    }

    const previousPriority = patient.prioritas_triage;
    const isOverride = data.prioritas_triage !== patient.prioritas_ai;
    if (data.verifikasi && isOverride && !data.alasan_override) {
      return res.status(400).json({
        status: 'error',
        message: 'Alasan perubahan prioritas wajib diisi bila prioritas berbeda dari rekomendasi AI.',
      });
    }

    patient.set({
      nama_pasien: data.nama_pasien,
      umur: data.umur,
      satuan_umur: data.satuan_umur,
      jenis_kelamin: data.jenis_kelamin,
      nik: data.nik || null,
      tanggal_lahir: data.tanggal_lahir || null,
      keluhan_utama: data.keluhan_utama,
      waktu_mulai_keluhan: data.waktu_mulai_keluhan || null,
      alergi_obat: data.alergi_obat || null,
      tanda_vital: data.tanda_vital || {},
      asesmen: data.asesmen || {},
      catatan_petugas: data.catatan_petugas || null,
      prioritas_triage: data.prioritas_triage,
      alasan_override: isOverride ? (data.alasan_override || null) : null,
    });

    if (data.verifikasi) {
      const verifikator = req.user?.id ? await User.findByPk(req.user.id) : null;
      patient.status_verifikasi = isOverride ? 'OVERRIDDEN' : 'DIVERIFIKASI';
      patient.petugas_verifikator_id = verifikator?.id || null;
      patient.nama_verifikator = verifikator?.nama || null;
      patient.waktu_verifikasi = new Date();
      patient.review_required = false;
    }

    await patient.save();

    // Bila prioritas berubah, urutkan ulang nomor antrean hari itu
    // (dari tingkat risiko paling tinggi) lalu muat ulang nomornya.
    if (data.prioritas_triage !== previousPriority) {
      const queue = await Queue.findOne({ where: { triage_patient_id: patient.id } });
      if (queue) {
        await renumberQueuesForDay(queue.createdAt);
        await queue.reload();
      }
    }

    return res.json({
      status: 'success',
      message: data.verifikasi
        ? 'Data pasien berhasil diverifikasi.'
        : 'Perubahan data pasien berhasil disimpan.',
      data: patient,
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return zodErrorResponse(res, error);
    }
    next(error);
  }
};

/**
 * Menghapus data registrasi pasien triase beserta antreannya
 */
export const deleteTriagePatient = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const patient = await TriagePatient.findByPk(req.params.id, { transaction });
    if (!patient) {
      await transaction.rollback();
      return res.status(404).json({
        status: 'error',
        message: 'Pasien tidak ditemukan.',
      });
    }

    const queue = await Queue.findOne({
      where: { triage_patient_id: patient.id },
      transaction,
    });
    const dayRef = queue?.createdAt || patient.createdAt;

    await Queue.destroy({ where: { triage_patient_id: patient.id }, transaction });
    await Referral.destroy({ where: { triage_patient_id: patient.id }, transaction });
    await patient.destroy({ transaction });

    // Rapikan kembali nomor antrean hari itu agar tetap berurutan
    await renumberQueuesForDay(dayRef, transaction);

    await transaction.commit();

    return res.json({
      status: 'success',
      message: 'Data registrasi pasien berhasil dihapus.',
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

export default {
  registerTriagePatient,
  patientIntake,
  getTriagePatients,
  getTriagePatientById,
  verifyTriagePatient,
  updateTriagePatient,
  deleteTriagePatient,
};
