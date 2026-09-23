import type {
  Student,
  AdminUser,
  Quiz,
  Question,
  QuizSession,
  WinnerRecord,
  TieBreak,
  AuditLog,
  PortalSettings,
  QuestionOption
} from '../types/quiz';
import { INITIAL_50_QUESTIONS } from './seedQuestions';
import { isConfigured, firestoreDb, logoutAdminFromFirebase } from './firebase';

const STORAGE_KEYS = {
  STUDENTS: 'fsudmc_students_v2',
  ADMINS: 'fsudmc_admins_v2',
  CURRENT_STUDENT: 'fsudmc_current_student_v2',
  CURRENT_ADMIN: 'fsudmc_current_admin_v2',
  QUIZZES: 'fsudmc_quizzes_v2',
  QUESTIONS: 'fsudmc_questions_v2',
  SESSIONS: 'fsudmc_sessions_v2',
  WINNERS: 'fsudmc_winners_v2',
  TIE_BREAKS: 'fsudmc_tie_breaks_v2',
  AUDIT_LOGS: 'fsudmc_audit_logs_v2',
  SETTINGS: 'fsudmc_settings_v2',
};

// Default portal settings
const DEFAULT_SETTINGS: PortalSettings = {
  campusName: 'दार्चुला बहुमुखी क्याम्पस (Darchula Multiple Campus)',
  subTitle: 'स्वतन्त्र विद्यार्थी युनियन (FSU) साप्ताहिक हाजिरी जवाफ प्रणाली',
  quizDurationMinutes: 10,
  quizAvailabilityHours: 72,
  questionsPerStudent: 10,
  questionBankSize: 50,
  allowPublicPhotos: true,
  contactSupport: '९७४१८२३१२२ / info@fsudmc.com',
  adminSlug: 'quizemasteradmin',
};

// Seed an initial active quiz set to 72 hours availability
function createInitialQuiz(): Quiz {
  const now = new Date();
  // Starts 1 hour ago
  const startAt = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
  // Ends 71 hours from now (72 hours total)
  const endAt = new Date(now.getTime() + 71 * 60 * 60 * 1000).toISOString();

  return {
    id: 'quiz_week_12',
    title: 'साप्ताहिक क्याम्पस क्विज - हप्ता १२',
    description: 'सामान्य ज्ञान, शिक्षा, नेपाली साहित्य, विज्ञान तथा समसामयिक विषयहरूमा आधारित १० मिनेटको बौद्धिक प्रतियोगिता।',
    startAt,
    endAt,
    durationMinutes: 10,
    questionCount: 10,
    totalBankQuestions: 50,
    status: 'active',
    createdAt: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
  };
}

// Real data only from backend/storage: clean empty arrays without mock/fake data
const INITIAL_STUDENTS: Student[] = [];
const INITIAL_SESSIONS: QuizSession[] = [];
const INITIAL_WINNERS: WinnerRecord[] = [];


class DataService {
  private memoryStore: Record<string, string> = {};

  private getStorage<T>(key: string, fallback: T): T {
    try {
      let data: string | null = null;
      if (typeof window !== 'undefined' && 'localStorage' in window) {
        data = localStorage.getItem(key);
      } else {
        data = this.memoryStore[key] || null;
      }

      if (!data) {
        this.setStorage(key, fallback);
        return fallback;
      }
      return JSON.parse(data);
    } catch {
      return fallback;
    }
  }

  private setStorage<T>(key: string, value: T): void {
    try {
      const serialized = JSON.stringify(value);
      this.memoryStore[key] = serialized;
      if (typeof window !== 'undefined' && 'localStorage' in window) {
        localStorage.setItem(key, serialized);
      }
    } catch {
      // Memory store already retained it
    }
  }

  constructor() {
    this.initStorage();
  }

