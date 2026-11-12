import Appointment from '../models/Appointment.js';
import Office from '../models/Office.js';
import { migrateLegacyOfficeCapacities } from '../services/offices.js';

export async function getOffices(_req, res, next) {
  try {
    await migrateLegacyOfficeCapacities();
    const offices = await Office.find().sort({ province: 1, city: 1, name: 1 });
    return res.status(200).json({ success: true, message: 'Offices retrieved successfully', data: offices });
  } catch (error) {
    return next(error);
  }
}

export async function getOfficeById(req, res, next) {
  try {
    await migrateLegacyOfficeCapacities();
    const office = await Office.findById(req.params.id);
    if (!office) return res.status(404).json({ success: false, message: 'Office not found' });
    return res.status(200).json({ success: true, message: 'Office retrieved successfully', data: office });
  } catch (error) {
    return next(error);
  }
}

export async function createOffice(req, res, next) {
  try {
    const office = await Office.create(req.body);
    return res.status(201).json({ success: true, message: 'Office created successfully', data: office });
  } catch (error) {
    return next(error);
  }
}

export async function updateOffice(req, res, next) {
  try {
    await migrateLegacyOfficeCapacities();
    const office = await Office.findById(req.params.id);
    if (!office) return res.status(404).json({ success: false, message: 'Office not found' });
    Object.assign(office, req.body);
    if (office.amCapacity + office.pmCapacity !== office.dailyCapacity) {
      return res.status(400).json({ success: false, message: 'AM and PM capacities must add up to the daily capacity.' });
    }
    await office.save();
    return res.status(200).json({ success: true, message: 'Office updated successfully', data: office });
  } catch (error) {
    return next(error);
  }
}

export async function deleteOffice(req, res, next) {
  try {
    const office = await Office.findById(req.params.id);
    if (!office) return res.status(404).json({ success: false, message: 'Office not found' });
    const linkedAppointments = await Appointment.exists({ officeSlug: office.slug });
    if (linkedAppointments) {
      return res.status(409).json({
        success: false,
        message: 'This office has appointment records. Deactivate it instead to preserve booking history.'
      });
    }
    await office.deleteOne();
    return res.status(200).json({ success: true, message: 'Office deleted successfully', data: office });
  } catch (error) {
    return next(error);
  }
}