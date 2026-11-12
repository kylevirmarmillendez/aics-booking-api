import Appointment from '../models/Appointment.js';
import Office from '../models/Office.js';

async function officeScopedQuery(user) {
  if (user?.role !== 'booking_officer') return {};
  const assignedOfficeName = user.office?.trim();
  if (!assignedOfficeName) return null;

  const office = await Office.findOne({ name: assignedOfficeName }).select('slug name').lean();
  return office
    ? { $or: [{ officeSlug: office.slug }, { officeName: office.name }] }
    : { officeName: assignedOfficeName };
}

export async function createAppointment(req, res, next) {
  try {
    const appointment = await Appointment.create(req.body);
    return res.status(201).json({
      success: true,
      message: 'Appointment created successfully',
      data: appointment
    });
  } catch (error) {
    return next(error);
  }
}

export async function getAppointments(req, res, next) {
  try {
    const query = await officeScopedQuery(req.user);
    if (!query) return res.status(200).json({ success: true, message: 'No office is assigned to this booking officer.', data: [] });
    const appointments = await Appointment.find(query).sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      message: 'Appointments retrieved successfully',
      data: appointments
    });
  } catch (error) {
    return next(error);
  }
}

export async function getAppointmentById(req, res, next) {
  try {
    const scope = await officeScopedQuery(req.user);
    const appointment = scope === null ? null : await Appointment.findOne({ _id: req.params.id, ...scope });
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }
    return res.status(200).json({
      success: true,
      message: 'Appointment retrieved successfully',
      data: appointment
    });
  } catch (error) {
    return next(error);
  }
}

export async function updateAppointment(req, res, next) {
  try {
    const scope = await officeScopedQuery(req.user);
    const appointment = scope === null ? null : await Appointment.findOne({ _id: req.params.id, ...scope });
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    Object.assign(appointment, req.body);
    await appointment.save();
    return res.status(200).json({
      success: true,
      message: 'Appointment updated successfully',
      data: appointment
    });
  } catch (error) {
    return next(error);
  }
}

export async function deleteAppointment(req, res, next) {
  try {
    const scope = await officeScopedQuery(req.user);
    const appointment = scope === null ? null : await Appointment.findOneAndDelete({ _id: req.params.id, ...scope });
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }
    return res.status(200).json({
      success: true,
      message: 'Appointment deleted successfully',
      data: appointment
    });
  } catch (error) {
    return next(error);
  }
}
