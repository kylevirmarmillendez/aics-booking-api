import mongoose from 'mongoose';

const officeSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    name: { type: String, required: true, trim: true, maxlength: 160 },
    officeType: { type: String, required: true, enum: ['SWAD', 'Regional Office', 'Satellite Office'] },
    province: { type: String, required: true, trim: true, maxlength: 100 },
    city: { type: String, trim: true, maxlength: 100, default: '' },
    address: { type: String, trim: true, maxlength: 300, default: '' },
    contacts: [{ type: String, trim: true, maxlength: 100 }],
    hours: { type: String, trim: true, maxlength: 150, default: '' },
    serviceArea: { type: String, trim: true, maxlength: 200, default: '' },
    dailyCapacity: { type: Number, min: 1, default: 60 },
    amCapacity: { type: Number, min: 0, default: 30 },
    pmCapacity: { type: Number, min: 0, default: 30 },
    // Kept to read older office records; new capacity settings use separate AM/PM values.
    periodCapacity: { type: Number, min: 1, default: 30 },
    links: [{ label: { type: String, trim: true }, url: { type: String, trim: true } }],
    sourceNote: { type: String, trim: true, maxlength: 500, default: '' },
    active: { type: Boolean, default: true, index: true }
  },
  { timestamps: true }
);

officeSchema.set('toJSON', {
  transform(_document, returnedObject) {
    delete returnedObject.__v;
    return returnedObject;
  }
});

const Office = mongoose.model('Office', officeSchema);
export default Office;