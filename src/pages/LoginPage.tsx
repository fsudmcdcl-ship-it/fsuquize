import React, { useState } from 'react';
import { dataService } from '../lib/dataService';
import type { Student } from '../types/quiz';
import { Lock, User, AlertCircle, ArrowRight, Eye, EyeOff, HelpCircle, UserPlus, Loader2, Shield, KeyRound, CheckCircle2, X } from 'lucide-react';
import { fromNepaliDigits, toNepaliDigits } from '../lib/nepaliUtils';

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

  // Password Reset Modal states
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetName, setResetName] = useState('');
  const [resetPhone, setResetPhone] = useState('');
  const [resetClass, setResetClass] = useState('');
  const [resetSemester, setResetSemester] = useState('प्रथम वर्ष / Semester');
  const [resetRollNo, setResetRollNo] = useState('');
  const [resetNewPass, setResetNewPass] = useState('');
  const [resetConfirmPass, setResetConfirmPass] = useState('');
  const [resetShowPass, setResetShowPass] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);
  const [resetSubmitting, setResetSubmitting] = useState(false);

  const handleResetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    setResetSuccessMessage(null);

    const cleanPass = fromNepaliDigits(resetNewPass.trim()).replace(/\D/g, '');
    const cleanConfirm = fromNepaliDigits(resetConfirmPass.trim()).replace(/\D/g, '');

    if (cleanPass.length !== 4) {
      setResetError('नयाँ पासकोड ठीक ४ अंकको हुनुपर्छ।');
      return;
    }
    if (cleanPass !== cleanConfirm) {
      setResetError('नयाँ पासकोड र पुष्टि पासकोड मिलेन। कृपया दुबैमा एउटै ४ अंक राख्नुहोस्।');
      return;
    }

    setResetSubmitting(true);
    try {
      const res = dataService.requestPasswordReset({
        name: resetName,
        phone: resetPhone,
        studentClass: resetClass,
        semester: resetSemester,
        rollNo: resetRollNo,
        newPasscode: cleanPass,
      });

      setResetSubmitting(false);
      if (!res.success) {
        setResetError(res.error || 'विवरण मिलेन।');
        return;
      }

      setResetSuccessMessage(res.message || 'अनुरोध पेस भयो।');
    } catch {
      setResetSubmitting(false);
      setResetError('अनुरोध पठाउँदा समस्या आयो। कृपया पुन: प्रयास गर्नुहोस्।');
    }
  };

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
      setError('कृपया आफ्नो विद्यार्थी ID वा दर्ता गरिएको मोबाइल नम्बर प्रविष्ट गर्नुहोस्।');
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
        navigate('/quizemasteradmin');
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
          {/* Student ID or Phone */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              विद्यार्थी ID वा दर्ता गरिएको मोबाइल नम्बर (Student ID / Phone) *
            </label>
            <div className="relative">
              <input
                type="text"
                required
                autoComplete="username"
                value={studentId}
                onChange={e => setStudentId(fromNepaliDigits(e.target.value.trim()))}
                placeholder="विद्यार्थी ID (उदा. FSU...) वा १० अंकको मोबाइल नं."
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-red-500 text-sm font-bold tracking-wide"
              />
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              आफ्नो आधिकारिक विद्यार्थी ID वा दर्ता गर्दा प्रयोग गरिएको १०-अंकको मोबाइल नम्बर राख्नुहोस्
            </p>
          </div>

          {/* 4-digit Passcode */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                ४ अंकको पासकोड (PIN) *
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setResetError('');
                    setResetSuccessMessage(null);
                    setResetModalOpen(true);
                  }}
                  className="text-[11px] text-red-600 hover:text-red-700 font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <KeyRound className="w-3 h-3" />
                  <span>पासवर्ड रिसेट</span>
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={() => setHelpModalOpen(true)}
                  className="text-[11px] text-slate-500 hover:underline font-semibold"
                >
                  सहायता?
                </button>
              </div>
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
                onClick={() => navigate('/quizemasteradmin')}
                className="text-slate-400 hover:text-slate-600 text-xs font-semibold inline-flex items-center gap-1.5 transition cursor-pointer"
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

      {/* Password Reset Modal */}
      {resetModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl space-y-4 my-auto animate-in zoom-in-95 max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center font-bold">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900">
                    पासवर्ड रिसेट अनुरोध (Reset Password)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    विवरण प्रमाणित भएपछि एडमिनबाट अनुमोदन हुनेछ
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setResetModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {resetSuccessMessage ? (
              <div className="py-4 space-y-4 text-center">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto text-2xl font-bold shadow-xs">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                </div>
                <div className="space-y-2">
                  <h4 className="text-lg font-black text-slate-900">
                    विवरणहरू सफलतापूर्वक प्रमाणीकरण भयो!
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed max-w-md mx-auto">
                    {resetSuccessMessage}
                  </p>
                </div>
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-800 text-left space-y-1">
                  <p className="font-bold flex items-center gap-1.5">
                    <span>ℹ️ अर्को चरण (Next Step):</span>
                  </p>
                  <p className="text-[11px] leading-relaxed">
                    क्याम्पस व्यवस्थापक (Admin) ले तपाईंको यो अनुरोध समीक्षा गरी स्वीकृत (Approve) गर्नेछन्। अनुमोदन हुनासाथ तपाईंले नयाँ ४-अंकको पासकोड प्रयोग गरी लगइन गर्न सक्नुहुनेछ।
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setResetModalOpen(false);
                    setResetSuccessMessage(null);
                  }}
                  className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  बन्द गर्नुहोस् र लगइन पृष्ठमा फर्कनुहोस्
                </button>
              </div>
            ) : (
              <form onSubmit={handleResetSubmit} className="space-y-3.5">
                <div className="p-3 bg-red-50/70 border border-red-200/80 rounded-2xl text-[11px] text-red-800 leading-relaxed">
                  <p className="font-semibold mb-0.5">⚠️ ध्यान दिनुहोस्:</p>
                  पासवर्ड परिवर्तन गर्न तपाईंले साइटमा दर्ता गर्दा राखेका सबै विवरणहरू (<b>पूरा नाम, फोन नम्बर, कक्षा, सेमेस्टर, र रोल नम्बर</b>) हुबहु सही प्रविष्ट गर्नुपर्छ।
                </div>

                {resetError && (
                  <div className="p-3 bg-rose-100 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{resetError}</span>
                  </div>
                )}

                {/* Name */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    १. साइटमा दर्ता गरिएको पूरा नाम (Full Name) *
                  </label>
                  <input
                    type="text"
                    required
                    value={resetName}
                    onChange={e => setResetName(e.target.value)}
                    placeholder="दर्ता गर्दाको पूरा नाम"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-red-500 focus:outline-hidden"
                  />
                </div>

                {/* Phone & Roll No */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      २. दर्ता गरिएको फोन नम्बर *
                    </label>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      value={resetPhone}
                      onChange={e => setResetPhone(e.target.value)}
                      placeholder="१० अंकको फोन नम्बर"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-red-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      ३. रोल नम्बर (Roll No) *
                    </label>
                    <input
                      type="text"
                      required
                      value={resetRollNo}
                      onChange={e => setResetRollNo(e.target.value)}
                      placeholder="दर्ता गर्दाको रोल नं."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-red-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* Class & Semester */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      ४. कक्षा (Class / Program) *
                    </label>
                    <input
                      type="text"
                      required
                      value={resetClass}
                      onChange={e => setResetClass(e.target.value)}
                      placeholder="उदा: BBS 1st Year, BA"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-red-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      ५. सेमेस्टर / वर्ष *
                    </label>
                    <input
                      type="text"
                      required
                      value={resetSemester}
                      onChange={e => setResetSemester(e.target.value)}
                      placeholder="उदा: प्रथम वर्ष / Semester"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-red-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* New Passcode & Confirm */}
                <div className="pt-2 border-t border-slate-100">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        नयाँ ४ अंकको पासकोड (New PIN) *
                      </label>
                      <input
                        type={resetShowPass ? 'text' : 'password'}
                        required
                        maxLength={4}
                        value={resetNewPass}
                        onChange={e => setResetNewPass(fromNepaliDigits(e.target.value).replace(/\D/g, ''))}
                        placeholder="४ अंक (उदा: १२३४)"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono font-bold tracking-widest focus:ring-2 focus:ring-red-500 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        नयाँ पासकोड पुष्टि (Confirm) *
                      </label>
                      <input
                        type={resetShowPass ? 'text' : 'password'}
                        required
                        maxLength={4}
                        value={resetConfirmPass}
                        onChange={e => setResetConfirmPass(fromNepaliDigits(e.target.value).replace(/\D/g, ''))}
                        placeholder="पुन: ४ अंक"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono font-bold tracking-widest focus:ring-2 focus:ring-red-500 focus:outline-hidden"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-[10px] text-slate-400">ठिक ४ अंकको संख्या मात्र लेख्नुहोस्</span>
                    <button
                      type="button"
                      onClick={() => setResetShowPass(!resetShowPass)}
                      className="text-[11px] text-slate-500 hover:text-slate-800 font-medium inline-flex items-center gap-1 cursor-pointer"
                    >
                      {resetShowPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      <span>{resetShowPass ? 'पासकोड लुकाउनुहोस्' : 'पासकोड देखाउनुहोस्'}</span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3">
                  <button
                    type="button"
                    onClick={() => setResetModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    रद्द गर्नुहोस्
                  </button>
                  <button
                    type="submit"
                    disabled={resetSubmitting}
                    className="px-5 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer"
                  >
                    {resetSubmitting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>जाँच्दैछ...</span>
                      </>
                    ) : (
                      <>
                        <KeyRound className="w-3.5 h-3.5" />
                        <span>पासवर्ड रिसेट अनुरोध पठाउनुहोस्</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
