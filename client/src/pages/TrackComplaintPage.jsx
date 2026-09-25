import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import complaintService from '../services/complaintService';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import { Search, Clock, ArrowRight, ShieldCheck, AlertCircle, MapPin, Building2 } from 'lucide-react';

const TrackComplaintPage = () => {
  const navigate = useNavigate();
  const [complaintId, setComplaintId] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTrack = async (e) => {
    e.preventDefault();
    if (!complaintId.trim()) return;

    try {
      setLoading(true);
      setError('');
      setResult(null);

      // Search complaints by ID or partial ID
      const cleanedId = complaintId.trim().replace(/^#/, '');

      // Try direct ID lookup first if it matches ObjectId format (24 hex)
      if (cleanedId.length === 24) {
        try {
          const directRes = await complaintService.getComplaintById(cleanedId);
          if (directRes.success && directRes.complaint) {
            setResult(directRes.complaint);
            setLoading(false);
            return;
          }
        } catch (e) {
          // ignore, try search
        }
      }

      // Search all complaints
      const searchRes = await complaintService.getComplaints({ search: cleanedId });
      if (searchRes.success && searchRes.complaints && searchRes.complaints.length > 0) {
        setResult(searchRes.complaints[0]);
      } else {
        setError(`No complaint found with Reference ID or keyword "${cleanedId}".`);
      }
    } catch (err) {
      setError(err.message || 'Error tracking complaint.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-10">
        <div className="inline-flex p-3 rounded-2xl bg-blue-100 text-blue-600 mb-3">
          <Clock className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Track Your Civic Complaint
        </h1>
        <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
          Enter your reference complaint ID or keyword to see live progress, department dispatch, and resolution notes.
        </p>
      </div>

      {/* Search Input Box */}
      <form onSubmit={handleTrack} className="bg-white p-3 rounded-2xl border border-slate-200 shadow-md flex items-center gap-2 mb-8">
        <div className="relative flex-1">
          <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            required
            value={complaintId}
            onChange={(e) => setComplaintId(e.target.value)}
            placeholder="Enter Complaint ID (e.g. #7A280, or pothole keyword)..."
            className="w-full pl-11 pr-4 py-3 text-sm focus:outline-none text-slate-800 font-medium"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50"
        >
          {loading ? 'Searching...' : 'Track Status'}
        </button>
      </form>

      {/* Error Message */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 mb-6">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading state */}
      {loading && <LoadingSpinner message="Querying municipal systems..." />}

      {/* Result Card */}
      {result && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4 mb-4">
            <div>
              <span className="font-mono text-xs font-bold text-slate-500">
                #{result._id.slice(-6).toUpperCase()}
              </span>
              <h3 className="text-lg font-bold text-slate-900 mt-0.5">{result.title}</h3>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={result.status} size="md" />
              <PriorityBadge priority={result.priority} size="md" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-600 mb-6">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Department: <b>{result.department}</b></span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
              <span>{result.address || result.ward}</span>
            </div>
          </div>

          {result.resolutionNote && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 mb-6">
              <span className="font-bold">Resolution Note:</span> "{result.resolutionNote}"
            </div>
          )}

          <div className="flex justify-end pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => navigate(`/complaints/${result._id}`)}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow transition-all"
            >
              <span>View Full Resolution Details</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrackComplaintPage;
