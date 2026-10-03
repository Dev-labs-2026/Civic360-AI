import React from 'react';

const styles = {
  'On Track': 'bg-emerald-50 text-emerald-800 border-emerald-200',
  'Due Soon': 'bg-amber-50 text-amber-800 border-amber-200',
  Overdue: 'bg-rose-50 text-rose-800 border-rose-200',
  Escalated: 'bg-purple-50 text-purple-800 border-purple-200',
  Resolved: 'bg-slate-100 text-slate-700 border-slate-200',
};

const SlaBadge = ({ status, size = 'sm' }) => {
  if (!status) return null;
  return <span aria-label={`SLA status: ${status}`} className={`inline-flex items-center rounded-full border font-semibold ${styles[status] || styles['On Track']} ${size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'}`}>{status}</span>;
};

export default SlaBadge;
