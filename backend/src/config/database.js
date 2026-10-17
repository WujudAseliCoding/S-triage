import { Sequelize } from 'sequelize';
import 'dotenv/config';

const isProduction = process.env.NODE_ENV === 'production';
const databaseUrl = process.env.DATABASE_URL;

export const sequelize = databaseUrl
  ? new Sequelize(databaseUrl, {
      dialect: 'postgres',
      logging: false,
      dialectOptions: {
        ssl: databaseUrl.includes('supabase') || isProduction
          ? {
              require: true,
              rejectUnauthorized: false,
            }
          : false,
      },
    })
  : new Sequelize({
      dialect: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 's_triage_db',
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      logging: false,
    });

export const testDbConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Koneksi database PostgreSQL/Supabase berhasil terhubung.');
  } catch (error) {
    console.warn('⚠️  Database belum terhubung (pastikan DATABASE_URL di .env sudah aktif):', error.message);
  }
};

export default sequelize;
