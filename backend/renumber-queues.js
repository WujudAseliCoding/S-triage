// Script untuk menggabungkan nomor antrean lama yang masih berformat A-01/B-01/C-01
// menjadi satu urutan harian: 01, 02, 03, ...
//
// Jalankan dari folder backend:
//   node renumber-queues.js
//
// Script ini hanya mengubah kolom `nomor_antrean` (tidak menghapus data lain).
import 'dotenv/config';
import { sequelize, Queue } from './src/models/index.js';

const dayKey = (value) => {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return 'unknown';
  return date.toISOString().slice(0, 10);
};

async function renumberQueues() {
  console.log('\n🔢 === GABUNGKAN NOMOR ANTREAN === \n');
  try {
    await sequelize.authenticate();
    console.log('✅ Terhubung ke database.');

    const queues = await Queue.findAll({ order: [['createdAt', 'ASC']] });
    if (queues.length === 0) {
      console.log('ℹ️  Tidak ada antrean untuk diubah.');
      return;
    }

    const counters = new Map();
    let updated = 0;

    for (const queue of queues) {
      const basis = queue.waktu_masuk || queue.createdAt;
      const key = dayKey(basis);
      const next = (counters.get(key) || 0) + 1;
      counters.set(key, next);

      const nomorBaru = String(next).padStart(2, '0');
      if (queue.nomor_antrean !== nomorBaru) {
        console.log(`  ${queue.nomor_antrean} → ${nomorBaru} (${key})`);
        queue.nomor_antrean = nomorBaru;
        await queue.save();
        updated += 1;
      }
    }

    console.log(`\n✅ Selesai. ${updated} dari ${queues.length} nomor antrean diperbarui.`);
  } catch (error) {
    console.error('\n❌ Gagal menggabungkan nomor antrean:', error.message);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

renumberQueues();
