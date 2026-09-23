const nepaliDigits = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];

export function toNepaliDigits(input: number | string): string {
  if (input === undefined || input === null) return '';
  return input
    .toString()
    .split('')
    .map(char => {
      const digit = parseInt(char, 10);
      return !isNaN(digit) && char >= '0' && char <= '9' ? nepaliDigits[digit] : char;
    })
    .join('');
}

export function fromNepaliDigits(input: string): string {
  if (!input) return '';
  const map: Record<string, string> = {
    '०': '0', '१': '1', '२': '2', '३': '3', '४': '4',
    '५': '5', '६': '6', '७': '7', '८': '8', '९': '9'
  };
  return input.split('').map(c => map[c] ?? c).join('');
}

const nepaliMonthsEnglish = [
  'जनवरी', 'फेब्रुअरी', 'मार्च', 'अप्रिल', 'मे', 'जुन',
  'जुलाई', 'अगस्ट', 'सेप्टेम्बर', 'अक्टोबर', 'नोभेम्बर', 'डिसेम्बर'
];

export const nepaliBSMonths = [
  'वैशाख', 'जेठ', 'असार', 'साउन', 'भदौ', 'असोज',
  'कात्तिक', 'मंसिर', 'पुस', 'माघ', 'फागुन', 'चैत'
];

export const nepaliDaysOfWeek = [
  'आइतबार', 'सोमबार', 'मंगलबार', 'बुधबार', 'बिहीबार', 'शुक्रबार', 'शनिबार'
];

/**
 * Converts a Gregorian Date to an approximate Bikram Sambat (B.S.) date.
 * Nepal time is UTC +5:45.
 * Usually BS year is Gregorian year + 56 (Jan-mid April) or + 57 (mid April-Dec).
 */
export function getBikramSambatDate(date: Date = new Date()): {
  year: number;
  month: number;
  monthName: string;
  day: number;
  dayOfWeek: string;
} {
  // Get time in Asia/Kathmandu (UTC +5:45)
  const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
  const nptTime = new Date(utc + (3600000 * 5.75));

  const gYear = nptTime.getFullYear();
  const gMonth = nptTime.getMonth(); // 0-11
  const gDate = nptTime.getDate();
  const dayIndex = nptTime.getDay();

  // Basic robust B.S. mapping:
  // Mid-April (around April 14) starts Baisakh of gYear + 57.
  let bsYear = gYear + 57;
  let bsMonth = 0;
  let bsDay = 1;

  // Approximate BS month offsets
  // Jan ~ Poush/Magh, Feb ~ Magh/Falgun, Mar ~ Falgun/Chaitra, Apr ~ Chaitra/Baisakh
  // May ~ Baisakh/Jestha, Jun ~ Jestha/Ashadh, Jul ~ Ashadh/Shrawan, Aug ~ Shrawan/Bhadra
  // Sep ~ Bhadra/Ashwin, Oct ~ Ashwin/Kartik, Nov ~ Kartik/Mangsir, Dec ~ Mangsir/Poush
  const monthDayOffsets: { gMonth: number; switchDay: number; beforeMonth: number; afterMonth: number }[] = [
    { gMonth: 0, switchDay: 15, beforeMonth: 8, afterMonth: 9 },   // Jan: Poush / Magh
    { gMonth: 1, switchDay: 13, beforeMonth: 9, afterMonth: 10 },  // Feb: Magh / Falgun
    { gMonth: 2, switchDay: 15, beforeMonth: 10, afterMonth: 11 }, // Mar: Falgun / Chaitra
    { gMonth: 3, switchDay: 14, beforeMonth: 11, afterMonth: 0 },  // Apr: Chaitra / Baisakh (New Year)
    { gMonth: 4, switchDay: 15, beforeMonth: 0, afterMonth: 1 },   // May: Baisakh / Jestha
    { gMonth: 5, switchDay: 15, beforeMonth: 1, afterMonth: 2 },   // Jun: Jestha / Ashadh
    { gMonth: 6, switchDay: 16, beforeMonth: 2, afterMonth: 3 },   // Jul: Ashadh / Shrawan
    { gMonth: 7, switchDay: 17, beforeMonth: 3, afterMonth: 4 },   // Aug: Shrawan / Bhadra
    { gMonth: 8, switchDay: 17, beforeMonth: 4, afterMonth: 5 },   // Sep: Bhadra / Ashwin
    { gMonth: 9, switchDay: 17, beforeMonth: 5, afterMonth: 6 },   // Oct: Ashwin / Kartik
    { gMonth: 10, switchDay: 16, beforeMonth: 6, afterMonth: 7 },  // Nov: Kartik / Mangsir
    { gMonth: 11, switchDay: 16, beforeMonth: 7, afterMonth: 8 },  // Dec: Mangsir / Poush
  ];

  const rule = monthDayOffsets[gMonth];
  if (gMonth < 3 || (gMonth === 3 && gDate < 14)) {
    bsYear = gYear + 56;
  }

  if (gDate < rule.switchDay) {
    bsMonth = rule.beforeMonth;
    bsDay = gDate + (rule.switchDay === 15 ? 16 : 15);
  } else {
    bsMonth = rule.afterMonth;
    bsDay = gDate - rule.switchDay + 1;
  }

  // Constrain day within reasonable limits (1-32)
  bsDay = Math.min(32, Math.max(1, bsDay));

  return {
    year: bsYear,
    month: bsMonth + 1,
    monthName: nepaliBSMonths[bsMonth],
    day: bsDay,
    dayOfWeek: nepaliDaysOfWeek[dayIndex],
  };
}

