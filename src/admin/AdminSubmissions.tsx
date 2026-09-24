import React, { useState } from 'react';
import type { QuizSession, Quiz, Question } from '../types/quiz';
import { toNepaliDigits, formatNepalDate, formatDurationSeconds } from '../lib/nepaliUtils';
import { Search, Eye, Check, X, FileSpreadsheet, ArrowLeft, Trophy, Award } from 'lucide-react';
import { exportQuizSubmissionsToExcel } from '../lib/excelExport';
import { ParticipantsScorePoster } from './components/ParticipantsScorePoster';

interface AdminSubmissionsProps {
  sessions: QuizSession[];
  quizzes: Quiz[];
  questions: Question[];
}

export const AdminSubmissions: React.FC<AdminSubmissionsProps> = ({
  sessions,
  quizzes,
  questions,
}) => {
  const [selectedQuizId, setSelectedQuizId] = useState<string>(quizzes[0]?.id || 'quiz_week_12');
  const [searchTerm, setSearchTerm] = useState('');
  const [inspectSession, setInspectSession] = useState<QuizSession | null>(null);
  const [showScorePoster, setShowScorePoster] = useState(false);

  const questionMap = new Map(questions.map(q => [q.id, q]));
  const activeQuiz = quizzes.find(q => q.id === selectedQuizId) || quizzes[0];

  const filteredSessions = sessions.filter(s => {
    const matchesQuiz = !selectedQuizId || s.quizId === selectedQuizId;
    const matchesSearch =
      s.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.studentRoll.includes(searchTerm) ||
      s.studentClass.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesQuiz && matchesSearch;
  });

  const handleExport = () => {
    if (!activeQuiz) return;
    exportQuizSubmissionsToExcel(activeQuiz, filteredSessions, questions);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
            उत्तर तथा सबमिसन समीक्षा (Submissions)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            विद्यार्थीहरूले बुझाएका उत्तरहरू, प्राप्तांक र प्रत्येक प्रश्नको विस्तृत विवरण
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setShowScorePoster(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs rounded-xl shadow transition flex items-center gap-1.5 cursor-pointer"
            title="सहभागी विद्यार्थीहरूको नतिजा पोस्टर JPG रूपमा हेर्नुहोस् र डाउनलोड गर्नुहोस्"
          >
            <Trophy className="w-4 h-4" />
            <span>🖼️ नतिजा पोस्टर (JPG डाउनलोड)</span>
          </button>

          <button
            onClick={handleExport}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-2 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>यो क्विजको एक्सल डाउनलोड</span>
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <label className="text-xs font-bold text-slate-600 shrink-0">क्विज छान्नुहोस्:</label>
          <select
            value={selectedQuizId}
            onChange={e => setSelectedQuizId(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white text-slate-800"
          >
            {quizzes.map(q => (
              <option key={q.id} value={q.id}>
                {q.title}
              </option>
            ))}
          </select>
        </div>

        <div className="relative w-full sm:w-72">
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="विद्यार्थीको नाम, ID वा रोल खोज्नुहोस्..."
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
                <th className="py-3.5 px-4">कक्षा (सेमेस्टर)</th>
                <th className="py-3.5 px-4 text-center">प्राप्त अंक</th>
                <th className="py-3.5 px-4 text-center">प्रतिशत</th>
                <th className="py-3.5 px-4">समय लागेको</th>
                <th className="py-3.5 px-4 text-center">स्थान</th>
                <th className="py-3.5 px-4">बुझाएको समय (नेपाल)</th>
                <th className="py-3.5 px-4 text-right">कार्य</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {filteredSessions.length > 0 ? (
                filteredSessions.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4">
                      <div>
                        <b className="text-slate-900 text-sm block">{s.studentName}</b>
                        <span className="font-mono text-red-600 font-bold text-[11px]">{s.studentId}</span>
                        <span className="text-slate-400 text-[11px] ml-2">रोल: {toNepaliDigits(s.studentRoll)}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      {s.studentClass} ({s.studentSemester})
                    </td>

                    <td className="py-3 px-4 text-center font-bold text-slate-900 text-sm">
                      {toNepaliDigits(s.score)}/१०
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
                      <button
                        onClick={() => setInspectSession(s)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg flex items-center gap-1.5 transition cursor-pointer ml-auto"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-500" />
                        <span>उत्तर हेर्नुहोस्</span>
                      </button>
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

            <div className="pt-2 text-right">
              <button
                onClick={() => setInspectSession(null)}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl"
              >
                बन्द गर्नुहोस्
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Participants Score Poster Modal (Master Admin Graphic View with JPG/PNG export) */}
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
