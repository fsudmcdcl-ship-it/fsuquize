import React, { useState } from 'react';
import type { Student, Quiz, QuizSession } from '../types/quiz';
import { toNepaliDigits, formatNepalDate, formatDurationSeconds, getRemainingAvailability } from '../lib/nepaliUtils';
import { BookOpen, Clock, AlertCircle, CheckCircle2, ArrowRight, ShieldCheck, Trophy, Sparkles, Dices, Users, Award } from 'lucide-react';
import { StudentQuestionPickerModal } from '../components/StudentQuestionPickerModal';
import { dataService } from '../lib/dataService';

interface TodaysQuizPageProps {
  navigate: (path: string) => void;
  student: Student | null;
  activeQuiz: Quiz | null;
  studentSession: QuizSession | null;
}

export const TodaysQuizPage: React.FC<TodaysQuizPageProps> = ({
  navigate,
  student,
  activeQuiz,
  studentSession,
}) => {
  const [showPickerModal, setShowPickerModal] = useState(false);

  // If no quiz is active
  if (!activeQuiz || activeQuiz.status !== 'active') {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-3xl flex items-center justify-center mx-auto text-4xl shadow-sm">
          ⏳
        </div>

        <div>
          <span className="text-xs font-bold text-amber-600 uppercase tracking-widest block mb-1">
            सूचना
          </span>
          <h1 className="text-3xl font-black text-slate-900">
            अहिले कुनै क्विज सञ्चालनमा छैन
          </h1>
          <p className="text-base text-slate-600 max-w-lg mx-auto mt-2 leading-relaxed">
            हाल कुनै क्विज सञ्चालनमा छैन। नयाँ क्विज सञ्चालन भएपछि यहाँ जानकारी देखाइनेछ।
          </p>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs max-w-md mx-auto text-left text-xs space-y-3">
          <div className="flex justify-between py-1 border-b border-slate-100">
            <span className="text-slate-500">अर्को क्विज सञ्चालन मिति:</span>
            <span className="font-bold text-slate-800">आउँदो शुक्रबार</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-100">
            <span className="text-slate-500">सञ्चालन समय:</span>
            <span className="font-bold text-slate-800">बेलुका ६:०० बजेबाट</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-slate-500">अवधि:</span>
            <span className="font-bold text-slate-800">७२ घण्टा</span>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-3 pt-4">
          <button
            onClick={() => navigate('/winner-list')}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-xl shadow transition cursor-pointer flex items-center gap-2"
          >
            <Trophy className="w-4 h-4" />
            <span>विजेता सूची हेर्नुहोस्</span>
          </button>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl transition cursor-pointer"
          >
            गृहपृष्ठमा फर्कनुहोस्
          </button>
        </div>
      </div>
    );
  }

  const availability = getRemainingAvailability(activeQuiz.endAt);
  const isAlreadyCompleted = (studentSession?.status === 'submitted' || studentSession?.status === 'expired') && !student?.reExamAllowed;
  const isInProgress = studentSession?.status === 'in_progress' && !student?.reExamAllowed;

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
      {/* Quiz Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-60 h-60 bg-red-500/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">
            <span className="w-2 h-2 rounded-full bg-red-600 animate-ping"></span>
            साप्ताहिक क्याम्पस क्विज
          </span>

          {!availability.isExpired ? (
            <span className="text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1 rounded-xl flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-600" />
              <span>{availability.text}</span>
            </span>
          ) : (
            <span className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1 rounded-xl">
              क्विजको समय समाप्त भइसकेको छ
            </span>
          )}
        </div>

        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 mb-3">
          {activeQuiz.title}
        </h1>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mb-8">
          {activeQuiz.description}
        </p>

        {/* Detailed Metadata Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8 bg-slate-50 p-5 rounded-2xl border border-slate-200/70">
          <div>
            <span className="text-xs font-semibold text-slate-500 block mb-1">प्रश्न संख्या</span>
            <span className="text-xl font-black text-slate-900">१० प्रश्न</span>
            <span className="text-[11px] text-slate-500 block">५० प्रश्नको बैङ्कबाट</span>
          </div>

          <div>
            <span className="text-xs font-semibold text-slate-500 block mb-1">कुल समय</span>
            <span className="text-xl font-black text-slate-900">१० मिनेट</span>
            <span className="text-[11px] text-slate-500 block">६०० सेकेन्ड</span>
          </div>

          <div>
            <span className="text-xs font-semibold text-slate-500 block mb-1">क्विज सुरु</span>
            <span className="text-xs font-bold text-slate-800 block">
              {formatNepalDate(activeQuiz.startAt, true)}
            </span>
          </div>

          <div>
            <span className="text-xs font-semibold text-slate-500 block mb-1">क्विज समाप्त</span>
            <span className="text-xs font-bold text-slate-800 block">
              {formatNepalDate(activeQuiz.endAt, true)}
            </span>
          </div>
        </div>

        {/* Rules & Winning Conditions */}
        <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-5 mb-8 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-amber-900 flex items-center gap-2 mb-2">
              <ShieldCheck className="w-4 h-4 text-amber-700" />
              <span>क्विज नियम तथा निर्देशनहरू:</span>
            </h3>
            <ul className="text-xs text-amber-950/80 space-y-1.5 list-disc list-inside leading-relaxed">
              <li>क्विज सुरु हुनासाथ १० मिनेटको काउन्टडाउन सुरु हुनेछ।</li>
              <li>५ वटा फरक सेटबाट स्वचालित रूपमा १० प्रश्नहरू छानिनेछन्।</li>
              <li>१० मिनेट समाप्त भएमा उत्तरहरू स्वतः सुरक्षित र बुझाइनेछ।</li>
              <li>एक विद्यार्थीले एक सातामा एकपटक मात्र आधिकारिक प्रयास गर्न पाउनेछन्।</li>
            </ul>
          </div>

          <div className="pt-3 border-t border-amber-200/80">
            <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <span>🏆</span>
              <span>विजेता छनोटका ३ अनिवार्य नियमहरू (Rules of Winning):</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
              <div className="p-3 bg-white/90 rounded-xl border border-amber-200 text-xs shadow-2xs">
                <div className="font-bold text-amber-950 mb-0.5 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-amber-200 text-amber-900 font-black text-[10px] flex items-center justify-center shrink-0">१</span>
                  <span>सर्वोच्च अंक (Highest Score)</span>
                </div>
                <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">सबैभन्दा बढी अंक प्राप्त गर्ने विद्यार्थी पहिलो प्राथमिकतामा पर्नेछन्।</p>
              </div>

              <div className="p-3 bg-white/90 rounded-xl border border-amber-200 text-xs shadow-2xs">
                <div className="font-bold text-amber-950 mb-0.5 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-amber-200 text-amber-900 font-black text-[10px] flex items-center justify-center shrink-0">२</span>
                  <span>न्यूनतम समय (Shortest Time)</span>
                </div>
                <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">अंक बराबर भएमा कम समयमा क्विज पूरा गर्ने विद्यार्थीलाई दोस्रो सर्त अनुसार प्राथमिकता दिइनेछ।</p>
              </div>

              <div className="p-3 bg-white/90 rounded-xl border border-amber-200 text-xs shadow-2xs">
                <div className="font-bold text-amber-950 mb-0.5 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-amber-200 text-amber-900 font-black text-[10px] flex items-center justify-center shrink-0">३</span>
                  <span>गोलाप्रथा (Lottery Draw)</span>
                </div>
                <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">अंक र समय दुवै समान भएमा गोलाप्रथा (Lottery Draw) मार्फत शीर्ष ३ विजेता चयन गरिनेछ।</p>
              </div>
            </div>
          </div>
        </div>

        {/* Re-Exam Allowed Notice */}
        {student?.reExamAllowed && (
          <div className="mb-6 bg-gradient-to-r from-purple-50 via-indigo-50 to-purple-50 border-2 border-purple-300 rounded-2xl p-5 flex items-start gap-4 shadow-sm animate-in fade-in">
            <div className="w-12 h-12 rounded-2xl bg-purple-200 text-purple-800 flex items-center justify-center font-bold text-2xl shrink-0 shadow-inner">
              🔄
            </div>
            <div className="flex-1">
              <span className="text-xs font-bold text-purple-700 uppercase tracking-wider block">
                प्रशासक अनुमति • Re-Exam Enabled
              </span>
              <h3 className="text-base font-black text-purple-950 mt-0.5">
                पुन: परीक्षा दिने अवसर सक्रिय गरिएको छ
              </h3>
              <p className="text-xs text-purple-900 mt-1 leading-relaxed">
                तपाईंको विगतको क्विज सबमिसन प्रशासनद्वारा रिसेट गरिएको छ। तलको <b>'मेरो लागि प्रश्न छान्नुहोस्'</b> वा <b>'क्विज सुरु गर्नुहोस्'</b> बटन क्लिक गरी नयाँ १० वटा प्रश्न प्राप्त गर्नुहोस् र परीक्षा सुरु गर्नुहोस्।
              </p>
            </div>
          </div>
        )}

        {/* Action Button Section */}
        <div className="pt-2">
          {!student ? (
            <div className="bg-slate-900 text-white rounded-2xl p-6 text-center space-y-4">
              <h4 className="text-lg font-bold">क्विजमा सहभागी हुन पहिले लगइन गर्नुहोस्</h4>
              <p className="text-xs text-slate-300 max-w-md mx-auto">
                यदि तपाईं क्याम्पसको विद्यार्थी हुनुहुन्छ र दर्ता गरिसक्नुभएको छ भने लगइन गर्नुहोस् वा नयाँ दर्ता गर्नुहोस्।
              </p>
              <div className="flex flex-wrap justify-center gap-3 pt-2">
                <button
                  onClick={() => navigate('/login')}
                  className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-xl shadow transition cursor-pointer"
                >
                  लगइन गरी क्विज सुरु गर्नुहोस्
                </button>
                <button
                  onClick={() => navigate('/register')}
                  className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm rounded-xl transition cursor-pointer"
                >
                  नयाँ दर्ता गर्नुहोस्
                </button>
              </div>
            </div>
          ) : isAlreadyCompleted ? (
            <div className="space-y-6">
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3 text-center sm:text-left">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 shrink-0" />
                  <div>
                    <h4 className="text-base font-bold text-emerald-900">
                      तपाईंले यो क्विज सफलतापूर्वक बुझाइसक्नुभएको छ
                    </h4>
                    <p className="text-xs text-emerald-700 mt-0.5">
                      प्राप्त अंक: <b>{toNepaliDigits(studentSession.score)}/१०</b> ({toNepaliDigits(studentSession.percentage)}%)
                      {studentSession.rank ? ` | स्थान: #${toNepaliDigits(studentSession.rank)}` : ''}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      * विस्तृत उत्तर, व्याख्या र सही उत्तरहरू क्विज सम्पन्न भएपछि <b>'विगतका प्रश्नहरू'</b> खण्डमा उपलब्ध हुनेछन्।
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => navigate('/winner-list')}
                    className="shrink-0 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Trophy className="w-3.5 h-3.5" />
                    <span>विजेता सूची पोर्टल</span>
                  </button>

                  <button
                    onClick={() => navigate('/past-questions')}
                    className="shrink-0 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                    <span>विगतका प्रश्नहरू</span>
                  </button>
                </div>
              </div>

              {/* Requirement: Winner and participants must be shown after the completion of the quiz */}
              {(() => {
                const isWinnerAllowed = dataService.isWinnerDisplayAllowed(activeQuiz.id, isAlreadyCompleted);
                const isParticipantsAllowed = dataService.isParticipantsDisplayAllowed(activeQuiz.id, isAlreadyCompleted);
                const quizWinner = dataService.getWinners().find(w => w.quizId === activeQuiz.id) || dataService.getWinners()[0];
                const quizParticipants = dataService
                  .getSessions(activeQuiz.id)
                  .filter(s => s.status === 'submitted' || s.status === 'expired' || (typeof s.score === 'number' && s.score >= 0 && Boolean(s.submittedAt)))
                  .sort((a, b) => {
                    if (b.score !== a.score) return b.score - a.score;
                    return a.timeTakenSeconds - b.timeTakenSeconds;
                  });

                // Top provisional winners if official record is not yet published
                const effectiveWinner = quizWinner || (quizParticipants.length > 0 ? {
                  id: `provisional_${activeQuiz.id}`,
                  quizId: activeQuiz.id,
                  quizTitle: activeQuiz.title,
                  announcedAt: new Date().toISOString(),
                  first: quizParticipants[0] ? {
                    studentId: quizParticipants[0].studentId,
                    name: quizParticipants[0].studentName,
                    rollNo: quizParticipants[0].studentRoll,
                    class: quizParticipants[0].studentClass,
                    semester: quizParticipants[0].studentSemester,
                    score: quizParticipants[0].score,
                    timeTakenSeconds: quizParticipants[0].timeTakenSeconds,
                    profilePhoto: quizParticipants[0].studentPhoto,
                  } : undefined,
                  second: quizParticipants[1] ? {
                    studentId: quizParticipants[1].studentId,
                    name: quizParticipants[1].studentName,
                    rollNo: quizParticipants[1].studentRoll,
                    class: quizParticipants[1].studentClass,
                    semester: quizParticipants[1].studentSemester,
                    score: quizParticipants[1].score,
                    timeTakenSeconds: quizParticipants[1].timeTakenSeconds,
                    profilePhoto: quizParticipants[1].studentPhoto,
                  } : undefined,
                  third: quizParticipants[2] ? {
                    studentId: quizParticipants[2].studentId,
                    name: quizParticipants[2].studentName,
                    rollNo: quizParticipants[2].studentRoll,
                    class: quizParticipants[2].studentClass,
                    semester: quizParticipants[2].studentSemester,
                    score: quizParticipants[2].score,
                    timeTakenSeconds: quizParticipants[2].timeTakenSeconds,
                    profilePhoto: quizParticipants[2].studentPhoto,
                  } : undefined,
                } : null);

                return (
                  <div className="pt-2 space-y-6">
                    {/* Top Winners Podium */}
                    {isWinnerAllowed && effectiveWinner ? (
                      <div className="bg-gradient-to-br from-amber-50/70 via-white to-amber-50/50 p-6 rounded-3xl border-2 border-amber-300 shadow-sm space-y-5">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-200 pb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">🏆</span>
                            <div>
                              <h3 className="text-base font-black text-slate-900">
                                क्विज विजेताहरू (Top Winners)
                              </h3>
                              <p className="text-xs text-slate-500 font-medium">{effectiveWinner.quizTitle}</p>
                            </div>
                          </div>
                          <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 font-bold text-xs">
                            {quizWinner ? 'आधिकारिक नतिजा' : 'प्रारम्भिक शीर्ष ३ (Provisional Top 3)'}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                          {/* 1st Place */}
                          {effectiveWinner.first && (
                            <div className="p-4 rounded-2xl bg-amber-100/60 border border-amber-300 sm:order-2 sm:-translate-y-2">
                              <span className="text-2xl block mb-1">🥇</span>
                              <span className="inline-block px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] uppercase mb-1">
                                प्रथम स्थान
                              </span>
                              <h4 className="font-black text-sm text-slate-900">{effectiveWinner.first.name}</h4>
                              <p className="text-[11px] text-slate-600">{effectiveWinner.first.class} | रोल: {toNepaliDigits(effectiveWinner.first.rollNo)}</p>
                              <div className="mt-2 pt-2 border-t border-amber-200 font-bold text-xs text-amber-950">
                                प्राप्तांक: {toNepaliDigits(effectiveWinner.first.score)}/१०
                              </div>
                            </div>
                          )}

                          {/* 2nd Place */}
                          {effectiveWinner.second && (
                            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 sm:order-1">
                              <span className="text-2xl block mb-1">🥈</span>
                              <span className="text-[10px] font-bold text-slate-600 uppercase block mb-1">दोस्रो स्थान</span>
                              <h4 className="font-bold text-sm text-slate-900">{effectiveWinner.second.name}</h4>
                              <p className="text-[11px] text-slate-500">{effectiveWinner.second.class} | रोल: {toNepaliDigits(effectiveWinner.second.rollNo)}</p>
                              <div className="mt-2 pt-2 border-t border-slate-200 font-bold text-xs text-slate-800">
                                प्राप्तांक: {toNepaliDigits(effectiveWinner.second.score)}/१०
                              </div>
                            </div>
                          )}

                          {/* 3rd Place */}
                          {effectiveWinner.third && (
                            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 sm:order-3">
                              <span className="text-2xl block mb-1">🥉</span>
                              <span className="text-[10px] font-bold text-amber-800 uppercase block mb-1">तेस्रो स्थान</span>
                              <h4 className="font-bold text-sm text-slate-900">{effectiveWinner.third.name}</h4>
                              <p className="text-[11px] text-slate-500">{effectiveWinner.third.class} | रोल: {toNepaliDigits(effectiveWinner.third.rollNo)}</p>
                              <div className="mt-2 pt-2 border-t border-slate-200 font-bold text-xs text-slate-800">
                                प्राप्तांक: {toNepaliDigits(effectiveWinner.third.score)}/१०
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : !isWinnerAllowed ? (
                      <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 text-center space-y-1.5">
                        <div className="flex items-center justify-center gap-2 text-amber-900 font-bold text-xs">
                          <Clock className="w-4 h-4 text-amber-600" />
                          <span>विजेता सूची परीक्षा सकिएको १ घण्टापछि स्वतः प्रकाशित हुनेछ</span>
                        </div>
                        <p className="text-[11px] text-slate-600">
                          क्याम्पस परीक्षा नियमानुसार सम्पूर्ण सहभागीहरूको उत्तर समीक्षा सम्पन्न भएपछि १ घण्टाभित्र विजेता घोषणा गरिनेछ।
                        </p>
                      </div>
                    ) : null}

                    {/* Participants Leaderboard Table */}
                    {isParticipantsAllowed ? (
                      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-red-600" />
                            <h3 className="font-bold text-sm text-slate-900">
                              सहभागी विद्यार्थीहरूको नतिजा ({toNepaliDigits(quizParticipants.length)} जना)
                            </h3>
                          </div>
                          <span className="text-[11px] text-slate-500 font-medium">
                            सर्वोच्च अंक र न्यूनतम समय अनुसार क्रमबद्ध
                          </span>
                        </div>

                        {quizParticipants.length > 0 ? (
                          <div className="overflow-x-auto rounded-xl border border-slate-100">
                            <table className="w-full text-left text-xs">
                              <thead className="bg-slate-50 text-slate-600 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-100">
                                <tr>
                                  <th className="py-2.5 px-3 text-center">क्र.सं.</th>
                                  <th className="py-2.5 px-3">विद्यार्थी</th>
                                  <th className="py-2.5 px-3">कक्षा / रोल</th>
                                  <th className="py-2.5 px-3 text-center">प्राप्तांक</th>
                                  <th className="py-2.5 px-3 text-center">समय</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {quizParticipants.slice(0, 10).map((part, pIdx) => {
                                  const isMe = part.studentId === student?.id;
                                  return (
                                    <tr
                                      key={part.id}
                                      className={`transition-colors ${
                                        isMe ? 'bg-amber-50 font-bold text-amber-950' : 'hover:bg-slate-50'
                                      }`}
                                    >
                                      <td className="py-2 px-3 text-center">
                                        {pIdx === 0 ? '🥇' : pIdx === 1 ? '🥈' : pIdx === 2 ? '🥉' : `#${toNepaliDigits(pIdx + 1)}`}
                                      </td>
                                      <td className="py-2 px-3">
                                        <div className="flex items-center gap-2">
                                          <span>{part.studentName}</span>
                                          {isMe && (
                                            <span className="px-1.5 py-0.5 rounded-sm bg-red-600 text-white text-[9px] font-black uppercase">
                                              तपाईं
                                            </span>
                                          )}
                                        </div>
                                      </td>
                                      <td className="py-2 px-3 text-slate-600">
                                        {part.studentClass} ({part.studentSemester}) | {toNepaliDigits(part.studentRoll)}
                                      </td>
                                      <td className="py-2 px-3 text-center font-bold text-slate-900">
                                        {toNepaliDigits(part.score)}/१०
                                      </td>
                                      <td className="py-2 px-3 text-center text-slate-500">
                                        {formatDurationSeconds(part.timeTakenSeconds)}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <p className="text-center text-xs text-slate-400 py-4">अहिलेसम्म अन्य कुनै सहभागी छैनन्।</p>
                        )}
                      </div>
                    ) : (
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
                        📋 सहभागी विद्यार्थीहरूको नतिजा तालिका परीक्षा सकिएपछि १ घण्टाभित्र सार्वजनिक हुनेछ।
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          ) : isInProgress ? (
            <div className="bg-amber-500 text-white rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg shadow-amber-500/20">
              <div>
                <h4 className="text-lg font-black">तपाईंको क्विज सत्र जारी छ</h4>
                <p className="text-xs text-amber-100 mt-1">
                  समय समाप्त हुनु अगावै आफ्ना प्रश्नहरूको उत्तर बुझाउनुहोस्।
                </p>
              </div>
              <button
                onClick={() => navigate(`/quiz/${activeQuiz.id}`)}
                className="shrink-0 px-8 py-3.5 bg-slate-950 hover:bg-slate-900 text-white font-black text-sm rounded-xl shadow transition cursor-pointer flex items-center gap-2 animate-bounce"
              >
                <span>क्विज जारी राख्नुहोस्</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50 p-6 rounded-2xl border border-slate-200">
              <div>
                <h4 className="text-base font-bold text-slate-900">तयार हुनुहुन्छ?</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  ५० प्रश्नहरूको बैङ्कबाट तपाईंका लागि १० वटा अनियमित प्रश्नहरू छानिन्छन्।
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setShowPickerModal(true)}
                  disabled={availability.isExpired || student.status === 'blocked'}
                  className="flex-1 sm:flex-initial px-6 py-4 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 disabled:opacity-50 text-white font-black text-sm rounded-2xl shadow-lg shadow-red-600/30 transition transform hover:-translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Dices className="w-5 h-5" />
                  <span>🎲 मेरो लागि प्रश्न छान्नुहोस्</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowPickerModal(true)}
                  disabled={availability.isExpired || student.status === 'blocked'}
                  className="flex-1 sm:flex-initial px-6 py-4 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-black text-sm rounded-2xl shadow-md transition transform hover:-translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <BookOpen className="w-5 h-5" />
                  <span>क्विज सुरु गर्नुहोस्</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Pick Questions for Me Generator Modal */}
      {showPickerModal && student && (
        <StudentQuestionPickerModal
          isOpen={showPickerModal}
          onClose={() => setShowPickerModal(false)}
          quiz={activeQuiz}
          studentId={student.id}
          onStartQuiz={(selectedQuestionIds) => {
            setShowPickerModal(false);
            dataService.startQuizSession(activeQuiz, student, selectedQuestionIds);
            navigate(`/quiz/${activeQuiz.id}`);
          }}
        />
      )}
    </div>
  );
};
