import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingSpinner = ({ message = 'Loading...', size = 'md', className = '' }) => {
  const spinnerSize = size === 'sm' ? 'w-5 h-5' : size === 'lg' ? 'w-10 h-10' : 'w-7 h-7';

  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center text-slate-500 ${className}`}>
      <Loader2 className={`${spinnerSize} animate-spin text-blue-600 mb-3`} />
      {message && <p className="text-sm font-medium text-slate-600">{message}</p>}
    </div>
  );
};

export default LoadingSpinner;
