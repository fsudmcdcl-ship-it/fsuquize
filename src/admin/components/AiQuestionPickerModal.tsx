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
  PlusCircle,
  Sliders,
  FolderPlus,
} from 'lucide-react';

interface AiQuestionPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  questions: Question[];
  quizzes: Quiz[];
  initialMode?: 'picker' | 'generate';
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

// Rich template library of academic and general knowledge questions for Darchula Multiple Campus
const KNOWLEDGE_BANK_BY_SET: Record<number, Array<{ q: string; a: string; b: string; c: string; d: string; ans: 'A' | 'B' | 'C' | 'D'; exp: string }>> = {
  1: [
    {
      q: 'दार्चुला बहुमुखी क्याम्पस त्रिभुवन विश्वविद्यालयबाट कुन वर्ष सम्बन्धन प्राप्त शैक्षिक संस्था हो?',
      a: 'वि.सं. २०४८', b: 'वि.सं. २०५३', c: 'वि.सं. २०६०', d: 'वि.सं. २०३९',
      ans: 'B', exp: 'दार्चुला बहुमुखी क्याम्पस वि.सं. २०५३ मा स्थापित सुदूरपश्चिमको एक प्रतिष्ठित शैक्षिक केन्द्र हो।'
    },
    {
      q: 'उच्च शिक्षामा सेमेष्टर प्रणाली लागू गर्ने नेपालको पहिलो विश्वविद्यालय कुन हो?',
      a: 'काठमाडौं विश्वविद्यालय', b: 'त्रिभुवन विश्वविद्यालय', c: 'पोखरा विश्वविद्यालय', d: 'सुदूरपश्चिम विश्वविद्यालय',
      ans: 'B', exp: 'त्रिभुवन विश्वविद्यालयले केन्द्रीय विभागहरूमा सर्वप्रथम सेमेष्टर प्रणाली पुनःसञ्चालन गरेको थियो।'
    },
    {
      q: 'नेपालमा विश्वविद्यालय अनुदान आयोग (UGC) को स्थापना कुन ऐन अन्तर्गत भएको हो?',
      a: 'विश्वविद्यालय अनुदान आयोग ऐन, २०५०', b: 'शिक्षा ऐन, २०२८', c: 'त्रिभुवन विश्वविद्यालय ऐन, २०४९', d: 'उच्च शिक्षा ऐन, २०६५',
      ans: 'A', exp: 'नेपालमा उच्च शिक्षाको गुणस्तर सुधार र नियमनका लागि वि.सं. २०५० मा यूजीसी गठन गरिएको हो।'
    },
    {
      q: 'दार्चुला बहुमुखी क्याम्पसमा हाल कुन-कुन संकायहरू सञ्चालनमा रहेका छन्?',
      a: 'व्यवस्थापन, मानविकी र कला', b: 'इन्जिनियरिङ र मेडिकल', c: 'कृषि र वन विज्ञान', d: 'कानुन संकाय मात्र',
      ans: 'A', exp: 'क्याम्पसले व्यवस्थापन (BBS/MBS), मानविकी (BA) तथा कला संकायहरू सफलताका साथ सञ्चालन गरिरहेको छ।'
    },
    {
      q: 'नेपालको पहिलो कलेज ‘त्रिचन्द्र कलेज’ को स्थापना कुन प्रधानमन्त्रीको पालामा भएको थियो?',
      a: 'चन्द्र शमशेर', b: 'जंगबहादुर राणा', c: 'वीर शमशेर', d: 'देव शमशेर',
      ans: 'A', exp: 'वि.सं. १९७५ मा तत्कालीन राणा प्रधानमन्त्री चन्द्र शमशेरले त्रिचन्द्र कलेजको स्थापना गरेका थिए।'
    },
    {
      q: 'त्रिभुवन विश्वविद्यालयको स्थापना वि.सं. २०१६ को कुन महिना र दिनमा भएको थियो?',
      a: 'असार ११ गते', b: 'वैशाख १५ गते', c: 'साउन १ गते', d: 'भदौ २४ गते',
      ans: 'A', exp: 'त्रिभुवन विश्वविद्यालय वि.सं. २०१६ असार ११ गते औपचारिक रूपमा स्थापना भएको हो।'
    }
  ],
  2: [
    {
      q: 'दार्चुला जिल्लाको प्रसिद्ध ऐतिहासिक कोट "उकु महल" कुन ऐतिहासिक राजासँग सम्बन्धित मानिन्छ?',
      a: 'राजा मन्धाता शाही', b: 'कत्यूरी राजवंशका पालबंशी राजाहरू', c: 'राजा जयतुङ्ग मल्ल', d: 'राजा नाग मल्ल',
      ans: 'B', exp: 'उकु भग्नावशेष ऐतिहासिक कत्यूरी तथा पाल राजाहरूको कलात्मक संस्कृतिको उत्कृष्ट नमुना हो।'
    },
    {
      q: 'नेपाली साहित्यमा मदन पुरस्कार प्राप्त गर्ने दार्चुलाका विशिष्ट साहित्यकार को हुन्?',
      a: 'डा. जगदीशचन्द्र रेग्मी', b: 'लोकेन्द्रबहादुर चन्द', c: 'डा. तीर्थबहादुर श्रेष्ठ', d: 'मोहनराज शर्मा',
      ans: 'B', exp: 'लोकेन्द्रबहादुर चन्दले ‘विसर्जन’ कथा संग्रहका लागि वि.सं. २०५४ मा मदन पुरस्कार प्राप्त गर्नुभएको थियो।'
    },
    {
      q: 'सुदूरपश्चिमको प्रसिद्ध लोकसंस्कृति ‘गौरा पर्व’ मा गाइने मौलिक गीतलाई के भनिन्छ?',
      a: 'फाग र अठ्यावाली', b: 'रोइला', c: 'हाक्पारे', d: 'सोरठी',
      ans: 'A', exp: 'गौरा पर्वमा महिलाहरूले फाग र अठ्यावाली गाएर भगवती गौरी र महेश्वरको पूजा-आराधना गर्दछन्।'
    },
    {
      q: 'नेपाली भाषाको पहिलो मौलिक महाकाव्य कुन हो?',
      a: 'शाकुन्तल महाकाव्य', b: 'भानुभक्तीय रामायण', c: 'ऋतुविचार', d: 'सुलोचना',
      ans: 'A', exp: 'महाकवि लक्ष्मीप्रसाद देवकोटाद्वारा रचित ‘शाकुन्तल’ नेपाली भाषाको पहिलो मौलिक महाकाव्य हो।'
    },
    {
      q: 'दार्चुलाको व्यास क्षेत्रमा बसोबास गर्ने शौका समुदायको परम्परागत चाड कुन हो?',
      a: 'ध्वंगचा / नम्गुन', b: 'ल्होसार', c: 'माघी', d: 'उधौली',
      ans: 'A', exp: 'शौका व्यासी समुदायको आफ्नै मौलिक चाडपर्व र भेषभूषाको विशिष्ट पहिचान रहेको छ।'
    },
    {
      q: 'आदिकवि भानुभक्त आचार्यले रामायणलाई कुन छन्दमा अनुवाद गरेका थिए?',
      a: 'शार्दूलविक्रीडित छन्द', b: 'अनुष्टुप छन्द', c: 'मन्दाक्रान्ता छन्द', d: 'वसन्ततिलका छन्द',
      ans: 'A', exp: 'भानुभक्तले रामायणका प्रायः सबै श्लोकहरू शार्दूलविक्रीडित छन्दमा अनुवाद गरेका थिए।'
    }
  ],
  3: [
    {
      q: 'कृत्रिम बौद्धिकता (Artificial Intelligence) को आधारस्तम्भ "Neural Network" कुन मानवीय प्रणालीबाट प्रेरित छ?',
      a: 'मानव मस्तिष्कको न्युरोन सञ्जाल', b: 'रक्त सञ्चार प्रणाली', c: 'पाचन प्रणाली', d: 'कंकाल प्रणाली',
      ans: 'A', exp: 'आर्टिफिसियल न्युरल नेटवर्क मानव मस्तिष्कका न्युरोनहरूको सूचना प्रशोधन विधिमा आधारित छ।'
    },
    {
      q: 'विश्वव्यापी इन्टरनेट सञ्चारलाई सुरक्षित राख्न प्रयोग गरिने क्रिप्टोग्राफिक प्रोटोकल कुन हो?',
      a: 'HTTPS / TLS', b: 'FTP', c: 'TELNET', d: 'SMTP अनइन्क्रिप्टेड',
      ans: 'A', exp: 'HTTPS (TLS) प्रोटोकलले वेब डाटालाई पूर्ण इन्क्रिप्ट गरी सुरक्षित गराउँदछ।'
    },
    {
      q: 'कम्प्युटर विज्ञानमा "Father of Artificial Intelligence" कसलाई मानिन्छ?',
      a: 'जोन म्याकार्थी (John McCarthy)', b: 'एलन ट्युरिङ (Alan Turing)', c: 'चार्ल्स ब्याबेज (Charles Babbage)', d: 'टिम बर्नर्स-ली (Tim Berners-Lee)',
      ans: 'A', exp: 'जोन म्याकार्थीले सन् १९५६ मा सर्वप्रथम ‘Artificial Intelligence’ शब्दको प्रतिपादन गरेका थिए।'
    },
    {
      q: 'स्मार्टफोन तथा आधुनिक ल्यापटपमा प्रयोग हुने SSD को पूरा रूप के हो?',
      a: 'Solid State Drive', b: 'Simple Storage Device', c: 'System Serial Disk', d: 'Super Speed Drive',
      ans: 'A', exp: 'SSD (Solid State Drive) ले चुम्बकीय डिस्क विना फ्ल्यास मेमोरी प्रयोग गरी तीव्र गतिमा डाटा भण्डारण गर्दछ।'
    },
    {
      q: 'सौर्य ऊर्जालाई सिधै विद्युत् ऊर्जामा परिणत गर्ने यन्त्रलाई के भनिन्छ?',
      a: 'फोटोभोल्टाइक सेल (Solar Cell)', b: 'डायनामो', c: 'इन्भर्टर', d: 'ट्रान्सफर्मर',
      ans: 'A', exp: 'फोटोभोल्टाइक सेलले सूर्यको प्रकाशबाट इलेक्ट्रोन उत्तेजित गराई प्रत्यक्ष विद्युत् उत्पादन गर्दछ।'
    },
    {
      q: 'खुला स्रोत अपरेटिङ सिस्टम लिनक्स (Linux) का मुख्य आविष्कारक को हुन्?',
      a: 'लिनस तोर्भाल्ड्स (Linus Torvalds)', b: 'बिल गेट्स', c: 'स्टिभ जब्स', d: 'मार्क जुकरबर्ग',
      ans: 'A', exp: 'लिनस तोर्भाल्ड्सले सन् १९९१ मा लिनक्स कर्नलको विकास गरेका थिए।'
    }
  ],
  4: [
    {
      q: 'दार्चुला जिल्लाको प्रसिद्ध अपि नाम्पा संरक्षण क्षेत्र (ANCA) कहिले घोषणा गरिएको थियो?',
      a: 'वि.सं. २०६७ (२०१० ई.सं.)', b: 'वि.सं. २०६० (२००३ ई.सं.)', c: 'वि.सं. २०७२ (२०१५ ई.सं.)', d: 'वि.सं. २०५५ (१९९८ ई.सं.)',
      ans: 'A', exp: 'अपि नाम्पा संरक्षण क्षेत्र वि.सं. २०६७ असार २८ गते १,९०३ वर्ग किलोमिटर क्षेत्रफलमा स्थापना भएको हो।'
    },
    {
      q: 'सुदूरपश्चिम प्रदेशको सर्वोच्च हिमशिखर अपि हिमालको उचाइ कति मिटर छ?',
      a: '७,१३२ मिटर', b: '७,०२२ मिटर', c: '६,८५० मिटर', d: '७,५०० मिटर',
      ans: 'A', exp: 'अपि हिमाल दार्चुलाको व्यास गाउँपालिकामा अवस्थित ७,१३२ मिटर अग्लो हिमशिखर हो।'
    },
    {
      q: 'नेपाल र भारतबीच सिमाना निर्धारण गर्ने दार्चुलाको मुख्य ऐतिहासिक नदी कुन हो?',
      a: 'महाकाली नदी', b: 'कर्णाली नदी', c: 'सेती नदी', d: 'चमेलिया नदी',
      ans: 'A', exp: 'सुगौली सन्धि (१८१६) अनुसार महाकाली नदी नेपाल र भारतबीचको पश्चिमी अन्तर्राष्ट्रिय सीमा नदी हो।'
    },
    {
      q: 'दार्चुला जिल्लाको प्रसिद्ध जलविद्युत् आयोजना ‘चमेलिया जलविद्युत्’ को क्षमता कति मेगावाट छ?',
      a: '३० मेगावाट', b: '१४ मेगावाट', c: '५० मेगावाट', d: '२२ मेगावाट',
      ans: 'A', exp: 'शैल्यशिखर नगरपालिका, दार्चुलामा अवस्थित चमेलिया जलविद्युत् आयोजना ३० मेगावाट क्षमताको हो।'
    },
    {
      q: 'नेपालको सबैभन्दा ठूलो राष्ट्रिय निकुञ्ज शे-फोक्सुन्डो कुन प्रदेशमा अवस्थित छ?',
      a: 'कर्णाली प्रदेश', b: 'सुदूरपश्चिम प्रदेश', c: 'गण्डकी प्रदेश', d: 'लुम्बिनी प्रदेश',
      ans: 'A', exp: 'शे-फोक्सुन्डो राष्ट्रिय निकुञ्ज ३,५५५ वर्ग कि.मी. क्षेत्रफलमा डोल्पा र मुगु जिल्लामा फैलिएको छ।'
    },
    {
      q: 'दार्चुला जिल्लाको सदरमुकाम खलङ्गा कुन नदीको किनारमा अवस्थित छ?',
      a: 'महाकाली नदी', b: 'नौगाड नदी', c: 'टिंकर नदी', d: 'लास्कु खोला',
      ans: 'A', exp: 'खलङ्गा महाकाली नदीको किनारमा भारतको धारचुलासँग जोडिएको एक ऐतिहासिक व्यापारिक केन्द्र हो।'
    }
  ],
  5: [
    {
      q: 'अन्तर्राष्ट्रिय ओलम्पिक कमिटी (IOC) को आदर्श वाक्य "Citius, Altius, Fortius - Communiter" मा Communiter को अर्थ के हो?',
      a: 'सँगसँगै (Together)', b: 'तीव्र (Faster)', c: 'बलियो (Stronger)', d: 'शान्ति (Peace)',
      ans: 'A', exp: 'ओलम्पिक आदर्श वाक्यमा हालै थपिएको चौथो शब्द "Communiter" को अर्थ ‘सँगसँगै’ (Together) हो।'
    },
    {
      q: 'नेपालको पहिलो नानो-स्याटेलाइट ‘नेपाली स्याट–१’ अन्तरिक्षमा कहिले प्रक्षेपण गरिएको थियो?',
      a: 'वि.सं. २०७६ वैशाख ५ (२०१९ अप्रिल १८)', b: 'वि.सं. २०७५ असोज १० (२०१८ सेप्टेम्बर २६)', c: 'वि.सं. २०७८ जेठ २ (२०२१ मे १६)', d: 'वि.सं. २०७४ माघ १५ (२०१८ जनवरी २९)',
      ans: 'A', exp: 'नेपाली स्याट-१ भर्जिनियास्थित नासाको अन्तरिक्ष केन्द्रबाट २०१९ अप्रिल १८ मा प्रक्षेपण भएको थियो।'
    },
    {
      q: 'संयुक्त राष्ट्रसंघ (UN) को वर्तमान महासचिव एन्टोनियो गुटेरेस कुन देशका नागरिक हुन्?',
      a: 'पोर्चुगल', b: 'स्पेन', c: 'ब्राजिल', d: 'इटाली',
      ans: 'A', exp: 'एन्टोनियो गुटेरेस पोर्चुगलका पूर्व प्रधानमन्त्री तथा संयुक्त राष्ट्रसंघका नवौं महासचिव हुन्।'
    },
    {
      q: 'आईसीसी टी-२० विश्वकप क्रिकेट प्रतियोगितामा नेपालले पहिलोपटक कुन वर्ष सहभागिता जनाएको थियो?',
      a: 'सन् २०१४ (बंगलादेश)', b: 'सन् २०१६ (भारत)', c: 'सन् २०२२ (अस्ट्रेलिया)', d: 'सन् २०१८ (दक्षिण अफ्रिका)',
      ans: 'A', exp: 'नेपालले सन् २०१४ मा बंगलादेशमा सम्पन्न टी-२० विश्वकपमा पहिलोपटक सहभागिता जनाएको थियो।'
    },
    {
      q: 'सन् २०२४ को ग्रीष्मकालीन ओलम्पिक खेलकुद (Summer Olympics) कुन शहरमा आयोजना भएको थियो?',
      a: 'पेरिस, फ्रान्स', b: 'टोकियो, जापान', c: 'लस एन्जलस, अमेरिका', d: 'लन्डन, बेलायत',
      ans: 'A', exp: '३३औं ग्रीष्मकालीन ओलम्पिक खेलकुद फ्रान्सको राजधानी पेरिसमा भव्य रूपमा सम्पन्न भयो।'
    },
    {
      q: 'दिगो विकास लक्ष्य (SDGs) अन्तर्गत सन् २०३० सम्म हासिल गर्न तय गरिएका मुख्य लक्ष्य संख्या कति छन्?',
      a: '१७ वटा', b: '१५ वटा', c: '२१ वटा', d: '१० वटा',
      ans: 'A', exp: 'संयुक्त राष्ट्रसंघले सन् २०१५ देखि २०३० सम्मका लागि १७ वटा मुख्य दिगो विकास लक्ष्यहरू निर्धारण गरेको छ।'
    }
  ]
};

