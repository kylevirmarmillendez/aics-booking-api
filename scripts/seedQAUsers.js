import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import User from '../models/User.js';

const QA_PASSWORD = 'Password@123';

const qaUsers = [
  {
    fname: 'QA',
    lname: 'Super Admin',
    email: 'qa.superadmin@example.com',
    username: 'qa_super_admin',
    role: 'super_admin',
    status: 'Active',
    phone: '+63 900 000 0001',
    office: 'Central Office',
    region: 'National Capital Region'
  },
  {
    fname: 'QA',
    lname: 'Admin',
    email: 'qa.admin@example.com',
    username: 'qa_admin',
    role: 'admin',
    status: 'Active',
    phone: '+63 900 000 0002',
    office: 'Central Office',
    region: 'National Capital Region'
  },
  {
    fname: 'QA',
    lname: 'Booking Officer',
    email: 'qa.booking@example.com',
    username: 'qa_booking_officer',
    role: 'booking_officer',
    status: 'Active',
    phone: '+63 900 000 0003',
    office: 'NCR Field Office',
    region: 'National Capital Region'
  },
  {
    fname: 'QA',
    lname: 'Congressional Officer',
    email: 'qa.congressional@example.com',
    username: 'qa_congressional_officer',
    role: 'congressional_officer',
    status: 'Active',
    phone: '+63 900 000 0004',
    office: 'Central Office',
    region: 'National Capital Region'
  }
];

async function run() {
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_PRODUCTION_SEED !== 'true') {
    throw new Error('Seeding is disabled in production. Set ALLOW_PRODUCTION_SEED=true only when intentionally running this script.');
  }

  await connectDB();
  let created = 0;
  let updated = 0;

  for (const userData of qaUsers) {
    const existingUser = await User.findOne({
      $or: [{ email: userData.email }, { username: userData.username }]
    });

    if (existingUser) {
      existingUser.fname = userData.fname;
      existingUser.mname = null;
      existingUser.lname = userData.lname;
      existingUser.email = userData.email;
      existingUser.username = userData.username;
      existingUser.role = userData.role;
      existingUser.status = userData.status;
      existingUser.phone = userData.phone;
      existingUser.office = userData.office;
      existingUser.region = userData.region;
      existingUser.password = QA_PASSWORD;
      await existingUser.save();
      updated += 1;
      console.info(`Reset and updated QA user: ${userData.email} (${userData.role})`);
      continue;
    }

    await User.create({ ...userData, password: QA_PASSWORD });
    created += 1;
    console.info(`Created QA user: ${userData.email} (${userData.role})`);
  }

  console.info(`QA user seeding finished. Created: ${created}; updated: ${updated}; password: ${QA_PASSWORD}`);
}

try {
  await run();
} catch (error) {
  console.error('QA user seeding failed:', error.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
