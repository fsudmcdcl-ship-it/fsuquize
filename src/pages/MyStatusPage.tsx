import React from 'react';
import type { Student, QuizSession, Quiz } from '../types/quiz';
import { toNepaliDigits, formatNepalDate, formatDurationSeconds } from '../lib/nepaliUtils';
import { BarChart2, CheckCircle2, XCircle, Clock, Trophy, Target, ArrowRight } from 'lucide-react';

interface MyStatusPageProps {
  student: Student;
  allQuizzes: Quiz[];
  studentSessions: QuizSession[];
  navigate: (path: string) => void;
}

export const MyStatusPage: React.FC<MyStatusPageProps> = ({
  student,
  allQuizzes,
  studentSessions,
  navigate,
}) => {
  const completed = studentSessions.filter(s => s.status === 'submitted' || s.status === 'expired');

  const quizMap = new Map(allQuizzes.map(q => [q.id, q]));

  // Metrics calculation
  const totalParticipated = completed.length;
  const totalQuestions = completed.reduce((acc, s) => acc + s.totalQuestions, 0);
  const totalCorrect = completed.reduce((acc, s) => acc + s.score, 0);
  const totalIncorrect = completed.reduce((acc, s) => {
    const answeredCount = Object.keys(s.answers).length;
    return acc + (answeredCount - s.score);
  }, 0);
  const totalUnanswered = Math.max(0, totalQuestions - (totalCorrect + totalIncorrect));

  const accuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
  const bestScore = completed.length > 0 ? Math.max(...completed.map(s => s.score)) : 0;
  const avgScore =
    completed.length > 0
      ? (completed.reduce((acc, s) => acc + s.score, 0) / completed.length).toFixed(1)
      : '०';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header */}
      <div className="border-b border-slate-200 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-red-700 text-xs font-bold mb-2">
            <span>📊</span>
            <span>विद्यार्थी व्यक्तिगत नतिजा</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900">मेरो स्थिति (My Status)</h1>
          <p className="text-slate-500 text-xs mt-1">
            विद्यार्थी: <b>{student.name}</b> ({student.id}) | {student.class} ({student.semester})
          </p>
        </div>

        <button
          onClick={() => navigate('/todays-quize')}
          className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer self-start sm:self-auto flex items-center gap-1.5"
        >
          <span>आजको क्विज हेर्नुहोस्</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs text-slate-400 block font-medium">सहभागी क्विज</span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">
            {toNepaliDigits(totalParticipated)}
          </span>
          <span className="text-[11px] text-slate-500">कुल साप्ताहिक प्रतियोगिता</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs text-slate-400 block font-medium">सही उत्तर (Correct)</span>
          <span className="text-2xl font-black text-emerald-600 mt-1 block">
            {toNepaliDigits(totalCorrect)}
          </span>
          <span className="text-[11px] text-slate-500">कुल {toNepaliDigits(totalQuestions)} प्रश्नमध्ये</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs text-slate-400 block font-medium">शुद्धता (Accuracy)</span>
          <span className="text-2xl font-black text-amber-600 mt-1 block">
            {toNepaliDigits(accuracy)}%
          </span>
          <span className="text-[11px] text-slate-500">समग्र प्रदर्शन प्रतिशत</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs text-slate-400 block font-medium">उत्कृष्ट प्राप्तांक</span>
          <span className="text-2xl font-black text-purple-600 mt-1 block">
            {toNepaliDigits(bestScore)}/१०
          </span>
          <span className="text-[11px] text-slate-500">औसत: {toNepaliDigits(avgScore)}/१०</span>
        </div>
      </div>

      {/* Detailed breakdown list */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3">
          <CheckCircle2 className="w-8 h-8 text-emerald-600 shrink-0" />
          <div>
            <span className="text-xs text-emerald-800 font-semibold block">सही उत्तरहरू</span>
            <b className="text-lg text-emerald-900">{toNepaliDigits(totalCorrect)} वटा प्रश्न</b>
          </div>
        </div>

        <div className="bg-red-50/70 border border-red-200 rounded-2xl p-4 flex items-center gap-3">
          <XCircle className="w-8 h-8 text-red-600 shrink-0" />
          <div>
            <span className="text-xs text-red-800 font-semibold block">गलत उत्तरहरू</span>
            <b className="text-lg text-red-900">{toNepaliDigits(totalIncorrect)} वटा प्रश्न</b>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center gap-3">
          <Clock className="w-8 h-8 text-slate-400 shrink-0" />
          <div>
            <span className="text-xs text-slate-600 font-semibold block">अनुत्तरित प्रश्नहरू</span>
            <b className="text-lg text-slate-800">{toNepaliDigits(totalUnanswered)} वटा प्रश्न</b>
          </div>
        </div>
      </div>

      {/* Quiz History Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">मेरो क्विज सहभागिता विवरण (History)</h2>
          <p className="text-xs text-slate-500 mt-0.5">तपाईंले अहिलेसम्म भाग लिनुभएका सबै क्विजहरूको इतिहास</p>
        </div>

        {completed.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">क्विज</th>
                  <th className="py-3 px-4">मिति (नेपाल समय)</th>
                  <th className="py-3 px-4 text-center">प्राप्त अंक</th>
                  <th className="py-3 px-4 text-center">प्रतिशत</th>
                  <th className="py-3 px-4">समय</th>
                  <th className="py-3 px-4 text-center">स्थान</th>
                  <th className="py-3 px-4 text-right">कार्य</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {completed.map(s => {
                  const quiz = quizMap.get(s.quizId);
                  return (
                    <tr key={s.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {quiz?.title || s.quizId}
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {s.submittedAt ? formatNepalDate(s.submittedAt, false) : '-'}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-slate-900">
                        {toNepaliDigits(s.score)}/१०
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 font-bold text-[11px]">
                          {toNepaliDigits(s.percentage)}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {formatDurationSeconds(s.timeTakenSeconds)}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-purple-700">
                        {s.rank ? `#${toNepaliDigits(s.rank)}` : '-'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => navigate(`/quiz/${s.quizId}`)}
                          className="text-red-600 hover:text-red-700 font-bold text-xs"
                        >
                          उत्तर हेर्नुहोस् →
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-slate-400 text-xs">
            तपाईंले हालसम्म कुनै क्विज बुझाउनुभएको छैन।
          </div>
        )}
      </div>
    </div>
  );
};
