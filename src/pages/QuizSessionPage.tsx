import React, { useState, useEffect } from 'react';
import { dataService } from '../lib/dataService';
import type { Student, Quiz, Question, QuizSession, QuestionOption } from '../types/quiz';
import { toNepaliDigits, formatTimer, formatDurationSeconds } from '../lib/nepaliUtils';
import { Clock, AlertTriangle, CheckCircle, ArrowLeft, ArrowRight, Send, Check, X, ShieldAlert, Award, Dices, Sparkles, Shuffle, CheckCircle2, Lock } from 'lucide-react';
import confetti from 'canvas-confetti';

interface QuizSessionPageProps {
  quizId: string;
  student: Student;
  activeQuiz: Quiz | null;
  navigate: (path: string) => void;
  onSessionUpdated?: () => void;
}

export const QuizSessionPage: React.FC<QuizSessionPageProps> = ({
  quizId,
  student,
  activeQuiz,
  navigate,
  onSessionUpdated,
}) => {
  const [session, setSession] = useState<QuizSession | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(600);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [autoExpiredNotice, setAutoExpiredNotice] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // States for pre-quiz Pick Questions for Me generator
  const [isPickingQuestions, setIsPickingQuestions] = useState(false);
  const [hasPickedQuestions, setHasPickedQuestions] = useState(false);
  const [previewQuestions, setPreviewQuestions] = useState<Question[]>([]);

  // Check if session or locked picked questions already exist for this student
  useEffect(() => {
    if (!activeQuiz) return;

    const existing = dataService.getStudentSession(quizId, student.id);
    if (existing) {
      setSession(existing);

      // Retrieve questions matching the session's selected question IDs
      const allBank = dataService.getQuestions(quizId);
      const bankMap = new Map(allBank.map(q => [q.id, q]));
      const matched = existing.selectedQuestionIds
        .map(id => bankMap.get(id))
        .filter((q): q is Question => Boolean(q));

      setQuestions(matched);
    } else {
      // Check if student has already locked questions before session was officially started
      const lockedIds = dataService.getPickedQuestionsForStudent(quizId, student.id);
      if (lockedIds && lockedIds.length === 10) {
        const allBank = dataService.getQuestions(quizId);
        const bankMap = new Map(allBank.map(q => [q.id, q]));
        const matched = lockedIds
          .map(id => bankMap.get(id))
          .filter((q): q is Question => Boolean(q));
        if (matched.length === 10) {
          setPreviewQuestions(matched);
          setHasPickedQuestions(true);
        }
      }
    }
  }, [activeQuiz, quizId, student]);

  // Handle Pick Questions for Me action (Locks them once and prevents picking again)
  const handleGenerateQuestions = () => {
    if (hasPickedQuestions) return; // Disallow picking again!
    setIsPickingQuestions(true);
    setTimeout(() => {
      const generated = dataService.pickAndLockQuestionsForStudent(quizId, student.id);
      setPreviewQuestions(generated);
      setIsPickingQuestions(false);
      setHasPickedQuestions(true);
    }, 800);
  };

  // Start the quiz with the picked questions (or random 10 if none picked yet)
  const handleStartSession = () => {
    if (!activeQuiz) return;
    const qIds = previewQuestions.length === 10
      ? previewQuestions.map(q => q.id)
      : undefined;

    const newSession = dataService.startQuizSession(activeQuiz, student, qIds);
    setSession(newSession);

    const allBank = dataService.getQuestions(quizId);
    const bankMap = new Map(allBank.map(q => [q.id, q]));
    const matched = newSession.selectedQuestionIds
      .map(id => bankMap.get(id))
      .filter((q): q is Question => Boolean(q));
    setQuestions(matched);
    onSessionUpdated?.();
  };

  // Timer countdown management
  useEffect(() => {
    if (!session || session.status !== 'in_progress') return;

    const calculateRemaining = () => {
      const expiry = new Date(session.expiresAt).getTime();
      const now = Date.now();
      const diffSec = Math.max(0, Math.floor((expiry - now) / 1000));
      return diffSec;
    };

    setRemainingSeconds(calculateRemaining());

    const interval = setInterval(() => {
      const remaining = calculateRemaining();
      setRemainingSeconds(remaining);

      // Auto-submit when timer expires
      if (remaining <= 0) {
        clearInterval(interval);
        handleAutoExpire();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [session]);

  const handleAutoExpire = () => {
    if (!session || session.status !== 'in_progress') return;
    setAutoExpiredNotice(true);
    const updated = dataService.submitQuizSession(session.quizId, session.studentId, true);
    if (updated) {
      setSession(updated);
      onSessionUpdated?.();
    }
  };

  const handleSelectOption = (option: QuestionOption) => {
    if (!session || session.status !== 'in_progress') return;
    const currentQ = questions[currentIndex];
    if (!currentQ) return;

    const updated = dataService.saveAnswer(session.quizId, session.studentId, currentQ.id, option);
    if (updated) {
      setSession({ ...updated });
    }
  };

  const handleFinalSubmit = () => {
    if (!session || session.status !== 'in_progress') return;
    setIsSubmitting(true);

    const updated = dataService.submitQuizSession(session.quizId, session.studentId, false);
    setIsSubmitting(false);
    setConfirmModalOpen(false);

    if (updated) {
      setSession(updated);
      onSessionUpdated?.();

      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch {
        // confetti optional
      }
    }
  };

  if (!session) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Back navigation */}
        <button
          onClick={() => navigate('/todays-quize')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>क्विज जानकारीमा फर्कनुहोस्</span>
        </button>

        {/* Main Preparation Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-md space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-red-600 to-rose-500 text-white flex items-center justify-center shadow-md shadow-red-500/20">
                <Dices className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
                  क्विज सुरु पूर्व तयारी
                </span>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                  मेरो लागि प्रश्न छान्नुहोस्
                </h1>
              </div>
            </div>

            <span className="text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-600" />
              <span>१० मिनेटको समयसीमा</span>
            </span>
          </div>

          {/* Student Info Bar */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/70 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">सहभागी विद्यार्थी</span>
              <span className="font-bold text-slate-800 text-sm">{student.name}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">कक्षा / सेमेस्टर</span>
              <span className="font-bold text-slate-800">{student.class} ({student.semester} सेमे.)</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">रोल नं.</span>
              <span className="font-bold text-slate-800">{toNepaliDigits(student.rollNo)}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">प्रश्न बैङ्क</span>
              <span className="font-bold text-red-600">५० प्रश्न (५ सेटहरू)</span>
            </div>
          </div>

          {/* Core Mechanism Explanation */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-5 sm:p-6 rounded-3xl relative overflow-hidden">
            <div className="absolute right-0 top-0 w-40 h-40 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="flex items-start gap-3.5">
              <Sparkles className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-base font-black text-white">
                  विद्यार्थीपिच्छे १० वटा अनियमित प्रश्नहरू (Randomized Selection)
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 mt-1.5 leading-relaxed">
                  कुनै निश्चित सेट (Set 1, 2, 3...) मा मात्र सीमित नभई, ५० वटा सम्पूर्ण प्रश्नहरूको बैङ्कबाट तपाईंका लागि <b>१० वटा फरक प्रश्नहरू</b> अनियमित रूपमा छानिन्छन्।
                  तलको बटन थिचेर आफ्ना लागि १० प्रश्नहरू तयार गर्नुहोस्।
                </p>
              </div>
            </div>
          </div>

          {/* Generator Area */}
          {!hasPickedQuestions && !isPickingQuestions && (
            <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-3xl p-8 text-center space-y-4">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                <Shuffle className="w-8 h-8 text-red-600" />
              </div>
              <div>
                <h4 className="text-base font-black text-slate-900">
                  तपाईंका लागि १० प्रश्नहरू तयार गर्न तल थिच्नुहोस्
                </h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                  'मेरो लागि प्रश्न छान्नुहोस्' बटन थिचेपछि ५० प्रश्नहरूको बैङ्कबाट तपाईंका लागि निष्पक्ष १० अनियमित प्रश्नहरू चयन हुनेछन्।
                </p>
              </div>

              <button
                type="button"
                onClick={handleGenerateQuestions}
                className="px-8 py-4 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-black text-sm rounded-2xl shadow-lg shadow-red-600/30 transition transform hover:-translate-y-0.5 flex items-center justify-center gap-2.5 mx-auto cursor-pointer"
              >
                <Dices className="w-5 h-5" />
                <span>🎲 मेरो लागि १० प्रश्नहरू छान्नुहोस् (Pick Questions for Me)</span>
              </button>
            </div>
          )}

          {/* Generating animation */}
          {isPickingQuestions && (
            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-10 text-center space-y-4">
              <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <div>
                <h4 className="text-base font-black text-slate-900">
                  ५० प्रश्नहरूबाट १० वटा अनियमित प्रश्नहरू छानिँदैछ...
                </h4>
                <p className="text-xs text-slate-500 mt-1 font-mono">
                  [सेट १ देखि ५ सम्मका प्रश्नहरूको निष्पक्ष ¥यान्डम मिश्रण प्रगतिमा...]
                </p>
              </div>
            </div>
          )}

          {/* Picked Questions Preview & Start Button */}
          {hasPickedQuestions && !isPickingQuestions && previewQuestions.length === 10 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 px-4 py-3 rounded-2xl">
                <div className="flex items-center gap-2 text-emerald-800 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>१० वटा प्रश्न सफलतापूर्वक छानिइसक्यो र सुरक्षित गरियो!</span>
                </div>
                <span className="text-[11px] font-bold text-amber-800 bg-amber-100/90 px-2.5 py-1 rounded-lg border border-amber-200 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-amber-700" />
                  <span>छनोट सुरक्षित (एकपटक मात्र अवसर)</span>
                </span>
              </div>

              {/* Question list */}
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {previewQuestions.map((q, idx) => (
                  <div
                    key={q.id}
                    className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between gap-3 text-left hover:bg-slate-100/70 transition"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="w-7 h-7 rounded-xl bg-white border border-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                        {toNepaliDigits(idx + 1)}
                      </span>
                      <p className="text-xs font-semibold text-slate-800 truncate">
                        {q.question}
                      </p>
                    </div>

                    <span className="shrink-0 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200">
                      सेट {toNepaliDigits(q.setNumber)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Start Quiz Action Card */}
              <div className="bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
                <div>
                  <h4 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-red-600" />
                    <span>क्विज सुरु गर्न तयार हुनुहुन्छ?</span>
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    तपाईंका लागि यी १० प्रश्नहरू निश्चित भइसकेका छन् (फेरि परिवर्तन गर्न पाइने छैन)। 'सुरु गर्नुहोस्' थिचेपछि तत्काल १० मिनेट (६०० सेकेन्ड) को काउन्टडाउन सुरु हुनेछ।
                  </p>
                </div>

                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={handleStartSession}
                    className="flex-1 sm:flex-initial px-8 py-3.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-black text-sm rounded-2xl shadow-lg shadow-red-600/30 transition transform hover:-translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>🚀 क्विज सुरु गर्नुहोस्</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-slate-600 text-sm font-semibold">क्विज प्रश्नहरू लोड हुँदैछन्...</p>
      </div>
    );
  }

  // If completed: show Results and Question-by-Question Review (Requirements 20, 21, 22)
  if (session.status === 'submitted' || session.status === 'expired') {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Results Banner */}
        <div className="bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 text-white rounded-3xl p-6 sm:p-10 shadow-xl text-center space-y-4 relative overflow-hidden">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto text-3xl shadow-inner">
            🎉
          </div>

          <div>
            <span className="text-xs font-bold text-amber-200 uppercase tracking-widest block mb-1">
              क्विज सम्पन्न भयो!
            </span>
            <h1 className="text-3xl sm:text-4xl font-black">
              तपाईंको क्विज नतिजा
            </h1>
            <p className="text-rose-100 text-xs sm:text-sm mt-1">
              {activeQuiz?.title}
            </p>
          </div>

          {/* Score breakdown pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto pt-2">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/20">
              <span className="text-[11px] text-rose-100 block">प्राप्त अंक (Score)</span>
              <span className="text-2xl font-black text-amber-300">
                {toNepaliDigits(session.score)}/१०
              </span>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/20">
              <span className="text-[11px] text-rose-100 block">प्रतिशत (Percentage)</span>
              <span className="text-2xl font-black text-amber-300">
                {toNepaliDigits(session.percentage)}%
              </span>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/20">
              <span className="text-[11px] text-rose-100 block">समय लागेको</span>
              <span className="text-base font-bold text-white">
                {formatDurationSeconds(session.timeTakenSeconds)}
              </span>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/20">
              <span className="text-[11px] text-rose-100 block">हालको स्थान (Rank)</span>
              <span className="text-2xl font-black text-white font-mono">
                {session.rank ? `#${toNepaliDigits(session.rank)}` : '-'}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-3 pt-4">
            <button
              onClick={() => navigate('/winner-list')}
              className="px-6 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl shadow transition cursor-pointer"
            >
              साप्ताहिक विजेता सूची हेर्नुहोस्
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-6 py-2.5 bg-white/20 hover:bg-white/30 text-white font-semibold text-xs rounded-xl transition cursor-pointer"
            >
              ड्यासबोर्डमा फर्कनुहोस्
            </button>
          </div>
        </div>

        {/* Detailed Question Review List */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-xl font-bold text-slate-900">प्रश्न र उत्तर समीक्षा</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              प्रत्येक प्रश्नमा तपाईंको उत्तर, सही उत्तर र व्याख्या तल हेर्न सक्नुहुन्छ:
            </p>
          </div>

          <div className="space-y-6">
            {questions.map((q, idx) => {
              const studentAns = session.answers[q.id];
              const isCorrect = studentAns === q.correctAnswer;
              const isUnanswered = !studentAns;

              return (
                <div
                  key={q.id}
                  className={`p-5 rounded-2xl border transition-all ${
                    isUnanswered
                      ? 'border-slate-200 bg-slate-50/50'
                      : isCorrect
                      ? 'border-emerald-200 bg-emerald-50/30'
                      : 'border-red-200 bg-red-50/30'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-700">
                      प्रश्न {toNepaliDigits(idx + 1)}
                    </span>

                    {isUnanswered ? (
                      <span className="text-xs font-bold text-slate-500 bg-slate-200/70 px-2.5 py-0.5 rounded-full">
                        अनुत्तरित
                      </span>
                    ) : isCorrect ? (
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        सही उत्तर (+१)
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-red-700 bg-red-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <X className="w-3.5 h-3.5" />
                        गलत उत्तर
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-slate-900 mb-4">{q.question}</h3>

                  {/* Options */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {(['A', 'B', 'C', 'D'] as QuestionOption[]).map(opt => {
                      const text = q[`option${opt}` as keyof Question];
                      const isThisCorrect = q.correctAnswer === opt;
                      const isStudentChoice = studentAns === opt;

                      let optClass = 'border-slate-200 bg-white text-slate-700';
                      if (isThisCorrect) {
                        optClass = 'border-emerald-500 bg-emerald-500 text-white font-bold';
                      } else if (isStudentChoice && !isCorrect) {
                        optClass = 'border-red-400 bg-red-100 text-red-800 line-through';
                      }

                      return (
                        <div
                          key={opt}
                          className={`p-3 rounded-xl border flex items-center gap-2.5 ${optClass}`}
                        >
                          <span className="w-6 h-6 rounded-lg bg-black/10 flex items-center justify-center font-bold text-[11px] shrink-0">
                            {opt}
                          </span>
                          <span className="flex-1">{text}</span>
                          {isThisCorrect && <span>✓</span>}
                          {isStudentChoice && !isThisCorrect && <span>✗</span>}
                        </div>
                      );
                    })}
                  </div>

                  {/* Explanation if available */}
                  {q.explanation && (
                    <div className="mt-3 p-3 rounded-xl bg-slate-100/80 border border-slate-200 text-xs text-slate-700">
                      <b className="text-slate-900">व्याख्या: </b>
                      <span>{q.explanation}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Active quiz in progress
  const currentQuestion = questions[currentIndex];
  const selectedOption = session.answers[currentQuestion?.id];
  const answeredCount = Object.keys(session.answers).length;
  const unansweredCount = questions.length - answeredCount;
  const isUrgentTimer = remainingSeconds <= 60; // under 1 minute warning

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Top Header: Sticky Countdown & Student Tag */}
      <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200/80 shadow-md flex flex-wrap items-center justify-between gap-4 sticky top-18 z-30">
        <div>
          <span className="text-xs font-bold text-red-600 uppercase tracking-widest block">
            {activeQuiz?.title}
          </span>
          <h2 className="text-lg font-black text-slate-900 mt-0.5">
            विद्यार्थी: {student.name} ({student.id})
          </h2>
        </div>

        {/* 10-Minute Countdown Display (Requirement 14, 15) */}
        <div
          className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl font-mono font-black text-lg transition-colors ${
            isUrgentTimer
              ? 'bg-red-600 text-white animate-pulse shadow-md shadow-red-600/30'
              : 'bg-slate-900 text-amber-400'
          }`}
        >
          <Clock className={`w-5 h-5 ${isUrgentTimer ? 'text-white' : 'text-amber-400'}`} />
          <span className="tracking-widest">
            {formatTimer(remainingSeconds)}
          </span>
          <span className="text-xs font-normal opacity-75 font-sans">बाँकी</span>
        </div>
      </div>

      {/* Auto-expire banner notice if triggered */}
      {autoExpiredNotice && (
        <div className="bg-amber-500 text-white rounded-2xl p-4 flex items-center gap-3 animate-in fade-in">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span className="text-xs font-bold">
            समय समाप्त भयो: तपाईंको उत्तर स्वतः सुरक्षित र बुझाइएको छ।
          </span>
        </div>
      )}

      {/* Question Number Pills Navigation (१ २ ३ ४ ५ ६ ७ ८ ९ १०) */}
      <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-2xs flex flex-wrap items-center justify-center gap-2">
        {questions.map((q, idx) => {
          const isCurrent = idx === currentIndex;
          const isAnswered = Boolean(session.answers[q.id]);

          let btnColor = 'bg-slate-100 text-slate-600 hover:bg-slate-200';
          if (isCurrent) {
            btnColor = 'bg-red-600 text-white ring-2 ring-red-400 font-black';
          } else if (isAnswered) {
            btnColor = 'bg-emerald-600 text-white font-bold';
          }

          return (
            <button
              key={q.id}
              onClick={() => setCurrentIndex(idx)}
              className={`w-9 h-9 rounded-xl text-xs font-medium transition cursor-pointer flex items-center justify-center ${btnColor}`}
            >
              {toNepaliDigits(idx + 1)}
            </button>
          );
        })}
      </div>

      {/* Main Question Card */}
      {currentQuestion && (
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-md">
          {/* Header of question */}
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
            <span className="inline-block px-3 py-1 rounded-full bg-red-50 text-red-700 text-xs font-bold">
              प्रश्न {toNepaliDigits(currentIndex + 1)} / {toNepaliDigits(questions.length)}
            </span>
            <span className="text-xs font-medium text-slate-400">
              सेट {toNepaliDigits(currentQuestion.setNumber)}
            </span>
          </div>

          {/* Question Text */}
          <h3 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug mb-8">
            {currentQuestion.question}
          </h3>

          {/* Options: A, B, C, D */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(['A', 'B', 'C', 'D'] as QuestionOption[]).map(opt => {
              const text = currentQuestion[`option${opt}` as keyof Question];
              const isSelected = selectedOption === opt;

              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => handleSelectOption(opt)}
                  className={`p-4 rounded-2xl border text-left transition flex items-center gap-3.5 cursor-pointer ${
                    isSelected
                      ? 'border-red-600 bg-red-50/70 text-red-950 font-bold shadow-xs'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-800'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 transition ${
                      isSelected
                        ? 'bg-red-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {opt}
                  </div>
                  <span className="text-sm leading-relaxed flex-1">{text}</span>
                  {isSelected && <Check className="w-5 h-5 text-red-600 shrink-0" />}
                </button>
              );
            })}
          </div>

          {/* Navigation & Submit Bar */}
          <div className="mt-10 pt-6 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <button
              onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
              disabled={currentIndex === 0}
              className="px-4 py-2.5 rounded-xl border border-slate-300 disabled:opacity-40 text-slate-700 font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>अघिल्लो प्रश्न</span>
            </button>

            <div className="text-xs text-slate-400 font-medium hidden sm:block">
              उत्तर स्वतः सुरक्षित हुन्छ
            </div>

            <div className="flex gap-2">
              {currentIndex < questions.length - 1 ? (
                <button
                  onClick={() => setCurrentIndex(currentIndex + 1)}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <span>अर्को प्रश्न</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : null}

              <button
                onClick={() => setConfirmModalOpen(true)}
                className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md shadow-red-600/20"
              >
                <Send className="w-4 h-4" />
                <span>क्विज बुझाउनुहोस्</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal (Requirement 18) */}
      {confirmModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            <div className="text-center">
              <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-3 text-2xl font-bold">
                ⚠️
              </div>
              <h3 className="text-xl font-black text-slate-900">
                तपाईंका उत्तरहरू जाँच गर्नुहोस्
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                क्विज बुझाएपछि उत्तरहरू फेरबदल गर्न पाइने छैन।
              </p>
            </div>

            {/* Answered & Unanswered count */}
            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
              <div>
                <span className="text-xs text-slate-500 block">हल गरिएका प्रश्न</span>
                <span className="text-2xl font-black text-emerald-600">
                  {toNepaliDigits(answeredCount)}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">बाँकी रहेका प्रश्न</span>
                <span className={`text-2xl font-black ${unansweredCount > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                  {toNepaliDigits(unansweredCount)}
                </span>
              </div>
            </div>

            {unansweredCount > 0 && (
              <p className="text-xs text-amber-700 bg-amber-50 p-3 rounded-xl border border-amber-200">
                चेतावनी: तपाईंले {toNepaliDigits(unansweredCount)} वटा प्रश्नको उत्तर दिन बाँकी छ।
              </p>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModalOpen(false)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                रद्द गर्नुहोस्
              </button>
              <button
                type="button"
                onClick={handleFinalSubmit}
                disabled={isSubmitting}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isSubmitting ? (
                  <span>बुझाउँदै...</span>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>निश्चित छु, बुझाउनुहोस्</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
