import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import complaintService from '../services/complaintService';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import SlaBadge from '../components/SlaBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatDate } from '../utils/formatters';
import { DEPARTMENTS, WARDS } from '../utils/constants';

// Chart.js imports
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';

import {
  ShieldAlert,
  Users,
  CheckCircle2,
  Clock,
  Flame,
  Building2,
  TrendingUp,
  MapPin,
  ExternalLink,
  Edit,
  UserCheck,
  FileSpreadsheet,
  AlertTriangle,
} from 'lucide-react';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
);

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [users, setUsers] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'complaints' | 'users'
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  // User edit state
  const [selectedUser, setSelectedUser] = useState(null);
  const [newRole, setNewRole] = useState('officer');
  const [newDept, setNewDept] = useState('PWD / Roads');
  const [userUpdating, setUserUpdating] = useState(false);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      setErrorMessage('');
      const [dashRes, usersRes, compRes] = await Promise.all([
        complaintService.getAdminDashboard(),
        complaintService.getAdminUsers(),
        complaintService.getComplaints({ limit: 100 }),
      ]);

      if (dashRes.success) setData(dashRes.data);
      if (usersRes.success) setUsers(usersRes.users || []);
      if (compRes.success) setComplaints(compRes.complaints || []);
    } catch (err) {
      console.error('Admin data fetch error:', err);
      setErrorMessage('Unable to load dashboard data. Try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleUpdateUserRole = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    try {
      setUserUpdating(true);
      const res = await complaintService.updateAdminUser(selectedUser._id, {
        role: newRole,
        department: newDept,
      });
      if (res.success) {
        setUsers(users.map((u) => (u._id === selectedUser._id ? res.user : u)));
        setSelectedUser(null);
        alert('User role and department updated successfully.');
      }
    } catch (err) {
      alert(`Failed to update user: ${err.message}`);
    } finally {
      setUserUpdating(false);
    }
  };

  if (loading) return <LoadingSpinner message="Generating municipal analytics..." className="min-h-[60vh]" />;

  const summary = data?.summary || {
    totalComplaints: 0,
    resolvedComplaints: 0,
    pendingComplaints: 0,
    criticalComplaints: 0,
    resolutionRate: 0,
    totalOfficers: 0,
    totalCitizens: 0,
  };

  // Chart Data: Category Distribution (Doughnut)
  const categoryLabels = (data?.categoryStats || []).map((c) => c._id);
  const categoryCounts = (data?.categoryStats || []).map((c) => c.count);
  const categoryChartData = {
    labels: categoryLabels,
    datasets: [
      {
        data: categoryCounts,
        backgroundColor: [
          '#ef4444', // Pothole / red
          '#10b981', // Garbage / green
          '#f59e0b', // Streetlight / amber
          '#0284c7', // Water / sky
          '#0d9488', // Drainage / teal
          '#6366f1', // Road Damage / indigo
          '#94a3b8', // Other
        ],
        borderWidth: 2,
        borderColor: '#ffffff',
      },
    ],
  };

  // Chart Data: Department Status Breakdown (Bar)
  const deptLabels = (data?.departmentStats || []).map((d) => d._id);
  const deptResolvedCounts = (data?.departmentStats || []).map((d) => d.resolved);
  const deptPendingCounts = (data?.departmentStats || []).map((d) => d.pending);
  const departmentChartData = {
    labels: deptLabels,
    datasets: [
      {
        label: 'Resolved',
        data: deptResolvedCounts,
        backgroundColor: '#10b981',
        borderRadius: 8,
      },
      {
        label: 'Pending / In Progress',
        data: deptPendingCounts,
        backgroundColor: '#f59e0b',
        borderRadius: 8,
      },
    ],
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Banner */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 text-xs font-bold uppercase tracking-wider">
              Executive Command Center
            </span>
            <span className="text-xs text-slate-400">• Municipal Analytics & Governance</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            City Civic Operations Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Real-time multi-department surveillance, ward statistics, and officer dispatch telemetry.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeTab === 'overview'
                ? 'bg-white shadow text-blue-600 font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Analytics Overview
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('complaints')}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeTab === 'complaints'
                ? 'bg-white shadow text-blue-600 font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Master Complaints ({complaints.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeTab === 'users'
                ? 'bg-white shadow text-blue-600 font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Personnel Management ({users.length})
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      {errorMessage && <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 flex flex-wrap items-center justify-between gap-3"><span>{errorMessage}</span><button onClick={fetchAdminData} className="rounded-lg bg-rose-700 px-4 py-2 text-white font-semibold">Retry</button></div>}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {/* Total Complaints */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Logged</p>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
              {summary.totalComplaints}
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Across all wards</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {[['Pending', summary.pendingComplaints, 'text-amber-700', 'bg-amber-50'], ['In Progress', summary.inProgressComplaints, 'text-indigo-700', 'bg-indigo-50'], ['Overdue', data?.slaStats?.overdue, 'text-rose-700', 'bg-rose-50'], ['Escalated', data?.slaStats?.escalated, 'text-purple-700', 'bg-purple-50']].map(([label, value, textColor, bgColor]) => <div key={label} className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between"><div><p className={`text-xs font-bold uppercase tracking-wider ${textColor}`}>{label}</p><h3 className={`text-2xl font-black mt-1 ${textColor}`}>{value ?? 0}</h3></div><div className={`w-10 h-10 rounded-xl ${bgColor}`} /></div>)}

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs"><p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Resolved</p><h3 className="text-2xl font-black text-emerald-700 mt-1">{summary.resolvedComplaints}</h3></div>

        {/* Resolution Rate */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">Resolution Rate</p>
            <h3 className="text-2xl sm:text-3xl font-black text-emerald-600 mt-1">
              {summary.resolutionRate}%
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">{summary.resolvedComplaints} issues resolved</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Critical Issues */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-rose-600">Critical Issues</p>
            <h3 className="text-2xl sm:text-3xl font-black text-rose-600 mt-1">
              {summary.criticalComplaints}
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Immediate attention</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <Flame className="w-6 h-6" />
          </div>
        </div>

        {/* Active Officers */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-purple-600">Field Officers</p>
            <h3 className="text-2xl sm:text-3xl font-black text-purple-600 mt-1">
              {summary.totalOfficers}
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">{summary.totalCitizens} registered citizens</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Lifecycle Status Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 bg-amber-50/80 border border-amber-200/80 rounded-2xl flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span className="text-xs font-bold text-slate-700">Pending Review</span>
          </div>
          <span className="font-mono font-extrabold text-amber-800 text-sm">{summary.pendingComplaints || 0}</span>
        </div>
        <div className="p-3.5 bg-blue-50/80 border border-blue-200/80 rounded-2xl flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            <span className="text-xs font-bold text-slate-700">Assigned</span>
          </div>
          <span className="font-mono font-extrabold text-blue-800 text-sm">{summary.assignedComplaints || 0}</span>
        </div>
        <div className="p-3.5 bg-indigo-50/80 border border-indigo-200/80 rounded-2xl flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
            <span className="text-xs font-bold text-slate-700">In Progress</span>
          </div>
          <span className="font-mono font-extrabold text-indigo-800 text-sm">{summary.inProgressComplaints || 0}</span>
        </div>
        <div className="p-3.5 bg-emerald-50/80 border border-emerald-200/80 rounded-2xl flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-xs font-bold text-slate-700">Resolved</span>
          </div>
          <span className="font-mono font-extrabold text-emerald-800 text-sm">{summary.resolvedComplaints || 0}</span>
        </div>
      </div>

      {/* Tab 1: Analytics Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          <section className="bg-white p-5 rounded-2xl border border-indigo-200 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <div><h3 className="text-sm font-bold text-slate-900">Application SLA overview</h3><p className="text-[11px] text-slate-500">Configured demo targets and live deadline performance</p></div>
              <span className="text-xs font-bold text-indigo-700">On-time resolution: {data?.slaStats?.onTimeResolutionRate ?? 0}%</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {[['On Track', 'onTrack', 'text-emerald-700'], ['Due Soon', 'dueSoon', 'text-amber-700'], ['Overdue', 'overdue', 'text-rose-700'], ['Escalated', 'escalated', 'text-purple-700'], ['Resolved', 'resolved', 'text-slate-700']].map(([label, key, color]) => <div key={key} className="rounded-xl bg-slate-50 p-3"><p className="text-[11px] text-slate-500">{label}</p><p className={`text-xl font-black ${color}`}>{data?.slaStats?.[key] ?? 0}</p></div>)}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
              {[['Overdue complaints', data?.overdueComplaints || []], ['Escalated complaints', data?.escalatedComplaints || []]].map(([label, items]) => <div key={label} className="rounded-xl border border-slate-200 p-3"><h4 className="text-xs font-bold text-slate-800 mb-2">{label}</h4>{items.length ? items.slice(0, 5).map((item) => <Link key={item._id} to={`/complaints/${item._id}`} className="flex justify-between gap-2 py-1.5 border-t border-slate-100 text-[11px] text-slate-700"><span className="truncate">CIV-{String(item._id).slice(-6).toUpperCase()} · {item.title}</span><span className="font-semibold">{item.slaStatus}</span></Link>) : <p className="text-[11px] text-slate-500">No {label.toLowerCase()}.</p>}</div>)}
            </div>
          </section>
          <section className="bg-white p-5 rounded-2xl border border-amber-200 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div><h3 className="text-sm font-bold text-slate-900">Possible duplicate reports</h3><p className="text-[11px] text-slate-500">Citizens confirmed these were separate issues after a rule-based match</p></div>
              <span className="text-xl font-black text-amber-800">{summary.duplicateRelatedComplaints || 0}</span>
            </div>
            {(data?.duplicateByWard || []).length > 0 && <p className="text-xs text-slate-600 mb-3">Repeated wards: {data.duplicateByWard.map((item) => `${item._id} (${item.count})`).join(' · ')}</p>}
            {(data?.duplicateComplaints || []).length > 0 ? <div className="space-y-2">{data.duplicateComplaints.slice(0, 5).map((item) => <div key={item._id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-amber-50/70 p-3 text-xs"><span><b>CIV-{String(item._id).slice(-6).toUpperCase()}</b> · {item.category} · {item.status}</span><Link className="font-bold text-amber-800 underline" to={`/complaints/${item._id}`}>Inspect related report</Link></div>)}</div> : <p className="text-xs text-slate-500">No citizen-confirmed possible duplicate reports yet.</p>}
          </section>
          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Doughnut Chart */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 mb-1">
                  Complaints by Category
                </h3>
                <p className="text-xs text-slate-500 mb-4">
                  Distribution of civic infrastructure pain points
                </p>
              </div>
              <div className="h-64 flex items-center justify-center">
                <Doughnut
                  data={categoryChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { position: 'bottom' } },
                  }}
                />
              </div>
            </div>

            {/* Department Performance Bar Chart */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 mb-1">
                  Department Workload & Resolutions
                </h3>
                <p className="text-xs text-slate-500 mb-4">
                  Comparison between resolved and ongoing tasks by municipal division
                </p>
              </div>
              <div className="h-64">
                <Bar
                  data={departmentChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      x: { stacked: true },
                      y: { stacked: true },
                    },
                    plugins: { legend: { position: 'bottom' } },
                  }}
                />
              </div>
            </div>
          </div>

          <section className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900">Resolution trend</h3>
            <p className="text-xs text-slate-500 mb-4">Resolved complaints by the date of the latest recorded resolution event</p>
            {data?.resolutionTrend?.length ? <div className="space-y-2">{data.resolutionTrend.map((month) => {
              const maximum = Math.max(...data.resolutionTrend.map((entry) => entry.count), 1);
              return <div key={month._id} className="grid grid-cols-[4.5rem_1fr_2rem] items-center gap-3 text-xs"><span className="text-slate-600">{month._id}</span><div className="h-3 rounded-full bg-slate-100 overflow-hidden"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${(month.count / maximum) * 100}%` }} /></div><b className="text-slate-800">{month.count}</b></div>;
            })}</div> : <p className="text-xs text-slate-500">No resolution events were recorded in the last six months.</p>}
          </section>

          <section className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900">Priority distribution</h3>
            <p className="text-xs text-slate-500 mb-4">Complaint counts by stored priority</p>
            {(data?.priorityStats || []).length ? <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">{data.priorityStats.map((item) => <div key={item._id} className="rounded-xl bg-slate-50 p-3"><p className="text-xs font-semibold text-slate-600">{item._id}</p><p className="text-xl font-black text-slate-900">{item.count}</p></div>)}</div> : <p className="text-xs text-slate-500">No priority data is available.</p>}
          </section>

          {/* Ward-wise Statistics Table */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-600" />
              Ward-wise Civic Density Statistics
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Highest incident areas requiring infrastructural attention
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {(data?.wardStats || []).map((w) => (
                <div key={w._id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-800 truncate">{w._id}</h4>
                    <span className="px-2 py-0.5 rounded-full text-xs font-black bg-blue-100 text-blue-800">
                      {w.count}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full mt-3 overflow-hidden">
                    <div
                      className="bg-blue-600 h-1.5 rounded-full"
                      style={{ width: `${Math.min(100, (w.count / summary.totalComplaints) * 200)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Master Complaints Management Table */}
      {activeTab === 'complaints' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Citywide Complaint Records</h3>
              <p className="text-xs text-slate-500">Comprehensive audit trail of all citizen complaints</p>
            </div>
            <Link
              to="/map"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs transition-colors"
            >
              <span>View On City Map</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                <tr>
                  <th className="px-6 py-3.5">ID / Category</th>
                  <th className="px-6 py-3.5">Title & Location</th>
                  <th className="px-6 py-3.5">Department</th>
                  <th className="px-6 py-3.5">Priority</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">SLA</th>
                  <th className="px-6 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {complaints.map((c) => (
                  <tr key={c._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-mono font-bold text-slate-800">
                        #{c._id.slice(-6).toUpperCase()}
                      </span>
                      <p className="text-[11px] text-blue-600 font-semibold">{c.category}</p>
                    </td>
                    <td className="px-6 py-4 max-w-xs">
                      <p className="font-bold text-slate-900 truncate">{c.title}</p>
                      <p className="text-[11px] text-slate-400 truncate">{c.address || c.ward}</p>
                    </td>
                    <td className="px-6 py-4 font-medium">{c.department}</td>
                    <td className="px-6 py-4">
                      <PriorityBadge priority={c.priority} size="sm" />
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={c.status} size="sm" />
                    </td>
                    <td className="px-6 py-4"><SlaBadge status={c.slaStatus} /></td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        to={`/complaints/${c._id}`}
                        className="text-xs font-bold text-blue-600 hover:text-blue-800"
                      >
                        Inspect →
                      </Link>
                    </td>
                  </tr>
                ))}
                {!complaints.length && <tr><td colSpan={7} className="px-6 py-8 text-center text-slate-500">No complaints have been recorded.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Personnel / User Management */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-base">Municipal Personnel & Citizens</h3>
            <p className="text-xs text-slate-500">Manage user roles, assign officers to departments, and review jurisdiction</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                <tr>
                  <th className="px-6 py-3.5">Name</th>
                  <th className="px-6 py-3.5">Email / Phone</th>
                  <th className="px-6 py-3.5">Role</th>
                  <th className="px-6 py-3.5">Department</th>
                  <th className="px-6 py-3.5">Ward</th>
                  <th className="px-6 py-3.5 text-right">Edit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900">{u.name}</td>
                    <td className="px-6 py-4">
                      <p className="text-slate-800">{u.email}</p>
                      <p className="text-[11px] text-slate-400">{u.phone || 'No phone'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase ${
                        u.role === 'admin'
                          ? 'bg-purple-100 text-purple-800'
                          : u.role === 'officer'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-700">
                      {u.role === 'officer' ? u.department : '—'}
                    </td>
                    <td className="px-6 py-4 text-slate-600">{u.ward || '—'}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedUser(u);
                          setNewRole(u.role);
                          setNewDept(u.department || 'PWD / Roads');
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-700 font-semibold"
                      >
                        Modify
                      </button>
                    </td>
                  </tr>
                ))}
                {!users.length && <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-500">No users are available.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* User Modify Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <h3 className="font-bold text-slate-900 text-base">
              Modify Role & Department: {selectedUser.name}
            </h3>

            <form onSubmit={handleUpdateUserRole} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  System Role
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                >
                  <option value="citizen">Citizen</option>
                  <option value="officer">Field Officer</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              {newRole === 'officer' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Assigned Municipal Department
                  </label>
                  <select
                    value={newDept}
                    onChange={(e) => setNewDept(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                  >
                    {DEPARTMENTS.filter(d => d !== 'General Civic Department').map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={userUpdating}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow"
                >
                  {userUpdating ? 'Saving...' : 'Apply Role Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
