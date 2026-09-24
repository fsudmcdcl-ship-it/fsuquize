import React, { useState } from 'react';
import type { Quiz, Question } from '../types/quiz';
import { dataService } from '../lib/dataService';
import { toNepaliDigits } from '../lib/nepaliUtils';
import { Dices, Sparkles, RefreshCw, CheckCircle2, ArrowRight, X, Clock, HelpCircle, Shuffle } from 'lucide-react';

interface StudentQuestionPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  quiz: Quiz;
  onStartQuiz: (selectedQuestionIds: string[]) => void;
}

export const StudentQuestionPickerModal: React.FC<StudentQuestionPickerModalProps> = ({
  isOpen,
  onClose,
  quiz,
  onStartQuiz,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [pickedQuestions, setPickedQuestions] = useState<Question[]>([]);
  const [hasPicked, setHasPicked] = useState(false);
  const [generationCount, setGenerationCount] = useState(0);

  if (!isOpen) return null;

  const handlePickRandomQuestions = () => {
    setIsGenerating(true);
    setPickedQuestions([]);

    // Fun animated effect to demonstrate drawing 10 questions from the 50-question bank
    setTimeout(() => {
      const generated = dataService.pickRandom10From50(quiz.id);
      setPickedQuestions(generated);
      setIsGenerating(false);
      setHasPicked(true);
      setGenerationCount(prev => prev + 1);
    }, 900);
  };

  const handleConfirmAndStart = () => {
    if (pickedQuestions.length !== 10) return;
    const ids = pickedQuestions.map(q => q.id);
    onStartQuiz(ids);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-red-600 to-rose-500 text-white flex items-center justify-center shadow-md shadow-red-500/20">
              <Dices className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
                  अनियमित प्रश्न प्रणाली
                </span>
                <span className="text-[11px] font-bold text-slate-500">
                  ५० प्रश्न बैङ्कबाट
                </span>
              </div>
              <h3 className="text-xl font-black text-slate-900 mt-0.5">
                मेरो लागि प्रश्न छान्नुहोस् (Pick Questions for Me)
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="py-5 overflow-y-auto space-y-5 flex-1 pr-1">
          {/* Explanation Banner */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-5 rounded-2xl shadow-sm relative overflow-hidden">
            <div className="absolute right-0 top-0 w-32 h-32 bg-red-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-black text-white">
                  विद्यार्थीपिच्छे १० फरक अनियमित प्रश्नहरू
                </h4>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  कुनै निश्चित सेट (Set 1 वा Set 2 आदि) मा सीमित नभई, ५० वटा सम्पूर्ण प्रश्नहरूको बैङ्कबाट तपाईंका लागि <b>१० वटा फरक प्रश्नहरू</b> अनियमित रूपमा छानिन्छन्।
                </p>
              </div>
            </div>
          </div>

          {/* Interactive Picker Trigger Area */}
          {!hasPicked && !isGenerating && (
            <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-3xl p-8 text-center space-y-4">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                <Shuffle className="w-8 h-8 text-red-600" />
              </div>
              <div>
                <h4 className="text-base font-black text-slate-900">
                  तपाईंको लागि १० प्रश्नहरू तयार छैनन्
                </h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                  तलको बटन थिचेर ५० प्रश्नहरूको बैङ्कबाट आफ्ना लागि विशेष १० वटा अनियमित प्रश्नहरू चयन गर्नुहोस्।
                </p>
              </div>

              <button
                type="button"
                onClick={handlePickRandomQuestions}
                className="px-8 py-3.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-black text-sm rounded-2xl shadow-lg shadow-red-600/30 transition transform hover:-translate-y-0.5 flex items-center justify-center gap-2.5 mx-auto cursor-pointer"
              >
                <Dices className="w-5 h-5" />
                <span>🎲 मेरो लागि प्रश्न छान्नुहोस् (Generate Questions for Me)</span>
              </button>
            </div>
          )}

          {/* Shuffling Loading State */}
          {isGenerating && (
            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-10 text-center space-y-4">
              <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <div>
                <h4 className="text-base font-black text-slate-900">
                  ५० प्रश्नहरूबाट १० वटा अनियमित प्रश्नहरू संकलन हुँदैछ...
                </h4>
                <p className="text-xs text-slate-500 mt-1 font-mono">
                  [अनियमित छनोट प्रगतिमा... Set 1-5 को मिश्रण]
                </p>
              </div>
            </div>
          )}

          {/* Picked Questions Preview */}
          {hasPicked && !isGenerating && pickedQuestions.length === 10 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 px-4 py-3 rounded-2xl">
                <div className="flex items-center gap-2 text-emerald-800 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>१० वटा प्रश्न सफलतापूर्वक छानिइसक्यो! (प्रयास #{toNepaliDigits(generationCount)})</span>
                </div>
                <button
                  type="button"
                  onClick={handlePickRandomQuestions}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-900 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>फेरि छान्नुहोस्</span>
                </button>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {pickedQuestions.map((q, idx) => (
                  <div
                    key={q.id}
                    className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between gap-3 text-left"
                  >
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0">
                        {toNepaliDigits(idx + 1)}
                      </span>
                      <p className="text-xs font-medium text-slate-800 truncate">
                        {q.question}
                      </p>
                    </div>

                    <span className="shrink-0 text-[11px] font-bold px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-100">
                      सेट {toNepaliDigits(q.setNumber)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  <b>सूचना:</b> 'क्विज सुरु गर्नुहोस्' थिचेपछि तत्काल १० मिनेटको समयसीमा सुरु हुनेछ।
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition cursor-pointer"
          >
            बन्द गर्नुहोस्
          </button>

          <div className="flex items-center gap-2">
            {hasPicked && (
              <button
                type="button"
                onClick={handlePickRandomQuestions}
                disabled={isGenerating}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
                <span>पुनः छान्नुहोस्</span>
              </button>
            )}

            <button
              type="button"
              onClick={hasPicked ? handleConfirmAndStart : handlePickRandomQuestions}
              disabled={isGenerating}
              className="px-6 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 disabled:opacity-50 text-white font-black text-xs rounded-xl shadow-md shadow-red-600/20 transition flex items-center gap-2 cursor-pointer"
            >
              {hasPicked ? (
                <>
                  <span>🚀 अब क्विज सुरु गर्नुहोस्</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  <Dices className="w-4 h-4" />
                  <span>🎲 प्रश्न छान्नुहोस् (Pick Questions)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
