import React, { useState } from 'react';
import type { Quiz, Question, QuestionOption, Student } from '../types/quiz';
import { dataService } from '../lib/dataService';
import { toNepaliDigits, formatNepalDate } from '../lib/nepaliUtils';
import {
  BookOpen,
  CheckCircle2,
  Lock,
  ArrowLeft,
  Sparkles,
  Layers,
  ChevronRight,
  HelpCircle,
  LogIn,
  Check,
  Calendar,
  GraduationCap
} from 'lucide-react';

interface PastQuestionsPageProps {
  navigate: (path: string) => void;
  quizzes: Quiz[];
  student?: Student | null;
}

const SET_METADATA: Record<number, { title: string; category: string; icon: string; color: string; desc: string }> = {
  1: {
    title: 'सेट १',
    category: 'क्याम्पस, शिक्षा र शैक्षिक ज्ञान',
    icon: '🏛️',
    color: 'from-blue-600 to-indigo-700',
    desc: 'त्रिभुवन विश्वविद्यालय, दार्चुला बहुमुखी क्याम्पस र शैक्षिक इतिहास सम्बन्धित प्रश्नहरू',
  },
  2: {
    title: 'सेट २',
    category: 'नेपाली साहित्य, संस्कृति र इतिहास',
    icon: '📜',
    color: 'from-amber-600 to-orange-700',
    desc: 'दार्चुला तथा नेपालको ऐतिहासिक सम्पदा, भाषा, कला र विशिष्ट साहित्यकारहरू',
  },
  3: {
    title: 'सेट ३',
    category: 'विज्ञान, सूचना प्रविधि र आविष्कार',
    icon: '🔬',
    color: 'from-emerald-600 to-teal-700',
    desc: 'आर्टिफिसियल इन्टेलिजेन्स, कम्प्युटर, भौतिक विज्ञान र आधुनिक आविष्कारहरू',
  },
  4: {
    title: 'सेट ४',
    category: 'नेपालको भूगोल, सम्पदा र वातावरण',
    icon: '🏔️',
    color: 'from-sky-600 to-blue-800',
    desc: 'अपि हिमाल, अपि नाम्पा संरक्षण क्षेत्र, दार्चुलाका नदीनाला र भौगोलिक विविधता',
  },
  5: {
    title: 'सेट ५',
    category: 'समसामयिक ज्ञान, खेलकुद र बौद्धिक परीक्षण',
    icon: '🌐',
    color: 'from-purple-600 to-rose-700',
    desc: 'राष्ट्रिय तथा अन्तर्राष्ट्रिय समसामयिक घटना, ओलम्पिक, खेलकुद र बौद्धिक प्रश्नहरू',
  },
};

