import Joi from 'joi';

const officeFields = {
  slug: Joi.string().trim().lowercase().min(3).max(100).pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  name: Joi.string().trim().min(2).max(160),
  officeType: Joi.string().valid('SWAD', 'Regional Office', 'Satellite Office'),
  province: Joi.string().trim().min(2).max(100),
  city: Joi.string().trim().max(100).allow(''),
  address: Joi.string().trim().max(300).allow(''),
  contacts: Joi.array().items(Joi.string().trim().max(100)).max(10),
  hours: Joi.string().trim().max(150).allow(''),
  serviceArea: Joi.string().trim().max(200).allow(''),
  dailyCapacity: Joi.number().integer().min(1).max(10000),
  amCapacity: Joi.number().integer().min(0).max(10000),
  pmCapacity: Joi.number().integer().min(0).max(10000),
  links: Joi.array().items(Joi.object({
    label: Joi.string().trim().max(100).required(),
    url: Joi.string().uri({ scheme: ['http', 'https'] }).max(500).required()
  })).max(10),
  sourceNote: Joi.string().trim().max(500).allow(''),
  active: Joi.boolean()
};

export const createOfficeSchema = Joi.object({
  ...officeFields,
  slug: officeFields.slug.required(),
  name: officeFields.name.required(),
  officeType: officeFields.officeType.required(),
  province: officeFields.province.required(),
  dailyCapacity: officeFields.dailyCapacity.required(),
  amCapacity: officeFields.amCapacity.required(),
  pmCapacity: officeFields.pmCapacity.required()
}).custom((office, helpers) => {
  if (office.amCapacity + office.pmCapacity !== office.dailyCapacity) {
    return helpers.error('any.invalid', { message: 'AM and PM capacities must add up to the daily capacity.' });
  }
  return office;
}).messages({ 'any.invalid': 'AM and PM capacities must add up to the daily capacity.' }).required();

const { slug: _slug, ...updatableOfficeFields } = officeFields;

export const updateOfficeSchema = Joi.object(updatableOfficeFields)
  .min(1)
  .messages({ 'object.min': 'at least one field must be provided for update' })
  .required();