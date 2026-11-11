import Appointment from '../models/Appointment.js';

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

export async function getAppointments(_req, res, next) {
  try {
    const appointments = await Appointment.find().sort({ createdAt: -1 });
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
    const appointment = await Appointment.findById(req.params.id);
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
    const appointment = await Appointment.findById(req.params.id);
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
    const appointment = await Appointment.findByIdAndDelete(req.params.id);
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
