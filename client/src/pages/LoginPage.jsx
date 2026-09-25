import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { DEMO_ACCOUNTS } from '../utils/constants';
import { ShieldAlert, LogIn, AlertCircle, Sparkles, ArrowRight } from 'lucide-react';

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirection destination
  const from = location.state?.from?.pathname;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide both email and password.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const res = await login(email, password);
      if (res.success) {
        if (from) {
          navigate(from, { replace: true });
        } else if (res.user.role === 'admin') {
          navigate('/admin');
        } else if (res.user.role === 'officer') {
          navigate('/officer');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoFill = async (demo) => {
    setEmail(demo.email);
    setPassword(demo.password);
    setError('');
    try {
      setLoading(true);
      const res = await login(demo.email, demo.password);
      if (res.success) {
        if (res.user.role === 'admin') navigate('/admin');
        else if (res.user.role === 'officer') navigate('/officer');
        else navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6">
        {/* Brand Header */}
        <div className="text-center">
          <div className="inline-flex p-3 rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/20 mb-3">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Welcome to Civic360 AI
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Sign in to report issues or manage municipal resolutions
          </p>
        </div>

        {/* Demo Accounts Quick-Click Banner */}
        <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 mb-2">
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span>Instant Demo Login (One-Click)</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.email}
                type="button"
                onClick={() => handleDemoFill(acc)}
                className="p-2 rounded-xl bg-white hover:bg-amber-100/50 border border-amber-200/60 font-medium text-slate-800 text-left transition-all hover:shadow-xs flex flex-col"
              >
                <span className="font-bold text-[11px] text-blue-600">{acc.badge}</span>
                <span className="truncate text-slate-600 text-[11px]">{acc.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-md">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="aarav@civic360.in"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <LogIn className="w-4 h-4" />
              <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
            Don't have an account?{' '}
            <Link to="/register" className="font-bold text-blue-600 hover:text-blue-800">
              Register as Citizen
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
