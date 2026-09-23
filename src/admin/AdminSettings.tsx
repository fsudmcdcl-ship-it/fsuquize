import React, { useState } from 'react';
import type { PortalSettings } from '../types/quiz';
import { dataService } from '../lib/dataService';
import { isConfigured, config, saveManualFirebaseConfig, clearManualFirebaseConfig } from '../lib/firebase';
import { Settings, Save, CheckCircle2, Database, ShieldCheck, Flame, AlertCircle, Lock, Copy, KeyRound, ExternalLink } from 'lucide-react';

interface AdminSettingsProps {
  onRefresh: () => void;
}

export const AdminSettings: React.FC<AdminSettingsProps> = ({ onRefresh }) => {
  const currentSettings = dataService.getSettings();
  const [campusName, setCampusName] = useState(currentSettings.campusName);
  const [subTitle, setSubTitle] = useState(currentSettings.subTitle);
  const [durationMinutes, setDurationMinutes] = useState(currentSettings.quizDurationMinutes);
  const [availabilityHours, setAvailabilityHours] = useState(currentSettings.quizAvailabilityHours);
  const [contactSupport, setContactSupport] = useState(currentSettings.contactSupport);
  const [adminSlug, setAdminSlug] = useState(currentSettings.adminSlug || 'quizemasteradmin');
  const [slugSavedNotice, setSlugSavedNotice] = useState(false);
  const [copiedUrlNotice, setCopiedUrlNotice] = useState(false);
  const [saveNotice, setSaveNotice] = useState(false);

  // Manual Firebase Config JSON
  const [firebaseJsonInput, setFirebaseJsonInput] = useState('');
  const [jsonError, setJsonError] = useState('');

  const fullAdminUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/${adminSlug}`
    : `https://quize.fsudmc.com/${adminSlug}`;

  const handleCopyAdminUrl = () => {
    navigator.clipboard.writeText(fullAdminUrl);
    setCopiedUrlNotice(true);
    setTimeout(() => setCopiedUrlNotice(false), 3000);
  };

  const handleSaveSlug = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedSlug = dataService.updateAdminSlug(adminSlug, 'admin@fsudmc.com');
    setAdminSlug(updatedSlug);
    setSlugSavedNotice(true);
    setTimeout(() => setSlugSavedNotice(false), 3500);
    onRefresh();
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: PortalSettings = {
      ...currentSettings,
      campusName,
      subTitle,
      quizDurationMinutes: Number(durationMinutes),
      quizAvailabilityHours: Number(availabilityHours),
      contactSupport,
    };
    dataService.saveSettings(updated, 'admin@fsudmc.com');
    setSaveNotice(true);
    setTimeout(() => setSaveNotice(false), 3000);
    onRefresh();
  };

  const handleApplyFirebaseConfig = () => {
    setJsonError('');
    try {
      const parsed = JSON.parse(firebaseJsonInput);
      if (!parsed.apiKey || !parsed.projectId) {
        setJsonError('मान्य JSON मा कम्तिमा apiKey र projectId हुन अनिवार्य छ।');
        return;
      }
      saveManualFirebaseConfig(parsed);
    } catch {
      setJsonError('कृपया मान्य JSON ढाँचा प्रविष्ट गर्नुहोस्।');
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
          पोर्टल सेटिङ र फायरबेस (Settings & Firebase)
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          क्याम्पस ब्रान्डिङ, क्विज समय सीमा र फायरबेस डाटाबेस व्यवस्थापन
        </p>
      </div>

      {saveNotice && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>सेटिङ सफलतापूर्वक सुरक्षित गरियो!</span>
        </div>
      )}

      {/* Firebase Status & Configuration Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xl">
              🔥
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">फायरबेस स्थिति (Firebase Status)</h2>
              <p className="text-xs text-slate-500">क्लाउड फायरस्टोर र अथेन्टिकेसन जडान स्थिति</p>
            </div>
          </div>

          <span
            className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
              isConfigured
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-blue-100 text-blue-800'
            }`}
          >
            {isConfigured ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>फायरबेस सक्रिय (Connected)</span>
              </>
            ) : (
              <>
                <Database className="w-3.5 h-3.5 text-blue-600" />
                <span>स्थानीय सुरक्षित डाटाबेस (Local Storage Ready)</span>
              </>
            )}
          </span>
        </div>

        {isConfigured && config ? (
          <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-200 text-xs space-y-2">
            <div className="font-bold text-emerald-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>क्लाउड फायरस्टोर र अथेन्टिकेसन कन्फिगरेसन सक्रिय छ।</span>
            </div>
            <p className="font-mono text-slate-600">प्रोजेक्ट ID: <b>{config.projectId}</b></p>
            <p className="font-mono text-slate-600">अथेन्टिकेसन डोमेन: <b>{config.authDomain}</b></p>
            <button
              onClick={clearManualFirebaseConfig}
              className="text-xs text-red-600 hover:underline pt-2 font-bold block"
            >
              कन्फिगरेसन रिसेट गर्नुहोस्
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs text-slate-600 leading-relaxed">
              <b className="text-slate-800 block mb-1">डाटाबेस स्थिति:</b>
              हाल यो पोर्टल ब्राउजरको स्थानीय उच्च-विश्वसनीयता भण्डारण (Local Persistence) मा १००% स्वचालित रूपमा चलिरहेको छ। 
              सबै विद्यार्थी दर्ता, प्रश्न बैङ्क, लगइन, क्विज सबमिसन र एक्सल निर्यात पूर्ण रूपमा क्रियाशील छन्। 
              जब तपाईं आफ्नो फायरबेस विवरणहरू उपलब्ध गराउनुहुन्छ, तलको बक्समा आफ्नो <code>firebaseConfig</code> JSON पेस्ट गर्न सक्नुहुन्छ वा <code>.env</code> मा सेट गर्न सक्नुहुन्छ।
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 uppercase">
                फायरबेस कन्फिग JSON प्रविष्ट गर्नुहोस् (ऐच्छिक):
              </label>
              <textarea
                rows={4}
                value={firebaseJsonInput}
                onChange={e => setFirebaseJsonInput(e.target.value)}
                placeholder='{\n  "apiKey": "AIzaSy...",\n  "projectId": "fsudmc-quiz",\n  "appId": "..."\n}'
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono"
              />
              {jsonError && <p className="text-xs text-red-600">{jsonError}</p>}

              <button
                type="button"
                onClick={handleApplyFirebaseConfig}
                disabled={!firebaseJsonInput.trim()}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white font-bold text-xs rounded-xl transition cursor-pointer"
              >
                फायरबेस कन्फिग सुरक्षित र पुनः लोड गर्नुहोस्
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Secret Admin URL & Unique Slug Management */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold text-xl">
              <Lock className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">गोप्य एडमिन पोर्टल लिङ्क (Secret Admin URL & Slug)</h2>
              <p className="text-xs text-slate-500">विद्यार्थीहरूबाट लुकाइएको सुरक्षित युनिक एडमिन URL व्यवस्थापन</p>
            </div>
          </div>

          <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-slate-900 text-white flex items-center gap-1.5">
            <span>🔒 पूर्ण रूपमा गोप्य</span>
          </span>
        </div>

        {slugSavedNotice && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>नयाँ गोप्य Slug सफलतापूर्वक अद्यावधिक गरियो! अब यही नयाँ URL बाट लगइन गर्न सकिन्छ।</span>
          </div>
        )}

        <div className="bg-slate-900 text-white p-5 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">तपाईंको आधिकारिक एडमिन लगइन लिङ्क:</span>
            {copiedUrlNotice && (
              <span className="text-[11px] text-emerald-400 font-bold bg-emerald-950/80 px-2 py-0.5 rounded">
                लिङ्क कपी भयो!
              </span>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="bg-slate-950 px-4 py-3 rounded-xl border border-slate-800 font-mono text-xs text-emerald-400 flex-1 truncate select-all">
              {fullAdminUrl}
            </div>
            <button
              type="button"
              onClick={handleCopyAdminUrl}
              className="px-4 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition shadow-xs shrink-0"
            >
              <Copy className="w-4 h-4" />
              <span>URL कपी गर्नुहोस्</span>
            </button>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed pt-1">
            ⚠️ <b>सुरक्षा सूचना:</b> विद्यार्थी पोर्टलको फुटर तथा नेभिगेसन बारबाट एडमिन प्यानलको सम्पूर्ण लिङ्क हटाइएको छ। 
            विद्यार्थीहरूले सिधै <code>/quizemaster</code> वा <code>/admin</code> खोल्दा "पृष्ठ भेटिएन (404)" देखिनेछ। एडमिन प्यानल खोल्न माथिको गोप्य URL मात्र सुरक्षित राख्नुहोस्।
          </p>
        </div>

        {/* Change Slug Form */}
        <form onSubmit={handleSaveSlug} className="space-y-3 pt-2">
          <label className="block text-xs font-bold text-slate-700 uppercase">
            गोप्य Slug परिवर्तन गर्नुहोस् (Custom Unique Slug):
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-3 flex items-center text-xs font-mono text-slate-400 select-none">
                quize.fsudmc.com/
              </span>
              <input
                type="text"
                required
                value={adminSlug}
                onChange={e => setAdminSlug(e.target.value)}
                className="w-full pl-36 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-900"
                placeholder="quizemasteradmin"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition cursor-pointer shrink-0"
            >
              Slug परिवर्तन सुरक्षित गर्नुहोस्
            </button>
          </div>
          <span className="text-[11px] text-slate-500 block">
            अंग्रेजी साना अक्षर (a-z), अंक (0-9) र हाइफन (-) मात्र प्रयोग गर्नुहोस्।
          </span>
        </form>
      </div>

      {/* General Campus Settings Form */}
      <form onSubmit={handleSaveSettings} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
        <div className="pb-4 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900">क्याम्पस तथा क्विज सामान्य सेटिङ</h2>
          <p className="text-xs text-slate-500">क्विज पोर्टलको शीर्षक, समय सीमा र सम्पर्क जानकारी</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">
              क्याम्पसको नाम (Campus Title)
            </label>
            <input
              type="text"
              required
              value={campusName}
              onChange={e => setCampusName(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-medium"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">
              उप-शीर्षक (Sub Title)
            </label>
            <input
              type="text"
              required
              value={subTitle}
              onChange={e => setSubTitle(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-medium"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">
              क्विज समय सीमा (मिनेटमा)
            </label>
            <input
              type="number"
              required
              min={1}
              max={60}
              value={durationMinutes}
              onChange={e => setDurationMinutes(Number(e.target.value))}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-medium"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">
              क्विज उपलब्ध अवधि (घण्टामा)
            </label>
            <input
              type="number"
              required
              min={1}
              max={168}
              value={availabilityHours}
              onChange={e => setAvailabilityHours(Number(e.target.value))}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-medium"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block font-bold text-slate-700 uppercase mb-1">
              सहयोग तथा सम्पर्क विवरण (Support Contact)
            </label>
            <input
              type="text"
              value={contactSupport}
              onChange={e => setContactSupport(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-medium"
            />
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>सेटिङ सुरक्षित गर्नुहोस्</span>
          </button>
        </div>
      </form>
    </div>
  );
};
