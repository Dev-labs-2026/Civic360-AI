import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Link } from 'react-router-dom';
import StatusBadge from './StatusBadge';
import PriorityBadge from './PriorityBadge';
import SlaBadge from './SlaBadge';
import { ArrowRight, MapPin, Layers } from 'lucide-react';
import { ISSUE_CATEGORIES, PRIORITIES, DEPARTMENTS, WARDS } from '../utils/constants';
import { getImageUrl } from '../services/api';

// Helper to create colored pin markers
const createMarkerIcon = (priority, status, slaStatus) => {
  let pinColor = '#2563eb'; // blue
  if (status === 'Resolved') {
    pinColor = '#10b981'; // green
  } else if (slaStatus === 'Escalated') {
    pinColor = '#9333ea'; // purple
  } else if (slaStatus === 'Overdue') {
    pinColor = '#e11d48'; // rose
  } else if (slaStatus === 'Due Soon') {
    pinColor = '#d97706'; // amber
  } else if (priority === 'Critical') {
    pinColor = '#ef4444'; // red
  } else if (priority === 'High') {
    pinColor = '#f97316'; // orange
  } else if (priority === 'Medium') {
    pinColor = '#f59e0b'; // amber
  }

  return L.divIcon({
    className: 'custom-map-pin',
    html: `
      <div style="position: relative; width: 30px; height: 30px;">
        <div style="position: absolute; top: 0; left: 0; width: 30px; height: 30px; background: ${pinColor}; border: 2.5px solid white; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); box-shadow: 0 4px 10px rgba(0,0,0,0.25); display: flex; align-items: center; justify-content: center;">
          <div style="width: 8px; height: 8px; background: white; border-radius: 50%; transform: rotate(45deg);"></div>
        </div>
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30],
  });
};

const ComplaintMap = ({
  complaints = [],
  center = [22.5726, 88.3639],
  zoom = 12,
  height = '500px',
  showFilters = true,
}) => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedPriority, setSelectedPriority] = useState('All');
  const [selectedDepartment, setSelectedDepartment] = useState('All');
  const [selectedWard, setSelectedWard] = useState('All');
  const [selectedSlaStatus, setSelectedSlaStatus] = useState('All');

  // Filter complaints for map display
  const filteredComplaints = complaints.filter((c) => {
    if (c.latitude === null || c.latitude === undefined || c.longitude === null || c.longitude === undefined) return false;
    const matchCat = selectedCategory === 'All' || c.category === selectedCategory;
    const matchStat = selectedStatus === 'All' || c.status === selectedStatus;
    const matchPriority = selectedPriority === 'All' || c.priority === selectedPriority;
    const matchDepartment = selectedDepartment === 'All' || c.department === selectedDepartment;
    const matchWard = selectedWard === 'All' || c.ward === selectedWard;
    const matchSla = selectedSlaStatus === 'All' || c.slaStatus === selectedSlaStatus;
    return matchCat && matchStat && matchPriority && matchDepartment && matchWard && matchSla;
  });

  return (
    <div className="relative rounded-2xl overflow-hidden border border-slate-200/90 shadow-sm bg-white">
      {/* Map Filter Controls Bar */}
      {showFilters && (
        <div className="p-3.5 bg-slate-50 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            <span className="font-semibold text-slate-700">Filter Issues:</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 w-full xl:w-auto gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="All">All Categories</option>
              {ISSUE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <select value={selectedPriority} onChange={(e) => setSelectedPriority(e.target.value)} aria-label="Filter map by priority" className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-slate-700 font-medium">
              <option value="All">All Priorities</option>{PRIORITIES.map((priority) => <option key={priority} value={priority}>{priority}</option>)}
            </select>

            <select value={selectedDepartment} onChange={(e) => setSelectedDepartment(e.target.value)} aria-label="Filter map by department" className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-slate-700 font-medium">
              <option value="All">All Departments</option>{DEPARTMENTS.map((department) => <option key={department} value={department}>{department}</option>)}
            </select>

            <select value={selectedWard} onChange={(e) => setSelectedWard(e.target.value)} aria-label="Filter map by ward" className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-slate-700 font-medium">
              <option value="All">All Wards</option>{WARDS.map((ward) => <option key={ward} value={ward}>{ward}</option>)}
            </select>

            <select value={selectedSlaStatus} onChange={(e) => setSelectedSlaStatus(e.target.value)} aria-label="Filter map by SLA status" className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-slate-700 font-medium">
              <option value="All">All SLA states</option>{['On Track', 'Due Soon', 'Overdue', 'Escalated', 'Resolved'].map((status) => <option key={status} value={status}>{status}</option>)}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Assigned">Assigned</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Rejected">Rejected</option>
            </select>

            <span className="px-2 py-1 rounded bg-blue-100 text-blue-800 font-medium text-[11px]">
              Showing {filteredComplaints.length} locations
            </span>
          </div>
        </div>
      )}

      {/* Map Container */}
      <div style={{ height }}>
        <MapContainer
          center={center}
          zoom={zoom}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {filteredComplaints.map((c) => (
            <Marker
              key={c._id}
              position={[c.latitude, c.longitude]}
              icon={createMarkerIcon(c.priority, c.status, c.slaStatus)}
            >
              <Popup className="civic-popup" minWidth={240} maxWidth={280}>
                <div className="p-1">
                  {c.image && (
                    <img
                      src={getImageUrl(c.image)}
                      alt={c.title}
                      className="w-full h-28 object-cover rounded-lg mb-2"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  )}
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">
                      {c.category}
                    </span>
                    <PriorityBadge priority={c.priority} size="sm" />
                  </div>
                  <h5 className="font-bold text-slate-900 text-xs mb-1 line-clamp-2">
                    {c.title}
                  </h5>
                  <p className="text-[10px] font-mono text-slate-500 mb-1">CIV-{String(c._id).slice(-6).toUpperCase()} · {new Date(c.createdAt).toLocaleDateString()}</p>
                  <div className="flex items-center gap-1 text-[11px] text-slate-500 mb-2 truncate">
                    <MapPin className="w-3 h-3 shrink-0" />
                    <span className="truncate">{c.address || c.ward}</span>
                  </div>
                  {c.ward && c.address && <p className="text-[10px] text-slate-500 mb-2">Ward: {c.ward}</p>}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <StatusBadge status={c.status} size="sm" />
                    <Link
                      to={`/complaints/${c._id}`}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-800 inline-flex items-center gap-0.5"
                    >
                      View <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                  <div className="pt-2"><SlaBadge status={c.slaStatus} /></div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {filteredComplaints.length === 0 && <p className="border-t border-slate-100 bg-white p-3 text-center text-xs text-slate-500">No complaints with location data match these filters.</p>}

      {/* Map Legend */}
      <div className="p-3 bg-white border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
        <span className="font-semibold text-slate-600">Marker Legend:</span>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-red-500" /> Critical
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-orange-500" /> High
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-amber-500" /> Medium
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-emerald-500" /> Resolved
          </span>
        </div>
      </div>
    </div>
  );
};

export default ComplaintMap;
