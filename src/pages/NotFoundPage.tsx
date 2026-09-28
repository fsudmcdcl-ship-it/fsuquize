import React, { useState } from 'react';
import { Home, AlertOctagon, Sparkles, MapPin, Skull } from 'lucide-react';

interface NotFoundPageProps {
  navigate: (path: string) => void;
  requestedPath?: string;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({ navigate, requestedPath }) => {
  const [imageError, setImageError] = useState(false);

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
            <span>Error 404 • पृष्ठ भेटिएन</span>
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 border border-amber-200 text-amber-900 text-xs font-bold">
            <Skull className="w-3.5 h-3.5 text-amber-600" />
            <span>निषेधित पृष्ठ (The Forbidden Page)</span>
          </span>
        </div>

        {/* Main Title & Subtitle */}
        <div className="space-y-1.5">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            कसरी फेला पार्यौ यो पृष्ठ तिमीले?
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-semibold max-w-lg mx-auto">
            तपाईंले खोज्नुभएको वेब Slug वा URL क्याम्पस पोर्टलको कुनै पनि विभाग वा कक्षाकोठामा दर्ता छैन।
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
                    <span>😱</span>
                  </div>
                )}
                {/* Stamp overlay */}
                <div className="absolute bottom-1 right-1 bg-red-600/90 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow uppercase">
                  FORBIDDEN 404
                </div>
              </div>
              <div className="text-[10px] text-center text-slate-400 mt-1 flex items-center justify-center gap-1">
                <MapPin className="w-3 h-3 text-red-400" />
                <span>निषेधित क्षेत्र • दार्चुला क्याम्पस</span>
              </div>
            </div>

            {/* Funny Quote Bubble */}
            <div className="flex-1 space-y-3">
              <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2">
                <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>क्याम्पसको आधिकारिक चेतावनी तथा श्राप</span>
                </span>
                <span className="text-xl" title="चेतावनी">
                  👻⚡
                </span>
              </div>

              {/* Exact user requested funny quote */}
              <blockquote className="text-sm sm:text-base font-semibold text-amber-200 italic leading-relaxed border-l-2 border-amber-400 pl-3">
                “कसरी फेला पार्यौ यो पृष्ठ तिमीले? तिमीले अहिले निषेधित पृष्ठ (The Forbidden Page) फेला पारेका छौ। यदि तिमीले यो वेबसाइट आफ्ना १० जना साथीहरूलाई सेयर गरेनौ भने, तिमी अर्को परीक्षामा फेल हुनेछौ!”
              </blockquote>

              <p className="text-[11px] text-slate-300 font-mono italic opacity-90 pl-3">
                “How find this page you? You have now found the forbidden page. If you don't share this website to 10 friends you will fail in next exam.”
              </p>

              <p className="text-[11px] text-amber-400/90 font-semibold font-mono text-right pt-1">
                — परीक्षा नियन्त्रण तथा सुरक्षा दस्ता, दार्चुला क्याम्पस 😈📜
              </p>
            </div>
          </div>
        </div>

        {/* ONLY Return to Main Page Button */}
        <div className="pt-2 flex justify-center">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-700 hover:to-rose-800 text-white font-extrabold text-sm sm:text-base rounded-2xl shadow-lg shadow-red-600/30 hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2.5 cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <Home className="w-5 h-5" />
            <span>मुख्य पृष्ठमा फर्कनुहोस् (Return to Main Page)</span>
          </button>
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
