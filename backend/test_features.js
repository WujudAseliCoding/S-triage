import sequelize from './src/config/database.js';
import { TriagePatient, Queue, Referral } from './src/models/index.js';
import { analyzeTriageWithAI } from './src/config/ai.js';

async function runTests() {
  console.log('🚀 MEMULAI PENGUJIAN INTEGRASI FOKUS B 🚀\n');

  try {
    // 1. Tes Koneksi Database
    console.log('--- [TES 1: KONEKSI DATABASE] ---');
    await sequelize.authenticate();
    console.log('✅ Database berhasil terhubung.');

    // Sinkronisasi Tabel (Membuat tabel baru jika belum ada di Supabase/Postgres)
    console.log('🔄 Mensinkronisasikan tabel-tabel ke database...');
    await sequelize.sync({ alter: true });
    console.log('✅ Tabel triage_patients, queues, dan referrals berhasil disinkronkan!\n');

    // 2. Tes Integrasi Way AI Gateway (Gutech)
    console.log('--- [TES 2: INTEGRASI AI GATEWAY (GUTECH)] ---');
    const keluhanKritis = 'Saya merasa sesak napas sangat berat sejak 1 jam yang lalu disertai nyeri dada kiri menjalar ke lengan kiri dan pusing.';
    console.log(`Mengirim keluhan kritis: "${keluhanKritis}"`);
    
    const aiResult = await analyzeTriageWithAI(keluhanKritis, { spo2: 88, suhu: 37.5 });
    console.log('Hasil Analisis AI:');
    console.log(`- Kategori Prioritas : ${aiResult.prioritas_triage} (Harus P1/Merah)`);
    console.log(`- Skor Urgensi      : ${aiResult.skor_urgensi} (Skala 1-5)`);
    console.log(`- Analisis Medis     : ${aiResult.analisis_ai}\n`);

    // 3. Tes Alur Registrasi Pasien & Autogenerate Antrean
    console.log('--- [TES 3: REGISTRASI PASIEN & AUTO-GENERATE ANTREAN] ---');
    const patient = await TriagePatient.create({
      nama_pasien: 'Budi Santoso',
      umur: 45,
      jenis_kelamin: 'L',
      keluhan_utama: keluhanKritis,
      tanda_vital: { spo2: 88, suhu: 37.5, sistole: 140, diastole: 90 },
      prioritas_triage: aiResult.prioritas_triage,
      skor_urgensi: aiResult.skor_urgensi,
      analisis_ai: aiResult.analisis_ai,
    });
    console.log(`✅ Pasien "${patient.nama_pasien}" berhasil disimpan dengan ID: ${patient.id}`);

    // Generate Nomor Antrean
    let prefix = patient.prioritas_triage === 'P1' ? 'A' : patient.prioritas_triage === 'P2' ? 'B' : 'C';
    const nomorAntrean = `${prefix}-01`;

    const queue = await Queue.create({
      nomor_antrean: nomorAntrean,
      status: 'WAITING',
      triage_patient_id: patient.id,
    });
    console.log(`✅ Antrean berhasil digenerate otomatis: Nomor [${queue.nomor_antrean}] | Status: [${queue.status}]\n`);

    // 4. Tes Alur Rujukan Eksternal (Load Balancing)
    console.log('--- [TES 4: PENCATATAN RUJUKAN EKSTERNAL] ---');
    const referral = await Referral.create({
      triage_patient_id: patient.id,
      faskes_tujuan: 'RSUD Dr. M. Djamil',
      alasan_rujukan: 'Pasien mengalami tanda-tanda Sindrom Koroner Akut (P1) dengan SpO2 < 90% yang memerlukan ICU/Cath Lab segera.',
      status_rujukan: 'PENDING',
    });
    console.log(`✅ Rujukan eksternal dicatat ke "${referral.faskes_tujuan}".`);
    
    // Update status antrean karena dirujuk keluar
    queue.status = 'REFER_OUT';
    await queue.save();
    console.log(`✅ Status antrean pasien diperbarui menjadi: [${queue.status}]\n`);

    console.log('🎉 SEMUA TES INTEGRASI FOKUS B BERHASIL DIJALANKAN DENGAN SUKSES! 🎉');
  } catch (error) {
    console.error('\n❌ PENGUJIAN GAGAL:');
    console.error(error);
  } finally {
    await sequelize.close();
    console.log('\n🔌 Koneksi database ditutup.');
  }
}

runTests();