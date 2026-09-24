import React, { useState, useEffect } from 'react';
import type { Student } from '../types/quiz';
import { dataService } from '../lib/dataService';
import { formatNepalDate, toNepaliDigits } from '../lib/nepaliUtils';
import { doc, onSnapshot } from 'firebase/firestore';
import { firestoreDb } from '../lib/firebase';
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
  Image as ImageIcon,
  ZoomIn,
  X,
  Camera,
  FileEdit,
  XCircle,
} from 'lucide-react';

interface AccountPendingPageProps {
  student: Student;
  navigate: (path: string) => void;
  onLogout: () => void;
  onStatusUpdated?: (updated: Student) => void;
}

export const AccountPendingPage: React.FC<AccountPendingPageProps> = ({
  student: initialStudent,
  navigate,
  onLogout,
  onStatusUpdated,
}) => {
  const [student, setStudent] = useState<Student>(initialStudent);
  const [checking, setChecking] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [imgError, setImgError] = useState(false);

  // Keep local student in sync if props change or local storage changes
  useEffect(() => {
    const cur = dataService.getCurrentStudent();
    if (cur && cur.id === initialStudent.id) {
      setStudent(cur);
    }
  }, [initialStudent]);

  // Automatic real-time status listener directly via Firestore onSnapshot + gentle background fallback
  useEffect(() => {
    let isMounted = true;

    const checkCurrent = (fresh: Student | null) => {
      if (!isMounted || !fresh) return;
      setStudent(prev => ({ ...prev, ...fresh }));
      if (fresh.status === 'approved' || fresh.status === 'active') {
        setStatusType('approved');
        setStatusMessage('बधाई छ! तपाईंको खाता प्रशासनद्वारा स्वीकृत भएको छ। ड्यासबोर्ड खुल्दैछ...');
        if (onStatusUpdated) onStatusUpdated(fresh);
        setTimeout(() => {
          if (isMounted) navigate('/dashboard');
        }, 1200);
      } else if (fresh.status === 'rejected') {
        setStatusType('rejected');
        setStatusMessage('तपाईंको आवेदन प्रशासनद्वारा अस्वीकृत गरिएको छ। कृपया क्याम्पसमा सम्पर्क गर्नुहोस्।');
      }
    };

    // 1. Initial immediate check from local cache / Firestore
    dataService.checkStudentApprovalStatus(student.id).then(checkCurrent).catch(() => {});

    // 2. Direct real-time Firestore onSnapshot listener for instant verification without polling delays
    let unsubFirestore: (() => void) | null = null;
    try {
      const studentDocRef = doc(firestoreDb, 'students', student.id);
      unsubFirestore = onSnapshot(
        studentDocRef,
        (snap) => {
          if (isMounted && snap.exists()) {
            const fresh = snap.data() as Student;
            dataService.updateCachedStudent(fresh);
            checkCurrent(fresh);
          }
        },
        (err) => {
          console.debug('Firestore pending status listener notice:', err);
        }
      );
    } catch (e) {
      console.debug('Failed to initialize Firestore pending listener:', e);
    }

    // 3. Subscribe to dataService local updates
    const unsubscribeDataService = dataService.subscribe(() => {
      const cur = dataService.getCurrentStudent();
      const updated = cur?.id === student.id ? cur : dataService.getStudents().find(s => s.id === student.id);
      if (updated) {
        checkCurrent(updated);
      }
    });

    // 4. Low-frequency background polling (every 6 seconds) as fallback
    const interval = setInterval(() => {
      dataService.checkStudentApprovalStatus(student.id).then(checkCurrent).catch(() => {});
    }, 6000);

    return () => {
      isMounted = false;
      if (unsubFirestore) {
        try {
          unsubFirestore();
        } catch {}
      }
      unsubscribeDataService();
      clearInterval(interval);
    };
  }, [student.id, navigate, onStatusUpdated]);

  const handleCheckStatus = async () => {
    setChecking(true);
    setStatusMessage(null);

    try {
      const fresh = await dataService.checkStudentApprovalStatus(student.id);
      setChecking(false);

      if (fresh) {
        setStudent(prev => ({ ...prev, ...fresh }));
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
      setStatusMessage('स्थिति जाँच्न सकिएन। कृपया केही समयपछि पुनः प्रयास गर्नुहोस्।');
    }
  };

  const initialLetter = student.name ? student.name.trim().charAt(0).toUpperCase() : 'S';

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
      <div className="bg-white rounded-3xl border border-amber-200/80 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Banner Header with Student Photo */}
        <div className={`text-white p-6 sm:p-8 text-center relative overflow-hidden transition-colors duration-300 ${
          statusType === 'rejected' || student.status === 'rejected'
            ? 'bg-gradient-to-br from-red-600 via-rose-700 to-red-800'
            : 'bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700'
        }`}>
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full pointer-events-none" />

          {/* Student Submitted Profile Photo Display */}
          <div className="relative mx-auto mb-4 flex justify-center">
            {student.profilePhoto && !imgError ? (
              <div
                onClick={() => setIsPhotoModalOpen(true)}
                className="group relative cursor-pointer"
                title="ठूलो फोटो हेर्न क्लिक गर्नुहोस् (Click to enlarge photo)"
              >
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-4 border-white/50 shadow-2xl bg-slate-800 transition-transform transform group-hover:scale-105">
                  <img
                    src={student.profilePhoto}
                    alt={student.name}
                    onError={() => setImgError(true)}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute inset-0 rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1 text-white text-xs font-bold">
                  <ZoomIn className="w-4 h-4" />
                  <span>हेर्नुहोस्</span>
                </div>
                <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-1.5 rounded-full border-2 border-white shadow-md">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
            ) : (
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white text-3xl font-black shadow-inner border-2 border-white/30">
                {initialLetter}
              </div>
            )}
          </div>

          {statusType === 'rejected' || student.status === 'rejected' ? (
            <>
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-red-900/60 backdrop-blur-md text-red-100 font-bold text-xs rounded-full uppercase tracking-wider mb-2 border border-red-300/30">
                <XCircle className="w-3.5 h-3.5 text-red-200" />
                <span>Status: Application Rejected (आवेदन अस्वीकृत)</span>
              </span>
              <h1 className="text-2xl sm:text-3xl font-black">
                आवेदन प्रशासनद्वारा अस्वीकृत गरियो
              </h1>
              <p className="text-rose-100 text-xs sm:text-sm mt-2 max-w-lg mx-auto">
                तपाईंको आवेदन अस्वीकृत भएको छ। आवश्यक विवरण वा कागजात सच्याएर तपाईं तुरुन्तै नयाँ आवेदन दर्ता गर्न सक्नुहुन्छ।
              </p>
            </>
          ) : (
            <>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-md text-amber-100 font-bold text-xs rounded-full uppercase tracking-wider mb-2">
                <Clock className="w-3.5 h-3.5 animate-spin" />
                <span>Status: Pending Approval (स्वीकृति प्रतीक्षामा)</span>
              </span>
              <h1 className="text-2xl sm:text-3xl font-black">
                खाता प्रशासकीय स्वीकृतिको पर्खाइमा छ
              </h1>
              <p className="text-amber-100 text-xs sm:text-sm mt-2 max-w-lg mx-auto">
                स्वतन्त्र विद्यार्थी युनियन, दार्चुला बहुमुखी क्याम्पस (Darchula Multiple Campus)
              </p>
            </>
          )}
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
              नमस्ते <strong className="text-slate-900">{student.name}</strong>, तपाईंको विद्यार्थी दर्ता आवेदन र पेश गरिएको फोटो सुरक्षित गरिएको छ।
              क्याम्पसको साप्ताहिक हाजिरी जवाफ प्रतियोगिता निष्पक्ष र आधिकारिक राख्नका लागि प्रशासनद्वारा विद्यार्थीहरूको
              रोल नम्बर, कक्षा र पेश गरिएको परिचय रुजु गरिनेछ।
            </p>
            <p className="text-xs leading-relaxed text-slate-600">
              प्रशासकले तपाईंको आवेदन <strong className="text-emerald-700 font-bold">स्वीकृत (Approve)</strong> गर्नासाथ तपाईंले
              साप्ताहिक क्विज खेल्न, अंक हेर्न र ड्यासबोर्ड प्रयोग गर्न सक्नुहुनेछ। यो पृष्ठ स्वतः अद्यावधिक हुनेछ।
            </p>
          </div>

          {/* Submitted Application Details Card */}
          <div className="border border-slate-200 rounded-2xl p-5 bg-white space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                तपाईंको दर्ता आवेदन विवरण (Application Details)
              </div>
              {student.profilePhoto && (
                <button
                  type="button"
                  onClick={() => setIsPhotoModalOpen(true)}
                  className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1 cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>फोटो हेर्नुहोस्</span>
                </button>
              )}
            </div>

            {/* Photo Preview Row */}
            <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
              <div
                onClick={() => student.profilePhoto && setIsPhotoModalOpen(true)}
                className={`w-14 h-14 rounded-xl overflow-hidden shrink-0 border border-slate-300 bg-slate-200 flex items-center justify-center ${
                  student.profilePhoto ? 'cursor-pointer hover:ring-2 hover:ring-red-400' : ''
                }`}
              >
                {student.profilePhoto && !imgError ? (
                  <img
                    src={student.profilePhoto}
                    alt={student.name}
                    onError={() => setImgError(true)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-6 h-6 text-slate-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-sm truncate">{student.name}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    फोटो पेश भयो
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  पेश गरिएको प्रोफाइल फोटो सुरक्षित रूपमा प्रणालीमा दर्ता भएको छ
                </p>
              </div>
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
                  <span className="text-slate-400 block text-[10px]">संकाय, कक्षा र रोल</span>
                  <span className="font-bold text-slate-800">
                    {student.faculty ? `${student.faculty} • ` : ''}{student.class} ({student.semester}) - रोल {toNepaliDigits(student.rollNo)}
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
            {statusType === 'rejected' || student.status === 'rejected' ? (
              <button
                onClick={() => {
                  dataService.clearRejectedApplication(student.id);
                  navigate('/register');
                }}
                className="w-full py-4 px-4 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 active:from-red-800 text-white font-black text-sm rounded-xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <FileEdit className="w-5 h-5" />
                <span>📝 पुनः नयाँ आवेदन भर्नुहोस् (Fill New Application)</span>
              </button>
            ) : (
              <button
                onClick={handleCheckStatus}
                disabled={checking}
                className="w-full py-3.5 px-4 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-bold text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
                <span>{checking ? 'स्थिति जाँच्दै...' : 'स्थिति पुनः जाँच्नुहोस् (Check Approval Status)'}</span>
              </button>
            )}

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

      {/* Full Student Photo Modal */}
      {isPhotoModalOpen && student.profilePhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setIsPhotoModalOpen(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-sm w-full overflow-hidden shadow-2xl border border-slate-200 p-6 relative"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setIsPhotoModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition"
              title="बन्द गर्नुहोस्"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-4">
              <div className="w-48 h-48 mx-auto rounded-2xl overflow-hidden border-4 border-amber-200 shadow-xl bg-slate-100">
                <img
                  src={student.profilePhoto}
                  alt={student.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div>
                <h3 className="text-lg font-black text-slate-900">{student.name}</h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">ID: {student.id}</p>
                <p className="text-xs text-slate-600 mt-1">
                  रोल {toNepaliDigits(student.rollNo)} | {student.class} ({student.semester})
                </p>
                <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>दर्ता फारममा पेश गरिएको आधिकारिक फोटो</span>
                </div>
              </div>

              <button
                onClick={() => setIsPhotoModalOpen(false)}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                बन्द गर्नुहोस् (Close)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