/**
 * Returns formatted Live Nepal Date and Time string with NPT (UTC+5:45)
 * Example: "वि.सं. २०८३ असोज ७ | बुधबार, दिउँसो ०३:४५:१२ (NPT +५:४५)"
 */
export function getLiveNepalDateTimeString(date: Date = new Date()): string {
  const bs = getBikramSambatDate(date);
  
  // Format time in Asia/Kathmandu
  const nptFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kathmandu',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: true,
  });

  const parts = nptFormatter.formatToParts(date);
  let hour = '12';
  let minute = '00';
  let second = '00';
  let dayPeriod = 'AM';

  for (const p of parts) {
    if (p.type === 'hour') hour = p.value;
    if (p.type === 'minute') minute = p.value.padStart(2, '0');
    if (p.type === 'second') second = p.value.padStart(2, '0');
    if (p.type === 'dayPeriod') dayPeriod = p.value.toUpperCase();
  }

  const hourNum = parseInt(hour, 10);
  let period = 'बिहान';
  if (dayPeriod === 'PM') {
    if (hourNum === 12 || hourNum <= 4) period = 'दिउँसो';
    else if (hourNum >= 5 && hourNum <= 7) period = 'साँझ';
    else period = 'बेलुका';
  } else {
    if (hourNum === 12 || hourNum <= 3) period = 'मध्यराति';
    else period = 'बिहान';
  }

  const nepTime = `${period} ${toNepaliDigits(hour)}:${toNepaliDigits(minute)}:${toNepaliDigits(second)}`;

  return `वि.सं. ${toNepaliDigits(bs.year)} ${bs.monthName} ${toNepaliDigits(bs.day)} | ${bs.dayOfWeek}, ${nepTime} (NPT +५:४५)`;
}

/**
 * Formats date into Asia/Kathmandu timezone with natural Nepali terminology
 * e.g., "२३ सेप्टेम्बर २०२६, बेलुका ८:०० बजे" or B.S. format
 */
export function formatNepalDate(dateInput: string | Date | number, includeTime = true): string {
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return 'मिति उपलब्ध छैन';

    const bs = getBikramSambatDate(d);

    const options: Intl.DateTimeFormatOptions = {
      timeZone: 'Asia/Kathmandu',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    };

    const formatter = new Intl.DateTimeFormat('en-US', options);
    const parts = formatter.formatToParts(d);
    
    let hour = '';
    let minute = '';
    let dayPeriod = 'AM';

    for (const part of parts) {
      if (part.type === 'hour') hour = part.value;
      if (part.type === 'minute') minute = part.value.padStart(2, '0');
      if (part.type === 'dayPeriod') dayPeriod = part.value.toUpperCase();
    }

    const bsDateStr = `वि.सं. ${toNepaliDigits(bs.year)} ${bs.monthName} ${toNepaliDigits(bs.day)}`;

    if (!includeTime) {
      return bsDateStr;
    }

    const hourNum = parseInt(hour, 10);
    let timePeriod = 'बिहान';
    if (dayPeriod === 'PM') {
      if (hourNum === 12 || hourNum <= 4) timePeriod = 'दिउँसो';
      else if (hourNum >= 5 && hourNum <= 7) timePeriod = 'साँझ';
      else timePeriod = 'बेलुका';
    } else {
      if (hourNum === 12 || hourNum <= 3) timePeriod = 'मध्यराति';
      else timePeriod = 'बिहान';
    }

    const nepTime = `${timePeriod} ${toNepaliDigits(hour)}:${toNepaliDigits(minute)} बजे (NPT)`;
    return `${bsDateStr}, ${nepTime}`;
  } catch {
    return String(dateInput);
  }
}

/**
 * Formats seconds remaining into countdown display: e.g. "०९:५९"
 */
export function formatTimer(seconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const m = Math.floor(safeSeconds / 60);
  const s = safeSeconds % 60;
  const mm = m < 10 ? `0${m}` : `${m}`;
  const ss = s < 10 ? `0${s}` : `${s}`;
  return `${toNepaliDigits(mm)}:${toNepaliDigits(ss)}`;
}

/**
 * Formats duration in seconds into human-readable Nepali
 * e.g., "६ मिनेट १२ सेकेन्ड"
 */
export function formatDurationSeconds(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  if (m === 0) {
    return `${toNepaliDigits(s)} सेकेन्ड`;
  }
  if (s === 0) {
    return `${toNepaliDigits(m)} मिनेट`;
  }
  return `${toNepaliDigits(m)} मिनेट ${toNepaliDigits(s)} सेकेन्ड`;
}

/**
 * Calculates remaining availability relative to current time
 */
export function getRemainingAvailability(endAtIso: string): {
  isExpired: boolean;
  text: string;
  days: number;
  hours: number;
  minutes: number;
} {
  const now = Date.now();
  const end = new Date(endAtIso).getTime();
  const diffMs = end - now;

  if (diffMs <= 0 || isNaN(diffMs)) {
    return { isExpired: true, text: 'क्विज बन्द भएको छ', days: 0, hours: 0, minutes: 0 };
  }

  const totalMinutes = Math.floor(diffMs / (1000 * 60));
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  const parts: string[] = [];
  if (days > 0) parts.push(`${toNepaliDigits(days)} दिन`);
  if (hours > 0) parts.push(`${toNepaliDigits(hours)} घण्टा`);
  parts.push(`${toNepaliDigits(minutes)} मिनेट`);

  return {
    isExpired: false,
    text: `${parts.join(' ')} बाँकी`,
    days,
    hours,
    minutes
  };
}
