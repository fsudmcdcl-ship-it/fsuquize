import React, { useState } from 'react';
import type { Quiz, Question, QuestionOption } from '../types/quiz';
import { dataService } from '../lib/dataService';
import { toNepaliDigits, formatNepalDate } from '../lib/nepaliUtils';
import { BookOpen, CheckCircle2, Award, Clock, ArrowLeft, Sparkles, Filter, Check, HelpCircle } from 'lucide-react';

interface PastQuestionsPageProps {
  navigate: (path: string) => void;
  quizzes: Quiz[];
}

export const PastQuestionsPage: React.FC<PastQuestionsPageProps> = ({ navigate, quizzes }) => {
  // Published quizzes that admin opted to show in frontend
  const publishedQuizzes = quizzes.filter(q => q.showInFrontend);

  const [selectedQuizId, setSelectedQuizId] = useState<string>(() => {
    return publishedQuizzes[0]?.id || quizzes[0]?.id || '';
  });
  const [selectedSet, setSelectedSet] = useState<number | 'all'>('all');

  const currentQuiz = quizzes.find(q => q.id === selectedQuizId) || publishedQuizzes[0] || quizzes[0];
  const allQuestions: Question[] = currentQuiz ? dataService.getQuestions(currentQuiz.id) : [];

  const filteredQuestions = allQuestions.filter(q => {
    if (selectedSet === 'all') return true;
    return q.setNumber === selectedSet;
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-red-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-amber-300 border border-white/10 mb-3">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>पुराना प्रश्न तथा उत्तर सङ्ग्रह (Past Question Bank)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              विगतका क्विज प्रश्न तथा सही उत्तरहरू
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1.5 max-w-2xl leading-relaxed">
              क्याम्पस प्रशासनद्वारा सार्वजनिक गरिएका पुराना क्विज सेटहरू, सही उत्तर र स्पष्टीकरण अध्ययन गरी आफ्नो सामान्य ज्ञान अभिवृद्धि गर्नुहोस्।
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate('/')}
            className="self-start sm:self-auto px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-xs font-bold text-white transition flex items-center gap-2 cursor-pointer shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>गृहपृष्ठ</span>
          </button>
        </div>
      </div>

      {publishedQuizzes.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 sm:p-14 border border-slate-200 text-center space-y-4 max-w-lg mx-auto shadow-xs">
          <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto text-3xl shadow-xs">
            📚
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900">
              हाल कुनै पनि पुराना प्रश्नोत्तर सार्वजनिक गरिएको छैन
            </h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              क्विज सम्पन्न भएपछि क्याम्पस प्रशासनले पुराना सेटहरू यहाँ सार्वजनिक गरेपछि हेर्न सकिनेछ।
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/todays-quiz')}
            className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
          >
            आजको क्विजमा जानुहोस् &rarr;
          </button>
        </div>
      ) : (
        <>
          {/* Quiz & Set Selector Controls */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Quiz Selector */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <label className="text-xs font-bold text-slate-700 whitespace-nowrap">
                क्विज छान्नुहोस्:
              </label>
              <select
                value={selectedQuizId}
                onChange={e => {
                  setSelectedQuizId(e.target.value);
                  setSelectedSet('all');
                }}
                className="px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold bg-white text-slate-800 focus:ring-2 focus:ring-red-500 outline-hidden min-w-[240px]"
              >
                {publishedQuizzes.map(q => (
                  <option key={q.id} value={q.id}>
                    {q.title} ({formatNepalDate(q.startAt)})
                  </option>
                ))}
              </select>
            </div>

            {/* Set Selector Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-bold text-slate-500 mr-1 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" />
                <span>सेट:</span>
              </span>
              <button
                type="button"
                onClick={() => setSelectedSet('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  selectedSet === 'all'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                सबै प्रश्नहरू ({allQuestions.length})
              </button>
              {[1, 2, 3, 4, 5].map(setNum => (
                <button
                  key={setNum}
                  type="button"
                  onClick={() => setSelectedSet(setNum)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    selectedSet === setNum
                      ? 'bg-red-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  सेट {toNepaliDigits(setNum)}
                </button>
              ))}
            </div>
          </div>

          {/* Current Quiz Overview Card */}
          {currentQuiz && (
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs text-slate-600 flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="text-slate-400 block text-[11px]">चयन गरिएको क्विज</span>
                <span className="font-bold text-slate-900 text-sm">{currentQuiz.title}</span>
              </div>
              <div className="flex items-center gap-4">
                <span>कुल प्रश्न: <b className="text-slate-900">{toNepaliDigits(allQuestions.length)} वटा</b></span>
                <span>•</span>
                <span>समय: <b className="text-slate-900">{toNepaliDigits(currentQuiz.durationMinutes)} मिनेट</b></span>
              </div>
            </div>
          )}

          {/* Question List */}
          <div className="space-y-5">
            {filteredQuestions.length > 0 ? (
              filteredQuestions.map((q, idx) => {
                const options: { key: QuestionOption; text: string }[] = [
                  { key: 'A', text: q.optionA },
                  { key: 'B', text: q.optionB },
                  { key: 'C', text: q.optionC },
                  { key: 'D', text: q.optionD },
                ];

                return (
                  <div
                    key={q.id}
                    className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4 hover:border-slate-300 transition"
                  >
                    {/* Question Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <span className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 font-black text-xs flex items-center justify-center shrink-0 border border-slate-200">
                          {toNepaliDigits(idx + 1)}
                        </span>
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                            सेट {toNepaliDigits(q.setNumber)} • प्रश्न नं {toNepaliDigits(idx + 1)}
                          </span>
                          <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-relaxed">
                            {q.question}
                          </h3>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold shrink-0 flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span>उत्तर: {q.correctAnswer}</span>
                      </span>
                    </div>

                    {/* Options Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                      {options.map(opt => {
                        const isCorrect = q.correctAnswer === opt.key;
                        return (
                          <div
                            key={opt.key}
                            className={`p-3 rounded-2xl border text-xs transition flex items-center gap-2.5 ${
                              isCorrect
                                ? 'bg-emerald-50/80 border-emerald-400 text-emerald-950 font-bold ring-2 ring-emerald-300/40 shadow-2xs'
                                : 'bg-slate-50/60 border-slate-200 text-slate-700'
                            }`}
                          >
                            <span
                              className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center shrink-0 ${
                                isCorrect
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-white text-slate-600 border border-slate-200'
                              }`}
                            >
                              {opt.key}
                            </span>
                            <span className="flex-1">{opt.text}</span>
                            {isCorrect && (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Explanation */}
                    {q.explanation && (
                      <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-3.5 text-xs text-amber-900 flex items-start gap-2.5">
                        <HelpCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div className="space-y-0.5">
                          <span className="font-bold text-amber-950 block">💡 स्पष्टीकरण (Explanation):</span>
                          <p className="text-amber-800 leading-relaxed font-normal">{q.explanation}</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="bg-white rounded-3xl p-10 border border-slate-200 text-center text-slate-400 text-xs">
                यस सेटमा कुनै प्रश्न भेटिएन।
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
