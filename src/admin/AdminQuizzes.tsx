import React, { useState } from 'react';
import type { Quiz, QuizStatus } from '../types/quiz';
import { toNepaliDigits, formatNepalDate, getRemainingAvailability } from '../lib/nepaliUtils';
import { dataService } from '../lib/dataService';
import {
  BookOpen,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  Calendar,
  AlertCircle,
  Edit3,
  X,
  Check,
  Sparkles,
  Eye,
  EyeOff,
  Upload,
  HelpCircle,
  Info,
  Radio,
  FileQuestion
} from 'lucide-react';
import { AiQuestionPickerModal } from './components/AiQuestionPickerModal';
import { UploadPastQuestionsModal } from './components/UploadPastQuestionsModal';

interface AdminQuizzesProps {
  quizzes: Quiz[];
  activeQuiz: Quiz | null;
  onRefresh: () => void;
  navigate?: (path: string) => void;
  adminSlug?: string;
}

export const AdminQuizzes: React.FC<AdminQuizzesProps> = ({
  quizzes,
  activeQuiz,
  onRefresh,
  navigate,
  adminSlug = 'quizemasteradmin',
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAiPickerModal, setShowAiPickerModal] = useState(false);
  const [aiModalMode, setAiModalMode] = useState<'picker' | 'generate'>('generate');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(10);
  const [questionCount, setQuestionCount] = useState(10);
  const [startAtDate, setStartAtDate] = useState(() => {
    const d = new Date();
    return d.toISOString().slice(0, 16);
  });
  const [endAtDate, setEndAtDate] = useState(() => {
    const d = new Date(Date.now() + 72 * 60 * 60 * 1000); // 72 hours later
    return d.toISOString().slice(0, 16);
  });
  const [status, setStatus] = useState<QuizStatus>('active');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleOpenAdd = () => {
    setTitle(`साप्ताहिक क्याम्पस क्विज - हप्ता ${quizzes.length + 1}`);
    setDescription('सामान्य ज्ञान, शिक्षा, विज्ञान तथा समसामयिक विषयहरूमा आधारित बौद्धिक प्रतियोगिता।');
    setDurationMinutes(10);
    setQuestionCount(10);
    const d = new Date();
    setStartAtDate(d.toISOString().slice(0, 16));
    setEndAtDate(new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString().slice(0, 16));
    setStatus('active');
    setEditingQuiz(null);
    setShowAddModal(true);
  };

  const handleOpenEdit = (q: Quiz) => {
    setEditingQuiz(q);
    setTitle(q.title);
    setDescription(q.description);
    setDurationMinutes(q.durationMinutes);
    setQuestionCount(q.questionCount);
    setStartAtDate(new Date(q.startAt).toISOString().slice(0, 16));
    setEndAtDate(new Date(q.endAt).toISOString().slice(0, 16));
    setStatus(q.status);
    setShowAddModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (editingQuiz) {
      dataService.updateQuiz({
        ...editingQuiz,
        title: title.trim(),
        description: description.trim(),
        durationMinutes: Number(durationMinutes) || 10,
        questionCount: Number(questionCount) || 10,
        startAt: new Date(startAtDate).toISOString(),
        endAt: new Date(endAtDate).toISOString(),
        status,
      }, 'admin@fsudmc.com');
      showToast(`क्विज "${title.trim()}" सम्पादन गरियो`);
    } else {
      dataService.createQuiz({
        title: title.trim(),
        description: description.trim(),
        durationMinutes: Number(durationMinutes) || 10,
        questionCount: Number(questionCount) || 10,
        totalBankQuestions: 50,
        startAt: new Date(startAtDate).toISOString(),
        endAt: new Date(endAtDate).toISOString(),
        status,
      }, 'admin@fsudmc.com');
      showToast(`नयाँ साप्ताहिक क्विज "${title.trim()}" सिर्जना गरियो`);
    }

    setShowAddModal(false);
    onRefresh();
  };

  const handleDelete = (quizId: string, quizTitle: string) => {
    if (window.confirm(`के तपाईं निश्चित हुनुहुन्छ? "${quizTitle}" क्विज मेटाइनेछ।`)) {
      dataService.deleteQuiz(quizId, 'admin@fsudmc.com');
      showToast(`क्विज "${quizTitle}" मेटाइयो`);
      onRefresh();
    }
  };

  const handleSetActive = (quizId: string, quizTitle: string) => {
    dataService.setActiveQuiz(quizId, 'admin@fsudmc.com');
    showToast(`"${quizTitle}" लाई वर्तमान सक्रिय साप्ताहिक क्विज बनाइयो ✓`);
    onRefresh();
  };

  const handleManageQuestions = (quizId: string) => {
    if (navigate) {
      navigate(`/${adminSlug}/questions?quizId=${quizId}`);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Toast Notice */}
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
            साप्ताहिक क्विज व्यवस्थापन (Weekly Quiz Management)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            दार्चुला बहुमुखी क्याम्पसको साप्ताहिक क्विजहरू सिर्जना, सक्रियता र प्रश्न बैङ्क व्यवस्थापन
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowUploadModal(true)}
            className="px-3.5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5 cursor-pointer"
          >
            <Upload className="w-4 h-4 text-emerald-200" />
            <span>📤 प्रश्नहरू बल्क अपलोड</span>
          </button>
          <button
            onClick={() => {
              setAiModalMode('generate');
              setShowAiPickerModal(true);
            }}
            className="px-3.5 py-2.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-700 hover:to-purple-800 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/20 transition flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>✨ AI क्विज निर्माण</span>
          </button>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-2 cursor-pointer w-fit"
          >
            <Plus className="w-4 h-4" />
            <span>+ नयाँ क्विज थप्नुहोस्</span>
          </button>
        </div>
      </div>

      {/* Clarity / Guidance Banner: Removes all confusion regarding weekly quiz lifecycle */}
      <div className="bg-gradient-to-r from-red-50 via-amber-50 to-orange-50 border border-red-200/80 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-red-100 border border-red-200 text-red-700 flex items-center justify-center shrink-0 mt-0.5">
            <Info className="w-5 h-5 text-red-600" />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs sm:text-sm font-black text-slate-900">
              📌 साप्ताहिक क्विज सञ्चालन नियम (Single Active Weekly Quiz Principle)
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
              क्याम्पसमा एक पटकमा <b>केवल एउटा मात्र क्विज प्रत्यक्ष सक्रिय (Active)</b> रहन्छ। विद्यार्थीहरूले मुख्य पोर्टलको <b>'आजको क्विज'</b> मा यही सक्रिय क्विज मात्र खेल्न पाउँछन्। नयाँ क्विजलाई 'सक्रिय बनाउनुहोस्' क्लिक गर्दा अघिल्लो हप्ताको क्विज स्वतः सम्पन्न/अभिलेख (Archived) हुनेछ।
            </p>
          </div>
        </div>
        {activeQuiz && (
          <div className="shrink-0 bg-white px-3.5 py-2 rounded-xl border border-red-200 text-xs shadow-2xs">
            <span className="text-slate-500 font-medium">हाल सक्रिय: </span>
            <b className="text-red-700">{activeQuiz.title}</b>
          </div>
        )}
      </div>

      {/* Quizzes List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {quizzes.map(quiz => {
          const isActive = quiz.status === 'active';
          const availability = getRemainingAvailability(quiz.endAt);
          const bankQuestions = dataService.getQuestions(quiz.id);
          const bankCount = bankQuestions.length;

          return (
            <div
              key={quiz.id}
              className={`bg-white rounded-2xl border transition-all flex flex-col justify-between shadow-2xs hover:shadow-md relative overflow-hidden ${
                isActive
                  ? 'border-emerald-500 ring-2 ring-emerald-500/25'
                  : availability.isExpired
                  ? 'border-slate-200 opacity-90'
                  : 'border-slate-200'
              } p-5`}
            >
              {/* Active Badge */}
              {isActive ? (
                <div className="absolute top-0 right-0 bg-emerald-600 text-white text-[10px] font-black uppercase px-3.5 py-1.5 rounded-bl-xl tracking-wider flex items-center gap-1.5 shadow-xs">
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
                  <span>🟢 हाल सक्रिय क्विज (Live)</span>
                </div>
              ) : availability.isExpired ? (
                <div className="absolute top-0 right-0 bg-slate-200 text-slate-700 text-[10px] font-black uppercase px-3 py-1 rounded-bl-xl tracking-wider">
                  <span>⚪ समय समाप्त (Closed)</span>
                </div>
              ) : quiz.status === 'draft' ? (
                <div className="absolute top-0 right-0 bg-amber-100 text-amber-800 text-[10px] font-black uppercase px-3 py-1 rounded-bl-xl tracking-wider">
                  <span>🟡 मस्यौदा (Draft)</span>
                </div>
              ) : null}

              <div>
                <div className="flex items-center gap-2 mb-2 text-slate-400">
                  <BookOpen className="w-4 h-4 text-red-600" />
                  <span className="text-[11px] font-mono font-semibold">{quiz.id}</span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 mb-1 leading-snug">
                  {quiz.title}
                </h3>
                <p className="text-xs text-slate-600 line-clamp-2 mb-4">
                  {quiz.description}
                </p>

                {/* Details Table */}
                <div className="space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs text-slate-600">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">परीक्षा प्रश्न:</span>
                    <b className="text-slate-800">{toNepaliDigits(quiz.questionCount)} वटा</b>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">कुल प्रश्न बैङ्क:</span>
                    <span className={`font-bold ${bankCount >= 50 ? 'text-emerald-700' : 'text-amber-700'}`}>
                      {toNepaliDigits(bankCount)} वटा प्रश्न {bankCount >= 50 ? '✓' : '(कम्तीमा ५० चाहिने)'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">समयावधि:</span>
                    <b className="text-slate-800">{toNepaliDigits(quiz.durationMinutes)} मिनेट</b>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">सुरु हुने मिति:</span>
                    <span className="font-mono text-[11px] text-slate-700">{formatNepalDate(quiz.startAt, true)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">अन्तिम म्याद:</span>
                    <span className="font-mono text-[11px] text-slate-700">{formatNepalDate(quiz.endAt, true)}</span>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold">
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                  <span className={availability.isExpired ? 'text-red-500 font-bold' : 'text-emerald-600'}>
                    {availability.text}
                  </span>
                </div>

                {/* Past Question Frontend Publication Toggle */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                    <span>विद्यार्थी पुराना प्रश्नोत्तर:</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const next = !quiz.showInFrontend;
                      dataService.toggleQuizFrontendPastQuestions(quiz.id, next, 'admin@fsudmc.com');
                      onRefresh();
                      showToast(next ? 'विगतका प्रश्नहरू पोर्टलमा सार्वजनिक गरियो' : 'पोर्टलबाट हटाइयो');
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                      quiz.showInFrontend
                        ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300'
                        : 'bg-slate-100 text-slate-600 hover:bg-purple-50 hover:text-purple-700 border border-slate-200'
                    }`}
                    title={quiz.showInFrontend ? 'प्रकाशन बन्द गर्नुहोस्' : 'विद्यार्थी पोर्टलमा देखाउनुहोस्'}
                  >
                    {quiz.showInFrontend ? (
                      <>
                        <Eye className="w-3.5 h-3.5 text-emerald-700" />
                        <span>पोर्टलमा सार्वजनिक ✓</span>
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                        <span>सार्वजनिक गर्नुहोस्</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex flex-col gap-2">
                {/* Manage Questions Direct Button */}
                <button
                  type="button"
                  onClick={() => handleManageQuestions(quiz.id)}
                  className="w-full py-2 px-3 bg-slate-100 hover:bg-red-50 text-slate-800 hover:text-red-700 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer border border-slate-200/80"
                >
                  <FileQuestion className="w-3.5 h-3.5 text-red-600" />
                  <span>यस क्विजका प्रश्नहरू व्यवस्थापन गर्नुहोस् ({toNepaliDigits(bankCount)})</span>
                </button>

                <div className="flex items-center justify-between gap-2">
                  {!isActive ? (
                    <button
                      type="button"
                      onClick={() => handleSetActive(quiz.id, quiz.title)}
                      className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer border border-emerald-200"
                    >
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>सक्रिय बनाउनुहोस्</span>
                    </button>
                  ) : (
                    <span className="text-xs font-black text-emerald-700 flex items-center gap-1.5 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      सक्रिय साप्ताहिक क्विज
                    </span>
                  )}

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(quiz)}
                      title="सम्पादन गर्नुहोस्"
                      className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(quiz.id, quiz.title)}
                      title="क्विज मेटाउनुहोस्"
                      className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl relative my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <h2 className="text-lg font-black text-slate-900">
                {editingQuiz ? 'क्विज विवरण सम्पादन गर्नुहोस्' : 'नयाँ साप्ताहिक क्विज थप्नुहोस्'}
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-slate-700 mb-1">क्विजको शीर्षक *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="उदा. साप्ताहिक क्याम्पस क्विज - हप्ता १२"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-red-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1">विवरण वा निर्देशन</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="क्विज सम्बन्धी जानकारी..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-normal focus:ring-2 focus:ring-red-500 outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1">समयावधि (मिनेट)</label>
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={durationMinutes}
                    onChange={e => setDurationMinutes(parseInt(e.target.value) || 10)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1">प्रश्न सङ्ख्या (प्रति विद्यार्थी)</label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={questionCount}
                    onChange={e => setQuestionCount(parseInt(e.target.value) || 10)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1">सुरु हुने मिति र समय (NPT)</label>
                  <input
                    type="datetime-local"
                    required
                    value={startAtDate}
                    onChange={e => setStartAtDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1">समाप्त हुने मिति र समय (NPT)</label>
                  <input
                    type="datetime-local"
                    required
                    value={endAtDate}
                    onChange={e => setEndAtDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 mb-1">क्विज स्थिति (Status)</label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium bg-white"
                >
                  <option value="active">सक्रिय (Active - विद्यार्थीहरूले खेल्न पाउने)</option>
                  <option value="draft">मस्यौदा (Draft / आगामी - विद्यार्थीलाई नदेखाइने)</option>
                  <option value="closed">बन्द (Closed - समय सकिएको)</option>
                </select>
                <p className="text-[11px] text-slate-500 font-normal mt-1">
                  नोट: 'सक्रिय' (Active) छनोट गर्दा पहिलेदेखि चालु रहेको अन्य क्विज स्वतः सम्पन्न (Archived) हुनेछ।
                </p>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold"
                >
                  रद्द गर्नुहोस्
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  सुरक्षित गर्नुहोस्
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Random Question Generator Modal */}
      {showAiPickerModal && (
        <AiQuestionPickerModal
          isOpen={showAiPickerModal}
          onClose={() => setShowAiPickerModal(false)}
          questions={dataService.getQuestions()}
          quizzes={quizzes}
          initialMode={aiModalMode}
          onQuestionsUpdated={onRefresh}
          onApplyToQuiz={(selected10, targetQuizId) => {
            selected10.forEach(q => {
              dataService.saveQuestion({ ...q, quizId: targetQuizId }, 'admin@fsudmc.com');
            });
            onRefresh();
            showToast('प्रश्नहरू सफलतापूर्वक क्विजमा थपियो ✓');
          }}
        />
      )}

      {/* Bulk Upload Past Questions Modal */}
      <UploadPastQuestionsModal
        quizzes={quizzes}
        defaultQuizId={activeQuiz?.id}
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onRefresh={onRefresh}
      />
    </div>
  );
};
