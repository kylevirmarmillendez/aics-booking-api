import Joi from 'joi';

export const createPublicBookingSchema = Joi.object({
  typeOfAssistance: Joi.string().trim().min(1).max(100).required(),
  officeSlug: Joi.string().trim().lowercase().pattern(/^[a-z0-9-]+$/).required(),
  firstName: Joi.string().trim().min(1).max(80).required(),
  middleName: Joi.string().trim().max(80).allow('').default(''),
  lastName: Joi.string().trim().min(1).max(80).required(),
  birthdate: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).custom((value, helpers) => {
    const date = new Date(`${value}T00:00:00.000Z`);
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila' }).format(new Date());
    if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value || value > today) {
      return helpers.error('any.invalid');
    }
    return value;
  }, 'valid past birthdate').required(),
  cellNumber: Joi.string().trim().pattern(/^09\d{9}$/).required(),
  email: Joi.string().trim().lowercase().email().max(254).allow(''),
  appointmentDate: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
  timeSlot: Joi.string().required()
}).required();

export const lookupPublicBookingSchema = Joi.object({
  appointmentCode: Joi.string().trim().uppercase().pattern(/^AICS-[A-Z]{3}-\d{4}-[A-Z0-9]{5}$/).required(),
  cellNumber: Joi.string().trim().pattern(/^09\d{9}$/).required()
}).required();

export const cancelPublicBookingSchema = lookupPublicBookingSchema.append({
  cancellationReason: Joi.string().trim().max(500).allow('').default('')
});
