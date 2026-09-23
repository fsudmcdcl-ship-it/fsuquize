export type StudentStatus = 'active' | 'suspended' | 'blocked' | 'restricted';

export interface DeviceSession {
  deviceId: string;
  deviceName: string;
  userAgent?: string;
  ipAddress?: string;
  lastActive: number; // Unix timestamp in ms
  loginAt: string; // ISO string
  status: 'active' | 'expired';
  isCurrent?: boolean;
}

export interface Student {
  id: string; // e.g., FSU25678
  uid?: string;
  name: string;
  rollNo: string;
  class: string; // e.g., BCA, BBS, B.Sc.CSIT, B.Ed
  semester: string; // e.g., प्रथम, दोस्रो, तेस्रो, etc.
  phone: string;
  username: string; // e.g., FSU25678
  passcode: string; // 4 digits
  authEmail?: string;
  profilePhoto?: string;
  status: StudentStatus;
  activeSessions?: Record<string, DeviceSession>;
  createdAt: string;
  updatedAt?: string;
}

export interface AdminUser {
  uid: string;
  email: string;
  name: string;
  role: 'admin' | 'quizemaster';
}

export type QuizStatus = 'draft' | 'active' | 'closed' | 'archived';

export interface Quiz {
  id: string;
  title: string;
  description: string;
  startAt: string; // ISO String in Asia/Kathmandu
  endAt: string; // ISO String (72 hours duration)
  durationMinutes: number; // 10 minutes
  questionCount: number; // 10 per session
  totalBankQuestions: number; // 50 in bank
  status: QuizStatus;
  createdAt: string;
  updatedAt?: string;
}

export type QuestionOption = 'A' | 'B' | 'C' | 'D';

export interface Question {
  id: string;
  quizId: string;
  setNumber: 1 | 2 | 3 | 4 | 5;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: QuestionOption;
  explanation?: string;
}

export type SessionStatus = 'in_progress' | 'submitted' | 'expired';

export interface QuizSession {
  id: string; // quizId_studentId
  quizId: string;
  studentId: string;
  studentName: string;
  studentRoll: string;
  studentClass: string;
  studentSemester: string;
  studentPhone?: string;
  studentPhoto?: string;
  selectedQuestionIds: string[];
  startedAt: string;
  expiresAt: string; // startedAt + 10 mins
  submittedAt?: string;
  answers: Record<string, QuestionOption>; // questionId -> chosen option
  score: number; // e.g., 8
  totalQuestions: number; // 10
  percentage: number; // e.g., 80
  timeTakenSeconds: number; // e.g., 420
  rank?: number;
  status: SessionStatus;
}

export interface WinnerEntry {
  studentId: string;
  name: string;
  rollNo: string;
  class: string;
  semester: string;
  score: number;
  timeTakenSeconds: number;
  profilePhoto?: string;
}

export interface WinnerRecord {
  quizId: string;
  quizTitle: string;
  publishedAt: string;
  first: WinnerEntry;
  second?: WinnerEntry;
  third?: WinnerEntry;
  note?: string;
}

export interface TieBreak {
  tieBreakId: string;
  quizId: string;
  timestamp: string;
  tiedScore: number;
  participants: WinnerEntry[];
  winnerStudentId: string;
  winnerName: string;
  method: 'wheel_draw';
}

export interface AuditLog {
  id: string;
  adminEmail: string;
  action: string;
  target: string;
  details?: string;
  timestamp: string;
}

export interface PortalSettings {
  campusName: string;
  subTitle: string;
  quizDurationMinutes: number;
  quizAvailabilityHours: number;
  questionsPerStudent: number;
  questionBankSize: number;
  allowPublicPhotos: boolean;
  contactSupport: string;
  adminSlug: string;
}