export const AiQuestionPickerModal: React.FC<AiQuestionPickerModalProps> = ({
  isOpen,
  onClose,
  questions,
  quizzes,
  initialMode = 'picker',
  onApplyToQuiz,
  onQuestionsUpdated,
}) => {
  const [pickedQuestions, setPickedQuestions] = useState<Question[]>([]);
  const [targetType, setTargetType] = useState<'existing' | 'new_quiz'>('existing');
  const [selectedQuizId, setSelectedQuizId] = useState<string>(quizzes[0]?.id || 'quiz_week_12');
  const [newQuizTitle, setNewQuizTitle] = useState<string>(() => `साप्ताहिक क्याम्पस क्विज - हप्ता ${quizzes.length + 1}`);
  const [newQuizDesc, setNewQuizDesc] = useState<string>('सामान्य ज्ञान, शिक्षा, विज्ञान तथा समसामयिक विषयहरूमा आधारित १० मिनेटको बौद्धिक प्रतियोगिता।');
  const [questionCountChoice, setQuestionCountChoice] = useState<number>(10);
  const [topicFocus, setTopicFocus] = useState<string>('all');
  const [isShuffling, setIsShuffling] = useState(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [appliedSuccess, setAppliedSuccess] = useState(false);
  const [appliedMessage, setAppliedMessage] = useState<string>('');
  const [copiedSuccess, setCopiedSuccess] = useState(false);
  const [mode, setMode] = useState<'picker' | 'generate'>(initialMode);

  // Perform random non-sequential picking of 10 questions across sets
  const executeRandomPick = () => {
    setIsShuffling(true);
    setTimeout(() => {
      const random10 = dataService.pick10RandomQuestions();
      setPickedQuestions(random10);
      setIsShuffling(false);
      setAppliedSuccess(false);
    }, 280);
  };

  useEffect(() => {
    if (isOpen) {
      if (initialMode === 'generate') {
        setMode('generate');
      }
      executeRandomPick();
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  // Apply to Quiz
  const handleApplyQuestions = () => {
    if (!pickedQuestions.length) return;

    if (targetType === 'new_quiz') {
      // 1. Create a brand new quiz
      const now = new Date();
      const newQuiz = dataService.createQuiz({
        title: newQuizTitle.trim() || `साप्ताहिक क्याम्पस क्विज - हप्ता ${quizzes.length + 1}`,
        description: newQuizDesc.trim(),
        durationMinutes: 10,
        questionCount: 10,
        totalBankQuestions: pickedQuestions.length,
        status: 'active',
        showInFrontend: true,
        startAt: now.toISOString(),
        endAt: new Date(now.getTime() + 72 * 60 * 60 * 1000).toISOString(),
      }, 'admin_ai@fsudmc.com');

      // 2. Attach generated questions to this new quiz
      pickedQuestions.forEach(q => {
        dataService.saveQuestion({
          ...q,
          quizId: newQuiz.id,
        }, 'admin_ai@fsudmc.com');
      });

      // 3. Set as active quiz
      dataService.setActiveQuiz(newQuiz.id, 'admin_ai@fsudmc.com');

      setAppliedMessage(`🎉 नयाँ क्विज "${newQuiz.title}" सफलतापूर्वक सिर्जना भयो र ${pickedQuestions.length} AI प्रश्नहरू सुरक्षित गरियो!`);
    } else {
      // Apply to existing selected quiz
      pickedQuestions.forEach(q => {
        dataService.saveQuestion({
          ...q,
          quizId: selectedQuizId,
        }, 'admin_ai@fsudmc.com');
      });

      if (onApplyToQuiz) {
        onApplyToQuiz(pickedQuestions, selectedQuizId);
      }

      setAppliedMessage(`✅ ${pickedQuestions.length} प्रश्नहरू सफलतापूर्वक क्विजमा सुरक्षित गरियो!`);
    }

    onQuestionsUpdated?.();
    setAppliedSuccess(true);
    setTimeout(() => {
      setAppliedSuccess(false);
    }, 4500);
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

  // AI Generator: Dynamically assemble new questions according to chosen options
  const handleGenerateAiQuestions = async () => {
    setIsGeneratingAi(true);
    try {
      await new Promise(r => setTimeout(r, 600));

      const generated: Question[] = [];
      const count = questionCountChoice;
      const targetQuiz = targetType === 'existing' ? selectedQuizId : 'new_quiz';

      // Gather candidate pool
      const setPools: Record<number, Array<{ q: string; a: string; b: string; c: string; d: string; ans: 'A' | 'B' | 'C' | 'D'; exp: string }>> = {
        1: [...KNOWLEDGE_BANK_BY_SET[1]],
        2: [...KNOWLEDGE_BANK_BY_SET[2]],
        3: [...KNOWLEDGE_BANK_BY_SET[3]],
        4: [...KNOWLEDGE_BANK_BY_SET[4]],
        5: [...KNOWLEDGE_BANK_BY_SET[5]],
      };

      // Shuffle each pool
      for (let s = 1; s <= 5; s++) {
        setPools[s].sort(() => Math.random() - 0.5);
      }

      let setCycle = 1;
      for (let i = 0; i < count; i++) {
        let setNum = setCycle;
        if (topicFocus !== 'all') {
          const forcedSet = parseInt(topicFocus, 10);
          if (forcedSet >= 1 && forcedSet <= 5) setNum = forcedSet;
        }

        const pool = setPools[setNum];
        const raw = pool[i % pool.length];

        generated.push({
          id: `q_ai_${Date.now()}_${i + 1}`,
          quizId: targetQuiz,
          setNumber: (setNum >= 1 && setNum <= 5 ? setNum : 1) as 1 | 2 | 3 | 4 | 5,
          question: raw.q,
          optionA: raw.a,
          optionB: raw.b,
          optionC: raw.c,
          optionD: raw.d,
          correctAnswer: raw.ans,
          explanation: raw.exp,
        });

        setCycle = (setCycle % 5) + 1;
      }

      // Shuffle order
      generated.sort(() => Math.random() - 0.5);

      setPickedQuestions(generated);
      setMode('picker');
      setAppliedSuccess(false);
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
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 via-rose-500 to-red-600 flex items-center justify-center shadow-lg text-white font-black">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[11px] font-bold">
                <Cpu className="w-3.5 h-3.5" />
                <span>AI स्वचालित क्विज तथा प्रश्न निर्माता (AI Quiz & Question Generator)</span>
              </div>
              <h2 className="text-xl font-black text-white mt-1">
                नयाँ क्विज र बहुवैकल्पिक प्रश्न निर्माण उपकरण
              </h2>
              <p className="text-xs text-slate-300">
                नयाँ क्विज सिर्जना गर्नुहोस् वा विद्यमान क्विजका लागि ५ विषयगत सेटहरूबाट उच्चस्तरीय प्रश्नहरू तयार गर्नुहोस्।
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
              onClick={() => setMode('generate')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                mode === 'generate'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>✨ नयाँ AI प्रश्न र क्विज निर्माण (AI Generator)</span>
            </button>

            <button
              onClick={() => setMode('picker')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                mode === 'picker'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Shuffle className="w-3.5 h-3.5" />
              <span>अनियमित प्रश्न पूर्वावलोकन ({toNepaliDigits(pickedQuestions.length)} वटा)</span>
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
                  <span>पाठ प्रतिलिपि</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {appliedSuccess && (
            <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-2xl text-xs font-bold flex items-center gap-2.5 animate-in fade-in shadow-xs">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{appliedMessage || 'सफलतापूर्वक सुरक्षित गरियो!'}</span>
            </div>
          )}

          {mode === 'generate' ? (
            <div className="bg-gradient-to-br from-indigo-50/80 via-white to-purple-50/80 border border-indigo-200 rounded-3xl p-6 sm:p-7 space-y-6 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md">
                  <Sparkles className="w-6 h-6 text-amber-300" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900">
                    AI बाट नयाँ क्विज र प्रश्नहरूको स्वचालित उत्पादन
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    त्रिभुवन विश्वविद्यालय, दार्चुला बहुमुखी क्याम्पस, विज्ञान, प्रविधि, साहित्य र समसामयिक विषयमा आधारित नयाँ प्रश्नहरू उत्पन्न गर्नुहोस्।
                  </p>
                </div>
              </div>

              {/* Target Quiz Selection: New vs Existing */}
              <div className="space-y-3 p-4 bg-white rounded-2xl border border-slate-200">
                <label className="text-xs font-black text-slate-800 uppercase tracking-wider block">
                  १. क्विज गन्तव्य छनोट गर्नुहोस् (Quiz Target):
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setTargetType('new_quiz')}
                    className={`p-3.5 rounded-2xl border text-left transition cursor-pointer flex items-start gap-2.5 ${
                      targetType === 'new_quiz'
                        ? 'border-indigo-600 bg-indigo-50/80 text-indigo-950 ring-2 ring-indigo-400 font-bold'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <FolderPlus className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-bold">✨ नयाँ क्विज सिर्जना गर्नुहोस्</div>
                      <div className="text-[11px] text-slate-500 font-normal">
                        नयाँ साप्ताहिक क्विज स्वतः खोलेर AI प्रश्नहरू सुरक्षित गर्ने
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTargetType('existing')}
                    className={`p-3.5 rounded-2xl border text-left transition cursor-pointer flex items-start gap-2.5 ${
                      targetType === 'existing'
                        ? 'border-indigo-600 bg-indigo-50/80 text-indigo-950 ring-2 ring-indigo-400 font-bold'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <BookOpen className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-bold">विद्यमान क्विजमा थप्नुहोस्</div>
                      <div className="text-[11px] text-slate-500 font-normal">
                        पहिले नै बनेको क्विजको प्रश्न बैङ्कमा थप्ने
                      </div>
                    </div>
                  </button>
                </div>

                {targetType === 'new_quiz' ? (
                  <div className="space-y-3 pt-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        नयाँ क्विजको शीर्षक (New Quiz Title):
                      </label>
                      <input
                        type="text"
                        value={newQuizTitle}
                        onChange={e => setNewQuizTitle(e.target.value)}
                        placeholder="उदा: साप्ताहिक क्याम्पस क्विज - हप्ता १३"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        क्विज विवरण (Description):
                      </label>
                      <input
                        type="text"
                        value={newQuizDesc}
                        onChange={e => setNewQuizDesc(e.target.value)}
                        placeholder="क्विजको उद्देश्य तथा संक्षिप्त विवरण"
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-700 bg-white"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      विद्यमान क्विज छान्नुहोस्:
                    </label>
                    <select
                      value={selectedQuizId}
                      onChange={e => setSelectedQuizId(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold bg-white text-slate-800"
                    >
                      {quizzes.map(q => (
                        <option key={q.id} value={q.id}>
                          {q.title} ({q.status === 'active' ? 'सक्रिय' : q.status === 'draft' ? 'मस्यौदा' : 'बन्द'})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Topic & Count Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    २. विषयवस्तु छनोट (Topic Focus):
                  </label>
                  <select
                    value={topicFocus}
                    onChange={e => setTopicFocus(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold bg-white text-slate-800"
                  >
                    <option value="all">सबै ५ वटा सेटहरू (समानुपातिक ५ सेट विभाजन)</option>
                    <option value="1">सेट १: क्याम्पस, शिक्षा र शैक्षिक ज्ञान</option>
                    <option value="2">सेट २: नेपाली साहित्य, संस्कृति र इतिहास</option>
                    <option value="3">सेट ३: विज्ञान, सूचना प्रविधि र आविष्कार</option>
                    <option value="4">सेट ४: नेपालको भूगोल, सम्पदा र वातावरण</option>
                    <option value="5">सेट ५: समसामयिक ज्ञान, खेलकुद र बौद्धिक</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    ३. प्रश्न संख्या (Questions Quantity):
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[10, 20, 30, 50].map(cnt => (
                      <button
                        key={cnt}
                        type="button"
                        onClick={() => setQuestionCountChoice(cnt)}
                        className={`py-2 px-1 rounded-xl text-xs font-bold border transition cursor-pointer ${
                          questionCountChoice === cnt
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {toNepaliDigits(cnt)} वटा
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Generate Trigger Button */}
              <button
                disabled={isGeneratingAi}
                onClick={handleGenerateAiQuestions}
                className="w-full py-3.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-lg shadow-indigo-600/25 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isGeneratingAi ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>AI नयाँ प्रश्नहरू सिर्जना गर्दैछ...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>
                      {toNepaliDigits(questionCountChoice)} नयाँ AI प्रश्नहरू तुरुन्त सिर्जना गर्नुहोस्
                    </span>
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
                तयार प्रश्नहरू: <b>{toNepaliDigits(pickedQuestions.length)}</b> वटा (सेटहरूबाट व्यवस्थित)
              </span>
            </div>
            <div className="text-[11px] text-amber-800 font-medium">
              तलका प्रश्नहरू अध्ययन गरी सिधै क्विजमा लागू गर्न सकिन्छ।
            </div>
          </div>

          {/* Selected / Generated Questions List */}
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
            {targetType === 'new_quiz' ? (
              <span className="text-xs font-bold text-indigo-700">
                लक्ष्य: नयाँ क्विज सिर्जना हुनेछ
              </span>
            ) : (
              <>
                <span className="text-xs font-bold text-slate-600">क्विज:</span>
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
              </>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
            >
              बन्द गर्नुहोस्
            </button>

            <button
              onClick={handleApplyQuestions}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
            >
              {appliedSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                  <span>सफलतापूर्वक लागू भयो!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>
                    {targetType === 'new_quiz'
                      ? 'नयाँ क्विज बनाएर प्रश्नहरू सुरक्षित गर्नुहोस्'
                      : 'क्विजमा प्रश्नहरू सुरक्षित / लागू गर्नुहोस्'}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
