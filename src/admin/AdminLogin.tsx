import React, { useState } from 'react';
import { dataService } from '../lib/dataService';
import {
  loginAdminWithFirebase,
} from '../lib/firebase';
import type { AdminUser } from '../types/quiz';
import {
  Lock,
  Mail,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  KeyRound,
  Globe
} from 'lucide-react';
import {
  getAdminLanguage,
  setAdminLanguage,
  adminTranslations,
  type AdminLanguage
} from './adminTranslations';

interface AdminLoginProps {
  adminSlug?: string;
  onAdminLoggedIn: (admin: AdminUser) => void;
  navigate: (path: string) => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({
  adminSlug = 'quizemasteradmin',
  onAdminLoggedIn,
  navigate,
}) => {
  const [lang, setLang] = useState<AdminLanguage>(getAdminLanguage);
  const [mode, setMode] = useState<'login' | 'fallback'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const t = adminTranslations[lang];

  const handleLanguageToggle = () => {
    const nextLang: AdminLanguage = lang === 'ne' ? 'en' : 'ne';
    setLang(nextLang);
    setAdminLanguage(nextLang);
  };

  // Handle Firebase Email/Password Login
  const handleFirebaseLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!email.trim() || !password) {
      setError(lang === 'ne' ? 'कृपया इमेल र पासवर्ड प्रविष्ट गर्नुहोस्।' : 'Please enter your admin email and password.');
      return;
    }

    setIsSubmitting(true);
    const result = await loginAdminWithFirebase(email, password);
    setIsSubmitting(false);

    if (result.success && result.user) {
      const admin = dataService.setAdminFromFirebase({
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
      });
      onAdminLoggedIn(admin);
      navigate(`/${adminSlug}/dashboard`);
    } else {
      setError(result.error || (lang === 'ne' ? 'Firebase प्रमाणीकरण असफल भयो।' : 'Firebase authentication failed.'));
    }
  };

  // Emergency Master Passcode Fallback
  const handleFallbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const result = dataService.loginAdmin(email, password);
    if (!result.success || !result.admin) {
      setError(result.error || (lang === 'ne' ? 'मास्टर क्रेडेंसियल मिलेन।' : 'Master credentials invalid.'));
      return;
    }
    onAdminLoggedIn(result.admin);
    navigate(`/${adminSlug}/dashboard`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-slate-950 font-sans selection:bg-red-500 selection:text-white">
      <div className="max-w-md w-full bg-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl space-y-6 relative">
        {/* Language Switcher in header */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="text-xs text-slate-400 hover:text-slate-200 transition"
          >
            {t.backToStudentPortal}
          </button>
          <button
            type="button"
            onClick={handleLanguageToggle}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 border border-slate-700 transition"
          >
            <Globe className="w-3.5 h-3.5 text-red-400" />
            <span>{lang === 'ne' ? 'English' : 'नेपाली'}</span>
          </button>
        </div>

        {/* Header - Cleaned without exposed IDs or hardcoded URLs */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-gradient-to-tr from-red-600 via-rose-600 to-amber-500 rounded-2xl flex items-center justify-center mx-auto text-2xl shadow-lg shadow-red-600/30">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-300 text-[11px] font-bold tracking-wide uppercase">
            <span>सुरक्षित प्रशासक पोर्टल</span>
          </div>

          <h1 className="text-2xl font-black text-white">{t.loginTitle}</h1>
          <p className="text-xs text-slate-400">
            {t.loginSubtitle}
          </p>
        </div>

        {/* Alert Messages */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-red-950/70 border border-red-800/80 text-red-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
            <div className="flex-1">
              <p className="font-semibold">{error}</p>
            </div>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 rounded-2xl bg-emerald-950/70 border border-emerald-800/80 text-emerald-300 text-xs flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
            <div className="flex-1">
              <p className="font-semibold">{successMsg}</p>
            </div>
          </div>
        )}

        {/* Standard Login Form */}
        {mode === 'login' && (
          <div className="space-y-4">
            <form onSubmit={handleFirebaseLogin} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                  {t.emailLabel}
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder={lang === 'ne' ? 'प्रशासक इमेल' : 'Admin email'}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-hidden focus:border-red-500 focus:ring-1 focus:ring-red-500 font-mono"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                  {t.passwordLabel}
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-hidden focus:border-red-500 focus:ring-1 focus:ring-red-500"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md shadow-red-600/30 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <span>{t.loggingIn}</span>
                ) : (
                  <>
                    <span>{t.loginButton}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Switch to Emergency Fallback */}
            <div className="pt-2 text-center border-t border-slate-800/80">
              <button
                type="button"
                onClick={() => {
                  setMode('fallback');
                  setError('');
                }}
                className="text-[11px] text-slate-400 hover:text-amber-400 flex items-center justify-center gap-1 mx-auto transition cursor-pointer"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>{t.emergencyMasterLogin}</span>
              </button>
            </div>
          </div>
        )}

        {/* Emergency Master PIN Fallback Form */}
        {mode === 'fallback' && (
          <form onSubmit={handleFallbackSubmit} className="space-y-4 animate-in fade-in">
            <div className="p-3 bg-amber-950/40 border border-amber-800/60 rounded-xl text-amber-300 text-xs">
              <p className="font-bold flex items-center gap-1.5 mb-1">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>{t.emergencyTitle}</span>
              </p>
              <p className="text-[11px] text-amber-200/80 leading-relaxed">
                {t.emergencyDesc}
              </p>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                {t.masterUsername}
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder={lang === 'ne' ? 'प्रयोगकर्ता नाम वा इमेल' : 'Username or email'}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-hidden focus:border-red-500 focus:ring-1 focus:ring-red-500 font-mono"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                {t.masterPin}
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-hidden focus:border-red-500 focus:ring-1 focus:ring-red-500 font-mono"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-md shadow-amber-600/30 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{t.submitMaster}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError('');
              }}
              className="w-full py-2 text-xs text-slate-400 hover:text-white transition cursor-pointer text-center block"
            >
              {t.backToLogin}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
