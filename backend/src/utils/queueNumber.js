import sequelize from '../config/database.js';
import { Queue, TriagePatient } from '../models/index.js';

// Urutan risiko: P1 (paling berisiko) → P2 → P3 → P0 (ekspektan)
const PRIORITY_RANK = { P1: 1, P2: 2, P3: 3, P0: 4 };

// Hanya antrean aktif yang mengisi deret nomor di papan antrean.
// Pasien selesai/dibatalkan/dirujuk ditaruh SETELAH semua antrean aktif
// agar nomor antrean aktif tetap berurutan tanpa lubang.
const ACTIVE_STATUSES = new Set(['WAITING', 'CALLING', 'SERVING']);

/**
 * Memberi ulang nomor antrean untuk satu hari (default hari ini).
 * Nomor dimulai dari 01 dan diurutkan dari tingkat risiko paling tinggi,
 * lalu berdasarkan waktu masuk antrean.
 */
export const renumberQueuesForDay = async (referenceDate = new Date(), transaction) => {
    const day = new Date(referenceDate);
    if (Number.isNaN(day.getTime())) return;

    const start = new Date(day);
    start.setHours(0, 0, 0, 0);
    const end = new Date(day);
    end.setHours(23, 59, 59, 999);

    const queues = await Queue.findAll({
        where: {
            createdAt: {
                [sequelize.Sequelize.Op.between]: [start, end],
            },
        },
        include: [{ model: TriagePatient, as: 'patient', attributes: ['id', 'prioritas_triage'] }],
        order: [['createdAt', 'ASC']],
        transaction,
    });

    const ordered = [...queues].sort((a, b) => {
        // 1) Antrean aktif lebih dulu (mengisi nomor berurutan di papan)
        const activeA = ACTIVE_STATUSES.has(a.status) ? 0 : 1;
        const activeB = ACTIVE_STATUSES.has(b.status) ? 0 : 1;
        if (activeA !== activeB) return activeA - activeB;

        // 2) Tingkat risiko paling tinggi lebih dulu: P1 → P2 → P3 → P0
        const rankA = PRIORITY_RANK[a.patient?.prioritas_triage] ?? 5;
        const rankB = PRIORITY_RANK[b.patient?.prioritas_triage] ?? 5;
        if (rankA !== rankB) return rankA - rankB;

        // 3) Lalu berdasarkan waktu masuk
        return new Date(a.createdAt) - new Date(b.createdAt);
    });

    for (let index = 0; index < ordered.length; index += 1) {
        const queue = ordered[index];
        const nomorBaru = String(index + 1).padStart(2, '0');
        if (queue.nomor_antrean !== nomorBaru) {
            queue.nomor_antrean = nomorBaru;
            await queue.save({ transaction });
        }
    }
};

export default renumberQueuesForDay;
