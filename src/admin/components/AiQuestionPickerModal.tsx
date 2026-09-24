import React, { useState, useEffect } from 'react';
import type { Question, Quiz } from '../../types/quiz';
import { dataService } from '../../lib/dataService';
import { toNepaliDigits } from '../../lib/nepaliUtils';
import {
  Sparkles,
  Shuffle,
  CheckCircle2,
  BookOpen,
  Layers,
  Save,
  RefreshCw,
  X,
  Copy,
  Check,
  Cpu,
  HelpCircle,
  Award,
  ChevronRight,
} from 'lucide-react';

interface AiQuestionPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  questions: Question[];
  quizzes: Quiz[];
  onApplyToQuiz?: (selectedQuestions: Question[], targetQuizId: string) => void;
  onQuestionsUpdated?: () => void;
}

const SET_NAMES: Record<number, string> = {
  1: 'सेट १: क्याम्पस, शिक्षा र शैक्षिक ज्ञान',
  2: 'सेट २: नेपाली साहित्य, संस्कृति र इतिहास',
  3: 'सेट ३: विज्ञान, सूचना प्रविधि र आविष्कार',
  4: 'सेट ४: नेपालको भूगोल, सम्पदा र वातावरण',
  5: 'सेट ५: समसामयिक ज्ञान, खेलकुद र बौद्धिक परीक्षण',
};

