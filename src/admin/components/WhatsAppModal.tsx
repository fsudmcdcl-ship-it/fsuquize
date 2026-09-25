import React, { useState, useEffect } from 'react';
import type { Student } from '../../types/quiz';
import { getWhatsAppUrl, getAccountActiveWhatsAppMessage } from '../../lib/whatsappUtils';
import { MessageSquare, Phone, Copy, Check, X, ExternalLink, ShieldCheck } from 'lucide-react';

interface WhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  initialMessage?: string;
  title?: string;
  subtitle?: string;
  badgeText?: string;
}

export const WhatsAppModal: React.FC<WhatsAppModalProps> = ({
  isOpen,
  onClose,
  student,
  initialMessage,
  title = 'WhatsApp मा जानकारी पठाउनुहोस्',
  subtitle = 'खाता सम्बन्धी आधिकारिक सूचना',
  badgeText,
}) => {
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (student) {
      setPhone(student.phone || '');
      setMessage(initialMessage || getAccountActiveWhatsAppMessage(student));
      setCopied(false);
    }
  }, [student, initialMessage]);

  if (!isOpen || !student) return null;

  const whatsappUrl = getWhatsAppUrl(phone, message);

  const handleCopy = () => {
    navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-emerald-100 max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold">{title}</h3>
              <p className="text-emerald-100 text-xs font-medium">{subtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Student Quick Pill */}
          <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-2xl p-4 flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-emerald-800 bg-emerald-200/80 px-2 py-0.5 rounded-full">
                  {badgeText || (student.status === 'active' || student.status === 'approved' ? 'स्वीकृत (Approved)' : student.status)}
                </span>
                <span className="text-xs text-slate-500 font-medium">ID: {student.id}</span>
              </div>
              <h4 className="font-bold text-slate-900 text-base">{student.name}</h4>
              <p className="text-xs text-slate-600">
                कक्षा: {student.class} {student.semester ? `(${student.semester})` : ''} • रोल नं: {student.rollNo}
              </p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
          </div>

          {/* Phone Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-emerald-600" />
              विद्यार्थीको WhatsApp / फोन नम्बर:
            </label>
            <div className="relative">
              <input
                type="text"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="९८xxxxxxxx वा ९७xxxxxxxx"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-sm font-semibold text-slate-800"
              />
            </div>
            <p className="text-[11px] text-slate-500">
              नेपालको नम्बर भए प्रणालीले स्वतः ९७७ (Country Code) थप्नेछ।
            </p>
          </div>

          {/* Message Area */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700">सन्देश (WhatsApp Message Preview):</label>
              <button
                type="button"
                onClick={handleCopy}
                className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1 hover:underline"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'कपी गरियो!' : 'सन्देश कपी गर्नुहोस्'}
              </button>
            </div>
            <textarea
              rows={6}
              value={message}
              onChange={e => setMessage(e.target.value)}
              className="w-full p-3.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-xs sm:text-sm text-slate-800 leading-relaxed font-sans resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all transform active:scale-95"
            >
              <MessageSquare className="w-4 h-4" />
              <span>📱 WhatsApp मा पठाउनुहोस्</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-80" />
            </a>
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto py-3 px-5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-colors"
            >
              सम्पन्न / बन्द गर्नुहोस्
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
