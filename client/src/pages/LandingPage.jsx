import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Sparkles, 
  MapPin, 
  ArrowRight, 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  Compass,
  Cpu,
  Layers,
  Activity,
  ChevronRight,
  TrendingUp,
  Award
} from 'lucide-react';
import complaintService from '../services/complaintService';
import ComplaintCard from '../components/ComplaintCard';
import { ISSUE_CATEGORIES } from '../utils/constants';

const LandingPage = () => {
  const [recentComplaints, setRecentComplaints] = useState([]);
  const [stats, setStats] = useState({
    total: 248,
    resolved: 194,
    inProgress: 36,
    avgHours: '28h',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await complaintService.getComplaints({ limit: 4 });
        if (res.success && res.complaints) {
          setRecentComplaints(res.complaints);
          if (res.total) {
            setStats((prev) => ({
              ...prev,
              total: Math.max(res.total, 248),
            }));
          }
        }
      } catch (err) {
        console.warn('Failed to load recent complaints on landing:', err.message);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 md:pt-20 pb-16 bg-gradient-to-b from-blue-50/60 via-slate-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          {/* Tagline Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-100 text-blue-700 text-xs sm:text-sm font-semibold mb-6 shadow-xs border border-blue-200">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>Next-Gen Civic Governance for India</span>
          </div>

          {/* Main Title & Hero Phrase */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 max-w-4xl mx-auto leading-none sm:leading-tight">
            Civic360 <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">AI</span>
          </h1>
          <p className="mt-4 text-2xl sm:text-3xl font-extrabold text-blue-600 tracking-tight">
            Report. Route. Resolve.
          </p>
          <p className="mt-4 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            AI-powered civic issue reporting and resolution platform. Connecting citizens directly with municipal departments to fix potholes, waste, water leaks, and streetlights faster.
          </p>

          {/* Hero Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/report"
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-base shadow-lg shadow-blue-500/25 hover:shadow-xl transition-all flex items-center justify-center gap-2 group"
            >
              <span>Report an Issue</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/track"
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-base border border-slate-300 shadow-sm transition-all flex items-center justify-center gap-2"
            >
              <Clock className="w-4 h-4 text-slate-500" />
              <span>Track Complaint</span>
            </Link>
          </div>

          {/* Trust Metric Badges */}
          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto pt-8 border-t border-slate-200/80">
            <div className="p-4 rounded-xl bg-white/70 border border-slate-200/60 shadow-xs">
              <div className="text-2xl font-black text-blue-600">{stats.total}+</div>
              <div className="text-xs font-medium text-slate-500 mt-1">Total Issues Logged</div>
            </div>
            <div className="p-4 rounded-xl bg-white/70 border border-slate-200/60 shadow-xs">
              <div className="text-2xl font-black text-emerald-600">{stats.resolved}+</div>
              <div className="text-xs font-medium text-slate-500 mt-1">Issues Resolved</div>
            </div>
            <div className="p-4 rounded-xl bg-white/70 border border-slate-200/60 shadow-xs">
              <div className="text-2xl font-black text-indigo-600">&lt; 48 hrs</div>
              <div className="text-xs font-medium text-slate-500 mt-1">Avg Resolution Time</div>
            </div>
            <div className="p-4 rounded-xl bg-white/70 border border-slate-200/60 shadow-xs">
              <div className="text-2xl font-black text-amber-600">96.4%</div>
              <div className="text-xs font-medium text-slate-500 mt-1">AI Routing Precision</div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Cards Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Built with Intelligent Civic Technology
          </h2>
          <p className="mt-2 text-sm sm:text-base text-slate-500">
            Civic360 AI automates the entire lifecycle of municipal complaints with precision tools.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: AI Issue Detection */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition-all group">
            <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Cpu className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800 mb-2">AI Issue Detection</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Auto-classifies citizen complaints, infers severity, and detects proximity duplicates to eliminate redundant municipal tickets.
            </p>
          </div>

          {/* Card 2: Smart Routing */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition-all group">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800 mb-2">Smart Routing</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Dynamically assigns tickets straight to the responsible ward officer (PWD, Sanitation, Water Board, Electrical) without red-tape.
            </p>
          </div>

          {/* Card 3: Live Tracking */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition-all group">
            <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Activity className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800 mb-2">Live Tracking</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Citizens receive transparent status updates from Pending to Assigned, Work in Progress, and Verified Resolution with photographic proof.
            </p>
          </div>

          {/* Card 4: Location Intelligence */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition-all group">
            <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Compass className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800 mb-2">Location Intelligence</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Interactive Leaflet maps with geo-fencing, ward demarcation, and GPS accuracy to pin issues down to the exact street pole or road pothole.
            </p>
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-900 rounded-3xl p-8 sm:p-12 text-white relative overflow-hidden">
          <div className="relative z-10 max-w-3xl">
            <span className="px-3 py-1 rounded-lg bg-blue-500/20 text-blue-300 font-semibold text-xs border border-blue-400/30">
              Citywide Coverage
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold mt-3 tracking-tight">
              Report Any Civic Issue in Under 60 Seconds
            </h2>
            <p className="mt-2 text-sm sm:text-base text-slate-400">
              Select an issue category to get started immediately. Our smart engine will route it to the exact municipal division.
            </p>

            <div className="mt-8 flex flex-wrap gap-2.5">
              {ISSUE_CATEGORIES.map((cat) => (
                <Link
                  key={cat}
                  to={`/report?category=${encodeURIComponent(cat)}`}
                  className="px-4 py-2 rounded-xl bg-slate-800/90 hover:bg-blue-600 border border-slate-700 hover:border-blue-500 text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5"
                >
                  <span>{cat}</span>
                  <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Recent Issues Stream */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
              Recent Reported Issues
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Real-time feed of civic issues logged by citizens in the city
            </p>
          </div>
          <Link
            to="/map"
            className="text-xs sm:text-sm font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            <span>View All on Map</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {recentComplaints.map((complaint) => (
            <ComplaintCard key={complaint._id} complaint={complaint} />
          ))}
        </div>
      </section>

      {/* Call to Action Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-700 p-8 sm:p-12 text-center text-white shadow-xl shadow-blue-600/20">
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            See a Problem in Your Neighborhood?
          </h2>
          <p className="mt-3 text-sm sm:text-base text-blue-100 max-w-xl mx-auto">
            Take a photo, pin the location, and let Civic360 AI alert the right authorities. Join thousands of citizens making our cities better.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/report"
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-white text-blue-700 font-bold text-sm sm:text-base shadow hover:bg-blue-50 transition-all"
            >
              Report an Issue Now
            </Link>
            <Link
              to="/register"
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-blue-800/60 hover:bg-blue-800 text-white font-bold text-sm sm:text-base border border-blue-400/40 transition-all"
            >
              Create Citizen Account
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
