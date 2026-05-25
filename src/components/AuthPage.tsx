import React, { useState } from 'react';
import { Mail, Lock, User as UserIcon } from 'lucide-react';
import { User } from '../types';
import { sendPasswordReset, signInWithPassword, signUpWithPassword } from '../services/auth';

interface AuthPageProps {
  onLogin: (user: User) => void | Promise<void>;
}

export default function AuthPage({ onLogin }: AuthPageProps) {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleForgotPassword = async () => {
    setErrorMsg('');
    setInfoMsg('');
    if (!email) {
      setErrorMsg('Enter your email address first, then request a reset link.');
      return;
    }

    setIsSubmitting(true);
    try {
      await sendPasswordReset(email);
      setInfoMsg('Password reset link sent. Check your email inbox.');
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : 'Could not send reset link.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');

    if (!email || !password || (activeTab === 'register' && !name)) {
      setErrorMsg('Please populate all required fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      const authenticatedUser = activeTab === 'login'
        ? await signInWithPassword(email, password)
        : await signUpWithPassword(email, password, name);

      if (!authenticatedUser) {
        setInfoMsg('Account created. Please confirm your email, then log in.');
        setActiveTab('login');
        return;
      }

      await onLogin(authenticatedUser);
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : 'Authentication failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-grow flex flex-col items-center justify-center px-4 py-16 relative overflow-hidden min-h-[calc(100vh-48px)]">
      
      {/* Background artwork */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none opacity-5">
        <img 
          className="w-full h-full object-cover" 
          src="https://images.unsplash.com/photo-1611974717535-7c809af05bd7?q=80&w=1200&h=800&auto=format&fit=crop" 
          alt="workstation tech background"
          referrerPolicy="no-referrer"
        />
      </div>

      {/* Auth Card */}
      <div className="auth-card w-full max-w-[420px] bg-surface-container-low border border-outline-variant p-8 rounded-lg relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-40"></div>

        {/* Brand logo in head of card */}
        <div className="flex flex-col items-center gap-2 mb-6">
          <div className="flex items-center gap-2 select-none">
            <span className="font-headline-md text-headline-md font-bold text-primary tracking-tighter uppercase font-mono">ChartPilot</span>
          </div>
          <span className="font-data-mono font-mono text-[9px] text-outline uppercase tracking-wider">Secured Workstation Gateway</span>
        </div>

        {/* Tab switchers */}
        <div className="flex border-b border-outline-variant mb-6">
          <button 
            type="button"
            onClick={() => { setActiveTab('login'); setErrorMsg(''); }}
            className={`flex-1 py-2 font-label-caps text-center text-xs tracking-wider font-semibold transition-all ${
              activeTab === 'login' 
                ? 'text-primary border-b-2 border-primary' 
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            LOGIN
          </button>
          <button 
            type="button"
            onClick={() => { setActiveTab('register'); setErrorMsg(''); }}
            className={`flex-1 py-2 font-label-caps text-center text-xs tracking-wider font-semibold transition-all ${
              activeTab === 'register' 
                ? 'text-primary border-b-2 border-primary' 
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            REGISTER
          </button>
        </div>

        {/* Tab contents */}
        <div className="space-y-4">
          <div className="space-y-1">
            <h2 className="font-headline-md text-base text-on-surface font-bold">
              {activeTab === 'login' ? 'Welcome back' : 'Create Workstation Account'}
            </h2>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              {activeTab === 'login' 
                ? 'Enter your credentials to access the workstation.' 
                : 'Configure your profile to deploy and backtest strategies.'}
            </p>
          </div>

          {errorMsg && (
            <div className="p-2.5 bg-error/10 border border-error/30 text-error rounded text-xs">
              {errorMsg}
            </div>
          )}

          {infoMsg && (
            <div className="p-2.5 bg-primary/10 border border-primary/30 text-primary rounded text-xs">
              {infoMsg}
            </div>
          )}

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {activeTab === 'register' && (
              <div className="space-y-1">
                <label className="font-label-caps text-[10px] text-outline uppercase tracking-wider font-bold">Your Name</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-outline w-4 h-4" />
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-surface-container-lowest border border-outline-variant text-on-surface py-2 pl-10 pr-4 rounded text-xs focus:border-primary focus:ring-0 outline-none transition-all font-sans" 
                    placeholder="Alex Rivera"
                    required
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="font-label-caps text-[10px] text-outline uppercase tracking-wider font-bold">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-outline w-4 h-4" />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-outline-variant text-on-surface py-2 pl-10 pr-4 rounded text-xs focus:border-primary focus:ring-0 outline-none transition-all font-sans" 
                  placeholder="name@company.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="font-label-caps text-[10px] text-outline uppercase tracking-wider font-bold">Password</label>
                {activeTab === 'login' && (
                  <a 
                    href="#forgot" 
                    onClick={(e) => { e.preventDefault(); handleForgotPassword(); }}
                    className="text-[9px] font-label-caps text-primary hover:underline uppercase tracking-tighter font-semibold"
                  >
                    Forgot Password?
                  </a>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-outline w-4 h-4" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-outline-variant text-on-surface py-2 pl-10 pr-4 rounded text-xs focus:border-primary focus:ring-0 outline-none transition-all" 
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {activeTab === 'login' && (
              <div className="flex items-center gap-2 py-1">
                <input 
                  type="checkbox" 
                  id="remember" 
                  defaultChecked
                  className="w-3.5 h-3.5 rounded border-outline-variant bg-surface-container-lowest text-primary focus:ring-primary focus:ring-offset-surface cursor-pointer"
                />
                <label htmlFor="remember" className="text-xs text-on-surface-variant cursor-pointer select-none">
                  Stay authenticated for 30 days
                </label>
              </div>
            )}

            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full bg-primary text-on-primary py-2.5 rounded font-label-caps text-xs font-bold hover:brightness-110 active:opacity-85 transition-all shadow-[0_0_8px_rgba(68,216,241,0.2)] uppercase tracking-wider"
            >
              {isSubmitting ? 'SYNCING...' : activeTab === 'login' ? 'INITIALIZE SESSION' : 'REGISTER WORKSTATION PROFILE'}
            </button>
          </form>

          {/* Divider */}
          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-outline-variant"></div>
            <span className="flex-shrink mx-4 font-label-caps text-[9px] text-outline tracking-wider font-bold">SECURED BY SUPABASE AUTH</span>
            <div className="flex-grow border-t border-outline-variant"></div>
          </div>

          <div className="rounded border border-outline-variant bg-surface-container-lowest p-3 text-center">
            <p className="text-[10px] text-on-surface-variant leading-relaxed uppercase tracking-wider font-bold">
              Email and password sessions are persisted in Supabase and restored on refresh.
            </p>
          </div>
        </div>

        {/* Version footer */}
        <div className="mt-6 pt-5 border-t border-outline-variant text-center">
          <p className="text-xs text-outline">
            System Version: <span className="font-data-mono font-mono text-[11px] text-on-surface-variant font-medium">v2.4.0-supabase</span>
          </p>
        </div>
      </div>

      {/* Floating telemetry labels */}
      <div className="fixed left-6 bottom-6 flex flex-col gap-1 pointer-events-none opacity-30 select-none hidden lg:flex font-mono text-outline text-[9px] uppercase tracking-widest font-bold">
        <div className="w-24 h-[3px] bg-outline-variant rounded-full overflow-hidden">
          <div className="w-2/3 h-full bg-primary"></div>
        </div>
        <span>ENCRYPTION_ACTIVE: AES-256</span>
      </div>

      {/* Security notice footer */}
      <footer className="py-6 mt-6 w-full">
        <div className="max-w-[420px] mx-auto flex items-center justify-center gap-3 text-outline text-[9px] uppercase tracking-widest font-mono">
          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[13px]">verified_user</span>
            <span>Secured by ChartPilot Auth</span>
          </div>
          <div className="w-1 h-1 bg-outline rounded-full"></div>
          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[13px]">public</span>
            <span>Global Nodes: 124</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
