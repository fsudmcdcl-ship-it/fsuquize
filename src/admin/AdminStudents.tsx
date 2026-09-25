import React, { useState, useEffect } from 'react';
import type { Student, StudentStatus, QuizSession, PasswordResetRequest } from '../types/quiz';
import { toNepaliDigits, fromNepaliDigits, formatNepalDate } from '../lib/nepaliUtils';
import { dataService } from '../lib/dataService';
import {
  Search,
  Filter,
  ShieldAlert,
  CheckCircle,
  Trash2,
  Ban,
  AlertTriangle,
  X,
  Edit,
  Save,
  UserCheck,
  PauseCircle,
  KeyRound,
  Phone,
  GraduationCap,
  Clock,
  UserX,
  Loader2,
  Bell,
  MessageSquare,
  Eye,
  Camera,
  Trophy,
  RefreshCw,
} from 'lucide-react';
import {
  getAdminLanguage,
  adminTranslations,
  type AdminLanguage
} from './adminTranslations';
import { WhatsAppModal } from './components/WhatsAppModal';
import { SendNotificationModal } from './components/SendNotificationModal';

export type StudentFilterType = 'all' | 'attempted' | 'not_attempted' | 'active' | 'pending' | 'suspended' | 'blocked' | 'restricted';

interface AdminStudentsProps {
  students: Student[];
  sessions?: QuizSession[];
  onRefresh: () => void;
}

