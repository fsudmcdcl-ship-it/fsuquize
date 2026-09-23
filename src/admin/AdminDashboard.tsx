import React, { useState } from 'react';
import type { Student, Quiz, QuizSession, AuditLog } from '../types/quiz';
import { toNepaliDigits, formatNepalDate, formatDurationSeconds, getRemainingAvailability } from '../lib/nepaliUtils';
import { dataService } from '../lib/dataService';
import {
  Users,
  CheckCircle,
  Clock,
  ShieldAlert,
  Award,
  FileSpreadsheet,
  Activity,
  ArrowRight,
  UserCheck,
  UserX,
  Ban,
  AlertCircle,
  CheckCircle2,
  Loader2,
  X,
} from 'lucide-react';

interface AdminDashboardProps {
  students: Student[];
  activeQuiz: Quiz | null;
  sessions: QuizSession[];
  auditLogs: AuditLog[];
  adminSlug: string;
  navigate: (path: string) => void;
  onRefresh?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  students,
  activeQuiz,
  sessions,
  auditLogs,
  adminSlug,
  navigate,
  onRefresh,
}) => {
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const pendingStudents = students.filter(s => s.status === 'pending');
  const activeStudents = students.filter(s => s.status === 'active' || s.status === 'approved').length;
  const restrictedStudents = students.filter(s => s.status === 'restricted').length;
  const blockedStudents = students.filter(s => s.status === 'blocked').length;
  const totalStudents = students.length;

  const currentQuizSubmissions = sessions.filter(
    s => s.quizId === activeQuiz?.id && (s.status === 'submitted' || s.status === 'expired')
  );

  const availability = activeQuiz ? getRemainingAvailability(activeQuiz.endAt) : null;

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleApprove = async (student: Student) => {
    setActionLoadingId(student.id);
    try {
      const currentAdmin = dataService.getCurrentAdmin();
      const adminUid = currentAdmin?.uid || 'admin_master';
      const adminEmail = currentAdmin?.email || 'admin@fsudmc.com';

      const res = await dataService.approveStudentApplication(student.id, adminUid, adminEmail);
      if (res.success) {
        showToast(`विद्यार्थी ${student.name} (${student.id}) को आवेदन सफलतापूर्वक स्वीकृत भयो (Approved successfully)`);
        if (onRefresh) onRefresh();
      } else {
        showToast(`स्वीकृत गर्न सकिएन: ${res.error || 'अज्ञात त्रुटि'}`, 'error');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast(`त्रुटि: ${msg}`, 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (student: Student) => {
    setActionLoadingId(student.id);
    try {
      const currentAdmin = dataService.getCurrentAdmin();
      const adminUid = currentAdmin?.uid || 'admin_master';
      const adminEmail = currentAdmin?.email || 'admin@fsudmc.com';

      const res = await dataService.rejectStudentApplication(student.id, adminUid, adminEmail);
      if (res.success) {
        showToast(`विद्यार्थी ${student.name} (${student.id}) को आवेदन अस्वीकृत गरियो (Rejected)`);
        if (onRefresh) onRefresh();
      } else {
        showToast(`अस्वीकृत गर्न सकिएन: ${res.error || 'अज्ञात त्रुटि'}`, 'error');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast(`त्रुटि: ${msg}`, 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleBlock = async (student: Student) => {
    setActionLoadingId(student.id);
    try {
      const currentAdmin = dataService.getCurrentAdmin();
      const adminEmail = currentAdmin?.email || 'admin@fsudmc.com';

      const ok = dataService.updateStudentStatus(student.id, 'blocked', adminEmail);
      if (ok) {
        showToast(`विद्यार्थी ${student.name} (${student.id}) ब्लक गरियो (Blocked)`);
        if (onRefresh) onRefresh();
      } else {
        showToast('ब्लक गर्न सकिएन।', 'error');
      }
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`p-4 rounded-2xl shadow-xl flex items-center justify-between gap-3 text-xs sm:text-sm font-bold animate-in fade-in zoom-in-95 ${
            toastMessage.type === 'success'
              ? 'bg-slate-900 text-white border border-emerald-500/50'
              : 'bg-rose-900 text-white border border-rose-500/50'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
            क्विज मास्टर ड्यासबोर्ड (Admin Overview)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            FSU DMC क्याम्पस साप्ताहिक क्विज पोर्टलको समग्र स्थिति र नियन्त्रण कक्ष
          </p>
        </div>

        {/* Quick Action Shortcuts */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => navigate(`/${adminSlug}/students`)}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
          >
            <Users className="w-3.5 h-3.5" />
            <span>विद्यार्थी सूची ({toNepaliDigits(students.length)})</span>
          </button>
          <button
            onClick={() => navigate(`/${adminSlug}/questions`)}
            className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
          >
            <span>+ प्रश्न बैङ्क</span>
          </button>
          <button
            onClick={() => navigate(`/${adminSlug}/reports`)}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>एक्सल रिपोर्ट</span>
          </button>
        </div>
      </div>

      {/* Primary Statistics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Students */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">कुल दर्ता</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-3xl font-black text-slate-900">{toNepaliDigits(totalStudents)}</div>
          <span className="text-[11px] text-slate-500">दर्ता भएका विद्यार्थी</span>
        </div>

        {/* Pending Applications - Prominent */}
        <div className="bg-amber-50 p-5 rounded-2xl border-2 border-amber-300 shadow-2xs">
          <div className="flex items-center justify-between text-amber-700 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">स्वीकृति पर्खिरहेका</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-3xl font-black text-amber-800">{toNepaliDigits(pendingStudents.length)}</div>
          <span className="text-[11px] text-amber-700 font-semibold">नयाँ आवेदनहरू (Pending)</span>
        </div>

        {/* Active Students */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">सक्रिय खाता</span>
            <CheckCircle className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-black text-emerald-600">{toNepaliDigits(activeStudents)}</div>
          <span className="text-[11px] text-slate-500">स्वीकृत तथा क्विज योग्य</span>
        </div>

        {/* Blocked Students */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">ब्लक खाता</span>
            <span className="text-base text-red-600">🚫</span>
          </div>
          <div className="text-3xl font-black text-red-600">{toNepaliDigits(blockedStudents)}</div>
          <span className="text-[11px] text-slate-500">स्थगित विद्यार्थीहरू</span>
        </div>

        {/* Current Quiz Submissions */}
        <div className="bg-gradient-to-br from-red-600 to-rose-700 text-white p-5 rounded-2xl shadow-sm col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-rose-200 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">चालू सबमिसन</span>
            <Award className="w-4 h-4 text-white" />
          </div>
          <div className="text-3xl font-black text-white">{toNepaliDigits(currentQuizSubmissions.length)}</div>
          <span className="text-[11px] text-rose-100">उत्तर बुझाएका सत्रहरू</span>
        </div>
      </div>

      {/* REQUIREMENT 4: "Pending Applications" Section */}
      <div className="bg-white rounded-3xl border border-amber-300 shadow-sm overflow-hidden">
        <div className="p-6 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-b border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-amber-500 text-white">
                <Clock className="w-4 h-4" />
              </span>
              <h2 className="text-lg font-black text-slate-900">
                स्वीकृति पर्खिरहेका नयाँ विद्यार्थी आवेदनहरू (Pending Applications)
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-900 font-bold text-xs">
                {toNepaliDigits(pendingStudents.length)}
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1">
              प्रशासकले स्वीकृत (Approve) गरेपछि मात्र विद्यार्थीले क्विज खेल्न र ड्यासबोर्ड खोल्न पाउनेछन्।
            </p>
          </div>

          <button
            onClick={() => navigate(`/${adminSlug}/students`)}
            className="text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 px-3.5 py-2 rounded-xl transition cursor-pointer self-start sm:self-auto flex items-center gap-1.5"
          >
            <span>सम्पूर्ण विद्यार्थी व्यवस्थापन</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {pendingStudents.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-80" />
            <p className="font-bold text-slate-700 text-sm">कुनै पनि नयाँ आवेदन स्वीकृति पर्खिरहेको छैन</p>
            <p className="text-xs text-slate-500 mt-0.5">सबै विद्यार्थी आवेदनहरू रुजु भइसकेका छन्।</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-amber-50/60 text-slate-600 font-bold uppercase tracking-wider border-b border-amber-200/70">
                <tr>
                  <th className="py-3 px-4">Student ID</th>
                  <th className="py-3 px-4">विद्यार्थीको नाम</th>
                  <th className="py-3 px-4">इमेल / सम्पर्क</th>
                  <th className="py-3 px-4">कक्षा / सेमेस्टर</th>
                  <th className="py-3 px-4">आवेदन मिति (Applied At)</th>
                  <th className="py-3 px-4">स्थिति</th>
                  <th className="py-3 px-4 text-right">प्रशासकीय कार्य (Actions)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-100/60 text-slate-700 font-medium">
                {pendingStudents.map(student => {
                  const isLoading = actionLoadingId === student.id;
                  const appliedDate = student.appliedAt || student.createdAt;
                  return (
                    <tr key={student.id} className="hover:bg-amber-50/40 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-red-600">
                        {student.id}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-200 shrink-0 border border-slate-300">
                            <img
                              src={
                                student.profilePhoto ||
                                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face'
                              }
                              alt={student.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block">{student.name}</span>
                            <span className="text-[10px] text-slate-500">रोल नं: {student.rollNo}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-mono text-slate-700 block text-[11px]">{student.email || student.authEmail || '-'}</span>
                        <span className="text-[11px] text-slate-500 font-mono">{student.phone}</span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-900">{student.class}</span>
                        <span className="text-slate-500 text-[11px] block">({student.semester})</span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                        {formatNepalDate(appliedDate, true)}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                          <span>Pending</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* APPROVE ACTION */}
                          <button
                            disabled={isLoading}
                            onClick={() => handleApprove(student)}
                            title="स्वीकृत गर्नुहोस् (Approve Application)"
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs transition shadow-xs cursor-pointer flex items-center gap-1"
                          >
                            {isLoading ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <UserCheck className="w-3.5 h-3.5" />
                            )}
                            <span>APPROVE</span>
                          </button>

                          {/* REJECT ACTION */}
                          <button
                            disabled={isLoading}
                            onClick={() => handleReject(student)}
                            title="अस्वीकृत गर्नुहोस् (Reject Application)"
                            className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 font-bold text-xs transition cursor-pointer flex items-center gap-1"
                          >
                            <UserX className="w-3.5 h-3.5 text-slate-600" />
                            <span>REJECT</span>
                          </button>

                          {/* BLOCK ACTION */}
                          <button
                            disabled={isLoading}
                            onClick={() => handleBlock(student)}
                            title="ब्लक गर्नुहोस् (Block)"
                            className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 disabled:opacity-50 text-rose-700 transition cursor-pointer"
                          >
                            <Ban className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Active Quiz Card */}
      {activeQuiz && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                सञ्चालनमा (Active Quiz)
              </span>
              {availability && !availability.isExpired && (
                <span className="text-xs text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                  {availability.text}
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold text-slate-900">{activeQuiz.title}</h2>
            <p className="text-xs text-slate-600 leading-relaxed">{activeQuiz.description}</p>
            <div className="flex flex-wrap gap-4 text-xs text-slate-500 pt-1">
              <span>सुरु: <b>{formatNepalDate(activeQuiz.startAt, true)}</b></span>
              <span>•</span>
              <span>समाप्त: <b>{formatNepalDate(activeQuiz.endAt, true)}</b></span>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 shrink-0">
            <button
              onClick={() => navigate(`/${adminSlug}/submissions`)}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer flex items-center gap-1.5"
            >
              <span>सबमिसन हेर्नुहोस् ({toNepaliDigits(currentQuizSubmissions.length)})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => navigate(`/${adminSlug}/winners`)}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow transition cursor-pointer flex items-center gap-1.5"
            >
              <Award className="w-3.5 h-3.5" />
              <span>नतिजा तथा ड्र</span>
            </button>
          </div>
        </div>
      )}

      {/* Audit Log Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-red-600" />
              <span>प्रशासकीय कार्य विवरण (Audit Log)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              प्रशासकहरूद्वारा सम्पादित पछिल्ला कार्यहरूको स्वचालित पारदर्शी रेकर्ड
            </p>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            कुल रेकर्ड: {toNepaliDigits(auditLogs.length)}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">समय (नेपाल समय)</th>
                <th className="py-3 px-4">प्रशासक</th>
                <th className="py-3 px-4">कार्य</th>
                <th className="py-3 px-4">लक्षित ID</th>
                <th className="py-3 px-4">थप विवरण</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {auditLogs.slice(0, 8).map(log => (
                <tr key={log.id} className="hover:bg-slate-50/50">
                  <td className="py-3 px-4 text-slate-500 font-mono whitespace-nowrap">
                    {formatNepalDate(log.timestamp)}
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-slate-800">
                    {log.adminEmail}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-semibold text-[11px]">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-600">
                    {log.target}
                  </td>
                  <td className="py-3 px-4 text-slate-500 truncate max-w-xs">
                    {log.details || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
