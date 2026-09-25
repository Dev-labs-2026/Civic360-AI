import React, { useState, useEffect } from 'react';
import complaintService from '../services/complaintService';
import ComplaintMap from '../components/ComplaintMap';
import LoadingSpinner from '../components/LoadingSpinner';
import { MapPin, Layers, Plus, Compass } from 'lucide-react';
import { Link } from 'react-router-dom';

const CityMapPage = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllComplaints = async () => {
      try {
        setLoading(true);
        const res = await complaintService.getComplaints({ limit: 200 });
        if (res.success && res.complaints) {
          setComplaints(res.complaints);
        }
      } catch (err) {
        console.error('Failed to load map complaints:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAllComplaints();
  }, []);

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
            Real-time geospatial intelligence of civic grievances, road hazards, and municipal resolutions across Bengaluru.
          </p>
        </div>

        <Link
          to="/report"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Report New Pin</span>
        </Link>
      </div>

      {loading ? (
        <LoadingSpinner message="Loading city infrastructure map..." className="min-h-[60vh]" />
      ) : (
        <ComplaintMap complaints={complaints} height="650px" />
      )}
    </div>
  );
};

export default CityMapPage;
