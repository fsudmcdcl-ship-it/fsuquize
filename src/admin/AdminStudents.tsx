import React, { useState, useEffect } from 'react';
import type { Student, StudentStatus } from '../types/quiz';
import { toNepaliDigits, formatNepalDate } from '../lib/nepaliUtils';
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
  MessageSquare
} from 'lucide-react';
import {
  getAdminLanguage,
  adminTranslations,
  type AdminLanguage
} from './adminTranslations';
import { WhatsAppModal } from './components/WhatsAppModal';
import { SendNotificationModal } from './components/SendNotificationModal';

interface AdminStudentsProps {
  students: Student[];
  onRefresh: () => void;
}

export const AdminStudents: React.FC<AdminStudentsProps> = ({ students, onRefresh }) => {
  const [lang, setLang] = useState<AdminLanguage>(getAdminLanguage);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended' | 'blocked' | 'restricted'>('all');
  const [deleteConfirmStudent, setDeleteConfirmStudent] = useState<Student | null>(null);

  // WhatsApp & Notification Modals State
  const [whatsAppStudent, setWhatsAppStudent] = useState<Student | null>(null);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [selectedStudentForNotification, setSelectedStudentForNotification] = useState<string | undefined>(undefined);

  // Edit Student Modal State
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editName, setEditName] = useState('');
  const [editRollNo, setEditRollNo] = useState('');
  const [editClass, setEditClass] = useState('BCA');
  const [editSemester, setEditSemester] = useState('प्रथम');
  const [editPhone, setEditPhone] = useState('');
  const [editPasscode, setEditPasscode] = useState('');
  const [editStatus, setEditStatus] = useState<StudentStatus>('active');
  const [editError, setEditError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const t = adminTranslations[lang];

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
    if (!rawSearch) {
      return statusFilter === 'all' || s.status === statusFilter;
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

    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
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
    dataService.deleteStudent(deleteConfirmStudent.id, 'admin@fsudmc.com');
    setDeleteConfirmStudent(null);
    onRefresh();
    showToast(
      lang === 'ne'
        ? 'विद्यार्थी खाता ब्याकइन्डबाट स्थायी रूपमा हटाइयो।'
        : 'Student account permanently removed from backend.'
    );
  };

  const openEditModal = (student: Student) => {
    setEditingStudent(student);
    setEditName(student.name);
    setEditRollNo(student.rollNo);
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

  const getStatusBadge = (status: StudentStatus) => {
    switch (status) {
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
            <span>{status === 'approved' ? t.statusApproved : t.statusActive}</span>
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
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            <span>{t.statusBlocked}</span>
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
            <span>{t.statusRestricted}</span>
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
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full overflow-hidden bg-slate-200 shrink-0 border border-slate-300">
                          <img
                            src={
                              student.profilePhoto ||
                              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face'
                            }
                            alt={student.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 block">{student.name}</span>
                          {student.passcode && (
                            <span className="text-[10px] text-slate-400 font-mono">PIN: {student.passcode}</span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono font-bold text-red-600">
                      {student.id}
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-800">{student.class}</span>
                      <span className="text-slate-400 text-[11px] block">({student.semester})</span>
                    </td>

                    <td className="py-3 px-4 font-bold text-slate-800">
                      {lang === 'ne' ? toNepaliDigits(student.rollNo) : student.rollNo}
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-600">
                      {student.phone}
                    </td>

                    <td className="py-3 px-4">
                      {getStatusBadge(student.status)}
                    </td>

                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      {formatNepalDate(student.createdAt, false)}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
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

      {/* Edit Student Modal */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Edit className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">{t.editStudentTitle}</h3>
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

            <form onSubmit={handleSaveEdit} className="space-y-4">
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

              <div className="grid grid-cols-2 gap-3">
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
              </div>

              <div className="grid grid-cols-2 gap-3">
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
              </div>

              <div className="grid grid-cols-2 gap-3">
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
                    <option value="restricted">{t.statusRestricted}</option>
                    <option value="rejected">{t.statusRejected}</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                >
                  {t.btnCancel}
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5"
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
      {deleteConfirmStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
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
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmStudent(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                {t.btnCancel}
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow transition"
              >
                {t.btnConfirmDelete}
              </button>
            </div>
          </div>
        </div>
      )}

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
    </div>
  );
};
