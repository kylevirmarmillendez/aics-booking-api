import Joi from 'joi';

const appointmentFields = {
  appointmentCode: Joi.string().trim().uppercase().min(1),
  typeOfAssistance: Joi.string().trim().min(1),
  fullName: Joi.string().trim().min(1),
  cellNumber: Joi.string().trim().min(1),
  email: Joi.string().trim().lowercase().email(),
  appointmentDateTimeSlot: Joi.date(),
  status: Joi.string().valid('Pending', 'Confirmed', 'Arrived', 'No-show', 'Completed', 'Cancelled'),
  calendarEventId: Joi.string().trim().allow(null),
  cancellationReason: Joi.string().trim().allow(null)
};

export const createAppointmentSchema = Joi.object({
  ...appointmentFields,
  appointmentCode: appointmentFields.appointmentCode.required(),
  typeOfAssistance: appointmentFields.typeOfAssistance.required(),
  fullName: appointmentFields.fullName.required(),
  cellNumber: appointmentFields.cellNumber.required(),
  email: appointmentFields.email.required(),
  appointmentDateTimeSlot: appointmentFields.appointmentDateTimeSlot.required(),
  status: appointmentFields.status.default('Pending'),
  calendarEventId: appointmentFields.calendarEventId.default(null),
  cancellationReason: appointmentFields.cancellationReason.default(null)
}).required();

export const updateAppointmentSchema = Joi.object(appointmentFields)
  .min(1)
  .messages({ 'object.min': 'at least one field must be provided for update' })
  .required();
