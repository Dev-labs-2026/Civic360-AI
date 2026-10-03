import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  MapPin,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import DemoSwitcherModal from '../components/DemoSwitcherModal';
import { getRoleDashboardPath } from '../utils/authRedirect';

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoModalOpen, setDemoModalOpen] = useState(false);

  useEffect(() => {
    setError('');
    setNotice('');
  }, []);

  const requestedPath = location.state?.from?.pathname;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setNotice('');
    setLoading(true);

    try {
      const response = await login(email.trim(), password);
      if (response.success) {
        setError('');
        navigate(requestedPath || getRoleDashboardPath(response.user.role), { replace: true });
      }
    } catch (authError) {
      setError(authError.message || 'Sign-in failed. Check your email and password.');
    } finally {
      setLoading(false);
    }
  };

  const clearMessages = () => {
    setError('');
    setNotice('');
  };

  return (
    <>
      <section className="min-h-[calc(100vh-9rem)] bg-slate-50 px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-8 lg:grid-cols-[1fr_0.82fr] lg:gap-16">
          <div className="max-w-xl">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600">
              <MapPin className="h-3.5 w-3.5 text-blue-700" aria-hidden="true" />
              West Bengal, India
            </div>
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-900 text-white">
              <ShieldCheck className="h-6 w-6" aria-hidden="true" />
            </div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-800">Civic360 AI</p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">
              AI-Powered Civic Issue Resolution Platform for West Bengal
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-slate-600">
              Report civic issues, track resolutions, and connect with the right municipal department.
            </p>
            <p className="mt-5 text-sm text-slate-500">
              From Kolkata and Bidhannagar to Howrah and Durgapur, use one place to report and follow local issues.
            </p>
            <p className="mt-6 text-xs leading-5 text-slate-500">
              Civic360 AI is an independent civic-tech demonstration and is not an official Government of West Bengal service.
            </p>
          </div>

          <div className="w-full max-w-md justify-self-center lg:justify-self-end">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-slate-950">Sign in to Civic360 AI</h2>
                <p className="mt-1 text-sm text-slate-500">Use your Civic360 account to continue.</p>
              </div>

              {error && (
                <div id="login-error" className="mb-4 flex gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800" role="alert">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{error}</span>
                </div>
              )}
              {notice && (
                <p className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800" role="status">
                  {notice}
                </p>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="login-email" className="mb-1.5 block text-sm font-medium text-slate-700">
                    Email Address
                  </label>
                  <input
                    id="login-email"
                    type="email"
                    autoComplete="username"
                    required
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      clearMessages();
                    }}
                    aria-describedby={error ? 'login-error' : undefined}
                    className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-700/15"
                  />
                </div>

                <div>
                  <div className="mb-1.5 flex items-center justify-between gap-3">
                    <label htmlFor="login-password" className="block text-sm font-medium text-slate-700">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        clearMessages();
                        setNotice('Password recovery is not available yet. Please contact your administrator.');
                      }}
                      className="text-xs font-semibold text-blue-800 underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-700"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(event) => {
                        setPassword(event.target.value);
                        clearMessages();
                      }}
                      aria-describedby={error ? 'login-error' : undefined}
                      className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 pr-11 text-sm text-slate-900 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-700/15"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((visible) => !visible)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      aria-pressed={showPassword}
                      className="absolute inset-y-0 right-0 inline-flex w-11 items-center justify-center rounded-r-lg text-slate-500 hover:text-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-700"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-900 disabled:cursor-wait disabled:opacity-60"
                >
                  <LockKeyhole className="h-4 w-4" aria-hidden="true" />
                  {loading ? 'Signing in…' : 'Sign In'}
                </button>
              </form>

              <div className="my-5 flex items-center gap-3 text-xs text-slate-400" aria-hidden="true">
                <span className="h-px flex-1 bg-slate-200" />
                or
                <span className="h-px flex-1 bg-slate-200" />
              </div>

              {import.meta.env.DEV && (
                <button
                  type="button"
                  onClick={() => {
                    clearMessages();
                    setDemoModalOpen(true);
                  }}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-blue-500 hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
                >
                  <ShieldCheck className="h-4 w-4 text-blue-800" aria-hidden="true" />
                  Demo Environment
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
              )}

              <p className="mt-5 text-center text-sm text-slate-500">
                New to Civic360?{' '}
                <Link to="/register" className="font-semibold text-blue-800 hover:underline">
                  Create a citizen account
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>

      {import.meta.env.DEV && (
        <DemoSwitcherModal
          isOpen={demoModalOpen}
          onClose={() => setDemoModalOpen(false)}
          onDemoStart={clearMessages}
        />
      )}
    </>
  );
};

export default LoginPage;
