import React, { useState, useEffect } from 'react';
import type { Student, AppNotification, NotificationType } from '../../types/quiz';
import { dataService } from '../../lib/dataService';
import { getWhatsAppUrl, getCustomNotificationWhatsAppMessage } from '../../lib/whatsappUtils';
import {
  Bell,
  Send,
  Users,
  User,
  AlertTriangle,
  Info,
  CheckCircle,
  Flame,
  Trash2,
  X,
  ExternalLink,
  Search,
  MessageSquare,
  Clock,
} from 'lucide-react';

interface SendNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  preselectedStudentId?: string;
  onNotificationSent?: () => void;
}

export const SendNotificationModal: React.FC<SendNotificationModalProps> = ({
  isOpen,
  onClose,
  students,
  preselectedStudentId,
  onNotificationSent,
}) => {
  const [activeTab, setActiveTab] = useState<'send' | 'history'>('send');
  const [targetType, setTargetType] = useState<'all' | 'specific'>('all');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const [type, setType] = useState<NotificationType>('info');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [alsoWhatsApp, setAlsoWhatsApp] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusFeedback, setStatusFeedback] = useState<{ type: 'success' | 'error'; text: string; whatsappUrl?: string } | null>(null);

  const notifications = dataService.getNotifications();

  useEffect(() => {
    if (preselectedStudentId) {
      setTargetType('specific');
      setSelectedStudentId(preselectedStudentId);
    }
  }, [preselectedStudentId]);

  if (!isOpen) return null;

  const filteredStudents = students.filter(s => {
    const q = studentSearch.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      s.id.toLowerCase().includes(q) ||
      s.rollNo.toLowerCase().includes(q) ||
      (s.phone && s.phone.includes(q))
    );
  });

  const selectedStudent = students.find(s => s.id === selectedStudentId);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      setStatusFeedback({ type: 'error', text: 'कृपया शीर्षक र सूचनाको विवरण दुबै भर्नुहोस्।' });
      return;
    }

    if (targetType === 'specific' && !selectedStudentId) {
      setStatusFeedback({ type: 'error', text: 'कृपया सूचना पठाउन एकजना विद्यार्थी छान्नुहोस्।' });
      return;
    }

    setIsSubmitting(true);
    setStatusFeedback(null);

    try {
      const currentAdmin = dataService.getCurrentAdmin();
      const adminEmail = currentAdmin?.email || 'admin@fsudmc.com';

      const res = await dataService.sendNotification({
        title: title.trim(),
        message: message.trim(),
        targetType,
        targetStudentId: targetType === 'specific' ? selectedStudentId : undefined,
        targetStudentName: targetType === 'specific' && selectedStudent ? selectedStudent.name : undefined,
        type,
        adminEmail,
      });

      if (res.success) {
        let waUrl = '';
        if (targetType === 'specific' && selectedStudent && alsoWhatsApp) {
          const waText = getCustomNotificationWhatsAppMessage(selectedStudent.name, title.trim(), message.trim());
          waUrl = getWhatsAppUrl(selectedStudent.phone || '', waText);
        }

        setStatusFeedback({
          type: 'success',
          text: targetType === 'all'
            ? 'सबै विद्यार्थीहरूलाई सूचना सफलतापूर्वक पठाइयो!'
            : `विद्यार्थी ${selectedStudent?.name || ''} लाई सूचना सफलतापूर्वक पठाइयो!`,
          whatsappUrl: waUrl || undefined,
        });

        // Reset form
        setTitle('');
        setMessage('');
        if (onNotificationSent) onNotificationSent();
      } else {
        setStatusFeedback({ type: 'error', text: `सूचना पठाउन सकिएन: ${res.error || 'अज्ञात त्रुटि'}` });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setStatusFeedback({ type: 'error', text: `त्रुटि: ${msg}` });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (notifId: string) => {
    try {
      await dataService.deleteNotification(notifId);
      if (onNotificationSent) onNotificationSent();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-indigo-800 px-6 py-5 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold">सूचना व्यवस्थापन प्रणाली (Notifications)</h3>
              <p className="text-indigo-100 text-xs font-medium">विद्यार्थीहरूलाई प्रत्यक्ष वा सामूहिक सूचना पठाउनुहोस्</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('send')}
            className={`flex-1 py-3 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-colors ${
              activeTab === 'send'
                ? 'border-indigo-600 text-indigo-700 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>नयाँ सूचना पठाउनुहोस् (Send)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-3 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-colors ${
              activeTab === 'history'
                ? 'border-indigo-600 text-indigo-700 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>पठाइएका सूचनाहरू ({notifications.length})</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {statusFeedback && (
            <div
              className={`p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-bold ${
                statusFeedback.type === 'success'
                  ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                  : 'bg-rose-50 text-rose-900 border border-rose-200'
              }`}
            >
              <div className="flex items-center gap-2">
                {statusFeedback.type === 'success' ? (
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{statusFeedback.text}</span>
              </div>
              {statusFeedback.whatsappUrl && (
                <a
                  href={statusFeedback.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shrink-0 shadow-sm"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>WhatsApp मा पनि पठाउनुहोस्</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          )}

          {activeTab === 'send' ? (
            <form onSubmit={handleSend} className="space-y-4">
              {/* Target Selection */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">सूचना कसलाई पठाउने? (Target Audience):</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setTargetType('all');
                      setAlsoWhatsApp(false);
                    }}
                    className={`p-3.5 rounded-2xl border-2 text-left flex items-start gap-3 transition-all ${
                      targetType === 'all'
                        ? 'border-indigo-600 bg-indigo-50/60 text-indigo-900 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                    }`}
                  >
                    <div className={`p-2 rounded-xl shrink-0 ${targetType === 'all' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs sm:text-sm">सबै विद्यार्थीहरूलाई (Everyone)</h4>
                      <p className="text-[11px] text-slate-500">सम्पूर्ण विद्यार्थीहरूको ड्यासबोर्डमा देखिनेछ</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTargetType('specific')}
                    className={`p-3.5 rounded-2xl border-2 text-left flex items-start gap-3 transition-all ${
                      targetType === 'specific'
                        ? 'border-indigo-600 bg-indigo-50/60 text-indigo-900 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                    }`}
                  >
                    <div className={`p-2 rounded-xl shrink-0 ${targetType === 'specific' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs sm:text-sm">निश्चित विद्यार्थीलाई (User Specific)</h4>
                      <p className="text-[11px] text-slate-500">छानिएको विद्यार्थीलाई मात्र सूचना जानेछ</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Specific Student Selector */}
              {targetType === 'specific' && (
                <div className="space-y-2 p-4 bg-slate-50 rounded-2xl border border-slate-200 animate-in fade-in">
                  <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span>विद्यार्थी छान्नुहोस् (Select Student):</span>
                    {selectedStudent && (
                      <span className="text-[11px] font-semibold text-emerald-700">
                        छानिएको: {selectedStudent.name} (ID: {selectedStudent.id})
                      </span>
                    )}
                  </label>

                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      value={studentSearch}
                      onChange={e => setStudentSearch(e.target.value)}
                      placeholder="नाम, ID, रोल नं वा फोनबाट खोज्नुहोस्..."
                      className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                    />
                  </div>

                  <div className="max-h-36 overflow-y-auto space-y-1 rounded-xl border border-slate-200 p-1 bg-white">
                    {filteredStudents.length === 0 ? (
                      <p className="p-3 text-center text-xs text-slate-500">कुनै विद्यार्थी फेला परेन।</p>
                    ) : (
                      filteredStudents.map(st => (
                        <button
                          key={st.id}
                          type="button"
                          onClick={() => setSelectedStudentId(st.id)}
                          className={`w-full p-2.5 rounded-lg text-left text-xs flex items-center justify-between transition-colors ${
                            selectedStudentId === st.id
                              ? 'bg-indigo-600 text-white font-bold'
                              : 'hover:bg-slate-100 text-slate-800'
                          }`}
                        >
                          <div>
                            <span className="font-semibold">{st.name}</span>
                            <span className={`ml-2 text-[10px] ${selectedStudentId === st.id ? 'text-indigo-200' : 'text-slate-500'}`}>
                              ({st.id} • {st.class})
                            </span>
                          </div>
                          {st.phone && (
                            <span className={`text-[10px] ${selectedStudentId === st.id ? 'text-indigo-200' : 'text-slate-400'}`}>
                              📱 {st.phone}
                            </span>
                          )}
                        </button>
                      ))
                    )}
                  </div>

                  {selectedStudent && (
                    <label className="flex items-center gap-2 pt-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={alsoWhatsApp}
                        onChange={e => setAlsoWhatsApp(e.target.checked)}
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-xs font-semibold text-emerald-800">
                        📱 यो सूचना विद्यार्थीको WhatsApp मा पनि पठाउने लिंक तयार गर्ने
                      </span>
                    </label>
                  )}
                </div>
              )}

              {/* Notification Category / Type */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">सूचनाको प्रकार (Notification Category):</label>
                <div className="grid grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setType('info')}
                    className={`p-2.5 rounded-xl border text-center text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                      type === 'info'
                        ? 'border-blue-500 bg-blue-50 text-blue-800 shadow-sm'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Info className="w-4 h-4 text-blue-600" />
                    <span>जानकारी</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('success')}
                    className={`p-2.5 rounded-xl border text-center text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                      type === 'success'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-sm'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>बधाई / सफलता</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('warning')}
                    className={`p-2.5 rounded-xl border text-center text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                      type === 'warning'
                        ? 'border-amber-500 bg-amber-50 text-amber-800 shadow-sm'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>सावधानी</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('urgent')}
                    className={`p-2.5 rounded-xl border text-center text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                      type === 'urgent'
                        ? 'border-rose-500 bg-rose-50 text-rose-800 shadow-sm'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Flame className="w-4 h-4 text-rose-600" />
                    <span>अति जरुरी</span>
                  </button>
                </div>
              </div>

              {/* Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">सूचनाको शीर्षक (Notification Title):</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="उदा: हप्ता १३ को साप्ताहिक क्विज खुला भयो!"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm font-semibold text-slate-800"
                  required
                />
              </div>

              {/* Message */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">सूचना विवरण (Notification Message):</label>
                <textarea
                  rows={4}
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="यहाँ विस्तृत सूचना लेख्नुहोस्..."
                  className="w-full p-3.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-xs sm:text-sm text-slate-800 leading-relaxed resize-none"
                  required
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs sm:text-sm transition-colors"
                >
                  रद्द गर्नुहोस्
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-indigo-600/20 flex items-center gap-2 transition-all disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmitting ? 'पठाउँदै...' : 'सूचना पठाउनुहोस् (Send)'}</span>
                </button>
              </div>
            </form>
          ) : (
            /* History Tab */
            <div className="space-y-3">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-slate-500 space-y-2">
                  <Bell className="w-8 h-8 mx-auto text-slate-300" />
                  <p className="text-xs font-medium">हालसम्म कुनै सूचना पठाइएको छैन।</p>
                </div>
              ) : (
                notifications.map(notif => (
                  <div
                    key={notif.id}
                    className="p-4 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-white transition-all space-y-2"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                              notif.type === 'urgent'
                                ? 'bg-rose-100 text-rose-800'
                                : notif.type === 'warning'
                                ? 'bg-amber-100 text-amber-800'
                                : notif.type === 'success'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {notif.type === 'urgent' ? '🚨 अति जरुरी' : notif.type === 'warning' ? '⚠️ सावधानी' : notif.type === 'success' ? '🏆 बधाई' : 'ℹ️ जानकारी'}
                          </span>

                          <span className="text-[10px] font-bold text-slate-600 bg-slate-200/80 px-2 py-0.5 rounded-md">
                            {notif.targetType === 'all' ? '👥 सबैलाई' : `👤 ${notif.targetStudentName || notif.targetStudentId}`}
                          </span>

                          <span className="text-[10px] text-slate-400">
                            {new Date(notif.createdAt).toLocaleDateString('ne-NP')}
                          </span>
                        </div>

                        <h4 className="font-bold text-slate-900 text-xs sm:text-sm">{notif.title}</h4>
                      </div>

                      <button
                        onClick={() => handleDelete(notif.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="सूचना मेटाउनुहोस्"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">{notif.message}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
