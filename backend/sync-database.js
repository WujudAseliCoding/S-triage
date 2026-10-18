// Script untuk sinkronisasi database dan seeding data dummy
import 'dotenv/config';
import { sequelize } from './src/models/index.js';
import { seedDatabase } from './src/seeds/seedDatabase.js';

console.log('\n🔄 === SINKRONISASI DATABASE === \n');

async function syncDatabase() {
  try {
    // Test 1: Authenticate database connection
    console.log('📡 Step 1: Testing database connection...');
    await sequelize.authenticate();
    console.log('✅ Database connection successful!\n');

    // Test 2: Show database config
    const config = sequelize.config;
    console.log('⚙️  Database Configuration:');
    console.log(`   Host: ${config.host || 'Remote/Supabase'}`);
    console.log(`   Database: ${config.database}`);
    console.log(`   Dialect: ${config.dialect}`);
    console.log(`   Username: ${config.username}\n`);

    // Test 3: Sync models (force: false untuk tidak drop existing tables)
    console.log('📋 Step 2: Synchronizing database models...');
    console.log('⚠️  Mode: ALTER (update tanpa drop data existing)\n');

    await sequelize.sync({ alter: true });
    console.log('✅ Models synchronized successfully!\n');

    // Test 4: Check if seeding needed
    const { User, TriagePatient, Queue } = await import('./src/models/index.js');

    const userCount = await User.count();
    const patientCount = await TriagePatient.count();
    const queueCount = await Queue.count();

    console.log('📊 Current Database Status:');
    console.log(`   👥 Users: ${userCount}`);
    console.log(`   🏥 Triage Patients: ${patientCount}`);
    console.log(`   📋 Queues: ${queueCount}\n`);

    if (userCount === 0 && patientCount === 0 && queueCount === 0) {
      console.log('🌱 Database is empty. Running seeder...\n');
      await seedDatabase();
      console.log('\n✅ Seeding completed!\n');

      // Show new counts
      const newUserCount = await User.count();
      const newPatientCount = await TriagePatient.count();
      const newQueueCount = await Queue.count();

      console.log('📊 After Seeding:');
      console.log(`   👥 Users: ${newUserCount}`);
      console.log(`   🏥 Triage Patients: ${newPatientCount}`);
      console.log(`   📋 Queues: ${newQueueCount}\n`);
    } else {
      console.log('ℹ️  Database already has data. Skipping seeder.\n');
      console.log('💡 To re-seed, manually truncate tables or use sequelize.sync({ force: true })\n');
    }

    console.log('✅ === SYNCHRONIZATION COMPLETE === \n');
    console.log('🎯 Next Steps:');
    console.log('   1. Start backend: npm run dev');
    console.log('   2. Test login: POST /api/auth/login');
    console.log('   3. Default credentials:');
    console.log('      Email: admin@selayangpuskesmas.go.id');
    console.log('      Password: password123\n');

  } catch (error) {
    console.error('\n❌ === SYNCHRONIZATION FAILED === \n');
    console.error('Error Type:', error.name);
    console.error('Error Message:', error.message);

    if (error.name === 'SequelizeConnectionRefusedError') {
      console.error('\n💡 Solution:');
      console.error('   1. Check if database is running');
      console.error('   2. Verify DATABASE_URL in .env file');
      console.error('   3. Check database credentials\n');
    } else if (error.name === 'SequelizeConnectionError') {
      console.error('\n💡 Solution:');
      console.error('   1. Check DATABASE_URL format');
      console.error('   2. Verify database exists');
      console.error('   3. Check network connection\n');
    } else if (error.message.includes('does not exist')) {
      console.error('\n💡 Solution:');
      console.error('   1. Create database: CREATE DATABASE s_triage_db;');
      console.error('   2. Or verify database name in .env\n');
    } else {
      console.error('\n📖 Stack trace:');
      console.error(error.stack);
    }
  } finally {
    await sequelize.close();
    process.exit();
  }
}

syncDatabase();
