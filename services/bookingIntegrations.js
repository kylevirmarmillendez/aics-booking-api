import nodemailer from 'nodemailer';
import { google } from 'googleapis';

let mailTransport;
let calendarClient;

function getMailTransport() {
  if (mailTransport) return mailTransport;
  if (!process.env.SMTP_HOST || !process.env.SMTP_FROM) return null;

  mailTransport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
      : undefined
  });
  return mailTransport;
}

function getCalendarClient() {
  if (calendarClient) return calendarClient;
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  if (!email || !privateKey || !process.env.GOOGLE_CALENDAR_ID) return null;

  const auth = new google.auth.JWT({
    email,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/calendar.events']
  });
  calendarClient = google.calendar({ version: 'v3', auth });
  return calendarClient;
}

export async function createCalendarEvent(appointment) {
  const calendar = getCalendarClient();
  if (!calendar) return null;
  const periodDurationMs = ['AM', 'PM'].includes(appointment.timeSlot) ? 4 * 60 * 60 * 1000 : 60 * 60 * 1000;

  const response = await calendar.events.insert({
    calendarId: process.env.GOOGLE_CALENDAR_ID,
    requestBody: {
      summary: `[${appointment.appointmentCode}] [AICS ${appointment.typeOfAssistance}] - ${appointment.fullName}`,
      description: [
        `Appointment Code: ${appointment.appointmentCode}`,
        `Office: ${appointment.officeName || 'Not specified'}`,
        `Cell Number: ${appointment.cellNumber}`,
        `Assistance: ${appointment.typeOfAssistance}`
      ].join('\n'),
      start: { dateTime: appointment.appointmentDateTimeSlot.toISOString(), timeZone: 'Asia/Manila' },
      end: { dateTime: new Date(appointment.appointmentDateTimeSlot.getTime() + periodDurationMs).toISOString(), timeZone: 'Asia/Manila' },
      attendees: appointment.email ? [{ email: appointment.email }] : undefined
    },
    sendUpdates: appointment.email ? 'all' : 'none'
  });
  return response.data.id ?? null;
}

export async function deleteCalendarEvent(eventId) {
  const calendar = getCalendarClient();
  if (!calendar || !eventId) return;
  try {
    await calendar.events.delete({ calendarId: process.env.GOOGLE_CALENDAR_ID, eventId });
  } catch (error) {
    if (error.code !== 404 && error.code !== 410) throw error;
  }
}

export async function sendBookingEmail(appointment) {
  const transport = getMailTransport();
  if (!transport || !appointment.email) return;

  await transport.sendMail({
    from: process.env.SMTP_FROM,
    to: appointment.email,
    subject: `DSWD AICS appointment request [${appointment.appointmentCode}]`,
    text: [
      `Dear ${appointment.fullName},`,
      '',
      'Your appointment request has been received.',
      `Reference code: ${appointment.appointmentCode}`,
      `Office: ${appointment.officeName || 'Not specified'}`,
      `Assistance: ${appointment.typeOfAssistance}`,
      `Date and time: ${formatAppointmentDate(appointment.appointmentDateTimeSlot, appointment.timeSlot)}`,
      `Status: ${appointment.status}`,
      '',
      'Please keep this reference code for your records.'
    ].join('\n')
  });
}

export async function sendCancellationEmail(appointment) {
  const transport = getMailTransport();
  if (!transport || !appointment.email) return;

  await transport.sendMail({
    from: process.env.SMTP_FROM,
    to: appointment.email,
    subject: `DSWD AICS appointment cancelled [${appointment.appointmentCode}]`,
    text: [
      `Dear ${appointment.fullName},`,
      '',
      'Your appointment has been cancelled.',
      `Reference code: ${appointment.appointmentCode}`,
      `Office: ${appointment.officeName || 'Not specified'}`,
      `Date and time: ${formatAppointmentDate(appointment.appointmentDateTimeSlot, appointment.timeSlot)}`,
      appointment.cancellationReason ? `Reason: ${appointment.cancellationReason}` : ''
    ].filter(Boolean).join('\n')
  });
}

function formatAppointmentDate(value, timeSlot) {
  const formattedDate = new Intl.DateTimeFormat('en-PH', {
    dateStyle: 'full',
    timeZone: 'Asia/Manila'
  }).format(value);
  return ['AM', 'PM'].includes(timeSlot)
    ? `${formattedDate} (${timeSlot} period)`
    : `${formattedDate}, ${new Intl.DateTimeFormat('en-PH', { timeStyle: 'short', timeZone: 'Asia/Manila' }).format(value)}`;
}
