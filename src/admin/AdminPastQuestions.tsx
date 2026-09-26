import React, { useState } from 'react';
import type { Quiz, Question } from '../types/quiz';
import { toNepaliDigits, formatNepalDate } from '../lib/nepaliUtils';
import { dataService } from '../lib/dataService';
import {
  FileSpreadsheet,
  Upload,
  Globe,
  CheckCircle2,
  AlertCircle,
  Eye,
  Layers,
  BookOpen,
  Calendar,
  Clock,
  Sparkles,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { UploadPastQuestionsModal } from './components/UploadPastQuestionsModal';

interface AdminPastQuestionsProps {
  quizzes: Quiz[];
  questions: Question[];
  onRefresh: () => void;
  navigate: (path: string) => void;
}

const SET_NAMES: Record<number, string> = {
  1: 'क्याम्पस, शिक्षा र शैक्षिक ज्ञान',
  2: 'नेपाली साहित्य, संस्कृति र इतिहास',
  3: 'विज्ञान, सूचना प्रविधि र आधुनिक आविष्कार',
  4: 'नेपालको भूगोल, सम्पदा र वातावरण',
  5: 'समसामयिक ज्ञान, खेलकुद र बौद्धिक परीक्षण',
};

export const AdminPastQuestions: React.FC<AdminPastQuestionsProps> = ({
  quizzes,
  questions,
  onRefresh,
  navigate,
}) => {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedQuizIdForUpload, setSelectedQuizIdForUpload] = useState<string | undefined>(undefined);
  const [expandedQuizId, setExpandedQuizId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleToggleFrontend = async (quiz: Quiz) => {
    const nextVal = !quiz.showInFrontend;
    const currentAdmin = dataService.getCurrentAdmin();
    const adminEmail = currentAdmin?.email || 'admin@fsudmc.com';

    dataService.updateQuiz(
      {
        ...quiz,
        showInFrontend: nextVal,
      },
      adminEmail
    );

    showToast(
      nextVal
        ? `"${quiz.title}" विगतका प्रश्नहरू पोर्टलमा सार्वजनिक गरियो।`
        : `"${quiz.title}" पोर्टलबाट हटाइयो (गोप्य राखियो)।`
    );
    onRefresh();
  };

  const handleOpenUploadForQuiz = (quizId?: string) => {
    setSelectedQuizIdForUpload(quizId);
    setIsUploadModalOpen(true);
  };

  const publishedCount = quizzes.filter(q => q.showInFrontend).length;
  const totalQuestionsCount = questions.length;

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="p-4 rounded-2xl shadow-xl flex items-center gap-3 text-xs font-bold bg-emerald-900 text-emerald-100 border border-emerald-700">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Top Banner */}
      <div className="bg-gradient-to-r from-red-700 via-rose-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white text-xs font-bold border border-white/20">
              <FileSpreadsheet className="w-3.5 h-3.5 text-amber-300" />
              <span>विगतका प्रश्नहरू (Past Questions) व्यवस्थापन केन्द्र</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              विगतका प्रश्नहरू अपलोड तथा वेबसाइट प्रकाशन
            </h1>
            <p className="text-xs sm:text-sm text-red-100 leading-relaxed">
              सम्पन्न भएका साप्ताहिक क्विजका प्रश्नहरू, उत्तर र व्याख्या यहाँबाट Excel/CSV मार्फत एकमुष्ट (बल्क) अपलोड गर्न सकिन्छ।
              विद्यार्थीहरूले <b className="text-white">विगतका प्रश्नहरू पोर्टल (`/past-questions`)</b> मा गएर तयारी गर्न पाउनेछन्।
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => handleOpenUploadForQuiz()}
              className="px-5 py-3.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs sm:text-sm rounded-2xl shadow-md transition flex items-center gap-2 cursor-pointer transform hover:-translate-y-0.5"
            >
              <Upload className="w-4 h-4 text-slate-950" />
              <span>📤 विगतका प्रश्नहरू बल्क अपलोड</span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/past-questions')}
              className="px-4 py-3.5 bg-white/15 hover:bg-white/25 text-white font-bold text-xs sm:text-sm rounded-2xl border border-white/30 transition flex items-center gap-2 cursor-pointer"
              title="विद्यार्थी पोर्टलमा कस्तो देखिन्छ पूर्वावलोकन गर्नुहोस्"
            >
              <Globe className="w-4 h-4 text-emerald-300" />
              <span>वेबसाइट पोर्टल हेर्नुहोस् &rarr;</span>
            </button>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold text-xl shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 block">कुल क्विजहरू (Quizzes)</span>
            <span className="text-2xl font-black text-slate-900">{toNepaliDigits(quizzes.length)} वटा</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xl shrink-0">
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 block">पोर्टलमा सार्वजनिक (Published)</span>
            <span className="text-2xl font-black text-emerald-600">{toNepaliDigits(publishedCount)} वटा</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xl shrink-0">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 block">कुल प्रश्नहरू (Total Questions)</span>
            <span className="text-2xl font-black text-indigo-600">{toNepaliDigits(totalQuestionsCount)} वटा</span>
          </div>
        </div>
      </div>

      {/* Quizzes List with Past Questions Control */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Layers className="w-5 h-5 text-red-600" />
            <span>क्विज अनुसार विगतका प्रश्नहरू र प्रकाशन स्थिति</span>
          </h2>
          <span className="text-xs text-slate-500">
            स्विच अन गरेर विद्यार्थीहरूलाई वेबसाइटमा देखाउनुहोस्
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {quizzes.map(quiz => {
            const quizQuestions = questions.filter(q => (q.quizId || 'quiz_week_12') === quiz.id);
            const isExpanded = expandedQuizId === quiz.id;

            // Set distribution count
            const sets: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
            quizQuestions.forEach(q => {
              const s = q.setNumber || 1;
              sets[s] = (sets[s] || 0) + 1;
            });

            return (
              <div
                key={quiz.id}
                className={`bg-white rounded-2xl border transition-all ${
                  quiz.showInFrontend
                    ? 'border-emerald-200 shadow-2xs ring-1 ring-emerald-500/10'
                    : 'border-slate-200 shadow-2xs'
                }`}
              >
                <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                        {quiz.id}
                      </span>
                      {quiz.status === 'active' && (
                        <span className="px-2 py-0.5 bg-red-100 text-red-700 font-bold text-[10px] rounded-full uppercase">
                          🔴 चालु क्विज (Active)
                        </span>
                      )}
                      <span
                        className={`px-2 py-0.5 font-bold text-[10px] rounded-full uppercase flex items-center gap-1 ${
                          quiz.showInFrontend
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-slate-100 text-slate-600 border border-slate-300'
                        }`}
                      >
                        <Globe className="w-3 h-3" />
                        {quiz.showInFrontend ? 'पोर्टलमा सार्वजनिक (Live)' : 'गोप्य (Hidden)'}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900">{quiz.title}</h3>
                    <p className="text-xs text-slate-600 line-clamp-1">{quiz.description}</p>

                    {/* Quick sets stats */}
                    <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-500">
                      <span>कुल प्रश्न: <b className="text-slate-800">{toNepaliDigits(quizQuestions.length)}</b></span>
                      <span>•</span>
                      <span>सेट १: <b className="text-slate-700">{toNepaliDigits(sets[1])}</b></span>
                      <span>•</span>
                      <span>सेट २: <b className="text-slate-700">{toNepaliDigits(sets[2])}</b></span>
                      <span>•</span>
                      <span>सेट ३: <b className="text-slate-700">{toNepaliDigits(sets[3])}</b></span>
                      <span>•</span>
                      <span>सेट ४: <b className="text-slate-700">{toNepaliDigits(sets[4])}</b></span>
                      <span>•</span>
                      <span>सेट ५: <b className="text-slate-700">{toNepaliDigits(sets[5])}</b></span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                    {/* Toggle publish button */}
                    <button
                      type="button"
                      onClick={() => handleToggleFrontend(quiz)}
                      className={`px-3.5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-2xs ${
                        quiz.showInFrontend
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
                      }`}
                      title={quiz.showInFrontend ? 'क्लिक गरी अप्रकाशित गर्नुहोस्' : 'पोर्टलमा सार्वजनिक गर्नुहोस्'}
                    >
                      <Globe className="w-4 h-4" />
                      <span>{quiz.showInFrontend ? 'सार्वजनिक छ ✓' : 'पोर्टलमा देखाउनुहोस्'}</span>
                    </button>

                    {/* Upload questions button for this quiz */}
                    <button
                      type="button"
                      onClick={() => handleOpenUploadForQuiz(quiz.id)}
                      className="px-3.5 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <Upload className="w-4 h-4 text-amber-700" />
                      <span>अपलोड गर्नुहोस्</span>
                    </button>

                    {/* Expand/Collapse questions preview */}
                    <button
                      type="button"
                      onClick={() => setExpandedQuizId(isExpanded ? null : quiz.id)}
                      className="px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-4 h-4 text-slate-500" />
                      <span>{isExpanded ? 'लुकाउनुहोस्' : 'प्रश्नहरू हेर्नुहोस्'}</span>
                    </button>
                  </div>
                </div>

                {/* Expanded questions list */}
                {isExpanded && (
                  <div className="border-t border-slate-100 bg-slate-50/70 p-5 rounded-b-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700">
                        यस क्विजका प्रश्नहरू ({toNepaliDigits(quizQuestions.length)} वटा)
                      </span>
                      <button
                        type="button"
                        onClick={() => navigate('/questions')}
                        className="text-xs font-bold text-red-600 hover:underline flex items-center gap-1"
                      >
                        <span>प्रश्न सम्पादन गर्न प्रश्न बैंकमा जानुहोस्</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {quizQuestions.length === 0 ? (
                      <div className="p-8 text-center bg-white rounded-xl border border-dashed border-slate-300 space-y-3">
                        <FileSpreadsheet className="w-8 h-8 text-slate-400 mx-auto" />
                        <p className="text-xs text-slate-500">यस क्विजमा कुनै पनि प्रश्न अपलोड गरिएको छैन।</p>
                        <button
                          type="button"
                          onClick={() => handleOpenUploadForQuiz(quiz.id)}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                        >
                          <Upload className="w-4 h-4" />
                          <span>यसमा Excel बाट प्रश्नहरू अपलोड गर्नुहोस्</span>
                        </button>
                      </div>
                    ) : (
                      <div className="max-h-96 overflow-y-auto space-y-2 pr-1">
                        {quizQuestions.map((q, idx) => (
                          <div
                            key={q.id}
                            className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs text-xs space-y-2"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-400 font-mono">
                                  #{toNepaliDigits(idx + 1)}
                                </span>
                                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold text-[10px]">
                                  सेट {toNepaliDigits(q.setNumber || 1)}: {SET_NAMES[q.setNumber || 1]}
                                </span>
                              </div>
                              <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px]">
                                सही उत्तर: विकल्प {q.correctAnswer}
                              </span>
                            </div>

                            <p className="font-bold text-slate-900 text-xs sm:text-sm">{q.question}</p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600 text-xs pt-1">
                              <span className={q.correctAnswer === 'A' ? 'font-bold text-emerald-700' : ''}>
                                (A) {q.optionA}
                              </span>
                              <span className={q.correctAnswer === 'B' ? 'font-bold text-emerald-700' : ''}>
                                (B) {q.optionB}
                              </span>
                              <span className={q.correctAnswer === 'C' ? 'font-bold text-emerald-700' : ''}>
                                (C) {q.optionC}
                              </span>
                              <span className={q.correctAnswer === 'D' ? 'font-bold text-emerald-700' : ''}>
                                (D) {q.optionD}
                              </span>
                            </div>

                            {q.explanation && (
                              <div className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100 mt-1">
                                💡 <b className="text-slate-700">व्याख्या:</b> {q.explanation}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bulk Upload Modal */}
      <UploadPastQuestionsModal
        quizzes={quizzes}
        defaultQuizId={selectedQuizIdForUpload}
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onRefresh={onRefresh}
        onSuccessToast={showToast}
      />
    </div>
  );
};
