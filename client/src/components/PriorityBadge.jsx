import React from 'react';
import { getPriorityConfig } from '../utils/formatters';
import { AlertCircle, AlertTriangle, Info, Flame } from 'lucide-react';

const PriorityBadge = ({ priority, size = 'md' }) => {
  const config = getPriorityConfig(priority);

  const getIcon = () => {
    switch (priority) {
      case 'Critical':
        return <Flame className="w-3.5 h-3.5 mr-1 text-red-600 animate-bounce" />;
      case 'High':
        return <AlertTriangle className="w-3.5 h-3.5 mr-1 text-orange-600" />;
      case 'Medium':
        return <AlertCircle className="w-3.5 h-3.5 mr-1 text-amber-600" />;
      case 'Low':
        return <Info className="w-3.5 h-3.5 mr-1 text-blue-600" />;
      default:
        return null;
    }
  };

  const sizeClasses = size === 'sm' 
    ? 'text-[11px] px-2 py-0.5' 
    : size === 'lg' 
    ? 'text-sm px-3 py-1 font-semibold' 
    : 'text-xs px-2.5 py-0.5 font-medium';

  return (
    <span
      className={`inline-flex items-center rounded-md border ${config.badgeLight} ${sizeClasses}`}
    >
      {getIcon()}
      {config.label}
    </span>
  );
};

export default PriorityBadge;
