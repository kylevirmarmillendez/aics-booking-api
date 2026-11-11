import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema(
  {
    appointmentCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true
    },
    typeOfAssistance: {
      type: String,
      required: true,
      trim: true
    },
    fullName: {
      type: String,
      required: true,
      trim: true
    },
    cellNumber: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      default: ''
    },
    appointmentDateKey: { type: String, trim: true, index: true },
    timeSlot: { type: String, trim: true },
    appointmentDateTimeSlot: {
      type: Date,
      required: true
    },
    status: {
      type: String,
      required: true,
      enum: ['Pending', 'Confirmed', 'Completed', 'Cancelled'],
      default: 'Pending'
    },
    calendarEventId: {
      type: String,
      trim: true,
      default: null
    },
    cancellationReason: {
      type: String,
      trim: true,
      default: null
    }
  },
  { timestamps: true }
);

const Appointment = mongoose.model('Appointment', appointmentSchema);
export default Appointment;
