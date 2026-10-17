import 'dotenv/config';
import app from './app.js';
import { testDbConnection } from './config/database.js';
import { sequelize } from './models/index.js';

const PORT = process.env.PORT || 5000;

if (!process.env.JWT_SECRET) {
  console.error('❌ JWT_SECRET belum diatur di .env. Server dihentikan.');
  process.exit(1);
}


app.listen(PORT, async () => {
  console.log(`🚀 Server Express berjalan di http://localhost:${PORT}`);
  console.log(`📡 API endpoint: http://localhost:${PORT}/api`);
  await testDbConnection();

  if (process.env.NODE_ENV !== 'production') {
    try {
      await sequelize.sync();
      console.log('✅ Tabel database disinkronkan dari model.');
    } catch (error) {
      console.warn('⚠️  Sinkronisasi tabel gagal:', error.message);
    }
  }
});
