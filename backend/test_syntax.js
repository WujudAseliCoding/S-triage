const files = [
  './src/config/database.js',
  './src/config/supabase.js',
  './src/config/ai.js',
  './src/models/User.js',
  './src/models/TriagePatient.js',
  './src/models/Queue.js',
  './src/models/Referral.js',
  './src/models/index.js',
  './src/schema/triage.schema.js',
  './src/controllers/triage.controller.js',
  './src/controllers/queue.controller.js',
  './src/controllers/referral.controller.js',
  './src/routes/api.routes.js',
  './src/app.js'
];

async function test() {
  for (const file of files) {
    try {
      await import(file);
      console.log(`✅ ${file} OK`);
    } catch (err) {
      console.error(`❌ Error in ${file}:`);
      console.error(err);
    }
  }
}

test();