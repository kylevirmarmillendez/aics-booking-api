import mongoose from 'mongoose';

const assistanceTypeSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, trim: true, uppercase: true },
    name: { type: String, required: true, unique: true, trim: true, maxlength: 100 },
    codePrefix: { type: String, required: true, unique: true, trim: true, uppercase: true, maxlength: 3 },
    requirements: [{ type: String, trim: true, maxlength: 500 }],
    active: { type: Boolean, default: true, index: true }
  },
  { timestamps: true }
);

assistanceTypeSchema.set('toJSON', {
  transform(_document, returnedObject) {
    delete returnedObject.__v;
    return returnedObject;
  }
});

const AssistanceType = mongoose.model('AssistanceType', assistanceTypeSchema);
export default AssistanceType;