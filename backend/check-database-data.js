// Script untuk cek data di database
import 'dotenv/config';
import { sequelize, User, TriagePatient, Queue, Referral, Facility } from './src/models/index.js';

console.log('\n📊 === CEK DATA DATABASE === \n');

async function checkData() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to database\n');

    // 1. Check Users
    console.log('👥 === USERS (DOKTER & STAFF) ===');
    const users = await User.findAll({
      attributes: ['id', 'nama', 'email', 'role', 'spesialisasi', 'status'],
      limit: 10,
    });
    console.log(`Total: ${users.length} users\n`);
    users.forEach((user, i) => {
      console.log(`${i + 1}. ${user.nama} (${user.role})`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Spesialisasi: ${user.spesialisasi || 'N/A'}`);
      console.log(`   Status: ${user.status || 'N/A'}\n`);
    });

    // 2. Check Triage Patients
    console.log('\n🏥 === TRIAGE PATIENTS ===');
    const patients = await TriagePatient.findAll({
      attributes: ['id', 'nama_pasien', 'umur', 'prioritas_triage', 'keluhan_utama'],
      limit: 10,
      order: [['createdAt', 'DESC']],
    });
    console.log(`Total: ${patients.length} patients\n`);
    patients.forEach((p, i) => {
      console.log(`${i + 1}. ${p.nama_pasien} (${p.umur} tahun)`);
      console.log(`   Prioritas: ${p.prioritas_triage || 'N/A'}`);
      console.log(`   Keluhan: ${p.keluhan_utama?.substring(0, 50) || 'N/A'}...\n`);
    });

    // 3. Check Queues
    console.log('\n📋 === QUEUES (ANTRIAN) ===');
    const queues = await Queue.findAll({
      attributes: ['id', 'nomor_antrean', 'status'],
      include: [
        {
          model: TriagePatient,
          as: 'patient',
          attributes: ['nama_pasien', 'prioritas_triage']
        }
      ],
      limit: 10,
      order: [['createdAt', 'DESC']],
    });
    console.log(`Total: ${queues.length} queues\n`);
    queues.forEach((q, i) => {
      console.log(`${i + 1}. ${q.nomor_antrean} - ${q.status}`);
      console.log(`   Pasien: ${q.patient?.nama_pasien || 'N/A'}`);
      console.log(`   Prioritas: ${q.patient?.prioritas_triage || 'N/A'}\n`);
    });

    // 4. Check Facilities
    console.log('\n🏢 === FACILITIES (FASKES MITRA) ===');
    const facilities = await Facility.findAll({
      attributes: ['id', 'nama', 'jarak_km', 'layanan', 'kapasitas_persen'],
      limit: 10,
    });
    console.log(`Total: ${facilities.length} facilities\n`);
    facilities.forEach((f, i) => {
      console.log(`${i + 1}. ${f.nama}`);
      console.log(`   Jarak: ${f.jarak_km} km`);
      console.log(`   Layanan: ${f.layanan}`);
      console.log(`   Kapasitas: ${f.kapasitas_persen}%\n`);
    });

    // 5. Check Referrals
    console.log('\n🔀 === REFERRALS (RUJUKAN) ===');
    const referrals = await Referral.findAll({
      attributes: ['id', 'alasan_rujukan', 'status_rujukan'],
      include: [
        {
          model: TriagePatient,
          as: 'patient',
          attributes: ['nama_pasien']
        },
        {
          model: Facility,
          as: 'facility',
          attributes: ['nama']
        }
      ],
      limit: 10,
      order: [['createdAt', 'DESC']],
    });
    console.log(`Total: ${referrals.length} referrals\n`);
    referrals.forEach((r, i) => {
      console.log(`${i + 1}. ${r.patient?.nama_pasien || 'N/A'} → ${r.facility?.nama || 'N/A'}`);
      console.log(`   Alasan: ${r.alasan_rujukan?.substring(0, 50) || 'N/A'}...`);
      console.log(`   Status: ${r.status_rujukan || 'N/A'}\n`);
    });

    console.log('✅ === DATA CHECK COMPLETE === \n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await sequelize.close();
    process.exit();
  }
}

checkData();
