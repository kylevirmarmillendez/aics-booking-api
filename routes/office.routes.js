import { Router } from 'express';
import {
  createOffice,
  deleteOffice,
  getOfficeById,
  getOffices,
  updateOffice
} from '../controllers/office.controller.js';
import { validate } from '../middleware/validate.js';
import { createOfficeSchema, updateOfficeSchema } from '../validations/office.validation.js';

const router = Router();

router.route('/')
  .get(getOffices)
  .post(validate(createOfficeSchema), createOffice);
router.route('/:id')
  .get(getOfficeById)
  .put(validate(updateOfficeSchema), updateOffice)
  .delete(deleteOffice);

export default router;