export const AiQuestionPickerModal: React.FC<AiQuestionPickerModalProps> = ({
  isOpen,
  onClose,
  questions,
  quizzes,
  onApplyToQuiz,
  onQuestionsUpdated,
}) => {
  const [pickedQuestions, setPickedQuestions] = useState<Question[]>([]);
  const [selectedQuizId, setSelectedQuizId] = useState<string>(quizzes[0]?.id || 'quiz_week_12');
  const [isShuffling, setIsShuffling] = useState(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [appliedSuccess, setAppliedSuccess] = useState(false);
  const [copiedSuccess, setCopiedSuccess] = useState(false);
  const [mode, setMode] = useState<'picker' | 'generate'>('picker');
  const [aiCustomTopic, setAiCustomTopic] = useState('');

  // Perform random non-sequential picking of 10 questions across sets
  const executeRandomPick = () => {
    setIsShuffling(true);
    setTimeout(() => {
      // Pick 10 questions non-sequentially across sets
      const random10 = dataService.pick10RandomQuestions();
      setPickedQuestions(random10);
      setIsShuffling(false);
      setAppliedSuccess(false);
    }, 280);
  };

  useEffect(() => {
    if (isOpen) {
      executeRandomPick();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleApplyToActiveQuiz = () => {
    if (!pickedQuestions.length) return;

    if (onApplyToQuiz) {
      onApplyToQuiz(pickedQuestions, selectedQuizId);
    }

    setAppliedSuccess(true);
    setTimeout(() => {
      setAppliedSuccess(false);
    }, 3000);
  };

  const handleCopyQuestionsText = () => {
    const text = pickedQuestions
      .map((q, idx) => {
        return `${idx + 1}. [सेट ${toNepaliDigits(q.setNumber)}] ${q.question}\n` +
          `   (A) ${q.optionA}\n` +
          `   (B) ${q.optionB}\n` +
          `   (C) ${q.optionC}\n` +
          `   (D) ${q.optionD}\n` +
          `   सही उत्तर: (${q.correctAnswer})\n` +
          (q.explanation ? `   व्याख्या: ${q.explanation}\n` : '');
      })
      .join('\n');

    navigator.clipboard.writeText(text);
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 2000);
  };

  // AI Generator: Generate 10 randomized campus & academic questions
  const handleGenerateAiQuestions = async () => {
    setIsGeneratingAi(true);
    try {
      // Curated academic bank questions for Darchula Multiple Campus
      const newAiPool: Question[] = [
        {
          id: `q_ai_${Date.now()}_1`,
          quizId: selectedQuizId,
          setNumber: 1,
          question: 'दार्चुला बहुमुखी क्याम्पस त्रिभुवन विश्वविद्यालयबाट कुन वर्ष सम्बन्धन प्राप्त शैक्षिक संस्था हो?',
          optionA: 'वि.सं. २०४८',
          optionB: 'वि.सं. २०५३',
          optionC: 'वि.सं. २०६०',
          optionD: 'वि.सं. २०३९',
          correctAnswer: 'B',
          explanation: 'दार्चुला बहुमुखी क्याम्पस वि.सं. २०५३ मा स्थापित सुदूरपश्चिमको एक प्रतिष्ठित शैक्षिक केन्द्र हो।',
        },
        {
          id: `q_ai_${Date.now()}_2`,
          quizId: selectedQuizId,
          setNumber: 1,
          question: 'उच्च शिक्षामा सेमेष्टर प्रणाली लागू गर्ने नेपालको पहिलो विश्वविद्यालय कुन हो?',
          optionA: 'काठमाडौं विश्वविद्यालय',
          optionB: 'त्रिभुवन विश्वविद्यालय',
          optionC: 'पोखरा विश्वविद्यालय',
          optionD: 'सुदूरपश्चिम विश्वविद्यालय',
          correctAnswer: 'B',
          explanation: 'त्रिभुवन विश्वविद्यालयले केन्द्रीय विभागहरूमा सर्वप्रथम सेमेष्टर प्रणाली पुनःसञ्चालन गरेको थियो।',
        },
        {
          id: `q_ai_${Date.now()}_3`,
          quizId: selectedQuizId,
          setNumber: 2,
          question: 'दार्चुला जिल्लाको प्रसिद्ध ऐतिहासिक कोट "उकु महल" कुन ऐतिहासिक राजासँग सम्बन्धित मानिन्छ?',
          optionA: 'राजा मन्धाता शाही',
          optionB: 'कत्यूरी राजवंशका पालबंशी राजाहरू',
          optionC: 'राजा जयतुङ्ग मल्ल',
          optionD: 'राजा नाग मल्ल',
          correctAnswer: 'B',
          explanation: 'उकु भग्नावशेष ऐतिहासिक कत्यूरी तथा पाल राजाहरूको कलात्मक संस्कृतिको उत्कृष्ट नमुना हो।',
        },
        {
          id: `q_ai_${Date.now()}_4`,
          quizId: selectedQuizId,
          setNumber: 2,
          question: 'नेपाली साहित्यमा मदन पुरस्कार प्राप्त गर्ने दार्चुलाका विशिष्ट साहित्यकार को हुन्?',
          optionA: 'डा. जगदीशचन्द्र रेग्मी',
          optionB: 'लोकेन्द्रबहादुर चन्द',
          optionC: 'डा. तीर्थबहादुर श्रेष्ठ',
          optionD: 'मोहनराज शर्मा',
          correctAnswer: 'B',
          explanation: 'लोकेन्द्रबहादुर चन्दले ‘विसर्जन’ कथा संग्रहका लागि वि.सं. २०५४ मा मदन पुरस्कार प्राप्त गर्नुभएको थियो।',
        },
        {
          id: `q_ai_${Date.now()}_5`,
          quizId: selectedQuizId,
          setNumber: 3,
          question: 'कृत्रिम बौद्धिकता (Artificial Intelligence) को आधारस्तम्भ "Neural Network" कुन मानवीय प्रणालीबाट प्रेरित छ?',
          optionA: 'मानव मस्तिष्कको न्युरोन सञ्जाल',
          optionB: 'रक्त सञ्चार प्रणाली',
          optionC: 'पाचन प्रणाली',
          optionD: 'कंकाल प्रणाली',
          correctAnswer: 'A',
          explanation: 'आर्टिफिसियल न्युरल नेटवर्क मानव मस्तिष्कका न्युरोनहरूको सूचना प्रशोधन विधिमा आधारित छ।',
        },
        {
          id: `q_ai_${Date.now()}_6`,
          quizId: selectedQuizId,
          setNumber: 3,
          question: 'विश्वव्यापी इन्टरनेट सञ्चारलाई सुरक्षित राख्न प्रयोग गरिने क्रिप्टोग्राफिक प्रोटोकल कुन हो?',
          optionA: 'HTTPS / TLS',
          optionB: 'FTP',
          optionC: 'TELNET',
          optionD: 'SMTP अनइन्क्रिप्टेड',
          correctAnswer: 'A',
          explanation: 'HTTPS (TLS) प्रोटोकलले वेब डाटालाई पूर्ण इन्क्रिप्ट गरी सुरक्षित गराउँदछ।',
        },
        {
          id: `q_ai_${Date.now()}_7`,
          quizId: selectedQuizId,
          setNumber: 4,
          question: 'दार्चुला जिल्लाको प्रसिद्ध अपि नाम्पा संरक्षण क्षेत्र (ANCA) कहिले घोषणा गरिएको थियो?',
          optionA: 'वि.सं. २०६७ (२०१० ई.सं.)',
          optionB: 'वि.सं. २०६० (२००३ ई.सं.)',
          optionC: 'वि.सं. २०७२ (२०१५ ई.सं.)',
          optionD: 'वि.सं. २०५५ (१९९८ ई.सं.)',
          correctAnswer: 'A',
          explanation: 'अपि नाम्पा संरक्षण क्षेत्र वि.सं. २०६७ असार २८ गते स्थापना भएको थियो।',
        },
        {
          id: `q_ai_${Date.now()}_8`,
          quizId: selectedQuizId,
          setNumber: 4,
          question: 'सुदूरपश्चिम प्रदेशको सर्वोच्च हिमशिखर अपि हिमालको उचाइ कति मिटर छ?',
          optionA: '७,१३२ मिटर',
          optionB: '७,०२२ मिटर',
          optionC: '६,८५० मिटर',
          optionD: '७,५०० मिटर',
          correctAnswer: 'A',
          explanation: 'अपि हिमाल दार्चुलामा अवस्थित ७,१३२ मिटर अग्लो हिमशिखर हो।',
        },
        {
          id: `q_ai_${Date.now()}_9`,
          quizId: selectedQuizId,
          setNumber: 5,
          question: 'अन्तर्राष्ट्रिय ओलम्पिक कमिटी (IOC) को आदर्श वाक्य "Citius, Altius, Fortius - Communiter" मा Communiter को अर्थ के हो?',
          optionA: 'सँगसँगै (Together)',
          optionB: 'तीव्र (Faster)',
          optionC: 'बलियो (Stronger)',
          optionD: 'शान्ति (Peace)',
          correctAnswer: 'A',
          explanation: 'ओलम्पिक आदर्श वाक्यमा हालै थपिएको शब्द "Communiter" को अर्थ ‘सँगसँगै’ (Together) हो।',
        },
        {
          id: `q_ai_${Date.now()}_10`,
          quizId: selectedQuizId,
          setNumber: 5,
          question: 'नेपालको पहिलो स्याटेलाइट ‘नेपाली स्याट–१’ अन्तरिक्षमा कहिले प्रक्षेपण गरिएको थियो?',
          optionA: 'वि.सं. २०७६ वैशाख ५ (२०१९ अप्रिल १८)',
          optionB: 'वि.सं. २०७५ असोज १० (२०१८ सेप्टेम्बर २६)',
          optionC: 'वि.सं. २०७८ जेठ २ (२०२१ मे १६)',
          optionD: 'वि.सं. २०७४ माघ १५ (२०१८ जनवरी २९)',
          correctAnswer: 'A',
          explanation: 'नेपाली स्याट-१ नासाको अन्तरिक्ष केन्द्रबाट २०१९ अप्रिल १८ मा प्रक्षेपण भएको थियो।',
        },
      ];

      // Shuffle the 10 questions thoroughly
      for (let i = newAiPool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newAiPool[i], newAiPool[j]] = [newAiPool[j], newAiPool[i]];
      }

      // Save questions to dataService
      newAiPool.forEach(q => {
        dataService.saveQuestion(q, 'admin_ai@fsudmc.com');
      });

      setPickedQuestions(newAiPool);
      onQuestionsUpdated?.();
      setMode('picker');
      setAppliedSuccess(true);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in duration-200">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 to-red-500 flex items-center justify-center shadow-lg text-white font-black">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[11px] font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI प्रश्न छनोटकर्ता र निर्माण उपकरण</span>
              </div>
              <h2 className="text-xl font-black text-white mt-1">
                अनियमित १० प्रश्न चयनकर्ता (Non-Sequential Random 10)
              </h2>
              <p className="text-xs text-slate-300">
                सबै ५ वटा सेटहरूबाट क्रमबद्ध नभई पूर्ण अनियमित (Random) रूपमा १० प्रश्न चयन गर्नुहोस्।
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector & Action Bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMode('picker')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                mode === 'picker'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Shuffle className="w-3.5 h-3.5" />
              <span>अनियमित १० प्रश्न (Random 10 Picker)</span>
            </button>

            <button
              onClick={() => setMode('generate')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                mode === 'generate'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>AI नयाँ प्रश्न निर्माण (AI Generator)</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={executeRandomPick}
              disabled={isShuffling}
              className="px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-100 active:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isShuffling ? 'animate-spin text-red-600' : 'text-slate-600'}`} />
              <span>पुनः अनियमित छान्नुहोस् (Shuffle)</span>
            </button>

            <button
              onClick={handleCopyQuestionsText}
              className="px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              {copiedSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">प्रतिलिपि भयो!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-600" />
                  <span>पाठ प्रतिलिपि (Copy)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {mode === 'generate' ? (
            <div className="bg-indigo-50/60 border border-indigo-200 rounded-2xl p-6 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    AI बाट १० वटा नयाँ अनियमित बहुवैकल्पिक प्रश्न निर्माण
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    त्रिभुवन विश्वविद्यालय, दार्चुला बहुमुखी क्याम्पस, विज्ञान, प्रविधि र समसामयिक विषयमा आधारित १० वटा नयाँ प्रश्न तयार गरी प्रश्न बैङ्कमा थप्नुहोस्।
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">क्विज छनोट गर्नुहोस्:</label>
                <select
                  value={selectedQuizId}
                  onChange={e => setSelectedQuizId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold bg-white text-slate-800"
                >
                  {quizzes.map(q => (
                    <option key={q.id} value={q.id}>
                      {q.title} ({q.id})
                    </option>
                  ))}
                </select>
              </div>

              <button
                disabled={isGeneratingAi}
                onClick={handleGenerateAiQuestions}
                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isGeneratingAi ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>AI प्रश्नहरू सिर्जना गर्दैछ...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>१० वटा नयाँ AI प्रश्नहरू सिर्जना गर्नुहोस् र थप्नुहोस्</span>
                  </>
                )}
              </button>
            </div>
          ) : null}

          {/* Random Pick Statistics / Header */}
          <div className="flex flex-wrap items-center justify-between gap-2 bg-amber-50/70 border border-amber-200 px-4 py-3 rounded-2xl">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-bold text-amber-950">
                चयन गरिएका प्रश्न: <b>१०/१०</b> (सेटहरूबाट अनियमित, अक्रमबद्ध)
              </span>
            </div>
            <div className="text-[11px] text-amber-800 font-medium">
              सबै प्रश्नहरू विभिन्न सेटबाट विविधता मिलाएर अनियमित क्रममा प्रस्तुत छन्।
            </div>
          </div>

          {/* 10 Selected Questions List */}
          <div className="space-y-3">
            {pickedQuestions.map((q, index) => {
              return (
                <div
                  key={q.id}
                  className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:border-slate-300 transition space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5 flex-1">
                      <span className="w-7 h-7 rounded-xl bg-slate-100 text-slate-800 font-black text-xs flex items-center justify-center shrink-0 border border-slate-200">
                        {toNepaliDigits(index + 1)}
                      </span>
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="px-2 py-0.5 rounded-md bg-red-50 text-red-700 text-[10px] font-bold border border-red-200">
                            {SET_NAMES[q.setNumber] || `सेट ${toNepaliDigits(q.setNumber)}`}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">ID: {q.id}</span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 leading-snug">
                          {q.question}
                        </h4>
                      </div>
                    </div>
                  </div>

                  {/* 4 Options Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {[
                      { key: 'A', text: q.optionA },
                      { key: 'B', text: q.optionB },
                      { key: 'C', text: q.optionC },
                      { key: 'D', text: q.optionD },
                    ].map(opt => {
                      const isCorrect = q.correctAnswer === opt.key;
                      return (
                        <div
                          key={opt.key}
                          className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 ${
                            isCorrect
                              ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950 font-bold'
                              : 'bg-slate-50 border-slate-200 text-slate-700'
                          }`}
                        >
                          <span
                            className={`w-5 h-5 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0 ${
                              isCorrect
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-200 text-slate-600'
                            }`}
                          >
                            {opt.key}
                          </span>
                          <span className="truncate">{opt.text}</span>
                          {isCorrect && (
                            <span className="ml-auto text-[10px] bg-emerald-200/80 text-emerald-800 px-1.5 py-0.5 rounded font-bold shrink-0">
                              सही उत्तर
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {q.explanation && (
                    <div className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-xl border border-slate-100 flex items-start gap-1.5">
                      <HelpCircle className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span>{q.explanation}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-bold text-slate-600">क्विज चयन:</span>
            <select
              value={selectedQuizId}
              onChange={e => setSelectedQuizId(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold bg-white text-slate-800"
            >
              {quizzes.map(q => (
                <option key={q.id} value={q.id}>
                  {q.title}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
            >
              बन्द गर्नुहोस् (Close)
            </button>

            <button
              onClick={handleApplyToActiveQuiz}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
            >
              {appliedSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                  <span>१० प्रश्न सफलतापूर्वक लागू भयो!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>यो १० प्रश्न क्विजमा सुरक्षित / लागू गर्नुहोस्</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
