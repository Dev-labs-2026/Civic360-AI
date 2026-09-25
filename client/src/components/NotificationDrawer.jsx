import React from 'react';
import { useNotifications } from '../context/NotificationContext';
import { Link } from 'react-router-dom';
import { formatRelativeTime } from '../utils/formatters';
import { 
  Bell, 
  X, 
  CheckCheck, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight,
  Info 
} from 'lucide-react';

const NotificationDrawer = ({ isOpen, onClose }) => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, loading } = useNotifications();

  if (!isOpen) return null;

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'status_update':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case 'assignment':
        return <AlertCircle className="w-4 h-4 text-amber-600" />;
      default:
        return <Info className="w-4 h-4 text-blue-600" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-blue-100 text-blue-600">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Notifications</h3>
                <p className="text-xs text-slate-500">
                  {unreadCount > 0 ? `${unreadCount} unread alert${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded-lg hover:bg-blue-50"
                  title="Mark all as read"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Mark all
                </button>
              )}
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* List Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {notifications.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <Bell className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p className="text-sm font-medium text-slate-600">No notifications yet</p>
                <p className="text-xs text-slate-400">You will be alerted when complaints update.</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n._id}
                  onClick={() => !n.read && markAsRead(n._id)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    n.read
                      ? 'bg-white border-slate-100 opacity-80'
                      : 'bg-blue-50/50 border-blue-200 shadow-sm'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-1.5 rounded-lg bg-white shadow-xs mt-0.5">
                      {getNotificationIcon(n.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <h4 className="text-xs font-bold text-slate-800 truncate">{n.title}</h4>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {formatRelativeTime(n.createdAt)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed mb-2">{n.message}</p>

                      {n.complaintId && (
                        <Link
                          to={`/complaints/${n.complaintId?._id || n.complaintId}`}
                          onClick={onClose}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800"
                        >
                          <span>View Complaint Details</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationDrawer;
