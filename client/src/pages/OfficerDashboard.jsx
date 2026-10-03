import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import complaintService from '../services/complaintService';
import ComplaintCard from '../components/ComplaintCard';
import ComplaintMap from '../components/ComplaintMap';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import { formatDate } from '../utils/formatters';
import { ISSUE_CATEGORIES, COMPLAINT_STATUSES, PRIORITIES } from '../utils/constants';
import {
  Briefcase,
  AlertOctagon,
  Clock,
  Wrench,
  CheckCircle2,
  MapPin,
  Filter,
  ArrowRight,
  Map as MapIcon,
  ListFilter,
  ShieldCheck,
  Building2,
  Calendar,
} from 'lucide-react';

const OfficerDashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'map'
  const [scope, setScope] = useState('assigned'); // 'assigned' | 'department'
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [slaStatusFilter, setSlaStatusFilter] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      // Fetch stats
      const dashRes = await complaintService.getOfficerDashboard();
      if (dashRes.success) {
        setDashboardData(dashRes.data);
      }

      // Fetch complaints based on scope
      const params = {
        status: statusFilter,
        category: categoryFilter,
        priority: priorityFilter,
        slaStatus: slaStatusFilter,
      };

      if (scope === 'assigned') {
        params.assignedToMe = 'true';
      } else {
        params.department = user?.department || 'General Civic Department';
      }

      const compRes = await complaintService.getComplaints(params);
      if (compRes.success && compRes.complaints) {
        setComplaints(compRes.complaints);
      }
    } catch (err) {
      console.error('Failed to load officer dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [scope, statusFilter, categoryFilter, priorityFilter, slaStatusFilter]);

  const pStats = dashboardData?.personal || {
    total: 0,
    workload: 0,
    pending: 0,
    inProgress: 0,
    resolved: 0,
    critical: 0,
  };

  const dStats = dashboardData?.department || {
    name: user?.department || 'General Civic Department',
    total: 0,
    unassigned: 0,
    pending: 0,
    resolved: 0,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Officer Header */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-bold uppercase tracking-wider">
              Field Officer Workspace
            </span>
            <span className="text-xs font-semibold text-slate-500">•</span>
            <span className="text-xs font-bold text-slate-700">{user?.department || 'PWD / Roads'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            Officer {user?.name}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Ward Jurisdiction: <span className="font-semibold text-slate-700">{user?.ward || 'Kolkata • Ward 12'}</span>
          </p>
        </div>

        {/* Scope Toggle: Assigned to Me vs Entire Department */}
        <div className="flex items-center bg-slate-100 p-1 rounded-2xl self-start md:self-auto border border-slate-200 text-xs">
          <button
            type="button"
            onClick={() => setScope('assigned')}
            className={`px-4 py-2 rounded-xl font-bold transition-all ${
              scope === 'assigned'
                ? 'bg-white shadow text-blue-600'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Assigned to Me ({pStats.total})
          </button>
          <button
            type="button"
            onClick={() => setScope('department')}
            className={`px-4 py-2 rounded-xl font-bold transition-all ${
              scope === 'department'
                ? 'bg-white shadow text-blue-600'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Department Pool ({dStats.total}) · {dStats.unassigned} unassigned
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Assigned</p>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">{pStats.total}</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">{pStats.workload} active workload</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Briefcase className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-amber-600">Pending</p>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">{pStats.pending}</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Awaiting start</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">In Progress</p>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">{pStats.inProgress}</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Under execution</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Wrench className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">Resolved</p>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">{pStats.resolved}</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Completed</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter and View Mode Switcher */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">All Statuses</option>
            {COMPLAINT_STATUSES.map((st) => (
              <option key={st} value={st}>{st}</option>
            ))}
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">All Categories</option>
            {ISSUE_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">All Priorities</option>
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>{p} Priority</option>
            ))}
          </select>

          <select value={slaStatusFilter} onChange={(e) => setSlaStatusFilter(e.target.value)} className="px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white">
            <option value="">All SLA states</option>
            {['On Track', 'Due Soon', 'Overdue', 'Escalated', 'Resolved'].map((state) => <option key={state} value={state}>{state}</option>)}
          </select>

          {(statusFilter || categoryFilter || priorityFilter || slaStatusFilter) && (
            <button
              onClick={() => {
                setStatusFilter('');
                setCategoryFilter('');
                setPriorityFilter('');
                setSlaStatusFilter('');
              }}
              className="px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200"
            >
              Reset
            </button>
          )}
        </div>

        {/* View mode toggle: List vs Map */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
              viewMode === 'list'
                ? 'bg-white shadow text-blue-600'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ListFilter className="w-3.5 h-3.5" />
            <span>List View</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('map')}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
              viewMode === 'map'
                ? 'bg-white shadow text-blue-600'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MapIcon className="w-3.5 h-3.5" />
            <span>Map View</span>
          </button>
        </div>
      </div>

      {/* Main Content Area: List or Map */}
      {loading ? (
        <LoadingSpinner message="Loading complaints..." />
      ) : complaints.length === 0 ? (
        <EmptyState
          title="No complaints in this queue"
          description="There are currently no active complaints matching your filter."
        />
      ) : viewMode === 'map' ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-sm">
              Jurisdiction Map: {complaints.length} issues pinned
            </h3>
          </div>
          <ComplaintMap complaints={complaints} height="560px" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {complaints.map((c) => (
            <ComplaintCard key={c._id} complaint={c} />
          ))}
        </div>
      )}
    </div>
  );
};

export default OfficerDashboard;
