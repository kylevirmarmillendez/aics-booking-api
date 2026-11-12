import AssistanceType from '../models/AssistanceType.js';

const defaultAssistanceTypes = [
  {
    code: 'HOS',
    name: 'Hospital bill',
    codePrefix: 'HOS',
    requirements: [
      'Valid ID of the patient/claimant and, if applicable, the authorized representative.',
      'Current hospital bill or statement of account showing the patient name and outstanding balance.',
      'Medical or clinical abstract signed by the attending physician.',
      'Social Case Study Report or other assessment document, if requested by the DSWD office.'
    ]
  },
  {
    code: 'MED',
    name: 'Medicine',
    codePrefix: 'MED',
    requirements: [
      'Valid ID of the patient/claimant and, if applicable, the authorized representative.',
      'Current prescription signed by the attending physician, with the patient name and prescribed medicines.',
      'Medicine quotation or price estimate from a pharmacy, if available.',
      'Medical or clinical abstract or other proof of diagnosis, if requested by the DSWD office.'
    ]
  },
  {
    code: 'LAB',
    name: 'Laboratory',
    codePrefix: 'LAB',
    requirements: [
      'Valid ID of the patient/claimant and, if applicable, the authorized representative.',
      'Laboratory request signed by the attending physician, identifying the requested tests.',
      'Laboratory cost estimate or quotation, if available.',
      'Medical or clinical abstract or other proof of diagnosis, if requested by the DSWD office.'
    ]
  },
  {
    code: 'BUR',
    name: 'Burial',
    codePrefix: 'BUR',
    requirements: [
      'Valid ID of the claimant and, if applicable, the authorized representative.',
      'Death certificate or an acceptable certification of death.',
      'Funeral contract/agreement or statement of account showing funeral expenses and any unpaid balance.',
      'Social Case Study Report, barangay certification, or transfer permit if requested for the case.'
    ]
  }
];

export async function seedDefaultAssistanceTypes() {
  if (await AssistanceType.exists({})) return;
  for (const assistanceType of defaultAssistanceTypes) {
    await AssistanceType.updateOne(
      { code: assistanceType.code },
      { $setOnInsert: assistanceType },
      { upsert: true }
    );
  }
}

export function getDefaultAssistanceTypes() {
  return defaultAssistanceTypes.map((assistanceType) => ({ ...assistanceType, requirements: [...assistanceType.requirements] }));
}