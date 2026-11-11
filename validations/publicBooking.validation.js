import Joi from 'joi';

export const createPublicBookingSchema = Joi.object({
  typeOfAssistance: Joi.string().trim().valid('Medical', 'Funeral').required(),
  fullName: Joi.string().trim().min(3).max(150).required(),
  cellNumber: Joi.string().trim().pattern(/^09\d{9}$/).required(),
  email: Joi.string().trim().lowercase().email().max(254).allow(''),
  appointmentDate: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
  timeSlot: Joi.string().required()
}).required();

export const lookupPublicBookingSchema = Joi.object({
  appointmentCode: Joi.string().trim().uppercase().pattern(/^AICS-(?:MED|FUN)-\d{4}-[A-Z0-9]{5}$/).required(),
  cellNumber: Joi.string().trim().pattern(/^09\d{9}$/).required()
}).required();

export const cancelPublicBookingSchema = lookupPublicBookingSchema.append({
  cancellationReason: Joi.string().trim().max(500).allow('').default('')
});
