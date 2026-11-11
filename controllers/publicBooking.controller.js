import { randomInt, randomUUID } from 'node:crypto';
import Appointment from '../models/Appointment.js';
import BookingLock from '../models/BookingLock.js';
import {
  createCalendarEvent,
  deleteCalendarEvent,
  sendBookingEmail,
  sendCancellationEmail
} from '../services/bookingIntegrations.js';

const DAILY_CAPACITY = Number(process.env.BOOKING_DAILY_CAPACITY) || 80;
const TIME_SLOT_CAPACITY = Number(process.env.BOOKING_TIME_SLOT_CAPACITY) || 14;
const TIME_SLOTS = [
  '08:00 AM - 09:00 AM',
  '09:00 AM - 10:00 AM',
  '10:00 AM - 11:00 AM',
  '01:00 PM - 02:00 PM',
  '02:00 PM - 03:00 PM',
  '03:00 PM - 04:00 PM'
];
const HOLIDAYS = {
  '2026-01-01': "New Year's Day",
  '2026-03-20': "Eid'l Fitr",
  '2026-04-02': 'Maundy Thursday',
  '2026-04-03': 'Good Friday',
  '2026-04-09': 'Araw ng Kagitingan',
  '2026-05-01': 'Labor Day',
  '2026-05-27': "Eid'l Adha",
  '2026-06-12': 'Independence Day',
  '2026-08-31': 'National Heroes Day',
  '2026-11-30': 'Bonifacio Day',
  '2026-12-25': 'Christmas Day',
  '2026-12-30': 'Rizal Day'
};
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function manilaDate(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function calendarThroughDate() {
  return process.env.BOOKING_CALENDAR_VALID_THROUGH || `${manilaDate().slice(0, 4)}-12-31`;
}

function validDateString(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function validateBookableDate(dateString) {
  if (!validDateString(dateString)) return 'Please select a valid appointment date.';
  const today = manilaDate();
  if (dateString < today) return 'Past dates cannot be booked.';
  if (dateString > calendarThroughDate()) {
    return 'Bookings beyond the configured holiday calendar are not yet available.';
  }
  const weekday = new Date(`${dateString}T00:00:00.000Z`).getUTCDay();
  if (weekday === 0 || weekday === 6) return 'Appointments are not available on weekends.';
  if (HOLIDAYS[dateString]) return `Appointments are not available on ${HOLIDAYS[dateString]}.`;
  return '';
}

function localDateTime(dateString, timeSlot) {
  const time = timeSlot.split(' - ')[0];
  const match = time.match(/^(\d{1,2}):(\d{2}) (AM|PM)$/);
  if (!match) return null;
  let hour = Number(match[1]);
  if (match[3] === 'PM' && hour !== 12) hour += 12;
  if (match[3] === 'AM' && hour === 12) hour = 0;
  const value = new Date(`${dateString}T${String(hour).padStart(2, '0')}:${match[2]}:00+08:00`);
  return Number.isNaN(value.getTime()) ? null : value;
}

function slotCounts(appointments) {
  return Object.fromEntries(TIME_SLOTS.map((slot) => [
    slot,
    appointments.filter((appointment) => appointment.timeSlot === slot).length
  ]));
}

function publicAppointment(appointment) {
  const appointmentDate = appointment.appointmentDateKey || manilaDate(appointment.appointmentDateTimeSlot);
  return {
    appointmentCode: appointment.appointmentCode,
    assistanceType: appointment.typeOfAssistance,
    fullName: appointment.fullName,
    email: appointment.email || '',
    cellNumber: appointment.cellNumber,
    appointmentDate,
    timeSlot: appointment.timeSlot || new Intl.DateTimeFormat('en-PH', {
      timeStyle: 'short', timeZone: 'Asia/Manila'
    }).format(appointment.appointmentDateTimeSlot),
    status: appointment.status,
    cancellationReason: appointment.cancellationReason || '',
    canCancel: appointment.status !== 'Cancelled' && appointmentDate >= manilaDate()
  };
}

async function acquireDateLock(dateKey) {
  try {
    await BookingLock.updateOne(
      { dateKey },
      { $setOnInsert: { dateKey, leaseToken: null, expiresAt: new Date(0) } },
      { upsert: true }
    );
  } catch (error) {
    if (error.code !== 11000) throw error;
  }

  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    const token = randomUUID();
    const lock = await BookingLock.findOneAndUpdate(
      { dateKey, expiresAt: { $lte: new Date() } },
      { $set: { leaseToken: token, expiresAt: new Date(Date.now() + 30_000) } },
      { new: true }
    );
    if (lock) return token;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  const error = new Error('Booking system is busy processing other requests. Please try again.');
  error.status = 503;
  throw error;
}

async function releaseDateLock(dateKey, token) {
  await BookingLock.updateOne(
    { dateKey, leaseToken: token },
    { $set: { leaseToken: null, expiresAt: new Date(0) } }
  );
}

function makeAppointmentCode(typeOfAssistance, year) {
  const prefix = typeOfAssistance === 'Medical' ? 'MED' : 'FUN';
  let suffix = '';
  for (let index = 0; index < 5; index += 1) suffix += CODE_CHARS[randomInt(CODE_CHARS.length)];
  return `AICS-${prefix}-${year}-${suffix}`;
}

export function getBookingCalendarRules(_req, res) {
  const today = manilaDate();
  const maxDate = calendarThroughDate();
  return res.status(200).json({
    success: true,
    data: {
      minDate: today,
      maxDate,
      weekendDays: [0, 6],
      holidays: Object.entries(HOLIDAYS).map(([date, name]) => ({ date, name })),
      timeSlots: TIME_SLOTS,
      dailyCapacity: DAILY_CAPACITY,
      timeSlotCapacity: TIME_SLOT_CAPACITY,
      available: today <= maxDate
    }
  });
}

export async function getAvailableBookingSlots(req, res, next) {
  try {
    const { date } = req.query;
    const dateError = validateBookableDate(String(date || ''));
    if (dateError) {
      return res.status(400).json({
        success: false,
        message: dateError,
        dateUnavailable: true,
        data: { availableSlots: [], remainingSlots: null, dailyCapacity: DAILY_CAPACITY }
      });
    }

    const appointments = await Appointment.find({
      appointmentDateKey: date,
      status: { $ne: 'Cancelled' }
    }).select('timeSlot');
    const counts = slotCounts(appointments);
    const remainingSlots = Math.max(DAILY_CAPACITY - appointments.length, 0);
    return res.status(200).json({
      success: true,
      data: {
        selectedDate: date,
        availableSlots: remainingSlots
          ? TIME_SLOTS.filter((slot) => counts[slot] < TIME_SLOT_CAPACITY)
          : [],
        remainingSlots,
        dailyCapacity: DAILY_CAPACITY,
        isFullyBooked: remainingSlots === 0
      }
    });
  } catch (error) {
    return next(error);
  }
}

export async function createPublicBooking(req, res, next) {
  const { typeOfAssistance, fullName, cellNumber, email, appointmentDate, timeSlot } = req.body;
  const dateError = validateBookableDate(appointmentDate);
  if (dateError) return res.status(400).json({ success: false, message: dateError, dateUnavailable: true });
  if (!TIME_SLOTS.includes(timeSlot)) {
    return res.status(400).json({ success: false, message: 'Please select a valid appointment time.' });
  }

  const appointmentDateTimeSlot = localDateTime(appointmentDate, timeSlot);
  if (!appointmentDateTimeSlot || appointmentDateTimeSlot <= new Date()) {
    return res.status(400).json({ success: false, message: 'Please select a future appointment time.' });
  }

  let appointment;
  let remainingSlots;
  const lockToken = await acquireDateLock(appointmentDate).catch(next);
  if (!lockToken) return undefined;

  try {
    const existing = await Appointment.find({ appointmentDateKey: appointmentDate, status: { $ne: 'Cancelled' } });
    const duplicate = existing.find((item) => item.cellNumber === cellNumber || item.fullName.toLowerCase() === fullName.toLowerCase());
    if (duplicate) {
      return res.status(409).json({ success: false, message: 'An appointment under this name or mobile number is already scheduled for this date.' });
    }
    if (existing.length >= DAILY_CAPACITY) {
      return res.status(409).json({ success: false, dailyFull: true, message: 'No more appointment slots are available for this date.', data: { remainingSlots: 0, dailyCapacity: DAILY_CAPACITY } });
    }
    const counts = slotCounts(existing);
    if (counts[timeSlot] >= TIME_SLOT_CAPACITY) {
      return res.status(409).json({ success: false, timeSlotFull: true, message: 'That time window has just filled up. Please select another available time.' });
    }

    let appointmentCode;
    for (let attempt = 0; attempt < 10; attempt += 1) {
      appointmentCode = makeAppointmentCode(typeOfAssistance, appointmentDate.slice(0, 4));
      if (!await Appointment.exists({ appointmentCode })) break;
      appointmentCode = '';
    }
    if (!appointmentCode) throw new Error('Unable to generate an appointment reference code.');

    appointment = await Appointment.create({
      appointmentCode,
      typeOfAssistance,
      fullName,
      cellNumber,
      email: email || '',
      appointmentDateKey: appointmentDate,
      timeSlot,
      appointmentDateTimeSlot,
      status: 'Pending'
    });
    remainingSlots = DAILY_CAPACITY - existing.length - 1;
  } catch (error) {
    return next(error);
  } finally {
    await releaseDateLock(appointmentDate, lockToken).catch((error) => console.error('Booking lock release failed:', error));
  }

  try {
    const eventId = await createCalendarEvent(appointment);
    if (eventId) {
      appointment.calendarEventId = eventId;
      await appointment.save();
    }
  } catch (error) {
    console.error(`Calendar event creation failed for ${appointment.appointmentCode}:`, error);
  }
  try {
    await sendBookingEmail(appointment);
  } catch (error) {
    console.error(`Confirmation email delivery failed for ${appointment.appointmentCode}:`, error);
  }

  return res.status(201).json({
    success: true,
    message: 'Appointment request received.',
    data: { ...publicAppointment(appointment), remainingSlots, dailyCapacity: DAILY_CAPACITY }
  });
}

export async function lookupPublicBooking(req, res, next) {
  try {
    const appointment = await Appointment.findOne({
      appointmentCode: req.body.appointmentCode,
      cellNumber: req.body.cellNumber
    });
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'No appointment matched that reference code and mobile number.' });
    }
    return res.status(200).json({ success: true, data: { appointment: publicAppointment(appointment) } });
  } catch (error) {
    return next(error);
  }
}

