import React, { useState, useEffect } from 'react';
import complaintService from '../services/complaintService';
import ComplaintMap from '../components/ComplaintMap';
import LoadingSpinner from '../components/LoadingSpinner';
import { MapPin, Layers, Plus, Compass } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import EmptyState from '../components/EmptyState';

const CityMapPage = () => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const fetchAllComplaints = async () => {
    try {
      setLoading(true);
      setErrorMessage('');
      const firstPage = await complaintService.getComplaints({ limit: 100, page: 1 });
      const all = [...(firstPage.complaints || [])];
      for (let page = 2; page <= (firstPage.totalPages || 1); page += 1) {
        const result = await complaintService.getComplaints({ limit: 100, page });
        if (result.success) all.push(...result.complaints);
      }
      setComplaints(all);
    } catch (err) {
      console.error('Failed to load map complaints:', err);
      setErrorMessage('Unable to load complaint locations. Try again.');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { fetchAllComplaints(); }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-md bg-blue-100 text-blue-600">
              <Compass className="w-4 h-4" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Interactive City Civic Map
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Demo civic reports and municipal resolutions across West Bengal.
          </p>
        </div>

        {(!user || user.role === 'citizen') && <Link
          to="/report"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Report New Pin</span>
        </Link>}
      </div>

      {loading ? (
        <LoadingSpinner message="Loading city infrastructure map..." className="min-h-[60vh]" />
      ) : errorMessage ? (
        <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800 flex flex-wrap items-center justify-between gap-3"><span>{errorMessage}</span><button onClick={fetchAllComplaints} className="rounded-lg bg-rose-700 px-4 py-2 text-white font-semibold">Retry</button></div>
      ) : complaints.length === 0 ? (
        <EmptyState title="No complaints to map" description="No public complaint locations are available right now." />
      ) : (
        <ComplaintMap complaints={complaints} height="650px" />
      )}
    </div>
  );
};

export default CityMapPage;