export const PastQuestionsPage: React.FC<PastQuestionsPageProps> = ({ navigate, quizzes, student }) => {
  // Published quizzes that admin opted to show in frontend
  const publishedQuizzes = quizzes.filter(q => q.showInFrontend);

  // Selected test/quiz for sub-view
  const [activeTestId, setActiveTestId] = useState<string | null>(null);
  // Selected set within that test
  const [activeSetNumber, setActiveSetNumber] = useState<number | null>(null);

  // Requirement: Strictly restrict access to authenticated/logged-in users only
  if (!student) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-xl text-center space-y-6">
          <div className="w-16 h-16 rounded-3xl bg-red-50 text-red-600 flex items-center justify-center mx-auto shadow-inner">
            <Lock className="w-8 h-8 text-red-600" />
          </div>

          <div className="space-y-2">
            <span className="text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-red-100 text-red-700">
              सुरक्षित पहुँच (Restricted Access)
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
              Log in to use this feature.
            </h1>
            <p className="text-slate-600 text-sm max-w-md mx-auto leading-relaxed">
              विगतका क्विजका पुराना प्रश्न तथा उत्तरहरू अध्ययन गर्न क्याम्पस विद्यार्थी खातामा लगइन हुनु अनिवार्य छ।
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => navigate('/login')}
              className="w-full sm:w-auto px-8 py-3.5 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-red-600/25 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>लगइन गर्नुहोस् (Log In)</span>
            </button>
            <button
              onClick={() => navigate('/register')}
              className="w-full sm:w-auto px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl transition cursor-pointer"
            >
              <span>नयाँ विद्यार्थी दर्ता</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const selectedQuiz = activeTestId ? quizzes.find(q => q.id === activeTestId) : null;
  const questionsInQuiz: Question[] = selectedQuiz ? dataService.getQuestions(selectedQuiz.id) : [];

  // LEVEL 3: View Questions of a specific set
  if (selectedQuiz && activeSetNumber !== null) {
    const setMeta = SET_METADATA[activeSetNumber] || {
      title: `सेट ${toNepaliDigits(activeSetNumber)}`,
      category: 'सामान्य ज्ञान',
      icon: '📚',
      color: 'from-slate-700 to-slate-900',
      desc: '',
    };

    const questionsOfSet = questionsInQuiz.filter(q => q.setNumber === activeSetNumber);

    return (
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Navigation Breadcrumb & Back */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={() => {
                setActiveSetNumber(null);
                setActiveTestId(null);
              }}
              className="text-slate-500 hover:text-red-600 font-semibold cursor-pointer"
            >
              सबै परीक्षाहरू
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <button
              onClick={() => setActiveSetNumber(null)}
              className="text-slate-500 hover:text-red-600 font-semibold cursor-pointer"
            >
              {selectedQuiz.title}
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-bold text-slate-900">{setMeta.title}</span>
          </div>

          <button
            onClick={() => setActiveSetNumber(null)}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>सेट सूचीमा फर्कनुहोस्</span>
          </button>
        </div>

        {/* Set Header Banner */}
        <div className={`bg-gradient-to-r ${setMeta.color} text-white rounded-3xl p-6 sm:p-8 shadow-xl space-y-2`}>
          <div className="flex items-center gap-3">
            <span className="text-3xl">{setMeta.icon}</span>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-white/80">
                {selectedQuiz.title} • {setMeta.title}
              </span>
              <h2 className="text-xl sm:text-2xl font-black">{setMeta.category}</h2>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-white/90 leading-relaxed pt-1">
            {setMeta.desc}
          </p>
        </div>

        {/* Questions list */}
        {questionsOfSet.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center space-y-3">
            <div className="text-4xl">📭</div>
            <h3 className="text-base font-bold text-slate-800">यस सेटमा कुनै प्रश्न भेटिएन</h3>
            <p className="text-xs text-slate-500">
              यस सेटका प्रश्नहरू छिट्टै अद्यावधिक गरिनेछ।
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {questionsOfSet.map((q, idx) => {
              const options: { key: QuestionOption; text: string }[] = [
                { key: 'A', text: q.optionA },
                { key: 'B', text: q.optionB },
                { key: 'C', text: q.optionC },
                { key: 'D', text: q.optionD },
              ];

              return (
                <div
                  key={q.id}
                  className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-2xs space-y-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <span className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 font-black text-xs flex items-center justify-center shrink-0 border border-slate-200">
                        {toNepaliDigits(idx + 1)}
                      </span>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                          {setMeta.title} • प्रश्न नं {toNepaliDigits(idx + 1)}
                        </span>
                        <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-relaxed">
                          {q.question}
                        </h3>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold shrink-0 flex items-center gap-1">
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span>सही उत्तर: ({q.correctAnswer})</span>
                    </span>
                  </div>

                  {/* Options */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    {options.map(opt => {
                      const isCorrect = q.correctAnswer === opt.key;
                      return (
                        <div
                          key={opt.key}
                          className={`p-3 rounded-2xl border text-xs transition flex items-center gap-2.5 ${
                            isCorrect
                              ? 'bg-emerald-50/90 border-emerald-400 text-emerald-950 font-bold ring-2 ring-emerald-300/40 shadow-2xs'
                              : 'bg-slate-50/70 border-slate-200 text-slate-700'
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

                  {q.explanation && (
                    <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-3.5 text-xs text-amber-900 flex items-start gap-2.5">
                      <HelpCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <span className="font-bold text-amber-950 block">💡 स्पष्टीकरण (Explanation):</span>
                        <p className="text-amber-800 leading-relaxed font-normal">{q.explanation}</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // LEVEL 2: Sub-view showing 5 individual set cards for the clicked test
  if (selectedQuiz) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={() => setActiveTestId(null)}
              className="text-slate-500 hover:text-red-600 font-semibold cursor-pointer"
            >
              सबै परीक्षाहरू
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-bold text-slate-900">{selectedQuiz.title}</span>
          </div>

          <button
            onClick={() => setActiveTestId(null)}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>सबै परीक्षा कार्डहरूमा फर्कनुहोस्</span>
          </button>
        </div>

        {/* Test Overview Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-amber-300 text-xs font-bold border border-white/10">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>५ वटा विषयगत सेटहरूबाट छनोट गर्नुहोस्</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black">{selectedQuiz.title}</h1>
          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-2xl">
            {selectedQuiz.description || 'तलका ५ वटा व्यक्तिगत सेट कार्डहरूमध्ये कुनै एक छानेर प्रश्न तथा सही उत्तरहरू अध्ययन गर्नुहोस्।'}
          </p>
          <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-slate-300">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-red-400" />
              <span>मिति: <b>{formatNepalDate(selectedQuiz.startAt, false)}</b></span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span>कुल प्रश्न: <b>{toNepaliDigits(questionsInQuiz.length)} वटा</b></span>
            </span>
          </div>
        </div>

        {/* 5 Individual Set Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5].map(setNum => {
            const meta = SET_METADATA[setNum];
            const countInSet = questionsInQuiz.filter(q => q.setNumber === setNum).length;

            return (
              <div
                key={setNum}
                onClick={() => setActiveSetNumber(setNum)}
                className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-2xs hover:shadow-xl hover:border-red-400 transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-3xl p-2.5 rounded-2xl bg-slate-50 border border-slate-100 group-hover:scale-110 transition-transform">
                      {meta.icon}
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-red-50 text-red-700 text-[11px] font-bold border border-red-100">
                      {meta.title}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-black text-slate-900 group-hover:text-red-600 transition-colors">
                      {meta.category}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      {meta.desc}
                    </p>
                  </div>
                </div>

                <div className="pt-5 mt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-600">
                    उपलब्ध प्रश्न: <b className="text-slate-900">{toNepaliDigits(countInSet)} वटा</b>
                  </span>
                  <span className="font-bold text-red-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    <span>अध्ययन गर्नुहोस्</span>
                    <ChevronRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // LEVEL 1: Display a card for each test (quiz)
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
              विगतका क्विज परीक्षा सङ्ग्रहहरू
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1.5 max-w-2xl leading-relaxed">
              क्याम्पस प्रशासनद्वारा सार्वजनिक गरिएका साप्ताहिक परीक्षाहरूको कार्ड छान्नुहोस् र ५ वटा व्यक्तिगत सेटहरू अध्ययन गर्नुहोस्।
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
            onClick={() => navigate('/todays-quize')}
            className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
          >
            आजको क्विजमा जानुहोस् &rarr;
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-red-600" />
              <span>उपलब्ध परीक्षाहरू (Available Tests)</span>
            </h2>
            <span className="text-xs text-slate-500 font-semibold">
              कुल {toNepaliDigits(publishedQuizzes.length)} परीक्षा
            </span>
          </div>

          {/* Test Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {publishedQuizzes.map((quiz, index) => {
              const quizQuestions = dataService.getQuestions(quiz.id);

              return (
                <div
                  key={quiz.id}
                  onClick={() => {
                    setActiveTestId(quiz.id);
                    setActiveSetNumber(null);
                  }}
                  className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-2xs hover:shadow-xl hover:border-red-400 transition-all cursor-pointer group flex flex-col justify-between relative overflow-hidden"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-3 py-1 rounded-full bg-red-50 text-red-700 text-xs font-black border border-red-100 flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>परीक्षा {toNepaliDigits(index + 1)} (Card {index + 1})</span>
                      </span>

                      <span className="text-[11px] font-mono text-slate-400">
                        {toNepaliDigits(quiz.durationMinutes)} मिनेट
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-black text-slate-900 group-hover:text-red-600 transition-colors leading-snug">
                        {quiz.title}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                        {quiz.description || 'विगतको साप्ताहिक हाजिरी जवाफ प्रतियोगिताका ५ सेट प्रश्नहरू'}
                      </p>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-xs space-y-1">
                      <div className="flex items-center justify-between text-slate-600">
                        <span>परीक्षा मिति (B.S.):</span>
                        <b className="text-slate-800">{formatNepalDate(quiz.startAt, false)}</b>
                      </div>
                      <div className="flex items-center justify-between text-slate-600">
                        <span>कुल प्रश्न:</span>
                        <b className="text-slate-800">{toNepaliDigits(quizQuestions.length)} वटा</b>
                      </div>
                      <div className="flex items-center justify-between text-slate-600">
                        <span>विषयगत सेटहरू:</span>
                        <b className="text-emerald-700 font-bold">५ सेट उपलब्ध</b>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-400">
                      क्लिक गरी ५ सेट खोल्नुहोस्
                    </span>
                    <span className="px-3.5 py-1.5 rounded-xl bg-red-600 group-hover:bg-red-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs transition">
                      <span>सेटहरू हेर्नुहोस्</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
