/**
 * Date and status formatting utilities
 */

export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

export const formatRelativeTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return formatDate(dateString);
};

export const getStatusConfig = (status) => {
  switch (status) {
    case 'Pending':
      return {
        label: 'Pending',
        bg: 'bg-amber-50',
        text: 'text-amber-700',
        border: 'border-amber-200',
        dot: 'bg-amber-500',
        stepIndex: 0,
      };
    case 'Assigned':
      return {
        label: 'Assigned',
        bg: 'bg-blue-50',
        text: 'text-blue-700',
        border: 'border-blue-200',
        dot: 'bg-blue-500',
        stepIndex: 1,
      };
    case 'In Progress':
      return {
        label: 'In Progress',
        bg: 'bg-indigo-50',
        text: 'text-indigo-700',
        border: 'border-indigo-200',
        dot: 'bg-indigo-500',
        stepIndex: 2,
      };
    case 'Resolved':
      return {
        label: 'Resolved',
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        border: 'border-emerald-200',
        dot: 'bg-emerald-500',
        stepIndex: 3,
      };
    case 'Rejected':
      return {
        label: 'Rejected',
        bg: 'bg-rose-50',
        text: 'text-rose-700',
        border: 'border-rose-200',
        dot: 'bg-rose-500',
        stepIndex: -1,
      };
    default:
      return {
        label: status || 'Unknown',
        bg: 'bg-slate-50',
        text: 'text-slate-700',
        border: 'border-slate-200',
        dot: 'bg-slate-500',
        stepIndex: 0,
      };
  }
};

export const getPriorityConfig = (priority) => {
  switch (priority) {
    case 'Critical':
      return {
        label: 'Critical',
        bg: 'bg-red-500',
        text: 'text-white',
        border: 'border-red-600',
        badgeLight: 'bg-red-100 text-red-800 border-red-200',
      };
    case 'High':
      return {
        label: 'High',
        bg: 'bg-orange-500',
        text: 'text-white',
        border: 'border-orange-600',
        badgeLight: 'bg-orange-100 text-orange-800 border-orange-200',
      };
    case 'Medium':
      return {
        label: 'Medium',
        bg: 'bg-amber-400',
        text: 'text-slate-900',
        border: 'border-amber-500',
        badgeLight: 'bg-amber-100 text-amber-800 border-amber-200',
      };
    case 'Low':
      return {
        label: 'Low',
        bg: 'bg-blue-400',
        text: 'text-white',
        border: 'border-blue-500',
        badgeLight: 'bg-blue-100 text-blue-800 border-blue-200',
      };
    default:
      return {
        label: priority || 'Normal',
        bg: 'bg-slate-400',
        text: 'text-white',
        border: 'border-slate-500',
        badgeLight: 'bg-slate-100 text-slate-800 border-slate-200',
      };
  }
};
