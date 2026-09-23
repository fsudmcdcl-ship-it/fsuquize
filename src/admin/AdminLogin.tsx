import React, { useState } from 'react';
import { dataService } from '../lib/dataService';
import type { AdminUser } from '../types/quiz';
import { Lock, Mail, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';

interface AdminLoginProps {
  adminSlug?: string;
  onAdminLoggedIn: (admin: AdminUser) => void;
  navigate: (path: string) => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ adminSlug = 'fsu-dmc-master-x891', onAdminLoggedIn, navigate }) => {
  const [email, setEmail] = useState('');
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    setIsSubmitting(true);
    const result = dataService.loginAdmin(email, passcode);
    setIsSubmitting(false);

    if (!result.success || !result.admin) {
      setError(result.error || 'प्रशासक इमेल वा पासकोड मिलेन।');
      return;
    }

    onAdminLoggedIn(result.admin);
    navigate(`/${adminSlug}/dashboard`);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-slate-900 text-white rounded-3xl p-8 border border-slate-800 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-red-600 rounded-2xl flex items-center justify-center mx-auto text-2xl shadow-lg shadow-red-600/30">
            🛡️
          </div>
          <span className="text-xs font-bold text-red-400 tracking-widest uppercase block">
            FSU DMC Admin Portal
          </span>
          <h1 className="text-2xl font-black text-white">क्विज मास्टर लगइन</h1>
          <p className="text-xs text-slate-400">
            क्याम्पस क्विज पोर्टल व्यवस्थापन गर्न आधिकारिक प्रशासनिक लगइन
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-950/80 border border-red-800 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              प्रशासक इमेल वा युजरनेम
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="info@fsudmc.com वा quizemaster"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-hidden focus:ring-2 focus:ring-red-500 font-mono"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              पासकोड वा पिन (PIN)
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={passcode}
                onChange={e => setPasscode(e.target.value)}
                placeholder="••••"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-hidden focus:ring-2 focus:ring-red-500 font-mono tracking-widest"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-red-600/25 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>प्रशासक लगइन गर्नुहोस्</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick autofill helper for development and verification */}
        <div className="pt-4 border-t border-slate-800 text-xs text-slate-400">
          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/80 space-y-1">
            <span className="font-bold text-slate-300 block">पूर्वनिर्धारित मास्टर क्रेडेंसियल:</span>
            <p className="font-mono text-slate-400">इमेल: <b className="text-white">admin@fsudmc.com</b></p>
            <p className="font-mono text-slate-400">पिन: <b className="text-white">1234</b></p>
            <button
              type="button"
              onClick={() => {
                setEmail('admin@fsudmc.com');
                setPasscode('1234');
              }}
              className="text-red-400 font-bold text-xs hover:underline mt-1 cursor-pointer block"
            >
              स्वतः विवरण भर्नुहोस्
            </button>
          </div>

          <div className="text-center pt-4">
            <button
              onClick={() => navigate('/')}
              className="text-slate-400 hover:text-white transition"
            >
              ← विद्यार्थी पोर्टलमा फर्कनुहोस्
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
