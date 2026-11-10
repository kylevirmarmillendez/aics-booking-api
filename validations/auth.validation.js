import Joi from 'joi';

const password = Joi.string()
  .min(8)
  .max(128)
  .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/)
  .messages({
    'string.pattern.base': 'password must contain an uppercase letter, a lowercase letter, and a number'
  });

export const registerSchema = Joi.object({
  fname: Joi.string().trim().min(1).max(50).required(),
  mname: Joi.string().trim().max(50).allow('', null),
  lname: Joi.string().trim().min(1).max(50).required(),
  email: Joi.string().trim().lowercase().email().max(254).required(),
  username: Joi.string().trim().lowercase().min(3).max(30).pattern(/^[a-z0-9]+$/).required(),
  password: password.required()
}).required();

export const loginSchema = Joi.object({
  login: Joi.string().trim().min(1).max(254).required(),
  password: Joi.string().min(1).max(128).required()
}).required();
