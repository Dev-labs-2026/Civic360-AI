import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import complaintService from '../services/complaintService';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import SlaBadge from '../components/SlaBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import ImageCompareModal from '../components/ImageCompareModal';
import { formatDate, formatRelativeTime } from '../utils/formatters';
import { COMPLAINT_STATUSES, DEPARTMENTS } from '../utils/constants';
import { getImageUrl } from '../services/api';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import {
  MapPin,
  Building2,
  Calendar,
  User,
  ArrowLeft,
  Sparkles,
  Camera,
  CheckCircle2,
  Clock,
  Shield,
  Upload,
  SplitSquareVertical,
  Trash2,
  Check,
  AlertCircle,
  FileCheck2,
} from 'lucide-react';

const createPinIcon = (status) => {
  const pinColor = status === 'Resolved' ? '#10b981' : '#2563eb';
  return L.divIcon({
    className: 'detail-map-pin',
    html: `
      <div style="position: relative; width: 34px; height: 34px;">
        <div style="position: absolute; top: 0; left: 0; width: 34px; height: 34px; background: ${pinColor}; border: 3px solid white; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); box-shadow: 0 4px 10px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">
          <div style="width: 10px; height: 10px; background: white; border-radius: 50%; transform: rotate(45deg);"></div>
        </div>
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 34],
  });
};

const ComplaintDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Officer / Admin update controls
  const [updateStatus, setUpdateStatus] = useState('');
  const [resolutionNote, setResolutionNote] = useState('');
  const [afterImageFile, setAfterImageFile] = useState(null);
  const [afterImagePreview, setAfterImagePreview] = useState('');
  const [updating, setUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  // Compare modal
  const [compareModalOpen, setCompareModalOpen] = useState(false);

  const fetchComplaint = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await complaintService.getComplaintById(id);
      if (res.success && res.complaint) {
        setComplaint(res.complaint);
        setUpdateStatus(res.complaint.status);
        setResolutionNote(res.complaint.resolutionNote || '');
        setAfterImagePreview(res.complaint.afterImage || '');
      }
    } catch (err) {
      setError(err.message || 'Complaint not found.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaint();
  }, [id]);

  const isOfficerOrAdmin = user && ['officer', 'admin'].includes(user.role);
  const isOwner = user && complaint && complaint.citizen?._id === user._id;

  const handleAfterImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAfterImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAfterImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    try {
      setUpdating(true);
      setUpdateSuccess(false);

      let finalAfterImage = afterImagePreview;
      if (afterImageFile) {
        try {
          const uploadRes = await complaintService.uploadImage(afterImageFile);
          if (uploadRes.success && uploadRes.imageUrl) {
            finalAfterImage = uploadRes.imageUrl;
          }
        } catch (uploadErr) {
          console.warn('Fallback to base64 after image');
        }
      }

      const updateData = {
        status: updateStatus,
        resolutionNote,
        afterImage: finalAfterImage,
        beforeImage: complaint.beforeImage || complaint.image,
      };

      const res = await complaintService.updateComplaint(id, updateData);
      if (res.success && res.complaint) {
        setComplaint(res.complaint);
        setUpdateSuccess(true);
        setTimeout(() => setUpdateSuccess(false), 3000);
      }
    } catch (err) {
      alert(`Update failed: ${err.message}`);
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this complaint?')) {
      try {
        await complaintService.deleteComplaint(id);
        navigate(user?.role === 'citizen' ? '/dashboard' : '/officer');
      } catch (err) {
        alert(err.message || 'Failed to delete complaint');
      }
    }
  };

  if (loading) return <LoadingSpinner message="Loading complaint details..." className="min-h-[60vh]" />;

  if (error || !complaint) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-800 mb-2">Complaint Not Found</h2>
        <p className="text-sm text-slate-500 mb-6">{error || 'The requested issue could not be loaded.'}</p>
        <div className="flex justify-center gap-2"><button onClick={fetchComplaint} className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-xs">Try Again</button><button onClick={() => navigate(-1)} className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs">Go Back</button></div>
      </div>
    );
  }

  // Steps for progress track
  const steps = [
    { title: 'Submitted', desc: 'Complaint received', complete: (complaint.timeline || []).some((event) => event.status === 'Pending') },
    { title: 'Analyzed', desc: 'Category and route assessed', complete: (complaint.timeline || []).some((event) => event.status === 'Analyzed') || Boolean(complaint.aiMetadata?.suggestedDepartment) },
    { title: 'Assigned', desc: 'Sent to department/officer', complete: (complaint.timeline || []).some((event) => event.status === 'Assigned') || ['In Progress', 'Resolved'].includes(complaint.status) },
    { title: 'In Progress', desc: 'Work underway', complete: (complaint.timeline || []).some((event) => event.status === 'In Progress') || ['In Progress', 'Resolved'].includes(complaint.status) },
    { title: 'Resolved', desc: 'Resolution recorded', complete: complaint.status === 'Resolved' },
  ];
  const currentStepIndex = complaint.status === 'Resolved' ? 4 : complaint.status === 'In Progress' ? 3 : complaint.status === 'Assigned' ? 2 : steps[1].complete ? 1 : 0;
  const officerStatusOptions = {
    Pending: ['Pending', 'Assigned', 'In Progress'],
    Assigned: ['Assigned', 'In Progress'],
    'In Progress': ['In Progress', 'Resolved'],
    Resolved: ['Resolved'],
    Rejected: ['Rejected'],
  };
  const allowedStatusOptions = user?.role === 'admin' ? COMPLAINT_STATUSES : (officerStatusOptions[complaint.status] || [complaint.status]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Breadcrumb & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to List</span>
        </button>

        <div className="flex items-center gap-3">
          <StatusBadge status={complaint.status} size="lg" />
          <PriorityBadge priority={complaint.priority} size="lg" />

          {/* Delete button if authorized */}
          {((isOwner && complaint.status === 'Pending') || user?.role === 'admin') && (
            <button
              onClick={handleDelete}
              className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors text-xs font-medium flex items-center gap-1"
              title="Delete complaint"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Header Card */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-sm">
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mb-2">
          <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
            ID: CIV-{complaint._id.slice(-6).toUpperCase()}
          </span>
          <span>•</span>
          <span className="font-semibold text-blue-600 uppercase tracking-wider">{complaint.category}</span>
          <span>•</span>
          <span>Reported {formatDate(complaint.createdAt)}</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mb-4">
          {complaint.title}
        </h1>

        <p className="text-sm text-slate-600 leading-relaxed max-w-4xl whitespace-pre-line mb-6">
          {complaint.description}
        </p>

        {/* Status Lifecycle Progress Bar */}
        <div className="border-t border-slate-100 pt-6">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">
            Resolution Progress
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
            {steps.map((st, idx) => {
              const isPastOrCurrent = st.complete;
              const isCurrent = currentStepIndex === idx;

              return (
                <div
                  key={st.title}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    isCurrent
                      ? 'bg-blue-50/80 border-blue-500 shadow-xs ring-1 ring-blue-500/20'
                      : isPastOrCurrent
                      ? 'bg-slate-50 border-emerald-300'
                      : 'bg-white border-slate-200 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        isPastOrCurrent
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {isPastOrCurrent ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                    </span>
                    <span className="text-xs font-bold text-slate-900">{st.title}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 ml-8">{st.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {complaint.slaStatus && (
        <section className="bg-indigo-50 border border-indigo-200 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-3">
          <div><p className="text-xs font-bold uppercase tracking-wider text-indigo-700">Configured application SLA</p><p className="text-sm font-semibold text-slate-800 mt-1">{complaint.slaDuration} hours · <SlaBadge status={complaint.slaStatus} /></p></div>
          <p className="text-xs text-slate-600">Expected deadline: {formatDate(complaint.slaDeadline)}</p>
        </section>
      )}
      {complaint.slaStatus === 'Overdue' && <p className="-mt-6 text-xs font-semibold text-rose-700">The expected deadline passed on {formatDate(complaint.slaDeadline)}. This status is calculated from the stored deadline.</p>}
      {complaint.slaStatus === 'Escalated' && <p className="-mt-6 text-xs font-semibold text-purple-700">This complaint has been escalated for additional review.</p>}
      {isOfficerOrAdmin && complaint.aiMetadata?.duplicateOf?._id && (
        <section className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
          <div><p className="text-xs font-bold text-amber-900">Possible duplicate relationship</p><p className="text-xs text-amber-800 mt-1">Possible duplicate of CIV-{String(complaint.aiMetadata.duplicateOf._id).slice(-6).toUpperCase()}</p></div>
          <Link to={`/complaints/${complaint.aiMetadata.duplicateOf._id}`} className="px-3 py-2 rounded-lg bg-amber-700 text-white text-xs font-bold">Inspect related complaint</Link>
        </section>
      )}
      {user?.role !== 'citizen' && complaint.escalationHistory?.length > 0 && (
        <section className="bg-white border border-rose-200 rounded-2xl p-5"><h3 className="font-bold text-sm text-rose-800 mb-3">Escalation history</h3><div className="space-y-3">{complaint.escalationHistory.map((item, index) => <div key={`${item.timestamp}-${index}`} className="text-xs text-slate-600 border-l-2 border-rose-300 pl-3"><p className="font-semibold">Level {item.escalationLevel}: {item.previousStatus} → {item.newStatus} · {formatDate(item.timestamp)}</p><p>{item.reason}</p><p>Referred to: {item.newAssignee?.name || complaint.escalatedTo?.name || 'Administrator queue'}</p></div>)}</div></section>
      )}

      {/* Grid: Photos & Resolution Notes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Reported Photo */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-blue-600" />
                Reported Photo Evidence
              </h3>
              <span className="text-[11px] text-slate-400">Captured at site</span>
            </div>

            <div className="h-64 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center">
              {complaint.image ? (
                <img
                  src={getImageUrl(complaint.image)}
                  alt={complaint.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-xs text-slate-400">No photo uploaded with report</span>
              )}
            </div>
          </div>

          {/* Before & After Comparison Button if After photo exists */}
          {complaint.afterImage && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCompareModalOpen(true)}
                className="w-full py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <SplitSquareVertical className="w-4 h-4 text-emerald-600" />
                <span>View Before vs After Verification</span>
              </button>
            </div>
          )}
        </div>

        {/* Location & Map */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-blue-600" />
                Location & Ward
              </h3>
              <span className="text-[11px] font-mono text-slate-500">
                {complaint.latitude?.toFixed(4)}, {complaint.longitude?.toFixed(4)}
              </span>
            </div>

            <div className="h-64 rounded-2xl overflow-hidden border border-slate-200">
              <MapContainer
                center={[complaint.latitude ?? 22.5726, complaint.longitude ?? 88.3639]}
                zoom={14}
                scrollWheelZoom={false}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker
                  position={[complaint.latitude ?? 22.5726, complaint.longitude ?? 88.3639]}
                  icon={createPinIcon(complaint.status)}
                >
                  <Popup>
                    <div className="text-xs">
                      <p className="font-bold">{complaint.title}</p>
                      <p className="text-slate-500">{complaint.address}</p>
                    </div>
                  </Popup>
                </Marker>
              </MapContainer>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-600 space-y-1">
            <p>
              <span className="text-slate-400">Address:</span>{' '}
              <span className="font-medium text-slate-800">{complaint.address}</span>
            </p>
            <p>
              <span className="text-slate-400">Ward:</span>{' '}
              <span className="font-medium text-slate-800">{complaint.ward}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Department & Officer Details */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="space-y-1">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Department</p>
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-600" />
            <h4 className="font-bold text-slate-900 text-sm">{complaint.department || 'General Civic Department'}</h4>
          </div>
          <p className="text-xs text-slate-500">Rule-based category routing</p>
        </div>

        <div className="space-y-1">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Assigned Officer</p>
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-indigo-600" />
            <h4 className="font-bold text-slate-900 text-sm">
              {complaint.assignedOfficer?.name || 'Pending assignment'}
            </h4>
          </div>
          <p className="text-xs text-slate-500">
            {complaint.assignedOfficer?.phone ? `Contact: ${complaint.assignedOfficer.phone}` : 'Municipal Field Officer'}
          </p>
        </div>

        <div className="space-y-1">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Routing explanation</p>
          <p className="text-xs text-slate-600 leading-relaxed">
            {complaint.routingExplanation || 'Department selected from the complaint category; no assignment explanation was recorded.'}
          </p>
        </div>

        <div className="space-y-1">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Citizen Reporter</p>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-600" />
            <h4 className="font-bold text-slate-900 text-sm">{complaint.citizen?.name || 'Anonymous Citizen'}</h4>
          </div>
          <p className="text-xs text-slate-500">Verified Citizen Account</p>
        </div>
      </div>

      {/* Resolution Notes Display (If exists) */}
      {(complaint.resolutionNote || complaint.afterImage) && (
        <div id="resolution-evidence" className="bg-emerald-50/70 border border-emerald-200 rounded-3xl p-6 sm:p-8 scroll-mt-24">
          <div className="flex items-center gap-2 mb-2 text-emerald-800">
            <FileCheck2 className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-sm">Resolution Notes & Evidence</h3>
          </div>
          {complaint.resolutionNote && <p className="text-xs sm:text-sm text-emerald-900 leading-relaxed font-medium">"{complaint.resolutionNote}"</p>}
          {complaint.afterImage && (
            <div className="mt-4 flex items-center gap-3">
              <img
                src={getImageUrl(complaint.afterImage)}
                alt="Resolved Proof"
                className="w-20 h-20 object-cover rounded-xl border border-emerald-300 shadow-xs cursor-pointer hover:opacity-90"
                onClick={() => setCompareModalOpen(true)}
              />
              <div>
                <p className="text-xs font-bold text-emerald-900">After-Resolution Photo Attached</p>
                <button
                  type="button"
                  onClick={() => setCompareModalOpen(true)}
                  className="text-xs font-semibold text-emerald-700 underline mt-0.5"
                >
                  Click to open Before / After slider
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Officer / Admin Resolution Management Panel */}
      {isOfficerOrAdmin && (
        <div className="bg-white rounded-3xl border-2 border-blue-500/30 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
                Officer Desk
              </span>
              <h3 className="text-lg font-bold text-slate-900 mt-1">
                Manage & Resolve Complaint
              </h3>
            </div>
            {updateSuccess && (
              <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-bold text-xs rounded-xl flex items-center gap-1 animate-in fade-in">
                <Check className="w-4 h-4" /> Updated successfully!
              </span>
            )}
          </div>

          <form onSubmit={handleUpdateSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Update Status
                </label>
                <select
                  value={updateStatus}
                  onChange={(e) => setUpdateStatus(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                >
                  {allowedStatusOptions.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Upload "After Resolution" Photo Proof
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAfterImageChange}
                  className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Progress Note & Actions Taken
              </label>
              <textarea
                rows={3}
                value={resolutionNote}
                onChange={(e) => setResolutionNote(e.target.value)}
                placeholder="Describe the progress or resolution work completed..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>

            <button
              type="submit"
              disabled={updating}
              className="py-3 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>{updating ? 'Saving Changes...' : 'Save Resolution Updates'}</span>
            </button>
          </form>
        </div>
      )}

      {/* Chronological Status Timeline */}
      <div id="timeline" className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs scroll-mt-24">
        <h3 className="text-base font-bold text-slate-900 mb-6 flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-600" />
          Complaint Timeline
        </h3>

        <div className="space-y-6 relative before:absolute before:inset-0 before:left-3 before:w-0.5 before:bg-slate-200">
          {(complaint.timeline || []).map((tl, index) => (
            <div key={index} className="relative flex items-start gap-4 pl-8">
              <span className="absolute left-1.5 top-1 -translate-x-1/2 w-3.5 h-3.5 rounded-full border-2 border-white bg-blue-600 shadow-xs" />
              <div className="flex-1 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="font-bold text-xs text-slate-900">
                    Event: <span className="text-blue-600">{tl.status}</span>
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {formatDate(tl.timestamp)}
                  </span>
                </div>
                {tl.note && <p className="text-xs text-slate-600 leading-relaxed">{tl.note}</p>}
                {tl.updatedBy && (
                  <p className="text-[10px] text-slate-400 mt-1 font-medium">
                    Updated by: {tl.updatedBy?.name || 'System Auto-Router'}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Before / After Modal */}
      {compareModalOpen && (
        <ImageCompareModal
          beforeImage={getImageUrl(complaint.beforeImage || complaint.image)}
          afterImage={getImageUrl(complaint.afterImage)}
          title={complaint.title}
          onClose={() => setCompareModalOpen(false)}
        />
      )}
    </div>
  );
};

export default ComplaintDetailPage;
