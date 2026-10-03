import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import complaintService from '../services/complaintService';
import ComplaintCard from '../components/ComplaintCard';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import {
  PlusCircle,
  Clock,
  Wrench,
  CheckCircle2,
  FileText,
  MapPin,
  ArrowRight,
  TrendingUp,
  Sparkles,
} from 'lucide-react';

const CitizenDashboard = () => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [totalCount, setTotalCount] = useState(0);
  const [activeTab, setActiveTab] = useState('All');

  const fetchCitizenData = async () => {
    try {
      setLoading(true);
      setErrorMessage('');
      const res = await complaintService.getComplaints({ my: 'true', limit: 100, page: 1 });
      if (res.success && res.complaints) {
        const allComplaints = [...res.complaints];
        for (let page = 2; page <= (res.totalPages || 1); page += 1) {
          const pageRes = await complaintService.getComplaints({ my: 'true', limit: 100, page });
          if (pageRes.success) allComplaints.push(...pageRes.complaints);
        }
        setComplaints(allComplaints);
        setTotalCount(res.total ?? allComplaints.length);
      }
    } catch (err) {
      console.error('Failed to load citizen complaints:', err);
      setErrorMessage('Unable to load your dashboard. Try again.');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { fetchCitizenData(); }, []);

  // Compute counts
  const total = totalCount;
  const active = complaints.filter((c) => ['Pending', 'Assigned', 'In Progress'].includes(c.status)).length;
  const resolved = complaints.filter((c) => c.status === 'Resolved').length;
  const overdue = complaints.filter((c) => c.slaStatus === 'Overdue').length;
  const escalated = complaints.filter((c) => c.slaStatus === 'Escalated').length;

  const filteredComplaints = complaints.filter((c) => {
    if (activeTab === 'All') return true;
    if (activeTab === 'Active') return ['Pending', 'Assigned', 'In Progress'].includes(c.status);
    if (activeTab === 'Overdue') return c.slaStatus === 'Overdue';
    if (activeTab === 'Escalated') return c.slaStatus === 'Escalated';
    if (activeTab === 'In Progress') return c.status === 'In Progress';
    if (activeTab === 'Resolved') return c.status === 'Resolved';
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Welcome back, {user?.name || 'Citizen'}!
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
              {user?.ward || 'Kolkata • Ward 12'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Track your reported civic complaints and view live municipal resolutions.
          </p>
        </div>

        <Link
          to="/report"
          className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/25 transition-all"
        >
          <PlusCircle className="w-5 h-5" />
          <span>+ Report New Issue</span>
        </Link>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Total Reports */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Reports</p>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">{total}</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Complaints logged</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        {/* Active */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-amber-600">Active</p>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">{active}</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Awaiting or being handled</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Overdue */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-rose-600">Overdue</p>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">{overdue}</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Past expected deadline</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Resolved */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-purple-700">Escalated</p>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">{escalated}</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Sent for further review</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center"><TrendingUp className="w-6 h-6" /></div>
        </div>

        {/* Resolved */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">Resolved</p>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">{resolved}</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Successfully closed</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Complaints Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900">My Registered Complaints</h2>
            <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-full">
              {filteredComplaints.length}
            </span>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {['All', 'Active', 'Overdue', 'Escalated', 'Resolved'].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                  activeTab === tab
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {errorMessage ? (
          <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800 flex flex-wrap items-center justify-between gap-3"><span>{errorMessage}</span><button onClick={fetchCitizenData} className="rounded-lg bg-rose-700 px-4 py-2 text-white font-semibold">Retry</button></div>
        ) : loading ? (
          <LoadingSpinner message="Fetching your complaints..." />
        ) : filteredComplaints.length === 0 ? (
          <EmptyState
            title={activeTab === 'Overdue' ? 'No overdue complaints' : activeTab === 'Active' ? 'No active complaints' : 'No complaints in this view'}
            description="You have no complaints matching this view. Your reports and updates will appear here."
            actionText="Report an Issue Now"
            actionLink="/report"
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredComplaints.map((c) => (
              <ComplaintCard key={c._id} complaint={c} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CitizenDashboard;
