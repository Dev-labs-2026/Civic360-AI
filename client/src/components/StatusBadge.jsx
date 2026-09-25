import React from 'react';
import { getStatusConfig } from '../utils/formatters';
import { Clock, UserCheck, Wrench, CheckCircle2, XCircle } from 'lucide-react';

const StatusBadge = ({ status, size = 'md' }) => {
  const config = getStatusConfig(status);

  const getIcon = () => {
    switch (status) {
      case 'Pending':
        return <Clock className="w-3.5 h-3.5 mr-1" />;
      case 'Assigned':
        return <UserCheck className="w-3.5 h-3.5 mr-1" />;
      case 'In Progress':
        return <Wrench className="w-3.5 h-3.5 mr-1 animate-pulse" />;
      case 'Resolved':
        return <CheckCircle2 className="w-3.5 h-3.5 mr-1" />;
      case 'Rejected':
        return <XCircle className="w-3.5 h-3.5 mr-1" />;
      default:
        return <span className={`w-2 h-2 rounded-full ${config.dot} mr-1.5`} />;
    }
  };

  const sizeClasses = size === 'sm' 
    ? 'text-xs px-2 py-0.5' 
    : size === 'lg' 
    ? 'text-sm px-3 py-1 font-semibold' 
    : 'text-xs px-2.5 py-1 font-medium';

  return (
    <span
      className={`inline-flex items-center rounded-full border ${config.bg} ${config.text} ${config.border} ${sizeClasses}`}
    >
      {getIcon()}
      {config.label}
    </span>
  );
};

export default StatusBadge;
