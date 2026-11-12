import Office from '../models/Office.js';

const defaultOffices = [
  {
    slug: 'negros-oriental-swad-main',
    name: 'DSWD Negros Oriental SWAD Office (Main Provincial Office)',
    officeType: 'SWAD',
    province: 'Negros Oriental',
    city: 'Dumaguete City',
    address: '818 Jose Romero Road, Brgy. Talay, Dumaguete City, Negros Oriental',
    contacts: ['035-402-0115', '(035) 225-9887'],
    hours: 'Monday – Friday, 8:00 AM – 5:00 PM',
    sourceNote: 'Details supplied by the user; confirm with DSWD Field Office – Negros Island Region before relying on them.'
  },
  {
    slug: 'dswd-field-office-negros-island-region',
    name: 'DSWD Field Office – Negros Island Region (Regional Office)',
    officeType: 'Regional Office',
    province: 'Negros Oriental',
    city: 'Dumaguete City',
    address: 'MAGOR Building, St. Paul cor. St. Ignatius Sts., Maria Asuncion Village, Brgy. Daro, Dumaguete City, Negros Oriental',
    contacts: ['+63 35 402 1446'],
    links: [{ label: 'DSWD Field Offices Directory', url: 'https://www.dswd.gov.ph/directory-fo/' }],
    sourceNote: 'Details supplied by the user; confirm with DSWD Field Office – Negros Island Region before relying on them.'
  },
  {
    slug: 'bayawan-city-swad-satellite',
    name: 'Bayawan City SWAD Satellite Office',
    officeType: 'Satellite Office',
    province: 'Negros Oriental',
    city: 'Bayawan City',
    serviceArea: 'Southern Negros Oriental',
    links: [{ label: 'DSWD Field Office NIR Facebook Page', url: 'https://www.facebook.com/dswdfonir/' }],
    sourceNote: 'Location and service area supplied by the user; confirm the current address and contact information with DSWD Field Office NIR.'
  },
  {
    slug: 'negros-occidental-swad-satellite',
    name: 'Negros Occidental SWAD Satellite Office',
    officeType: 'Satellite Office',
    province: 'Negros Occidental',
    city: 'Bacolod City',
    address: '888 Chinatown Square Premier, Bacolod City, Negros Occidental',
    sourceNote: 'Details supplied by the user; confirm with DSWD Field Office NIR before relying on them.'
  },
  {
    slug: 'siquijor-swad-satellite',
    name: 'Siquijor SWAD Satellite Office',
    officeType: 'Satellite Office',
    province: 'Siquijor',
    city: 'Larena, Siquijor',
    address: 'Barangay Tacdog, Siquijor / Larena, Siquijor',
    contacts: ['035-480-9261'],
    links: [{ label: 'DSWD Satellite Offices Directory', url: 'https://www.dswd.gov.ph/dswd-directory-satellite-offices/' }],
    sourceNote: 'Details supplied by the user; confirm with DSWD Field Office NIR before relying on them.'
  }
];

export async function seedDefaultOffices() {
  if (await Office.exists({})) return;
  for (const office of defaultOffices) {
    await Office.updateOne(
      { slug: office.slug },
      { $setOnInsert: { dailyCapacity: 60, amCapacity: 30, pmCapacity: 30, periodCapacity: 30, ...office } },
      { upsert: true }
    );
  }
}

export async function migrateLegacyOfficeCapacities() {
  const legacyOffices = await Office.find({ $or: [{ amCapacity: { $exists: false } }, { pmCapacity: { $exists: false } }] });
  for (const office of legacyOffices) {
    const total = office.dailyCapacity || 60;
    const fallbackPeriod = office.periodCapacity ?? Math.floor(total / 2);
    office.dailyCapacity = total;
    office.amCapacity = Math.min(fallbackPeriod, total);
    office.pmCapacity = total - office.amCapacity;
    await office.save();
  }
  return legacyOffices.length;
}

export function getDefaultOffices() {
  return defaultOffices.map((office) => ({
    ...office,
    dailyCapacity: 60,
    amCapacity: 30,
    pmCapacity: 30,
    periodCapacity: 30,
    contacts: [...(office.contacts ?? [])],
    links: [...(office.links ?? [])]
  }));
}