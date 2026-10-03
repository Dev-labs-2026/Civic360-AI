import { normalizeDepartment } from './departments.js';

export const DEMO_PERSONAS = Object.freeze({
  citizen: Object.freeze({
    id: 'citizen',
    email: 'citizen.wb@civic360.in',
    role: 'citizen',
  }),
  'pwd-officer': Object.freeze({
    id: 'pwd-officer',
    email: 'officer.roads.wb@civic360.in',
    role: 'officer',
    department: 'PWD / Roads',
  }),
  'sanitation-officer': Object.freeze({
    id: 'sanitation-officer',
    email: 'officer.sanitation.wb@civic360.in',
    role: 'officer',
    department: 'Sanitation',
  }),
  admin: Object.freeze({
    id: 'admin',
    email: 'admin.wb@civic360.in',
    role: 'admin',
  }),
});

export const getDemoPersonaForUser = (user) => {
  if (!user?.email || !user?.role) return null;

  const email = user.email.toLowerCase().trim();
  return Object.values(DEMO_PERSONAS).find((persona) => (
    persona.email === email
    && persona.role === user.role
    && (!persona.department || normalizeDepartment(user.department) === persona.department)
  )) || null;
};
