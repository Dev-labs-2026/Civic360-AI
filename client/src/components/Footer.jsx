import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, PhoneCall, Heart, ExternalLink } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Col */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-white text-lg tracking-tight">Civic360 AI</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Empowering Indian citizens with AI-driven civic reporting, geo-spatial intelligence, and automated department routing for cleaner, safer cities.
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Municipal Systems Online</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-3">
              Platform Links
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/" className="hover:text-blue-400 transition-colors">Home & Overview</Link>
              </li>
              <li>
                <Link to="/report" className="hover:text-blue-400 transition-colors">Report an Issue</Link>
              </li>
              <li>
                <Link to="/map" className="hover:text-blue-400 transition-colors">Interactive City Map</Link>
              </li>
              <li>
                <Link to="/track" className="hover:text-blue-400 transition-colors">Track Complaint Status</Link>
              </li>
            </ul>
          </div>

          {/* Municipal Departments */}
          <div>
            <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-3">
              Integrated Departments
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>Public Works & Roads (PWD)</li>
              <li>Sanitation & Solid Waste</li>
              <li>Electricity & Street Lighting (BESCOM/State)</li>
              <li>Water Supply & Sewerage Board (BWSSB)</li>
              <li>Storm Water & Drainage Department</li>
            </ul>
          </div>

          {/* Emergency Helplines */}
          <div>
            <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <PhoneCall className="w-3.5 h-3.5 text-blue-400" />
              Civic Helplines (India)
            </h4>
            <div className="space-y-2 text-xs text-slate-400">
              <div className="flex justify-between border-b border-slate-800 pb-1">
                <span>National Emergency:</span>
                <span className="font-mono text-white font-bold">112</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-1">
                <span>Municipal Grievance Cell:</span>
                <span className="font-mono text-white font-bold">1533</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-1">
                <span>Electricity Breakdown:</span>
                <span className="font-mono text-white font-bold">1912</span>
              </div>
              <div className="flex justify-between">
                <span>Water Supply Emergency:</span>
                <span className="font-mono text-white font-bold">1916</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Civic360 AI. Built with precision for India's civic governance.</p>
          <div className="flex items-center gap-4">
            <span className="hover:text-slate-400 cursor-pointer">Privacy Policy</span>
            <span className="hover:text-slate-400 cursor-pointer">Citizen Charter</span>
            <span className="hover:text-slate-400 cursor-pointer">Open Data API</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
