import bcrypt from 'bcryptjs';
import { sequelize, User, Facility, TriagePatient, Queue, Referral } from '../models/index.js';

export const seedDatabase = async () => {
  const transaction = await sequelize.transaction();
  try {
    console.log('🌱 Memulai proses seeding database...');

    // 1. Seed Users (Dokter & Staf Faskes)
    const defaultPassword = await bcrypt.hash('password123', 10);

    const doctorsData = [
      {
        nama: 'dr. Faisal Rahman',
        email: 'admin@selayangpuskesmas.go.id',
        password: defaultPassword,
        role: 'ADMIN',
        spesialisasi: 'Kepala Triase & Dokter Umum',
        layanan: 'Layanan FKTP & Triase',
        kompetensi: 'FKTP & Triase',
        status: 'Tersedia',
        jadwal: '08:00–16:00',
        hari: 'Senin–Jumat',
        jalur: 'Triase Utama',
      },
      {
        nama: 'dr. Rina Sari',
        email: 'dr.rina@selayangpuskesmas.go.id',
        password: defaultPassword,
        role: 'DOKTER',
        spesialisasi: 'Dokter Umum',
        layanan: 'Layanan FKTP & Triase',
        kompetensi: 'FKTP & Triase',
        status: 'Tersedia',
        jadwal: '08:00–14:00',
        hari: 'Senin–Rabu',
        jalur: 'Triase 1',
      },
      {
        nama: 'dr. Hendra Wijaya',
        email: 'dr.hendra@selayangpuskesmas.go.id',
        password: defaultPassword,
        role: 'DOKTER',
        spesialisasi: 'Dokter Umum',
        layanan: 'Pemeriksaan umum',
        kompetensi: 'Pemeriksaan umum',
        status: 'Istirahat',
        jadwal: '13:00–18:00',
        hari: 'Senin–Rabu',
        jalur: 'Pemeriksaan umum',
      },
      {
        nama: 'drg. Rasyid Lubis',
        email: 'drg.rasyid@selayangpuskesmas.go.id',
        password: defaultPassword,
        role: 'DOKTER',
        spesialisasi: 'Dokter Gigi',
        layanan: 'Layanan gigi dan mulut',
        kompetensi: 'Gigi & mulut',
        status: 'Sibuk',
        jadwal: '08:00–14:00',
        hari: 'Senin–Kamis',
        jalur: 'Gigi',
      },
      {
        nama: 'dr. Sri Astuti',
        email: 'dr.sri@selayangpuskesmas.go.id',
        password: defaultPassword,
        role: 'DOKTER',
        spesialisasi: 'Dokter Umum',
        layanan: 'Layanan FKTP & Antenatal',
        kompetensi: 'FKTP & Antenatal',
        status: 'Tersedia',
        jadwal: '13:00–18:00',
        hari: 'Selasa–Jumat',
        jalur: 'Antenatal',
      },
      {
        nama: 'dr. Kevin Wijaya',
        email: 'dr.kevin@selayangpuskesmas.go.id',
        password: defaultPassword,
        role: 'DOKTER',
        spesialisasi: 'Dokter Umum',
        layanan: 'Layanan FKTP & Anak',
        kompetensi: 'FKTP & Anak',
        status: 'Tersedia',
        jadwal: '08:00–14:00',
        hari: 'Senin–Jumat',
        jalur: 'Anak',
      },
      {
        nama: 'dr. Mega Utami',
        email: 'dr.mega@selayangpuskesmas.go.id',
        password: defaultPassword,
        role: 'DOKTER',
        spesialisasi: 'Dokter Umum',
        layanan: 'Layanan FKTP & Umum',
        kompetensi: 'FKTP & Umum',
        status: 'Istirahat',
        jadwal: '13:00–18:00',
        hari: 'Senin–Jumat',
        jalur: 'Umum',
      },
      // Dokter spesialis (data simulasi) — tujuan rujukan internal klinik.
      {
        nama: 'dr. Ardiansyah Putra, Sp.JP',
        email: 'dr.ardiansyah@selayangpuskesmas.go.id',
        password: defaultPassword,
        role: 'DOKTER',
        spesialisasi: 'Spesialis Jantung & Pembuluh Darah (Sp.JP)',
        layanan: 'Klinik Jantung & Pemeriksaan EKG',
        kompetensi: 'Kardiologi',
        status: 'Tersedia',
        jadwal: '08:00–14:00',
        hari: 'Senin–Rabu',
        jalur: 'Jantung',
      },
      {
        nama: 'dr. Melati Kusuma, Sp.S',
        email: 'dr.melati@selayangpuskesmas.go.id',
        password: defaultPassword,
        role: 'DOKTER',
        spesialisasi: 'Spesialis Neurologi (Sp.S)',
        layanan: 'Klinik Saraf',
        kompetensi: 'Neurologi',
        status: 'Sibuk',
        jadwal: '09:00–15:00',
        hari: 'Selasa–Kamis',
        jalur: 'Saraf',
      },
      {
        nama: 'dr. Bambang Wibowo, Sp.PD',
        email: 'dr.bambang@selayangpuskesmas.go.id',
        password: defaultPassword,
        role: 'DOKTER',
        spesialisasi: 'Spesialis Penyakit Dalam (Sp.PD)',
        layanan: 'Klinik Penyakit Dalam',
        kompetensi: 'Penyakit Dalam',
        status: 'Tersedia',
        jadwal: '13:00–18:00',
        hari: 'Senin–Jumat',
        jalur: 'Penyakit Dalam',
      },
      {
        nama: 'dr. Ratna Dewi, Sp.OG',
        email: 'dr.ratna@selayangpuskesmas.go.id',
        password: defaultPassword,
        role: 'DOKTER',
        spesialisasi: 'Spesialis Obstetri & Ginekologi (Sp.OG)',
        layanan: 'Klinik Kandungan & Antenatal',
        kompetensi: 'Obstetri & Ginekologi',
        status: 'Tersedia',
        jadwal: '08:00–14:00',
        hari: 'Selasa–Jumat',
        jalur: 'Kandungan',
      },
    ];

    const usersMap = {};
    for (const doc of doctorsData) {
      const [user] = await User.findOrCreate({
        where: { email: doc.email },
        defaults: doc,
        transaction,
      });
      usersMap[doc.nama] = user;
    }
    console.log(`✅ ${Object.keys(usersMap).length} Data Pengguna & Dokter siap.`);

    // 2. Seed Facilities (Faskes Mitra)
    const facilitiesData = [
      {
        nama: 'Puskesmas Medan Baru',
        jarak_km: 3.2,
        layanan: 'Rawat jalan & observasi',
        detail: 'Jarak: 3.2 km • Layanan: Rawat jalan & observasi',
        kapasitas_persen: 45,
        tone: 'bg-emerald-500',
        text_class: 'text-emerald-600',
      },
      {
        nama: 'RS Haji Medan',
        jarak_km: 5.1,
        layanan: 'Rawat inap & observasi',
        detail: 'Jarak: 5.1 km • Layanan: Rawat inap & observasi',
        kapasitas_persen: 62,
        tone: 'bg-amber-500',
        text_class: 'text-amber-600',
      },
      {
        nama: 'Klinik Sehat Mandiri',
        jarak_km: 2.8,
        layanan: 'Rawat jalan & evaluasi awal',
        detail: 'Jarak: 2.8 km • Layanan: Rawat jalan & evaluasi awal',
        kapasitas_persen: 30,
        tone: 'bg-emerald-500',
        text_class: 'text-emerald-600',
      },
      {
        nama: 'RSUD Dr. Pirngadi',
        jarak_km: 6.5,
        layanan: 'UGD 24 Jam, ICU, Rawat Inap Komprehensif',
        detail: 'Jarak: 6.5 km • Layanan: Rujukan utama tipe B',
        kapasitas_persen: 78,
        tone: 'bg-amber-500',
        text_class: 'text-amber-600',
      },
    ];

    const facilityMap = {};
    for (const fac of facilitiesData) {
      const [facility] = await Facility.findOrCreate({
        where: { nama: fac.nama },
        defaults: fac,
        transaction,
      });
      facilityMap[fac.nama] = facility;
    }
    console.log(`✅ ${Object.keys(facilityMap).length} Faskes Mitra siap.`);

    // 3. Seed Pasien Triase & Antrean Live
    const patientsData = [
      // Kategori Merah (P1)
      {
        nama: 'Hendra Wijaya',
        umur: 45,
        jenis_kelamin: 'L',
        keluhan: 'Sesak napas berat, asma akut',
        prioritas: 'P1',
        skor: 5,
        analisis_ai: 'Pasien mengalami eksaserbasi asma berat dengan tanda hipoksia; membutuhkan nebulisasi dan oksigenasi segera.',
        tanda_vital: { spo2: 88, rr: 32, tensi: '140/90', nadi: 110, suhu: 37.2 },
        nomor_antrean: '01',
        status: 'WAITING',
        dokter: 'dr. Rina Sari',
        ruang: 'Ruang Tindakan Gawat Darurat',
      },
      {
        nama: 'Sutan Siregar',
        umur: 58,
        jenis_kelamin: 'L',
        keluhan: 'Nyeri dada, riwayat penyakit jantung',
        prioritas: 'P1',
        skor: 5,
        analisis_ai: 'Gejala khas sindrom koroner akut; penanganan darurat tanpa menunggu antrean.',
        tanda_vital: { spo2: 95, rr: 24, tensi: '150/100', nadi: 98, suhu: 36.8 },
        nomor_antrean: '02',
        status: 'WAITING',
        dokter: 'dr. Rina Sari',
        ruang: 'Ruang Tindakan Gawat Darurat',
      },
      {
        nama: 'Ahmad Subarjo',
        umur: 50,
        jenis_kelamin: 'L',
        keluhan: 'Nyeri dada hebat menjalar ke punggung',
        prioritas: 'P1',
        skor: 5,
        analisis_ai: 'Indikasi kegawatan kardiologis; dalam penanganan stabilisasi awal.',
        tanda_vital: { spo2: 94, rr: 26, tensi: '160/95', nadi: 104, suhu: 37.0 },
        nomor_antrean: '03',
        status: 'SERVING',
        dokter: 'dr. Rina Sari',
        ruang: 'Ruang Tindakan Gawat Darurat',
      },

      // Kategori Kuning (P2)
      {
        nama: 'Budi Kusuma',
        umur: 28,
        jenis_kelamin: 'L',
        keluhan: 'Fraktur lengan tertutup kiri',
        prioritas: 'P2',
        skor: 3,
        analisis_ai: 'Deformitas dan nyeri akut pada ekstremitas atas kiri, hemodinamik stabil.',
        tanda_vital: { spo2: 98, rr: 20, tensi: '120/80', nadi: 84, suhu: 37.0 },
        nomor_antrean: '04',
        status: 'WAITING',
        dokter: 'dr. Hendra Wijaya',
        ruang: 'Ruang Periksa 1',
      },
      {
        nama: 'Aulia Safitri',
        umur: 22,
        jenis_kelamin: 'P',
        keluhan: 'Demam berdarah trombosit turun',
        prioritas: 'P2',
        skor: 3,
        analisis_ai: 'Demam hari ke-4 disertai ptekie dan lemas; perlu evaluasi cairan dan lab.',
        tanda_vital: { spo2: 99, rr: 18, tensi: '110/70', nadi: 88, suhu: 39.1 },
        nomor_antrean: '05',
        status: 'WAITING',
        dokter: 'dr. Rina Sari',
        ruang: 'Ruang Periksa 2',
      },
      {
        nama: 'Zulkifli Harahap',
        umur: 40,
        jenis_kelamin: 'L',
        keluhan: 'Asam lambung hebat, muntah',
        prioritas: 'P2',
        skor: 3,
        analisis_ai: 'Dispepsia akut dengan dehidrasi ringan; butuh antiemetik dan rehidrasi.',
        tanda_vital: { spo2: 98, rr: 20, tensi: '125/85', nadi: 86, suhu: 36.7 },
        nomor_antrean: '06',
        status: 'WAITING',
        dokter: 'dr. Hendra Wijaya',
        ruang: 'Ruang Periksa 1',
      },
      {
        nama: 'Dewi Lestari',
        umur: 34,
        jenis_kelamin: 'P',
        keluhan: 'Luka bakar ringan siram minyak',
        prioritas: 'P2',
        skor: 3,
        analisis_ai: 'Combustio derajat II sekitar 5% di lengan kanan; butuh perawatan luka dan analgesik.',
        tanda_vital: { spo2: 99, rr: 18, tensi: '115/75', nadi: 80, suhu: 36.9 },
        nomor_antrean: '07',
        status: 'WAITING',
        dokter: 'dr. Hendra Wijaya',
        ruang: 'Ruang Tindakan Bedah Minor',
      },
      {
        nama: 'Siti Rahma',
        umur: 32,
        jenis_kelamin: 'P',
        keluhan: 'Nyeri perut kanan bawah hebat',
        prioritas: 'P2',
        skor: 3,
        analisis_ai: 'Suspek apendisitis akut; sedang dilakukan pemeriksaan fisik mendalam.',
        tanda_vital: { spo2: 98, rr: 20, tensi: '120/80', nadi: 90, suhu: 38.2 },
        nomor_antrean: '08',
        status: 'SERVING',
        dokter: 'dr. Hendra Wijaya',
        ruang: 'Ruang Periksa 1',
      },
      {
        nama: 'Yusuf Lubis',
        umur: 37,
        jenis_kelamin: 'L',
        keluhan: 'Batuk berdahak 1 minggu dan demam',
        prioritas: 'P2',
        skor: 3,
        analisis_ai: 'Infeksi saluran pernapasan dengan demam berulang; sedang dalam konsultasi dokter.',
        tanda_vital: { spo2: 97, rr: 20, tensi: '130/85', nadi: 82, suhu: 38.0 },
        nomor_antrean: '09',
        status: 'SERVING',
        dokter: 'dr. Rina Sari',
        ruang: 'Ruang Periksa 2',
      },

      // Kategori Hijau (P3)
      {
        nama: 'Gading Marten',
        umur: 36,
        jenis_kelamin: 'L',
        keluhan: 'Gatal alergi kulit punggung',
        prioritas: 'P3',
        skor: 1,
        analisis_ai: 'Urtikaria akut ringan tanpa sesak atau angioedema; mengantre di ruang tunggu umum.',
        tanda_vital: { spo2: 99, rr: 16, tensi: '120/80', nadi: 76, suhu: 36.5 },
        nomor_antrean: '10',
        status: 'WAITING',
        dokter: 'dr. Hendra Wijaya',
        ruang: 'Ruang Periksa 1',
      },
      {
        nama: 'Rani Handayani',
        umur: 25,
        jenis_kelamin: 'P',
        keluhan: 'Flu ringan dan bersin mendadak',
        prioritas: 'P3',
        skor: 1,
        analisis_ai: 'Common cold tanpa tanda bahaya; antrean reguler.',
        tanda_vital: { spo2: 99, rr: 16, tensi: '110/70', nadi: 72, suhu: 37.1 },
        nomor_antrean: '11',
        status: 'WAITING',
        dokter: 'dr. Hendra Wijaya',
        ruang: 'Ruang Periksa 1',
      },
      {
        nama: 'Siti Kholifah',
        umur: 49,
        jenis_kelamin: 'P',
        keluhan: 'Kontrol luka jahitan minggu lalu',
        prioritas: 'P3',
        skor: 1,
        analisis_ai: 'Kontrol rutin pasca eksisi lipoma, luka bersih tanpa tanda infeksi.',
        tanda_vital: { spo2: 98, rr: 18, tensi: '130/80', nadi: 78, suhu: 36.6 },
        nomor_antrean: '12',
        status: 'WAITING',
        dokter: 'dr. Rina Sari',
        ruang: 'Ruang Periksa 2',
      },
      {
        nama: 'Budi Santoso',
        umur: 19,
        jenis_kelamin: 'L',
        keluhan: 'Demam hari ke-2, pegal linu',
        prioritas: 'P3',
        skor: 1,
        analisis_ai: 'Sindroma demam viral akut; kondisi umum baik.',
        tanda_vital: { spo2: 99, rr: 16, tensi: '115/75', nadi: 74, suhu: 37.8 },
        nomor_antrean: '13',
        status: 'WAITING',
        dokter: 'dr. Rina Sari',
        ruang: 'Ruang Periksa 2',
      },
      {
        nama: 'Megawati Putri',
        umur: 42,
        jenis_kelamin: 'P',
        keluhan: 'Pusing dan lemas',
        prioritas: 'P3',
        skor: 1,
        analisis_ai: 'Tension headache; pemeriksaan selesai dan obat telah diberikan.',
        tanda_vital: { spo2: 99, rr: 16, tensi: '110/70', nadi: 72, suhu: 36.4 },
        nomor_antrean: '14',
        status: 'FINISHED',
        dokter: 'dr. Hendra Wijaya',
        ruang: 'Ruang Periksa 1',
      },

      // Pasien yang diarahkan ke dokter spesialis baru (jantung, saraf,
      // penyakit dalam, kandungan). Data simulasi.
      {
        nama: 'Rahmat Hidayat',
        umur: 61,
        jenis_kelamin: 'L',
        keluhan: 'Nyeri dada saat aktivitas, menjalar ke lengan kiri',
        prioritas: 'P2',
        skor: 3,
        analisis_ai: 'Angina stabil dengan faktor risiko hipertensi; perlu EKG dan evaluasi kardiologi.',
        tanda_vital: { spo2: 96, rr: 20, tensi: '150/90', nadi: 92, suhu: 36.8 },
        nomor_antrean: '15',
        status: 'WAITING',
        dokter: 'dr. Ardiansyah Putra, Sp.JP',
        ruang: 'Ruang Pemeriksaan Jantung',
      },
      {
        nama: 'Nurlela Harahap',
        umur: 58,
        jenis_kelamin: 'P',
        keluhan: 'Kontrol hipertensi dan berdebar-debar',
        prioritas: 'P3',
        skor: 1,
        analisis_ai: 'Hipertensi terkontrol dengan palpitasi ringan; kontrol rutin kardiologi.',
        tanda_vital: { spo2: 98, rr: 18, tensi: '135/85', nadi: 84, suhu: 36.6 },
        nomor_antrean: '16',
        status: 'WAITING',
        dokter: 'dr. Ardiansyah Putra, Sp.JP',
        ruang: 'Ruang Pemeriksaan Jantung',
      },
      {
        nama: 'Lilis Suryani',
        umur: 50,
        jenis_kelamin: 'P',
        keluhan: 'Nyeri kepala hebat berulang disertai mual',
        prioritas: 'P2',
        skor: 3,
        analisis_ai: 'Migren berat dengan mual; perlu evaluasi neurologis dan tatalaksana nyeri.',
        tanda_vital: { spo2: 98, rr: 18, tensi: '130/80', nadi: 80, suhu: 36.7 },
        nomor_antrean: '17',
        status: 'WAITING',
        dokter: 'dr. Melati Kusuma, Sp.S',
        ruang: 'Ruang Pemeriksaan Saraf',
      },
      {
        nama: 'Agus Salim',
        umur: 44,
        jenis_kelamin: 'L',
        keluhan: 'Kebas dan nyeri tangan kanan berulang',
        prioritas: 'P3',
        skor: 1,
        analisis_ai: 'Suspek carpal tunnel syndrome; kontrol neurologi untuk evaluasi lanjutan.',
        tanda_vital: { spo2: 99, rr: 16, tensi: '120/80', nadi: 76, suhu: 36.5 },
        nomor_antrean: '18',
        status: 'WAITING',
        dokter: 'dr. Melati Kusuma, Sp.S',
        ruang: 'Ruang Pemeriksaan Saraf',
      },
      {
        nama: 'Joko Purnomo',
        umur: 55,
        jenis_kelamin: 'L',
        keluhan: 'Gula darah tinggi, lemas, dan sering haus',
        prioritas: 'P2',
        skor: 3,
        analisis_ai: 'Hiperglikemia dengan gejala klasik; perlu evaluasi penyakit dalam dan pemeriksaan lab.',
        tanda_vital: { spo2: 98, rr: 20, tensi: '140/90', nadi: 88, suhu: 36.8 },
        nomor_antrean: '19',
        status: 'WAITING',
        dokter: 'dr. Bambang Wibowo, Sp.PD',
        ruang: 'Ruang Periksa Penyakit Dalam',
      },
      {
        nama: 'Endang Susilowati',
        umur: 63,
        jenis_kelamin: 'P',
        keluhan: 'Kontrol diabetes dan kolesterol',
        prioritas: 'P3',
        skor: 1,
        analisis_ai: 'Diabetes tipe 2 terkontrol; kontrol rutin penyakit dalam.',
        tanda_vital: { spo2: 98, rr: 18, tensi: '130/85', nadi: 78, suhu: 36.5 },
        nomor_antrean: '20',
        status: 'WAITING',
        dokter: 'dr. Bambang Wibowo, Sp.PD',
        ruang: 'Ruang Periksa Penyakit Dalam',
      },
      {
        nama: 'Sari Wijayanti',
        umur: 29,
        jenis_kelamin: 'P',
        keluhan: 'Perdarahan dari jalan lahir pada kehamilan muda',
        prioritas: 'P2',
        skor: 3,
        analisis_ai: 'Suspek abortus imminens; perlu evaluasi obstetri dan pemeriksaan USG.',
        tanda_vital: { spo2: 98, rr: 20, tensi: '110/70', nadi: 92, suhu: 37.0 },
        nomor_antrean: '21',
        status: 'WAITING',
        dokter: 'dr. Ratna Dewi, Sp.OG',
        ruang: 'Ruang Pemeriksaan Kandungan',
      },
      {
        nama: 'Fitria Ramadhani',
        umur: 26,
        jenis_kelamin: 'P',
        keluhan: 'Kontrol kehamilan trimester pertama',
        prioritas: 'P3',
        skor: 1,
        analisis_ai: 'Antenatal care rutin G1P0 tanpa keluhan bahaya.',
        tanda_vital: { spo2: 99, rr: 16, tensi: '110/70', nadi: 82, suhu: 36.6 },
        nomor_antrean: '22',
        status: 'WAITING',
        dokter: 'dr. Ratna Dewi, Sp.OG',
        ruang: 'Ruang Pemeriksaan Kandungan',
      },
    ];

    for (const p of patientsData) {
      let patient = await TriagePatient.findOne({
        where: { nama_pasien: p.nama },
        transaction,
      });

      if (!patient) {
        patient = await TriagePatient.create({
          nama_pasien: p.nama,
          umur: p.umur,
          jenis_kelamin: p.jenis_kelamin,
          keluhan_utama: p.keluhan,
          tanda_vital: p.tanda_vital,
          prioritas_triage: p.prioritas,
          skor_urgensi: p.skor,
          analisis_ai: p.analisis_ai,
          status_verifikasi: 'DIVERIFIKASI',
        }, { transaction });
      }

      const assignedDoctor = usersMap[p.dokter];

      await Queue.findOrCreate({
        where: { triage_patient_id: patient.id },
        defaults: {
          nomor_antrean: p.nomor_antrean,
          status: p.status,
          triage_patient_id: patient.id,
          dokter_id: assignedDoctor ? assignedDoctor.id : null,
          ruang_periksa: p.ruang,
        },
        transaction,
      });
    }
    console.log(`✅ ${patientsData.length} Data Pasien & Antrean berhasil disinkronkan.`);

    // 4. Seed Referrals (Riwayat Rujukan)
    const referralsData = [
      {
        nama: 'Subagyo Handoko',
        umur: 54,
        jenis_kelamin: 'L',
        keluhan: 'Nyeri dada menjalar ke lengan kiri, keringat dingin',
        prioritas: 'P1',
        skor: 5,
        faskes_tujuan: 'RS Haji Medan',
        alasan: 'Suspek sindrom koroner akut, perlu fasilitas kateterisasi jantung segera.',
        status_rujukan: 'Diterima',
        catatan_medis: 'O2 4 Lpm terpasang, ISDN 5mg sublingual telah diberikan.',
      },
      {
        nama: 'Anisa Rahmawati',
        umur: 27,
        jenis_kelamin: 'P',
        keluhan: 'Perdarahan trimester 3 disertai kontraksi dini',
        prioritas: 'P2',
        skor: 3,
        faskes_tujuan: 'RSUD Dr. Pirngadi',
        alasan: 'G2P1A0 usia gestasi 34 minggu dengan perdarahan antepartum; perlu penanganan SpOG & NICU.',
        status_rujukan: 'Menunggu konfirmasi',
        catatan_medis: 'IVFD RL cor 1 labu, DJJ 145x/menit reguler.',
      },
      {
        nama: 'Heru Prasetyo',
        umur: 62,
        jenis_kelamin: 'L',
        keluhan: 'Kelemahan anggota gerak kanan pasca stroke',
        prioritas: 'P3',
        skor: 1,
        faskes_tujuan: 'Klinik Sehat Mandiri',
        alasan: 'Rujukan program rehabilitasi medik dan fisioterapi lanjutan.',
        status_rujukan: 'Serah terima selesai',
        catatan_medis: 'Serah terima selesai diterima oleh fisioterapis penanggung jawab.',
      },
    ];

    for (const ref of referralsData) {
      let patient = await TriagePatient.findOne({
        where: { nama_pasien: ref.nama },
        transaction,
      });

      if (!patient) {
        patient = await TriagePatient.create({
          nama_pasien: ref.nama,
          umur: ref.umur,
          jenis_kelamin: ref.jenis_kelamin,
          keluhan_utama: ref.keluhan,
          prioritas_triage: ref.prioritas,
          skor_urgensi: ref.skor,
          analisis_ai: 'Rujukan eksternal diinisiasi berdasarkan indikasi klinis lanjutan.',
          status_verifikasi: 'DIVERIFIKASI',
        }, { transaction });
      }

      const targetFacility = facilityMap[ref.faskes_tujuan];

      await Referral.findOrCreate({
        where: { triage_patient_id: patient.id },
        defaults: {
          triage_patient_id: patient.id,
          facility_id: targetFacility ? targetFacility.id : null,
          faskes_tujuan: ref.faskes_tujuan,
          alasan_rujukan: ref.alasan,
          status_rujukan: ref.status_rujukan,
          catatan_medis: ref.catatan_medis,
          petugas_pengirim: 'dr. Faisal Rahman',
        },
        transaction,
      });
    }
    console.log(`✅ ${referralsData.length} Riwayat Rujukan berhasil disinkronkan.`);

    await transaction.commit();
    console.log('🎉 Seeding database S-Triage selesai dengan sukses!');
  } catch (error) {
    await transaction.rollback();
    console.error('❌ Terjadi kesalahan saat seeding database:', error);
    throw error;
  }
};

// Jalankan seeder jika script dieksekusi langsung
if (process.argv[1]?.endsWith('seedDatabase.js')) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export default seedDatabase;
