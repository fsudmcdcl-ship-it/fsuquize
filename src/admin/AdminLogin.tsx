import React, { useState } from 'react';
import { dataService } from '../lib/dataService';
import {
  loginAdminWithFirebase,
  loginAdminWithGoogle,
  firebaseConfig,
} from '../lib/firebase';
import type { AdminUser } from '../types/quiz';
import {
  Lock,
  Mail,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Flame,
  CheckCircle2,
  KeyRound,
  LogIn,
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

  // Handle Firebase Google Login
  const handleGoogleLogin = async () => {
    setError('');
    setSuccessMsg('');
    setIsSubmitting(true);
    const result = await loginAdminWithGoogle();
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
      setError(result.error || (lang === 'ne' ? 'Google प्रमाणीकरण असफल भयो।' : 'Google authentication failed.'));
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

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-gradient-to-tr from-amber-600 via-orange-600 to-red-600 rounded-2xl flex items-center justify-center mx-auto text-2xl shadow-lg shadow-red-600/30">
            <Flame className="w-8 h-8 text-white fill-amber-300" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] font-bold tracking-wide uppercase">
            <span>🔥 Firebase Authentication</span>
            <span className="text-slate-400 font-mono">({firebaseConfig.projectId})</span>
          </div>

          <h1 className="text-2xl font-black text-white">{t.loginTitle}</h1>
          <p className="text-xs text-slate-400">
            {t.loginSubtitle}
          </p>
          <div className="text-[11px] font-mono text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-md inline-block border border-slate-700">
            URL: <span className="text-red-400 font-bold">quize.fsudmc.com/{adminSlug}</span>
          </div>
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
                    placeholder="info@fsudmc.com"
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

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-slate-800"></div>
              <span className="shrink-0 mx-4 text-[10px] text-slate-500 uppercase tracking-widest font-bold">वा</span>
              <div className="flex-grow border-t border-slate-800"></div>
            </div>

            {/* Google Login Button */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isSubmitting}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5c1.54 0 2.93.53 4.02 1.41l3.01-3.01C17.21 1.7 14.77 1 12 1 7.42 1 3.55 3.6 1.7 7.4l3.66 2.84C6.24 7.37 8.87 5 12 5z"
                />
                <path
                  fill="#4285F4"
                  d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58l3.71 2.88c2.17-2 3.71-4.96 3.71-8.7z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.36 14.76c-.22-.66-.36-1.37-.36-2.11s.14-1.45.36-2.11L1.7 7.7C.62 9.85 0 12.28 0 14.85s.62 5 1.7 7.15l3.66-2.84z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c3.24 0 5.95-1.08 7.93-2.91l-3.71-2.88c-1.07.72-2.45 1.16-4.22 1.16-3.13 0-5.76-2.37-6.64-5.24L1.7 16c1.85 3.8 5.72 6.4 10.3 6.4z"
                />
              </svg>
              <span>{t.loginWithGoogle}</span>
            </button>

            {/* Switch to Emergency Fallback */}
            <div className="pt-2 text-center">
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
                  placeholder="info@fsudmc.com वा admin"
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
                  placeholder="1234 वा admin123"
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
