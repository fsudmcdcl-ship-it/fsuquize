import React, { useState, useId } from 'react';
import { dataService } from '../lib/dataService';
import type { Student } from '../types/quiz';
import { toNepaliDigits } from '../lib/nepaliUtils';
import { Upload, X, Check, AlertCircle, Eye, EyeOff, ShieldCheck, ArrowRight, Camera } from 'lucide-react';

interface RegisterPageProps {
  navigate: (path: string) => void;
  onStudentRegistered: (student: Student) => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ navigate, onStudentRegistered }) => {
  const [name, setName] = useState('');
  const [studentClass, setStudentClass] = useState('BCA');
  const [semester, setSemester] = useState('प्रथम');
  const [rollNo, setRollNo] = useState('');
  const [phone, setPhone] = useState('');
  const [passcode, setPasscode] = useState('');
  const [confirmPasscode, setConfirmPasscode] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<string>('');
  const [photoError, setPhotoError] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState<Student | null>(null);

  const fileInputId = useId();

  // Dynamic automatic student ID generation: FSU + roll + last3(phone)
  const cleanRoll = rollNo.trim();
  const cleanPhone = phone.trim();
  const last3 = cleanPhone.length >= 3 ? cleanPhone.slice(-3) : 'XXX';
  const generatedId = cleanRoll ? `FSU${cleanRoll}${last3}` : 'FSU---';

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhotoError('');
    const file = e.target.files?.[0];
    if (!file) return;

    // Type validation
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      setPhotoError('कृपया JPG, PNG वा WebP ढाँचाको फोटो मात्र छान्नुहोस्।');
      return;
    }

    // Size validation: max 2MB
    if (file.size > 2 * 1024 * 1024) {
      setPhotoError('फोटोको आकार २ MB भन्दा सानो हुनुपर्छ।');
      return;
    }

    // Resize and compress via canvas
    const reader = new FileReader();
    reader.onload = event => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 300;
        const MAX_HEIGHT = 300;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setProfilePhoto(dataUrl);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setProfilePhoto('');
    setPhotoError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('कृपया आफ्नो पूरा नाम प्रविष्ट गर्नुहोस्।');
      return;
    }
    if (!profilePhoto) {
      setError('कृपया आफ्नो स्पष्ट प्रोफाइल फोटो अनिवार्य रूपमा अपलोड गर्नुहोस्। प्रोफाइल फोटो विना दर्ता मान्य हुँदैन।');
      return;
    }
    if (!rollNo.trim()) {
      setError('कृपया रोल नम्बर प्रविष्ट गर्नुहोस्।');
      return;
    }
    if (!phone.trim() || phone.trim().length !== 10 || !/^\d{10}$/.test(phone.trim())) {
      setError('क्याम्पस सम्पर्क नम्बर १० अंकको हुनुपर्छ।');
      return;
    }
    if (!passcode || passcode.length !== 4 || !/^\d{4}$/.test(passcode)) {
      setError('पासकोड ठ्याक्कै ४ अंकको संख्या मात्र हुनुपर्छ।');
      return;
    }
    if (passcode !== confirmPasscode) {
      setError('दुबै पटक प्रविष्ट गरिएको पासकोड समान भएन।');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await dataService.registerStudent({
        name: name.trim(),
        rollNo: rollNo.trim(),
        class: studentClass,
        semester,
        phone: phone.trim(),
        passcode: passcode.trim(),
        profilePhoto: profilePhoto || undefined,
      });

      setIsSubmitting(false);

      if (!result.success || !result.student) {
        if (result.technicalError) {
          console.error('Technical Firebase Registration Failure:', result.technicalError);
        }
        setError(result.error || 'दर्ता गर्दा समस्या देखियो। कृपया पुनः प्रयास गर्नुहोस्।');
        return;
      }

      setRegistrationSuccess(result.student);
      onStudentRegistered(result.student);
    } catch (err: unknown) {
      setIsSubmitting(false);
      console.error('Unhandled registration exception:', err);
      setError('दर्ता प्रक्रियामा अप्रत्याशित त्रुटि आयो। कृपया इन्टरनेट जडान जाँच गर्नुहोस्।');
    }
  };

  if (registrationSuccess) {
    return (
      <div className="max-w-md mx-auto px-4 py-12">
        <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-xl text-center space-y-6 animate-in zoom-in-95 duration-200">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-3xl">
            ✓
          </div>

          <div>
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest block mb-1">
              दर्ता सफल भयो!
            </span>
            <h2 className="text-2xl font-black text-slate-900">विद्यार्थी दर्ता सम्पन्न भयो</h2>
            <p className="text-sm text-slate-600 mt-2">
              बधाई छ, {registrationSuccess.name}! तपाईंको विद्यार्थी खाता सफलतापूर्वक निर्माण गरिएको छ।
            </p>
          </div>

          {/* Generated ID box */}
          <div className="bg-slate-50 border-2 border-dashed border-red-300 rounded-2xl p-5">
            <span className="text-xs font-semibold text-slate-500 block mb-1">
              तपाईंको विद्यार्थी ID (Student ID)
            </span>
            <div className="text-3xl font-black text-red-600 font-mono tracking-wider">
              {registrationSuccess.id}
            </div>
            <p className="text-xs text-slate-600 mt-2">
              यो ID लगइन गर्दा प्रयोग गर्नुहोस्।
            </p>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 text-left flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p>
              तपाईं चाहनुहुन्छ भने यो लगइन विवरण आफ्नो Google Password Manager मा सुरक्षित गर्न सक्नुहुन्छ।
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <button
              onClick={() => navigate('/todays-quize')}
              className="w-full py-3.5 px-4 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>आजको क्विज सुरु गर्नुहोस्</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition cursor-pointer"
            >
              ड्यासबोर्डमा जानुहोस्
            </button>
            <button
              onClick={() => {
                dataService.logoutStudent();
                navigate('/login');
              }}
              className="w-full py-2 px-4 text-slate-500 hover:text-red-600 font-semibold text-xs rounded-xl transition cursor-pointer"
            >
              लगआउट गर्नुहोस् र पुनः लगइन जाँच गर्नुहोस् (Log out & test re-login)
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-md">
        {/* Header */}
        <div className="text-center mb-8 border-b border-slate-100 pb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-red-700 text-xs font-bold mb-2">
            <span>🎓</span>
            <span>क्याम्पस क्विज पोर्टल</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900">विद्यार्थी दर्ता</h1>
          <p className="text-slate-500 text-xs mt-1">
            FSU DMC साप्ताहिक क्विजमा सहभागी हुन आफ्नो आधिकारिक विवरण भर्नुहोस्।
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2.5 animate-in fade-in">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile Photo Upload */}
          <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-2xl bg-slate-50 border border-slate-200/70">
            <div className="relative w-24 h-24 rounded-2xl bg-slate-200 border-2 border-white shadow-sm overflow-hidden flex items-center justify-center shrink-0">
              {profilePhoto ? (
                <img src={profilePhoto} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <Camera className="w-8 h-8 text-slate-400" />
              )}
            </div>

            <div className="flex-1 text-center sm:text-left space-y-2">
              <label className="text-sm font-bold text-red-600 block flex items-center justify-center sm:justify-start gap-1.5">
                <span>विद्यार्थी प्रोफाइल फोटो (अनिवार्य) *</span>
                <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">Compulsory</span>
              </label>
              <p className="text-xs text-slate-600">
                दर्ता सम्पन्न गर्न आफ्नो स्पष्ट फोटो अनिवार्य अपलोड गर्नुहोस्। साप्ताहिक विजेता भएमा बधाई पोस्टरमा यही फोटो प्रदर्शित हुनेछ। (JPG/PNG/WebP)
              </p>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                <input
                  id={fileInputId}
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                <label
                  htmlFor={fileInputId}
                  className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold cursor-pointer flex items-center gap-1.5 shadow-2xs"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{profilePhoto ? 'फोटो बदल्नुहोस्' : 'फोटो छान्नुहोस्'}</span>
                </label>

                {profilePhoto && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>हटाउनुहोस्</span>
                  </button>
                )}
              </div>
              {photoError && <p className="text-xs text-red-600">{photoError}</p>}
            </div>
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              पूरा नाम (Full Name) *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="उदा. समीर अधिकारी"
              className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-red-500 text-sm font-medium"
            />
          </div>

          {/* Class & Semester */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                कक्षा / संकाय (Class) *
              </label>
              <select
                value={studentClass}
                onChange={e => setStudentClass(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-red-500 text-sm font-medium bg-white"
              >
                <option value="BCA">BCA (कम्प्युटर एप्लिकेसन)</option>
                <option value="B.Sc.CSIT">B.Sc.CSIT (कम्प्युटर साइन्स)</option>
                <option value="BBS">BBS (व्यवस्थापन)</option>
                <option value="B.Ed">B.Ed (शिक्षाशास्त्र)</option>
                <option value="BA">BA (मानविकी)</option>
                <option value="MBS">MBS (स्नातकोत्तर)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                सेमेस्टर / वर्ष (Semester) *
              </label>
              <select
                value={semester}
                onChange={e => setSemester(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-red-500 text-sm font-medium bg-white"
              >
                <option value="प्रथम">प्रथम (1st Semester)</option>
                <option value="दोस्रो">दोस्रो (2nd Semester)</option>
                <option value="तेस्रो">तेस्रो (3rd Semester)</option>
                <option value="चौथो">चौथो (4th Semester)</option>
                <option value="पाँचौं">पाँचौं (5th Semester)</option>
                <option value="छैटौं">छैटौं (6th Semester)</option>
                <option value="सातौं">सातौं (7th Semester)</option>
                <option value="आठौं">आठौं (8th Semester)</option>
              </select>
            </div>
          </div>

          {/* Roll Number & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                रोल नम्बर (Roll Number) *
              </label>
              <input
                type="text"
                required
                value={rollNo}
                onChange={e => setRollNo(e.target.value)}
                placeholder="उदा. 25"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-red-500 text-sm font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                क्याम्पस सम्पर्क नम्बर (१० अंक) *
              </label>
              <input
                type="tel"
                required
                maxLength={10}
                value={phone}
                onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                placeholder="उदा. 9812345678"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-red-500 text-sm font-medium font-mono"
              />
            </div>
          </div>

          {/* Live Automatic Username / Student ID Display (Requirement 8) */}
          <div className="bg-red-50/70 border border-red-200/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-xs font-bold text-red-800 uppercase tracking-wider">
                तपाईंको स्वचालित विद्यार्थी ID (Auto-Generated Username)
              </div>
              <p className="text-xs text-red-600/80 mt-0.5">
                यो ID लगइन गर्दा प्रयोग गर्नुहोस्। (ढाँचा: FSU + रोल + फोनको अन्तिम ३ अंक)
              </p>
            </div>
            <div className="px-4 py-2 bg-white rounded-xl border border-red-300 text-red-700 font-mono font-black text-lg text-center tracking-wider shrink-0 shadow-2xs">
              {generatedId}
            </div>
          </div>

          {/* 4-digit Passcode & Confirm Passcode (Requirement 9) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                ४ अंकको पासकोड (PIN) *
              </label>
              <div className="relative">
                <input
                  type={showPasscode ? 'text' : 'password'}
                  required
                  maxLength={4}
                  autoComplete="new-password"
                  value={passcode}
                  onChange={e => setPasscode(e.target.value.replace(/\D/g, ''))}
                  placeholder="•••• (४ अंक)"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-red-500 text-sm font-medium font-mono tracking-widest"
                />
                <button
                  type="button"
                  onClick={() => setShowPasscode(!showPasscode)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPasscode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                पासकोड पुनः प्रविष्ट गर्नुहोस् *
              </label>
              <input
                type={showPasscode ? 'text' : 'password'}
                required
                maxLength={4}
                autoComplete="new-password"
                value={confirmPasscode}
                onChange={e => setConfirmPasscode(e.target.value.replace(/\D/g, ''))}
                placeholder="•••• (पुनः टाइप)"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-red-500 text-sm font-medium font-mono tracking-widest"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-black text-base rounded-2xl shadow-md shadow-red-600/25 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin text-lg">⏳</span>
                  <span>खाता निर्माण हुँदैछ...</span>
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  <span>दर्ता गर्नुहोस्</span>
                </>
              )}
            </button>

            <div className="text-center text-xs text-slate-500 pt-2">
              पहिल्यै खाता छ?{' '}
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="font-bold text-red-600 hover:underline"
              >
                यहाँ लगइन गर्नुहोस्
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
