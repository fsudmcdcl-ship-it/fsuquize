import React, { useRef, useState } from 'react';
import type { QuizSession, Quiz } from '../../types/quiz';
import { toNepaliDigits, formatNepalDate, formatDurationSeconds } from '../../lib/nepaliUtils';
import { Download, Award, Sparkles, Printer, X, Users, Trophy, Loader2 } from 'lucide-react';
import { exportPosterToFile } from '../../lib/posterExport';

interface ParticipantsScorePosterProps {
  quiz: Quiz;
  participants: QuizSession[];
  onClose: () => void;
}

export const ParticipantsScorePoster: React.FC<ParticipantsScorePosterProps> = ({
  quiz,
  participants,
  onClose,
}) => {
  const posterRef = useRef<HTMLDivElement | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<'jpg' | 'png' | null>(null);

  // Sort participants by score descending, then time ascending
  const sorted = [...participants].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.timeTakenSeconds - b.timeTakenSeconds;
  });

  const handleDownload = async (format: 'jpg' | 'png') => {
    if (!posterRef.current || isExporting) return;
    setIsExporting(true);
    setExportFormat(format);

    try {
      const cleanTitle = (quiz.title || 'quiz').replace(/[^a-zA-Z0-9\u0900-\u097F]/g, '_');
      const filename = `FSU_DMC_सहभागी_नतिजा_पोस्टर_${cleanTitle}.${format}`;

      const res = await exportPosterToFile({
        element: posterRef.current,
        filename,
        format,
        backgroundColor: '#050811',
        scale: 2.0,
      });

      if (!res.success) {
        console.error('Participant poster export error:', res.error);
        alert('पोस्टर डाउनलोड गर्दा समस्या आयो: ' + (res.error || 'कृपया पुनः प्रयास गर्नुहोस्।'));
      }
    } catch (err) {
      console.error('Participant poster export error:', err);
      alert('पोस्टर डाउनलोड गर्दा समस्या आयो। कृपया पुनः प्रयास गर्नुहोस्।');
    } finally {
      setIsExporting(false);
      setExportFormat(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="max-w-4xl w-full my-auto">
        {/* Top Control Bar */}
        <div className="flex flex-wrap justify-between items-center mb-3 gap-2 no-print">
          <div className="text-white text-sm font-semibold flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>मास्टर एडमिन: सहभागी विद्यार्थीहरूको नतिजा पोस्टर (JPG/PNG Export)</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              disabled={isExporting}
              onClick={() => handleDownload('jpg')}
              className="px-3.5 py-1.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow transition cursor-pointer disabled:opacity-50"
            >
              {isExporting && exportFormat === 'jpg' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>JPG डाउनलोड</span>
            </button>

            <button
              disabled={isExporting}
              onClick={() => handleDownload('png')}
              className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow transition cursor-pointer disabled:opacity-50"
            >
              {isExporting && exportFormat === 'png' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>PNG डाउनलोड</span>
            </button>

            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl flex items-center gap-1.5 border border-slate-700 transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>प्रिन्ट</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* The Graphic Poster Canvas (Ready for JPG/PNG Capture) */}
        <div
          ref={posterRef}
          className="bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white rounded-3xl p-6 sm:p-8 border-4 border-amber-400/80 shadow-2xl relative overflow-hidden"
        >
          {/* Subtle decorative glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-red-600/15 rounded-full blur-3xl -ml-32 -mb-32 pointer-events-none"></div>

          {/* Header */}
          <div className="text-center relative z-10 border-b border-amber-400/30 pb-5 mb-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-400/15 border border-amber-400/40 text-amber-300 text-xs font-bold tracking-widest uppercase mb-2">
              <Award className="w-3.5 h-3.5 text-amber-400" />
              स्वतन्त्र विद्यार्थी युनियन (FSU) — दार्चुला बहुमुखी क्याम्पस
            </div>
            <p className="text-xs font-semibold text-slate-300 tracking-wider uppercase mb-1">
              Darchula Multiple Campus, Khalanga, Darchula
            </p>
            <h1 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-200 tracking-tight mb-1">
              साप्ताहिक हाजिरी जवाफ — सम्पूर्ण सहभागी नतिजा स्कोरकार्ड
            </h1>
            <h2 className="text-base sm:text-lg font-bold text-slate-200">{quiz.title}</h2>
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-amber-300/90 mt-2 font-medium">
              <span>कुल सहभागी विद्यार्थी: {toNepaliDigits(sorted.length)} जना</span>
              <span>•</span>
              <span>मिति: {formatNepalDate(quiz.endAt || new Date().toISOString(), false)}</span>
              <span>•</span>
              <span>पूर्णाङ्क: १० अङ्क</span>
            </div>
          </div>

          {/* Participants Grid with Photo, Name & Score */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 relative z-10 mb-6 max-h-[60vh] overflow-y-auto pr-1">
            {sorted.map((p, idx) => {
              const rank = idx + 1;
              const isFirst = rank === 1;
              const isSecond = rank === 2;
              const isThird = rank === 3;

              let rankBadge = `${toNepaliDigits(rank)}`;
              let rankStyle = 'bg-slate-800 text-slate-300 border-slate-700';
              if (isFirst) {
                rankBadge = '🥇 १';
                rankStyle = 'bg-amber-400 text-slate-950 font-black border-amber-300';
              } else if (isSecond) {
                rankBadge = '🥈 २';
                rankStyle = 'bg-slate-200 text-slate-950 font-black border-slate-100';
              } else if (isThird) {
                rankBadge = '🥉 ३';
                rankStyle = 'bg-amber-700 text-white font-black border-amber-600';
              }

              return (
                <div
                  key={p.id}
                  className={`p-3.5 rounded-2xl border flex items-center gap-3 transition ${
                    isFirst
                      ? 'bg-gradient-to-r from-amber-500/25 to-amber-400/10 border-amber-400 shadow-md'
                      : isSecond
                      ? 'bg-slate-800/80 border-slate-400/40'
                      : isThird
                      ? 'bg-slate-800/60 border-amber-700/40'
                      : 'bg-slate-900/70 border-slate-800'
                  }`}
                >
                  {/* Rank Badge */}
                  <div
                    className={`w-9 h-9 rounded-xl border flex items-center justify-center text-xs shrink-0 ${rankStyle}`}
                  >
                    {rankBadge}
                  </div>

                  {/* Profile Picture */}
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-slate-700 bg-slate-800 shrink-0 flex items-center justify-center shadow-xs">
                    {p.studentPhoto ? (
                      <img
                        src={p.studentPhoto}
                        alt={p.studentName}
                        crossOrigin="anonymous"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-red-600 to-slate-800 text-white font-bold text-base flex items-center justify-center">
                        {p.studentName ? p.studentName.trim().charAt(0).toUpperCase() : 'S'}
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-white truncate leading-snug">
                      {p.studentName}
                    </h4>
                    <p className="text-[11px] text-slate-300 truncate">
                      रोल: {toNepaliDigits(p.studentRoll)} | {p.studentClass}
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono">
                      समय: {formatDurationSeconds(p.timeTakenSeconds)}
                    </p>
                  </div>

                  {/* Score */}
                  <div className="text-right shrink-0 bg-slate-950/70 px-2.5 py-1.5 rounded-xl border border-slate-800">
                    <div className="text-base font-black text-amber-400">
                      {toNepaliDigits(p.score)}<span className="text-[10px] text-slate-400 font-normal">/१०</span>
                    </div>
                    <span className="text-[9px] text-slate-400 uppercase font-semibold">अङ्क</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer Note */}
          <div className="border-t border-amber-400/20 pt-4 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-400 gap-2 relative z-10">
            <div>
              <p className="font-semibold text-slate-200">स्वतन्त्र विद्यार्थी युनियन (FSU) — दार्चुला बहुमुखी क्याम्पस</p>
              <p className="text-[11px] text-slate-400">Darchula Multiple Campus, Darchula | आधिकारिक मूल्याङ्कन रेकर्ड</p>
            </div>
            <div className="text-right">
              <p className="text-amber-400 font-semibold">quize.fsudmc.com | fsudmc.com</p>
              <p className="text-[11px] text-slate-400">मास्टर एडमिन प्रमाणित नतिजा</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
