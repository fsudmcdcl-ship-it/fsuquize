import React, { useState } from 'react';
import { Home, BookOpen, RefreshCw, Sparkles, AlertOctagon, ShieldCheck, MapPin, Compass, Trophy } from 'lucide-react';
import { dataService } from '../lib/dataService';

interface NotFoundPageProps {
  navigate: (path: string) => void;
  requestedPath?: string;
}

interface CampusExcuse {
  quote: string;
  author: string;
  reaction: string;
  statusBadge: string;
  location: string;
}

const FUNNY_CAMPUS_EXCUSES: CampusExcuse[] = [
  {
    quote: 'ओहो! क्याम्पसको कक्षाकोठा खोज्दा खोज्दै कतै बाटो बिराउनुभयो कि क्या हो? हाम्रा क्विज मास्टर यो प्रश्न र कोठा लिएर अपी हिमाल (Api Himal) को चुचुरोमा ध्यान गर्न जानुभएको छ!',
    author: '— प्रा. डा. क्विज मास्टर, दर्शनशास्त्र विभाग',
    reaction: '🏔️🧘‍♂️',
    statusBadge: 'अपि हिमालमा ध्यानमग्न',
    location: 'अपि हिमाल फेदी, दार्चुला',
  },
  {
    quote: 'तपाईंले खोजेको पृष्ठ सायद आजको पहिलो पिरियड बंक (Bunk) हानेर क्याम्पस क्यान्टिनमा चिया र तातो समोसा खान निस्कियो! घण्टी बजेपछि मात्र फर्किन्छ होला।',
    author: '— क्यान्टिन प्रमुख तथा विद्यार्थी कल्याण परिषद्',
    reaction: '☕🥟',
    statusBadge: 'क्यान्टिन समोसा ब्रेक',
    location: 'क्याम्पस क्यान्टिन तथा चौर',
  },
  {
    quote: 'बाटो काट्ने क्रममा यो वेब ठेगाना महाकाली नदीमा खसेर बग्दै भारतको धार्चुला बजारतिर पुगेको हुनसक्छ! कृपया पौडी खेलेर खोज्ने प्रयास नगर्नुहोला।',
    author: '— स्ववियु जलस्रोत तथा नदी अनुसन्धान सेल',
    reaction: '🌊🏊‍♂️',
    statusBadge: 'महाकाली नदीमा बगेको लिङ्क',
    location: 'झोलुङ्गे पुल, महाकाली किनार',
  },
  {
    quote: 'लाइब्रेरीको ५ नम्बर र्याक पछाडि यो प्रश्नपत्र खोज्दा खोज्दै हरायो। क्याम्पस प्रमुख सर राउण्डमा आउँदै हुनुहुन्छ, चुपचाप मुख्य पृष्ठमा फर्किनुहोस्!',
    author: '— क्याम्पस पुस्तकालय तथा सुरक्षा दस्ता',
    reaction: '📚🤫',
    statusBadge: 'लाइब्रेरीमा हराएको फाइल',
    location: 'केन्द्रीय पुस्तकालय कक्ष ३',
  },
  {
    quote: 'गोप्य एडमिन पोर्टल खोज्दै हुनुहुन्छ भने गलत ढोका ढकढकाउनुभयो! आधिकारिक गोप्य Slug र डिजिटल पासकोड बिना यहाँबाट अघि बढ्न निषेध गरिएको छ।',
    author: '— स्ववियु साइबर सुरक्षा विभाग (FSU Cyber Wing)',
    reaction: '🕵️‍♂️🔒',
    statusBadge: 'गोप्य सुरक्षा घेरा',
    location: 'सर्भर रुम तथा प्रशासन शाखा',
  },
];

