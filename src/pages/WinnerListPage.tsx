import React, { useState, useEffect } from 'react';
import type { WinnerRecord, QuizSession } from '../types/quiz';
import { toNepaliDigits, formatNepalDate, formatDurationSeconds } from '../lib/nepaliUtils';
import { Trophy, Award, Sparkles, Printer, Calendar, User, Search, Users, CheckCircle2, RefreshCw, Radio, Clock, Lock } from 'lucide-react';
import { WinnerPoster } from '../components/WinnerPoster';
import { dataService } from '../lib/dataService';

interface WinnerListPageProps {
  winners: WinnerRecord[];
  navigate: (path: string) => void;
}

export const WinnerListPage: React.FC<WinnerListPageProps> = ({ winners: initialWinners }) => {
  const [selectedPosterRecord, setSelectedPosterRecord] = useState<WinnerRecord | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Subscribe to real-time data changes so frontend updates live when admin pushes
  useEffect(() => {
    const unsub = dataService.subscribe(() => {
      setRefreshKey(k => k + 1);
    });
    return unsub;
  }, []);

  // Fetch latest winners and contestant sessions from Firestore on initial mount
  useEffect(() => {
    dataService.fetchLatestWinnersAndSessionsFromFirestore().catch(() => {});
  }, []);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await dataService.fetchLatestWinnersAndSessionsFromFirestore();
    } finally {
      setIsRefreshing(false);
    }
  };

  const winners = dataService.getWinners().length > 0 ? dataService.getWinners() : initialWinners;
  const quizzes = dataService.getQuizzes();
  const latestWinner = winners[0];
  const pastWinners = winners.slice(1);

  const [selectedQuizId, setSelectedQuizId] = useState<string>(() => latestWinner?.quizId || quizzes[0]?.id || 'all');

  const isWinnerVisible = dataService.isWinnerDisplayAllowed(selectedQuizId === 'all' ? undefined : selectedQuizId);
  const isParticipantsVisible = dataService.isParticipantsDisplayAllowed(selectedQuizId === 'all' ? undefined : selectedQuizId);

  // Keep selected quiz aligned with latest winner when updated via real-time stream
  useEffect(() => {
    if (latestWinner && (!selectedQuizId || selectedQuizId === 'all')) {
      setSelectedQuizId(latestWinner.quizId);
    }
  }, [latestWinner?.quizId]);

  // Load participant submissions for the selected quiz (or all if 'all')
  const allSessions: QuizSession[] = dataService
    .getSessions(selectedQuizId === 'all' ? undefined : selectedQuizId)
    .filter(s => s.status === 'submitted' || s.status === 'expired' || (typeof s.score === 'number' && s.score >= 0 && Boolean(s.submittedAt)))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.timeTakenSeconds - b.timeTakenSeconds;
    });

  // Effective winner for podium (official record or provisional top 3 from completed sessions)
  const effectiveWinner: WinnerRecord | null = latestWinner || (allSessions.length > 0 ? {
    id: `provisional_${selectedQuizId}`,
    quizId: selectedQuizId === 'all' ? (quizzes[0]?.id || 'quiz_provisional') : selectedQuizId,
    quizTitle: quizzes.find(q => q.id === selectedQuizId)?.title || 'साप्ताहिक हाजिरी जवाफ प्रतियोगिता',
    publishedAt: new Date().toISOString(),
    announcedAt: new Date().toISOString(),
    first: allSessions[0] ? {
      studentId: allSessions[0].studentId,
      name: allSessions[0].studentName,
      rollNo: allSessions[0].studentRoll,
      class: allSessions[0].studentClass,
      semester: allSessions[0].studentSemester,
      score: allSessions[0].score,
      timeTakenSeconds: allSessions[0].timeTakenSeconds,
      profilePhoto: allSessions[0].studentPhoto,
    } : undefined,
    second: allSessions[1] ? {
      studentId: allSessions[1].studentId,
      name: allSessions[1].studentName,
      rollNo: allSessions[1].studentRoll,
      class: allSessions[1].studentClass,
      semester: allSessions[1].studentSemester,
      score: allSessions[1].score,
      timeTakenSeconds: allSessions[1].timeTakenSeconds,
      profilePhoto: allSessions[1].studentPhoto,
    } : undefined,
    third: allSessions[2] ? {
      studentId: allSessions[2].studentId,
      name: allSessions[2].studentName,
      rollNo: allSessions[2].studentRoll,
      class: allSessions[2].studentClass,
      semester: allSessions[2].studentSemester,
      score: allSessions[2].score,
      timeTakenSeconds: allSessions[2].timeTakenSeconds,
      profilePhoto: allSessions[2].studentPhoto,
    } : undefined,
  } as WinnerRecord : null);

  const filteredParticipants = allSessions.filter(s => {
    const q = searchTerm.toLowerCase();
    return (
      (s.studentName || '').toLowerCase().includes(q) ||
      (s.studentRoll || '').toLowerCase().includes(q) ||
      (s.studentClass || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="flex flex-wrap items-center justify-center gap-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold uppercase tracking-wider">
            <Trophy className="w-3.5 h-3.5 text-amber-600" />
            <span>स्ववियु — दार्चुला बहुमुखी क्याम्पस (Darchula Multiple Campus)</span>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>प्रत्यक्ष लाइभ अपडेट सक्रिय</span>
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900">
          साप्ताहिक हाजिरी जवाफ विजेता सूची
        </h1>
        <p className="text-sm text-slate-500">
          उत्कृष्ट ज्ञान र तीव्र गति प्रदर्शन गरी क्याम्पसमा प्रथम, दोस्रो र तेस्रो स्थान हासिल गर्ने मेधावी विद्यार्थीहरू।
        </p>

        <div className="flex items-center justify-center pt-1">
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 shadow-2xs transition cursor-pointer disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-red-600' : 'text-slate-500'}`} />
            <span>{isRefreshing ? 'ताजा नतिजा लोड हुँदै...' : '🔄 ताजा नतिजा तथा सहभागी लोड गर्नुहोस् (Live Sync)'}</span>
          </button>
        </div>
      </div>

      {/* 3 Official Winning Criteria Card */}
      <div className="bg-amber-50/80 border border-amber-200 rounded-3xl p-5 sm:p-6 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200/80 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">🏆</span>
            <h3 className="text-sm font-black text-amber-950 uppercase tracking-wide">
              विजेता छनोटका ३ आधिकारिक नियमहरू (Rules of Winning)
            </h3>
          </div>
          <span className="text-[11px] font-semibold text-amber-800">
            निष्पक्ष, पारदर्शी र स्वचालित प्रणाली
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          <div className="bg-white/90 p-3.5 rounded-2xl border border-amber-200 shadow-2xs">
            <div className="flex items-center gap-2 font-bold text-xs text-amber-950 mb-1">
              <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] flex items-center justify-center shrink-0">१</span>
              <span>१. सर्वोच्च अंक (Highest Score)</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              सबैभन्दा पहिलो प्राथमिकता प्राप्तांकलाई दिइन्छ। सबैभन्दा बढी अंक प्राप्त गर्ने विद्यार्थी पहिलो प्राथमिकतामा पर्नेछन्।
            </p>
          </div>

          <div className="bg-white/90 p-3.5 rounded-2xl border border-amber-200 shadow-2xs">
            <div className="flex items-center gap-2 font-bold text-xs text-blue-950 mb-1">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-black text-[10px] flex items-center justify-center shrink-0">२</span>
              <span>२. न्यूनतम समय (Shortest Time)</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              यदि दुई वा सोभन्दा बढी विद्यार्थीहरूको अंक बराबर भएमा, कम समय (छिटो सेकेन्ड) मा क्विज पूरा गर्ने विद्यार्थी विजेता हुनेछन्।
            </p>
          </div>

          <div className="bg-white/90 p-3.5 rounded-2xl border border-amber-200 shadow-2xs">
            <div className="flex items-center gap-2 font-bold text-xs text-rose-950 mb-1">
              <span className="w-5 h-5 rounded-full bg-rose-600 text-white font-black text-[10px] flex items-center justify-center shrink-0">३</span>
              <span>३. गोलाप्रथा (Lottery Draw)</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              यदि अंक र समय दुवै ठ्याक्कै समान भएमा, पारदर्शी गोलाप्रथा (Lottery / Lucky Draw) मार्फत शीर्ष ३ विजेता छनोट गरिनेछ।
            </p>
          </div>
        </div>
      </div>

      {/* Latest Quiz Winners Podium */}
      {!isWinnerVisible ? (
        <div className="bg-gradient-to-br from-amber-50 to-orange-50/60 rounded-3xl p-8 sm:p-10 border border-amber-200 text-center space-y-4 shadow-2xs">
          <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto text-3xl shadow-inner">
            ⏳
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h3 className="text-xl font-black text-slate-900">विजेता घोषणा प्रक्रियामा छ</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              हाल परीक्षा तथा उत्तरहरूको समीक्षा क्रममा छ। परीक्षा समाप्त भएको १ घण्टापछि (वा प्रशासनले प्रकाशन गर्नासाथ) शीर्ष ३ विजेताहरूको आधिकारिक नामावली यहाँ स्वतः सार्वजनिक हुनेछ।
            </p>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white border border-amber-200 text-amber-800 text-xs font-bold shadow-2xs">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>परीक्षा सकिएको १ घण्टापछि स्वतः प्रकाशित हुनेछ</span>
          </div>
        </div>
      ) : effectiveWinner ? (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <div>
              <span className="text-xs font-bold text-red-600 uppercase tracking-widest block">
                {latestWinner ? 'हालै प्रकाशित नतिजा' : 'प्रारम्भिक शीर्ष ३ नतिजा (Provisional Top 3)'}
              </span>
              <h2 className="text-xl font-bold text-slate-900 mt-0.5">{effectiveWinner.quizTitle}</h2>
              <span className="text-xs text-slate-500">
                घोषणा मिति: {formatNepalDate(effectiveWinner.publishedAt, false)}
              </span>
            </div>

            <button
              onClick={() => setSelectedPosterRecord(effectiveWinner)}
              className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs rounded-xl shadow-sm transition flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-slate-950" />
              <span>बधाई पोस्टर हेर्नुहोस् / प्रिन्ट</span>
            </button>
          </div>

          {/* 3 Podiums Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
            {/* 2nd Place (Left) */}
            {effectiveWinner.second ? (
              <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs text-center flex flex-col items-center relative order-2 md:order-1">
                <div className="w-12 h-12 rounded-xl bg-slate-200 text-slate-800 font-black text-2xl flex items-center justify-center mb-3 shadow-xs">
                  🥈
                </div>
                <div className="w-20 h-20 rounded-full overflow-hidden bg-slate-100 border-3 border-slate-300 shadow-md mb-3">
                  <img
                    src={effectiveWinner.second.profilePhoto || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face'}
                    alt={effectiveWinner.second.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  दोस्रो स्थान (२nd Place)
                </span>
                <h3 className="text-lg font-bold text-slate-900">{effectiveWinner.second.name}</h3>
                <p className="text-xs text-slate-500 mb-4">
                  {effectiveWinner.second.class} ({effectiveWinner.second.semester}) | रोल: {toNepaliDigits(effectiveWinner.second.rollNo)}
                </p>

                <div className="w-full pt-3 border-t border-slate-100 flex justify-around text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">प्राप्त अंक</span>
                    <b className="text-slate-800 text-base">{toNepaliDigits(effectiveWinner.second.score)}/१०</b>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">समय लागेको</span>
                    <b className="text-slate-800 text-xs">{formatDurationSeconds(effectiveWinner.second.timeTakenSeconds)}</b>
                  </div>
                </div>
              </div>
            ) : null}

            {/* 1st Place (Center - Highlighted) */}
            {effectiveWinner.first ? (
              <div className="bg-gradient-to-b from-amber-500/10 via-white to-amber-500/5 rounded-3xl p-6 sm:p-8 border-2 border-amber-400 shadow-xl text-center flex flex-col items-center relative order-1 md:order-2 md:-translate-y-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-400 text-slate-950 font-black text-3xl flex items-center justify-center mb-3 shadow-lg shadow-amber-400/30">
                  🥇
                </div>
                <div className="w-24 h-24 rounded-full overflow-hidden bg-slate-100 border-4 border-amber-400 shadow-lg mb-3">
                  <img
                    src={effectiveWinner.first.profilePhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=face'}
                    alt={effectiveWinner.first.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="inline-block px-3 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-wider mb-1">
                  प्रथम स्थान (Winner)
                </span>
                <h3 className="text-xl font-black text-slate-900">{effectiveWinner.first.name}</h3>
                <p className="text-xs text-slate-600 mb-4 font-medium">
                  {effectiveWinner.first.class} ({effectiveWinner.first.semester}) | रोल: {toNepaliDigits(effectiveWinner.first.rollNo)}
                </p>

                <div className="w-full pt-4 border-t border-amber-200 flex justify-around text-xs bg-amber-50/50 p-2 rounded-2xl">
                  <div>
                    <span className="text-[10px] text-amber-800 block">प्राप्त अंक</span>
                    <b className="text-amber-900 text-lg">{toNepaliDigits(effectiveWinner.first.score)}/१०</b>
                  </div>
                  <div>
                    <span className="text-[10px] text-amber-800 block">समय लागेको</span>
                    <b className="text-amber-900 text-xs">{formatDurationSeconds(effectiveWinner.first.timeTakenSeconds)}</b>
                  </div>
                </div>
              </div>
            ) : null}

            {/* 3rd Place (Right) */}
            {effectiveWinner.third ? (
              <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs text-center flex flex-col items-center relative order-3">
                <div className="w-12 h-12 rounded-xl bg-amber-700 text-white font-black text-2xl flex items-center justify-center mb-3 shadow-xs">
                  🥉
                </div>
                <div className="w-20 h-20 rounded-full overflow-hidden bg-slate-100 border-3 border-amber-600 shadow-md mb-3">
                  <img
                    src={effectiveWinner.third.profilePhoto || 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&h=200&fit=crop&crop=face'}
                    alt={effectiveWinner.third.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 mb-1">
                  तेस्रो स्थान (३rd Place)
                </span>
                <h3 className="text-lg font-bold text-slate-900">{effectiveWinner.third.name}</h3>
                <p className="text-xs text-slate-500 mb-4">
                  {effectiveWinner.third.class} ({effectiveWinner.third.semester}) | रोल: {toNepaliDigits(effectiveWinner.third.rollNo)}
                </p>

                <div className="w-full pt-3 border-t border-slate-100 flex justify-around text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">प्राप्त अंक</span>
                    <b className="text-slate-800 text-base">{toNepaliDigits(effectiveWinner.third.score)}/१०</b>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">समय लागेको</span>
                    <b className="text-slate-800 text-xs">{formatDurationSeconds(effectiveWinner.third.timeTakenSeconds)}</b>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-12 text-center text-slate-500 border border-slate-200">
          हालसम्म कुनै विजेता घोषणा गरिएको छैन।
        </div>
      )}

      {/* All Quiz Participants Table */}
      {!isParticipantsVisible ? (
        <div className="bg-slate-50 rounded-3xl p-8 text-center border border-slate-200 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-200 text-slate-700 flex items-center justify-center mx-auto text-xl">
            📋
          </div>
          <h3 className="text-base font-bold text-slate-800">सहभागीहरूको नतिजा तालिका हाल गोप्य छ</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            परीक्षा निष्पक्षताका लागि सहभागीहरूको प्राप्ताङ्क सूची परीक्षा सकिएपछि १ घण्टाभित्र स्वतः प्रदर्शित हुनेछ।
          </p>
        </div>
      ) : (
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              <Users className="w-4 h-4 text-red-600" />
              <span>साप्ताहिक क्विज सहभागिता मूल्याङ्कन</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">
              सबै सहभागी विद्यार्थीहरूको नतिजा तालिका
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              क्विजमा सहभागी सम्पूर्ण विद्यार्थीहरूको नाम, प्रोफाइल तस्बिर, कक्षा र प्राप्त प्राप्ताङ्क
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {quizzes.length > 1 && (
              <select
                value={selectedQuizId}
                onChange={e => setSelectedQuizId(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white"
              >
                <option value="all">सबै क्विजहरू (All Quizzes)</option>
                {quizzes.map(q => (
                  <option key={q.id} value={q.id}>
                    {q.title}
                  </option>
                ))}
              </select>
            )}

            <div className="relative flex-1 sm:w-64">
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="विद्यार्थी वा रोल नं. खोज्नुहोस्..."
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-red-500 font-medium"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>
        </div>

        {filteredParticipants.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3 px-4 text-center w-16">स्थान</th>
                  <th className="py-3 px-4">विद्यार्थी (नाम र तस्बिर)</th>
                  <th className="py-3 px-4">रोल नम्बर</th>
                  <th className="py-3 px-4">कक्षा / सेमेस्टर</th>
                  <th className="py-3 px-4 text-center">प्राप्त अङ्क</th>
                  <th className="py-3 px-4 text-center">लागेको समय</th>
                  <th className="py-3 px-4 text-center">स्थिति</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredParticipants.map((p, idx) => {
                  const rank = idx + 1;
                  const isFirst = rank === 1;
                  const isSecond = rank === 2;
                  const isThird = rank === 3;

                  return (
                    <tr
                      key={p.id}
                      className={`hover:bg-slate-50/80 transition ${
                        isFirst
                          ? 'bg-amber-50/50'
                          : isSecond
                          ? 'bg-slate-50/40'
                          : isThird
                          ? 'bg-orange-50/30'
                          : ''
                      }`}
                    >
                      {/* Rank */}
                      <td className="py-3 px-4 text-center">
                        {isFirst ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-400 text-slate-950 font-black text-xs shadow-xs">
                            🥇
                          </span>
                        ) : isSecond ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-200 text-slate-900 font-black text-xs shadow-xs">
                            🥈
                          </span>
                        ) : isThird ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-700 text-white font-black text-xs shadow-xs">
                            🥉
                          </span>
                        ) : (
                          <span className="font-bold text-slate-600 font-mono">
                            {toNepaliDigits(rank)}
                          </span>
                        )}
                      </td>

                      {/* Student Profile Photo + Name */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-200 bg-slate-100 shrink-0 flex items-center justify-center">
                            {p.studentPhoto ? (
                              <img
                                src={p.studentPhoto}
                                alt={p.studentName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-slate-200 text-slate-700 font-black text-sm flex items-center justify-center">
                                {p.studentName ? p.studentName.trim().charAt(0).toUpperCase() : 'S'}
                              </div>
                            )}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block text-sm">
                              {p.studentName}
                            </span>
                            <span className="text-[10px] text-slate-400">ID: {p.studentId}</span>
                          </div>
                        </div>
                      </td>

                      {/* Roll No */}
                      <td className="py-3 px-4 font-semibold text-slate-700 font-mono">
                        {toNepaliDigits(p.studentRoll)}
                      </td>

                      {/* Class / Semester */}
                      <td className="py-3 px-4 text-slate-600">
                        {p.studentClass} ({p.studentSemester})
                      </td>

                      {/* Score */}
                      <td className="py-3 px-4 text-center">
                        <span className="inline-block px-3 py-1 rounded-xl bg-amber-100 text-amber-900 font-black text-sm">
                          {toNepaliDigits(p.score)}<span className="text-[10px] text-amber-700 font-normal">/१०</span>
                        </span>
                      </td>

                      {/* Time Taken */}
                      <td className="py-3 px-4 text-center font-mono text-slate-600">
                        {formatDurationSeconds(p.timeTakenSeconds)}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>सफल सम्पन्न</span>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-2xl border border-slate-100">
            कुनै सहभागी विद्यार्थी फेला परेन।
          </div>
        )}
      </div>
      )}

      {/* Past Winners Archive */}
      {isWinnerVisible && pastWinners.length > 0 && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-xl font-bold text-slate-900">अघिल्ला क्विजका विजेताहरू (Archives)</h2>
            <p className="text-xs text-slate-500 mt-0.5">विगतका साप्ताहिक क्विजमा उत्कृष्ट ठहरिनुभएका विद्यार्थीहरू</p>
          </div>

          <div className="space-y-4">
            {pastWinners.map(w => (
              <div
                key={w.quizId}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4"
              >
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{w.quizTitle}</h3>
                  <div className="text-xs text-slate-600 mt-1 flex flex-wrap gap-4">
                    <span>🥇 {w.first?.name} ({w.first?.class}) - {toNepaliDigits(w.first?.score)}/१०</span>
                    {w.second && <span>🥈 {w.second.name} ({w.second.class})</span>}
                    {w.third && <span>🥉 {w.third.name} ({w.third.class})</span>}
                  </div>
                </div>

                <button
                  onClick={() => setSelectedPosterRecord(w)}
                  className="px-3.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-2xs cursor-pointer shrink-0"
                >
                  <Award className="w-3.5 h-3.5 text-amber-500" />
                  <span>पोस्टर हेर्नुहोस्</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Congratulation Poster Modal */}
      {selectedPosterRecord && (
        <WinnerPoster
          record={selectedPosterRecord}
          onClose={() => setSelectedPosterRecord(null)}
        />
      )}
    </div>
  );
};
