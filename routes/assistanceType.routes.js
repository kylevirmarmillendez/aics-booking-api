import { Router } from 'express';
import {
  createAssistanceType,
  deleteAssistanceType,
  getAssistanceTypeById,
  getAssistanceTypes,
  updateAssistanceType
} from '../controllers/assistanceType.controller.js';
import { validate } from '../middleware/validate.js';
import {
  createAssistanceTypeSchema,
  updateAssistanceTypeSchema
} from '../validations/assistanceType.validation.js';

const router = Router();

router.route('/')
  .get(getAssistanceTypes)
  .post(validate(createAssistanceTypeSchema), createAssistanceType);
router.route('/:id')
  .get(getAssistanceTypeById)
  .put(validate(updateAssistanceTypeSchema), updateAssistanceType)
  .delete(deleteAssistanceType);

export default router;