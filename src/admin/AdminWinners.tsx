import React, { useState } from 'react';
import type { QuizSession, Quiz, WinnerRecord, WinnerEntry, TieBreak } from '../types/quiz';
import { toNepaliDigits, formatDurationSeconds, formatNepalDate } from '../lib/nepaliUtils';
import { dataService } from '../lib/dataService';
import { Trophy, Award, Sparkles, Send, RefreshCw, CheckCircle2, Trash2, Plus, X, Save, Eye, Radio } from 'lucide-react';
import { SpinningWheel } from '../components/SpinningWheel';
import { WinnerPoster } from '../components/WinnerPoster';
import { ParticipantsScorePoster } from './components/ParticipantsScorePoster';

interface AdminWinnersProps {
  quizzes: Quiz[];
  sessions: QuizSession[];
  winners: WinnerRecord[];
  onRefresh: () => void;
}

export const AdminWinners: React.FC<AdminWinnersProps> = ({
  quizzes,
  sessions,
  winners,
  onRefresh,
}) => {
  const [selectedQuizId, setSelectedQuizId] = useState<string>(quizzes[0]?.id || 'quiz_week_12');
  const [note, setNote] = useState('उत्कृष्ट प्रदर्शन गर्नुहुने सम्पूर्ण विद्यार्थीहरूलाई हार्दिक बधाई तथा शुभकामना!');
  const [wheelModalOpen, setWheelModalOpen] = useState(false);
  const [previewPoster, setPreviewPoster] = useState<WinnerRecord | null>(null);
  const [showParticipantsPoster, setShowParticipantsPoster] = useState(false);
  const [publishedNotice, setPublishedNotice] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);
  const [isPushingLive, setIsPushingLive] = useState(false);
  const [pushNotice, setPushNotice] = useState<string | null>(null);

  // Manual Add Winner Modal
  const [showManualAddModal, setShowManualAddModal] = useState(false);
  const [manualQuizTitle, setManualQuizTitle] = useState('');
  const [manualNote, setManualNote] = useState('उत्कृष्ट प्रदर्शन गर्नुहुने सम्पूर्ण विद्यार्थीहरूलाई हार्दिक बधाई तथा शुभकामना!');
  const [w1Name, setW1Name] = useState('');
  const [w1Roll, setW1Roll] = useState('');
  const [w1Class, setW1Class] = useState('BCA');
  const [w1Semester, setW1Semester] = useState('चौथो');
  const [w1Score, setW1Score] = useState(10);
  const [w1Time, setW1Time] = useState(360);
  const [w1Photo, setW1Photo] = useState('');

  const [w2Name, setW2Name] = useState('');
  const [w2Roll, setW2Roll] = useState('');
  const [w2Class, setW2Class] = useState('B.Sc.CSIT');
  const [w2Semester, setW2Semester] = useState('दोस्रो');
  const [w2Score, setW2Score] = useState(9);
  const [w2Time, setW2Time] = useState(420);
  const [w2Photo, setW2Photo] = useState('');

  const [w3Name, setW3Name] = useState('');
  const [w3Roll, setW3Roll] = useState('');
  const [w3Class, setW3Class] = useState('BBS');
  const [w3Semester, setW3Semester] = useState('तेस्रो');
  const [w3Score, setW3Score] = useState(9);
  const [w3Time, setW3Time] = useState(480);
  const [w3Photo, setW3Photo] = useState('');

  const activeQuiz = quizzes.find(q => q.id === selectedQuizId) || quizzes[0];

  // Filter completed submissions for this quiz
  const quizSubmissions = sessions
    .filter(s => s.quizId === selectedQuizId && (s.status === 'submitted' || s.status === 'expired'))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.timeTakenSeconds - b.timeTakenSeconds;
    });

  // Candidates for top 3
  const firstCandidate = quizSubmissions[0];
  const secondCandidate = quizSubmissions[1];
  const thirdCandidate = quizSubmissions[2];

  // Detect ties in top candidates (same score and same time)
  const isTopTied = Boolean(
    firstCandidate &&
    secondCandidate &&
    firstCandidate.score === secondCandidate.score &&
    firstCandidate.timeTakenSeconds === secondCandidate.timeTakenSeconds
  );

  // Gather all submissions tied with the top score and time for fair lottery draw
  const tiedParticipants: WinnerEntry[] = isTopTied
    ? quizSubmissions
        .filter(s => s.score === firstCandidate.score && s.timeTakenSeconds === firstCandidate.timeTakenSeconds)
        .map(s => ({
          studentId: s.studentId,
          name: s.studentName,
          rollNo: s.studentRoll,
          class: s.studentClass,
          semester: s.studentSemester,
          score: s.score,
          timeTakenSeconds: s.timeTakenSeconds,
          profilePhoto: s.studentPhoto,
        }))
    : [];

  const handlePublishWinners = () => {
    if (!firstCandidate || !activeQuiz) return;

    const winnerRecord: WinnerRecord = {
      quizId: activeQuiz.id,
      quizTitle: activeQuiz.title,
      publishedAt: new Date().toISOString(),
      first: {
        studentId: firstCandidate.studentId,
        name: firstCandidate.studentName,
        rollNo: firstCandidate.studentRoll,
        class: firstCandidate.studentClass,
        semester: firstCandidate.studentSemester,
        score: firstCandidate.score,
        timeTakenSeconds: firstCandidate.timeTakenSeconds,
        profilePhoto: firstCandidate.studentPhoto,
      },
      second: secondCandidate
        ? {
            studentId: secondCandidate.studentId,
            name: secondCandidate.studentName,
            rollNo: secondCandidate.studentRoll,
            class: secondCandidate.studentClass,
            semester: secondCandidate.studentSemester,
            score: secondCandidate.score,
            timeTakenSeconds: secondCandidate.timeTakenSeconds,
            profilePhoto: secondCandidate.studentPhoto,
          }
        : undefined,
      third: thirdCandidate
        ? {
            studentId: thirdCandidate.studentId,
            name: thirdCandidate.studentName,
            rollNo: thirdCandidate.studentRoll,
            class: thirdCandidate.studentClass,
            semester: thirdCandidate.studentSemester,
            score: thirdCandidate.score,
            timeTakenSeconds: thirdCandidate.timeTakenSeconds,
            profilePhoto: thirdCandidate.studentPhoto,
          }
        : undefined,
      note,
    };

    dataService.publishWinners(winnerRecord, 'admin@fsudmc.com');
    setPublishedNotice(true);
    setPreviewPoster(winnerRecord);
    onRefresh();
  };

  const handleTieBreakWinner = (tieBreak: TieBreak) => {
    dataService.saveTieBreak(tieBreak, 'admin@fsudmc.com');
    setWheelModalOpen(false);
    onRefresh();
  };

  const handleDeleteWinner = (quizId: string, quizTitle: string) => {
    if (window.confirm(`के तपाईं निश्चित हुनुहुन्छ? "${quizTitle}" को विजेता रेकर्ड मेटिनेछ।`)) {
      dataService.deleteWinner(quizId, 'admin@fsudmc.com');
      onRefresh();
    }
  };

  const [isSyncingContestants, setIsSyncingContestants] = useState(false);

  const handleSyncContestants = async () => {
    setIsSyncingContestants(true);
    try {
      await dataService.fetchLatestWinnersAndSessionsFromFirestore();
      onRefresh();
      setPushNotice('ताजा सहभागी तथा विजेता डाटा ब्याकइन्डबाट सफलताका साथ लोड गरियो!');
      setTimeout(() => setPushNotice(null), 4000);
    } catch {
      setPushNotice('डाटा लोड गर्दा समस्या आयो।');
      setTimeout(() => setPushNotice(null), 4000);
    } finally {
      setIsSyncingContestants(false);
    }
  };

  const handleSaveCurrentWinnersList = () => {
    dataService.saveWinnersList(winners, 'admin@fsudmc.com');
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  const handlePushWinnersAndParticipants = async () => {
    setIsPushingLive(true);
    try {
      const res = await dataService.pushWinnersAndParticipantsToLive('admin@fsudmc.com');
      if (res.success) {
        setPushNotice(res.message);
        setTimeout(() => setPushNotice(null), 5000);
      } else {
        setPushNotice(res.message || 'डाटा पठाउन सकिएन।');
        setTimeout(() => setPushNotice(null), 5000);
      }
      onRefresh();
    } catch {
      setPushNotice('फ्रन्टइन्डमा डाटा पठाउँदा समस्या आयो।');
      setTimeout(() => setPushNotice(null), 5000);
    } finally {
      setIsPushingLive(false);
    }
  };

  const handleSaveManualWinner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!w1Name.trim()) return;

    const quizId = `manual_quiz_${Date.now()}`;
    const newRecord: WinnerRecord = {
      quizId,
      quizTitle: manualQuizTitle.trim() || `साप्ताहिक क्याम्पस क्विज - हप्ता ${winners.length + 1}`,
      publishedAt: new Date().toISOString(),
      first: {
        studentId: `ST_${Date.now()}_1`,
        name: w1Name.trim(),
        rollNo: w1Roll.trim(),
        class: w1Class,
        semester: w1Semester,
        score: Number(w1Score) || 10,
        timeTakenSeconds: Number(w1Time) || 300,
        profilePhoto: w1Photo.trim() || undefined,
      },
      second: w2Name.trim()
        ? {
            studentId: `ST_${Date.now()}_2`,
            name: w2Name.trim(),
            rollNo: w2Roll.trim(),
            class: w2Class,
            semester: w2Semester,
            score: Number(w2Score) || 9,
            timeTakenSeconds: Number(w2Time) || 350,
            profilePhoto: w2Photo.trim() || undefined,
          }
        : undefined,
      third: w3Name.trim()
        ? {
            studentId: `ST_${Date.now()}_3`,
            name: w3Name.trim(),
            rollNo: w3Roll.trim(),
            class: w3Class,
            semester: w3Semester,
            score: Number(w3Score) || 8,
            timeTakenSeconds: Number(w3Time) || 400,
            profilePhoto: w3Photo.trim() || undefined,
          }
        : undefined,
      note: manualNote.trim(),
    };

    dataService.addWinner(newRecord, 'admin@fsudmc.com');
    setShowManualAddModal(false);
    setPreviewPoster(newRecord);
    onRefresh();
  };

  const existingPublished = winners.find(w => w.quizId === selectedQuizId);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
            विजेता व्यवस्थापन तथा घोषणा (Winners Management)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            दार्चुला बहुमुखी क्याम्पस साप्ताहिक क्विजका विजेताहरूको सूची थप्ने, सुरक्षित गर्ने तथा मेटाउने व्यवस्था
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowParticipantsPoster(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            title="सबै सहभागी विद्यार्थीहरूको नतिजा पोस्टर JPG/PNG रूपमा हेर्नुहोस् र डाउनलोड गर्नुहोस्"
          >
            <Trophy className="w-4 h-4" />
            <span>🖼️ सहभागी नतिजा पोस्टर (JPG हेर्नुहोस्)</span>
          </button>

          <button
            onClick={() => {
              setManualQuizTitle(`साप्ताहिक क्याम्पस क्विज - हप्ता ${winners.length + 1}`);
              setShowManualAddModal(true);
            }}
            className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ नयाँ विजेता सूची थप्नुहोस्</span>
          </button>

          <button
            onClick={handleSaveCurrentWinnersList}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>विजेता सूची सुरक्षित राख्नुहोस्</span>
          </button>

          <button
            onClick={handleSyncContestants}
            disabled={isSyncingContestants}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            title="सर्भरबाट पछिल्ला सहभागी तथा विजेता डाटा सिङ्क गर्नुहोस्"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncingContestants ? 'animate-spin text-amber-400' : ''}`} />
            <span>{isSyncingContestants ? 'सिङ्क हुँदै...' : '🔄 सहभागी डाटा सिङ्क'}</span>
          </button>

          <button
            onClick={handlePushWinnersAndParticipants}
            disabled={isPushingLive}
            className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white font-black text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            title="विजेता तथा सम्पूर्ण सहभागीहरूको विवरण फ्रन्टइन्ड (/winner-list) मा प्रत्यक्ष लाइभ पठाउनुहोस्"
          >
            <Radio className={`w-4 h-4 ${isPushingLive ? 'animate-pulse text-blue-200' : ''}`} />
            <span>{isPushingLive ? 'लाइभ पठाउँदै...' : '🚀 फ्रन्टइन्डमा लाइभ पठाउनुहोस्'}</span>
          </button>
        </div>
      </div>

      {pushNotice && (
        <div className="p-4 rounded-2xl bg-blue-50 border border-blue-300 text-blue-900 text-xs font-bold flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
          <span>{pushNotice}</span>
        </div>
      )}

      {savedNotice && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>विजेताहरूको पूर्ण सूची ब्याकइन्ड भण्डारणमा स्थायी रूपमा सुरक्षित गरियो!</span>
        </div>
      )}

      {/* SECTION 1: PERMANENT SAVED WINNERS LIST */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              <span>सुरक्षित विजेताहरूको आधिकारिक सूची ({toNepaliDigits(winners.length)} क्विजहरू)</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              प्रणालीमा स्थायी रूपमा सुरक्षित राखिएको अघिल्ला तथा हालका विजेता विवरण
            </p>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            कुल रेकर्ड: {toNepaliDigits(winners.length)}
          </span>
        </div>

        {winners.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {winners.map(record => (
              <div key={record.quizId} className="p-6 hover:bg-slate-50/50 transition flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[11px]">
                      {record.quizTitle}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      {formatNepalDate(record.publishedAt, true)}
                    </span>
                  </div>

                  {/* Top 3 summary */}
                  <div className="flex flex-wrap items-center gap-3 text-xs pt-1">
                    {record.first && (
                      <div className="flex items-center gap-1.5 bg-amber-50 text-amber-900 border border-amber-200 px-3 py-1.5 rounded-xl font-bold">
                        <span>🥇 प्रथम:</span>
                        <span>{record.first.name}</span>
                        <span className="text-[10px] text-amber-700">({toNepaliDigits(record.first.score)} अंक)</span>
                      </div>
                    )}
                    {record.second && (
                      <div className="flex items-center gap-1.5 bg-slate-100 text-slate-800 border border-slate-200 px-3 py-1.5 rounded-xl font-semibold">
                        <span>🥈 दोस्रो:</span>
                        <span>{record.second.name}</span>
                        <span className="text-[10px] text-slate-600">({toNepaliDigits(record.second.score)} अंक)</span>
                      </div>
                    )}
                    {record.third && (
                      <div className="flex items-center gap-1.5 bg-orange-50 text-orange-900 border border-orange-200 px-3 py-1.5 rounded-xl font-semibold">
                        <span>🥉 तेस्रो:</span>
                        <span>{record.third.name}</span>
                        <span className="text-[10px] text-orange-700">({toNepaliDigits(record.third.score)} अंक)</span>
                      </div>
                    )}
                  </div>
                  {record.note && (
                    <p className="text-xs text-slate-500 italic">"{record.note}"</p>
                  )}
                </div>

                {/* Actions: View Poster / Delete */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setPreviewPoster(record)}
                    className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>बधाई पोस्टर</span>
                  </button>
                  <button
                    onClick={() => handleDeleteWinner(record.quizId, record.quizTitle)}
                    className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 font-bold text-xs rounded-xl border border-red-200 transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>मेटाउनुहोस्</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-slate-400 text-xs">
            हाल कुनै विजेता सूची सुरक्षित गरिएको छैन। तलको सबमिसनबाट वा माथिको बटनबाट नयाँ विजेता थप्न सक्नुहुन्छ।
          </div>
        )}
      </div>

      {/* SECTION 2: PUBLISH WINNERS FROM CURRENT QUIZ SUBMISSIONS */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              सबमिसनबाट स्वचालित विजेता घोषणा
            </h2>
            <p className="text-xs text-slate-500">
              सबैभन्दा बढी अंक र सबैभन्दा छिटो समयको आधारमा शीर्ष ३ विद्यार्थीहरू
            </p>
          </div>

          {/* Select Quiz */}
          <select
            value={selectedQuizId}
            onChange={e => setSelectedQuizId(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold bg-white text-slate-800"
          >
            {quizzes.map(q => (
              <option key={q.id} value={q.id}>
                {q.title} ({q.status === 'active' ? 'सक्रिय' : 'बन्द'})
              </option>
            ))}
          </select>
        </div>

        {/* Official Rules of Winning Reference */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-base">🏆</span>
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              विजेता छनोटका ३ अनिवार्य नियमहरू (Rules of Winning)
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-xs">
            <div className="p-3 bg-white rounded-xl border border-slate-200">
              <span className="font-bold text-slate-900 block text-[11px] mb-0.5">१. सर्वोच्च अंक (Highest Score)</span>
              <p className="text-[11px] text-slate-500">सबैभन्दा बढी अंक प्राप्त गर्ने विद्यार्थी पहिलो प्राथमिकतामा पर्छन्।</p>
            </div>
            <div className="p-3 bg-white rounded-xl border border-slate-200">
              <span className="font-bold text-slate-900 block text-[11px] mb-0.5">२. न्यूनतम समय (Shortest Time)</span>
              <p className="text-[11px] text-slate-500">अंक बराबर भएमा कम समय (छिटो) मा बुझाउने विद्यार्थी विजेता बन्छन्।</p>
            </div>
            <div className="p-3 bg-white rounded-xl border border-slate-200">
              <span className="font-bold text-slate-900 block text-[11px] mb-0.5">३. गोलाप्रथा (Lottery Draw)</span>
              <p className="text-[11px] text-slate-500">अंक र समय दुवै समान भएमा गोलाप्रथा (Lucky Draw Wheel) बाट ३ विजेता छानिन्छन्।</p>
            </div>
          </div>
        </div>

        {/* Tie Alert */}
        {isTopTied && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <h4 className="text-sm font-bold text-amber-900">टाई (Tie) स्थिति पत्ता लाग्यो!</h4>
                <p className="text-xs text-amber-800">
                  {firstCandidate.studentName} र {secondCandidate.studentName} दुबैको अंक ({toNepaliDigits(firstCandidate.score)}) र समय समान छ।
                </p>
              </div>
            </div>
            <button
              onClick={() => setWheelModalOpen(true)}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow transition shrink-0 cursor-pointer"
            >
              स्पिनिङ ह्विल चलाउनुहोस् 🎡
            </button>
          </div>
        )}

        {/* Top Candidates Display */}
        {quizSubmissions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 1st Place */}
            {firstCandidate && (
              <div className="p-5 rounded-2xl bg-amber-500/10 border-2 border-amber-400 flex flex-col items-center text-center relative shadow-xs">
                <span className="text-3xl mb-2">🥇</span>
                <span className="text-[10px] font-bold uppercase text-amber-900 bg-amber-200 px-2 py-0.5 rounded-full mb-2">
                  १st Place (प्रथम)
                </span>
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-amber-400 bg-slate-200 mb-2">
                  <img
                    src={firstCandidate.studentPhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop&crop=face'}
                    alt={firstCandidate.studentName}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-base font-bold text-slate-900">{firstCandidate.studentName}</h3>
                <p className="text-xs text-slate-500">
                  {firstCandidate.studentClass} ({firstCandidate.studentSemester}) | रोल: {toNepaliDigits(firstCandidate.studentRoll)}
                </p>
                <div className="mt-3 pt-3 border-t border-amber-200 w-full flex justify-around text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">प्राप्त अंक</span>
                    <b className="text-amber-800 text-base">{toNepaliDigits(firstCandidate.score)}/१०</b>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">समय</span>
                    <b className="text-amber-800 text-xs">{formatDurationSeconds(firstCandidate.timeTakenSeconds)}</b>
                  </div>
                </div>
              </div>
            )}

            {/* 2nd Place */}
            {secondCandidate && (
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col items-center text-center">
                <span className="text-3xl mb-2">🥈</span>
                <span className="text-[10px] font-bold uppercase text-slate-700 bg-slate-200 px-2 py-0.5 rounded-full mb-2">
                  २nd Place (दोस्रो)
                </span>
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-slate-300 bg-slate-200 mb-2">
                  <img
                    src={secondCandidate.studentPhoto || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop&crop=face'}
                    alt={secondCandidate.studentName}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-base font-bold text-slate-900">{secondCandidate.studentName}</h3>
                <p className="text-xs text-slate-500">
                  {secondCandidate.studentClass} ({secondCandidate.studentSemester}) | रोल: {toNepaliDigits(secondCandidate.studentRoll)}
                </p>
                <div className="mt-3 pt-3 border-t border-slate-200 w-full flex justify-around text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">प्राप्त अंक</span>
                    <b className="text-slate-800 text-base">{toNepaliDigits(secondCandidate.score)}/१०</b>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">समय</span>
                    <b className="text-slate-800 text-xs">{formatDurationSeconds(secondCandidate.timeTakenSeconds)}</b>
                  </div>
                </div>
              </div>
            )}

            {/* 3rd Place */}
            {thirdCandidate && (
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col items-center text-center">
                <span className="text-3xl mb-2">🥉</span>
                <span className="text-[10px] font-bold uppercase text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full mb-2">
                  ३rd Place (तेस्रो)
                </span>
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-amber-600 bg-slate-200 mb-2">
                  <img
                    src={thirdCandidate.studentPhoto || 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&h=120&fit=crop&crop=face'}
                    alt={thirdCandidate.studentName}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-base font-bold text-slate-900">{thirdCandidate.studentName}</h3>
                <p className="text-xs text-slate-500">
                  {thirdCandidate.studentClass} ({thirdCandidate.studentSemester}) | रोल: {toNepaliDigits(thirdCandidate.studentRoll)}
                </p>
                <div className="mt-3 pt-3 border-t border-slate-200 w-full flex justify-around text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">प्राप्त अंक</span>
                    <b className="text-slate-800 text-base">{toNepaliDigits(thirdCandidate.score)}/१०</b>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">समय</span>
                    <b className="text-slate-800 text-xs">{formatDurationSeconds(thirdCandidate.timeTakenSeconds)}</b>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="py-8 text-center text-slate-400 text-xs">
            यस क्विजमा अझैसम्म कुनै विद्यार्थीले उत्तर बुझाएका छैनन्।
          </div>
        )}

        {/* Publish Action form */}
        <div className="pt-4 border-t border-slate-100 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              बधाई सन्देश वा टिप्पणी (Note)
            </label>
            <input
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={handlePublishWinners}
              disabled={!firstCandidate}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-2 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>विजेता सूची सार्वजनिक तथा सुरक्षित गर्नुहोस्</span>
            </button>

            {existingPublished && (
              <button
                onClick={() => setPreviewPoster(existingPublished)}
                className="px-5 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>बधाई पोस्टर हेर्नुहोस् / प्रिन्ट</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Manual Winner Add Modal */}
      {showManualAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl relative my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                <span>विजेता सूची म्यानुअल थप्नुहोस् (Add Winner List)</span>
              </h2>
              <button
                onClick={() => setShowManualAddModal(false)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveManualWinner} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-slate-700 mb-1">क्विजको शीर्षक *</label>
                <input
                  type="text"
                  required
                  value={manualQuizTitle}
                  onChange={e => setManualQuizTitle(e.target.value)}
                  placeholder="उदा. साप्ताहिक क्याम्पस क्विज - हप्ता १२"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-red-500 outline-hidden"
                />
              </div>

              {/* 1st Winner */}
              <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2.5">
                <h4 className="font-bold text-amber-900 text-sm">🥇 प्रथम स्थान विजेता (First Place) *</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    required
                    placeholder="पूरा नाम *"
                    value={w1Name}
                    onChange={e => setW1Name(e.target.value)}
                    className="px-3 py-2 bg-white rounded-xl border border-slate-200"
                  />
                  <input
                    type="text"
                    placeholder="रोल नम्बर"
                    value={w1Roll}
                    onChange={e => setW1Roll(e.target.value)}
                    className="px-3 py-2 bg-white rounded-xl border border-slate-200"
                  />
                  <input
                    type="text"
                    placeholder="कक्षा (उदा. BCA)"
                    value={w1Class}
                    onChange={e => setW1Class(e.target.value)}
                    className="px-3 py-2 bg-white rounded-xl border border-slate-200"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="सेमेस्टर (उदा. चौथो)"
                    value={w1Semester}
                    onChange={e => setW1Semester(e.target.value)}
                    className="px-3 py-2 bg-white rounded-xl border border-slate-200"
                  />
                  <input
                    type="number"
                    placeholder="अंक (१०)"
                    value={w1Score}
                    onChange={e => setW1Score(parseInt(e.target.value) || 10)}
                    className="px-3 py-2 bg-white rounded-xl border border-slate-200"
                  />
                  <input
                    type="text"
                    placeholder="फोटो URL (ऐच्छिक)"
                    value={w1Photo}
                    onChange={e => setW1Photo(e.target.value)}
                    className="px-3 py-2 bg-white rounded-xl border border-slate-200 text-[11px]"
                  />
                </div>
              </div>

              {/* 2nd Winner */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                <h4 className="font-bold text-slate-800 text-sm">🥈 दोस्रो स्थान विजेता (Second Place)</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="पूरा नाम"
                    value={w2Name}
                    onChange={e => setW2Name(e.target.value)}
                    className="px-3 py-2 bg-white rounded-xl border border-slate-200"
                  />
                  <input
                    type="text"
                    placeholder="रोल नम्बर"
                    value={w2Roll}
                    onChange={e => setW2Roll(e.target.value)}
                    className="px-3 py-2 bg-white rounded-xl border border-slate-200"
                  />
                  <input
                    type="text"
                    placeholder="कक्षा"
                    value={w2Class}
                    onChange={e => setW2Class(e.target.value)}
                    className="px-3 py-2 bg-white rounded-xl border border-slate-200"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="सेमेस्टर"
                    value={w2Semester}
                    onChange={e => setW2Semester(e.target.value)}
                    className="px-3 py-2 bg-white rounded-xl border border-slate-200"
                  />
                  <input
                    type="number"
                    placeholder="अंक"
                    value={w2Score}
                    onChange={e => setW2Score(parseInt(e.target.value) || 9)}
                    className="px-3 py-2 bg-white rounded-xl border border-slate-200"
                  />
                  <input
                    type="text"
                    placeholder="फोटो URL"
                    value={w2Photo}
                    onChange={e => setW2Photo(e.target.value)}
                    className="px-3 py-2 bg-white rounded-xl border border-slate-200 text-[11px]"
                  />
                </div>
              </div>

              {/* 3rd Winner */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                <h4 className="font-bold text-slate-800 text-sm">🥉 तेस्रो स्थान विजेता (Third Place)</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="पूरा नाम"
                    value={w3Name}
                    onChange={e => setW3Name(e.target.value)}
                    className="px-3 py-2 bg-white rounded-xl border border-slate-200"
                  />
                  <input
                    type="text"
                    placeholder="रोल नम्बर"
                    value={w3Roll}
                    onChange={e => setW3Roll(e.target.value)}
                    className="px-3 py-2 bg-white rounded-xl border border-slate-200"
                  />
                  <input
                    type="text"
                    placeholder="कक्षा"
                    value={w3Class}
                    onChange={e => setW3Class(e.target.value)}
                    className="px-3 py-2 bg-white rounded-xl border border-slate-200"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="सेमेस्टर"
                    value={w3Semester}
                    onChange={e => setW3Semester(e.target.value)}
                    className="px-3 py-2 bg-white rounded-xl border border-slate-200"
                  />
                  <input
                    type="number"
                    placeholder="अंक"
                    value={w3Score}
                    onChange={e => setW3Score(parseInt(e.target.value) || 8)}
                    className="px-3 py-2 bg-white rounded-xl border border-slate-200"
                  />
                  <input
                    type="text"
                    placeholder="फोटो URL"
                    value={w3Photo}
                    onChange={e => setW3Photo(e.target.value)}
                    className="px-3 py-2 bg-white rounded-xl border border-slate-200 text-[11px]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 mb-1">बधाई सन्देश</label>
                <input
                  type="text"
                  value={manualNote}
                  onChange={e => setManualNote(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowManualAddModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold"
                >
                  रद्द गर्नुहोस्
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs"
                >
                  सुरक्षित गरी प्रकाशित गर्नुहोस्
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tie Break Wheel Modal */}
      {wheelModalOpen && isTopTied && (
        <SpinningWheel
          quizId={selectedQuizId}
          tiedScore={firstCandidate.score}
          participants={tiedParticipants}
          onWinnerSelected={handleTieBreakWinner}
          onClose={() => setWheelModalOpen(false)}
        />
      )}

      {/* Congratulation Poster Modal */}
      {previewPoster && (
        <WinnerPoster
          record={previewPoster}
          onClose={() => setPreviewPoster(null)}
        />
      )}

      {/* Participants Score Poster Modal (Master Admin Graphic View with JPG/PNG export) */}
      {showParticipantsPoster && activeQuiz && (
        <ParticipantsScorePoster
          quiz={activeQuiz}
          participants={quizSubmissions}
          onClose={() => setShowParticipantsPoster(false)}
        />
      )}
    </div>
  );
};
