import 'dotenv/config';
import app from './app.js';
import { testDbConnection } from './config/database.js';

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log(`🚀 Server Express berjalan di http://localhost:${PORT}`);
  console.log(`📡 API endpoint: http://localhost:${PORT}/api`);
  await testDbConnection();
});

