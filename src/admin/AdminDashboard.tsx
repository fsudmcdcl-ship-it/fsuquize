import React from 'react';
import type { Student, Quiz, QuizSession, AuditLog } from '../types/quiz';
import { toNepaliDigits, formatNepalDate, formatDurationSeconds, getRemainingAvailability } from '../lib/nepaliUtils';
import { Users, FileText, CheckCircle, Clock, ShieldAlert, Award, FileSpreadsheet, Activity, ArrowRight } from 'lucide-react';

interface AdminDashboardProps {
  students: Student[];
  activeQuiz: Quiz | null;
  sessions: QuizSession[];
  auditLogs: AuditLog[];
  adminSlug: string;
  navigate: (path: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  students,
  activeQuiz,
  sessions,
  auditLogs,
  adminSlug,
  navigate,
}) => {
  const totalStudents = students.length;
  const activeStudents = students.filter(s => s.status === 'active').length;
  const restrictedStudents = students.filter(s => s.status === 'restricted').length;
  const blockedStudents = students.filter(s => s.status === 'blocked').length;

  const currentQuizSubmissions = sessions.filter(
    s => s.quizId === activeQuiz?.id && (s.status === 'submitted' || s.status === 'expired')
  );

  const availability = activeQuiz ? getRemainingAvailability(activeQuiz.endAt) : null;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
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

        {/* Active Students */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">सक्रिय खाता</span>
            <CheckCircle className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-black text-emerald-600">{toNepaliDigits(activeStudents)}</div>
          <span className="text-[11px] text-slate-500">क्विज खेल्न योग्य</span>
        </div>

        {/* Restricted Students */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">प्रतिबन्धित</span>
            <ShieldAlert className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-3xl font-black text-amber-600">{toNepaliDigits(restrictedStudents)}</div>
          <span className="text-[11px] text-slate-500">सीमित पहुँच</span>
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
          <span className="text-[11px] text-rose-100">हप्ता १२ मा उत्तर बुझाएका</span>
        </div>
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

      {/* Audit Log Table (Requirement 40) */}
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
