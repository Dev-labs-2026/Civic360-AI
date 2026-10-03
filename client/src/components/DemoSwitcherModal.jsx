import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, Check, Shield, User, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { DEMO_ACCOUNTS } from '../utils/constants';
import { getRoleDashboardPath } from '../utils/authRedirect';

const DemoSwitcherModal = ({ isOpen, onClose, onDemoStart }) => {
  const { user, loginDemo } = useAuth();
  const navigate = useNavigate();
  const [activePersona, setActivePersona] = useState(null);
  const [error, setError] = useState('');
  const firstOptionRef = useRef(null);
  const activePersonaRef = useRef(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return undefined;
    setError('');
    firstOptionRef.current?.focus();

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !activePersonaRef.current) onCloseRef.current();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelect = async (account) => {
    if (activePersona) return;
    setError('');
    onDemoStart?.();
    activePersonaRef.current = account.id;
    setActivePersona(account.id);

    try {
      const response = await loginDemo(account.id);
      if (!response.success) throw new Error('Demo sign-in could not be completed.');
      onClose();
      navigate(getRoleDashboardPath(response.user.role), { replace: true });
    } catch (authError) {
      setError(authError.message || 'Demo sign-in is temporarily unavailable.');
    } finally {
      activePersonaRef.current = null;
      setActivePersona(null);
    }
  };

  const getIcon = (accountId) => {
    if (accountId === 'admin') return <Shield className="h-4 w-4 text-violet-700" aria-hidden="true" />;
    if (accountId.endsWith('officer')) return <Briefcase className="h-4 w-4 text-blue-800" aria-hidden="true" />;
    return <User className="h-4 w-4 text-emerald-700" aria-hidden="true" />;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !activePersona) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="demo-dialog-title"
        aria-describedby="demo-dialog-description"
        className="w-full max-w-sm rounded-xl border border-slate-200 bg-white shadow-xl"
      >
        <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-800">Civic360 AI</p>
            <h2 id="demo-dialog-title" className="mt-1 text-lg font-bold text-slate-950">Demo Environment</h2>
            <p id="demo-dialog-description" className="mt-1 text-sm text-slate-500">Select a demo role to continue.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={Boolean(activePersona)}
            aria-label="Close demo role selection"
            className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-700 disabled:opacity-50"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="space-y-2 p-4" aria-busy={Boolean(activePersona)}>
          {error && (
            <p className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800" role="alert">
              {error}
            </p>
          )}
          {DEMO_ACCOUNTS.map((account, index) => {
            const isCurrent = Boolean(
              user?.isDemo
              && user.role === account.authRole
              && user.department === account.department
            );
            const isLoading = activePersona === account.id;

            return (
              <button
                key={account.id}
                ref={index === 0 ? firstOptionRef : undefined}
                type="button"
                disabled={Boolean(activePersona)}
                aria-pressed={isCurrent}
                onClick={() => handleSelect(account)}
                className={`flex w-full items-center gap-3 rounded-lg border px-3.5 py-3 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-700 disabled:cursor-wait disabled:opacity-60 ${
                  isCurrent ? 'border-blue-700 bg-blue-50' : 'border-slate-200 hover:border-blue-400 hover:bg-slate-50'
                }`}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                  {getIcon(account.id)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-slate-900">{account.role}</span>
                  <span className="mt-0.5 block truncate text-xs text-slate-500">{account.name}</span>
                </span>
                <span className="shrink-0 text-xs font-medium text-blue-800">
                  {isLoading ? 'Signing in…' : isCurrent ? <Check className="h-4 w-4" aria-label="Current role" /> : 'Continue'}
                </span>
              </button>
            );
          })}
        </div>

        <p className="border-t border-slate-100 px-5 py-3 text-xs leading-5 text-slate-500">
          Demo access is available only in local development. No password is needed here.
        </p>
      </section>
    </div>
  );
};

export default DemoSwitcherModal;
