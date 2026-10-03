export const DEPARTMENT_NAMES = Object.freeze([
  'PWD / Roads',
  'Sanitation',
  'Electrical',
  'Water Department',
  'Drainage Department',
  'General Civic Department',
]);

export const CATEGORY_DEPARTMENTS = Object.freeze({
  Pothole: 'PWD / Roads',
  'Road Damage': 'PWD / Roads',
  Garbage: 'Sanitation',
  'Broken Streetlight': 'Electrical',
  'Water Leakage': 'Water Department',
  Drainage: 'Drainage Department',
  Other: 'General Civic Department',
});

const LEGACY_DEPARTMENT_NAMES = Object.freeze({
  'Roads/PWD': 'PWD / Roads',
  'Roads / PWD': 'PWD / Roads',
  'Municipal Sanitation': 'Sanitation',
  'Water Supply': 'Water Department',
  'Drainage & Sewage': 'Drainage Department',
  General: 'General Civic Department',
});

export const normalizeDepartment = (department) =>
  typeof department === 'string'
    ? LEGACY_DEPARTMENT_NAMES[department] || department
    : department;

export const departmentQueryValues = (department) => {
  const canonical = normalizeDepartment(department);
  if (!canonical) return [];

  return [
    canonical,
    ...Object.entries(LEGACY_DEPARTMENT_NAMES)
      .filter(([, preferredName]) => preferredName === canonical)
      .map(([legacyName]) => legacyName),
  ];
};