export const NotFoundPage: React.FC<NotFoundPageProps> = ({ navigate, requestedPath }) => {
  const [excuseIndex, setExcuseIndex] = useState(0);
  const [imageError, setImageError] = useState(false);

  const currentExcuse = FUNNY_CAMPUS_EXCUSES[excuseIndex];
  const admin = dataService.getCurrentAdmin();
  const adminSlug = dataService.getAdminSlug();

  const handleNextExcuse = () => {
    setExcuseIndex(prev => (prev + 1) % FUNNY_CAMPUS_EXCUSES.length);
  };

  const displayPath = requestedPath || (typeof window !== 'undefined' ? window.location.pathname : '');

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-8 sm:py-12 bg-slate-50 selection:bg-red-500 selection:text-white">
      <div className="max-w-2xl w-full bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/90 shadow-2xl text-center space-y-6 relative overflow-hidden">
        {/* Festive Nepali Campus Ribbon pattern */}
        <div className="h-2 w-full bg-[repeating-linear-gradient(45deg,#dc2626,#dc2626_14px,#f59e0b_14px,#f59e0b_28px,#2563eb_28px,#2563eb_42px)] rounded-full -mt-2 mb-2"></div>

        {/* Official Header Badge */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 border border-red-200 text-red-700 text-xs font-black uppercase tracking-wider shadow-2xs">
            <AlertOctagon className="w-4 h-4 text-red-600 animate-pulse" />
            <span>Error 404 • पृष्ठ भेटिएन (Room Not Found)</span>
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 border border-amber-200 text-amber-800 text-xs font-bold">
            <Compass className="w-3.5 h-3.5 text-amber-600" />
            <span>{currentExcuse.statusBadge}</span>
          </span>
        </div>

        {/* Main Title & Subtitle */}
        <div className="space-y-1.5">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            ओहो! क्याम्पसमा यो कोठा वा लिङ्क भेटिएन!
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-semibold max-w-lg mx-auto">
            तपाईंले खोज्नुभएको वेब Slug वा URL दार्चुला बहुमुखी क्याम्पसको कुनै पनि विभाग वा कक्षाकोठामा दर्ता छैन।
          </p>
          {displayPath && displayPath !== '/' && (
            <div className="pt-1">
              <span className="inline-block px-3 py-1 bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs font-mono break-all font-semibold">
                अमान्य Slug / URL: <b className="text-red-600">{displayPath}</b>
              </span>
            </div>
          )}
        </div>

        {/* Funny Image & Excuse Card */}
        <div className="relative rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 text-white p-5 sm:p-7 border border-slate-800 shadow-xl overflow-hidden group text-left">
          {/* Neon Atmosphere Lighting */}
          <div className="absolute top-0 right-0 w-44 h-44 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-44 h-44 bg-red-600/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
            {/* Funny Mascot Image */}
            <div className="shrink-0 relative">
              <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-2xl overflow-hidden border-2 border-amber-400/40 shadow-xl bg-slate-800 relative group-hover:scale-[1.02] transition-transform duration-300">
                {!imageError ? (
                  <img
                    src="/campus_404_lost.jpg"
                    alt="दार्चुला क्याम्पस 404 नक्सा खोज्दै गरेको विद्यार्थी"
                    className="w-full h-full object-cover object-center"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-5xl bg-slate-800">
                    <span>{currentExcuse.reaction}</span>
                  </div>
                )}
                {/* Stamp overlay */}
                <div className="absolute bottom-1 right-1 bg-red-600/90 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow uppercase">
                  DMC-404
                </div>
              </div>
              <div className="text-[10px] text-center text-slate-400 mt-1 flex items-center justify-center gap-1">
                <MapPin className="w-3 h-3 text-red-400" />
                <span>{currentExcuse.location}</span>
              </div>
            </div>

            {/* Funny Excuse Content Bubble */}
            <div className="flex-1 space-y-3">
              <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2">
                <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>क्याम्पसको आधिकारिक रमाइलो बहाना</span>
                </span>
                <span className="text-xl" title="प्रतिक्रिया">
                  {currentExcuse.reaction}
                </span>
              </div>

              <blockquote className="text-xs sm:text-sm font-medium text-slate-100 italic leading-relaxed">
                "{currentExcuse.quote}"
              </blockquote>

              <p className="text-[11px] text-amber-300/90 font-semibold font-mono text-right">
                {currentExcuse.author}
              </p>

              {/* Cycle through jokes */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleNextExcuse}
                  className="px-3.5 py-1.5 rounded-full bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700 text-amber-300 text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin-hover" />
                  <span>अर्को रमाइलो बहाना सुन्नुहोस् (Next Campus Excuse)</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Clear Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="w-full sm:w-auto px-5 py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-red-600/25 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>🏠 मुख्य क्विज पोर्टल (Return Home)</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/todays-quize')}
            className="w-full sm:w-auto px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            <BookOpen className="w-4 h-4 text-amber-300" />
            <span>📝 आजको क्विज खेल्नुहोस्</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/winner-list')}
            className="w-full sm:w-auto px-5 py-3 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs sm:text-sm rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
          >
            <Trophy className="w-4 h-4 text-amber-600" />
            <span>🏆 विजेता सूची हेर्नुहोस्</span>
          </button>

          {admin && (
            <button
              type="button"
              onClick={() => navigate(`/${adminSlug}/dashboard`)}
              className="w-full sm:w-auto px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <ShieldCheck className="w-4 h-4 text-indigo-200" />
              <span>🛡️ एडमिन ड्यासबोर्डमा फर्कनुहोस्</span>
            </button>
          )}
        </div>

        {/* Official Footer Note */}
        <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-1">
          <span>दार्चुला बहुमुखी क्याम्पस साप्ताहिक हाजिरी जवाफ पोर्टल</span>
          <span>स्वतन्त्र विद्यार्थी युनियन (FSU Darchula)</span>
        </div>
      </div>
    </div>
  );
};
