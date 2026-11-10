import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import User from '../models/User.js';

const seedUsers = [
  {
    fname: 'Maria',
    mname: 'Santos',
    lname: 'Reyes',
    email: 'maria.reyes@example.com',
    username: 'mreyes',
    role: 'admin',
    status: 'Active',
    phone: '+63 917 123 4567',
    office: 'Central Office',
    region: 'National Capital Region'
  },
  {
    fname: 'Jose',
    mname: 'Cruz',
    lname: 'Dela Cruz',
    email: 'jose.delacruz@example.com',
    username: 'jdelacruz',
    role: 'user',
    status: 'Active',
    phone: '+63 918 234 5678',
    office: 'NCR Field Office',
    region: 'National Capital Region'
  },
  {
    fname: 'Angela',
    lname: 'Garcia',
    email: 'angela.garcia@example.com',
    username: 'agarcia',
    role: 'user',
    status: 'Pending',
    phone: '+63 919 345 6789',
    office: 'Region IV-A Field Office',
    region: 'CALABARZON'
  },
  {
    fname: 'Ramon',
    mname: 'Villanueva',
    lname: 'Santos',
    email: 'ramon.santos@example.com',
    username: 'rsantos',
    role: 'user',
    status: 'Active',
    phone: '+63 920 456 7890',
    office: 'Region III Field Office',
    region: 'Central Luzon'
  },
  {
    fname: 'Lourdes',
    mname: 'Mendoza',
    lname: 'Aquino',
    email: 'lourdes.aquino@example.com',
    username: 'laquino',
    role: 'admin',
    status: 'Inactive',
    phone: '+63 921 567 8901',
    office: 'Central Office',
    region: 'National Capital Region'
  },
  {
    fname: 'Miguel',
    lname: 'Torres',
    email: 'miguel.torres@example.com',
    username: 'mtorres',
    role: 'user',
    status: 'Active',
    phone: '+63 922 678 9012',
    office: 'Region VII Field Office',
    region: 'Central Visayas'
  },
  {
    fname: 'Catherine',
    mname: 'Lim',
    lname: 'Bautista',
    email: 'catherine.bautista@example.com',
    username: 'cbautista',
    role: 'user',
    status: 'Pending',
    phone: '+63 923 789 0123',
    office: 'Region XI Field Office',
    region: 'Davao Region'
  },
  {
    fname: 'Andres',
    mname: 'Ramos',
    lname: 'Flores',
    email: 'andres.flores@example.com',
    username: 'aflores',
    role: 'user',
    status: 'Active',
    phone: '+63 924 890 1234',
    office: 'Region V Field Office',
    region: 'Bicol Region'
  },
  {
    fname: 'Patricia',
    lname: 'Rivera',
    email: 'patricia.rivera@example.com',
    username: 'privera',
    role: 'user',
    status: 'Inactive',
    phone: '+63 925 901 2345',
    office: 'Region I Field Office',
    region: 'Ilocos Region'
  }
];

async function run() {
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_PRODUCTION_SEED !== 'true') {
    throw new Error('Seeding is disabled in production. Set ALLOW_PRODUCTION_SEED=true only when intentionally running this script.');
  }

  const password = process.env.SEED_USER_PASSWORD;
  if (!password || password.length < 8 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password)) {
    throw new Error('Set SEED_USER_PASSWORD to a password with at least 8 characters, including uppercase, lowercase, and a number.');
  }

  await connectDB();
  let created = 0;
  let skipped = 0;

  for (const userData of seedUsers) {
    const existingUser = await User.findOne({
      $or: [{ email: userData.email }, { username: userData.username }]
    }).select('_id');

    if (existingUser) {
      skipped += 1;
      console.info(`Skipped existing user: ${userData.email}`);
      continue;
    }

    // User.create triggers the model's bcrypt pre-save hook.
    await User.create({ ...userData, password });
    created += 1;
    console.info(`Created user: ${userData.email} (${userData.role})`);
  }

  console.info(`User seeding finished. Created: ${created}; skipped: ${skipped}.`);
}

try {
  await run();
} catch (error) {
  console.error('User seeding failed:', error.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