  private initStorage() {
    this.getStorage(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS);
    this.getStorage(STORAGE_KEYS.QUESTIONS, INITIAL_50_QUESTIONS);
    this.getStorage(STORAGE_KEYS.QUIZZES, [createInitialQuiz()]);
    this.getStorage(STORAGE_KEYS.SESSIONS, INITIAL_SESSIONS);
    this.getStorage(STORAGE_KEYS.WINNERS, INITIAL_WINNERS);
    this.getStorage(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
    this.getStorage(STORAGE_KEYS.AUDIT_LOGS, [
      {
        id: 'log_init',
        adminEmail: 'admin@fsudmc.com',
        action: 'क्विज प्रकाशित',
        target: 'quiz_week_12',
        details: '५० प्रश्न सहित हप्ता १२ को क्विज सक्रिय गरियो',
        timestamp: new Date().toISOString()
      }
    ]);
  }

  // =================== AUTHENTICATION ===================

  getCurrentStudent(): Student | null {
    return this.getStorage<Student | null>(STORAGE_KEYS.CURRENT_STUDENT, null);
  }

  setCurrentStudent(student: Student | null): void {
    this.setStorage(STORAGE_KEYS.CURRENT_STUDENT, student);
  }

  getCurrentAdmin(): AdminUser | null {
    return this.getStorage<AdminUser | null>(STORAGE_KEYS.CURRENT_ADMIN, null);
  }

  setCurrentAdmin(admin: AdminUser | null): void {
    this.setStorage(STORAGE_KEYS.CURRENT_ADMIN, admin);
  }

  logoutStudent(): void {
    this.setCurrentStudent(null);
  }

  logoutAdmin(): void {
    this.setCurrentAdmin(null);
    logoutAdminFromFirebase().catch(() => {});
  }

  setAdminFromFirebase(firebaseUser: { uid: string; email: string | null; displayName: string | null }): AdminUser {
    const admin: AdminUser = {
      uid: firebaseUser.uid,
      email: firebaseUser.email || 'info@fsudmc.com',
      name: firebaseUser.displayName || 'क्विज मास्टर (दार्चुला बहुमुखी क्याम्पस)',
      role: 'admin'
    };
    this.setCurrentAdmin(admin);
    this.addAuditLog({
      adminEmail: admin.email,
      action: 'प्रशासक लगइन',
      target: 'Firebase Auth',
      details: `Firebase प्रमाणीकरण सफल: ${admin.email}`
    });
    return admin;
  }

  // =================== STUDENTS ===================

  getStudents(): Student[] {
    return this.getStorage<Student[]>(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS);
  }

  generateStudentId(rollNo: string, phone: string): string {
    const cleanRoll = rollNo.trim();
    const cleanPhone = phone.trim();
    const last3 = cleanPhone.slice(-3);
    return `FSU${cleanRoll}${last3}`;
  }

  registerStudent(params: {
    name: string;
    rollNo: string;
    class: string;
    semester: string;
    phone: string;
    passcode: string;
    profilePhoto?: string;
  }): { success: boolean; student?: Student; error?: string } {
    const students = this.getStudents();

    const rollNoClean = params.rollNo.trim();
    const phoneClean = params.phone.trim();

    // Validations
    if (!params.name.trim() || !rollNoClean || !params.class || !params.semester || !phoneClean || !params.passcode) {
      return { success: false, error: 'कृपया सबै आवश्यक विवरण भर्नुहोस्।' };
    }

    if (params.passcode.length !== 4 || !/^\d{4}$/.test(params.passcode)) {
      return { success: false, error: 'पासकोड ठ्याक्कै ४ अंकको संख्या मात्र हुनुपर्छ।' };
    }

    if (phoneClean.length !== 10 || !/^\d{10}$/.test(phoneClean)) {
      return { success: false, error: 'सम्पर्क नम्बर १० अंकको हुनुपर्छ।' };
    }

    // Duplicate roll number check
    if (students.some(s => s.rollNo.toLowerCase() === rollNoClean.toLowerCase() && s.class.toLowerCase() === params.class.toLowerCase())) {
      return { success: false, error: 'यो रोल नम्बर र कक्षा पहिले नै दर्ता भइसकेको छ।' };
    }

    // Duplicate phone check
    if (students.some(s => s.phone === phoneClean)) {
      return { success: false, error: 'यो मोबाइल नम्बर पहिले नै प्रयोग भइसकेको छ।' };
    }

    const studentId = this.generateStudentId(rollNoClean, phoneClean);

    // Duplicate username check
    if (students.some(s => s.id === studentId || s.username === studentId)) {
      return { success: false, error: 'यो विद्यार्थी ID पहिले नै दर्ता छ।' };
    }

    const newStudent: Student = {
      id: studentId,
      name: params.name.trim(),
      rollNo: rollNoClean,
      class: params.class,
      semester: params.semester,
      phone: phoneClean,
      username: studentId,
      passcode: params.passcode,
      profilePhoto: params.profilePhoto || undefined,
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    students.push(newStudent);
    this.setStorage(STORAGE_KEYS.STUDENTS, students);

    // Auto log-in student
    this.setCurrentStudent(newStudent);

    return { success: true, student: newStudent };
  }

  loginStudent(studentIdOrUsername: string, passcode: string): { success: boolean; student?: Student; error?: string } {
    const students = this.getStudents();
    const id = studentIdOrUsername.trim().toUpperCase();

    const student = students.find(s => s.id.toUpperCase() === id || s.username.toUpperCase() === id);
    if (!student) {
      return { success: false, error: 'विद्यार्थी ID वा पासकोड मिलेन।' };
    }

    if (student.passcode !== passcode.trim()) {
      return { success: false, error: 'विद्यार्थी ID वा पासकोड मिलेन।' };
    }

    if (student.status === 'blocked') {
      return { success: false, error: 'तपाईंको खाता हाल ब्लक गरिएको छ। कृपया प्रशासनसँग सम्पर्क गर्नुहोस्।' };
    }

    this.setCurrentStudent(student);
    return { success: true, student };
  }

  loginAdmin(email: string, passcodeOrPin: string): { success: boolean; admin?: AdminUser; error?: string } {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = passcodeOrPin.trim();

    // Default master admin credentials
    if ((cleanEmail === 'info@fsudmc.com' || cleanEmail === 'admin@fsudmc.com' || cleanEmail === 'quizemaster' || cleanEmail === 'admin') && 
        (cleanPass === '1234' || cleanPass === 'admin123' || cleanPass === 'fsu@dmc2026')) {
      const admin: AdminUser = {
        uid: 'admin_fsudmc_master',
        email: cleanEmail.includes('@') ? cleanEmail : 'info@fsudmc.com',
        name: 'क्विज मास्टर (दार्चुला बहुमुखी क्याम्पस)',
        role: 'admin'
      };
      this.setCurrentAdmin(admin);
      return { success: true, admin };
    }

    return { success: false, error: 'प्रशासक इमेल वा पासकोड मिलेन।' };
  }

  updateStudentStatus(studentId: string, status: 'active' | 'restricted' | 'blocked', adminEmail = 'admin'): boolean {
    const students = this.getStudents();
    const idx = students.findIndex(s => s.id === studentId);
    if (idx === -1) return false;

    students[idx].status = status;
    students[idx].updatedAt = new Date().toISOString();
    this.setStorage(STORAGE_KEYS.STUDENTS, students);

    // Update session if it's the currently logged-in student
    const cur = this.getCurrentStudent();
    if (cur && cur.id === studentId) {
      cur.status = status;
      this.setCurrentStudent(cur);
    }

    this.addAuditLog({
      adminEmail,
      action: status === 'blocked' ? 'विद्यार्थी ब्लक' : status === 'restricted' ? 'विद्यार्थी प्रतिबन्ध' : 'स्थिति सक्रिय',
      target: studentId,
      details: `विद्यार्थीको स्थिति ${status} मा परिवर्तन गरियो`
    });

    return true;
  }

  deleteStudent(studentId: string, adminEmail = 'admin'): boolean {
    let students = this.getStudents();
    students = students.filter(s => s.id !== studentId);
    this.setStorage(STORAGE_KEYS.STUDENTS, students);

    this.addAuditLog({
      adminEmail,
      action: 'विद्यार्थी स्थायी मेटाइयो',
      target: studentId,
      details: `विद्यार्थी खाता प्रणालीबाट हटाइयो`
    });

    return true;
  }

  // =================== QUIZZES ===================

  getQuizzes(): Quiz[] {
    return this.getStorage<Quiz[]>(STORAGE_KEYS.QUIZZES, [createInitialQuiz()]);
  }

  getActiveQuiz(): Quiz | null {
    const quizzes = this.getQuizzes();
    return quizzes.find(q => q.status === 'active') || quizzes[0] || null;
  }

  createQuiz(data: Omit<Quiz, 'id' | 'createdAt'>, adminEmail = 'admin'): Quiz {
    const quizzes = this.getQuizzes();
    const newQuiz: Quiz = {
      ...data,
      id: `quiz_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    if (newQuiz.status === 'active') {
      quizzes.forEach(q => {
        if (q.status === 'active') q.status = 'closed';
      });
    }
    quizzes.unshift(newQuiz);
    this.setStorage(STORAGE_KEYS.QUIZZES, quizzes);
    this.addAuditLog({
      adminEmail,
      action: 'नयाँ क्विज थपियो',
      target: newQuiz.id,
      details: `${newQuiz.title} सिर्जना गरियो`
    });
    return newQuiz;
  }

  updateQuiz(quiz: Quiz, adminEmail = 'admin'): void {
    const quizzes = this.getQuizzes();
    const idx = quizzes.findIndex(q => q.id === quiz.id);
    if (idx >= 0) {
      quizzes[idx] = { ...quiz, updatedAt: new Date().toISOString() };
    } else {
      quizzes.unshift(quiz);
    }
    this.setStorage(STORAGE_KEYS.QUIZZES, quizzes);

    this.addAuditLog({
      adminEmail,
      action: 'क्विज अद्यावधिक',
      target: quiz.id,
      details: `${quiz.title} को विवरण अद्यावधिक गरियो`
    });
  }

  deleteQuiz(quizId: string, adminEmail = 'admin'): boolean {
    let quizzes = this.getQuizzes();
    const target = quizzes.find(q => q.id === quizId);
    if (!target) return false;
    quizzes = quizzes.filter(q => q.id !== quizId);
    this.setStorage(STORAGE_KEYS.QUIZZES, quizzes);
    this.addAuditLog({
      adminEmail,
      action: 'क्विज मेटाइयो',
      target: quizId,
      details: `${target.title} क्विज मेटाइयो`
    });
    return true;
  }

  setActiveQuiz(quizId: string, adminEmail = 'admin'): boolean {
    const quizzes = this.getQuizzes();
    const target = quizzes.find(q => q.id === quizId);
    if (!target) return false;
    quizzes.forEach(q => {
      q.status = q.id === quizId ? 'active' : 'closed';
    });
    this.setStorage(STORAGE_KEYS.QUIZZES, quizzes);
    this.addAuditLog({
      adminEmail,
      action: 'सक्रिय क्विज सेट गरियो',
      target: quizId,
      details: `${target.title} लाई सक्रिय क्विज बनाइयो`
    });
    return true;
  }

  // =================== QUESTIONS ===================

  getQuestions(quizId?: string): Question[] {
    const all = this.getStorage<Question[]>(STORAGE_KEYS.QUESTIONS, INITIAL_50_QUESTIONS);
    if (!quizId) return all;
    return all.filter(q => q.quizId === quizId || !q.quizId);
  }

  saveQuestion(question: Question, adminEmail = 'admin'): void {
    const questions = this.getQuestions();
    const idx = questions.findIndex(q => q.id === question.id);
    if (idx >= 0) {
      questions[idx] = question;
    } else {
      questions.push(question);
    }
    this.setStorage(STORAGE_KEYS.QUESTIONS, questions);

    this.addAuditLog({
      adminEmail,
      action: idx >= 0 ? 'प्रश्न सम्पादन' : 'नयाँ प्रश्न थप',
      target: question.id,
      details: `सेट ${question.setNumber} मा प्रश्न परिवर्तन गरियो`
    });
  }

  deleteQuestion(questionId: string, adminEmail = 'admin'): void {
    let questions = this.getQuestions();
    questions = questions.filter(q => q.id !== questionId);
    this.setStorage(STORAGE_KEYS.QUESTIONS, questions);

    this.addAuditLog({
      adminEmail,
      action: 'प्रश्न मेटाइयो',
      target: questionId
    });
  }

  // =================== QUIZ SESSION & RANDOM SELECTION ===================

  /**
   * Fair selection algorithm: selects 2 questions from each of the 5 sets (10 total)
   * Randomizes the order for the student.
   * If a set has fewer than 2, supplements fairly from other available sets.
   */
  select10QuestionsForSession(quizId: string): string[] {
    const bank = this.getQuestions(quizId);
    const sets: Record<number, Question[]> = { 1: [], 2: [], 3: [], 4: [], 5: [] };

    for (const q of bank) {
      const setNum = q.setNumber >= 1 && q.setNumber <= 5 ? q.setNumber : 1;
      sets[setNum].push(q);
    }

    const selectedIds: string[] = [];

    // Helper to shuffle an array
    const shuffle = <T>(array: T[]): T[] => [...array].sort(() => Math.random() - 0.5);

    // Pick 2 from each set
    for (let s = 1; s <= 5; s++) {
      const shuffledSet = shuffle(sets[s]);
      const picked = shuffledSet.slice(0, 2);
      for (const p of picked) {
        selectedIds.push(p.id);
      }
    }

    // If still less than 10, fill from any remaining
    if (selectedIds.length < 10) {
      const remaining = bank.filter(q => !selectedIds.includes(q.id));
      const needed = 10 - selectedIds.length;
      const extra = shuffle(remaining).slice(0, needed);
      for (const e of extra) {
        selectedIds.push(e.id);
      }
    }

    // Final shuffle so questions from set 1-5 appear in randomized order
    return shuffle(selectedIds);
  }

  getSessions(quizId?: string): QuizSession[] {
    const sessions = this.getStorage<QuizSession[]>(STORAGE_KEYS.SESSIONS, INITIAL_SESSIONS);
    if (!quizId) return sessions;
    return sessions.filter(s => s.quizId === quizId);
  }

  getStudentSession(quizId: string, studentId: string): QuizSession | null {
    const sessions = this.getSessions(quizId);
    return sessions.find(s => s.studentId === studentId) || null;
  }

  /**
   * Starts a secure 10-minute quiz session for the student.
   * If an active session already exists, restores it (resumes countdown).
   * Prevents re-creating or resetting on reload.
   */
  startQuizSession(quiz: Quiz, student: Student): QuizSession {
    const existing = this.getStudentSession(quiz.id, student.id);
    if (existing) {
      return existing;
    }

    const selectedQuestionIds = this.select10QuestionsForSession(quiz.id);
    const startedAt = new Date().toISOString();
    const durationMs = (quiz.durationMinutes || 10) * 60 * 1000;
    const expiresAt = new Date(Date.now() + durationMs).toISOString();

    const newSession: QuizSession = {
      id: `${quiz.id}_${student.id}`,
      quizId: quiz.id,
      studentId: student.id,
      studentName: student.name,
      studentRoll: student.rollNo,
      studentClass: student.class,
      studentSemester: student.semester,
      studentPhone: student.phone,
      studentPhoto: student.profilePhoto,
      selectedQuestionIds,
      startedAt,
      expiresAt,
      answers: {},
      score: 0,
      totalQuestions: selectedQuestionIds.length,
      percentage: 0,
      timeTakenSeconds: 0,
      status: 'in_progress'
    };

    const allSessions = this.getSessions();
    allSessions.unshift(newSession);
    this.setStorage(STORAGE_KEYS.SESSIONS, allSessions);

    return newSession;
  }

  /**
   * Saves individual answer immediately as student clicks option
   */
  saveAnswer(quizId: string, studentId: string, questionId: string, option: QuestionOption): QuizSession | null {
    const allSessions = this.getSessions();
    const session = allSessions.find(s => s.quizId === quizId && s.studentId === studentId);
    if (!session || session.status !== 'in_progress') {
      return null;
    }

    session.answers[questionId] = option;
    this.setStorage(STORAGE_KEYS.SESSIONS, allSessions);
    return session;
  }

  /**
   * Deterministic automatic grading upon submission or timer expiration
   */
  submitQuizSession(quizId: string, studentId: string, isAutoExpiry = false): QuizSession | null {
    const allSessions = this.getSessions();
    const session = allSessions.find(s => s.quizId === quizId && s.studentId === studentId);
    if (!session) return null;

    if (session.status !== 'in_progress') {
      return session; // Already graded and submitted
    }

    const bank = this.getQuestions(quizId);
    const questionMap = new Map(bank.map(q => [q.id, q]));

    let correctCount = 0;
    for (const qId of session.selectedQuestionIds) {
      const q = questionMap.get(qId);
      const studentAns = session.answers[qId];
      if (q && studentAns && studentAns === q.correctAnswer) {
        correctCount++;
      }
    }

    const now = new Date();
    const startTime = new Date(session.startedAt).getTime();
    const elapsedSeconds = Math.max(1, Math.min(600, Math.floor((now.getTime() - startTime) / 1000)));

    session.score = correctCount;
    session.totalQuestions = session.selectedQuestionIds.length;
    session.percentage = Math.round((correctCount / (session.totalQuestions || 10)) * 100);
    session.submittedAt = now.toISOString();
    session.timeTakenSeconds = elapsedSeconds;
    session.status = isAutoExpiry ? 'expired' : 'submitted';

    this.setStorage(STORAGE_KEYS.SESSIONS, allSessions);

    // Re-calculate ranks for this quiz
    this.recalculateRanks(quizId);

    return session;
  }

  /**
   * Official Ranking Logic:
   * 1. Highest Score
   * 2. Fastest Time Taken (lowest timeTakenSeconds)
   */
  recalculateRanks(quizId: string): void {
    const allSessions = this.getSessions();
    const quizSubmissions = allSessions.filter(
      s => s.quizId === quizId && (s.status === 'submitted' || s.status === 'expired')
    );

    quizSubmissions.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score; // Higher score first
      }
      return a.timeTakenSeconds - b.timeTakenSeconds; // Faster time first
    });

    quizSubmissions.forEach((sub, idx) => {
      sub.rank = idx + 1;
    });

    this.setStorage(STORAGE_KEYS.SESSIONS, allSessions);
  }

  // =================== WINNERS & TIE BREAK ===================

  getWinners(): WinnerRecord[] {
    return this.getStorage<WinnerRecord[]>(STORAGE_KEYS.WINNERS, INITIAL_WINNERS);
  }

  publishWinners(record: WinnerRecord, adminEmail = 'admin'): void {
    const winners = this.getWinners();
    const idx = winners.findIndex(w => w.quizId === record.quizId);
    if (idx >= 0) {
      winners[idx] = record;
    } else {
      winners.unshift(record);
    }
    this.setStorage(STORAGE_KEYS.WINNERS, winners);

    this.addAuditLog({
      adminEmail,
      action: 'विजेता घोषणा',
      target: record.quizId,
      details: `${record.first.name} प्रथम स्थान सहित विजेता प्रकाशित`
    });
  }

  addWinner(record: WinnerRecord, adminEmail = 'admin'): void {
    this.publishWinners(record, adminEmail);
  }

  deleteWinner(quizId: string, adminEmail = 'admin'): boolean {
    let winners = this.getWinners();
    const exists = winners.find(w => w.quizId === quizId);
    if (!exists) return false;
    winners = winners.filter(w => w.quizId !== quizId);
    this.setStorage(STORAGE_KEYS.WINNERS, winners);
    this.addAuditLog({
      adminEmail,
      action: 'विजेता रेकर्ड मेटाइयो',
      target: quizId,
      details: `${exists.quizTitle} को विजेता सूची हटाइयो`
    });
    return true;
  }

  saveWinnersList(winners: WinnerRecord[], adminEmail = 'admin'): void {
    this.setStorage(STORAGE_KEYS.WINNERS, winners);
    this.addAuditLog({
      adminEmail,
      action: 'विजेता सूची सुरक्षित गरियो',
      target: 'winners_all',
      details: `${winners.length} विजेता रेकर्डहरू स्थायी सुरक्षित गरियो`
    });
  }

  getTieBreaks(): TieBreak[] {
    return this.getStorage<TieBreak[]>(STORAGE_KEYS.TIE_BREAKS, []);
  }

  saveTieBreak(tieBreak: TieBreak, adminEmail = 'admin'): void {
    const records = this.getTieBreaks();
    records.unshift(tieBreak);
    this.setStorage(STORAGE_KEYS.TIE_BREAKS, records);

    this.addAuditLog({
      adminEmail,
      action: 'टाई-ब्रेक ड्र',
      target: tieBreak.quizId,
      details: `स्पिनिङ ह्विलमार्फत ${tieBreak.winnerName} विजयी छानिए`
    });
  }

  // =================== AUDIT LOGS ===================

  getAuditLogs(): AuditLog[] {
    return this.getStorage<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, []);
  }

  addAuditLog(entry: Omit<AuditLog, 'id' | 'timestamp'>): void {
    const logs = this.getAuditLogs();
    const newLog: AuditLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      ...entry,
    };
    logs.unshift(newLog);
    this.setStorage(STORAGE_KEYS.AUDIT_LOGS, logs.slice(0, 100)); // retain last 100
  }

  // =================== SETTINGS ===================

  getSettings(): PortalSettings {
    const s = this.getStorage<PortalSettings>(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
    if (!s.adminSlug || s.adminSlug === 'fsu-dmc-master-x891') {
      s.adminSlug = 'quizemasteradmin';
      this.setStorage(STORAGE_KEYS.SETTINGS, s);
    }
    return s;
  }

  getAdminSlug(): string {
    const slug = this.getSettings().adminSlug;
    if (!slug || slug === 'fsu-dmc-master-x891') {
      return 'quizemasteradmin';
    }
    return slug;
  }

  updateAdminSlug(newSlug: string, adminEmail = 'admin'): string {
    const cleanSlug = newSlug.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '-') || 'quizemasteradmin';
    const settings = this.getSettings();
    settings.adminSlug = cleanSlug;
    this.saveSettings(settings, adminEmail);
    return cleanSlug;
  }

  saveSettings(settings: PortalSettings, adminEmail = 'admin'): void {
    this.setStorage(STORAGE_KEYS.SETTINGS, settings);
    this.addAuditLog({
      adminEmail,
      action: 'सेटिङ अद्यावधिक',
      target: 'settings',
      details: 'क्याम्पस क्विज पोर्टल सेटिङ सुरक्षित गरियो'
    });
  }
}

export const dataService = new DataService();
