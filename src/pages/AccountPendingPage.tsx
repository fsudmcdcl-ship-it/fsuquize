import React, { useState } from 'react';
import type { Student } from '../types/quiz';
import { dataService } from '../lib/dataService';
import { formatNepalDate, toNepaliDigits } from '../lib/nepaliUtils';
import {
  Clock,
  ShieldAlert,
  RefreshCw,
  LogOut,
  CheckCircle2,
  GraduationCap,
  User,
  Phone,
  FileCheck,
  Building2,
} from 'lucide-react';

interface AccountPendingPageProps {
  student: Student;
  navigate: (path: string) => void;
  onLogout: () => void;
  onStatusUpdated?: (updated: Student) => void;
}

export const AccountPendingPage: React.FC<AccountPendingPageProps> = ({
  student,
  navigate,
  onLogout,
  onStatusUpdated,
}) => {
  const [checking, setChecking] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<'pending' | 'approved' | 'rejected'>('pending');

  const handleCheckStatus = async () => {
    setChecking(true);
    setStatusMessage(null);

    try {
      const fresh = await dataService.checkStudentApprovalStatus(student.id);
      setChecking(false);

      if (fresh) {
        if (fresh.status === 'approved' || fresh.status === 'active') {
          setStatusType('approved');
          setStatusMessage('बधाई छ! तपाईंको खाता प्रशासनद्वारा स्वीकृत भएको छ। ड्यासबोर्ड खुल्दैछ...');
          if (onStatusUpdated) onStatusUpdated(fresh);
          setTimeout(() => {
            navigate('/dashboard');
          }, 1200);
          return;
        } else if (fresh.status === 'rejected') {
          setStatusType('rejected');
          setStatusMessage('तपाईंको आवेदन प्रशासनद्वारा अस्वीकृत गरिएको छ। कृपया क्याम्पसमा सम्पर्क गर्नुहोस्।');
          return;
        }
      }

      setStatusType('pending');
      setStatusMessage('तपाईंको खाता अझै स्वीकृतिको पर्खाइमा छ। प्रशासनले चाँडै रुजु गर्नेछ।');
      setTimeout(() => setStatusMessage(null), 4000);
    } catch {
      setChecking(false);
      setStatusMessage('स्थिति जाँच्न सकिएन। कृपया इन्टरनेट जाँच्नुहोस्।');
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
      <div className="bg-white rounded-3xl border border-amber-200/80 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Banner Header */}
        <div className="bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 text-white p-6 sm:p-8 text-center relative overflow-hidden">
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full pointer-events-none" />
          <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-4 text-white shadow-inner">
            <Clock className="w-9 h-9 animate-pulse" />
          </div>
          <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md text-amber-100 font-bold text-xs rounded-full uppercase tracking-wider mb-2">
            Status: Pending Approval
          </span>
          <h1 className="text-2xl sm:text-3xl font-black">
            खाता प्रशासकीय स्वीकृतिको पर्खाइमा छ
          </h1>
          <p className="text-amber-100 text-xs sm:text-sm mt-2 max-w-lg mx-auto">
            स्वतन्त्र विद्यार्थी युनियन, दार्चुला बहुमुखी क्याम्पस (Darchula Multiple Campus)
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Status Message / Notification */}
          {statusMessage && (
            <div
              className={`p-4 rounded-2xl text-xs sm:text-sm font-semibold flex items-start gap-3 transition ${
                statusType === 'approved'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : statusType === 'rejected'
                  ? 'bg-red-50 text-red-800 border border-red-200'
                  : 'bg-amber-50 text-amber-800 border border-amber-200'
              }`}
            >
              {statusType === 'approved' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 leading-relaxed">{statusMessage}</div>
            </div>
          )}

          {/* Explanation Box */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 text-slate-700 space-y-3">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <FileCheck className="w-4 h-4 text-amber-600" />
              <span>प्रमाणीकरण प्रक्रिया सम्बन्धी जानकारी</span>
            </div>
            <p className="text-xs leading-relaxed text-slate-600">
              नमस्ते <strong className="text-slate-900">{student.name}</strong>, तपाईंको विद्यार्थी दर्ता आवेदन सुरक्षित गरिएको छ।
              क्याम्पसको साप्ताहिक हाजिरी जवाफ प्रतियोगिता निष्पक्ष र आधिकारिक राख्नका लागि प्रशासनद्वारा सबै नयाँ विद्यार्थीहरूको
              रोल नम्बर र क्याम्पस भर्ना रुजु गरिनेछ।
            </p>
            <p className="text-xs leading-relaxed text-slate-600">
              प्रशासकले तपाईंको आवेदन <strong className="text-emerald-700 font-bold">स्वीकृत (Approve)</strong> गर्नासाथ तपाईंले
              साप्ताहिक क्विज खेल्न, अंक हेर्न र ड्यासबोर्ड प्रयोग गर्न सक्नुहुनेछ।
            </p>
          </div>

          {/* Submitted Application Details Card */}
          <div className="border border-slate-200 rounded-2xl p-5 bg-white space-y-3">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              तपाईंको दर्ता आवेदन विवरण (Application Details)
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl">
                <User className="w-4 h-4 text-slate-400 shrink-0" />
                <div>
                  <span className="text-slate-400 block text-[10px]">विद्यार्थी ID</span>
                  <span className="font-mono font-bold text-red-600 text-sm">{student.id}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl">
                <GraduationCap className="w-4 h-4 text-slate-400 shrink-0" />
                <div>
                  <span className="text-slate-400 block text-[10px]">रोल नम्बर र कक्षा</span>
                  <span className="font-bold text-slate-800">
                    रोल {toNepaliDigits(student.rollNo)} ({student.class} - {student.semester})
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl">
                <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                <div>
                  <span className="text-slate-400 block text-[10px]">सम्पर्क नम्बर</span>
                  <span className="font-mono font-bold text-slate-800">{student.phone}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl">
                <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                <div>
                  <span className="text-slate-400 block text-[10px]">आवेदन मिति</span>
                  <span className="font-medium text-slate-800">
                    {formatNepalDate(student.appliedAt || student.createdAt)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-2">
            <button
              onClick={handleCheckStatus}
              disabled={checking}
              className="w-full py-3.5 px-4 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-bold text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
              <span>{checking ? 'स्थिति जाँच्दै...' : 'स्थिति पुनः जाँच्नुहोस् (Check Approval Status)'}</span>
            </button>

            <button
              onClick={onLogout}
              className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-slate-500" />
              <span>लगआउट गर्नुहोस् (Log Out)</span>
            </button>
          </div>

          {/* Campus Helpline Footer */}
          <div className="pt-2 text-center text-slate-400 text-[11px] flex items-center justify-center gap-1.5">
            <Building2 className="w-3.5 h-3.5" />
            <span>दार्चुला बहुमुखी क्याम्पस, खलङ्गा, दार्चुला | FSU Helpdesk</span>
          </div>
        </div>
      </div>
    </div>
  );
};
