import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import type { Quiz, Question, QuestionOption } from '../../types/quiz';
import { dataService } from '../../lib/dataService';
import { toNepaliDigits } from '../../lib/nepaliUtils';
import {
  Upload,
  FileSpreadsheet,
  Download,
  AlertCircle,
  CheckCircle2,
  X,
  FileText,
  Layers,
  HelpCircle,
  Loader2,
  Sparkles,
  Eye,
  Plus
} from 'lucide-react';

interface UploadPastQuestionsModalProps {
  quizzes: Quiz[];
  defaultQuizId?: string;
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
  onSuccessToast?: (msg: string) => void;
}

interface ParsedRow {
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: QuestionOption;
  setNumber: 1 | 2 | 3 | 4 | 5;
  explanation?: string;
  isValid: boolean;
  error?: string;
}

export const UploadPastQuestionsModal: React.FC<UploadPastQuestionsModalProps> = ({
  quizzes,
  defaultQuizId,
  isOpen,
  onClose,
  onRefresh,
  onSuccessToast,
}) => {
  const [selectedQuizId, setSelectedQuizId] = useState<string>(() => defaultQuizId || quizzes[0]?.id || 'quiz_week_12');
  const [createNewPastQuiz, setCreateNewPastQuiz] = useState(false);
  const [newQuizTitle, setNewQuizTitle] = useState('');
  const [newQuizDescription, setNewQuizDescription] = useState('स्वतन्त्र विद्यार्थी युनियन साप्ताहिक क्विज विगतका प्रश्नहरू');
  const [publishToFrontend, setPublishToFrontend] = useState(true);

  const [activeTab, setActiveTab] = useState<'excel' | 'paste'>('excel');
  const [pasteText, setPasteText] = useState('');
  const [parsedQuestions, setParsedQuestions] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Normalize Nepali/English letters for Correct Answer
  const normalizeCorrectAnswer = (val: any): QuestionOption => {
    if (!val) return 'A';
    const s = String(val).trim().toUpperCase();
    if (s === 'A' || s === 'क' || s === '1' || s === '१') return 'A';
    if (s === 'B' || s === 'ख' || s === '2' || s === '२') return 'B';
    if (s === 'C' || s === 'ग' || s === '3' || s === '३') return 'C';
    if (s === 'D' || s === 'घ' || s === '4' || s === '४') return 'D';
    return 'A';
  };

  // Normalize set number (1 to 5)
  const normalizeSetNumber = (val: any, rowIndex: number): 1 | 2 | 3 | 4 | 5 => {
    if (!val) {
      // Auto-distribute evenly across sets 1-5 if not specified (10 per set)
      const autoSet = Math.min(5, Math.floor(rowIndex / 10) + 1);
      return (autoSet as 1 | 2 | 3 | 4 | 5);
    }
    const clean = String(val).replace(/[०-९]/g, d => '०१२३४५६७८९'.indexOf(d).toString()).trim();
    const num = parseInt(clean, 10);
    if (num >= 1 && num <= 5) {
      return num as 1 | 2 | 3 | 4 | 5;
    }
    return 1;
  };

  // Parse raw sheet data rows
  const parseRowsData = (rows: any[]) => {
    if (!rows || rows.length === 0) {
      setParseError('कुनै पनि डेटा फेला परेन। कृपया ढाँचा मिलेको फाइल छान्नुहोस्।');
      setParsedQuestions([]);
      return;
    }

    const parsed: ParsedRow[] = [];

    rows.forEach((row, idx) => {
      // Map flexible header variations
      const question = (
        row['प्रश्न'] ||
        row['question'] ||
        row['Question'] ||
        row['QUESTION'] ||
        row['प्रश्न विवरण'] ||
        row['Title'] ||
        row[0] ||
        ''
      ).toString().trim();

      const optionA = (
        row['विकल्प A'] ||
        row['विकल्प क'] ||
        row['optionA'] ||
        row['Option A'] ||
        row['OptionA'] ||
        row['A'] ||
        row[1] ||
        ''
      ).toString().trim();

      const optionB = (
        row['विकल्प B'] ||
        row['विकल्प ख'] ||
        row['optionB'] ||
        row['Option B'] ||
        row['OptionB'] ||
        row['B'] ||
        row[2] ||
        ''
      ).toString().trim();

      const optionC = (
        row['विकल्प C'] ||
        row['विकल्प ग'] ||
        row['optionC'] ||
        row['Option C'] ||
        row['OptionC'] ||
        row['C'] ||
        row[3] ||
        ''
      ).toString().trim();

      const optionD = (
        row['विकल्प D'] ||
        row['विकल्प घ'] ||
        row['optionD'] ||
        row['Option D'] ||
        row['OptionD'] ||
        row['D'] ||
        row[4] ||
        ''
      ).toString().trim();

      const rawCorrect = (
        row['सही उत्तर'] ||
        row['correctAnswer'] ||
        row['Correct Answer'] ||
        row['Correct'] ||
        row['उत्तर'] ||
        row[5] ||
        'A'
      );

      const rawSet = (
        row['सेट'] ||
        row['सेट नम्बर'] ||
        row['setNumber'] ||
        row['Set'] ||
        row['Set Number'] ||
        row[6] ||
        ''
      );

      const explanation = (
        row['व्याख्या'] ||
        row['explanation'] ||
        row['Explanation'] ||
        row[7] ||
        ''
      ).toString().trim();

      // Check row validity
      if (!question) {
        return; // skip empty rows
      }

      const isValid = Boolean(question && optionA && optionB && optionC && optionD);
      let error = '';
      if (!isValid) {
        error = 'प्रश्न वा चारै विकल्पहरू भरिएका छैनन्';
      }

      parsed.push({
        question,
        optionA,
        optionB,
        optionC,
        optionD,
        correctAnswer: normalizeCorrectAnswer(rawCorrect),
        setNumber: normalizeSetNumber(rawSet, idx),
        explanation: explanation || undefined,
        isValid,
        error: error || undefined,
      });
    });

    if (parsed.length === 0) {
      setParseError('फाइलमा कुनै पनि प्रश्न फेला परेन। कृपया ढाँचा जाँच गर्नुहोस्।');
    } else {
      setParseError(null);
    }

    setParsedQuestions(parsed);
  };

  // Handle Excel/CSV file selection
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsProcessing(true);
    setParseError(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(worksheet);

        parseRowsData(rows);
      } catch (err: any) {
        console.error('File parsing error:', err);
        setParseError('फाइल पढ्न सकिएन। कृपया सही .xlsx, .xls वा .csv फाइल छान्नुहोस्।');
        setParsedQuestions([]);
      } finally {
        setIsProcessing(false);
      }
    };

    reader.onerror = () => {
      setIsProcessing(false);
      setParseError('फाइल खोल्दा त्रुटि भयो।');
    };

    reader.readAsBinaryString(file);
  };

  // Handle Pasted Tabular Text (Tab or Comma separated)
  const handleParsePastedText = () => {
    if (!pasteText.trim()) {
      setParseError('कृपया पहिला प्रश्नहरूको तालिका पेस्ट गर्नुहोस्।');
      return;
    }

    setIsProcessing(true);
    setParseError(null);

    try {
      const lines = pasteText.trim().split('\n');
      const rows: any[] = [];

      lines.forEach((line) => {
        if (!line.trim()) return;
        // Split by tab (Excel copy) or comma (CSV)
        const parts = line.includes('\t')
          ? line.split('\t').map(p => p.trim())
          : line.split(',').map(p => p.trim().replace(/^["']|["']$/g, ''));

        if (parts.length >= 5) {
          // If first row looks like header, skip
          if (parts[0].toLowerCase().includes('question') || parts[0].includes('प्रश्न')) {
            return;
          }
          rows.push({
            question: parts[0],
            optionA: parts[1],
            optionB: parts[2],
            optionC: parts[3],
            optionD: parts[4],
            correctAnswer: parts[5] || 'A',
            setNumber: parts[6] || '',
            explanation: parts[7] || '',
          });
        }
      });

      parseRowsData(rows);
      setFileName('Pasted Data');
    } catch (err) {
      setParseError('पेस्ट गरिएको विवरण प्रोसेस गर्न सकिएन।');
    } finally {
      setIsProcessing(false);
    }
  };

  // Download Sample Template for Admins
  const handleDownloadSample = (format: 'xlsx' | 'csv') => {
    const sampleRows = [
      {
        'प्रश्न': 'दार्चुला बहुमुखी क्याम्पसको स्थापना कहिले भएको हो?',
        'विकल्प A': 'वि.सं. २०४४',
        'विकल्प B': 'वि.सं. २०४८',
        'विकल्प C': 'वि.सं. २०५२',
        'विकल्प D': 'वि.सं. २०५५',
        'सही उत्तर': 'A',
        'सेट': 1,
        'व्याख्या': 'दार्चुला बहुमुखी क्याम्पसको स्थापना वि.सं. २०४८ मा भएको हो।',
      },
      {
        'प्रश्न': 'नेपालको राष्ट्रिय गानका रचनाकार को हुन्?',
        'विकल्प A': 'माधवप्रसाद घिमिरे',
        'विकल्प B': 'प्रदीपकुमार राई (व्याकुल माइला)',
        'विकल्प C': 'लक्ष्मीप्रसाद देवकोटा',
        'विकल्प D': 'अम्बर गुरुङ',
        'सही उत्तर': 'B',
        'सेट': 2,
        'व्याख्या': 'सयौं थुँगा फूलका हामी राष्ट्रिय गानका रचनाकार व्याकुल माइला हुन्।',
      },
      {
        'प्रश्न': 'विश्वको पहिलो कम्प्युटर प्रोग्रामर कसलाई मानिन्छ?',
        'विकल्प A': 'चार्ल्स ब्याबेज',
        'विकल्प B': 'एडा लभलेस',
        'विकल्प C': 'एलन ट्युरिङ',
        'विकल्प D': 'बिल गेट्स',
        'सही उत्तर': 'B',
        'सेट': 3,
        'व्याख्या': 'एडा लभलेस (Ada Lovelace) लाई पहिलो कम्प्युटर प्रोग्रामर मानिन्छ।',
      },
      {
        'प्रश्न': 'अपि हिमाल नेपालको कुन जिल्लामा अवस्थित छ?',
        'विकल्प A': 'दार्चुला',
        'विकल्प B': 'बझाङ',
        'विकल्प C': 'हुम्ला',
        'विकल्प D': 'डोल्पा',
        'सही उत्तर': 'A',
        'सेट': 4,
        'व्याख्या': 'अपि हिमाल (७,१३२ मिटर) दार्चुला जिल्लामा अवस्थित छ।',
      },
      {
        'प्रश्न': 'हाल नेपालको संविधानमा कति भाग र धारा रहेका छन्?',
        'विकल्प A': '३५ भाग, ३०८ धारा',
        'विकल्प B': '३० भाग, ३०५ धारा',
        'विकल्प C': '३२ भाग, ३०० धारा',
        'विकल्प D': '४० भाग, ३५० धारा',
        'सही उत्तर': 'A',
        'सेट': 5,
        'व्याख्या': 'नेपालको संविधान २०७२ मा ३५ भाग, ३०८ धारा र ९ अनुसूची रहेका छन्।',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'PastQuestions');

    if (format === 'xlsx') {
      XLSX.writeFile(workbook, 'darchula_past_questions_template.xlsx');
    } else {
      XLSX.writeFile(workbook, 'darchula_past_questions_template.csv');
    }
  };

  // Submit and bulk save to database
  const handleSaveAll = async () => {
    const validQuestions = parsedQuestions.filter(q => q.isValid);
    if (validQuestions.length === 0) {
      setParseError('कुनै पनि मान्य प्रश्न छैन। कृपया प्रश्न र चारै विकल्पहरू सही भएको सुनिश्चित गर्नुहोस्।');
      return;
    }

    setIsSaving(true);
    try {
      let targetQuizId = selectedQuizId;

      // If admin selected to create a brand new past quiz archive
      if (createNewPastQuiz) {
        const titleToUse = newQuizTitle.trim() || `विगतका क्विज प्रश्न सङ्ग्रह - ${new Date().toLocaleDateString('ne-NP')}`;
        const newQuiz: Quiz = {
          id: `past_quiz_${Date.now()}`,
          title: titleToUse,
          description: newQuizDescription.trim() || 'साप्ताहिक हाजिरी जवाफ विगतका प्रश्न तथा सही उत्तरहरू',
          startAt: new Date(Date.now() - 7 * 86400000).toISOString(),
          endAt: new Date(Date.now() - 86400000).toISOString(),
          durationMinutes: 10,
          questionCount: 10,
          totalBankQuestions: validQuestions.length,
          status: 'closed',
          showInFrontend: publishToFrontend,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        dataService.saveQuiz(newQuiz, 'admin@fsudmc.com');
        targetQuizId = newQuiz.id;
      }

      // Convert parsed rows to Question model
      const finalQuestions: Question[] = validQuestions.map((q, idx) => ({
        id: `q_past_${targetQuizId}_${idx + 1}_${Date.now()}`,
        quizId: targetQuizId,
        setNumber: q.setNumber,
        question: q.question,
        optionA: q.optionA,
        optionB: q.optionB,
        optionC: q.optionC,
        optionD: q.optionD,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
      }));

      // Bulk write to backend
      const result = dataService.bulkSaveQuestions(finalQuestions, 'admin@fsudmc.com');

      // Update quiz past visibility
      if (publishToFrontend) {
        dataService.toggleQuizPastVisibility(targetQuizId, true, 'admin@fsudmc.com');
      }

      setIsSaving(false);
      onClose();
      onRefresh();

      if (onSuccessToast) {
        onSuccessToast(
          `सफलतापूर्वक ${toNepaliDigits(result.added)} वटा नयाँ विगतका प्रश्नहरू ब्याकइन्डमा सुरक्षित गरियो र पोर्टलमा उपलब्ध गराइयो!`
        );
      }
    } catch (err: any) {
      setIsSaving(false);
      setParseError('प्रश्नहरू सुरक्षित गर्दा प्राविधिक समस्या आयो: ' + (err?.message || 'अज्ञात त्रुटि'));
    }
  };

  const validCount = parsedQuestions.filter(q => q.isValid).length;
  const invalidCount = parsedQuestions.length - validCount;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl space-y-6 animate-in zoom-in-95 max-h-[92vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-2xl shadow-inner">
              📤
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900">
                विगतका प्रश्नहरू बल्क अपलोड (Bulk Upload Past Questions)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                एक्सेल (Excel), CSV वा सिधै तालिका पेस्ट गरी एकैपटक ५० सम्म पुराना प्रश्नहरू अपलोड गर्नुहोस्
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step 1: Target Quiz Selection */}
        <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200/80 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>१. प्रश्नहरू कुन क्विजमा थप्ने? (Target Quiz)</span>
            </span>

            <div className="flex items-center gap-3">
              <label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={createNewPastQuiz}
                  onChange={e => setCreateNewPastQuiz(e.target.checked)}
                  className="w-4 h-4 rounded text-red-600 focus:ring-red-500"
                />
                <span>नयाँ विगतको क्विज (New Past Quiz Archive) सिर्जना गर्ने</span>
              </label>
            </div>
          </div>

          {!createNewPastQuiz ? (
            <div>
              <select
                value={selectedQuizId}
                onChange={e => setSelectedQuizId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-hidden"
              >
                {quizzes.map(q => {
                  const qCount = dataService.getQuestions(q.id).length;
                  return (
                    <option key={q.id} value={q.id}>
                      {q.title} ({q.status === 'active' ? '🟢 चालु' : '⚪ सम्पन्न/पुराना'}) — हाल {toNepaliDigits(qCount)} प्रश्नहरू
                    </option>
                  );
                })}
              </select>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  विगतको क्विज शीर्षक (Title) *
                </label>
                <input
                  type="text"
                  required
                  value={newQuizTitle}
                  onChange={e => setNewQuizTitle(e.target.value)}
                  placeholder="उदा. हप्ता ११: साप्ताहिक हाजिरी जवाफ प्रश्नहरू"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-indigo-500 outline-hidden"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  विवरण (Description)
                </label>
                <input
                  type="text"
                  value={newQuizDescription}
                  onChange={e => setNewQuizDescription(e.target.value)}
                  placeholder="उदा. क्याम्पस, साहित्य तथा सामान्य ज्ञान प्रश्नहरू"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-indigo-500 outline-hidden"
                />
              </div>
            </div>
          )}

          {/* Past Questions Portal Toggle */}
          <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
            <label className="text-xs font-bold text-emerald-800 flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={publishToFrontend}
                onChange={e => setPublishToFrontend(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span>यो क्विजका प्रश्नहरू पोर्टलको 'विगतका प्रश्नहरू' (Past Questions) खण्डमा सार्वजनिक गर्नुहोस्</span>
            </label>
            <span className="text-[11px] text-slate-500 font-medium">विद्यार्थीले उत्तर र व्याख्या अध्ययन गर्न पाउनेछन्</span>
          </div>
        </div>

        {/* Step 2: Download Template Helpers */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-amber-50/70 border border-amber-200 p-3.5 rounded-2xl text-xs text-amber-950">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <b>सजिलो उपाय:</b> पहिला नमुना ढाँचा डाउनलोड गरी त्यसमा प्रश्नहरू भरेर अपलोड गर्नुहोस्:
            </span>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleDownloadSample('xlsx')}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-2xs transition flex items-center gap-1.5 cursor-pointer text-[11px]"
            >
              <Download className="w-3.5 h-3.5" />
              <span>नमुना Excel (.xlsx)</span>
            </button>
            <button
              type="button"
              onClick={() => handleDownloadSample('csv')}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg shadow-2xs transition flex items-center gap-1.5 cursor-pointer text-[11px]"
            >
              <Download className="w-3.5 h-3.5" />
              <span>नमुना CSV (.csv)</span>
            </button>
          </div>
        </div>

        {/* Step 3: Upload Tabs (Excel File or Paste Text) */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
            <button
              type="button"
              onClick={() => setActiveTab('excel')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'excel'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Excel वा CSV फाइल अपलोड</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('paste')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'paste'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>तालिका पेस्ट गर्नुहोस् (Copy-Paste)</span>
            </button>
          </div>

          {activeTab === 'excel' ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-indigo-300 hover:border-indigo-500 rounded-3xl p-8 text-center cursor-pointer bg-indigo-50/20 hover:bg-indigo-50/40 transition space-y-3"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                <Upload className="w-7 h-7" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900">
                  {fileName ? `छानिएको फाइल: ${fileName}` : 'यहाँ क्लिक गरी Excel (.xlsx, .xls) वा CSV फाइल छान्नुहोस्'}
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  स्तम्भहरू: प्रश्न (Question), विकल्प A, विकल्प B, विकल्प C, विकल्प D, सही उत्तर (A/B/C/D), सेट (१-५)
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <textarea
                rows={6}
                value={pasteText}
                onChange={e => setPasteText(e.target.value)}
                placeholder="Google Sheets वा Excel बाट प्रश्नहरूको पङ्क्तिहरू सिधै कपी गरी यहाँ पेस्ट गर्नुहोस्..."
                className="w-full p-4 rounded-2xl border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-indigo-500 outline-hidden"
              />
              <button
                type="button"
                onClick={handleParsePastedText}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
              >
                <span>पेस्ट गरिएको डेटा जाँच गर्नुहोस्</span>
              </button>
            </div>
          )}
        </div>

        {/* Error Message */}
        {parseError && (
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{parseError}</span>
          </div>
        )}

        {/* Parsed Result Summary */}
        {parsedQuestions.length > 0 && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div className="flex items-center gap-4 text-xs">
                <div>
                  <span className="text-slate-500 block">कुल प्राप्त पङ्क्ति</span>
                  <span className="text-lg font-black text-slate-900">{toNepaliDigits(parsedQuestions.length)}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">मान्य प्रश्नहरू</span>
                  <span className="text-lg font-black text-emerald-600">{toNepaliDigits(validCount)}</span>
                </div>
                {invalidCount > 0 && (
                  <div>
                    <span className="text-slate-500 block">अपूर्ण पङ्क्ति</span>
                    <span className="text-lg font-black text-red-600">{toNepaliDigits(invalidCount)}</span>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => setShowPreview(!showPreview)}
                className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>{showPreview ? 'प्रिभ्यु लुकाउनुहोस्' : 'प्रिभ्यु हेर्नुहोस्'}</span>
              </button>
            </div>

            {/* Preview Table */}
            {showPreview && (
              <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-2xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 sticky top-0 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">सेट</th>
                      <th className="py-2.5 px-3">प्रश्न</th>
                      <th className="py-2.5 px-3">विकल्पहरू (A, B, C, D)</th>
                      <th className="py-2.5 px-3">सही</th>
                      <th className="py-2.5 px-3">स्थिति</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedQuestions.map((q, idx) => (
                      <tr key={idx} className={q.isValid ? 'hover:bg-slate-50' : 'bg-red-50/50'}>
                        <td className="py-2 px-3 font-mono font-bold text-slate-500">{idx + 1}</td>
                        <td className="py-2 px-3">
                          <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-bold text-[10px]">
                            सेट {toNepaliDigits(q.setNumber)}
                          </span>
                        </td>
                        <td className="py-2 px-3 font-semibold text-slate-800 max-w-xs truncate" title={q.question}>
                          {q.question}
                        </td>
                        <td className="py-2 px-3 text-[11px] text-slate-600 max-w-xs truncate">
                          A: {q.optionA} | B: {q.optionB} | C: {q.optionC} | D: {q.optionD}
                        </td>
                        <td className="py-2 px-3 font-black text-emerald-700 font-mono">
                          {q.correctAnswer}
                        </td>
                        <td className="py-2 px-3">
                          {q.isValid ? (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                              मान्य ✓
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full" title={q.error}>
                              अपूर्ण ✗
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Modal Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
          >
            रद्द गर्नुहोस्
          </button>

          <button
            type="button"
            disabled={validCount === 0 || isSaving || isProcessing}
            onClick={handleSaveAll}
            className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 text-white font-black text-xs rounded-xl shadow-md shadow-indigo-600/25 transition cursor-pointer flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>ब्याकइन्डमा सुरक्षित गरिँदै...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>{toNepaliDigits(validCount)} वटा प्रश्नहरू आयात गरी सेभ गर्नुहोस्</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
