import mongoose from 'mongoose';

const bookingLockSchema = new mongoose.Schema(
  {
    dateKey: { type: String, required: true, unique: true },
    leaseToken: { type: String, default: null },
    expiresAt: { type: Date, required: true }
  },
  { versionKey: false }
);

const BookingLock = mongoose.model('BookingLock', bookingLockSchema);
export default BookingLock;
