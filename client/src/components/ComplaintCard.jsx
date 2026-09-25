import React from 'react';
import { Link } from 'react-router-dom';
import StatusBadge from './StatusBadge';
import PriorityBadge from './PriorityBadge';
import { formatRelativeTime } from '../utils/formatters';
import { 
  MapPin, 
  Building2, 
  Calendar, 
  Sparkles, 
  ArrowRight,
  ShieldCheck,
  AlertOctagon,
  Trash2,
  Lightbulb,
  Droplet,
  Waves,
  Hammer
} from 'lucide-react';

const getCategoryIcon = (category) => {
  switch (category) {
    case 'Pothole':
      return <AlertOctagon className="w-4 h-4 text-orange-600" />;
    case 'Garbage':
      return <Trash2 className="w-4 h-4 text-emerald-600" />;
    case 'Broken Streetlight':
      return <Lightbulb className="w-4 h-4 text-amber-500" />;
    case 'Water Leakage':
      return <Droplet className="w-4 h-4 text-sky-600" />;
    case 'Drainage':
      return <Waves className="w-4 h-4 text-teal-600" />;
    case 'Road Damage':
      return <Hammer className="w-4 h-4 text-rose-600" />;
    default:
      return <Building2 className="w-4 h-4 text-slate-500" />;
  }
};

const ComplaintCard = ({ complaint }) => {
  if (!complaint) return null;

  const shortId = complaint._id?.toString().slice(-6).toUpperCase() || 'NEW';

  return (
    <div className="group bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between">
      <div>
        {/* Image preview banner if exists */}
        {complaint.image && (
          <div className="relative h-44 w-full bg-slate-100 overflow-hidden">
            <img
              src={complaint.image}
              alt={complaint.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
            <div className="absolute top-3 left-3 flex gap-2">
              <span className="px-2.5 py-1 bg-white/90 backdrop-blur text-xs font-semibold text-slate-800 rounded-lg shadow-sm flex items-center gap-1.5">
                {getCategoryIcon(complaint.category)}
                {complaint.category}
              </span>
            </div>
            <div className="absolute top-3 right-3">
              <PriorityBadge priority={complaint.priority} size="sm" />
            </div>
          </div>
        )}

        <div className="p-5">
          {/* Top header if no image */}
          {!complaint.image && (
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-xs font-semibold text-slate-700">
                {getCategoryIcon(complaint.category)}
                {complaint.category}
              </span>
              <PriorityBadge priority={complaint.priority} size="sm" />
            </div>
          )}

          {/* ID and Relative Time */}
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-mono font-medium text-slate-500">#{shortId}</span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {formatRelativeTime(complaint.createdAt)}
            </span>
          </div>

          {/* Title */}
          <h4 className="text-base font-bold text-slate-800 line-clamp-2 mb-2 group-hover:text-blue-600 transition-colors">
            {complaint.title}
          </h4>

          {/* Description snippet */}
          <p className="text-xs text-slate-500 line-clamp-2 mb-4 leading-relaxed">
            {complaint.description}
          </p>

          {/* Location & Department */}
          <div className="space-y-1.5 text-xs text-slate-600 mb-4 border-t border-slate-100 pt-3">
            <div className="flex items-center gap-1.5 truncate">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{complaint.address || complaint.ward || 'Bengaluru, India'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="font-medium text-slate-700">{complaint.department || 'General Municipal'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Card Footer */}
      <div className="px-5 pb-5 pt-0 flex items-center justify-between border-t border-slate-100 mt-2 pt-3">
        <StatusBadge status={complaint.status} size="sm" />

        <Link
          to={`/complaints/${complaint._id}`}
          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors group/btn"
        >
          <span>View Details</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </div>
  );
};

export default ComplaintCard;
