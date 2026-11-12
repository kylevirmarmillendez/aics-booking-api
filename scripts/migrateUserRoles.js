import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';

async function run() {
  await connectDB();
  const users = mongoose.connection.collection('users');
  const oldUsers = await users.updateMany({ role: 'user' }, { $set: { role: 'booking_officer' } });
  console.info(`Migrated ${oldUsers.modifiedCount} user account(s) to booking_officer.`);

  const superAdmins = process.env.SUPER_ADMIN_USERNAMES
    ?.split(',')
    .map((username) => username.trim().toLowerCase())
    .filter(Boolean) ?? [];
  if (superAdmins.length) {
    const result = await users.updateMany(
      { username: { $in: superAdmins }, role: 'admin' },
      { $set: { role: 'super_admin' } }
    );
    console.info(`Promoted ${result.modifiedCount} configured account(s) to super_admin.`);
  } else {
    console.info('No super admin accounts were promoted. Set SUPER_ADMIN_USERNAMES to an explicit comma-separated account list if needed.');
  }
}

try {
  await run();
} catch (error) {
  console.error('User role migration failed:', error.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
