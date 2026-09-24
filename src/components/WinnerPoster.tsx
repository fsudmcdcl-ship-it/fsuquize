import React, { useRef, useState } from 'react';
import type { WinnerRecord } from '../types/quiz';
import { toNepaliDigits, formatNepalDate, formatDurationSeconds } from '../lib/nepaliUtils';
import { Download, Award, Sparkles, Printer, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { exportPosterToFile } from '../lib/posterExport';

interface WinnerPosterProps {
  record: WinnerRecord;
  onClose: () => void;
}

export const WinnerPoster: React.FC<WinnerPosterProps> = ({ record, onClose }) => {
  const posterRef = useRef<HTMLDivElement | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<'jpg' | 'png' | null>(null);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadImage = async (format: 'jpg' | 'png') => {
    if (!posterRef.current || isExporting) return;
    setIsExporting(true);
    setExportFormat(format);

    try {
      const cleanQuizTitle = (record.quizTitle || 'weekly_quiz').replace(/[^a-zA-Z0-9\u0900-\u097F]/g, '_');
      const filename = `FSU_DMC_विजेता_पोस्टर_${cleanQuizTitle}_1st_2nd_3rd.${format}`;

      const res = await exportPosterToFile({
        element: posterRef.current,
        filename,
        format,
        backgroundColor: '#090d16',
        scale: 2.2,
      });

      if (!res.success) {
        console.error('Poster export returned error:', res.error);
        alert('पोस्टर डाउनलोड गर्दा समस्या आयो: ' + (res.error || 'पुन: प्रयास गर्नुहोस्।'));
      }
    } catch (err) {
      console.error('Poster export failed:', err);
      alert('पोस्टर डाउनलोड गर्दा समस्या आयो। कृपया पुन: प्रयास गर्नुहोस्।');
    } finally {
      setIsExporting(false);
      setExportFormat(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="max-w-2xl w-full my-auto">
        {/* Top Control Bar */}
        <div className="flex flex-wrap justify-between items-center mb-3 gap-2 no-print">
          <span className="text-white text-sm font-semibold flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>विजेता पोस्टर (१st, २nd & ३rd स्थान)</span>
          </span>

          <div className="flex flex-wrap items-center gap-2">
            {/* JPG Download Button */}
            <button
              disabled={isExporting}
              onClick={() => handleDownloadImage('jpg')}
              className="px-3 py-1.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow transition cursor-pointer disabled:opacity-50"
            >
              {isExporting && exportFormat === 'jpg' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>JPG डाउनलोड</span>
            </button>

            {/* PNG Download Button */}
            <button
              disabled={isExporting}
              onClick={() => handleDownloadImage('png')}
              className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow transition cursor-pointer disabled:opacity-50"
            >
              {isExporting && exportFormat === 'png' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>PNG डाउनलोड</span>
            </button>

            {/* Print Button */}
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl flex items-center gap-1.5 border border-slate-700 transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>प्रिन्ट</span>
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition cursor-pointer"
              title="बन्द गर्नुहोस्"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Poster Canvas */}
        <div
          ref={posterRef}
          className="bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white rounded-3xl p-6 sm:p-8 border-4 border-amber-400 shadow-2xl relative overflow-hidden"
        >
          {/* Subtle decorative background elements */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/15 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-red-600/20 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none"></div>

          {/* Header */}
          <div className="text-center relative z-10 border-b border-amber-400/40 pb-5 mb-5">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-400/15 border border-amber-400/40 text-amber-300 text-xs font-bold tracking-widest uppercase mb-2">
              <Award className="w-3.5 h-3.5 text-amber-400" />
              स्वतन्त्र विद्यार्थी युनियन (FSU) — दार्चुला बहुमुखी क्याम्पस
            </div>
            <p className="text-xs font-semibold text-slate-300 tracking-wider uppercase mb-1">
              Darchula Multiple Campus, Khalanga, Darchula
            </p>
            <h1 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-200 tracking-tight mb-1.5">
              🎉 विजयी विद्यार्थीहरूलाई हार्दिक बधाई! 🎉
            </h1>
            <h2 className="text-base sm:text-lg font-bold text-slate-200">{record.quizTitle}</h2>
            <p className="text-xs text-amber-300/90 mt-1 font-medium">
              नतिजा घोषणा मिति: {formatNepalDate(record.publishedAt, true)}
            </p>
          </div>

          {/* Top 3 Winners Cards (1st, 2nd, 3rd Position) */}
          <div className="space-y-3.5 relative z-10 mb-5">
            {/* 1st Place */}
            {record.first && (
              <div className="bg-gradient-to-r from-amber-500/25 via-amber-400/15 to-amber-500/25 border-2 border-amber-400 rounded-2xl p-4 flex items-center gap-4 relative shadow-lg shadow-amber-500/15">
                <div className="w-14 h-14 rounded-2xl bg-amber-400 text-slate-950 font-black text-2xl flex items-center justify-center shadow-md shrink-0">
                  🥇
                </div>
                <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-amber-300 bg-slate-800 shrink-0 flex items-center justify-center">
                  {record.first.profilePhoto ? (
                    <img
                      src={record.first.profilePhoto}
                      alt={record.first.name}
                      crossOrigin="anonymous"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-amber-500 text-slate-950 font-black text-xl flex items-center justify-center">
                      {record.first.name ? record.first.name.trim().charAt(0).toUpperCase() : '१'}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="inline-block px-2 py-0.5 rounded-sm bg-amber-400 text-slate-950 font-extrabold text-[10px] uppercase tracking-wider mb-0.5">
                    प्रथम स्थान (First Place — 1st)
                  </div>
                  <h3 className="text-lg sm:text-xl font-black text-white truncate">{record.first.name}</h3>
                  <p className="text-xs text-amber-200">
                    रोल: {toNepaliDigits(record.first.rollNo)} | कक्षा: {record.first.class} ({record.first.semester} सेमेस्टर)
                  </p>
                </div>
                <div className="text-right shrink-0 bg-slate-900/80 px-3.5 py-2 rounded-xl border border-amber-400/40">
                  <div className="text-2xl font-black text-amber-400">
                    {toNepaliDigits(record.first.score)}<span className="text-sm text-slate-400 font-normal">/१०</span>
                  </div>
                  <div className="text-[10px] text-slate-300 font-mono">
                    {formatDurationSeconds(record.first.timeTakenSeconds)}
                  </div>
                </div>
              </div>
            )}

            {/* 2nd Place */}
            {record.second && (
              <div className="bg-slate-800/70 border border-slate-300/50 rounded-2xl p-3.5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-slate-200 text-slate-950 font-black text-xl flex items-center justify-center shrink-0">
                  🥈
                </div>
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-slate-300 bg-slate-800 shrink-0 flex items-center justify-center">
                  {record.second.profilePhoto ? (
                    <img
                      src={record.second.profilePhoto}
                      alt={record.second.name}
                      crossOrigin="anonymous"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-300 text-slate-950 font-black text-lg flex items-center justify-center">
                      {record.second.name ? record.second.name.trim().charAt(0).toUpperCase() : '२'}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="inline-block text-slate-300 font-bold text-[10px] tracking-wider mb-0.5">
                    दोस्रो स्थान (Second Place — 2nd)
                  </div>
                  <h3 className="text-base font-bold text-white truncate">{record.second.name}</h3>
                  <p className="text-xs text-slate-300">
                    रोल: {toNepaliDigits(record.second.rollNo)} | कक्षा: {record.second.class} ({record.second.semester})
                  </p>
                </div>
                <div className="text-right shrink-0 bg-slate-900/60 px-3 py-1.5 rounded-lg border border-slate-700">
                  <div className="text-lg font-bold text-slate-200">
                    {toNepaliDigits(record.second.score)}<span className="text-xs text-slate-400">/१०</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    {formatDurationSeconds(record.second.timeTakenSeconds)}
                  </div>
                </div>
              </div>
            )}

            {/* 3rd Place */}
            {record.third && (
              <div className="bg-slate-800/50 border border-amber-700/50 rounded-2xl p-3.5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-700 text-white font-black text-xl flex items-center justify-center shrink-0">
                  🥉
                </div>
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-amber-600 bg-slate-800 shrink-0 flex items-center justify-center">
                  {record.third.profilePhoto ? (
                    <img
                      src={record.third.profilePhoto}
                      alt={record.third.name}
                      crossOrigin="anonymous"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-amber-700 text-white font-black text-lg flex items-center justify-center">
                      {record.third.name ? record.third.name.trim().charAt(0).toUpperCase() : '३'}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="inline-block text-amber-300 font-bold text-[10px] tracking-wider mb-0.5">
                    तेस्रो स्थान (Third Place — 3rd)
                  </div>
                  <h3 className="text-base font-bold text-white truncate">{record.third.name}</h3>
                  <p className="text-xs text-slate-300">
                    रोल: {toNepaliDigits(record.third.rollNo)} | कक्षा: {record.third.class} ({record.third.semester})
                  </p>
                </div>
                <div className="text-right shrink-0 bg-slate-900/60 px-3 py-1.5 rounded-lg border border-slate-700">
                  <div className="text-lg font-bold text-slate-200">
                    {toNepaliDigits(record.third.score)}<span className="text-xs text-slate-400">/१०</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    {formatDurationSeconds(record.third.timeTakenSeconds)}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Congratulatory note banner */}
          <div className="bg-gradient-to-r from-amber-500/20 via-red-500/15 to-amber-500/20 border border-amber-400/40 rounded-2xl p-3 text-center mb-5 relative z-10">
            <p className="text-amber-200 font-bold text-xs sm:text-sm">
              {record.note || 'उत्कृष्ट प्रदर्शन गर्नुहुने सम्पूर्ण मेधावी विद्यार्थीहरूलाई हार्दिक बधाई तथा उज्ज्वल भविष्यको शुभकामना!'}
            </p>
          </div>

          {/* Footer Note with Official Seal */}
          <div className="border-t border-amber-400/20 pt-4 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-400 gap-2 relative z-10">
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
