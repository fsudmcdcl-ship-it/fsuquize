import React, { useState } from 'react';
import type { Quiz, QuizSession, Student, Question } from '../types/quiz';
import { exportQuizSubmissionsToExcel } from '../lib/excelExport';
import { toNepaliDigits, formatNepalDate } from '../lib/nepaliUtils';
import { FileSpreadsheet, Download, CheckCircle, Database } from 'lucide-react';
import * as XLSX from 'xlsx';

interface AdminReportsProps {
  quizzes: Quiz[];
  sessions: QuizSession[];
  students: Student[];
  questions: Question[];
}

export const AdminReports: React.FC<AdminReportsProps> = ({
  quizzes,
  sessions,
  students,
  questions,
}) => {
  const [selectedQuizId, setSelectedQuizId] = useState<string>(quizzes[0]?.id || 'quiz_week_12');
  const [exportNotice, setExportNotice] = useState('');

  const activeQuiz = quizzes.find(q => q.id === selectedQuizId) || quizzes[0];
  const quizSessions = sessions.filter(s => s.quizId === selectedQuizId);

  const handleExportQuiz = () => {
    if (!activeQuiz) return;
    exportQuizSubmissionsToExcel(activeQuiz, quizSessions, questions);
    setExportNotice(`${activeQuiz.title} को एक्सल फाइल डाउनलोड भयो!`);
    setTimeout(() => setExportNotice(''), 4000);
  };

  const handleExportStudents = () => {
    const rows = students.map((s, idx) => ({
      'क्र.सं.': idx + 1,
      'विद्यार्थी ID': s.id,
      'पूरा नाम': s.name,
      'रोल नम्बर': s.rollNo,
      'कक्षा': s.class,
      'सेमेस्टर': s.semester,
      'सम्पर्क नम्बर': s.phone,
      'स्थिति': s.status === 'active' ? 'सक्रिय' : s.status === 'restricted' ? 'प्रतिबन्धित' : 'ब्लक',
      'दर्ता मिति': formatNepalDate(s.createdAt),
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');
    XLSX.writeFile(workbook, `FSU_DMC_Students_${new Date().toISOString().slice(0, 10)}.xlsx`);

    setExportNotice('सम्पूर्ण विद्यार्थीहरूको एक्सल सूची डाउनलोड भयो!');
    setTimeout(() => setExportNotice(''), 4000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
          डाउनलोड तथा एक्सल रिपोर्ट (Excel Reports & Exports)
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          क्विज सबमिसन, विद्यार्थी विवरण र नतिजाहरू आधिकारिक XLSX ढाँचामा डाउनलोड गर्नुहोस्
        </p>
      </div>

      {exportNotice && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>{exportNotice}</span>
        </div>
      )}

      {/* Export Options Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Quiz Submissions Export */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xl">
            📊
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">क्विज सबमिसन रिपोर्ट (XLSX)</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              विद्यार्थी विवरण, सुरु/बुझाएको समय, १० वटै प्रश्नको उत्तर र अंक सहितको विस्तृत स्प्रेडसिट।
            </p>
          </div>

          <div className="space-y-2 pt-2">
            <label className="text-xs font-bold text-slate-600 block">क्विज छान्नुहोस्:</label>
            <select
              value={selectedQuizId}
              onChange={e => setSelectedQuizId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold bg-white"
            >
              {quizzes.map(q => (
                <option key={q.id} value={q.id}>
                  {q.title} ({toNepaliDigits(sessions.filter(s => s.quizId === q.id).length)} सबमिसन)
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleExportQuiz}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>क्विज रिपोर्ट एक्सल डाउनलोड (.xlsx)</span>
          </button>
        </div>

        {/* All Students Directory Export */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xl">
            👥
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">विद्यार्थी नामावली डिरेक्ट्री (XLSX)</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              दर्ता भएका सम्पूर्ण {toNepaliDigits(students.length)} जना विद्यार्थीहरूको नाम, रोल, कक्षा, फोन र स्थिति।
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600 space-y-1">
            <div className="flex justify-between">
              <span>सक्रिय विद्यार्थी:</span>
              <b className="text-emerald-600">{toNepaliDigits(students.filter(s => s.status === 'active').length)}</b>
            </div>
            <div className="flex justify-between">
              <span>प्रतिबन्धित विद्यार्थी:</span>
              <b className="text-amber-600">{toNepaliDigits(students.filter(s => s.status === 'restricted').length)}</b>
            </div>
          </div>

          <button
            onClick={handleExportStudents}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>विद्यार्थी नामावली डाउनलोड (.xlsx)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
