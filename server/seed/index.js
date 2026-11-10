// Usage (from the server folder):  npm run seed
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const { seedSampleData, ADMIN, COMPANY_PASSWORD, COMPANIES } = require('./sampleData');

(async () => {
  if (!process.env.MONGO_URI) { console.error('MONGO_URI is missing in server/.env'); process.exit(1); }
  try {
    await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 15000, family: 4 });
    console.log(`Connected to: ${mongoose.connection.host}`);
    const r = await seedSampleData((m) => console.log(' -', m));
    console.log(`\nDone. New: ${r.users} users, ${r.jobs} jobs. Removed demo students: ${r.removedStudents}. (Other existing records were left untouched.)`);
    console.log('\nDemo logins');
    console.log(`  Admin   : ${ADMIN.email} / ${ADMIN.password}   (only created if the database had no admin)`);
    COMPANIES.forEach((c) => console.log(`  Company : ${c.email} / ${COMPANY_PASSWORD}   (${c.name})`));
  } catch (e) {
    console.error('Seed failed:', e.message); process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
})();
