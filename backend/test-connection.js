// Test Database Connection Script
import 'dotenv/config';
import { sequelize } from './src/config/database.js';
import { User } from './src/models/User.js';

console.log('\n🔍 === TEST KONEKSI DATABASE === \n');

async function testConnection() {
  try {
    // Test 1: Authenticate
    console.log('📡 Test 1: Mencoba koneksi ke database...');
    await sequelize.authenticate();
    console.log('✅ Koneksi database berhasil!\n');

    // Test 2: Show Config
    console.log('⚙️  Konfigurasi Database:');
    const config = sequelize.config;
    console.log(`   Host: ${config.host || 'Supabase/Remote'}`);
    console.log(`   Database: ${config.database}`);
    console.log(`   Dialect: ${config.dialect}`);
    console.log(`   Username: ${config.username}\n`);

    // Test 3: Sync Models
    console.log('📋 Test 2: Sinkronisasi tabel...');
    await sequelize.sync({ alter: true });
    console.log('✅ Tabel berhasil disinkronkan!\n');

    // Test 4: Count Users
    console.log('👥 Test 3: Cek jumlah user di database...');
    const userCount = await User.count();
    console.log(`✅ Total user: ${userCount}\n`);

    // Test 5: List Users (max 5)
    if (userCount > 0) {
      console.log('📝 Test 4: Menampilkan user (max 5):');
      const users = await User.findAll({
        limit: 5,
        attributes: ['id', 'nama', 'email', 'role', 'createdAt']
      });
      users.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.nama} (${user.email}) - ${user.role}`);
      });
      console.log('');
    }

    console.log('✅ === SEMUA TEST BERHASIL! ===\n');
    console.log('Backend siap digunakan! 🚀\n');

  } catch (error) {
    console.error('\n❌ === ERROR TERDETEKSI === \n');
    console.error('Tipe Error:', error.name);
    console.error('Pesan Error:', error.message);
    console.error('\n💡 Solusi yang mungkin:');

    if (error.name === 'SequelizeConnectionRefusedError') {
      console.error('   1. Pastikan PostgreSQL sudah berjalan');
      console.error('   2. Cek file .env sudah ada dan benar');
      console.error('   3. Verifikasi DATABASE_URL atau DB_* credentials');
    } else if (error.name === 'SequelizeConnectionError') {
      console.error('   1. Cek DATABASE_URL format: postgresql://user:pass@host:port/db');
      console.error('   2. Cek username dan password database');
      console.error('   3. Pastikan database sudah dibuat');
    } else if (error.message.includes('does not exist')) {
      console.error('   1. Buat database dengan: CREATE DATABASE s_triage_db;');
      console.error('   2. Atau sesuaikan nama database di .env');
    }
    console.error('\n📖 Lihat file SETUP_DATABASE.md untuk panduan lengkap\n');
  } finally {
    await sequelize.close();
    process.exit();
  }
}

testConnection();
