import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Sparkles, 
  MapPin, 
  ArrowRight, 
  ShieldCheck, 
  CheckCircle2, 
  Compass,
  Cpu,
  Layers,
  Activity,
  ChevronRight,
} from 'lucide-react';
import complaintService from '../services/complaintService';
import ComplaintCard from '../components/ComplaintCard';
import { ISSUE_CATEGORIES } from '../utils/constants';

const LandingPage = () => {
  const [recentComplaints, setRecentComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await complaintService.getComplaints({ limit: 4 });
        if (res.success && res.complaints) {
          setRecentComplaints(res.complaints);
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
            <span>West Bengal, India · Civic issue reporting</span>
          </div>

          {/* Main Title & Hero Phrase */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 max-w-4xl mx-auto leading-none sm:leading-tight">
            Civic360 <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">AI</span>
          </h1>
          <p className="mt-4 text-2xl sm:text-3xl font-extrabold text-blue-600 tracking-tight">
            Smarter Civic Issue Resolution for West Bengal
          </p>
          <p className="mt-4 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Report civic issues, follow complaint updates, and connect reports with the appropriate civic department.
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
              to="/map"
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-base border border-slate-300 shadow-sm transition-all flex items-center justify-center gap-2"
            >
              <MapPin className="w-4 h-4 text-slate-500" />
              <span>Explore Issue Map</span>
            </Link>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-4 border-t border-slate-200/80 pt-8 text-left sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="text-sm font-semibold text-slate-900">Guided reporting</div>
              <p className="mt-1 text-xs leading-5 text-slate-500">Add a category, description, and location to a complaint.</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="text-sm font-semibold text-slate-900">Department-aware routing</div>
              <p className="mt-1 text-xs leading-5 text-slate-500">Rule-based suggestions connect issue categories with civic departments.</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="text-sm font-semibold text-slate-900">Status visibility</div>
              <p className="mt-1 text-xs leading-5 text-slate-500">Citizens can follow complaint status and officer updates.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Cards Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Tools for clearer civic issue resolution
          </h2>
          <p className="mt-2 text-sm sm:text-base text-slate-500">
            A shared workflow for residents, officers, and administrators across West Bengal.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {/* Card 1: AI Issue Detection */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition-all group">
            <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Cpu className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800 mb-2">Issue Classification</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Rule-based suggestions help select a category and assess the reported issue from its details.
            </p>
          </div>

          {/* Card 2: Smart Routing */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition-all group">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800 mb-2">Smart Department Routing</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Connects issue categories with departments such as PWD / Roads, Sanitation, Water, and Electrical.
            </p>
          </div>

          {/* Card 3: Live Tracking */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition-all group">
            <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Activity className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800 mb-2">Complaint Status Tracking</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Citizens can check complaint status and review updates recorded by the assigned officer.
            </p>
          </div>

          {/* Card 4: Location Intelligence */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition-all group">
            <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Compass className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800 mb-2">Ward and Location Map</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Leaflet and OpenStreetMap views help residents locate reports around Kolkata and other demo areas.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800 mb-2">Priority Review</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Rule-based priority suggestions help teams review and organize incoming reports.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center mb-4">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800 mb-2">Officer and Admin Coordination</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Role-based dashboards give officers and administrators tools to review assigned reports and activity.
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
              Start a Civic Issue Report
            </h2>
            <p className="mt-2 text-sm sm:text-base text-slate-400">
              Choose an issue category and location. The routing rules suggest a relevant civic department.
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
              Recent Issue Samples
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Sample complaints from the West Bengal demo environment are labeled as samples.
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
          {loading ? (
            <p className="col-span-full text-sm text-slate-500">Loading recent reports…</p>
          ) : recentComplaints.length ? (
            recentComplaints.map((complaint) => <ComplaintCard key={complaint._id} complaint={complaint} />)
          ) : (
            <p className="col-span-full rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-500">
              No reports are available yet. Use the map or report form to explore the workflow.
            </p>
          )}
        </div>
      </section>

      {/* Call to Action Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-700 p-8 sm:p-12 text-center text-white shadow-xl shadow-blue-600/20">
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            See a Problem in Your Neighborhood?
          </h2>
          <p className="mt-3 text-sm sm:text-base text-blue-100 max-w-xl mx-auto">
            Add a description and location so the right team can review your report.
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
