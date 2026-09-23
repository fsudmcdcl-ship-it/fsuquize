import React, { useState } from 'react';
import type { AdminUser } from '../types/quiz';
import {
  LayoutDashboard,
  BookOpen,
  Users,
  HelpCircle,
  FileCheck2,
  Trophy,
  FileSpreadsheet,
  Settings,
  LogOut,
  ExternalLink,
  Menu,
  X,
  ShieldAlert
} from 'lucide-react';
import { formatNepalDate } from '../lib/nepaliUtils';

interface AdminLayoutProps {
  currentPath: string;
  admin: AdminUser;
  adminSlug: string;
  navigate: (path: string) => void;
  onLogout: () => void;
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  currentPath,
  admin,
  adminSlug,
  navigate,
  onLogout,
  children,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const prefix = `/${adminSlug}`;

  const menuItems = [
    { label: 'ड्यासबोर्ड', path: `${prefix}/dashboard`, icon: LayoutDashboard },
    { label: 'साप्ताहिक क्विज व्यवस्थापन', path: `${prefix}/quizzes`, icon: BookOpen },
    { label: 'विद्यार्थी व्यवस्थापन', path: `${prefix}/students`, icon: Users },
    { label: 'प्रश्न बैङ्क (५० प्रश्न)', path: `${prefix}/questions`, icon: HelpCircle },
    { label: 'उत्तर तथा सबमिसन', path: `${prefix}/submissions`, icon: FileCheck2 },
    { label: 'नतिजा तथा विजेता', path: `${prefix}/winners`, icon: Trophy },
    { label: 'डाउनलोड / एक्सल रिपोर्ट', path: `${prefix}/reports`, icon: FileSpreadsheet },
    { label: 'सेटिङ र फायरबेस', path: `${prefix}/settings`, icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row font-sans">
      {/* Mobile Top Header */}
      <div className="md:hidden bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center font-bold">
            🛡️
          </div>
          <div>
            <span className="font-extrabold text-sm block">क्विज मास्टर</span>
            <span className="text-[10px] text-slate-400 font-mono">/{adminSlug}</span>
          </div>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg bg-slate-800 text-slate-200"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-30 h-screen w-64 bg-slate-900 text-slate-300 flex flex-col justify-between border-r border-slate-800 transition-transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div>
          {/* Logo Area */}
          <div className="p-6 border-b border-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center text-white text-lg font-bold shadow-md shadow-red-600/30 shrink-0">
              🎓
            </div>
            <div>
              <div className="font-black text-white text-base tracking-tight leading-tight">
                FSU DMC
              </div>
              <div className="text-[10px] text-red-400 font-bold uppercase tracking-wider">
                क्विज मास्टर पोर्टल
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            {menuItems.map(item => {
              const Icon = item.icon;
              const isActive = currentPath === item.path;

              return (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer text-left ${
                    isActive
                      ? 'bg-red-600 text-white font-bold shadow-sm shadow-red-600/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Info & Actions */}
        <div className="p-4 border-t border-slate-800 space-y-3">
          <div className="flex items-center gap-2.5 bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-300 shrink-0">
              QM
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white truncate">{admin.name}</p>
              <p className="text-[10px] text-slate-400 font-mono truncate">{admin.email}</p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => navigate('/')}
              className="flex-1 py-2 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 transition cursor-pointer"
              title="विद्यार्थी पोर्टल हेर्नुहोस्"
            >
              <ExternalLink className="w-3 h-3" />
              <span>विद्यार्थी पोर्टल</span>
            </button>
            <button
              onClick={onLogout}
              className="p-2 bg-red-950/60 hover:bg-red-900/60 text-red-400 rounded-lg transition cursor-pointer"
              title="लगआउट गर्नुहोस्"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Navbar */}
        <header className="bg-white border-b border-slate-200 px-6 py-3.5 hidden md:flex items-center justify-between sticky top-0 z-20 shadow-2xs">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span>आधिकारिक क्याम्पस क्विज प्रणाली</span>
            <span>•</span>
            <span className="text-slate-800 font-semibold font-mono">Asia/Kathmandu</span>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <span className="text-slate-500">
              मिति: <b className="text-slate-800">{formatNepalDate(new Date(), false)}</b>
            </span>
            <button
              onClick={() => navigate('/')}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg flex items-center gap-1.5 transition cursor-pointer"
            >
              <ExternalLink className="w-3 h-3 text-slate-500" />
              <span>विद्यार्थी पोर्टल खोल्नुहोस्</span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 sm:p-8 flex-1">{children}</main>
      </div>
    </div>
  );
};
