import React, { useState } from 'react';
import type { Student, Quiz, QuizSession } from '../types/quiz';
import { toNepaliDigits, formatNepalDate, getRemainingAvailability } from '../lib/nepaliUtils';
import { BookOpen, Trophy, Award, CheckCircle, Clock, ArrowRight, User, AlertTriangle, Dices } from 'lucide-react';
import { StudentQuestionPickerModal } from '../components/StudentQuestionPickerModal';
import { dataService } from '../lib/dataService';

interface DashboardPageProps {
  student: Student;
  activeQuiz: Quiz | null;
  studentSession: QuizSession | null;
  allStudentSessions: QuizSession[];
  navigate: (path: string) => void;
  onLogout: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  student,
  activeQuiz,
  studentSession,
  allStudentSessions,
  navigate,
  onLogout,
}) => {
  const [showPickerModal, setShowPickerModal] = useState(false);
  const availability = activeQuiz ? getRemainingAvailability(activeQuiz.endAt) : null;

  // Calculate student statistics
  const myCompletedSessions = allStudentSessions.filter(
    s => s.status === 'submitted' || s.status === 'expired'
  );
  const totalQuizzes = myCompletedSessions.length;
  const avgScore =
    totalQuizzes > 0
      ? (myCompletedSessions.reduce((acc, s) => acc + s.score, 0) / totalQuizzes).toFixed(1)
      : '०';

  const bestScore =
    totalQuizzes > 0 ? Math.max(...myCompletedSessions.map(s => s.score)) : 0;

  const currentRank = studentSession?.rank ? `#${studentSession.rank}` : '-';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Student Welcome Banner */}
      <div className="bg-gradient-to-r from-red-700 via-rose-700 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-slate-800 border-2 border-white/40 shadow-md shrink-0">
            <img
              src={
                student.profilePhoto ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=face'
              }
              alt={student.name}
              className="w-full h-full object-cover"
            />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white/20 text-rose-100 uppercase tracking-wider font-mono">
                {student.id}
              </span>
              {student.status === 'restricted' && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500 text-slate-900">
                  प्रतिबन्धित
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-black mt-1">{student.name}</h1>
            <p className="text-xs sm:text-sm text-rose-100/80">
              कक्षा: {student.class} | {student.semester} सेमेस्टर | रोल: {toNepaliDigits(student.rollNo)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          <button
            onClick={() => navigate('/profile')}
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <User className="w-3.5 h-3.5" />
            <span>प्रोफाइल हेर्नुहोस्</span>
          </button>
          <button
            onClick={onLogout}
            className="px-4 py-2.5 rounded-xl bg-red-800/80 hover:bg-red-800 text-rose-100 font-bold text-xs transition cursor-pointer"
          >
            लगआउट
          </button>
        </div>
      </div>

      {student.status === 'restricted' && (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 text-xs text-amber-800 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>तपाईंको खातामा केही सुविधाहरू हाल प्रतिबन्धित छन्। थप जानकारीका लागि प्रशासनसँग सम्पर्क गर्नुहोस्।</span>
        </div>
      )}

      {/* 5 Core Dashboard Cards (Requirement 11) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: My Participation */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">मेरो सहभागिता</span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              📊
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-slate-900">
              {toNepaliDigits(totalQuizzes)}
            </div>
            <p className="text-xs text-slate-500 mt-1">सहभागी भएको कुल क्विज</p>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100">
            <button
              onClick={() => navigate('/my-status')}
              className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>पूर्ण इतिहास हेर्नुहोस्</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Card 2: My Score */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">मेरो अंक</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              🎯
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-slate-900">
              {toNepaliDigits(bestScore)} <span className="text-base font-normal text-slate-400">/१०</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">उत्कृष्ट प्राप्तांक (औसत: {toNepaliDigits(avgScore)})</p>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100">
            <span className="text-xs text-emerald-700 font-semibold">
              ✓ स्वचालित मूल्याङ्कन
            </span>
          </div>
        </div>

        {/* Card 3: My Current Rank */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">मेरो स्थान</span>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              🎖️
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-slate-900 font-mono">
              {currentRank}
            </div>
            <p className="text-xs text-slate-500 mt-1">चालू क्विजको स्थान</p>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100">
            <span className="text-xs text-slate-400">
              अंक र समय आधारमा निर्धारण
            </span>
          </div>
        </div>

        {/* Card 4: Winner List Shortcut */}
        <div className="bg-gradient-to-br from-amber-500 to-amber-600 text-white rounded-3xl p-6 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-amber-100 uppercase tracking-wider">विजेता सूची</span>
            <Trophy className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="text-2xl font-black">साप्ताहिक विजेताहरू</div>
            <p className="text-xs text-amber-100 mt-1">क्याम्पसका उत्कृष्ट सहभागीहरू</p>
          </div>
          <div className="mt-4 pt-4 border-t border-white/20">
            <button
              onClick={() => navigate('/winner-list')}
              className="text-xs font-bold text-white hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>विजेता सूची खोल्नुहोस्</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Feature: Today's Quiz Status (Card 5) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">
                <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
                आजको क्विज
              </span>
              {availability && !availability.isExpired && (
                <span className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200/60 px-2.5 py-1 rounded-lg flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {availability.text}
                </span>
              )}
            </div>
            <h2 className="text-2xl font-black text-slate-900 mt-2">
              {activeQuiz ? activeQuiz.title : 'हाल कुनै क्विज उपलब्ध छैन'}
            </h2>
            <p className="text-sm text-slate-600 mt-1 max-w-2xl">
              {activeQuiz?.description}
            </p>
          </div>

          {/* Action button based on participation status */}
          <div className="shrink-0">
            {studentSession?.status === 'submitted' || studentSession?.status === 'expired' ? (
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="bg-emerald-50 border border-emerald-200 px-4 py-2.5 rounded-2xl text-center">
                  <span className="text-xs text-emerald-700 font-bold block">तपाईंको नतिजा</span>
                  <span className="text-lg font-black text-emerald-800">
                    {toNepaliDigits(studentSession.score)}/१० ({toNepaliDigits(studentSession.percentage)}%)
                  </span>
                </div>
                <button
                  onClick={() => navigate(`/quiz/${activeQuiz?.id || 'quiz_week_12'}`)}
                  className="px-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-2xl shadow transition flex items-center gap-2 cursor-pointer"
                >
                  <span>उत्तर तथा समीक्षा हेर्नुहोस्</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : studentSession?.status === 'in_progress' ? (
              <button
                onClick={() => navigate(`/quiz/${activeQuiz?.id || 'quiz_week_12'}`)}
                className="px-8 py-4 bg-gradient-to-r from-amber-500 to-red-600 hover:from-amber-600 hover:to-red-700 text-white font-black text-base rounded-2xl shadow-lg shadow-red-500/25 transition animate-pulse flex items-center gap-2 cursor-pointer"
              >
                <span>क्विज जारी राख्नुहोस् (Resume)</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            ) : (
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowPickerModal(true)}
                  disabled={student.status === 'blocked'}
                  className="px-6 py-4 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 disabled:opacity-50 text-white font-black text-sm rounded-2xl shadow-lg shadow-red-600/25 transition transform hover:-translate-y-0.5 flex items-center gap-2 cursor-pointer"
                >
                  <Dices className="w-5 h-5" />
                  <span>🎲 मेरो लागि प्रश्न छान्नुहोस्</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowPickerModal(true)}
                  disabled={student.status === 'blocked'}
                  className="px-6 py-4 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-black text-sm rounded-2xl shadow-md transition transform hover:-translate-y-0.5 flex items-center gap-2 cursor-pointer"
                >
                  <BookOpen className="w-5 h-5" />
                  <span>क्विज सुरु गर्नुहोस्</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Quiz Rules & Guidance */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-600">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-start gap-3">
            <span className="text-xl">⏱️</span>
            <div>
              <b className="text-slate-800 block text-sm">१० मिनेटको समयसीमा</b>
              क्विज सुरु भएपछि बाँकी समयको काउन्टडाउन चल्नेछ। १० मिनेटपछि स्वतः बुझाइनेछ।
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-start gap-3">
            <span className="text-xl">🎲</span>
            <div>
              <b className="text-slate-800 block text-sm">निष्पक्ष ५० प्रश्न बैङ्क</b>
              ५० प्रश्नहरूको बैङ्कबाट विद्यार्थीपिच्छे १० फरक प्रश्नहरू ¥यान्डम रूपमा छानिन्छन्।
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-start gap-3">
            <span className="text-xl">🔒</span>
            <div>
              <b className="text-slate-800 block text-sm">एक विद्यार्थी, एक प्रयास</b>
              साप्ताहिक रूपमा आधिकारिक एक प्रयास मात्र गणना गरिनेछ।
            </div>
          </div>
        </div>
      </div>

      {/* Pick Questions for Me Generator Modal */}
      {showPickerModal && activeQuiz && (
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
