import React from 'react';
import type { Student, Quiz, WinnerRecord } from '../types/quiz';
import { toNepaliDigits, formatNepalDate, getRemainingAvailability } from '../lib/nepaliUtils';
import { BookOpen, Trophy, CheckCircle, ArrowRight, UserCheck, ShieldCheck, Clock, Award } from 'lucide-react';

interface HomePageProps {
  navigate: (path: string) => void;
  student: Student | null;
  activeQuiz: Quiz | null;
  recentWinner: WinnerRecord | null;
}

export const HomePage: React.FC<HomePageProps> = ({
  navigate,
  student,
  activeQuiz,
  recentWinner,
}) => {
  const availability = activeQuiz ? getRemainingAvailability(activeQuiz.endAt) : null;

  return (
    <div className="space-y-12 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-red-600 via-rose-700 to-slate-900 text-white pt-16 pb-20 px-4 sm:px-6 lg:px-8 rounded-b-3xl shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff15_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none"></div>
        <div className="max-w-4xl mx-auto text-center relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-rose-100 text-xs font-bold tracking-wide uppercase">
            <span>🏛️</span>
            <span>स्ववियु — दार्चुला बहुमुखी क्याम्पस (Darchula Multiple Campus)</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
            साप्ताहिक हाजिरी जवाफ प्रतियोगिता
          </h1>

          <p className="text-base sm:text-lg text-rose-100/90 font-medium max-w-2xl mx-auto leading-relaxed">
            "आफ्नो ज्ञान परीक्षण गर्नुहोस्, नयाँ कुरा सिक्नुहोस् र दार्चुला बहुमुखी क्याम्पसको साप्ताहिक विजेता बन्नुहोस्।"
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <button
              onClick={() => navigate('/todays-quize')}
              className="px-6 py-3.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-base shadow-lg shadow-amber-500/25 transition-all transform hover:-translate-y-0.5 flex items-center gap-2 cursor-pointer"
            >
              <BookOpen className="w-5 h-5" />
              <span>क्विज हेर्नुहोस्</span>
            </button>

            {student ? (
              <button
                onClick={() => navigate('/dashboard')}
                className="px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/30 text-white font-bold text-base transition-all cursor-pointer flex items-center gap-2"
              >
                <span>ड्यासबोर्डमा जानुहोस्</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/30 text-white font-bold text-base transition-all cursor-pointer flex items-center gap-2"
              >
                <span>लगइन गर्नुहोस्</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick Stats Banner */}
          <div className="pt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10 text-center">
              <div className="text-2xl font-black text-amber-300">१०</div>
              <div className="text-xs text-rose-100 font-medium">प्रश्नहरू</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10 text-center">
              <div className="text-2xl font-black text-amber-300">१० मिनेट</div>
              <div className="text-xs text-rose-100 font-medium">समय सीमा</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10 text-center">
              <div className="text-2xl font-black text-amber-300">७२ घण्टा</div>
              <div className="text-xs text-rose-100 font-medium">क्विज अवधि</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10 text-center">
              <div className="text-2xl font-black text-amber-300">१००%</div>
              <div className="text-xs text-rose-100 font-medium">निष्पक्ष प्रणाली</div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Active Quiz & Recent Winner Spotlight */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Active Quiz Card */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-50 rounded-full blur-2xl pointer-events-none"></div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">
                  <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
                  आजको क्विज
                </span>

                {availability && !availability.isExpired && (
                  <span className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200/70 px-2.5 py-1 rounded-lg flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {availability.text}
                  </span>
                )}
              </div>

              {activeQuiz ? (
                <>
                  <h3 className="text-2xl font-black text-slate-900 mb-2">
                    {activeQuiz.title}
                  </h3>
                  <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                    {activeQuiz.description}
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div>
                      <span className="text-xs text-slate-400 block font-medium">प्रश्न संख्या</span>
                      <span className="text-base font-bold text-slate-800">१० प्रश्न (५ सेटबाट)</span>
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 block font-medium">कुल समय</span>
                      <span className="text-base font-bold text-slate-800">१० मिनेट</span>
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <span className="text-xs text-slate-400 block font-medium">उपलब्ध समय</span>
                      <span className="text-xs font-bold text-slate-700">
                        {formatNepalDate(activeQuiz.endAt, false)} सम्म
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="py-8 text-center text-slate-500">
                  हाल कुनै क्विज सक्रिय छैन।
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                onClick={() => navigate('/todays-quize')}
                className="w-full sm:w-auto px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-xl shadow-sm transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>क्विज विवरण हेर्नुहोस्</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {!student && (
                <button
                  onClick={() => navigate('/register')}
                  className="w-full sm:w-auto px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl transition cursor-pointer"
                >
                  नयाँ विद्यार्थी दर्ता
                </button>
              )}
            </div>
          </div>

          {/* Recent Winners Card */}
          <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  <Trophy className="w-3.5 h-3.5 text-amber-400" />
                  पछिल्ला विजेताहरू
                </span>
                <button
                  onClick={() => navigate('/winner-list')}
                  className="text-xs text-amber-400 hover:underline font-semibold"
                >
                  सबै हेर्नुहोस् →
                </button>
              </div>

              {recentWinner && recentWinner.first ? (
                <div className="space-y-4">
                  <div className="text-xs text-slate-400">{recentWinner.quizTitle}</div>

                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-xl bg-amber-400 text-slate-950 font-black text-2xl flex items-center justify-center shadow-md shrink-0">
                      🥇
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[10px] uppercase font-bold text-amber-300">प्रथम स्थान</div>
                      <div className="text-base font-bold text-white truncate">{recentWinner.first.name}</div>
                      <div className="text-xs text-slate-300">
                        कक्षा: {recentWinner.first.class} | रोल: {toNepaliDigits(recentWinner.first.rollNo)}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-lg font-black text-amber-300">
                        {toNepaliDigits(recentWinner.first.score)}/१०
                      </div>
                    </div>
                  </div>

                  {recentWinner.second && (
                    <div className="bg-white/5 rounded-xl p-3 border border-white/5 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-base">🥈</span>
                        <span className="font-semibold text-slate-200">{recentWinner.second.name}</span>
                        <span className="text-slate-400">({recentWinner.second.class})</span>
                      </div>
                      <span className="font-bold text-slate-300">{toNepaliDigits(recentWinner.second.score)}/१०</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-8 text-center text-slate-400 text-sm">
                  विजेता घोषणा छिट्टै हुनेछ।
                </div>
              )}
            </div>

            <button
              onClick={() => navigate('/winner-list')}
              className="mt-6 w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs transition border border-white/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>पूर्ण विजेता सूची तथा बधाई पोस्टर</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* How to Participate Section (Requirement 57) */}
        <section className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-xs">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-bold text-red-600 uppercase tracking-widest block mb-1">
              सहज सहभागिता प्रक्रिया
            </span>
            <h2 className="text-3xl font-black text-slate-900">क्विजमा कसरी सहभागी हुने?</h2>
            <p className="text-slate-600 text-sm mt-2">
              क्याम्पसका सम्पूर्ण विद्यार्थीहरूले सहजै सहभागी हुन सक्ने गरी सरल प्रक्रिया तय गरिएको छ।
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 relative group hover:border-red-200 transition">
              <div className="w-9 h-9 rounded-xl bg-red-100 text-red-700 font-black text-base flex items-center justify-center mb-3">
                १
              </div>
              <h3 className="font-bold text-slate-900 mb-1">विद्यार्थी दर्ता</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                आफ्नो नाम, रोल नम्बर, कक्षा, सेमेस्टर र फोन नम्बर प्रविष्ट गरी प्रोफाइल फोटोसहित दर्ता गर्नुहोस्।
              </p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 relative group hover:border-red-200 transition">
              <div className="w-9 h-9 rounded-xl bg-red-100 text-red-700 font-black text-base flex items-center justify-center mb-3">
                २
              </div>
              <h3 className="font-bold text-slate-900 mb-1">ID र पासकोड</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                स्वतः प्राप्त विद्यार्थी ID र आफ्नो ४ अंकको पासकोड प्रयोग गरी पोर्टलमा सुरक्षित लगइन गर्नुहोस्।
              </p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 relative group hover:border-red-200 transition">
              <div className="w-9 h-9 rounded-xl bg-red-100 text-red-700 font-black text-base flex items-center justify-center mb-3">
                ३
              </div>
              <h3 className="font-bold text-slate-900 mb-1">१० प्रश्न, १० मिनेट</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                ५ वटा सेटबाट छानिएका १० बहुवैकल्पिक प्रश्नहरूको उत्तर १० मिनेटको समयसीमाभित्र सुरक्षित बुझाउनुहोस्।
              </p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 relative group hover:border-red-200 transition">
              <div className="w-9 h-9 rounded-xl bg-red-100 text-red-700 font-black text-base flex items-center justify-center mb-3">
                ४
              </div>
              <h3 className="font-bold text-slate-900 mb-1">स्वचालित मूल्याङ्कन</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                क्विज बुझाउनासाथ सही उत्तर र आफ्नो प्राप्तांक हेर्नुहोस्। उत्कृष्ट भएर साप्ताहिक विजेता बन्नुहोस्!
              </p>
            </div>
          </div>

          {/* 3 Mandatory Rules of Winning */}
          <div className="mt-8 pt-6 border-t border-slate-200">
            <div className="text-center mb-6">
              <span className="text-[11px] font-bold text-amber-700 bg-amber-100 px-3 py-1 rounded-full uppercase tracking-wider">
                नियम तथा मापदण्ड
              </span>
              <h3 className="text-xl font-black text-slate-900 mt-2">
                🏆 विजेता छनोटका ३ अनिवार्य नियमहरू (Rules of Winning)
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                विजेता घोषणा गर्दा क्याम्पस प्रशासनद्वारा पूर्ण निष्पक्ष र स्वचालित मापदण्ड अपनाइनेछ:
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-amber-50 to-orange-50/50 p-5 rounded-2xl border border-amber-200 relative shadow-2xs">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 font-black text-sm flex items-center justify-center mb-2.5 shadow-xs">
                  १
                </div>
                <h4 className="font-bold text-slate-900 text-sm mb-1">सर्वोच्च अंक (Highest Score)</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  सबैभन्दा पहिलो प्राथमिकता प्राप्तांकलाई दिइनेछ। सबैभन्दा बढी अंक (१० पूर्णाङ्क) प्राप्त गर्ने विद्यार्थी पहिलो प्राथमिकतामा पर्नेछन्।
                </p>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-indigo-50/50 p-5 rounded-2xl border border-blue-200 relative shadow-2xs">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white font-black text-sm flex items-center justify-center mb-2.5 shadow-xs">
                  २
                </div>
                <h4 className="font-bold text-slate-900 text-sm mb-1">न्यूनतम समय (Shortest Time)</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  यदि दुई वा सोभन्दा बढी विद्यार्थीहरूको अंक बराबर भएमा, कम समय (छिटो सेकेन्ड) मा क्विज पूरा गर्ने विद्यार्थीलाई अगाडि राखिनेछ।
                </p>
              </div>

              <div className="bg-gradient-to-br from-rose-50 to-red-50/50 p-5 rounded-2xl border border-rose-200 relative shadow-2xs">
                <div className="w-8 h-8 rounded-xl bg-rose-600 text-white font-black text-sm flex items-center justify-center mb-2.5 shadow-xs">
                  ३
                </div>
                <h4 className="font-bold text-slate-900 text-sm mb-1">गोलाप्रथा (Lottery Draw)</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  यदि अंक र समय दुवै ठ्याक्कै समान भएमा, पारदर्शी गोलाप्रथा (Lucky Draw / Lottery Wheel) मार्फत शीर्ष ३ विजेताहरू (१st, २nd, ३rd) छनोट गरिनेछ।
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Security & Authenticity Banner */}
        <section className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-red-600/20 text-red-500 border border-red-500/30 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-white">निष्पक्ष र भरपर्दो मूल्याङ्कन</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                नेपाल मानक समय (Asia/Kathmandu), सर्भर-आधारित समयसीमा र सुरक्षित ¥यान्डम प्रश्न प्रणाली।
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate('/todays-quize')}
            className="shrink-0 px-6 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs shadow transition cursor-pointer"
          >
            अहिले सहभागी हुनुहोस्
          </button>
        </section>
      </div>
    </div>
  );
};
