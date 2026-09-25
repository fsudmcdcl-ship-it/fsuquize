import React, { useState, useEffect, useRef } from 'react';
import type { Student, AppNotification } from '../types/quiz';
import { dataService, triggerSystemNotification } from '../lib/dataService';
import { Bell, CheckCheck, Info, CheckCircle, AlertTriangle, Flame, X, MessageSquare, Clock, BellRing } from 'lucide-react';

interface NotificationBellProps {
  student: Student | null;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ student }) => {
  if (!student) {
    return null;
  }

  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [permission, setPermission] = useState<NotificationPermission>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'default';
  });
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleRequestPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const res = await Notification.requestPermission();
        setPermission(res);
        if (res === 'granted') {
          triggerSystemNotification(
            'दार्चुला बहुमुखी क्याम्पस स्ववियु',
            'मोबाइल नोटिफिकेसन सक्रिय भयो! अब हरेक नयाँ क्विज र सूचना तपाईंको फोन नोटिफिकेसनमा आउनेछ।'
          );
        }
      } catch (e) {
        console.debug('Permission request notice:', e);
      }
    }
  };

  const loadNotifications = () => {
    const notifs = dataService.getNotificationsForStudent(student?.id);
    setNotifications(notifs);
    setUnreadCount(dataService.getUnreadNotificationCount(student?.id));
  };

  useEffect(() => {
    loadNotifications();
    const unsub = dataService.subscribe(() => {
      loadNotifications();
    });
    return unsub;
  }, [student?.id]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleMarkAllRead = () => {
    if (student?.id) {
      dataService.markAllNotificationsAsRead(student.id);
      loadNotifications();
    }
  };

  const handleNotificationClick = (notif: AppNotification) => {
    if (student?.id) {
      dataService.markNotificationAsRead(notif.id, student.id);
      loadNotifications();
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
        title="सूचनाहरू (Notifications)"
        aria-label="सूचनाहरू"
      >
        <Bell className="w-5 h-5 text-slate-700" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center min-w-4 h-4 px-1 rounded-full bg-red-600 text-white text-[10px] font-black shadow-xs animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-400" />
              <h3 className="font-bold text-sm">सूचनाहरू (Notifications)</h3>
              {unreadCount > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-600 text-white">
                  {unreadCount} नयाँ
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && student?.id && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  title="सबै पढेको चिन्ह लगाउनुहोस्"
                  className="text-[11px] text-slate-300 hover:text-white flex items-center gap-1 cursor-pointer font-medium"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>सबै पढियो</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Phone Notification Permission Prompt */}
          {typeof window !== 'undefined' && 'Notification' in window && permission !== 'granted' && (
            <div className="bg-amber-50 p-3 border-b border-amber-200 text-xs flex items-center justify-between gap-2 text-amber-900">
              <div className="flex items-center gap-2">
                <BellRing className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="text-[11px] leading-tight font-medium">
                  क्विज सूचना मोबाइलमा पाउन अनुमति दिनुहोस्
                </span>
              </div>
              <button
                type="button"
                onClick={handleRequestPermission}
                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-[10px] shrink-0 cursor-pointer shadow-2xs"
              >
                अनुमति दिनुहोस्
              </button>
            </div>
          )}

          {typeof window !== 'undefined' && 'Notification' in window && permission === 'granted' && (
            <div className="bg-emerald-50 px-3 py-1.5 border-b border-emerald-100 text-[10px] font-bold text-emerald-800 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>मोबाइल नोटिफिकेसन अलर्ट सक्रिय छ</span>
              </span>
              <span className="text-[10px] text-emerald-600 font-semibold">✓ Enabled</span>
            </div>
          )}

          {/* Notification List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400 space-y-1">
                <Bell className="w-8 h-8 mx-auto text-slate-300" />
                <p className="text-xs font-semibold text-slate-600">कुनै नयाँ सूचना छैन</p>
                <p className="text-[11px] text-slate-400">प्रशासकबाट आएका सूचनाहरू यहाँ देखिनेछन्।</p>
              </div>
            ) : (
              notifications.map(notif => {
                const isRead = student?.id ? (notif.readBy && notif.readBy.includes(student.id)) : true;
                return (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`p-3.5 transition-colors cursor-pointer flex gap-3 ${
                      !isRead ? 'bg-amber-50/60 hover:bg-amber-50' : 'bg-white hover:bg-slate-50'
                    }`}
                  >
                    {/* Icon */}
                    <div className="shrink-0 mt-0.5">
                      {notif.type === 'urgent' ? (
                        <div className="w-7 h-7 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
                          <Flame className="w-4 h-4" />
                        </div>
                      ) : notif.type === 'warning' ? (
                        <div className="w-7 h-7 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                          <AlertTriangle className="w-4 h-4" />
                        </div>
                      ) : notif.type === 'success' ? (
                        <div className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                          <CheckCircle className="w-4 h-4" />
                        </div>
                      ) : (
                        <div className="w-7 h-7 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                          <Info className="w-4 h-4" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className={`text-xs font-bold ${!isRead ? 'text-slate-900' : 'text-slate-700'}`}>
                          {notif.title}
                        </h4>
                        {!isRead && (
                          <span className="w-2 h-2 rounded-full bg-red-600 shrink-0"></span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed whitespace-pre-wrap">
                        {notif.message}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 pt-1">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(notif.createdAt).toLocaleDateString('ne-NP')}</span>
                        {notif.targetType === 'specific' && (
                          <span className="text-[9px] bg-indigo-100 text-indigo-800 font-bold px-1.5 py-0.2 rounded">
                            व्यक्तिगत (Direct)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
