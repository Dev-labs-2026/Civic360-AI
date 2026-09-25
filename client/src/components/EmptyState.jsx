import React from 'react';
import { Inbox, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

const EmptyState = ({
  icon: Icon = Inbox,
  title = 'No complaints found',
  description = 'There are no complaints matching your criteria at this moment.',
  actionText = 'Report an Issue',
  actionLink = '/report',
  onAction = null,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-slate-200/80 shadow-sm text-center my-6">
      <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="text-lg font-bold text-slate-800 mb-1">{title}</h3>
      <p className="text-sm text-slate-500 max-w-md mb-6">{description}</p>
      {actionText && (
        actionLink ? (
          <Link
            to={actionLink}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition-all shadow-sm hover:shadow"
          >
            <Plus className="w-4 h-4" />
            {actionText}
          </Link>
        ) : onAction ? (
          <button
            onClick={onAction}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition-all shadow-sm hover:shadow"
          >
            <Plus className="w-4 h-4" />
            {actionText}
          </button>
        ) : null
      )}
    </div>
  );
};

export default EmptyState;
