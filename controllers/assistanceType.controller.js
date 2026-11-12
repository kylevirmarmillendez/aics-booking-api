import Appointment from '../models/Appointment.js';
import AssistanceType from '../models/AssistanceType.js';

export async function getAssistanceTypes(_req, res, next) {
  try {
    const records = await AssistanceType.find().sort({ name: 1 });
    return res.status(200).json({ success: true, message: 'Assistance types retrieved successfully', data: records });
  } catch (error) {
    return next(error);
  }
}

export async function getAssistanceTypeById(req, res, next) {
  try {
    const record = await AssistanceType.findById(req.params.id);
    if (!record) return res.status(404).json({ success: false, message: 'Assistance type not found.' });
    return res.status(200).json({ success: true, data: record });
  } catch (error) {
    return next(error);
  }
}

export async function createAssistanceType(req, res, next) {
  try {
    const record = await AssistanceType.create(req.body);
    return res.status(201).json({ success: true, message: 'Assistance type created successfully', data: record });
  } catch (error) {
    return next(error);
  }
}

export async function updateAssistanceType(req, res, next) {
  try {
    const record = await AssistanceType.findById(req.params.id);
    if (!record) return res.status(404).json({ success: false, message: 'Assistance type not found.' });

    if (req.body.active === false && record.active) {
      const activeCount = await AssistanceType.countDocuments({ active: true });
      if (activeCount <= 1) {
        return res.status(409).json({ success: false, message: 'At least one assistance type must remain active.' });
      }
    }

    Object.assign(record, req.body);
    await record.save();
    return res.status(200).json({ success: true, message: 'Assistance type updated successfully', data: record });
  } catch (error) {
    return next(error);
  }
}

export async function deleteAssistanceType(req, res, next) {
  try {
    const record = await AssistanceType.findById(req.params.id);
    if (!record) return res.status(404).json({ success: false, message: 'Assistance type not found.' });

    if (record.active && await AssistanceType.countDocuments({ active: true }) <= 1) {
      return res.status(409).json({ success: false, message: 'At least one assistance type must remain active.' });
    }

    const linkedAppointments = await Appointment.exists({ typeOfAssistance: record.name });
    if (linkedAppointments) {
      record.active = false;
      await record.save();
      return res.status(200).json({
        success: true,
        message: 'This assistance type has appointment history and was deactivated instead of deleted.',
        data: record
      });
    }

    await record.deleteOne();
    return res.status(200).json({ success: true, message: 'Assistance type deleted successfully', data: record });
  } catch (error) {
    return next(error);
  }
}