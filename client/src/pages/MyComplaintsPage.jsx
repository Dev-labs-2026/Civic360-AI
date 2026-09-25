import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import complaintService from '../services/complaintService';
import ComplaintCard from '../components/ComplaintCard';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { ISSUE_CATEGORIES, COMPLAINT_STATUSES } from '../utils/constants';
import { Search, Filter, Plus, FileText } from 'lucide-react';

const MyComplaintsPage = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const res = await complaintService.getComplaints({
        my: 'true',
        search: searchTerm,
        status: statusFilter,
        category: categoryFilter,
      });
      if (res.success && res.complaints) {
        setComplaints(res.complaints);
      }
    } catch (err) {
      console.error('Failed to load complaints:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchComplaints();
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [searchTerm, statusFilter, categoryFilter]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            My Complaints History
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Review all civic issues submitted by your account and their live resolution trail.
          </p>
        </div>

        <Link
          to="/report"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Report New Issue</span>
        </Link>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by title, location or ward..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">All Statuses</option>
            {COMPLAINT_STATUSES.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">All Categories</option>
            {ISSUE_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {(statusFilter || categoryFilter || searchTerm) && (
            <button
              type="button"
              onClick={() => {
                setStatusFilter('');
                setCategoryFilter('');
                setSearchTerm('');
              }}
              className="px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Complaints Grid */}
      {loading ? (
        <LoadingSpinner message="Loading your complaints..." />
      ) : complaints.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No complaints found"
          description={
            statusFilter || categoryFilter || searchTerm
              ? 'No complaints match the selected filters.'
              : 'You have not reported any civic issues yet.'
          }
          actionText="Report an Issue"
          actionLink="/report"
        />
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

export default MyComplaintsPage;
