import React, { useState, useEffect } from 'react';
import type { Student } from '../types/quiz';
import { BookOpen, Trophy, BarChart2, User, LogOut, Menu, X, CheckCircle, Award, ExternalLink, Clock, Phone, Mail } from 'lucide-react';
import { getLiveNepalDateTimeString } from '../lib/nepaliUtils';

interface NavbarProps {
  currentPath: string;
  navigate: (path: string) => void;
  student: Student | null;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPath, navigate, student, onLogout }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [liveNepaliDateTime, setLiveNepaliDateTime] = useState<string>('');

  useEffect(() => {
    // Initial update
    setLiveNepaliDateTime(getLiveNepalDateTimeString());

    // Live update every second for Nepal Standard Time
    const timer = setInterval(() => {
      setLiveNepaliDateTime(getLiveNepalDateTimeString());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const navItems = student
    ? [
        { label: 'ड्यासबोर्ड', path: '/dashboard', icon: BarChart2 },
        { label: 'आजको क्विज', path: '/todays-quize', icon: BookOpen },
        { label: 'विजेता सूची', path: '/winner-list', icon: Trophy },
        { label: 'मेरो स्थिति', path: '/my-status', icon: CheckCircle },
        { label: 'प्रोफाइल', path: '/profile', icon: User },
      ]
    : [
        { label: 'गृहपृष्ठ', path: '/', icon: Award },
        { label: 'आजको क्विज', path: '/todays-quize', icon: BookOpen },
        { label: 'विजेता सूची', path: '/winner-list', icon: Trophy },
        { label: 'लगइन', path: '/login', icon: User, highlight: true },
      ];

  const handleNav = (path: string) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      {/* Top Banner: Nepali Date & Time (NPT +5:45) + Campus Contact */}
      <div className="bg-slate-900 text-slate-200 text-xs py-1.5 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-1.5 text-[11px] sm:text-xs">
          <div className="flex items-center gap-2 font-medium text-amber-300">
            <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="font-mono tracking-tight">{liveNepaliDateTime}</span>
          </div>

          <div className="flex items-center gap-4 text-slate-300">
            <span className="flex items-center gap-1.5 hover:text-white transition">
              <Phone className="w-3 h-3 text-red-400" />
              <span>सम्पर्क: ९७४१८२३१२२</span>
            </span>
            <span className="hidden md:inline-flex items-center gap-1.5 hover:text-white transition">
              <Mail className="w-3 h-3 text-red-400" />
              <span>info@fsudmc.com</span>
            </span>
            {/* Direct button to main campus website fsudmc.com */}
            <a
              href="https://fsudmc.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-700/80 hover:bg-red-600 text-white font-bold transition shadow-xs text-[11px]"
            >
              <span>मुख्य क्याम्पस वेबसाइट</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 sm:h-20">
          {/* Logo / Branding */}
          <div
            onClick={() => handleNav(student ? '/dashboard' : '/')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-red-600 via-rose-600 to-amber-500 flex items-center justify-center text-white font-black text-2xl shadow-md shadow-red-500/25 group-hover:scale-105 transition-transform">
              🎓
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-base sm:text-lg text-slate-900 tracking-tight">
                  दार्चुला बहुमुखी क्याम्पस
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 hidden lg:inline-block">
                  स्ववियु (FSU)
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 font-medium leading-tight">
                साप्ताहिक हाजिरी जवाफ पोर्टल • Darchula Multiple Campus
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(item => {
              const isActive = currentPath === item.path;
              if (item.highlight) {
                return (
                  <button
                    key={item.path}
                    onClick={() => handleNav(item.path)}
                    className="ml-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-sm shadow-red-600/30 transition-all cursor-pointer"
                  >
                    {item.label}
                  </button>
                );
              }

              return (
                <button
                  key={item.path}
                  onClick={() => handleNav(item.path)}
                  className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-red-50 text-red-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}

            {/* Direct button to fsudmc.com */}
            <a
              href="https://fsudmc.com"
              target="_blank"
              rel="noopener noreferrer"
              className="ml-2 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 hover:border-red-400 bg-white hover:bg-red-50 text-slate-700 hover:text-red-700 text-xs font-bold transition shadow-2xs"
            >
              <span>fsudmc.com</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </a>

            {/* If student logged in, show user preview and logout */}
            {student && (
              <div className="flex items-center gap-2 ml-3 pl-3 border-l border-slate-200">
                <div
                  onClick={() => handleNav('/profile')}
                  className="flex items-center gap-2 px-2 py-1 rounded-xl hover:bg-slate-100 cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-200 border border-slate-300">
                    <img
                      src={student.profilePhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face'}
                      alt={student.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="text-left hidden xl:block">
                    <div className="text-xs font-bold text-slate-800 leading-tight">{student.name}</div>
                    <div className="text-[10px] text-slate-500 font-mono">{student.id}</div>
                  </div>
                </div>

                <button
                  onClick={onLogout}
                  title="लगआउट गर्नुहोस्"
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </nav>

          {/* Mobile menu trigger */}
          <div className="flex items-center gap-2 md:hidden">
            {student && (
              <div
                onClick={() => handleNav('/profile')}
                className="w-8 h-8 rounded-full overflow-hidden bg-slate-200 border border-slate-300 cursor-pointer"
              >
                <img
                  src={student.profilePhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face'}
                  alt={student.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-5 space-y-2 shadow-xl">
          {student && (
            <div className="pb-3 mb-2 border-b border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-900">{student.name}</p>
                <p className="text-xs text-slate-500 font-mono">ID: {student.id} | {student.class}</p>
              </div>
              <button
                onClick={() => {
                  onLogout();
                  setMobileMenuOpen(false);
                }}
                className="px-2.5 py-1 text-xs font-semibold text-red-600 bg-red-50 rounded-lg flex items-center gap-1"
              >
                <LogOut className="w-3.5 h-3.5" />
                लगआउट
              </button>
            </div>
          )}

          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = currentPath === item.path;
            return (
              <button
                key={item.path}
                onClick={() => handleNav(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition ${
                  isActive
                    ? 'bg-red-50 text-red-700'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-4 h-4 text-slate-400" />
                <span>{item.label}</span>
              </button>
            );
          })}

          <div className="pt-2 border-t border-slate-100">
            <a
              href="https://fsudmc.com"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold text-red-700 bg-red-50 rounded-xl"
            >
              <span>मुख्य वेबसाइट: fsudmc.com</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      )}
    </header>
  );
};