export async function cancelPublicBooking(req, res, next) {
  try {
    const existing = await Appointment.findOne({
      appointmentCode: req.body.appointmentCode,
      cellNumber: req.body.cellNumber
    });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'No appointment matched that reference code and mobile number.' });
    }

    const dateKey = existing.appointmentDateKey || manilaDate(existing.appointmentDateTimeSlot);
    const lockToken = await acquireDateLock(dateKey);
    let appointment;
    try {
      appointment = await Appointment.findOne({
        appointmentCode: req.body.appointmentCode,
        cellNumber: req.body.cellNumber
      });
      if (!appointment) {
        return res.status(404).json({ success: false, message: 'Appointment not found.' });
      }
      const publicRecord = publicAppointment(appointment);
      if (!publicRecord.canCancel) {
        return res.status(409).json({ success: false, message: 'This appointment can no longer be cancelled online.', data: { appointment: publicRecord } });
      }
      appointment.status = 'Cancelled';
      appointment.cancellationReason = req.body.cancellationReason || 'Cancelled by applicant';
      await appointment.save();
    } finally {
      await releaseDateLock(dateKey, lockToken).catch((error) => console.error('Booking lock release failed:', error));
    }

    try {
      await deleteCalendarEvent(appointment.calendarEventId);
    } catch (error) {
      console.error(`Calendar event deletion failed for ${appointment.appointmentCode}:`, error);
    }
    try {
      await sendCancellationEmail(appointment);
    } catch (error) {
      console.error(`Cancellation email delivery failed for ${appointment.appointmentCode}:`, error);
    }
    return res.status(200).json({
      success: true,
      message: 'Appointment cancelled. The released slot is now available for booking.',
      data: { appointment: publicAppointment(appointment) }
    });
  } catch (error) {
    return next(error);
  }
}
