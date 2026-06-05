import 'dotenv/config';
import * as mongoose from 'mongoose';
import * as bcrypt from 'bcrypt';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/graficaslp';

async function seed() {
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;

  // Seed print types
  await db.collection('printtypes').deleteMany({});
  await db.collection('printtypes').insertMany([
    { slug: 'dtf_uv', name: 'DTF UV', widthCm: 58, minLengthCm: 25, pricePerMeter: 520, currency: 'MXN', isActive: true, createdAt: new Date(), updatedAt: new Date() },
    { slug: 'dtf_textile', name: 'DTF Textil', widthCm: 58, minLengthCm: 50, pricePerMeter: 220, currency: 'MXN', isActive: true, createdAt: new Date(), updatedAt: new Date() },
    { slug: 'sublimation', name: 'Sublimación', widthCm: 111.76, minLengthCm: 100, pricePerMeter: 80, currency: 'MXN', isActive: true, createdAt: new Date(), updatedAt: new Date() },
  ]);

  // Seed admin user
  const passwordHash = await bcrypt.hash('admin123', 10);
  await db.collection('users').deleteMany({});
  await db.collection('users').insertMany([
    { name: 'Admin', email: 'admin@graficaslp.com', passwordHash, role: 'admin', isActive: true, createdAt: new Date(), updatedAt: new Date() },
  ]);

  console.log('✓ Seeded print types and admin user');
  console.log('  Admin login: admin@graficaslp.com / admin123');
  await mongoose.disconnect();
}

seed().catch(console.error);
