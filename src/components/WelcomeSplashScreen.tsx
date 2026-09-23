import React, { useEffect, useState } from 'react';
import { Award, Sparkles, GraduationCap, Loader2 } from 'lucide-react';

interface WelcomeSplashScreenProps {
  onComplete: () => void;
}

export const WelcomeSplashScreen: React.FC<WelcomeSplashScreenProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // 2-second duration with progress bar update every 40ms
    const intervalTime = 40;
    const totalDuration = 2000; // 2 seconds
    const step = (intervalTime / totalDuration) * 100;

    const interval = setInterval(() => {
      setProgress(prev => {
        const next = prev + step;
        if (next >= 100) {
          clearInterval(interval);
          setTimeout(onComplete, 100);
          return 100;
        }
        return next;
      });
    }, intervalTime);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-slate-950 via-red-950 to-slate-900 flex flex-col items-center justify-center p-6 select-none text-white overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-600/20 rounded-full blur-3xl pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 translate-y-1/2 w-80 h-80 bg-amber-500/15 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative z-10 max-w-2xl w-full text-center space-y-6">
        {/* Emblem / Badge */}
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-tr from-red-600 via-rose-500 to-amber-500 p-1 shadow-2xl shadow-red-500/40 animate-bounce duration-1000">
          <div className="w-full h-full bg-slate-950/80 rounded-[22px] flex items-center justify-center border border-white/20">
            <GraduationCap className="w-12 h-12 text-amber-400" />
          </div>
        </div>

        {/* Welcome Headline Badge */}
        <div>
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-500/20 border border-red-400/40 text-red-200 text-xs font-bold tracking-wide uppercase shadow-inner">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            स्ववियु (FSU) दार्चुला बहुमुखी क्याम्पस
          </span>
        </div>

        {/* Exact Requested Welcome Message */}
        <div className="space-y-3 px-2">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-amber-100 to-amber-300 leading-snug tracking-tight">
            स्वतन्त्र विद्यार्थी युनियन दार्चुला बहुमुखी क्याम्पसको साप्ताहिक हाजिरी जवाफ प्रणालीमा यहाँलाई हार्दिक स्वागत छ
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 font-medium">
            Darchula Multiple Campus — Weekly Knowledge Portal & Automatic Evaluation System
          </p>
        </div>

        {/* 2-Second Progress Indicator */}
        <div className="max-w-md mx-auto space-y-2 pt-4">
          <div className="w-full h-2 rounded-full bg-slate-800/80 overflow-hidden border border-white/10 p-0.5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-red-500 via-amber-400 to-emerald-400 transition-all duration-75"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
            <span className="flex items-center gap-1.5">
              <Loader2 className="w-3 h-3 text-amber-400 animate-spin" />
              <span>प्रणाली डाटा लोड हुँदैछ...</span>
            </span>
            <span>{Math.round(progress)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};
