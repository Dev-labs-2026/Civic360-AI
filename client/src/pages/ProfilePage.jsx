import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import authService from '../services/authService';
import { WARDS } from '../utils/constants';
import { User, Phone, Mail, MapPin, Building2, Shield, Check, Save } from 'lucide-react';

const ProfilePage = () => {
  const { user, updateUserState } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [ward, setWard] = useState(user?.ward || 'Ward 12 - Indiranagar');
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const res = await authService.getMe();
        if (res.success) {
          setName(res.user.name);
          setPhone(res.user.phone || '');
          setWard(res.user.ward || 'Ward 12 - Indiranagar');
          setStats(res.stats);
        }
      } catch (err) {
        console.warn('Failed to load profile details:', err);
      }
    };
    fetchMe();
  }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setSuccessMsg('');
      const res = await authService.updateProfile({ name, phone, ward });
      if (res.success && res.user) {
        updateUserState(res.user);
        setSuccessMsg('Profile updated successfully!');
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (err) {
      alert(`Update failed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Citizen Profile & Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Manage your personal details, contact number, and default municipal ward.
        </p>
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Profile Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-2xl flex items-center justify-center shadow-md">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">{user?.name}</h3>
            <p className="text-xs text-slate-400">{user?.email}</p>
            <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase bg-blue-100 text-blue-800">
              Role: {user?.role} {user?.department ? `• ${user.department}` : ''}
            </span>
          </div>
        </div>

        {stats && (
          <div className="grid grid-cols-3 gap-3 mb-6 p-4 rounded-2xl bg-slate-50 border border-slate-200/70 text-center">
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase">Total Reports</p>
              <h4 className="text-xl font-black text-slate-900 mt-0.5">{stats.total || 0}</h4>
            </div>
            <div>
              <p className="text-xs text-amber-600 font-bold uppercase">Pending</p>
              <h4 className="text-xl font-black text-slate-900 mt-0.5">{stats.pending || 0}</h4>
            </div>
            <div>
              <p className="text-xs text-emerald-600 font-bold uppercase">Resolved</p>
              <h4 className="text-xl font-black text-slate-900 mt-0.5">{stats.resolved || 0}</h4>
            </div>
          </div>
        )}

        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Phone Number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 9876543210"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Primary Municipal Ward
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

          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Settings'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;
