import Joi from 'joi';

const assistanceTypeFields = {
  code: Joi.string().trim().uppercase().min(2).max(10).pattern(/^[A-Z0-9]+$/),
  name: Joi.string().trim().min(2).max(100),
  codePrefix: Joi.string().trim().uppercase().length(3).pattern(/^[A-Z0-9]+$/),
  requirements: Joi.array().items(Joi.string().trim().min(1).max(500)).max(30),
  active: Joi.boolean()
};

export const createAssistanceTypeSchema = Joi.object({
  ...assistanceTypeFields,
  code: assistanceTypeFields.code.required(),
  name: assistanceTypeFields.name.required(),
  codePrefix: assistanceTypeFields.codePrefix.required(),
  requirements: assistanceTypeFields.requirements.default([]),
  active: assistanceTypeFields.active.default(true)
}).required();

const { code: _code, codePrefix: _codePrefix, ...updatableFields } = assistanceTypeFields;

export const updateAssistanceTypeSchema = Joi.object(updatableFields)
  .min(1)
  .messages({ 'object.min': 'at least one field must be provided for update' })
  .required();