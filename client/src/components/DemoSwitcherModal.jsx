import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { DEMO_ACCOUNTS } from '../utils/constants';
import { X, Sparkles, User, Shield, Briefcase, Check } from 'lucide-react';

const DemoSwitcherModal = ({ isOpen, onClose }) => {
  const { user, login } = useAuth();
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleSelectAccount = async (account) => {
    try {
      const res = await login(account.email, account.password);
      if (res.success) {
        onClose();
        if (res.user.role === 'admin') {
          navigate('/admin');
        } else if (res.user.role === 'officer') {
          navigate('/officer');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (err) {
      console.error('Demo login failed:', err);
    }
  };

  const getRoleIcon = (role) => {
    if (role.includes('Admin')) return <Shield className="w-5 h-5 text-purple-600" />;
    if (role.includes('Officer')) return <Briefcase className="w-5 h-5 text-blue-600" />;
    return <User className="w-5 h-5 text-emerald-600" />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-200">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-100 text-blue-600">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Quick Demo Switcher</h3>
              <p className="text-xs text-slate-500">Test the platform as Citizen, Officer, or Admin</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-2.5">
          {DEMO_ACCOUNTS.map((acc) => {
            const isCurrent = user?.email === acc.email;

            return (
              <button
                key={acc.email}
                type="button"
                onClick={() => handleSelectAccount(acc)}
                className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center justify-between group ${
                  isCurrent
                    ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20'
                    : 'border-slate-200 hover:border-blue-400 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-white shadow-xs border border-slate-100">
                    {getRoleIcon(acc.role)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-800 text-sm">{acc.name}</h4>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700">
                        {acc.badge}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{acc.desc}</p>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">{acc.email}</p>
                  </div>
                </div>

                {isCurrent ? (
                  <span className="p-1 rounded-full bg-blue-600 text-white">
                    <Check className="w-3.5 h-3.5" />
                  </span>
                ) : (
                  <span className="text-xs font-semibold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    Switch →
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="p-3 bg-slate-50 border-t border-slate-100 text-center text-xs text-slate-500">
          Click any persona to log in automatically without typing passwords.
        </div>
      </div>
    </div>
  );
};

export default DemoSwitcherModal;
