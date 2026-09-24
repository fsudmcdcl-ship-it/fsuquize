/**
 * WhatsApp integration utilities for FSU DMC Quiz Portal
 */

export function formatNepalPhoneNumber(phone?: string | null): string {
  if (!phone) return '';
  // Strip all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  if (!cleaned) return '';

  // If already starts with 977 and has >= 12 digits
  if (cleaned.startsWith('977') && cleaned.length >= 12) {
    return cleaned;
  }

  // If 10 digits starting with 9 (Nepali mobile numbers e.g. 98xxxxxxxx, 97xxxxxxxx)
  if (cleaned.length === 10 && (cleaned.startsWith('98') || cleaned.startsWith('97') || cleaned.startsWith('96'))) {
    return `977${cleaned}`;
  }

  // If 10 digits starting with 0
  if (cleaned.length === 10 && cleaned.startsWith('0')) {
    return `977${cleaned.slice(1)}`;
  }

  return cleaned;
}

export function getWhatsAppUrl(phone: string, text: string): string {
  const formattedPhone = formatNepalPhoneNumber(phone);
  if (!formattedPhone) {
    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  }
  return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(text)}`;
}

export function getAccountActiveWhatsAppMessage(student: {
  name: string;
  id: string;
  class?: string;
  semester?: string;
}): string {
  return `नमस्ते ${student.name} जी! 🎓

दार्चुला बहुमुखी क्याम्पस (FSU DMC) को आधिकारिक साप्ताहिक हाजिरी जवाफ पोर्टलमा तपाईंको विद्यार्थी खाता (Student ID: ${student.id}) सफलतापूर्वक स्वीकृत (Active/Approved) भएको छ।

तपाईं अब पोर्टलमा आफ्नो Student ID र ४-अंकको PIN मार्फत लगइन गरेर साप्ताहिक बौद्धिक हाजिरी जवाफ प्रतियोगितामा सहभागी हुन सक्नुहुन्छ:
🌐 https://quize.fsudmc.com

उत्कृष्ट नतिजा ल्याई हप्ताको विजेता बन्न शुभकामना!
- स्वतन्त्र विद्यार्थी युनियन (स्ववियु), दार्चुला बहुमुखी क्याम्पस`;
}

export function getCustomNotificationWhatsAppMessage(studentName: string, title: string, message: string): string {
  return `नमस्ते ${studentName} जी! 📢

दार्चुला बहुमुखी क्याम्पस (FSU DMC) हाजिरी जवाफ पोर्टल सूचना:

📌 ${title}
${message}

🌐 पोर्टल लिङ्क: https://quize.fsudmc.com
- स्वतन्त्र विद्यार्थी युनियन (स्ववियु), दार्चुला बहुमुखी क्याम्पस`;
}
