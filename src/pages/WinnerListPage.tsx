import React, { useState } from 'react';
import type { WinnerRecord } from '../types/quiz';
import { toNepaliDigits, formatNepalDate, formatDurationSeconds } from '../lib/nepaliUtils';
import { Trophy, Award, Sparkles, Printer, Calendar, User } from 'lucide-react';
import { WinnerPoster } from '../components/WinnerPoster';

interface WinnerListPageProps {
  winners: WinnerRecord[];
  navigate: (path: string) => void;
}

export const WinnerListPage: React.FC<WinnerListPageProps> = ({ winners }) => {
  const [selectedPosterRecord, setSelectedPosterRecord] = useState<WinnerRecord | null>(null);

  const latestWinner = winners[0];
  const pastWinners = winners.slice(1);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold uppercase tracking-wider">
          <Trophy className="w-3.5 h-3.5 text-amber-600" />
          <span>स्ववियु — दार्चुला बहुमुखी क्याम्पस (Darchula Multiple Campus)</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900">
          साप्ताहिक हाजिरी जवाफ विजेता सूची
        </h1>
        <p className="text-sm text-slate-500">
          उत्कृष्ट ज्ञान र तीव्र गति प्रदर्शन गरी क्याम्पसमा प्रथम, दोस्रो र तेस्रो स्थान हासिल गर्ने मेधावी विद्यार्थीहरू।
        </p>
      </div>

      {/* Latest Quiz Winners Podium */}
      {latestWinner ? (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <div>
              <span className="text-xs font-bold text-red-600 uppercase tracking-widest block">
                हालै प्रकाशित नतिजा
              </span>
              <h2 className="text-xl font-bold text-slate-900 mt-0.5">{latestWinner.quizTitle}</h2>
              <span className="text-xs text-slate-500">
                घोषणा मिति: {formatNepalDate(latestWinner.publishedAt, false)}
              </span>
            </div>

            <button
              onClick={() => setSelectedPosterRecord(latestWinner)}
              className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs rounded-xl shadow-sm transition flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-slate-950" />
              <span>बधाई पोस्टर हेर्नुहोस् / प्रिन्ट</span>
            </button>
          </div>

          {/* 3 Podiums Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
            {/* 2nd Place (Left) */}
            {latestWinner.second ? (
              <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs text-center flex flex-col items-center relative order-2 md:order-1">
                <div className="w-12 h-12 rounded-xl bg-slate-200 text-slate-800 font-black text-2xl flex items-center justify-center mb-3 shadow-xs">
                  🥈
                </div>
                <div className="w-20 h-20 rounded-full overflow-hidden bg-slate-100 border-3 border-slate-300 shadow-md mb-3">
                  <img
                    src={latestWinner.second.profilePhoto || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face'}
                    alt={latestWinner.second.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  दोस्रो स्थान (२nd Place)
                </span>
                <h3 className="text-lg font-bold text-slate-900">{latestWinner.second.name}</h3>
                <p className="text-xs text-slate-500 mb-4">
                  {latestWinner.second.class} ({latestWinner.second.semester}) | रोल: {toNepaliDigits(latestWinner.second.rollNo)}
                </p>

                <div className="w-full pt-3 border-t border-slate-100 flex justify-around text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">प्राप्त अंक</span>
                    <b className="text-slate-800 text-base">{toNepaliDigits(latestWinner.second.score)}/१०</b>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">समय लागेको</span>
                    <b className="text-slate-800 text-xs">{formatDurationSeconds(latestWinner.second.timeTakenSeconds)}</b>
                  </div>
                </div>
              </div>
            ) : null}

            {/* 1st Place (Center - Highlighted) */}
            {latestWinner.first ? (
              <div className="bg-gradient-to-b from-amber-500/10 via-white to-amber-500/5 rounded-3xl p-6 sm:p-8 border-2 border-amber-400 shadow-xl text-center flex flex-col items-center relative order-1 md:order-2 md:-translate-y-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-400 text-slate-950 font-black text-3xl flex items-center justify-center mb-3 shadow-lg shadow-amber-400/30">
                  🥇
                </div>
                <div className="w-24 h-24 rounded-full overflow-hidden bg-slate-100 border-4 border-amber-400 shadow-lg mb-3">
                  <img
                    src={latestWinner.first.profilePhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=face'}
                    alt={latestWinner.first.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="inline-block px-3 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-wider mb-1">
                  प्रथम स्थान (Winner)
                </span>
                <h3 className="text-xl font-black text-slate-900">{latestWinner.first.name}</h3>
                <p className="text-xs text-slate-600 mb-4 font-medium">
                  {latestWinner.first.class} ({latestWinner.first.semester}) | रोल: {toNepaliDigits(latestWinner.first.rollNo)}
                </p>

                <div className="w-full pt-4 border-t border-amber-200 flex justify-around text-xs bg-amber-50/50 p-2 rounded-2xl">
                  <div>
                    <span className="text-[10px] text-amber-800 block">प्राप्त अंक</span>
                    <b className="text-amber-900 text-lg">{toNepaliDigits(latestWinner.first.score)}/१०</b>
                  </div>
                  <div>
                    <span className="text-[10px] text-amber-800 block">समय लागेको</span>
                    <b className="text-amber-900 text-xs">{formatDurationSeconds(latestWinner.first.timeTakenSeconds)}</b>
                  </div>
                </div>
              </div>
            ) : null}

            {/* 3rd Place (Right) */}
            {latestWinner.third ? (
              <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs text-center flex flex-col items-center relative order-3">
                <div className="w-12 h-12 rounded-xl bg-amber-700 text-white font-black text-2xl flex items-center justify-center mb-3 shadow-xs">
                  🥉
                </div>
                <div className="w-20 h-20 rounded-full overflow-hidden bg-slate-100 border-3 border-amber-600 shadow-md mb-3">
                  <img
                    src={latestWinner.third.profilePhoto || 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&h=200&fit=crop&crop=face'}
                    alt={latestWinner.third.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 mb-1">
                  तेस्रो स्थान (३rd Place)
                </span>
                <h3 className="text-lg font-bold text-slate-900">{latestWinner.third.name}</h3>
                <p className="text-xs text-slate-500 mb-4">
                  {latestWinner.third.class} ({latestWinner.third.semester}) | रोल: {toNepaliDigits(latestWinner.third.rollNo)}
                </p>

                <div className="w-full pt-3 border-t border-slate-100 flex justify-around text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">प्राप्त अंक</span>
                    <b className="text-slate-800 text-base">{toNepaliDigits(latestWinner.third.score)}/१०</b>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">समय लागेको</span>
                    <b className="text-slate-800 text-xs">{formatDurationSeconds(latestWinner.third.timeTakenSeconds)}</b>
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

      {/* Past Winners Archive */}
      {pastWinners.length > 0 && (
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
