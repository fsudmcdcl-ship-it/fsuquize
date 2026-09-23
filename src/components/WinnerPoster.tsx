import React, { useRef } from 'react';
import type { WinnerRecord } from '../types/quiz';
import { toNepaliDigits, formatNepalDate, formatDurationSeconds } from '../lib/nepaliUtils';
import { Download, Award, Sparkles, Printer, X } from 'lucide-react';

interface WinnerPosterProps {
  record: WinnerRecord;
  onClose: () => void;
}

export const WinnerPoster: React.FC<WinnerPosterProps> = ({ record, onClose }) => {
  const posterRef = useRef<HTMLDivElement | null>(null);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="max-w-2xl w-full my-auto">
        {/* Top Control Bar */}
        <div className="flex justify-between items-center mb-3 no-print">
          <span className="text-white text-sm font-semibold flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            विजेता पोस्टर पूर्वावलोकन (Winner Poster)
          </span>
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold text-xs rounded-lg flex items-center gap-1.5 shadow transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>प्रिन्ट / डाउनलोड पोस्टर</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Poster Canvas */}
        <div
          ref={posterRef}
          className="bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-8 border-4 border-amber-400/80 shadow-2xl relative overflow-hidden"
        >
          {/* Subtle decorative background elements */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-red-600/15 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none"></div>

          {/* Header */}
          <div className="text-center relative z-10 border-b border-amber-400/30 pb-6 mb-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 text-xs font-bold tracking-widest uppercase mb-2">
              <Award className="w-3.5 h-3.5 text-amber-400" />
              स्वतन्त्र विद्यार्थी युनियन (FSU) — दार्चुला बहुमुखी क्याम्पस
            </div>
            <p className="text-xs font-semibold text-slate-300 tracking-wider uppercase mb-1">
              Darchula Multiple Campus, Darchula
            </p>
            <h1 className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-200 tracking-tight mb-2">
              🎉 विजयी विद्यार्थीहरूलाई हार्दिक बधाई! 🎉
            </h1>
            <h2 className="text-lg sm:text-xl font-bold text-slate-200">{record.quizTitle}</h2>
            <p className="text-xs text-amber-300/90 mt-1 font-medium">
              नतिजा प्रकाशन मिति: {formatNepalDate(record.publishedAt, true)}
            </p>
          </div>

          {/* Top 3 Winners Cards */}
          <div className="space-y-4 relative z-10 mb-6">
            {/* 1st Place */}
            {record.first && (
              <div className="bg-gradient-to-r from-amber-500/20 via-amber-400/10 to-amber-500/20 border-2 border-amber-400 rounded-2xl p-4 flex items-center gap-4 relative shadow-lg shadow-amber-500/10">
                <div className="w-14 h-14 rounded-2xl bg-amber-400 text-slate-950 font-black text-2xl flex items-center justify-center shadow-md shrink-0">
                  🥇
                </div>
                <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-amber-300 bg-slate-800 shrink-0">
                  <img
                    src={record.first.profilePhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face'}
                    alt={record.first.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="inline-block px-2 py-0.5 rounded-sm bg-amber-400 text-slate-950 font-extrabold text-[10px] uppercase tracking-wider mb-0.5">
                    प्रथम स्थान (First Place)
                  </div>
                  <h3 className="text-xl font-bold text-white truncate">{record.first.name}</h3>
                  <p className="text-xs text-amber-200">
                    रोल नम्बर: {toNepaliDigits(record.first.rollNo)} | कक्षा: {record.first.class} ({record.first.semester} सेमेस्टर)
                  </p>
                </div>
                <div className="text-right shrink-0 bg-slate-900/60 px-3 py-2 rounded-xl border border-amber-400/30">
                  <div className="text-2xl font-black text-amber-400">
                    {toNepaliDigits(record.first.score)}<span className="text-sm text-slate-400 font-normal">/१०</span>
                  </div>
                  <div className="text-[10px] text-slate-300">
                    {formatDurationSeconds(record.first.timeTakenSeconds)}
                  </div>
                </div>
              </div>
            )}

            {/* 2nd Place */}
            {record.second && (
              <div className="bg-slate-800/60 border border-slate-300/40 rounded-2xl p-3.5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-slate-300 text-slate-950 font-black text-xl flex items-center justify-center shrink-0">
                  🥈
                </div>
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-slate-300 bg-slate-800 shrink-0">
                  <img
                    src={record.second.profilePhoto || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'}
                    alt={record.second.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="inline-block text-slate-300 font-bold text-[10px] tracking-wider mb-0.5">
                    दोस्रो स्थान (Second Place)
                  </div>
                  <h3 className="text-base font-bold text-white truncate">{record.second.name}</h3>
                  <p className="text-xs text-slate-300">
                    रोल: {toNepaliDigits(record.second.rollNo)} | कक्षा: {record.second.class} ({record.second.semester})
                  </p>
                </div>
                <div className="text-right shrink-0 bg-slate-900/40 px-3 py-1.5 rounded-lg border border-slate-700">
                  <div className="text-lg font-bold text-slate-200">
                    {toNepaliDigits(record.second.score)}<span className="text-xs text-slate-400">/१०</span>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {formatDurationSeconds(record.second.timeTakenSeconds)}
                  </div>
                </div>
              </div>
            )}

            {/* 3rd Place */}
            {record.third && (
              <div className="bg-slate-800/40 border border-amber-700/40 rounded-2xl p-3.5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-700 text-white font-black text-xl flex items-center justify-center shrink-0">
                  🥉
                </div>
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-amber-600 bg-slate-800 shrink-0">
                  <img
                    src={record.third.profilePhoto || 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=150&fit=crop&crop=face'}
                    alt={record.third.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="inline-block text-amber-300 font-bold text-[10px] tracking-wider mb-0.5">
                    तेस्रो स्थान (Third Place)
                  </div>
                  <h3 className="text-base font-bold text-white truncate">{record.third.name}</h3>
                  <p className="text-xs text-slate-300">
                    रोल: {toNepaliDigits(record.third.rollNo)} | कक्षा: {record.third.class} ({record.third.semester})
                  </p>
                </div>
                <div className="text-right shrink-0 bg-slate-900/40 px-3 py-1.5 rounded-lg border border-slate-700">
                  <div className="text-lg font-bold text-slate-200">
                    {toNepaliDigits(record.third.score)}<span className="text-xs text-slate-400">/१०</span>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {formatDurationSeconds(record.third.timeTakenSeconds)}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Congratulatory note banner */}
          <div className="bg-gradient-to-r from-amber-500/15 via-red-500/10 to-amber-500/15 border border-amber-400/40 rounded-2xl p-3.5 text-center mb-6 relative z-10">
            <p className="text-amber-200 font-bold text-sm">
              {record.note || 'उत्कृष्ट प्रदर्शन गर्नुहुने सम्पूर्ण मेधावी विद्यार्थीहरूलाई हार्दिक बधाई तथा उज्ज्वल भविष्यको शुभकामना!'}
            </p>
          </div>

          {/* Footer Note */}
          <div className="border-t border-amber-400/20 pt-4 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-400 gap-2">
            <div>
              <p className="font-semibold text-slate-200">स्वतन्त्र विद्यार्थी युनियन (FSU) — दार्चुला बहुमुखी क्याम्पस</p>
              <p className="text-[11px] text-slate-400">Darchula Multiple Campus, Darchula | सम्पर्क: ९७४१८२३१२२</p>
            </div>
            <div className="text-right">
              <p className="text-amber-400 font-semibold">quize.fsudmc.com | fsudmc.com</p>
              <p className="text-[11px] text-slate-400">आधिकारिक क्याम्पस साप्ताहिक मूल्याङ्कन</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
