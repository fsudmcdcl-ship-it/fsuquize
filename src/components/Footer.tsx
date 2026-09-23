import React from 'react';
import { ExternalLink, Phone, Mail, MapPin } from 'lucide-react';

interface FooterProps {
  navigate: (path: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ navigate }) => {
  return (
    <footer className="bg-slate-900 text-slate-400 py-10 mt-auto border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Column 1: Campus Info */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🎓</span>
              <span className="text-lg font-bold text-white tracking-tight">
                दार्चुला बहुमुखी क्याम्पस (Darchula Multiple Campus)
              </span>
            </div>
            <p className="text-sm text-slate-300 font-medium">
              स्वतन्त्र विद्यार्थी युनियन (FSU) द्वारा सञ्चालित आधिकारिक साप्ताहिक क्याम्पस क्विज पोर्टल। 
              विद्यार्थीहरूमा बौद्धिक चेतना, अध्ययनशीलता र प्रतिस्पर्धात्मक क्षमता अभिवृद्धि गर्ने हाम्रो उद्देश्य हो।
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <a
                href="https://fsudmc.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600/90 hover:bg-red-600 text-white text-xs font-bold transition shadow-xs"
              >
                <span>मुख्य क्याम्पस वेबसाइट (fsudmc.com)</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <span className="text-xs text-slate-400 font-mono">
                क्विज डोमेन: quize.fsudmc.com
              </span>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-3">महत्वपूर्ण लिङ्कहरू</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <button onClick={() => navigate('/todays-quize')} className="hover:text-white transition cursor-pointer">
                  आजको क्विज
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/winner-list')} className="hover:text-white transition cursor-pointer">
                  साप्ताहिक विजेता सूची
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/register')} className="hover:text-white transition cursor-pointer">
                  नयाँ विद्यार्थी दर्ता
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/my-status')} className="hover:text-white transition cursor-pointer">
                  मेरो स्थिति तथा नतिजा
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Contact & Support */}
          <div>
            <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-3">सम्पर्क र सहयोग</h4>
            <p className="text-xs text-slate-400 mb-2">
              क्विज सम्बन्धी कुनै जिज्ञासा वा समस्या भएमा स्ववियु सचिवालयमा सम्पर्क गर्नुहोस्।
            </p>
            <div className="text-xs text-slate-300 space-y-1.5">
              <p className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-red-400 shrink-0" />
                <span>स्ववियु सचिवालय, दार्चुला बहुमुखी क्याम्पस</span>
              </p>
              <p className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>सम्पर्क: ९७४१८२३१२२</span>
              </p>
              <p className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>इमेल: info@fsudmc.com</span>
              </p>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-800 text-center text-xs text-slate-500 flex flex-col sm:flex-row justify-between items-center gap-2">
          <p>© {new Date().getFullYear()} Darchula Multiple Campus. FSU All Rights Reserved.</p>
          <p className="text-[11px] text-slate-400">
            नेपाल मानक समय (NPT +५:४५ Asia/Kathmandu) आधारित निष्पक्ष मूल्याङ्कन
          </p>
        </div>
      </div>
    </footer>
  );
};
