import React, { useState } from 'react';
import type { Question, QuestionOption, Quiz } from '../types/quiz';
import { toNepaliDigits } from '../lib/nepaliUtils';
import { dataService } from '../lib/dataService';
import { Plus, Edit2, Trash2, CheckCircle2, AlertCircle, Check, X, BookOpen, Layers, Sparkles, Upload, FileSpreadsheet, Globe } from 'lucide-react';
import { AiQuestionPickerModal } from './components/AiQuestionPickerModal';
import { UploadPastQuestionsModal } from './components/UploadPastQuestionsModal';

interface AdminQuestionsProps {
  questions: Question[];
  onRefresh: () => void;
}

const SET_NAMES: Record<number, string> = {
  1: 'क्याम्पस, शिक्षा र शैक्षिक ज्ञान',
  2: 'नेपाली साहित्य, संस्कृति र इतिहास',
  3: 'विज्ञान, सूचना प्रविधि र आधुनिक आविष्कार',
  4: 'नेपालको भूगोल, सम्पदा र वातावरण',
  5: 'समसामयिक ज्ञान, खेलकुद र बौद्धिक परीक्षण',
};

export const AdminQuestions: React.FC<AdminQuestionsProps> = ({ questions, onRefresh }) => {
  const allQuizzes = dataService.getQuizzes();
  const activeQuiz = dataService.getActiveQuiz();

  const [selectedQuizId, setSelectedQuizId] = useState<string>(() => activeQuiz?.id || allQuizzes[0]?.id || 'quiz_week_12');
  const [selectedSet, setSelectedSet] = useState<number>(1);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const currentQuiz = allQuizzes.find(q => q.id === selectedQuizId) || activeQuiz || allQuizzes[0];
  const currentQuizQuestions = questions.filter(q => (q.quizId || 'quiz_week_12') === selectedQuizId);

  // Form State
  const [formQuestion, setFormQuestion] = useState('');
  const [formOptA, setFormOptA] = useState('');
  const [formOptB, setFormOptB] = useState('');
  const [formOptC, setFormOptC] = useState('');
  const [formOptD, setFormOptD] = useState('');
  const [formCorrect, setFormCorrect] = useState<QuestionOption>('A');
  const [formExplanation, setFormExplanation] = useState('');
  const [formSet, setFormSet] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [formError, setFormError] = useState('');

  // Group questions by set for this quiz
  const setCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  currentQuizQuestions.forEach(q => {
    const s = q.setNumber || 1;
    setCounts[s] = (setCounts[s] || 0) + 1;
  });

  const currentSetQuestions = currentQuizQuestions.filter(q => (q.setNumber || 1) === selectedSet);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleOpenAdd = () => {
    setEditingQuestion(null);
    setFormQuestion('');
    setFormOptA('');
    setFormOptB('');
    setFormOptC('');
    setFormOptD('');
    setFormCorrect('A');
    setFormExplanation('');
    setFormSet(selectedSet as any);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (q: Question) => {
    setEditingQuestion(q);
    setFormQuestion(q.question);
    setFormOptA(q.optionA);
    setFormOptB(q.optionB);
    setFormOptC(q.optionC);
    setFormOptD(q.optionD);
    setFormCorrect(q.correctAnswer);
    setFormExplanation(q.explanation || '');
    setFormSet(q.setNumber as any);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSaveQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formQuestion.trim() || !formOptA.trim() || !formOptB.trim() || !formOptC.trim() || !formOptD.trim()) {
      setFormError('कृपया प्रश्न र चारै वटा विकल्पहरू अनिवार्य रूपमा भर्नुहोस्।');
      return;
    }

    const newQ: Question = {
      id: editingQuestion ? editingQuestion.id : `q_custom_${Date.now()}`,
      quizId: selectedQuizId,
      setNumber: formSet,
      question: formQuestion.trim(),
      optionA: formOptA.trim(),
      optionB: formOptB.trim(),
      optionC: formOptC.trim(),
      optionD: formOptD.trim(),
      correctAnswer: formCorrect,
      explanation: formExplanation.trim() || undefined,
    };

    dataService.saveQuestion(newQ, 'admin@fsudmc.com');
    setIsModalOpen(false);
    onRefresh();
    showToast('प्रश्न सफलतापूर्वक सुरक्षित गरियो।');
  };

  const handleDelete = (id: string) => {
    if (confirm('के तपाईं यो प्रश्न हटाउन निश्चित हुनुहुन्छ?')) {
      dataService.deleteQuestion(id, 'admin@fsudmc.com');
      onRefresh();
      showToast('प्रश्न हटाइयो।');
    }
  };

  const handleToggleFrontend = () => {
    if (!currentQuiz) return;
    const nextState = !currentQuiz.showInFrontend;
    dataService.toggleQuizPastVisibility(currentQuiz.id, nextState, 'admin@fsudmc.com');
    onRefresh();
    showToast(
      nextState
        ? `क्विज '${currentQuiz.title}' का प्रश्नहरू पोर्टलको 'विगतका प्रश्नहरू' खण्डमा सार्वजनिक गरियो!`
        : `क्विज '${currentQuiz.title}' का प्रश्नहरू पोर्टलबाट हटाइयो।`
    );
  };

  const totalBankQuestions = currentQuizQuestions.length;
  const isCompleteBank = totalBankQuestions >= 50;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 text-xs font-bold flex items-center gap-2 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
            ५० प्रश्न बैङ्क तथा विगतका प्रश्न व्यवस्थापन
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            ५ वटा शैक्षिक सेटमा विभक्त ५० प्रश्नहरू (विद्यार्थीलाई प्रत्येक सेटबाट २ प्रश्न = १० प्रश्न) वा विगतका सेटहरू
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {/* Bulk Upload Past Questions Button */}
          <button
            type="button"
            onClick={() => setIsUploadModalOpen(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5 cursor-pointer"
          >
            <Upload className="w-4 h-4 text-emerald-200" />
            <span>📤 विगतका प्रश्नहरू बल्क अपलोड</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAiModalOpen(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-700 hover:to-purple-800 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>🤖 AI १० अनियमित प्रश्न छनोटकर्ता</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>नयाँ प्रश्न थप्नुहोस्</span>
          </button>
        </div>
      </div>

      {/* Quiz Selector & Past Visibility Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 flex-1">
          <label className="text-xs font-bold text-slate-700 whitespace-nowrap flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-red-600" />
            <span>व्यवस्थापन गर्ने क्विज छान्नुहोस्:</span>
          </label>
          <select
            value={selectedQuizId}
            onChange={e => {
              setSelectedQuizId(e.target.value);
              setSelectedSet(1);
            }}
            className="px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold bg-white text-slate-900 focus:ring-2 focus:ring-red-500 outline-hidden min-w-[280px]"
          >
            {allQuizzes.map(q => {
              const qCount = questions.filter(item => (item.quizId || 'quiz_week_12') === q.id).length;
              return (
                <option key={q.id} value={q.id}>
                  {q.title} ({q.status === 'active' ? '🟢 चालु' : '⚪ सम्पन्न/पुराना'}) — {toNepaliDigits(qCount)} प्रश्नहरू
                </option>
              );
            })}
          </select>
        </div>

        {/* Public Past Questions Toggle */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleToggleFrontend}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-2xs ${
              currentQuiz?.showInFrontend
                ? 'bg-emerald-100 text-emerald-900 border border-emerald-300 hover:bg-emerald-200'
                : 'bg-slate-100 text-slate-700 border border-slate-300 hover:bg-slate-200'
            }`}
            title="क्लिक गरी सार्वजनिक वा गोप्य बनाउनुहोस्"
          >
            <Globe className="w-4 h-4 text-emerald-600" />
            <span>
              {currentQuiz?.showInFrontend
                ? 'विगतका प्रश्नहरू पोर्टलमा सार्वजनिक छ ✓'
                : 'पोर्टलमा सार्वजनिक गर्नुहोस् (Publish)'}
            </span>
          </button>
        </div>
      </div>

      {/* Validation Status Banner (Requirement 37) */}
      <div
        className={`p-4 rounded-2xl border flex items-center justify-between gap-4 ${
          isCompleteBank
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
            : 'bg-amber-50 border-amber-200 text-amber-900'
        }`}
      >
        <div className="flex items-center gap-3">
          {isCompleteBank ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
          )}
          <div>
            <b className="text-sm font-bold">
              {isCompleteBank
                ? 'प्रश्न बैङ्क पूर्ण छ (५०/५० प्रश्न)'
                : `प्रश्न बैङ्क अपूर्ण छ (${toNepaliDigits(totalBankQuestions)}/५० प्रश्न)`}
            </b>
            <p className="text-xs opacity-80 mt-0.5">
              प्रत्येक सेटमा १० प्रश्नहरू भएमा मात्र निष्पक्ष र स्वचालित वितरण सम्भव हुन्छ।
            </p>
          </div>
        </div>

        <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-white/80 shadow-2xs">
          कुल: {toNepaliDigits(totalBankQuestions)} / ५०
        </span>
      </div>

      {/* 5 Sets Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
        {[1, 2, 3, 4, 5].map(setNum => {
          const count = setCounts[setNum] || 0;
          const isSelected = selectedSet === setNum;

          return (
            <button
              key={setNum}
              onClick={() => setSelectedSet(setNum)}
              className={`p-3.5 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'border-red-600 bg-red-600 text-white shadow-md'
                  : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-800'
              }`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">
                  सेट {toNepaliDigits(setNum)}
                </span>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    isSelected ? 'bg-white/20 text-white' : count >= 10 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {toNepaliDigits(count)}/१०
                </span>
              </div>
              <div className={`text-xs font-bold truncate ${isSelected ? 'text-white' : 'text-slate-700'}`}>
                {SET_NAMES[setNum]}
              </div>
            </button>
          );
        })}
      </div>

      {/* Questions list for selected set */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
        <div className="flex justify-between items-center pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              सेट {toNepaliDigits(selectedSet)}: {SET_NAMES[selectedSet]}
            </h2>
            <p className="text-xs text-slate-500">
              यो सेटमा {toNepaliDigits(currentSetQuestions.length)} वटा प्रश्नहरू छन्।
            </p>
          </div>
          <button
            onClick={handleOpenAdd}
            className="text-xs font-bold text-red-600 hover:underline flex items-center gap-1"
          >
            + यस सेटमा प्रश्न थप्नुहोस्
          </button>
        </div>

        <div className="space-y-4">
          {currentSetQuestions.length > 0 ? (
            currentSetQuestions.map((q, idx) => (
              <div
                key={q.id}
                className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200 flex flex-col sm:flex-row items-start justify-between gap-4"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-red-100 text-red-700 font-bold text-xs flex items-center justify-center shrink-0">
                      {toNepaliDigits(idx + 1)}
                    </span>
                    <h3 className="font-bold text-slate-900 text-sm leading-snug">{q.question}</h3>
                  </div>

                  {/* Options Display */}
                  <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                    {(['A', 'B', 'C', 'D'] as QuestionOption[]).map(opt => {
                      const optText = q[`option${opt}` as keyof Question];
                      const isCorrect = q.correctAnswer === opt;
                      return (
                        <div
                          key={opt}
                          className={`p-2 rounded-lg border flex items-center gap-2 ${
                            isCorrect
                              ? 'bg-emerald-100/70 border-emerald-300 text-emerald-900 font-bold'
                              : 'bg-white border-slate-200 text-slate-600'
                          }`}
                        >
                          <span className="font-mono font-bold text-[10px] w-4">{opt}.</span>
                          <span className="truncate">{optText}</span>
                          {isCorrect && <Check className="w-3.5 h-3.5 text-emerald-600 ml-auto" />}
                        </div>
                      );
                    })}
                  </div>

                  {q.explanation && (
                    <p className="text-[11px] text-slate-500 bg-white p-2 rounded-lg border border-slate-100">
                      <b>व्याख्या:</b> {q.explanation}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-start">
                  <button
                    onClick={() => handleOpenEdit(q)}
                    className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 shadow-2xs transition cursor-pointer"
                    title="सम्पादन गर्नुहोस्"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(q.id)}
                    className="p-2 rounded-lg bg-white border border-slate-200 text-red-600 hover:bg-red-50 shadow-2xs transition cursor-pointer"
                    title="मेटाउनुहोस्"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="py-8 text-center text-slate-400 text-xs">
              यस सेटमा कुनै प्रश्न भेटिएन। माथिको बटनबाट प्रश्न थप्नुहोस्।
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Question Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-4 my-auto animate-in zoom-in-95">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-bold text-lg text-slate-900">
                {editingQuestion ? 'प्रश्न सम्पादन गर्नुहोस्' : 'नयाँ प्रश्न थप्नुहोस्'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs font-semibold">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveQuestion} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  सेट नम्बर छान्नुहोस्
                </label>
                <select
                  value={formSet}
                  onChange={e => setFormSet(Number(e.target.value) as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                >
                  {[1, 2, 3, 4, 5].map(s => (
                    <option key={s} value={s}>
                      सेट {toNepaliDigits(s)}: {SET_NAMES[s]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  प्रश्न पाठ (Question Text) *
                </label>
                <textarea
                  required
                  rows={3}
                  value={formQuestion}
                  onChange={e => setFormQuestion(e.target.value)}
                  placeholder="प्रश्न यहाँ लेख्नुहोस्..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium"
                />
              </div>

              {/* Options */}
              <div className="space-y-2">
                <label className="block font-bold text-slate-700 uppercase">
                  चार विकल्पहरू (A, B, C, D) *
                </label>
                {(['A', 'B', 'C', 'D'] as QuestionOption[]).map(opt => {
                  const stateVal =
                    opt === 'A' ? formOptA : opt === 'B' ? formOptB : opt === 'C' ? formOptC : formOptD;
                  const setVal =
                    opt === 'A' ? setFormOptA : opt === 'B' ? setFormOptB : opt === 'C' ? setFormOptC : setFormOptD;

                  return (
                    <div key={opt} className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-lg bg-slate-100 font-bold flex items-center justify-center shrink-0">
                        {opt}
                      </span>
                      <input
                        type="text"
                        required
                        value={stateVal}
                        onChange={e => setVal(e.target.value)}
                        placeholder={`विकल्प ${opt}`}
                        className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs"
                      />
                    </div>
                  );
                })}
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  सही उत्तर (Correct Option) *
                </label>
                <div className="flex gap-2">
                  {(['A', 'B', 'C', 'D'] as QuestionOption[]).map(opt => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setFormCorrect(opt)}
                      className={`flex-1 py-2 rounded-xl border font-bold text-xs cursor-pointer transition ${
                        formCorrect === opt
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-white border-slate-200 text-slate-700'
                      }`}
                    >
                      {opt} {formCorrect === opt ? '✓' : ''}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  व्याख्या (ऐच्छिक)
                </label>
                <input
                  type="text"
                  value={formExplanation}
                  onChange={e => setFormExplanation(e.target.value)}
                  placeholder="विद्यार्थीले उत्तर बुझाएपछि देखिने स्पष्टीकरण..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  रद्द गर्नुहोस्
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow"
                >
                  सुरक्षित गर्नुहोस्
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* AI Random 10 Question Picker & Generator Modal */}
      {isAiModalOpen && (
        <AiQuestionPickerModal
          isOpen={isAiModalOpen}
          onClose={() => setIsAiModalOpen(false)}
          questions={questions}
          quizzes={dataService.getQuizzes()}
          onQuestionsUpdated={onRefresh}
          onApplyToQuiz={(selected10, quizId) => {
            selected10.forEach(q => {
              dataService.saveQuestion({ ...q, quizId }, 'admin@fsudmc.com');
            });
            onRefresh();
          }}
        />
      )}
    </div>
  );
};
