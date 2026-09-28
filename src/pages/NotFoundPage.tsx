import React, { useState } from 'react';
import { ShieldAlert, ArrowLeft, Home, BookOpen, RefreshCw, Sparkles, AlertOctagon } from 'lucide-react';

interface NotFoundPageProps {
  navigate: (path: string) => void;
}

const FUNNY_MEME_QUOTES = [
  {
    quote: '"One does not simply walk into a 404 restricted zone without an admit card!"',
    author: '— Gandalf, Chief Campus Proctor',
    reaction: '🧙‍♂️⛔',
  },
  {
    quote: '"I have sniffed every single server rack. There are 0 quizzes here. Please return home or I will bork!"',
    author: '— Detective Doggo, Chief Security Officer',
    reaction: '🐶🚨',
  },
  {
    quote: '"Error 404: The quiz master took this question to the top of Api Himal for meditation."',
    author: '— Campus Philosophy Department',
    reaction: '🏔️🧘',
  },
  {
    quote: '"You thought you could sneak in without your 4-digit PIN? Nice try, agent!"',
    author: '— FSU Security Matrix',
    reaction: '🕵️‍♂️🕶️',
  },
];

export const NotFoundPage: React.FC<NotFoundPageProps> = ({ navigate }) => {
  const [quoteIndex, setQuoteIndex] = useState(0);

  const nextMemeQuote = () => {
    setQuoteIndex(prev => (prev + 1) % FUNNY_MEME_QUOTES.length);
  };

  const currentMeme = FUNNY_MEME_QUOTES[quoteIndex];

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-xl w-full bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-2xl text-center space-y-6 relative overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Yellow/Black Warning Caution Banner Pattern */}
        <div className="h-2 w-full bg-[repeating-linear-gradient(45deg,#f59e0b,#f59e0b_12px,#0f172a_12px,#0f172a_24px)] rounded-full mb-2"></div>

        {/* Warning Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-100 text-red-700 text-xs font-black uppercase tracking-wider border border-red-200 shadow-2xs">
          <AlertOctagon className="w-4 h-4 text-red-600 animate-pulse" />
          <span>Error 404 • Restricted Access Zone</span>
        </div>

        {/* REQUIRED EXACT TEXT */}
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            You have entered a restricted area
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-semibold">
            तपाईं निषेधित क्षेत्र वा नभेटिएको वेब ठेगानामा आइपुग्नुभयो!
          </p>
        </div>

        {/* Funny Meme Card & Graphic */}
        <div className="relative rounded-3xl bg-gradient-to-b from-slate-950 to-slate-900 text-white p-6 sm:p-7 border border-slate-800 shadow-xl overflow-hidden group">
          {/* Neon Glow & Background Accent */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-red-500/10 rounded-full blur-2xl"></div>

          {/* Funny Meme Character / Avatar */}
          <div className="relative z-10 space-y-4">
            <div className="w-24 h-24 mx-auto rounded-3xl bg-slate-800 border-2 border-amber-400/50 flex items-center justify-center text-5xl shadow-lg shadow-amber-400/10 transform group-hover:scale-105 transition-transform duration-300">
              {currentMeme.reaction}
            </div>

            {/* Funny Meme Caption Bubble */}
            <div className="bg-slate-800/90 rounded-2xl p-4 border border-slate-700 text-left relative shadow-inner">
              <div className="text-xs text-amber-300 font-black uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>सुरक्षा मेम सन्देश (Security Meme Dispatch)</span>
              </div>
              <p className="text-sm sm:text-base font-bold text-white italic leading-snug">
                {currentMeme.quote}
              </p>
              <p className="text-[11px] text-slate-400 font-mono mt-2 text-right">
                {currentMeme.author}
              </p>
            </div>

            <button
              type="button"
              onClick={nextMemeQuote}
              className="text-[11px] text-amber-400 hover:text-amber-300 font-bold inline-flex items-center gap-1.5 bg-slate-800/80 hover:bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700 transition cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>अर्को रमाइलो मेम हेर्नुहोस् (Next Meme)</span>
            </button>
          </div>
        </div>

        {/* Clear Action Buttons to Navigate Safely Back */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="w-full sm:w-auto px-6 py-3.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-red-600/25 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>सुरक्षित गृहपृष्ठ फर्किनुहोस् (Return Home)</span>
          </button>

          <button
            onClick={() => navigate('/todays-quize')}
            className="w-full sm:w-auto px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs sm:text-sm rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <BookOpen className="w-4 h-4 text-slate-600" />
            <span>आजको क्विज खेल्नुहोस्</span>
          </button>
        </div>

        {/* Footer Warning Notice */}
        <p className="text-[10px] text-slate-400">
          Darchula Multiple Campus Weekly Quiz Portal • All Rights Reserved
        </p>
      </div>
    </div>
  );
};
