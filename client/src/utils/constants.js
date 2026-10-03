import { WARDS } from '../../../shared/wards.mjs';

export const ISSUE_CATEGORIES = [
  'Pothole',
  'Garbage',
  'Broken Streetlight',
  'Water Leakage',
  'Drainage',
  'Road Damage',
  'Other',
];

export const COMPLAINT_STATUSES = [
  'Pending',
  'Assigned',
  'In Progress',
  'Resolved',
  'Rejected',
];

export const PRIORITIES = [
  'Low',
  'Medium',
  'High',
  'Critical',
];

export const DEPARTMENTS = [
  'PWD / Roads',
  'Sanitation',
  'Electrical',
  'Water Department',
  'Drainage Department',
  'General Civic Department',
];

export { WARDS };

// NOTE: All demo accounts below are fictional and intended only for
// demonstration purposes on the Civic360 AI platform.
export const DEMO_ACCOUNTS = [
  {
    id: 'citizen',
    authRole: 'citizen',
    department: 'General Civic Department',
    role: 'Citizen',
    name: 'Soumodeep Maiti',
    desc: 'Report issues, track status & view West Bengal map',
    badge: 'Citizen',
  },
  {
    id: 'pwd-officer',
    authRole: 'officer',
    department: 'PWD / Roads',
    role: 'PWD Officer',
    name: 'Souvik Baidya',
    desc: 'Roads & PWD field officer — West Bengal',
    badge: 'PWD Officer',
  },
  {
    id: 'sanitation-officer',
    authRole: 'officer',
    department: 'Sanitation',
    role: 'Sanitation Officer',
    name: 'Priya Sen',
    desc: 'Sanitation officer — West Bengal',
    badge: 'Sanitation Officer',
  },
  {
    id: 'admin',
    authRole: 'admin',
    department: 'General Civic Department',
    role: 'Admin',
    name: 'Soumodeep Maiti',
    desc: 'Municipal Admin / Executive analytics — West Bengal',
    badge: 'Admin',
  },
];
