import React, { useState } from 'react';
import type { QuizSession, Quiz, Question, Student } from '../types/quiz';
import { toNepaliDigits, formatNepalDate, formatDurationSeconds } from '../lib/nepaliUtils';
import { dataService } from '../lib/dataService';
import {
  Search,
  Eye,
  Check,
  X,
  FileSpreadsheet,
  ArrowLeft,
  Trophy,
  Award,
  Trash2,
  UserX,
  AlertTriangle,
  CheckCircle,
  AlertCircle,
  RotateCcw
} from 'lucide-react';
import { exportQuizSubmissionsToExcel } from '../lib/excelExport';
import { ParticipantsScorePoster } from './components/ParticipantsScorePoster';

interface AdminSubmissionsProps {
  sessions: QuizSession[];
  quizzes: Quiz[];
  questions: Question[];
  students?: Student[];
  onRefresh?: () => void;
}

export const AdminSubmissions: React.FC<AdminSubmissionsProps> = ({
  sessions,
  quizzes,
  questions,
  students = [],
  onRefresh,
}) => {
  const [selectedQuizId, setSelectedQuizId] = useState<string>(quizzes[0]?.id || 'quiz_week_12');
  const [searchTerm, setSearchTerm] = useState('');
  const [inspectSession, setInspectSession] = useState<QuizSession | null>(null);
  const [showScorePoster, setShowScorePoster] = useState(false);

  // Deletion modals state
  const [retakeConfirmSession, setRetakeConfirmSession] = useState<QuizSession | null>(null);
  const [deleteConfirmSession, setDeleteConfirmSession] = useState<QuizSession | null>(null);
  const [deleteConfirmStudent, setDeleteConfirmStudent] = useState<{
    studentId: string;
    studentName: string;
    studentRoll?: string;
  } | null>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const questionMap = new Map(questions.map(q => [q.id, q]));
  const activeQuiz = quizzes.find(q => q.id === selectedQuizId) || quizzes[0];

  const filteredSessions = sessions.filter(s => {
    const matchesQuiz = !selectedQuizId || s.quizId === selectedQuizId;
    const matchesSearch =
      s.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.studentRoll.includes(searchTerm) ||
      toNepaliDigits(s.studentRoll).includes(searchTerm) ||
      s.studentClass.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesQuiz && matchesSearch;
  });

  const handleExport = () => {
    if (!activeQuiz) return;
    exportQuizSubmissionsToExcel(activeQuiz, filteredSessions, questions);
  };

  // Allow retake and delete past submission
  const handleRetakeConfirm = () => {
    if (!retakeConfirmSession) return;
    const s = retakeConfirmSession;
    dataService.allowStudentRetakeExam(s.quizId, s.studentId, 'admin@fsudmc.com');
    setRetakeConfirmSession(null);
    if (inspectSession?.id === s.id) {
      setInspectSession(null);
    }
    onRefresh?.();
    showToast(`विद्यार्थी ${s.studentName} लाई फेरि परीक्षा दिन अनुमति दिइयो र विगतको सबमिसन मेटाइयो।`);
  };

  // Delete only the single quiz attempt/session
  const handleDeleteSessionConfirm = () => {
    if (!deleteConfirmSession) return;
    const s = deleteConfirmSession;
    dataService.deleteQuizSession(s.id, 'admin@fsudmc.com');
    setDeleteConfirmSession(null);
    if (inspectSession?.id === s.id) {
      setInspectSession(null);
    }
    onRefresh?.();
    showToast(`विद्यार्थी ${s.studentName} को क्विज सबमिसन (अंक: ${toNepaliDigits(s.score)}/१०) सफलतापूर्वक हटाइयो।`);
  };

  // Delete the student account AND all their quiz submissions
  const handleDeleteStudentConfirm = () => {
    if (!deleteConfirmStudent) return;
    const { studentId, studentName } = deleteConfirmStudent;
    dataService.deleteStudent(studentId, 'admin@fsudmc.com', true);
    setDeleteConfirmStudent(null);
    if (inspectSession?.studentId === studentId) {
      setInspectSession(null);
    }
    onRefresh?.();
    showToast(`विद्यार्थी ${studentName} (${studentId}) र उहाँका सम्पूर्ण क्विज सबमिसनहरू ब्याकइन्डबाट पूर्ण रूपमा मेटाइयो।`);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-4 rounded-2xl bg-slate-900 text-white text-xs font-bold shadow-xl flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
            उत्तर तथा सबमिसन समीक्षा (Submissions)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            विद्यार्थीहरूले बुझाएका उत्तर, प्राप्त अंक र क्विज सहभागी व्यवस्थापन।
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Download Participants Poster */}
          {activeQuiz && (
            <button
              onClick={() => setShowScorePoster(true)}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer"
            >
              <Trophy className="w-4 h-4 text-amber-300" />
              <span>सहभागी नतिजा पोस्टर (Poster)</span>
            </button>
          )}

          {/* Export to Excel */}
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Excel Export (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* Filter & Selector Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <label className="text-xs font-bold text-slate-700 whitespace-nowrap">
            क्विज छान्नुहोस्:
          </label>
          <select
            value={selectedQuizId}
            onChange={e => setSelectedQuizId(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white text-slate-700 w-full sm:w-64"
          >
            {quizzes.map(q => (
              <option key={q.id} value={q.id}>
                {q.title} ({q.status === 'active' ? 'सक्रिय' : q.status})
              </option>
            ))}
          </select>
        </div>

        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="नाम, विद्यार्थी ID वा रोल नम्बर खोज्नुहोस्..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-red-500 font-medium"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      {/* Submissions Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">विद्यार्थी</th>
                <th className="py-3.5 px-4">कक्षा / सेमेस्टर</th>
                <th className="py-3.5 px-4 text-center">अंक (Score)</th>
                <th className="py-3.5 px-4 text-center">प्रतिशत</th>
                <th className="py-3.5 px-4">समय</th>
                <th className="py-3.5 px-4 text-center">स्थान (Rank)</th>
                <th className="py-3.5 px-4">सबमिसन मिति</th>
                <th className="py-3.5 px-4 text-right">कार्यहरू (Actions)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {filteredSessions.length > 0 ? (
                filteredSessions.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 shrink-0 border border-slate-200 overflow-hidden flex items-center justify-center font-bold text-slate-700">
                          {s.studentPhoto ? (
                            <img
                              src={s.studentPhoto}
                              alt={s.studentName}
                              crossOrigin="anonymous"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-red-600 to-slate-800 text-white font-bold text-xs flex items-center justify-center">
                              {s.studentName ? s.studentName.trim().charAt(0).toUpperCase() : 'S'}
                            </div>
                          )}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 block">{s.studentName}</span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {s.studentId} | रोल: {toNepaliDigits(s.studentRoll)}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-800 block">{s.studentClass}</span>
                      <span className="text-[11px] text-slate-400">({s.studentSemester})</span>
                    </td>

                    <td className="py-3 px-4 text-center font-bold text-slate-900 text-sm">
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {toNepaliDigits(s.score)}/१०
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 font-bold text-[11px]">
                        {toNepaliDigits(s.percentage)}%
                      </span>
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-600">
                      {formatDurationSeconds(s.timeTakenSeconds)}
                    </td>

                    <td className="py-3 px-4 text-center font-mono font-bold text-purple-700">
                      {s.rank ? `#${toNepaliDigits(s.rank)}` : '-'}
                    </td>

                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      {s.submittedAt ? formatNepalDate(s.submittedAt) : 'प्रगतिमा'}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Inspect session answers */}
                        <button
                          type="button"
                          onClick={() => setInspectSession(s)}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg flex items-center gap-1 transition cursor-pointer"
                          title="उत्तर तथा विवरण हेर्नुहोस्"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-500" />
                          <span className="hidden sm:inline">उत्तर</span>
                        </button>

                        {/* Allow retake exam and delete submission */}
                        <button
                          type="button"
                          onClick={() => setRetakeConfirmSession(s)}
                          className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 hover:border-blue-300 font-bold rounded-lg flex items-center gap-1 transition cursor-pointer"
                          title="यो सबमिसन मेटाई विद्यार्थीलाई फेरि परीक्षा दिन अनुमति दिनुहोस्"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-blue-600" />
                          <span className="hidden sm:inline">पुन: परीक्षा</span>
                        </button>

                        {/* Delete this single quiz attempt */}
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmSession(s)}
                          className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 hover:border-amber-300 font-bold rounded-lg transition cursor-pointer"
                          title="यो क्विज सबमिसन मात्र मेटाउनुहोस् (विद्यार्थी खाता रहिरहनेछ)"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete the student and all attempts */}
                        <button
                          type="button"
                          onClick={() =>
                            setDeleteConfirmStudent({
                              studentId: s.studentId,
                              studentName: s.studentName,
                              studentRoll: s.studentRoll,
                            })
                          }
                          className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 hover:border-red-300 font-bold rounded-lg transition cursor-pointer"
                          title="यो विद्यार्थी र सम्पूर्ण क्विज सबमिसन पूर्ण रूपमा मेटाउनुहोस्"
                        >
                          <UserX className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    यस क्विजमा कुनै सबमिसन भेटिएन।
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Allow Retake Exam & Delete Past Submission Confirmation Modal */}
      {retakeConfirmSession && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mx-auto text-2xl font-bold">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-black text-slate-900">
                पुन: परीक्षा दिने सुविधा र सबमिसन मेटाउने पुष्टि
              </h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                के तपाईं विद्यार्थी <b>{retakeConfirmSession.studentName}</b> (ID: <span className="font-mono">{retakeConfirmSession.studentId}</span> | रोल: {toNepaliDigits(retakeConfirmSession.studentRoll)}) को पुरानो सबमिसन मेटाई फेरि परीक्षा दिन अनुमति दिन निश्चित हुनुहुन्छ?
              </p>
              <div className="mt-3 p-3 bg-blue-50 rounded-2xl border border-blue-200 text-[11px] text-blue-900 text-left space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-blue-600" />
                  <span>यो कार्य गरेपछि हुने परिवर्तनहरू:</span>
                </p>
                <ul className="list-disc list-inside space-y-0.5 text-[11px] text-blue-800">
                  <li>पुरानो सबमिसन (प्राप्त अंक: <b>{toNepaliDigits(retakeConfirmSession.score)}/१०</b>) प्रणालीबाट पूर्ण रूपमा मेटिनेछ।</li>
                  <li>विद्यार्थीका लागि सुरक्षित गरिएका लक्ड प्रश्नहरू रिसेट हुनेछन्।</li>
                  <li>विद्यार्थीले आफ्नो डिभाइसमा आजको क्विज फेरि नयाँ रूपमा सुरु गर्न पाउनेछन्।</li>
                </ul>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRetakeConfirmSession(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                रद्द गर्नुहोस्
              </button>
              <button
                type="button"
                onClick={handleRetakeConfirm}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>पुन: परीक्षा दिन दिनुहोस्</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Single Submission Confirmation Modal */}
      {deleteConfirmSession && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto text-2xl font-bold">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-black text-slate-900">क्विज सबमिसन मेटाउने पुष्टि</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                के तपाईं विद्यार्थी <b>{deleteConfirmSession.studentName}</b> (रोल: {toNepaliDigits(deleteConfirmSession.studentRoll)}) को यो क्विज सबमिसन (अंक: <b>{toNepaliDigits(deleteConfirmSession.score)}/१०</b>) मेटाउन निश्चित हुनुहुन्छ?
              </p>
              <div className="mt-3 p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-800 text-left">
                ℹ️ <b>जानकारी:</b> यो कार्यले विद्यार्थीको खाता मेटाउँदैन। विद्यार्थीको यो क्विज प्रयास मात्र हट्नेछ र आवश्यकता अनुसार विद्यार्थीले पुनः क्विज सुरु गर्न सक्नेछन्।
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmSession(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
              >
                रद्द गर्नुहोस्
              </button>
              <button
                type="button"
                onClick={handleDeleteSessionConfirm}
                className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>सबमिसन मेटाउनुहोस्</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Student & All Attempts Confirmation Modal */}
      {deleteConfirmStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto text-2xl font-bold">
              <UserX className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-black text-slate-900">विद्यार्थी र सम्पूर्ण सबमिसन मेटाउने</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                के तपाईं <b>{deleteConfirmStudent.studentName}</b> ({deleteConfirmStudent.studentId}) को खाता तथा उहाँका <b>सम्पूर्ण क्विज सबमिसन तथा स्कोर रेकर्डहरू</b> पूर्ण रूपमा मेटाउन निश्चित हुनुहुन्छ?
              </p>
              <div className="mt-3 p-3 bg-red-50 rounded-xl border border-red-200 text-[11px] text-red-800 text-left">
                ⚠️ <b>चेतावनी:</b> विद्यार्थीको खाता, लगइन विवरण, र अहिलेसम्मका सम्पूर्ण क्विज सहभागिताहरू ब्याकइन्डबाट सदाका लागि हटाइनेछ। यो कार्य फिर्ता गर्न सकिँदैन।
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmStudent(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
              >
                रद्द गर्नुहोस्
              </button>
              <button
                type="button"
                onClick={handleDeleteStudentConfirm}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>विद्यार्थी पूर्ण मेटाउनुहोस्</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inspect Session Modal */}
      {inspectSession && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 my-auto animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start pb-4 border-b border-slate-100">
              <div>
                <span className="text-xs font-bold text-red-600 uppercase tracking-widest block">
                  विद्यार्थी उत्तर विवरण
                </span>
                <h3 className="text-xl font-black text-slate-900 mt-0.5">
                  {inspectSession.studentName} ({inspectSession.studentId})
                </h3>
                <p className="text-xs text-slate-500">
                  {inspectSession.studentClass} | रोल: {toNepaliDigits(inspectSession.studentRoll)} | फोन: {inspectSession.studentPhone || '-'}
                </p>
              </div>

              <button
                onClick={() => setInspectSession(null)}
                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl"
              >
                ✕
              </button>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
              <div>
                <span className="text-xs text-slate-500 block">प्राप्त अंक</span>
                <span className="text-xl font-black text-slate-900">{toNepaliDigits(inspectSession.score)}/१०</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">प्रतिशत</span>
                <span className="text-xl font-black text-slate-900">{toNepaliDigits(inspectSession.percentage)}%</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">समय लागेको</span>
                <span className="text-sm font-bold text-slate-800 mt-1 block">
                  {formatDurationSeconds(inspectSession.timeTakenSeconds)}
                </span>
              </div>
            </div>

            {/* Question-by-Question inspect */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                १० प्रश्नहरूको उत्तर सूची:
              </h4>

              {inspectSession.selectedQuestionIds.map((qId, idx) => {
                const q = questionMap.get(qId);
                const studentAns = inspectSession.answers[qId];
                const isCorrect = q && studentAns === q.correctAnswer;
                const isUnanswered = !studentAns;

                return (
                  <div
                    key={qId}
                    className={`p-4 rounded-xl border text-xs ${
                      isUnanswered
                        ? 'bg-slate-50 border-slate-200'
                        : isCorrect
                        ? 'bg-emerald-50/50 border-emerald-200'
                        : 'bg-red-50/50 border-red-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <b className="text-slate-800">प्रश्न {toNepaliDigits(idx + 1)}: {q?.question}</b>
                      {isUnanswered ? (
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">
                          अनुत्तरित
                        </span>
                      ) : isCorrect ? (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                          ✓ सही
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
                          ✗ गलत
                        </span>
                      )}
                    </div>

                    <div className="flex gap-4 text-slate-600 pt-1">
                      <span>
                        विद्यार्थीको उत्तर: <b>{studentAns ? `${studentAns}. ${q?.[`option${studentAns}` as keyof Question]}` : '-'}</b>
                      </span>
                      <span>
                        सही उत्तर: <b className="text-emerald-700">{q?.correctAnswer}. {q?.[`option${q.correctAnswer}` as keyof Question]}</b>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmSession(inspectSession)}
                  className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>यो सबमिसन मेटाउनुहोस्</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setDeleteConfirmStudent({
                      studentId: inspectSession.studentId,
                      studentName: inspectSession.studentName,
                      studentRoll: inspectSession.studentRoll,
                    });
                  }}
                  className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                >
                  <UserX className="w-3.5 h-3.5" />
                  <span>विद्यार्थी खाता नै मेटाउनुहोस्</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setInspectSession(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl transition cursor-pointer ml-auto"
              >
                बन्द गर्नुहोस्
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Participants Score Poster Modal */}
      {showScorePoster && activeQuiz && (
        <ParticipantsScorePoster
          quiz={activeQuiz}
          participants={filteredSessions}
          onClose={() => setShowScorePoster(false)}
        />
      )}
    </div>
  );
};
