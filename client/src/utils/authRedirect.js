export const getRoleDashboardPath = (role) => {
  if (role === 'admin') return '/admin';
  if (role === 'officer') return '/officer';
  return '/dashboard';
};
