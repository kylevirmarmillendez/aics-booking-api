import { Router } from 'express';
import {
  createAppointment,
  deleteAppointment,
  getAppointmentById,
  getAppointments,
  updateAppointment
} from '../controllers/appointment.controller.js';
import { validate } from '../middleware/validate.js';
import {
  createAppointmentSchema,
  updateAppointmentSchema
} from '../validations/appointment.validation.js';

const router = Router();

router.route('/')
  .post(validate(createAppointmentSchema), createAppointment)
  .get(getAppointments);
router.route('/:id')
  .get(getAppointmentById)
  .put(validate(updateAppointmentSchema), updateAppointment)
  .patch(validate(updateAppointmentSchema), updateAppointment)
  .delete(deleteAppointment);

export default router;
