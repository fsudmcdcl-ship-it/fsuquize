import * as XLSX from 'xlsx';
import type { QuizSession, Quiz, Question } from '../types/quiz';
import { formatNepalDate, formatDurationSeconds } from './nepaliUtils';

export function exportQuizSubmissionsToExcel(
  quiz: Quiz,
  sessions: QuizSession[],
  questions: Question[]
) {
  const questionMap = new Map(questions.map(q => [q.id, q]));

  const rows = sessions.map((s, index) => {
    // Collect answers for Q1 to Q10
    const qAnswers: Record<string, string> = {};
    let correctCount = 0;
    let incorrectCount = 0;
    let unansweredCount = 0;

    for (let i = 0; i < 10; i++) {
      const qId = s.selectedQuestionIds[i];
      const qObj = qId ? questionMap.get(qId) : null;
      const ans = qId ? s.answers[qId] : null;
      const colKey = `Q${i + 1} Answer`;

      if (!ans) {
        qAnswers[colKey] = '- (अनुत्तरित)';
        unansweredCount++;
      } else {
        const isCorrect = qObj && qObj.correctAnswer === ans;
        qAnswers[colKey] = `${ans} (${isCorrect ? 'सही' : 'गलत'})`;
        if (isCorrect) correctCount++;
        else incorrectCount++;
      }
    }

    return {
      'क्र.सं. (S.N.)': index + 1,
      'विद्यार्थी ID': s.studentId,
      'पूरा नाम': s.studentName,
      'रोल नम्बर': s.studentRoll,
      'कक्षा': s.studentClass,
      'सेमेस्टर': s.studentSemester,
      'सम्पर्क नम्बर': s.studentPhone || '-',
      'क्विज ID': s.quizId,
      'क्विज शीर्षक': quiz.title,
      'सुरु भएको समय (नेपाल समय)': formatNepalDate(s.startedAt),
      'बुझाएको समय (नेपाल समय)': s.submittedAt ? formatNepalDate(s.submittedAt) : 'समय समाप्त/स्वतः',
      'समय लागेको': formatDurationSeconds(s.timeTakenSeconds),
      ...qAnswers,
      'सही उत्तर': correctCount,
      'गलत उत्तर': incorrectCount,
      'अनुत्तरित': unansweredCount,
      'प्राप्त अंक (Score)': `${s.score}/10`,
      'प्रतिशत (%)': `${s.percentage}%`,
      'स्थान (Rank)': s.rank ? `#${s.rank}` : '-',
      'स्थिति': s.status === 'submitted' ? 'बुझाइएको' : s.status === 'expired' ? 'समय समाप्त' : 'प्रगतिमा',
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Submissions');

  // Auto-size columns
  const maxWidths = [
    { wch: 8 },  // S.N.
    { wch: 14 }, // Student ID
    { wch: 22 }, // Name
    { wch: 12 }, // Roll
    { wch: 12 }, // Class
    { wch: 12 }, // Semester
    { wch: 16 }, // Phone
    { wch: 16 }, // Quiz ID
    { wch: 30 }, // Quiz Title
    { wch: 28 }, // Start Time
    { wch: 28 }, // End Time
    { wch: 18 }, // Time Taken
  ];
  worksheet['!cols'] = maxWidths;

  const fileName = `FSU_DMC_${quiz.id}_Submissions_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}
