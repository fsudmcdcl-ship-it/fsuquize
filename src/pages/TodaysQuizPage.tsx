import React, { useState } from 'react';
import type { Student, Quiz, QuizSession } from '../types/quiz';
import { toNepaliDigits, formatNepalDate, getRemainingAvailability } from '../lib/nepaliUtils';
import { BookOpen, Clock, AlertCircle, CheckCircle2, ArrowRight, ShieldCheck, Trophy, Sparkles, Dices } from 'lucide-react';
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
  const isAlreadyCompleted = studentSession?.status === 'submitted' || studentSession?.status === 'expired';
  const isInProgress = studentSession?.status === 'in_progress';

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
                </div>
              </div>

              <button
                onClick={() => navigate(`/quiz/${activeQuiz.id}`)}
                className="shrink-0 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow transition cursor-pointer flex items-center gap-2"
              >
                <span>मेरो उत्तर तथा नतिजा हेर्नुहोस्</span>
                <ArrowRight className="w-4 h-4" />
              </button>
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