export const AdminStudents: React.FC<AdminStudentsProps> = ({ students, sessions, onRefresh }) => {
  const [lang, setLang] = useState<AdminLanguage>(getAdminLanguage);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StudentFilterType>('all');
  const [deleteConfirmStudent, setDeleteConfirmStudent] = useState<Student | null>(null);

  // WhatsApp & Notification Modals State
  const [whatsAppStudent, setWhatsAppStudent] = useState<Student | null>(null);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [selectedStudentForNotification, setSelectedStudentForNotification] = useState<string | undefined>(undefined);

  // Unblock & Reset Password Modal State
  const [unblockingStudent, setUnblockingStudent] = useState<Student | null>(null);
  const [newUnblockPasscode, setNewUnblockPasscode] = useState('');
  const [unblockError, setUnblockError] = useState('');

  // Edit Student Modal State
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editName, setEditName] = useState('');
  const [editRollNo, setEditRollNo] = useState('');
  const [editFaculty, setEditFaculty] = useState<'Management' | 'Humanity' | 'Art'>('Management');
  const [editClass, setEditClass] = useState('BCA');
  const [editSemester, setEditSemester] = useState('प्रथम');
  const [editPhone, setEditPhone] = useState('');
  const [editPasscode, setEditPasscode] = useState('');
  const [editStatus, setEditStatus] = useState<StudentStatus>('active');
  const [editError, setEditError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [previewPhotoStudent, setPreviewPhotoStudent] = useState<Student | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState<'students' | 'password_resets'>('students');
  const [resetRequests, setResetRequests] = useState<PasswordResetRequest[]>(() => dataService.getPasswordResetRequests());

  const t = adminTranslations[lang];

  useEffect(() => {
    setResetRequests(dataService.getPasswordResetRequests());
    const unsub = dataService.subscribe(() => {
      setResetRequests(dataService.getPasswordResetRequests());
    });
    return unsub;
  }, []);

  const pendingResetCount = resetRequests.filter(r => r.status === 'pending').length;

  const handleApproveReset = async (id: string) => {
    setActionLoadingId(id);
    const res = await dataService.approvePasswordReset(id, 'admin@fsudmc.com');
    setActionLoadingId(null);
    if (res.success) {
      showToast('विद्यार्थीको नयाँ पासवर्ड सफलतापूर्वक स्वीकृत गरियो। विद्यार्थीलाई नयाँ पासवर्ड सक्रिय भएको सूचना पठाइयो।');
      setResetRequests(dataService.getPasswordResetRequests());
      onRefresh();
    } else {
      showToast('पासवर्ड स्वीकृत गर्न असफल: ' + (res.error || 'अज्ञात समस्या'));
    }
  };

  const handleRejectReset = async (id: string) => {
    setActionLoadingId(id);
    const res = await dataService.rejectPasswordReset(id, 'admin@fsudmc.com');
    setActionLoadingId(null);
    if (res.success) {
      showToast('विद्यार्थीको पासवर्ड परिवर्तन अनुरोध अस्वीकृत गरियो।');
      setResetRequests(dataService.getPasswordResetRequests());
      onRefresh();
    } else {
      showToast('अस्वीकृत गर्न असफल: ' + (res.error || 'अज्ञात समस्या'));
    }
  };

  // Listen to language changes from storage
  useEffect(() => {
    const handleStorage = () => {
      setLang(getAdminLanguage());
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      await dataService.syncWithRealtimeDbAndFirestore();
      onRefresh();
      showToast(lang === 'ne' ? 'विद्यार्थी सूची सफलतापूर्वक सिङ्क भयो।' : 'Student list synced successfully.');
    } catch {
      showToast(lang === 'ne' ? 'सिङ्क गर्दा समस्या आयो।' : 'Failed to sync student list.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleApproveStudent = async (student: Student) => {
    setActionLoadingId(student.id);
    try {
      const currentAdmin = dataService.getCurrentAdmin();
      const adminUid = currentAdmin?.uid || 'admin_master';
      const adminEmail = currentAdmin?.email || 'admin@fsudmc.com';
      const res = await dataService.approveStudentApplication(student.id, adminUid, adminEmail);
      if (res.success) {
        onRefresh();
        showToast(
          lang === 'ne'
            ? `विद्यार्थी ${student.name} को खाता सफलतापूर्वक स्वीकृत भयो (Approved successfully)`
            : `Student ${student.name} approved successfully.`
        );
        setWhatsAppStudent(res.student || student);
        setIsWhatsAppModalOpen(true);
      } else {
        showToast(res.error || 'Approval failed');
      }
    } catch {
      showToast('Error approving student');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRejectStudent = async (student: Student) => {
    setActionLoadingId(student.id);
    try {
      const currentAdmin = dataService.getCurrentAdmin();
      const adminUid = currentAdmin?.uid || 'admin_master';
      const adminEmail = currentAdmin?.email || 'admin@fsudmc.com';
      const res = await dataService.rejectStudentApplication(student.id, adminUid, adminEmail);
      if (res.success) {
        onRefresh();
        showToast(
          lang === 'ne'
            ? `विद्यार्थी ${student.name} को आवेदन अस्वीकृत गरियो (Rejected)`
            : `Student application rejected.`
        );
      } else {
        showToast(res.error || 'Rejection failed');
      }
    } catch {
      showToast('Error rejecting student');
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredStudents = students.filter(s => {
    const rawSearch = searchTerm.trim().toLowerCase();
    const attemptCount = dataService.getStudentSessionCount(s.id);

    let matchesStatus = true;
    if (statusFilter === 'all') {
      matchesStatus = true;
    } else if (statusFilter === 'attempted') {
      matchesStatus = attemptCount > 0;
    } else if (statusFilter === 'not_attempted') {
      matchesStatus = attemptCount === 0;
    } else {
      matchesStatus = s.status === statusFilter;
    }

    if (!rawSearch) {
      return matchesStatus;
    }

    // Convert search query to both English and Nepali digit variants for flexible typing
    const searchEngDigits = rawSearch.replace(/[०-९]/g, d => '०१२३४५६७८९'.indexOf(d).toString());
    const searchNepDigits = toNepaliDigits(rawSearch);

    const matchesSearch =
      s.name.toLowerCase().includes(rawSearch) ||
      s.id.toLowerCase().includes(rawSearch) ||
      s.rollNo.toLowerCase().includes(rawSearch) ||
      s.rollNo.includes(searchEngDigits) ||
      toNepaliDigits(s.rollNo).includes(searchNepDigits) ||
      s.class.toLowerCase().includes(rawSearch) ||
      s.phone.includes(searchEngDigits) ||
      toNepaliDigits(s.phone).includes(searchNepDigits);

    return matchesSearch && matchesStatus;
  });

  const handleStatusChange = (studentId: string, status: StudentStatus) => {
    dataService.updateStudentStatus(studentId, status, 'admin@fsudmc.com');
    onRefresh();
    showToast(
      lang === 'ne'
        ? `विद्यार्थी खाता स्थिति "${status}" मा अद्यावधिक भयो र ब्याकइन्डमा सेभ भयो।`
        : `Student status updated to "${status}" and synced to backend.`
    );
  };

  const handleDelete = () => {
    if (!deleteConfirmStudent) return;
    const attemptCount = dataService.getStudentSessionCount(deleteConfirmStudent.id);
    dataService.deleteStudent(deleteConfirmStudent.id, 'admin@fsudmc.com', true);
    setDeleteConfirmStudent(null);
    onRefresh();
    showToast(
      lang === 'ne'
        ? attemptCount > 0
          ? `विद्यार्थी खाता र सम्बन्धित ${toNepaliDigits(attemptCount)} वटा क्विज सबमिसन ब्याकइन्डबाट पूर्ण रूपमा हटाइयो।`
          : 'विद्यार्थी खाता ब्याकइन्डबाट स्थायी रूपमा हटाइयो।'
        : 'Student account and all quiz submissions permanently removed from backend.'
    );
  };

  const openEditModal = (student: Student) => {
    setEditingStudent(student);
    setEditName(student.name);
    setEditRollNo(student.rollNo);
    setEditFaculty(student.faculty === 'Art' ? 'Art' : student.faculty === 'Humanity' ? 'Humanity' : 'Management');
    setEditClass(student.class);
    setEditSemester(student.semester);
    setEditPhone(student.phone);
    setEditPasscode(student.passcode || '');
    setEditStatus(student.status);
    setEditError('');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError('');

    if (!editName.trim()) {
      setEditError(lang === 'ne' ? 'कृपया पूरा नाम प्रविष्ट गर्नुहोस्।' : 'Please enter full name.');
      return;
    }
    if (!editRollNo.trim()) {
      setEditError(lang === 'ne' ? 'कृपया रोल नम्बर प्रविष्ट गर्नुहोस्।' : 'Please enter roll number.');
      return;
    }
    if (!editPhone.trim() || editPhone.trim().length !== 10) {
      setEditError(lang === 'ne' ? 'फोन नम्बर १० अंकको हुनुपर्छ।' : 'Phone must be 10 digits.');
      return;
    }
    if (editPasscode && (editPasscode.length !== 4 || !/^\d{4}$/.test(editPasscode))) {
      setEditError(lang === 'ne' ? 'पासकोड ४ अंकको संख्या मात्र हुनुपर्छ।' : 'Passcode must be exactly 4 digits.');
      return;
    }

    if (!editingStudent) return;

    setIsSaving(true);
    try {
      const updates: Partial<Student> = {
        name: editName.trim(),
        rollNo: editRollNo.trim(),
        faculty: editFaculty,
        class: editClass,
        semester: editSemester,
        phone: editPhone.trim(),
        status: editStatus,
        ...(editPasscode ? { passcode: editPasscode.trim() } : {})
      };

      dataService.updateStudent(editingStudent.id, updates, 'admin@fsudmc.com');
      onRefresh();
      setEditingStudent(null);
      showToast(t.editSuccess);
    } catch {
      setEditError(lang === 'ne' ? 'सेभ गर्दा त्रुटि देखियो।' : 'Error saving updates to backend.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUnblockAndProvidePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!unblockingStudent) return;
    const cleanPass = newUnblockPasscode.trim().replace(/\D/g, '');
    if (!cleanPass || cleanPass.length !== 4) {
      setUnblockError(lang === 'ne' ? 'पासकोड ठ्याक्कै ४ अंकको हुनुपर्छ।' : 'Passcode must be exactly 4 digits.');
      return;
    }

    const res = dataService.unblockAndResetStudentPassword(unblockingStudent.id, cleanPass, 'admin@fsudmc.com');
    if (res.success) {
      onRefresh();
      setUnblockingStudent(null);
      setNewUnblockPasscode('');
      setUnblockError('');
      showToast(
        lang === 'ne'
          ? `विद्यार्थी ${unblockingStudent.name} (ID: ${unblockingStudent.id}) को खाता सफलतापूर्वक अनब्लक गरियो र नयाँ पासकोड (${cleanPass}) प्रदान गरियो।`
          : `Student ${unblockingStudent.name} successfully unblocked with new passcode ${cleanPass}.`
      );
    } else {
      setUnblockError(res.error || 'अनब्लक गर्न सकिएन');
    }
  };

  const getStatusBadge = (student: Student) => {
    switch (student.status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            <span>{t.statusPending}</span>
          </span>
        );
      case 'approved':
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>{student.status === 'approved' ? t.statusApproved : t.statusActive}</span>
          </span>
        );
      case 'suspended':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-orange-100 text-orange-800 border border-orange-200">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
            <span>{t.statusSuspended}</span>
          </span>
        );
      case 'blocked':
        return (
          <span
            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200"
            title={student.blockedReason || '३ पटक गलत पासवर्ड वा प्रशासनद्वारा ब्लक गरिएको'}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
            <span>{student.failedLoginAttempts && student.failedLoginAttempts >= 3 ? (lang === 'ne' ? 'ब्लक (३ गलत PIN)' : 'Blocked (3 PIN Fail)') : t.statusBlocked}</span>
          </span>
        );
      case 'disabled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-200 text-slate-800 border border-slate-300">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
            <span>{lang === 'ne' ? 'निष्क्रिय (Disabled)' : 'Disabled'}</span>
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-800 border border-slate-300">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
            <span>{t.statusRejected}</span>
          </span>
        );
      case 'restricted':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            <span>{student.status}</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="p-3.5 rounded-2xl bg-slate-900 text-white text-xs font-bold shadow-lg flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
            {t.studentsTitle}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {t.studentsSubtitle}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleManualSync}
            disabled={isSyncing}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-200 font-bold text-xs rounded-xl shadow-2xs transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            title="क्लाउडबाट नयाँ दर्ता र डाटा तुरुन्तै सिङ्क गर्नुहोस् (Sync latest registrations from cloud)"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isSyncing ? 'animate-spin text-red-600' : ''}`} />
            <span>{isSyncing ? (lang === 'ne' ? 'सिङ्क हुँदैछ...' : 'Syncing...') : (lang === 'ne' ? 'रिफ्रेस / सिङ्क' : 'Refresh Sync')}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedStudentForNotification(undefined);
              setIsNotificationModalOpen(true);
            }}
            className="px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
          >
            <Bell className="w-3.5 h-3.5" />
            <span>📢 नयाँ सूचना पठाउनुहोस्</span>
          </button>
          <span className="text-xs font-bold text-slate-600 bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-2xs">
            {t.totalStudents}: <b className="text-slate-900 font-mono text-sm">{filteredStudents.length}</b>
          </span>
        </div>
      </div>

      {/* Sub Tabs: Students List vs Password Reset Requests */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('students')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'students'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>विद्यार्थी सूची ({students.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('password_resets')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer relative ${
              activeTab === 'password_resets'
                ? 'bg-red-600 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>पासवर्ड रिसेट अनुरोधहरू ({resetRequests.length})</span>
            {pendingResetCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black animate-pulse">
                {pendingResetCount} पेन्डिङ
              </span>
            )}
          </button>
        </div>

        {activeTab === 'students' && pendingResetCount > 0 && (
          <button
            type="button"
            onClick={() => setActiveTab('password_resets')}
            className="text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>{pendingResetCount} वटा नयाँ पासवर्ड रिसेट अनुरोध आएको छ &rarr;</span>
          </button>
        )}
      </div>

      {activeTab === 'students' ? (
        <>
      {/* Search & Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-red-500 font-medium"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="w-full sm:w-auto px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white text-slate-700"
          >
            <option value="all">{t.filterAll}</option>
            <option value="attempted">🎯 {lang === 'ne' ? 'क्विज सहभागी (सबमिसन गरेका)' : 'Attempted Quiz'}</option>
            <option value="not_attempted">⚪ {lang === 'ne' ? 'क्विज नदिएका' : 'Not Attempted'}</option>
            <option value="pending">{t.filterPending || 'Pending'}</option>
            <option value="active">{t.filterActive}</option>
            <option value="suspended">{t.filterSuspended}</option>
            <option value="blocked">{t.filterBlocked}</option>
            <option value="restricted">{t.filterRestricted}</option>
          </select>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">{t.thStudent}</th>
                <th className="py-3.5 px-4">{t.thId}</th>
                <th className="py-3.5 px-4">{t.thClassSemester}</th>
                <th className="py-3.5 px-4">{t.thRoll}</th>
                <th className="py-3.5 px-4">{t.thPhone}</th>
                <th className="py-3.5 px-4">{t.thStatus}</th>
                <th className="py-3.5 px-4">{t.thRegisteredDate}</th>
                <th className="py-3.5 px-4 text-right">{t.thActions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {filteredStudents.length > 0 ? (
                filteredStudents.map(student => (
                  <tr key={student.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div
                          onClick={() => setPreviewPhotoStudent(student)}
                          className="group relative w-11 h-11 rounded-xl overflow-hidden bg-slate-100 shrink-0 border-2 border-slate-200 shadow-xs cursor-pointer hover:border-red-500 hover:scale-105 transition-all flex items-center justify-center"
                          title="फोटो ठूलो गरी हेर्नुहोस् (Click to view full photo)"
                        >
                          {student.profilePhoto ? (
                            <img
                              src={student.profilePhoto}
                              alt={student.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-red-600 to-slate-800 text-white font-black text-sm flex items-center justify-center">
                              {student.name ? student.name.trim().charAt(0).toUpperCase() : 'S'}
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Eye className="w-4 h-4 text-white" />
                          </div>
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 block">{student.name}</span>
                          <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                            {student.passcode && (
                              <span className="text-[10px] text-slate-400 font-mono">PIN: {student.passcode}</span>
                            )}
                            {dataService.getStudentSessionCount(student.id) > 0 && (
                              <span
                                className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-md bg-amber-50 border border-amber-200 text-amber-800 font-bold text-[10px]"
                                title={`${dataService.getStudentSessionCount(student.id)} पटक क्विज सबमिसन गरिएको`}
                              >
                                <Trophy className="w-2.5 h-2.5 text-amber-600" />
                                <span>{toNepaliDigits(dataService.getStudentSessionCount(student.id))} सबमिसन</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono font-bold text-red-600">
                      {student.id}
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900 block">{student.class}</span>
                      <div className="flex items-center gap-1 mt-0.5">
                        {student.faculty && (
                          <span className="px-1.5 py-0.2 rounded-sm bg-slate-100 text-slate-700 text-[10px] font-semibold border border-slate-200">
                            {student.faculty}
                          </span>
                        )}
                        <span className="text-slate-400 text-[11px]">({student.semester})</span>
                      </div>
                    </td>

                    <td className="py-3 px-4 font-bold text-slate-800">
                      {lang === 'ne' ? toNepaliDigits(student.rollNo) : student.rollNo}
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-600">
                      {student.phone}
                    </td>

                    <td className="py-3 px-4">
                      {getStatusBadge(student)}
                    </td>

                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      {formatNepalDate(student.createdAt, false)}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Unblock & Provide Password for Blocked Students */}
                        {student.status === 'blocked' && (
                          <button
                            onClick={() => {
                              setUnblockingStudent(student);
                              setNewUnblockPasscode(student.passcode || '1234');
                              setUnblockError('');
                            }}
                            title={lang === 'ne' ? 'खाता अनब्लक र नयाँ पासवर्ड प्रदान गर्नुहोस्' : 'Unblock & Provide Password'}
                            className="px-2.5 py-1 rounded-lg bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-[11px] flex items-center gap-1 shadow-2xs transition cursor-pointer"
                          >
                            <KeyRound className="w-3 h-3 text-slate-950" />
                            <span>{lang === 'ne' ? 'अनब्लक / पासवर्ड' : 'Unblock'}</span>
                          </button>
                        )}
                        {/* Pending Application Review Actions */}
                        {student.status === 'pending' && (
                          <>
                            <button
                              disabled={actionLoadingId === student.id}
                              onClick={() => handleApproveStudent(student)}
                              title={t.btnApprove}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-[11px] flex items-center gap-1 shadow-xs cursor-pointer"
                            >
                              {actionLoadingId === student.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <UserCheck className="w-3 h-3" />
                              )}
                              <span>{t.btnApprove}</span>
                            </button>
                            <button
                              disabled={actionLoadingId === student.id}
                              onClick={() => handleRejectStudent(student)}
                              title={t.btnReject}
                              className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                            >
                              <UserX className="w-3 h-3 text-slate-500" />
                              <span>{t.btnReject}</span>
                            </button>
                          </>
                        )}

                        {/* Edit Student Details Button */}
                        <button
                          onClick={() => openEditModal(student)}
                          title={t.btnEdit}
                          className="p-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition cursor-pointer"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>

                        {/* Activate Button if not active and not pending */}
                        {student.status !== 'active' && student.status !== 'pending' && (
                          <button
                            onClick={() => handleStatusChange(student.id, 'active')}
                            title={t.btnActivate}
                            className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition cursor-pointer"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Suspend Button if not suspended and not pending */}
                        {student.status !== 'suspended' && student.status !== 'pending' && (
                          <button
                            onClick={() => handleStatusChange(student.id, 'suspended')}
                            title={t.btnSuspend}
                            className="p-1.5 rounded-lg bg-orange-50 text-orange-700 hover:bg-orange-100 transition cursor-pointer"
                          >
                            <PauseCircle className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Block Button if not blocked */}
                        {student.status !== 'blocked' && (
                          <button
                            onClick={() => handleStatusChange(student.id, 'blocked')}
                            title={t.btnBlock}
                            className="p-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 transition cursor-pointer"
                          >
                            <Ban className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Permanent Delete Button */}
                        <button
                          onClick={() => setDeleteConfirmStudent(student)}
                          title={t.btnDelete}
                          className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                        {/* WhatsApp Action Button */}
                        <button
                          type="button"
                          onClick={() => {
                            setWhatsAppStudent(student);
                            setIsWhatsAppModalOpen(true);
                          }}
                          title="विद्यार्थीलाई WhatsApp मा जानकारी पठाउनुहोस्"
                          className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition cursor-pointer"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>

                        {/* Send Notification To This Student */}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedStudentForNotification(student.id);
                            setIsNotificationModalOpen(true);
                          }}
                          title="यस विद्यार्थीलाई व्यक्तिगत सूचना पठाउनुहोस्"
                          className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition cursor-pointer"
                        >
                          <Bell className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center">
                    <div className="max-w-md mx-auto flex flex-col items-center justify-center space-y-2">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                        <Search className="w-6 h-6" />
                      </div>
                      <div className="text-sm font-bold text-slate-800">
                        {searchTerm ? (
                          lang === 'ne' ? `"${searchTerm}" को लागि कुनै विद्यार्थी फेला परेन` : `No students matching "${searchTerm}"`
                        ) : (
                          t.noStudentsFound
                        )}
                      </div>
                      <p className="text-xs text-slate-400 max-w-sm">
                        {searchTerm
                          ? (lang === 'ne' ? 'कृपया रोल नम्बर वा नाम अंग्रेजी र नेपाली दुवै अंकमा परीक्षण गर्न सक्नुहुन्छ।' : 'Try searching by student ID, roll number, or phone number.')
                          : (lang === 'ne' ? 'फायरबेस ब्याकइन्डबाट डाटा पुनः तान्न माथिको "डाटाबेस रिफ्रेस" बटन थिच्नुहोस्।' : 'Click the "Refresh Database" button above to pull records from Firebase.')}
                      </p>
                      {searchTerm && (
                        <button
                          onClick={() => setSearchTerm('')}
                          className="mt-2 text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3.5 py-1.5 rounded-lg transition"
                        >
                          {lang === 'ne' ? 'खोज खाली गर्नुहोस् (Clear search)' : 'Clear search'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      </>
      ) : (
        /* Password Reset Requests Table View */
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
            <div>
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-red-600" />
                <span>विद्यार्थी पासवर्ड रिसेट अनुरोधहरू (Password Reset Requests)</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                विद्यार्थीले नाम, फोन, कक्षा, सेमेस्टर र रोल नम्बर प्रमाणित गरी पेस गरेका नयाँ पासवर्ड परिवर्तन अनुरोधहरू
              </p>
            </div>
            <span className="text-xs font-bold text-slate-700 bg-white px-3 py-1.5 rounded-xl border border-slate-200">
              कुल अनुरोध: <b>{resetRequests.length}</b> ({pendingResetCount} पेन्डिङ)
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">विद्यार्थी विवरण</th>
                  <th className="py-3.5 px-4">कक्षा / सेमेस्टर / रोल</th>
                  <th className="py-3.5 px-4">सम्पर्क फोन</th>
                  <th className="py-3.5 px-4 text-center">अनुरोध गरिएको नयाँ पासकोड</th>
                  <th className="py-3.5 px-4">अनुरोध मिति</th>
                  <th className="py-3.5 px-4 text-center">स्थिति</th>
                  <th className="py-3.5 px-4 text-right">एडमिन कारबाही (Actions)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {resetRequests.length > 0 ? (
                  resetRequests.map(req => (
                    <tr key={req.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-4">
                        <div>
                          <span className="font-bold text-slate-900 block text-sm">{req.studentName}</span>
                          <span className="text-[11px] text-slate-400 font-mono">{req.studentId}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-800 block">{req.class}</span>
                        <span className="text-[11px] text-slate-500">
                          {req.semester} | रोल: {toNepaliDigits(req.rollNo)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-700">
                        {req.phone}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="font-mono font-black text-sm px-3 py-1 rounded-xl bg-amber-50 text-amber-900 border border-amber-300">
                          {toNepaliDigits(req.newPasscode)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                        {formatNepalDate(req.requestedAt)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {req.status === 'pending' ? (
                          <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px] inline-flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse"></span>
                            पेन्डिङ (स्वीकृति आवश्यक)
                          </span>
                        ) : req.status === 'approved' ? (
                          <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] inline-flex items-center gap-1">
                            <CheckCircle className="w-3 h-3 text-emerald-600" />
                            स्वीकृत (सक्रिय)
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 font-bold text-[10px] inline-flex items-center gap-1">
                            <X className="w-3 h-3 text-rose-600" />
                            अस्वीकृत
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {req.status === 'pending' ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleApproveReset(req.id)}
                              disabled={actionLoadingId === req.id}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1 transition shadow-2xs cursor-pointer disabled:opacity-50"
                              title="यो नयाँ पासकोड स्वीकृत गरी विद्यार्थीलाई सक्रिय गर्नुहोस्"
                            >
                              {actionLoadingId === req.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <CheckCircle className="w-3.5 h-3.5" />
                              )}
                              <span>स्वीकृत गर्नुहोस्</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRejectReset(req.id)}
                              disabled={actionLoadingId === req.id}
                              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold rounded-xl text-xs flex items-center gap-1 transition cursor-pointer disabled:opacity-50"
                              title="पासवर्ड परिवर्तन अनुरोध अस्वीकार गर्नुहोस्"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>अस्वीकार</span>
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400">
                            {req.reviewedBy ? `स्वीकृतकर्ता: ${req.reviewedBy}` : 'सम्पन्न'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      हाल कुनै पनि पासवर्ड रिसेट अनुरोध छैन।
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Student Modal */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-7 shadow-2xl space-y-4 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Edit className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900">{t.editStudentTitle}</h3>
                  <p className="text-[11px] text-slate-500 font-mono">ID: {editingStudent.id}</p>
                </div>
              </div>
              <button
                onClick={() => setEditingStudent(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  {t.fieldFullName}
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    {lang === 'ne' ? 'संकाय (Faculty) *' : 'Faculty *'}
                  </label>
                  <select
                    value={editFaculty}
                    onChange={e => setEditFaculty(e.target.value as 'Management' | 'Humanity' | 'Art')}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  >
                    <option value="Art">कला (Art)</option>
                    <option value="Humanity">मानविकी (Humanity)</option>
                    <option value="Management">व्यवस्थापन (Management)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    {t.fieldClass}
                  </label>
                  <select
                    value={editClass}
                    onChange={e => setEditClass(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  >
                    <option value="BCA">BCA</option>
                    <option value="BBS">BBS</option>
                    <option value="B.Sc.CSIT">B.Sc.CSIT</option>
                    <option value="B.Ed">B.Ed</option>
                    <option value="BA">BA</option>
                    <option value="MBS">MBS</option>
                    <option value="M.Ed">M.Ed</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    {t.fieldSemester}
                  </label>
                  <input
                    type="text"
                    required
                    value={editSemester}
                    onChange={e => setEditSemester(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    {t.fieldRoll}
                  </label>
                  <input
                    type="text"
                    required
                    value={editRollNo}
                    onChange={e => setEditRollNo(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    {t.fieldPhone}
                  </label>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={editPhone}
                    onChange={e => setEditPhone(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    {t.fieldPasscode}
                  </label>
                  <input
                    type="text"
                    maxLength={4}
                    value={editPasscode}
                    onChange={e => setEditPasscode(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-mono tracking-widest"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  {t.fieldStatus}
                </label>
                <select
                  value={editStatus}
                  onChange={e => setEditStatus(e.target.value as StudentStatus)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                >
                  <option value="pending">{t.statusPending}</option>
                  <option value="approved">{t.statusApproved}</option>
                  <option value="active">{t.statusActive}</option>
                  <option value="suspended">{t.statusSuspended}</option>
                  <option value="blocked">{t.statusBlocked}</option>
                  <option value="disabled">{lang === 'ne' ? 'निष्क्रिय (Disabled)' : 'Disabled'}</option>
                  <option value="restricted">{t.statusRestricted}</option>
                  <option value="rejected">{t.statusRejected}</option>
                </select>
              </div>

              <div className="flex gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  {t.btnCancel}
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? t.savingStudent : t.btnSaveStudent}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmStudent && (() => {
        const attemptCount = dataService.getStudentSessionCount(deleteConfirmStudent.id);
        return (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
              <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto text-2xl font-bold">
                ⚠️
              </div>
              <div className="text-center">
                <h3 className="text-lg font-black text-slate-900">{t.deleteTitle}</h3>
                <p className="text-xs text-slate-600 mt-1">
                  {lang === 'ne' ? (
                    <>के तपाईं <b>{deleteConfirmStudent.name}</b> ({deleteConfirmStudent.id}) को खाता प्रणालीबाट पूर्ण रूपमा मेटाउन निश्चित हुनुहुन्छ? यो कार्य फिर्ता गर्न सकिँदैन।</>
                  ) : (
                    <>Are you sure you want to permanently delete <b>{deleteConfirmStudent.name}</b> ({deleteConfirmStudent.id})? This action cannot be undone.</>
                  )}
                </p>

                {attemptCount > 0 && (
                  <div className="mt-3.5 p-3 bg-amber-50 rounded-2xl border border-amber-200 text-left space-y-1">
                    <div className="flex items-center gap-2 text-amber-800 font-bold text-xs">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>क्विज सबमिसन समावेश छ ({toNepaliDigits(attemptCount)} वटा क्विज सबमिसन)</span>
                    </div>
                    <p className="text-[11px] text-amber-700 leading-relaxed">
                      यस विद्यार्थीले क्विजमा सहभागिता जनाइसकेका छन्। मेटाउँदा विद्यार्थी खातासँगै उहाँका सम्पूर्ण क्विज सबमिसन, प्राप्तांक र स्कोरकार्ड रेकर्डहरू प्रणाली र ब्याकइन्डबाट पूर्ण रूपमा मेटिनेछन्।
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmStudent(null)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
                >
                  {t.btnCancel}
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow transition"
                >
                  {t.btnConfirmDelete}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* WhatsApp Modal */}
      <WhatsAppModal
        isOpen={isWhatsAppModalOpen}
        onClose={() => setIsWhatsAppModalOpen(false)}
        student={whatsAppStudent}
      />

      {/* Send Notification Modal */}
      <SendNotificationModal
        isOpen={isNotificationModalOpen}
        onClose={() => setIsNotificationModalOpen(false)}
        students={students}
        preselectedStudentId={selectedStudentForNotification}
        onNotificationSent={onRefresh}
      />

      {/* Student Profile Photo Preview Modal */}
      {previewPhotoStudent && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setPreviewPhotoStudent(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200 p-6 relative"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setPreviewPhotoStudent(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition cursor-pointer"
              title="बन्द गर्नुहोस्"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-4">
              {/* Photo Display */}
              <div className="w-48 h-48 mx-auto rounded-2xl overflow-hidden border-4 border-red-200 shadow-xl bg-slate-100 flex items-center justify-center">
                {previewPhotoStudent.profilePhoto ? (
                  <img
                    src={previewPhotoStudent.profilePhoto}
                    alt={previewPhotoStudent.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-red-600 to-slate-800 text-white font-black text-5xl flex items-center justify-center">
                    {previewPhotoStudent.name ? previewPhotoStudent.name.trim().charAt(0).toUpperCase() : 'S'}
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-xl font-black text-slate-900">{previewPhotoStudent.name}</h3>
                <p className="text-xs text-red-600 font-mono font-bold mt-0.5">ID: {previewPhotoStudent.id}</p>
                <p className="text-xs text-slate-600 mt-1">
                  {previewPhotoStudent.faculty ? `${previewPhotoStudent.faculty} • ` : ''}{previewPhotoStudent.class} ({previewPhotoStudent.semester}) | रोल {toNepaliDigits(previewPhotoStudent.rollNo)}
                </p>
                <p className="text-xs text-slate-500 font-mono mt-0.5">सम्पर्क: {previewPhotoStudent.phone}</p>
                <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold">
                  <Camera className="w-3.5 h-3.5 text-red-600" />
                  <span>विद्यार्थीद्वारा दर्ता गर्दा पेश गरिएको फोटो</span>
                </div>
              </div>

              {/* Action Buttons in Modal if pending */}
              {previewPhotoStudent.status === 'pending' && (
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    disabled={actionLoadingId === previewPhotoStudent.id}
                    onClick={async () => {
                      const st = previewPhotoStudent;
                      setPreviewPhotoStudent(null);
                      await handleApproveStudent(st);
                    }}
                    className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>APPROVE (स्वीकृत)</span>
                  </button>

                  <button
                    disabled={actionLoadingId === previewPhotoStudent.id}
                    onClick={async () => {
                      const st = previewPhotoStudent;
                      setPreviewPhotoStudent(null);
                      await handleRejectStudent(st);
                    }}
                    className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <UserX className="w-4 h-4 text-slate-600" />
                    <span>REJECT (अस्वीकृत)</span>
                  </button>
                </div>
              )}

              <button
                onClick={() => setPreviewPhotoStudent(null)}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition cursor-pointer"
              >
                बन्द गर्नुहोस् (Close)
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Master Admin Unblock & Provide Password Modal */}
      {unblockingStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    {lang === 'ne' ? 'खाता अनब्लक र नयाँ पासवर्ड प्रदान' : 'Unblock Account & Assign Password'}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-mono">
                    ID: {unblockingStudent.id} • {unblockingStudent.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setUnblockingStudent(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {unblockError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{unblockError}</span>
              </div>
            )}

            <form onSubmit={handleUnblockAndProvidePassword} className="space-y-4">
              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-2xl text-xs text-amber-900 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <span>ℹ️</span>
                  <span>खाता अनब्लक प्रक्रिया:</span>
                </p>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  ३ पटक लगातार गलत पासवर्ड प्रविष्ट भएका कारण वा सुरक्षाका लागि यो खाता ब्लक भएको हो। नयाँ ४-अंकको पासकोड (PIN) राखेर अनब्लक गर्नुहोस् र विद्यार्थीलाई प्रदान गर्नुहोस्।
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  {lang === 'ne' ? 'नयाँ ४-अंकको पासकोड (New 4-Digit PIN) *' : 'New 4-Digit PIN *'}
                </label>
                <input
                  type="text"
                  required
                  maxLength={4}
                  value={newUnblockPasscode}
                  onChange={e => setNewUnblockPasscode(fromNepaliDigits(e.target.value).replace(/\D/g, ''))}
                  placeholder="उदा. 1234"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-base font-mono font-bold tracking-widest text-center"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setUnblockingStudent(null)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
                >
                  {t.btnCancel}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow transition flex items-center justify-center gap-1.5"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>{lang === 'ne' ? 'अनब्लक र पासवर्ड सेट गर्नुहोस्' : 'Unblock & Save'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
