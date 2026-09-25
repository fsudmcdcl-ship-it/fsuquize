import React, { useState, useEffect } from 'react';
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
  RefreshCw,
  Save,
  Radio,
  Globe,
  CheckCircle2,
  AlertCircle,
  Bell
} from 'lucide-react';
import { formatNepalDate } from '../lib/nepaliUtils';
import { dataService } from '../lib/dataService';
import {
  getAdminLanguage,
  setAdminLanguage,
  adminTranslations,
  type AdminLanguage
} from './adminTranslations';
import { SendNotificationModal } from './components/SendNotificationModal';

interface AdminLayoutProps {
  currentPath: string;
  admin: AdminUser;
  adminSlug: string;
  navigate: (path: string) => void;
  onLogout: () => void;
  onRefresh?: () => void;
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  currentPath,
  admin,
  adminSlug,
  navigate,
  onLogout,
  onRefresh,
  children,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [lang, setLang] = useState<AdminLanguage>(getAdminLanguage);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPublishingLive, setIsPublishingLive] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'info' | 'error'; message: string } | null>(null);
  const [hasDrafts, setHasDrafts] = useState<boolean>(() => dataService.hasUnsavedDrafts());
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);

  const t = adminTranslations[lang];

  useEffect(() => {
    const unsub = dataService.subscribe(() => {
      setHasDrafts(dataService.hasUnsavedDrafts());
    });
    return unsub;
  }, []);

  const handleLanguageToggle = () => {
    const nextLang: AdminLanguage = lang === 'ne' ? 'en' : 'ne';
    setLang(nextLang);
    setAdminLanguage(nextLang);
  };

  const showToast = (type: 'success' | 'info' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  const handleRefreshDatabase = async () => {
    setIsRefreshing(true);
    try {
      const result = await dataService.syncWithRealtimeDbAndFirestore();
      onRefresh?.();
      showToast(
        'success',
        lang === 'ne'
          ? `रियलटाइम डाटाबेसबाट सबै डाटा सफलतापूर्वक ताजा गरियो (${result.studentCount} विद्यार्थी)`
          : `Realtime Database successfully refreshed! (${result.studentCount} students)`
      );
    } catch {
      showToast(
        'info',
        lang === 'ne' ? 'डाटाबेस रिफ्रेस सम्पन्न भयो।' : 'Database refresh completed.'
      );
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSaveDraft = () => {
    dataService.setDraftChanges(true);
    setHasDrafts(true);
    showToast('info', t.draftSavedSuccess);
  };

  const handleGlobalLive = async () => {
    setIsPublishingLive(true);
    try {
      const result = await dataService.publishGlobalLive(admin.email);
      onRefresh?.();
      setHasDrafts(false);
      if (result.success) {
        showToast(
          'success',
          lang === 'ne'
            ? 'सबै डाटा क्लाउड Realtime Database र Firestore मा सफलतापूर्वक लाइभ प्रकाशित गरियो!'
            : 'All data published globally live to Realtime Database & Firestore!'
        );
      } else {
        showToast('error', result.message || 'ग्लोबल लाइभ गर्न समस्या देखियो।');
      }
    } catch {
      showToast('error', 'ग्लोबल लाइभ गर्न समस्या देखियो।');
    } finally {
      setIsPublishingLive(false);
    }
  };

  const prefix = `/${adminSlug}`;
  const pendingCount = dataService.getStudents().filter(s => s.status === 'pending').length;

  const menuItems = [
    { label: t.navDashboard, path: `${prefix}/dashboard`, icon: LayoutDashboard },
    { label: t.navQuizzes, path: `${prefix}/quizzes`, icon: BookOpen },
    { label: t.navStudents, path: `${prefix}/students`, icon: Users, badge: pendingCount > 0 ? pendingCount : undefined },
    { label: t.navQuestions, path: `${prefix}/questions`, icon: HelpCircle },
    { label: t.navSubmissions, path: `${prefix}/submissions`, icon: FileCheck2 },
    { label: t.navWinners, path: `${prefix}/winners`, icon: Trophy },
    { label: t.navReports, path: `${prefix}/reports`, icon: FileSpreadsheet },
    { label: t.navSettings, path: `${prefix}/settings`, icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row font-sans">
      {/* Toast Notification Banner */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 animate-in fade-in slide-in-from-top-4 duration-200 max-w-md">
          <div
            className={`p-4 rounded-2xl shadow-xl flex items-center gap-3 text-xs font-bold border ${
              notification.type === 'success'
                ? 'bg-emerald-900 text-emerald-100 border-emerald-700'
                : notification.type === 'error'
                ? 'bg-red-900 text-red-100 border-red-700'
                : 'bg-slate-900 text-white border-slate-700'
            }`}
          >
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : notification.type === 'error' ? (
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0" />
            )}
            <span className="flex-1">{notification.message}</span>
            <button
              onClick={() => setNotification(null)}
              className="text-slate-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Mobile Top Header */}
      <div className="md:hidden bg-slate-900 text-white px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between border-b border-slate-800 sticky top-0 z-40">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center font-bold shrink-0">
            🛡️
          </div>
          <div className="min-w-0 truncate">
            <span className="font-extrabold text-xs sm:text-sm block truncate">{t.portalTitle}</span>
            <span className="text-[10px] text-slate-400 font-mono block truncate">/{adminSlug}</span>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <button
            onClick={() => setIsNotificationModalOpen(true)}
            className="p-1.5 rounded-lg bg-blue-600 text-white cursor-pointer"
            title={lang === 'ne' ? 'नयाँ सूचना पठाउनुहोस्' : 'Send Notification'}
          >
            <Bell className="w-4 h-4" />
          </button>
          <button
            onClick={handleLanguageToggle}
            className="p-1.5 rounded-lg bg-slate-800 text-xs font-bold text-slate-300 border border-slate-700 cursor-pointer"
            title="Language"
          >
            <Globe className="w-4 h-4 text-red-400" />
          </button>
          <button
            onClick={handleRefreshDatabase}
            disabled={isRefreshing}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-200 hover:text-white cursor-pointer"
            title={t.refreshDatabase}
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-red-400' : ''}`} />
          </button>
          <button
            onClick={handleGlobalLive}
            disabled={isPublishingLive}
            className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer"
            title={t.publishGlobalLive}
          >
            <Radio className={`w-4 h-4 ${isPublishingLive ? 'animate-pulse text-emerald-200' : ''}`} />
          </button>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 sm:p-2 rounded-lg bg-slate-800 text-slate-200 cursor-pointer"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Sidebar Backdrop Overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-25 md:hidden"
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-30 h-screen w-64 bg-slate-900 text-slate-300 flex flex-col justify-between border-r border-slate-800 transition-transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div>
          {/* Logo Area */}
          <div className="p-6 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center text-white text-lg font-bold shadow-md shadow-red-600/30 shrink-0">
                🎓
              </div>
              <div>
                <div className="font-black text-white text-base tracking-tight leading-tight">
                  FSU DMC
                </div>
                <div className="text-[10px] text-red-400 font-bold uppercase tracking-wider">
                  {t.portalTitle}
                </div>
              </div>
            </div>

            {/* Language switcher button */}
            <button
              onClick={handleLanguageToggle}
              title={t.switchLanguage}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-[10px] font-bold text-slate-300 border border-slate-700 flex items-center gap-1 cursor-pointer"
            >
              <Globe className="w-3 h-3 text-red-400" />
              <span>{lang === 'ne' ? 'EN' : 'ने'}</span>
            </button>
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
                  className={`w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer text-left ${
                    isActive
                      ? 'bg-red-600 text-white font-bold shadow-sm shadow-red-600/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-slate-950 shrink-0 shadow-xs">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Info & Actions */}
        <div className="p-4 border-t border-slate-800 space-y-3">
          {/* Status pill in sidebar */}
          <div className="px-2.5 py-1.5 rounded-xl bg-slate-800/90 border border-slate-700/60 text-[11px] flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${hasDrafts ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`}></span>
              <span className={hasDrafts ? 'text-amber-300 font-medium' : 'text-emerald-300 font-medium'}>
                {hasDrafts ? (lang === 'ne' ? 'ड्राफ्ट बाँकी' : 'Draft Pending') : (lang === 'ne' ? 'लाइभ सिङ्क' : 'Live Synced')}
              </span>
            </span>
            <button
              onClick={handleRefreshDatabase}
              disabled={isRefreshing}
              className="text-slate-400 hover:text-white transition"
              title={t.refreshDatabase}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-red-400' : ''}`} />
            </button>
          </div>

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
              title={t.openStudentPortal}
            >
              <ExternalLink className="w-3 h-3" />
              <span>{t.openStudentPortal}</span>
            </button>
            <button
              onClick={onLogout}
              className="p-2 bg-red-950/60 hover:bg-red-900/60 text-red-400 rounded-lg transition cursor-pointer"
              title={t.logout}
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Navbar */}
        <header className="bg-white border-b border-slate-200 px-6 py-3 hidden md:flex items-center justify-between sticky top-0 z-20 shadow-2xs">
          {/* Left info & Status badge */}
          <div className="flex items-center gap-3 text-xs">
            <span className="text-slate-600 font-semibold">{t.officialSystem}</span>
            <span className="text-slate-300">•</span>
            {hasDrafts ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-bold">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                <span>{t.statusDraftChanges}</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>{t.statusGlobalLive}</span>
              </span>
            )}
          </div>

          {/* Right action controls */}
          <div className="flex items-center gap-2.5 text-xs">
            {/* Refresh Database button */}
            <button
              onClick={handleRefreshDatabase}
              disabled={isRefreshing}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer border border-slate-200"
              title="Pull latest data from Firebase Firestore backend"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-slate-600 ${isRefreshing ? 'animate-spin text-red-600' : ''}`} />
              <span>{isRefreshing ? t.refreshing : t.refreshDatabase}</span>
            </button>

            {/* Save Draft button */}
            <button
              onClick={handleSaveDraft}
              className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer border border-amber-200"
              title="Save current modifications locally as draft"
            >
              <Save className="w-3.5 h-3.5 text-amber-600" />
              <span>{t.saveDraft}</span>
            </button>

            {/* Global Live button */}
            <button
              onClick={handleGlobalLive}
              disabled={isPublishingLive}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer shadow-sm shadow-emerald-600/30"
              title="Publish all changes globally live to Firebase Firestore"
            >
              <Radio className={`w-3.5 h-3.5 ${isPublishingLive ? 'animate-pulse text-emerald-200' : ''}`} />
              <span>{isPublishingLive ? t.publishingLive : t.publishGlobalLive}</span>
            </button>

            {/* Language toggle button */}
            <button
              onClick={() => setIsNotificationModalOpen(true)}
              className="px-3.5 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              title={lang === 'ne' ? 'नयाँ सूचना पठाउनुहोस्' : 'Send Notification'}
            >
              <Bell className="w-3.5 h-3.5 text-blue-200" />
              <span>{lang === 'ne' ? 'सूचना पठाउनुहोस्' : 'Notification'}</span>
            </button>

            <button
              onClick={handleLanguageToggle}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer border border-slate-200"
              title={t.switchLanguage}
            >
              <Globe className="w-3.5 h-3.5 text-red-600" />
              <span>{lang === 'ne' ? 'English' : 'नेपाली'}</span>
            </button>

            <button
              onClick={() => navigate('/')}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
            >
              <ExternalLink className="w-3 h-3 text-slate-300" />
              <span>{t.openStudentPortal}</span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 sm:p-8 flex-1">{children}</main>
      </div>

      {/* Global Send Notification Modal for Admin */}
      <SendNotificationModal
        isOpen={isNotificationModalOpen}
        onClose={() => setIsNotificationModalOpen(false)}
        students={dataService.getStudents()}
        onNotificationSent={onRefresh}
      />
    </div>
  );
};
