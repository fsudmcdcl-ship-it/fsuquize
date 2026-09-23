import React, { useState, useEffect, useId } from 'react';
import type { Student, DeviceSession } from '../types/quiz';
import { toNepaliDigits, formatNepalDate } from '../lib/nepaliUtils';
import { dataService } from '../lib/dataService';
import { fetchActiveSessions, getOrCreateDeviceId } from '../lib/deviceSession';
import { User, ShieldAlert, Camera, Check, Upload, X, ShieldCheck, Laptop, Smartphone, Monitor } from 'lucide-react';

interface ProfilePageProps {
  student: Student;
  onStudentUpdated: (updated: Student) => void;
  navigate: (path: string) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  student,
  onStudentUpdated,
  navigate,
}) => {
  const [profilePhoto, setProfilePhoto] = useState(student.profilePhoto || '');
  const [savedNotice, setSavedNotice] = useState(false);
  const [activeSessions, setActiveSessions] = useState<DeviceSession[]>([]);
  const currentDeviceId = getOrCreateDeviceId();
  const fileInputId = useId();

  useEffect(() => {
    fetchActiveSessions(student.id).then(sessions => {
      if (sessions.length > 0) {
        setActiveSessions(sessions);
      } else {
        // Provide current device fallback
        setActiveSessions([
          {
            deviceId: currentDeviceId,
            deviceName: 'यो उपकरण (Current Device)',
            lastActive: Date.now(),
            loginAt: new Date().toISOString(),
            status: 'active',
            isCurrent: true,
          },
        ]);
      }
    });
  }, [student.id, currentDeviceId]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX = 300;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > MAX) {
            height *= MAX / width;
            width = MAX;
          }
        } else {
          if (height > MAX) {
            width *= MAX / height;
            height = MAX;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

        setProfilePhoto(dataUrl);

        // Update student via dataService and sync to Firestore
        dataService.updateStudent(student.id, { profilePhoto: dataUrl });
        const updated = dataService.getCurrentStudent();
        if (updated) {
          onStudentUpdated(updated);
          setSavedNotice(true);
          setTimeout(() => setSavedNotice(false), 3000);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">
      {/* Header */}
      <div className="border-b border-slate-200 pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900">विद्यार्थी प्रोफाइल</h1>
          <p className="text-slate-500 text-xs mt-1">तपाईंको आधिकारिक क्याम्पस खाता विवरण</p>
        </div>
        <button
          onClick={() => {
            dataService.logoutStudent();
            navigate('/login');
          }}
          className="px-4 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs transition cursor-pointer"
        >
          खाता लगआउट गर्नुहोस्
        </button>
      </div>

      {savedNotice && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>प्रोफाइल फोटो सफलतापूर्वक परिवर्तन गरियो।</span>
        </div>
      )}

      {/* Profile Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-8">
        {/* Photo + Name Row */}
        <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-slate-100">
          <div className="relative group">
            <div className="w-28 h-28 rounded-full overflow-hidden bg-slate-100 border-4 border-slate-200 shadow-md">
              <img
                src={
                  profilePhoto ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=face'
                }
                alt={student.name}
                className="w-full h-full object-cover"
              />
            </div>
            <label
              htmlFor={fileInputId}
              className="absolute bottom-0 right-0 p-2 bg-red-600 text-white rounded-full shadow-md hover:bg-red-700 cursor-pointer transition transform hover:scale-110"
              title="फोटो बदल्नुहोस्"
            >
              <Camera className="w-4 h-4" />
            </label>
            <input
              id={fileInputId}
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />
          </div>

          <div className="text-center sm:text-left space-y-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h2 className="text-2xl font-black text-slate-900">{student.name}</h2>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                  student.status === 'active'
                    ? 'bg-emerald-100 text-emerald-800'
                    : student.status === 'restricted'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {student.status === 'active' ? 'सक्रिय खाता' : student.status === 'restricted' ? 'प्रतिबन्धित' : 'ब्लक'}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-mono font-bold">
              विद्यार्थी ID: <span className="text-red-600">{student.id}</span>
            </p>
            <p className="text-xs text-slate-400">
              दर्ता मिति: {formatNepalDate(student.createdAt, false)}
            </p>
          </div>
        </div>

        {/* Detailed Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <span className="text-slate-400 block font-medium">पूरा नाम</span>
            <span className="text-sm font-bold text-slate-800 mt-1 block">{student.name}</span>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <span className="text-slate-400 block font-medium">विद्यार्थी ID (Username)</span>
            <span className="text-sm font-bold text-slate-800 mt-1 block font-mono">{student.id}</span>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <span className="text-slate-400 block font-medium">कक्षा / संकाय</span>
            <span className="text-sm font-bold text-slate-800 mt-1 block">{student.class}</span>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <span className="text-slate-400 block font-medium">सेमेस्टर</span>
            <span className="text-sm font-bold text-slate-800 mt-1 block">{student.semester}</span>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <span className="text-slate-400 block font-medium">रोल नम्बर</span>
            <span className="text-sm font-bold text-slate-800 mt-1 block">{toNepaliDigits(student.rollNo)}</span>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <span className="text-slate-400 block font-medium">सम्पर्क नम्बर</span>
            <span className="text-sm font-bold text-slate-800 mt-1 block font-mono">{student.phone}</span>
          </div>
        </div>

        {/* Security Notice */}
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <b className="font-bold">सुरक्षा निर्देशन: </b>
            <span>
              क्विजको स्वच्छता र आधिकारिकताका लागि विद्यार्थीको नाम, रोल नम्बर र कक्षा परिवर्तन गर्न क्याम्पस प्रशासन (स्ववियु सचिवालय) सँग सम्पर्क गर्नुपर्नेछ।
            </span>
          </div>
        </div>

        {/* Active Multi-Device Logins */}
        <div className="border-t border-slate-100 pt-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-800">सक्रिय उपकरणहरू (Active Devices)</h3>
            </div>
            <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
              {toNepaliDigits(activeSessions.length)} यन्त्र सक्रिय
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {activeSessions.map((session) => (
              <div
                key={session.deviceId}
                className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-xs transition ${
                  session.deviceId === currentDeviceId
                    ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                    : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-slate-600 shadow-2xs">
                    {session.deviceName.toLowerCase().includes('phone') ||
                    session.deviceName.toLowerCase().includes('android') ||
                    session.deviceName.toLowerCase().includes('iphone') ? (
                      <Smartphone className="w-4 h-4 text-slate-700" />
                    ) : (
                      <Laptop className="w-4 h-4 text-slate-700" />
                    )}
                  </div>
                  <div>
                    <div className="font-bold flex items-center gap-1.5">
                      <span>{session.deviceName}</span>
                      {session.deviceId === currentDeviceId && (
                        <span className="text-[9px] bg-emerald-600 text-white font-extrabold px-1.5 py-0.5 rounded-sm">
                          यो उपकरण
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {session.loginAt ? formatNepalDate(session.loginAt) : 'भर्खरै सक्रिय'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-[10px] font-bold text-emerald-700">सक्रिय</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
