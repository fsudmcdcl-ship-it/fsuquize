import React, { useState } from 'react';
import { dataService } from '../lib/dataService';
import type { Student } from '../types/quiz';
import { Lock, User, AlertCircle, ArrowRight, Eye, EyeOff, HelpCircle, UserPlus, Loader2, Shield } from 'lucide-react';
import { fromNepaliDigits } from '../lib/nepaliUtils';

interface LoginPageProps {
  navigate: (path: string) => void;
  onStudentLoggedIn: (student: Student) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ navigate, onStudentLoggedIn }) => {
  const [studentId, setStudentId] = useState('');
  const [passcode, setPasscode] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const [error, setError] = useState('');
  const [helpModalOpen, setHelpModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [kickoutAlert, setKickoutAlert] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const reason = sessionStorage.getItem('student_kickout_reason');
      if (reason) {
        sessionStorage.removeItem('student_kickout_reason');
        if (reason === 'blocked') {
          return '🚫 तपाईंको विद्यार्थी खाता क्याम्पस प्रशासनद्वारा बन्द (Blocked) गरिएको छ। तपाईंको उपकरणबाट स्वचालित रूपमा लगआउट गरिएको छ।';
        }
        if (reason === 'suspended') {
          return '⚠️ तपाईंको विद्यार्थी खाता क्याम्पस प्रशासनद्वारा निलम्बन (Suspended) गरिएको छ। तपाईंको उपकरणबाट स्वचालित रूपमा लगआउट गरिएको छ।';
        }
        if (reason === 'deleted') {
          return 'ℹ️ तपाईंको विद्यार्थी खाता प्रणालीबाट हटाइएको छ। तपाईं यस उपकरणबाट स्वचालित रूपमा लगआउट हुनुभएको छ।';
        }
        return '⚠️ तपाईंको विद्यार्थी खाता स्थिति परिवर्तन भएकाले सुरक्षाका लागि स्वतः लगआउट गरिएको छ।';
      }
    }
    return null;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanId = fromNepaliDigits(studentId.trim());
    const cleanPass = fromNepaliDigits(passcode.trim()).replace(/\D/g, '');

    if (!cleanId) {
      setError('कृपया आफ्नो विद्यार्थी ID, फोन वा रोल नम्बर प्रविष्ट गर्नुहोस्।');
      return;
    }
    if (!cleanPass) {
      setError('कृपया ४ अंकको पासकोड प्रविष्ट गर्नुहोस्।');
      return;
    }

    // Auto-detect if admin accidentally tried logging in here
    if (cleanId.toLowerCase().includes('admin') || cleanId.toLowerCase().includes('quizemaster') || cleanId.toLowerCase() === 'info@fsudmc.com') {
      const adminResult = dataService.loginAdmin(cleanId, cleanPass);
      if (adminResult.success) {
        navigate('/admin');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const result = await dataService.loginStudent(cleanId, cleanPass);
      setIsSubmitting(false);

      if (!result.success || !result.student) {
        if (result.technicalError) {
          console.error('Technical Login Failure:', result.technicalError);
        }
        setError(result.error || 'विद्यार्थी ID वा पासकोड मिलेन।');
        return;
      }

      onStudentLoggedIn(result.student);
      if (result.student.status === 'pending' || result.student.status === 'rejected') {
        navigate('/pending');
      } else {
        navigate('/dashboard');
      }
    } catch (err: unknown) {
      setIsSubmitting(false);
      console.error('Unhandled login exception:', err);
      setError('लगइन गर्दा प्राविधिक समस्या आयो। कृपया इन्टरनेट जडान जाँच्नुहोस्।');
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-md">
        {/* Header */}
        <div className="text-center mb-8 border-b border-slate-100 pb-6">
          <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-3 text-xl font-bold">
            🎓
          </div>
          <h1 className="text-2xl font-black text-slate-900">विद्यार्थी लगइन</h1>
          <p className="text-slate-500 text-xs mt-1">
            FSU DMC साप्ताहिक क्विज पोर्टलमा स्वागत छ
          </p>
        </div>

        {kickoutAlert && (
          <div className="mb-5 p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs leading-relaxed flex items-start gap-2.5 animate-in fade-in shadow-xs">
            <Shield className="w-5 h-5 shrink-0 mt-0.5 text-amber-600" />
            <div className="flex-1 font-medium">{kickoutAlert}</div>
          </div>
        )}

        {error && (
          <div className="mb-5 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs leading-relaxed flex items-start gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Student ID / Phone / Roll */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              विद्यार्थी ID / फोन नम्बर / रोल नम्बर *
            </label>
            <div className="relative">
              <input
                type="text"
                required
                autoComplete="username"
                value={studentId}
                onChange={e => setStudentId(fromNepaliDigits(e.target.value.trim()))}
                placeholder="उदा. FSU25678 वा 9812345678 वा 25"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-red-500 text-sm font-mono font-bold tracking-wide"
              />
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              दर्ता गर्दा प्राप्त भएको ID (उदा. FSU25678), फोन नम्बर वा रोल नम्बर प्रयोग गर्नुहोस्
            </p>
          </div>

          {/* 4-digit Passcode */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                ४ अंकको पासकोड (PIN) *
              </label>
              <button
                type="button"
                onClick={() => setHelpModalOpen(true)}
                className="text-[11px] text-red-600 hover:underline font-semibold"
              >
                पासकोड/लगइन सहायता?
              </button>
            </div>
            <div className="relative">
              <input
                type={showPasscode ? 'text' : 'password'}
                required
                maxLength={4}
                autoComplete="current-password"
                value={passcode}
                onChange={e => setPasscode(fromNepaliDigits(e.target.value).replace(/\D/g, ''))}
                placeholder="••••"
                className="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-red-500 text-sm font-mono tracking-widest font-bold"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <button
                type="button"
                onClick={() => setShowPasscode(!showPasscode)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPasscode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 bg-red-600 hover:bg-red-700 disabled:opacity-70 disabled:cursor-not-allowed text-white font-bold text-sm rounded-xl shadow-md shadow-red-600/25 transition flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>लगइन हुँदैछ...</span>
              </>
            ) : (
              <>
                <span>लगइन गर्नुहोस्</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {/* Inside Login: Prominent Register Option */}
          <div className="pt-5 border-t border-slate-100">
            <div className="bg-gradient-to-br from-rose-50 to-red-50/60 rounded-2xl p-4 border border-rose-200/80 text-center space-y-2.5">
              <span className="text-xs font-bold text-slate-800 block">
                नयाँ विद्यार्थी हुनुहुन्छ? (Not Registered Yet?)
              </span>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                साप्ताहिक हाजिरी जवाफ प्रतियोगितामा सहभागी हुन पहिले क्याम्पस विद्यार्थी दर्ता गर्नुहोस्।
              </p>
              <button
                type="button"
                onClick={() => navigate('/register')}
                className="w-full py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>नयाँ विद्यार्थी दर्ता गर्नुहोस् (Register Now)</span>
              </button>
            </div>

            <div className="pt-4 text-center">
              <button
                type="button"
                onClick={() => navigate('/admin/login')}
                className="text-slate-400 hover:text-slate-600 text-xs font-semibold inline-flex items-center gap-1.5 transition"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>प्रशासक (Admin) लगइन पोर्टल</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Help Modal */}
      {helpModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-lg">
              <HelpCircle className="w-5 h-5 text-red-600" />
              <span>पासकोड तथा लगइन सहायता</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              यदि तपाईंले आफ्नो ४ अंकको पासकोड बिर्सनुभयो वा विद्यार्थी ID हराउनुभयो भने आफ्नो परिचयपत्र (क्याम्पस कार्ड) सहित स्ववियु (FSU) सचिवालय वा क्विज मास्टरसँग सम्पर्क गर्नुहोस्।
            </p>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
              <p><b>सम्पर्क:</b> FSU दार्चुला बहुमुखी क्याम्पस सचिवालय</p>
              <p><b>इमेल:</b> info@fsudmc.com</p>
              <p><b>फोन:</b> ९७४१८२३१२२</p>
            </div>
            <button
              onClick={() => setHelpModalOpen(false)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl transition cursor-pointer"
            >
              बुझें (बन्द गर्नुहोस्)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
