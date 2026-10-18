// Script untuk memberi ulang nomor antrean agar dimulai dari tingkat risiko paling tinggi.
// Urutan: P1 (paling berisiko) → P2 → P3 → P0, lalu berdasarkan waktu masuk. Nomor harian: 01, 02, ...
//
// Pengelompokan hari memakai WAKTU LOKAL (bukan UTC) agar konsisten dengan
// penomoran otomatis di backend (renumberQueuesForDay).
//
// Jalankan dari folder backend:
//   node renumber-queues.js
import 'dotenv/config';
import { sequelize, Queue } from './src/models/index.js';
import { renumberQueuesForDay } from './src/utils/queueNumber.js';

async function renumberAllDays() {
  console.log('\n🔢 === URUTKAN NOMOR ANTREAN BERDASARKAN RISIKO === \n');
  try {
    await sequelize.authenticate();
    console.log('✅ Terhubung ke database.');

    const queues = await Queue.findAll({ attributes: ['createdAt'] });
    if (queues.length === 0) {
      console.log('ℹ️  Tidak ada antrean untuk diubah.');
      return;
    }

    // Kumpulkan daftar hari (waktu lokal) yang punya antrean
    const days = new Map();
    for (const queue of queues) {
      const day = new Date(queue.createdAt);
      day.setHours(0, 0, 0, 0);
      days.set(day.toISOString(), day);
    }

    for (const day of days.values()) {
      console.log(`\n📅 Hari: ${day.toLocaleDateString('id-ID')}`);
      await renumberQueuesForDay(day);
    }

    // Tampilkan hasil akhir
    const finalQueues = await Queue.findAll({
      include: [{ attributes: ['prioritas_triage'], association: 'patient' }],
      order: [['createdAt', 'ASC']],
    });
    console.log('\n✅ Nomor antrean setelah diurutkan:');
    for (const q of finalQueues) {
      console.log(`   ${String(q.nomor_antrean).padEnd(5)} | ${q.patient?.prioritas_triage} | ${q.status}`);
    }
  } catch (error) {
    console.error('\n❌ Gagal mengurutkan nomor antrean:', error.message);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

renumberAllDays();
