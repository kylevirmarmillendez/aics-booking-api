import { Router } from 'express';
import {
  createUser,
  deleteUser,
  getUserById,
  getUsers,
  updateUser
} from '../controllers/user.controller.js';
import { validate } from '../middleware/validate.js';
import { createUserSchema, updateUserSchema } from '../validations/user.validation.js';

const router = Router();

router.route('/').post(validate(createUserSchema), createUser).get(getUsers);
router
  .route('/:id')
  .get(getUserById)
  .put(validate(updateUserSchema), updateUser)
  .delete(deleteUser);

export default router;
