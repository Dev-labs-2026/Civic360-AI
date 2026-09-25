import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import complaintService from '../services/complaintService';
import MapPicker from '../components/MapPicker';
import { ISSUE_CATEGORIES, WARDS, PRIORITIES } from '../utils/constants';
import {
  Upload,
  Sparkles,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  Send,
  Camera,
  Layers,
  Building2,
  Info,
  Clock,
  ExternalLink,
} from 'lucide-react';

const ReportIssuePage = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(searchParams.get('category') || 'Pothole');
  const [priority, setPriority] = useState('Medium');
  const [ward, setWard] = useState(user?.ward || 'Ward 12 - Indiranagar');
  const [address, setAddress] = useState('100 Feet Road, Indiranagar, Bengaluru');
  const [latitude, setLatitude] = useState(12.9784);
  const [longitude, setLongitude] = useState(77.6408);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  // AI Assistant State
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState(null);
  const [duplicateWarning, setDuplicateWarning] = useState(null);

  // Form submission state
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successComplaint, setSuccessComplaint] = useState(null);

  // Handle location update from Leaflet map
  const handleLocationChange = (lat, lng) => {
    setLatitude(lat);
    setLongitude(lng);
    // Trigger duplicate check on location change
    triggerAiAnalysis(title, description, category, lat, lng);
  };

  // Image Selection & Preview
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Trigger real-time AI Assistant draft analysis
  const triggerAiAnalysis = async (t = title, d = description, c = category, lat = latitude, lng = longitude) => {
    if (!t && !d) return;

    try {
      setAiAnalyzing(true);
      const res = await complaintService.analyzeDraft({
        title: t,
        description: d,
        category: c,
        latitude: lat,
        longitude: lng,
        ward,
      });

      if (res.success && res.analysis) {
        setAiSuggestions(res.analysis);
        if (res.analysis.duplicateDetected) {
          setDuplicateWarning(res.analysis.duplicateComplaint);
        } else {
          setDuplicateWarning(null);
        }

        // If user hasn't explicitly customized priority, apply AI suggestion
        if (res.analysis.suggestedPriority) {
          setPriority(res.analysis.suggestedPriority);
        }
      }
    } catch (err) {
      console.warn('AI analysis draft preview failed:', err.message);
    } finally {
      setAiAnalyzing(false);
    }
  };

  // Debounced AI trigger when description or title changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (title.length > 5 || description.length > 10) {
        triggerAiAnalysis();
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [title, description, category]);

  // Form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!title.trim() || !description.trim()) {
      setErrorMessage('Please provide both title and detailed description.');
      return;
    }

    if (!latitude || !longitude) {
      setErrorMessage('Please select issue coordinates on the map.');
      return;
    }

    try {
      setSubmitting(true);
      let uploadedImageUrl = imagePreview;

      // If a file was selected, upload via server upload endpoint
      if (imageFile) {
        try {
          const uploadRes = await complaintService.uploadImage(imageFile);
          if (uploadRes.success && uploadRes.imageUrl) {
            uploadedImageUrl = uploadRes.imageUrl;
          }
        } catch (uploadErr) {
          console.warn('File upload fell back to preview/base64 string:', uploadErr.message);
        }
      }

      // If user is not authenticated, prompt to login or redirect with state
      if (!isAuthenticated) {
        navigate('/login', { state: { from: { pathname: '/report' } } });
        return;
      }

      const complaintData = {
        title,
        description,
        category,
        priority,
        ward,
        address,
        latitude: Number(latitude),
        longitude: Number(longitude),
        image: uploadedImageUrl || '',
      };

      const res = await complaintService.createComplaint(complaintData);

      if (res.success && res.complaint) {
        setSuccessComplaint(res.complaint);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to submit complaint. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-8 text-center sm:text-left">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Report a Civic Issue
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Our AI engine automatically categorizes your complaint, assesses priority, and routes it to the designated municipal officer.
        </p>
      </div>

      {/* Success Modal */}
      {successComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 text-center shadow-2xl border border-slate-100">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-1">
              Complaint Registered Successfully!
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Complaint ID: <span className="font-mono font-bold text-slate-800">#{successComplaint._id.slice(-6).toUpperCase()}</span>
            </p>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 text-left text-xs space-y-2 mb-6">
              <div className="flex justify-between">
                <span className="text-slate-500">Category:</span>
                <span className="font-bold text-slate-800">{successComplaint.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Department:</span>
                <span className="font-bold text-blue-600">{successComplaint.department}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status:</span>
                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-bold">
                  {successComplaint.status}
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => navigate(`/complaints/${successComplaint._id}`)}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all"
              >
                Track Live Progress
              </button>
              <button
                type="button"
                onClick={() => {
                  setSuccessComplaint(null);
                  setTitle('');
                  setDescription('');
                  setImagePreview('');
                  setImageFile(null);
                }}
                className="w-full py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-50"
              >
                Report Another Issue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {errorMessage && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Duplicate Issue Warning Alert */}
        {duplicateWarning && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 shadow-sm flex items-start gap-3 animate-in fade-in duration-200">
            <div className="p-2 rounded-xl bg-amber-200 text-amber-800 shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="flex-1 text-xs">
              <h4 className="font-bold text-sm text-amber-900">
                Possible Duplicate Detected Nearby!
              </h4>
              <p className="mt-1 text-amber-800 leading-relaxed">
                An active complaint regarding "{duplicateWarning.title}" was already reported at this location ({duplicateWarning.address}) and is currently{' '}
                <span className="font-bold underline">{duplicateWarning.status}</span>.
              </p>
              <div className="mt-2.5 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => navigate(`/complaints/${duplicateWarning._id}`)}
                  className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold inline-flex items-center gap-1 text-[11px]"
                >
                  <span>View Existing Complaint</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
                <span className="text-[11px] text-amber-700">
                  You may still submit if your report describes a new or worsening problem.
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column: Form Inputs */}
          <div className="md:col-span-2 space-y-5">
            {/* Title */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Issue Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Deep pothole near Indiranagar 12th Main signal"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>

            {/* Description & AI Assistant preview */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Detailed Description *
                </label>
                {aiAnalyzing && (
                  <span className="text-[11px] text-blue-600 font-semibold flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 animate-spin" />
                    AI Analyzing...
                  </span>
                )}
              </div>
              <textarea
                required
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the issue, size, hazards, landmarks, or potential risks..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 leading-relaxed"
              />

              {/* AI Assistant Tags Bar */}
              {aiSuggestions && (
                <div className="mt-3 p-3 bg-blue-50/70 border border-blue-100 rounded-xl text-xs space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-blue-900">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    <span>Civic360 AI Analysis:</span>
                    <span className="text-[10px] font-normal px-2 py-0.2 bg-blue-200/70 text-blue-800 rounded-full ml-auto">
                      {(aiSuggestions.confidenceScore * 100).toFixed(0)}% Confidence
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 text-[11px]">
                    <span className="bg-white px-2 py-1 rounded-md text-slate-700 border border-slate-200">
                      Category: <b>{aiSuggestions.suggestedCategory}</b>
                    </span>
                    <span className="bg-white px-2 py-1 rounded-md text-slate-700 border border-slate-200">
                      Priority: <b>{aiSuggestions.suggestedPriority}</b>
                    </span>
                    <span className="bg-white px-2 py-1 rounded-md text-slate-700 border border-slate-200">
                      Routing: <b>{aiSuggestions.recommendedDepartment}</b>
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Category & Priority Selectors */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                >
                  {ISSUE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Urgency / Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                >
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {p} Priority
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Ward & Address */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Municipal Ward *
                </label>
                <select
                  value={ward}
                  onChange={(e) => setWard(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                >
                  {WARDS.map((w) => (
                    <option key={w} value={w}>
                      {w}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Street Landmark / Address
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Near Indiranagar Metro Station Pillar #42"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>
            </div>
          </div>

          {/* Right Column: Image Upload & Map Picker */}
          <div className="space-y-5">
            {/* Image Upload Box */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Issue Photo Evidence
              </label>

              {imagePreview ? (
                <div className="relative rounded-xl overflow-hidden border border-slate-200 h-48 bg-slate-100 group">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setImagePreview('');
                      setImageFile(null);
                    }}
                    className="absolute top-2 right-2 px-2.5 py-1 bg-red-600/90 hover:bg-red-700 text-white font-bold text-xs rounded-lg shadow transition-colors"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <label className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-blue-50/30">
                  <div className="p-3 rounded-full bg-blue-100 text-blue-600 mb-2">
                    <Camera className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold text-slate-700">Click to upload photo</span>
                  <span className="text-[11px] text-slate-400 mt-0.5">JPG, PNG, WebP up to 10MB</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Map Location Picker */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Pinpoint on Map *
                </label>
                <span className="text-[10px] text-slate-400">Click map to move pin</span>
              </div>

              <MapPicker
                initialLat={latitude}
                initialLng={longitude}
                onLocationSelect={handleLocationChange}
                className="h-64"
              />
            </div>
          </div>
        </div>

        {/* Submit Button Bar */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-200">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <Info className="w-4 h-4 text-blue-500 shrink-0" />
            <span>AI smart engine routes issues within seconds of registration.</span>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span>{submitting ? 'Submitting Complaint...' : 'Submit Complaint'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default ReportIssuePage;
