import Joi from 'joi';

const name = Joi.string().trim().min(1).max(50);
const email = Joi.string().trim().lowercase().email().max(254);
const username = Joi.string()
  .trim()
  .lowercase()
  .min(3)
  .max(30)
  .pattern(/^[a-z0-9]+$/)
  .messages({
    'string.pattern.base': 'username must contain only letters and numbers'
  });
const password = Joi.string()
  .min(8)
  .max(128)
  .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/)
  .messages({
    'string.pattern.base': 'password must contain at least one uppercase letter, one lowercase letter, and one number'
  });
const optionalText = Joi.string().trim().max(100).allow('');

const userFields = {
  fname: name,
  mname: name.allow('', null),
  lname: name,
  email,
  username,
  phone: Joi.string().trim().max(30).allow(''),
  office: optionalText,
  region: optionalText,
  password,
  role: Joi.string().valid('super_admin', 'admin', 'booking_officer', 'congressional_officer'),
  status: Joi.string().valid('Active', 'Inactive', 'Pending')
};

export const createUserSchema = Joi.object({
  ...userFields,
  fname: userFields.fname.required(),
  lname: userFields.lname.required(),
  email: userFields.email.required(),
  username: userFields.username.required(),
  password: userFields.password.required(),
  role: userFields.role.default('booking_officer'),
  status: userFields.status.default('Active')
}).required();

export const updateUserSchema = Joi.object(userFields)
  .min(1)
  .messages({ 'object.min': 'at least one field must be provided for update' })
  .required();
