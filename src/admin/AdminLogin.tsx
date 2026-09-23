import React, { useState } from 'react';
import { dataService } from '../lib/dataService';
import {
  loginAdminWithFirebase,
  createAdminWithFirebase,
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
  UserPlus,
  LogIn
} from 'lucide-react';

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
  const [mode, setMode] = useState<'login' | 'register' | 'fallback'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle Firebase Email/Password Login
  const handleFirebaseLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!email.trim() || !password) {
      setError('कृपया इमेल र पासवर्ड प्रविष्ट गर्नुहोस्।');
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
      setError(result.error || 'Firebase प्रमाणीकरण असफल भयो।');
    }
  };

  // Handle Firebase New Admin Registration
  const handleFirebaseRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!email.trim() || !password) {
      setError('कृपया इमेल र पासवर्ड प्रविष्ट गर्नुहोस्।');
      return;
    }
    if (password.length < 6) {
      setError('पासवर्ड कम्तिमा ६ अक्षर वा अंकको हुनुपर्छ।');
      return;
    }
    if (password !== confirmPassword) {
      setError('दुबै पासवर्ड मेल खाएनन्। कृपया पुनः जाँच गर्नुहोस्।');
      return;
    }

    setIsSubmitting(true);
    const result = await createAdminWithFirebase(email, password);
    setIsSubmitting(false);

    if (result.success && result.user) {
      setSuccessMsg('Firebase मा प्रशासक खाता सफलतापूर्वक सिर्जना भयो! लगइन गरिँदैछ...');
      const admin = dataService.setAdminFromFirebase({
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
      });
      setTimeout(() => {
        onAdminLoggedIn(admin);
        navigate(`/${adminSlug}/dashboard`);
      }, 1000);
    } else {
      setError(result.error || 'खाता सिर्जना असफल भयो।');
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
      setError(result.error || 'Google प्रमाणीकरण असफल भयो।');
    }
  };

  // Emergency Master Passcode Fallback
  const handleFallbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const result = dataService.loginAdmin(email, password);
    if (!result.success || !result.admin) {
      setError(result.error || 'मास्टर क्रेडेंसियल मिलेन।');
      return;
    }
    onAdminLoggedIn(result.admin);
    navigate(`/${adminSlug}/dashboard`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-slate-950 font-sans selection:bg-red-500 selection:text-white">
      <div className="max-w-md w-full bg-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-gradient-to-tr from-amber-600 via-orange-600 to-red-600 rounded-2xl flex items-center justify-center mx-auto text-2xl shadow-lg shadow-red-600/30">
            <Flame className="w-8 h-8 text-white fill-amber-300" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] font-bold tracking-wide uppercase">
            <span>🔥 Firebase Authentication</span>
            <span className="text-slate-400 font-mono">({firebaseConfig.projectId})</span>
          </div>

          <h1 className="text-2xl font-black text-white">क्विज मास्टर लगइन</h1>
          <p className="text-xs text-slate-400">
            दार्चुला बहुमुखी क्याम्पस साप्ताहिक हाजिरी जवाफ व्यवस्थापन
          </p>
          <div className="text-[11px] font-mono text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-md inline-block border border-slate-700">
            URL: <span className="text-red-400 font-bold">quize.fsudmc.com/{adminSlug}</span>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="grid grid-cols-2 gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60 text-xs">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError('');
              setSuccessMsg('');
            }}
            className={`py-2 rounded-lg font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'login'
                ? 'bg-red-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Firebase लगइन</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError('');
              setSuccessMsg('');
            }}
            className={`py-2 rounded-lg font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'register'
                ? 'bg-red-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>खाता सिर्जना</span>
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="p-3.5 rounded-xl bg-red-950/80 border border-red-800 text-red-300 text-xs flex items-start gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs flex items-start gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form: Firebase Login */}
        {mode === 'login' && (
          <form onSubmit={handleFirebaseLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Firebase प्रशासक इमेल
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@fsudmc.com वा info@fsudmc.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-hidden focus:ring-2 focus:ring-red-500 font-mono"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Firebase पासवर्ड
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-hidden focus:ring-2 focus:ring-red-500 font-mono tracking-widest"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-bold text-sm rounded-xl shadow-lg shadow-red-600/25 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <span>प्रमाणीकरण हुँदैछ...</span>
              ) : (
                <>
                  <span>Firebase मार्फत लगइन</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Google Login Alternative */}
            <div className="relative my-3 text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800" />
              </div>
              <span className="relative px-2 bg-slate-900 text-slate-500 text-[11px] uppercase font-bold">
                वा
              </span>
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isSubmitting}
              className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl border border-slate-700 transition flex items-center justify-center gap-2.5 cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
                />
                <path
                  fill="#4285F4"
                  d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3 0-.8.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15.2c0 2.8.7 5.5 1.9 7.8l3.7-2.9z"
                />
                <path
                  fill="#34A853"
                  d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16.5C3.7 20.3 7.5 23.5 12 23.5z"
                />
              </svg>
              <span>Google खाता मार्फत प्रशासक लगइन</span>
            </button>
          </form>
        )}

        {/* Form: Firebase New Admin Register */}
        {mode === 'register' && (
          <form onSubmit={handleFirebaseRegister} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                नयाँ प्रशासक इमेल
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@fsudmc.com वा तपाईंको इमेल"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-hidden focus:ring-2 focus:ring-red-500 font-mono"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                नयाँ पासवर्ड (कम्तिमा ६ अक्षर)
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-hidden focus:ring-2 focus:ring-red-500 font-mono tracking-widest"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                पासवर्ड पुनः पुष्टि गर्नुहोस्
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-hidden focus:ring-2 focus:ring-red-500 font-mono tracking-widest"
                />
                <ShieldCheck className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-600/25 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <span>खाता बनाइँदैछ...</span>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Firebase मा प्रशासक दर्ता गर्नुहोस्</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Fallback Master Key */}
        {mode === 'fallback' && (
          <form onSubmit={handleFallbackSubmit} className="space-y-4">
            <div className="p-3 bg-amber-950/40 border border-amber-800/80 rounded-xl text-amber-200 text-xs">
              <span className="font-bold block mb-1">⚠️ अफलाइन वा आपतकालीन मास्टर लगइन:</span>
              इन्टरनेट वा Firebase Console कन्सोल कन्फिगर नभएको अवस्थामा क्याम्पस मास्टर पिन प्रयोग गर्न सकिन्छ।
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                प्रशासक प्रयोगकर्ता
              </label>
              <input
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="info@fsudmc.com वा quizemaster"
                className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                मास्टर पासकोड / पिन
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="fsu@dmc2026 वा 1234"
                className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm font-mono tracking-widest"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-xl cursor-pointer"
            >
              मास्टर लगइन गर्नुहोस्
            </button>
          </form>
        )}

        {/* Bottom Options & Quick Switch */}
        <div className="pt-4 border-t border-slate-800 text-xs text-slate-400 space-y-3">
          <div className="flex items-center justify-between">
            {mode !== 'fallback' ? (
              <button
                type="button"
                onClick={() => {
                  setMode('fallback');
                  setEmail('info@fsudmc.com');
                  setPassword('fsu@dmc2026');
                }}
                className="text-slate-400 hover:text-amber-400 flex items-center gap-1 cursor-pointer transition text-[11px]"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>आपतकालीन मास्टर पिन प्रयोग?</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-red-400 hover:underline cursor-pointer text-[11px]"
              >
                ← Firebase लगइनमा फर्कनुहोस्
              </button>
            )}

            <div className="flex items-center gap-1 text-[11px] text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Firebase Active</span>
            </div>
          </div>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="text-slate-400 hover:text-white transition cursor-pointer text-xs"
            >
              ← विद्यार्थी पोर्टलमा फर्कनुहोस्
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
