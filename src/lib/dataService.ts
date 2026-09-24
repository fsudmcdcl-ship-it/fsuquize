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
  QuestionOption,
  StudentStatus,
  AppNotification,
  NotificationType,
} from '../types/quiz';
import { INITIAL_50_QUESTIONS } from './seedQuestions';
import {
  isConfigured,
  firestoreDb,
  realtimeDb,
  auth,
  studentAuth,
  logoutAdminFromFirebase,
  createStudentWithFirebase,
  loginStudentWithFirebase,
  formatStudentAuthEmail,
} from './firebase';
import { registerDeviceSession, logoutDeviceSession } from './deviceSession';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
} from 'firebase/firestore';
import { ref, get, child, update, set, onValue, remove } from 'firebase/database';
import { signOut } from 'firebase/auth';
import { fromNepaliDigits } from './nepaliUtils';

export function hashPin(pin: string): string {
  if (!pin) return '';
  let hash = 0;
  for (let i = 0; i < pin.length; i++) {
    hash = (hash << 5) - hash + pin.charCodeAt(i);
    hash |= 0;
  }
  return `pin_${Math.abs(hash)}_${btoa(pin)}`;
}

export function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>(resolve => setTimeout(() => resolve(fallback), ms))
  ]);
}

export function isOfflineOrUnavailableError(err: unknown): boolean {
  if (!err) return false;
  const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
  return (
    msg.includes('offline') ||
    msg.includes('client is offline') ||
    msg.includes('unavailable') ||
    msg.includes('failed-precondition') ||
    msg.includes('network-request-failed') ||
    msg.includes('could not reach cloud firestore backend')
  );
}

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
  NOTIFICATIONS: 'fsudmc_notifications_v2',
  DRAFT_STATUS: 'fsudmc_draft_pending_v2',
  LAST_SYNC: 'fsudmc_last_sync_v2',
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
  const startAt = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
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

const INITIAL_STUDENTS: Student[] = [];
const INITIAL_SESSIONS: QuizSession[] = [];
const INITIAL_WINNERS: WinnerRecord[] = [];
const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif_welcome',
    title: 'साप्ताहिक हाजिरी जवाफ पोर्टलमा स्वागत छ! 🎓',
    message: 'दार्चुला बहुमुखी क्याम्पस स्ववियुको आधिकारिक साप्ताहिक हाजिरी जवाफ पोर्टलमा सबै विद्यार्थी साथीहरूलाई हार्दिक स्वागत छ। हरेक हप्ता नयाँ क्विजमा भाग लिनुहोस् र आकर्षक पुरस्कार जित्नुहोस्!',
    targetType: 'all',
    type: 'info',
    createdAt: new Date().toISOString(),
    sentBy: 'admin@fsudmc.com',
    readBy: []
  }
];

type DataListener = () => void;

class DataService {
  private memoryStore: Record<string, string> = {};
  private listeners: Set<DataListener> = new Set();
  private isSyncing = false;
  private isRtdbListening = false;

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
    // Synchronize initial data from Realtime Database and Firestore
    if (typeof window !== 'undefined') {
      this.initRealtimeDbListeners();
      setTimeout(() => {
        this.syncFromRealtimeDb().catch(() => {});
        this.syncFromFirestore().catch(() => {});
      }, 300);
    }
  }

  private initStorage() {
    this.getStorage(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS);
    this.getStorage(STORAGE_KEYS.QUESTIONS, INITIAL_50_QUESTIONS);
    this.getStorage(STORAGE_KEYS.QUIZZES, [createInitialQuiz()]);
    this.getStorage(STORAGE_KEYS.SESSIONS, INITIAL_SESSIONS);
    this.getStorage(STORAGE_KEYS.WINNERS, INITIAL_WINNERS);
    this.getStorage(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
    this.getStorage(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
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

  /**
   * Realtime Database live listeners for real-time reactive sync across all devices
   */
  private initRealtimeDbListeners() {
    if (this.isRtdbListening || typeof window === 'undefined') return;
    this.isRtdbListening = true;

    try {
      // 1. Live Notifications stream from Realtime Database
      const notifsRef = ref(realtimeDb, 'notifications');
      onValue(
        notifsRef,
        snapshot => {
          if (snapshot.exists()) {
            const val = snapshot.val();
            const items: AppNotification[] = typeof val === 'object' && val !== null ? Object.values(val) : [];
            if (Array.isArray(items) && items.length > 0) {
              this.mergeNotifications(items);
            }
          }
        },
        err => {
          if (!isOfflineOrUnavailableError(err)) {
            console.debug('RTDB notifications listener notice:', err);
          }
        }
      );

      // 2. Live Student approval / status / info stream from Realtime Database
      const studentsRef = ref(realtimeDb, 'students');
      onValue(
        studentsRef,
        snapshot => {
          if (snapshot.exists()) {
            const val = snapshot.val();
            const rtdbStudents: Student[] = typeof val === 'object' && val !== null ? Object.values(val) : [];
            if (Array.isArray(rtdbStudents) && rtdbStudents.length > 0) {
              const currentList = this.getStudents();
              const map = new Map<string, Student>();
              for (const s of currentList) map.set(s.id, s);
              let hasChanged = false;

              for (const r of rtdbStudents) {
                if (r && r.id) {
                  const existing = map.get(r.id);
                  if (
                    !existing ||
                    existing.status !== r.status ||
                    existing.approvedAt !== r.approvedAt ||
                    existing.name !== r.name ||
                    existing.phone !== r.phone ||
                    existing.rollNo !== r.rollNo ||
                    existing.class !== r.class ||
                    existing.semester !== r.semester
                  ) {
                    map.set(r.id, { ...existing, ...r });
                    hasChanged = true;
                  }
                }
              }

              if (hasChanged) {
                const updatedList = Array.from(map.values());
                this.setStorage(STORAGE_KEYS.STUDENTS, updatedList);

                const cur = this.getCurrentStudent();
                if (cur) {
                  const match = updatedList.find(s => s.id === cur.id);
                  if (match) {
                    this.setCurrentStudent(match);
                  }
                }
                this.notifyListeners();
              }
            }
          }
        },
        err => {
          if (!isOfflineOrUnavailableError(err)) {
            console.debug('RTDB students listener notice:', err);
          }
        }
      );

      // 3. Live Quizzes stream from Realtime Database
      const quizzesRef = ref(realtimeDb, 'quizzes');
      onValue(
        quizzesRef,
        snapshot => {
          if (snapshot.exists()) {
            const val = snapshot.val();
            const list: Quiz[] = Array.isArray(val) ? val : (typeof val === 'object' && val !== null ? Object.values(val) : []);
            if (list.length > 0) {
              this.setStorage(STORAGE_KEYS.QUIZZES, list);
              this.notifyListeners();
            }
          }
        },
        err => {
          if (!isOfflineOrUnavailableError(err)) {
            console.debug('RTDB quizzes listener notice:', err);
          }
        }
      );

      // 4. Live Quiz Sessions / Submissions stream from Realtime Database
      const sessionsRef = ref(realtimeDb, 'quizSessions');
      onValue(
        sessionsRef,
        snapshot => {
          if (snapshot.exists()) {
            const val = snapshot.val();
            const list: QuizSession[] = Array.isArray(val) ? val : (typeof val === 'object' && val !== null ? Object.values(val) : []);
            if (list.length > 0) {
              const currentSessions = this.getSessions();
              const sMap = new Map<string, QuizSession>();
              for (const s of currentSessions) sMap.set(s.id, s);
              for (const s of list) {
                if (s && s.id) sMap.set(s.id, s);
              }
              this.setStorage(STORAGE_KEYS.SESSIONS, Array.from(sMap.values()));
              this.notifyListeners();
            }
          }
        },
        err => {
          if (!isOfflineOrUnavailableError(err)) {
            console.debug('RTDB quizSessions listener notice:', err);
          }
        }
      );

      // 5. Live Questions stream from Realtime Database
      const questionsRef = ref(realtimeDb, 'questions');
      onValue(
        questionsRef,
        snapshot => {
          if (snapshot.exists()) {
            const val = snapshot.val();
            const list: Question[] = Array.isArray(val) ? val : (typeof val === 'object' && val !== null ? Object.values(val) : []);
            if (list.length > 0) {
              this.setStorage(STORAGE_KEYS.QUESTIONS, list);
              this.notifyListeners();
            }
          }
        },
        err => {
          if (!isOfflineOrUnavailableError(err)) {
            console.debug('RTDB questions listener notice:', err);
          }
        }
      );

      // 6. Live Settings stream from Realtime Database
      const settingsRef = ref(realtimeDb, 'settings');
      onValue(
        settingsRef,
        snapshot => {
          if (snapshot.exists()) {
            const val = snapshot.val() as PortalSettings;
            if (val && typeof val === 'object') {
              this.setStorage(STORAGE_KEYS.SETTINGS, { ...DEFAULT_SETTINGS, ...val });
              this.notifyListeners();
            }
          }
        },
        err => {
          if (!isOfflineOrUnavailableError(err)) {
            console.debug('RTDB settings listener notice:', err);
          }
        }
      );

      // 7. Live Winners stream from Realtime Database
      const winnersRef = ref(realtimeDb, 'winners');
      onValue(
        winnersRef,
        snapshot => {
          if (snapshot.exists()) {
            const val = snapshot.val();
            const list: WinnerRecord[] = Array.isArray(val) ? val : (typeof val === 'object' && val !== null ? Object.values(val) : []);
            if (list.length > 0) {
              this.setStorage(STORAGE_KEYS.WINNERS, list);
              this.notifyListeners();
            }
          }
        },
        err => {
          if (!isOfflineOrUnavailableError(err)) {
            console.debug('RTDB winners listener notice:', err);
          }
        }
      );
    } catch (err) {
      if (!isOfflineOrUnavailableError(err)) {
        console.debug('RTDB init listeners notice:', err);
      }
    }
  }

  /**
   * One-time sync from Realtime Database on startup
   */
  async syncFromRealtimeDb(): Promise<void> {
    await this.syncWithRealtimeDbAndFirestore();
  }

  // =================== LISTENERS & DRAFT/LIVE STATE ===================

  subscribe(listener: DataListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  notifyListeners(): void {
    this.listeners.forEach(fn => {
      try {
        fn();
      } catch (err) {
        console.error('DataService listener error:', err);
      }
    });
  }

  hasUnsavedDrafts(): boolean {
    return this.getStorage<boolean>(STORAGE_KEYS.DRAFT_STATUS, false);
  }

  setDraftChanges(hasChanges: boolean): void {
    this.setStorage(STORAGE_KEYS.DRAFT_STATUS, hasChanges);
    this.notifyListeners();
  }

  getLastSyncedAt(): string | null {
    return this.getStorage<string | null>(STORAGE_KEYS.LAST_SYNC, null);
  }

  private setLastSyncedAt(timeStr: string): void {
    this.setStorage(STORAGE_KEYS.LAST_SYNC, timeStr);
  }

  // =================== AUTHENTICATION ===================

  getCurrentStudent(): Student | null {
    return this.getStorage<Student | null>(STORAGE_KEYS.CURRENT_STUDENT, null);
  }

  setCurrentStudent(student: Student | null): void {
    this.setStorage(STORAGE_KEYS.CURRENT_STUDENT, student);
    this.notifyListeners();
  }

  getCurrentAdmin(): AdminUser | null {
    return this.getStorage<AdminUser | null>(STORAGE_KEYS.CURRENT_ADMIN, null);
  }

  setCurrentAdmin(admin: AdminUser | null): void {
    this.setStorage(STORAGE_KEYS.CURRENT_ADMIN, admin);
    this.notifyListeners();
  }

  logoutStudent(): void {
    const student = this.getCurrentStudent();
    if (student) {
      logoutDeviceSession(student.id).catch(() => {});
    }
    this.setCurrentStudent(null);
    signOut(studentAuth).catch(() => {});
    if (!this.getCurrentAdmin()) {
      signOut(auth).catch(() => {});
    }
    this.notifyListeners();
  }

  logoutAdmin(): void {
    this.setCurrentAdmin(null);
    logoutAdminFromFirebase().catch(() => {});
  }

  isAdminUser(email?: string | null): boolean {
    if (!email) return false;
    const clean = email.trim().toLowerCase();
    return clean === 'admin@fsudmc.com' || clean.includes('admin') || clean === 'info@fsudmc.com';
  }

  isStudentApproved(student: Student | null): boolean {
    if (!student) return false;
    return student.status === 'approved' || student.status === 'active';
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

  async registerStudent(params: {
    name: string;
    rollNo: string;
    class: string;
    semester: string;
    phone: string;
    passcode: string;
    profilePhoto?: string;
  }): Promise<{ success: boolean; student?: Student; error?: string; technicalError?: string }> {
    const students = this.getStudents();

    const rollNoClean = fromNepaliDigits(params.rollNo.trim());
    const phoneClean = fromNepaliDigits(params.phone.trim()).replace(/\D/g, '');
    const passcodeClean = fromNepaliDigits(params.passcode.trim()).replace(/\D/g, '');

    // Validations
    if (!params.name.trim() || !rollNoClean || !params.class || !params.semester || !phoneClean || !passcodeClean) {
      return { success: false, error: 'कृपया सबै आवश्यक विवरण भर्नुहोस्।' };
    }

    if (passcodeClean.length !== 4 || !/^\d{4}$/.test(passcodeClean)) {
      return { success: false, error: 'पासकोड ठ्याक्कै ४ अंकको संख्या मात्र हुनुपर्छ।' };
    }

    if (phoneClean.length !== 10 || !/^\d{10}$/.test(phoneClean)) {
      return { success: false, error: 'सम्पर्क नम्बर १० अंकको हुनुपर्छ।' };
    }

    // Duplicate roll number check in local memory
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

    const authEmail = formatStudentAuthEmail(studentId);
    const now = new Date().toISOString();
    const pinHash = hashPin(passcodeClean);

    const newStudent: Student = {
      id: studentId,
      studentId: studentId,
      name: params.name.trim(),
      email: authEmail,
      rollNo: rollNoClean,
      class: params.class,
      semester: params.semester,
      phone: phoneClean,
      username: studentId,
      passcode: passcodeClean,
      passcodeHash: pinHash,
      authEmail,
      role: 'student',
      ...(params.profilePhoto ? { profilePhoto: params.profilePhoto } : {}),
      status: 'pending', // Default status is ALWAYS 'pending' until admin approves!
      appliedAt: now,
      approvedAt: null,
      approvedBy: null,
      createdAt: now,
    };

    // 1. Instantly store in local cache and set session
    students.push(newStudent);
    this.setStorage(STORAGE_KEYS.STUDENTS, students);
    this.setCurrentStudent(newStudent);
    this.notifyListeners();

    // 2. Concurrently initiate Firebase Auth, Firestore and Realtime Database
    const authPromise = withTimeout(
      createStudentWithFirebase(studentId, rollNoClean, passcodeClean),
      3500,
      { success: false, technicalError: 'auth-timeout-syncing' }
    ).then(authResult => {
      if (authResult.user?.uid) {
        newStudent.uid = authResult.user.uid;
        const curList = this.getStudents();
        const idx = curList.findIndex(s => s.id === newStudent.id);
        if (idx >= 0) {
          curList[idx].uid = authResult.user.uid;
          this.setStorage(STORAGE_KEYS.STUDENTS, curList);
        }
      }
    }).catch(err => {
      console.debug('Firebase Auth background creation notice:', err);
    });

    const firestorePromise = withTimeout(
      this.saveStudentToFirestore(newStudent),
      3500,
      { success: true }
    ).catch(err => {
      console.debug('Firestore background save notice:', err);
    });

    const rtdbPromise = this.saveStudentToRealtimeDb(newStudent).catch(err => {
      console.debug('Realtime DB background sync notice:', err);
    });

    // Wait at most 800ms for fast cloud acknowledgment, then return immediately
    await Promise.race([
      Promise.allSettled([authPromise, firestorePromise, rtdbPromise]),
      new Promise(resolve => setTimeout(resolve, 800))
    ]);

    return { success: true, student: newStudent };
  }

  async loginStudent(
    studentIdOrUsername: string,
    passcode: string
  ): Promise<{ success: boolean; student?: Student; error?: string; technicalError?: string }> {
    const queryStr = fromNepaliDigits(studentIdOrUsername.trim());
    const queryUpper = queryStr.toUpperCase();
    const cleanPass = fromNepaliDigits(passcode.trim()).replace(/\D/g, '');

    if (!queryStr) {
      return { success: false, error: 'कृपया आफ्नो विद्यार्थी ID, फोन वा रोल नम्बर प्रविष्ट गर्नुहोस्।' };
    }
    if (!cleanPass) {
      return { success: false, error: 'कृपया ४ अंकको पासकोड प्रविष्ट गर्नुहोस्।' };
    }

    // 1. Check local memory / localStorage first
    let student = this.getStudents().find(s =>
      s.id.toUpperCase() === queryUpper ||
      s.username.toUpperCase() === queryUpper ||
      s.phone === queryStr ||
      s.rollNo.toUpperCase() === queryUpper
    );

    // 2. If not found in local cache, query Firestore & Realtime Database with fast timeout
    if (!student) {
      const remoteStudent = await withTimeout(this.getStudentFromFirebase(queryStr), 3000, null);
      if (remoteStudent) {
        student = remoteStudent;
        const currentList = this.getStudents();
        if (!currentList.some(s => s.id === remoteStudent.id)) {
          currentList.push(remoteStudent);
          this.setStorage(STORAGE_KEYS.STUDENTS, currentList);
        }
      }
    }

    if (!student) {
      return {
        success: false,
        error: 'विद्यार्थी ID, फोन वा रोल नम्बर फेला परेन। कृपया पहिले नयाँ खाता दर्ता गर्नुहोस्।',
        technicalError: `not-found: student '${queryStr}' not present in local cache or Firestore`
      };
    }

    // Account status restrictions
    if (student.status === 'blocked') {
      return { success: false, error: 'तपाईंको विद्यार्थी खाता प्रशासकद्वारा ब्लक गरिएको छ। कृपया क्याम्पस प्रशासनसँग सम्पर्क गर्नुहोस्।' };
    }

    if (student.status === 'rejected') {
      return { success: false, error: 'तपाईंको विद्यार्थी दर्ता आवेदन क्याम्पस प्रशासनद्वारा अस्वीकृत गरिएको छ। कृपया क्याम्पसमा सम्पर्क गर्नुहोस्।' };
    }

    if (student.status === 'suspended') {
      return { success: false, error: 'तपाईंको विद्यार्थी खाता हाल निलम्बित गरिएको छ। सहायताका लागि प्रशासनलाई सम्पर्क गर्नुहोस्।' };
    }

    // 3. Fast Credential Verification
    const pinHash = hashPin(cleanPass);
    const isLocalPassValid = Boolean(
      (student.passcode && student.passcode === cleanPass) ||
      (student.passcodeHash && student.passcodeHash === pinHash)
    );

    // Concurrently try Firebase Auth in background/timeout
    let fbAuthSuccess = false;
    let fbTechnicalError: string | undefined;

    try {
      const fbAuthResult = await withTimeout(
        loginStudentWithFirebase(student.id, student.rollNo, cleanPass),
        2500,
        { success: false, technicalError: 'auth-timeout' }
      );
      fbAuthSuccess = fbAuthResult.success;
      fbTechnicalError = fbAuthResult.technicalError;
    } catch (fbErr) {
      console.debug('Notice: Firebase Auth attempt:', fbErr);
    }

    if (isLocalPassValid || fbAuthSuccess) {
      // Sync/heal Firebase Auth if needed
      if (!fbAuthSuccess) {
        createStudentWithFirebase(student.id, student.rollNo, cleanPass).catch(() => {});
      }

      // Ensure credentials cached in student object
      if (!student.passcode) student.passcode = cleanPass;
      if (!student.passcodeHash) student.passcodeHash = pinHash;

      const curList = this.getStudents();
      const sIdx = curList.findIndex(s => s.id === student!.id);
      if (sIdx >= 0) {
        curList[sIdx] = { ...curList[sIdx], ...student };
        this.setStorage(STORAGE_KEYS.STUDENTS, curList);
      }

      // Check live approval status in background
      this.checkStudentApprovalStatus(student.id).catch(() => {});

      // Register device session asynchronously
      registerDeviceSession(student.id).catch(err => {
        console.debug('Notice: Device session registration background:', err);
      });

      this.setCurrentStudent(student);
      this.notifyListeners();
      return { success: true, student };
    }

    return {
      success: false,
      error: 'प्रविष्ट गरिएको ४-अंकको पासकोड (PIN) मिलेन। कृपया सही पासकोड प्रविष्ट गर्नुहोस्।',
      technicalError: fbTechnicalError || 'passcode-mismatch'
    };
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

  updateStudentStatus(studentId: string, status: StudentStatus, adminEmail = 'admin'): boolean {
    const students = this.getStudents();
    const idx = students.findIndex(s => s.id === studentId);
    if (idx === -1) return false;

    students[idx].status = status;
    students[idx].updatedAt = new Date().toISOString();
    this.setStorage(STORAGE_KEYS.STUDENTS, students);

    // Update current student session if currently logged in
    const cur = this.getCurrentStudent();
    if (cur && cur.id === studentId) {
      cur.status = status;
      this.setCurrentStudent(cur);
    }

    // Persist directly to Firestore backend & Realtime Database
    this.updateStudentInFirestore(studentId, {
      status,
      updatedAt: students[idx].updatedAt
    }).catch(err => console.warn('Firestore updateStudentStatus warning:', err));

    update(ref(realtimeDb, `students/${studentId}`), {
      status,
      updatedAt: students[idx].updatedAt,
    }).catch(() => {});

    this.addAuditLog({
      adminEmail,
      action: status === 'blocked' ? 'विद्यार्थी ब्लक' : status === 'suspended' ? 'विद्यार्थी निलम्बन' : status === 'restricted' ? 'विद्यार्थी प्रतिबन्ध' : 'स्थिति सक्रिय',
      target: studentId,
      details: `विद्यार्थीको खाता स्थिति ${status} मा परिवर्तन गरियो`
    });

    this.notifyListeners();
    return true;
  }

  updateStudent(studentId: string, updates: Partial<Student>, adminEmail = 'admin'): boolean {
    const students = this.getStudents();
    const idx = students.findIndex(s => s.id === studentId);
    if (idx === -1) return false;

    const updatedStudent: Student = {
      ...students[idx],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    students[idx] = updatedStudent;
    this.setStorage(STORAGE_KEYS.STUDENTS, students);

    const cur = this.getCurrentStudent();
    if (cur && cur.id === studentId) {
      this.setCurrentStudent(updatedStudent);
    }

    // Persist directly to Firestore backend
    this.updateStudentInFirestore(studentId, updatedStudent).catch(err => {
      if (!isOfflineOrUnavailableError(err)) {
        console.debug('Firestore updateStudent notice:', err);
      }
    });
    this.saveStudentToRealtimeDb(updatedStudent).catch(() => {});

    this.addAuditLog({
      adminEmail,
      action: 'विद्यार्थी विवरण सम्पादन',
      target: studentId,
      details: `विद्यार्थी ${updatedStudent.name} को विवरण अपडेट गरियो`
    });

    this.notifyListeners();
    return true;
  }

  deleteStudent(studentId: string, adminEmail = 'admin'): boolean {
    let students = this.getStudents();
    students = students.filter(s => s.id !== studentId);
    this.setStorage(STORAGE_KEYS.STUDENTS, students);

    // Delete directly from Firestore backend & Realtime Database
    this.deleteStudentFromFirestore(studentId).catch(err => {
      if (!isOfflineOrUnavailableError(err)) {
        console.debug('Firestore deleteStudent notice:', err);
      }
    });
    remove(ref(realtimeDb, `students/${studentId}`)).catch(() => {});

    this.addAuditLog({
      adminEmail,
      action: 'विद्यार्थी स्थायी मेटाइयो',
      target: studentId,
      details: `विद्यार्थी खाता प्रणाली र ब्याकइन्डबाट हटाइयो`
    });

    this.notifyListeners();
    return true;
  }

  async approveStudentApplication(
    studentId: string,
    adminUid = 'admin',
    adminEmail = 'admin@fsudmc.com'
  ): Promise<{ success: boolean; student?: Student; error?: string }> {
    try {
      const now = new Date().toISOString();
      const updates = {
        status: 'approved' as StudentStatus,
        approvedAt: now,
        approvedBy: adminUid,
        updatedAt: now,
      };

      // 1. Await confirmation from Firestore (gracefully handling offline)
      try {
        await setDoc(doc(firestoreDb, 'students', studentId), updates, { merge: true });
        const student = this.getStudents().find(s => s.id === studentId);
        if (student?.uid && student.uid !== studentId) {
          await setDoc(doc(firestoreDb, 'students', student.uid), updates, { merge: true }).catch(() => {});
        }
      } catch (err) {
        if (!isOfflineOrUnavailableError(err)) {
          console.debug('Firestore approve sync notice:', err);
        }
      }

      // 2. Update Realtime DB
      update(ref(realtimeDb, `students/${studentId}`), {
        ...updates,
        status: 'approved',
      }).catch(err => {
        if (!isOfflineOrUnavailableError(err)) {
          console.debug('Realtime DB approve notice:', err);
        }
      });

      // 3. Update local cache
      const students = this.getStudents();
      const idx = students.findIndex(s => s.id === studentId);
      let updatedStudent: Student | undefined;
      if (idx >= 0) {
        students[idx] = {
          ...students[idx],
          ...updates,
        };
        updatedStudent = students[idx];
        this.setStorage(STORAGE_KEYS.STUDENTS, students);
      }

      // If current student session matches, update session
      const cur = this.getCurrentStudent();
      if (cur && cur.id === studentId) {
        this.setCurrentStudent({ ...cur, ...updates });
      }

      // 4. Send in-app notification to this specific student
      this.sendNotification({
        title: 'खाता सफलतापूर्वक स्वीकृत भयो (Account Approved)',
        message: `नमस्ते ${updatedStudent?.name || ''}! तपाईंको विद्यार्थी खाता (ID: ${studentId}) प्रशासकद्वारा स्वीकृत गरिएको छ। अब तपाईं साप्ताहिक क्विजमा सहभागी हुन सक्नुहुन्छ।`,
        targetType: 'specific',
        targetStudentId: studentId,
        targetStudentName: updatedStudent?.name || studentId,
        type: 'success',
        adminEmail,
      }).catch(() => {});

      this.addAuditLog({
        adminEmail,
        action: 'विद्यार्थी आवेदन स्वीकृत (Approved)',
        target: studentId,
        details: `विद्यार्थी ${updatedStudent?.name || studentId} को खाता स्वीकृत गरियो`
      });

      this.notifyListeners();
      return { success: true, student: updatedStudent };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('approveStudentApplication error:', err);
      return { success: false, error: msg };
    }
  }

  async rejectStudentApplication(
    studentId: string,
    adminUid = 'admin',
    adminEmail = 'admin@fsudmc.com'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const now = new Date().toISOString();
      const updates = {
        status: 'rejected' as StudentStatus,
        rejectedAt: now,
        rejectedBy: adminUid,
        updatedAt: now,
      };

      // 1. Await confirmation from Firestore
      try {
        await setDoc(doc(firestoreDb, 'students', studentId), updates, { merge: true });
        const student = this.getStudents().find(s => s.id === studentId);
        if (student?.uid && student.uid !== studentId) {
          await setDoc(doc(firestoreDb, 'students', student.uid), updates, { merge: true }).catch(() => {});
        }
      } catch (err) {
        if (!isOfflineOrUnavailableError(err)) {
          console.debug('Firestore reject sync notice:', err);
        }
      }

      // 2. Update Realtime DB
      update(ref(realtimeDb, `students/${studentId}`), {
        ...updates,
        status: 'rejected',
      }).catch(err => {
        if (!isOfflineOrUnavailableError(err)) {
          console.debug('Realtime DB reject notice:', err);
        }
      });

      // 3. Update local cache
      const students = this.getStudents();
      const idx = students.findIndex(s => s.id === studentId);
      if (idx >= 0) {
        students[idx] = {
          ...students[idx],
          ...updates,
        };
        this.setStorage(STORAGE_KEYS.STUDENTS, students);
      }

      const cur = this.getCurrentStudent();
      if (cur && cur.id === studentId) {
        this.setCurrentStudent({ ...cur, ...updates });
      }

      this.addAuditLog({
        adminEmail,
        action: 'विद्यार्थी आवेदन अस्वीकृत (Rejected)',
        target: studentId,
        details: `विद्यार्थी ${studentId} को खाता अस्वीकृत गरियो`
      });

      this.notifyListeners();
      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('rejectStudentApplication error:', err);
      return { success: false, error: msg };
    }
  }

  async checkStudentApprovalStatus(studentId: string): Promise<Student | null> {
    try {
      const docSnap = await getDoc(doc(firestoreDb, 'students', studentId));
      if (docSnap.exists()) {
        const remote = docSnap.data() as Student;
        const students = this.getStudents();
        const idx = students.findIndex(s => s.id === studentId);
        if (idx >= 0) {
          students[idx] = { ...students[idx], ...remote };
          this.setStorage(STORAGE_KEYS.STUDENTS, students);
        }
        const cur = this.getCurrentStudent();
        if (cur && cur.id === studentId) {
          this.setCurrentStudent({ ...cur, ...remote });
        }
        this.notifyListeners();
        return remote;
      }
    } catch (err) {
      console.warn('checkStudentApprovalStatus notice:', err);
    }
    return null;
  }

  // =================== FIRESTORE & FIREBASE PERSISTENCE METHODS ===================

  async saveStudentToFirestore(
    student: Student
  ): Promise<{ success: boolean; error?: string; technicalError?: string }> {
    try {
      // Strip plaintext passcode; ensure passcodeHash is preserved
      const sanitized: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(student)) {
        if (v !== undefined && k !== 'passcode') {
          sanitized[k] = v;
        }
      }
      sanitized.role = sanitized.role || 'student';
      sanitized.status = sanitized.status || 'pending';
      if (!sanitized.appliedAt) {
        sanitized.appliedAt = new Date().toISOString();
      }
      if (!sanitized.passcodeHash && (student.passcodeHash || student.passcode)) {
        sanitized.passcodeHash = student.passcodeHash || hashPin(student.passcode!);
      }

      await withTimeout(
        setDoc(doc(firestoreDb, 'students', student.id), sanitized, { merge: true }),
        4000,
        undefined
      );
      return { success: true };
    } catch (err: unknown) {
      const fbError = err as { code?: string; message?: string };
      const code = fbError?.code || 'unknown';
      const msg = fbError?.message || 'Firestore setDoc operation notice';
      if (!isOfflineOrUnavailableError(err)) {
        console.debug(`Firestore saveStudent notice [${code}]:`, msg);
      }
      // Return success because local cache already saved it and Firestore offline cache persists locally
      return { success: true };
    }
  }

  async saveStudentToRealtimeDb(student: Student): Promise<{ success: boolean; error?: string }> {
    try {
      const studentRef = ref(realtimeDb, `students/${student.id}`);
      await update(studentRef, {
        id: student.id,
        studentId: student.id,
        uid: student.uid || student.id,
        name: student.name,
        rollNo: student.rollNo,
        class: student.class,
        semester: student.semester,
        phone: student.phone,
        username: student.username,
        email: student.email || student.authEmail || `${student.id}@fsudmc.edu.np`,
        status: student.status || 'pending',
        role: 'student',
        passcodeHash: student.passcodeHash || (student.passcode ? hashPin(student.passcode) : undefined),
        appliedAt: student.appliedAt || student.createdAt,
        createdAt: student.createdAt,
      });
      return { success: true };
    } catch (err: unknown) {
      const fbError = err as { code?: string; message?: string };
      if (!isOfflineOrUnavailableError(err)) {
        console.debug('Realtime Database student sync notice:', fbError?.code, fbError?.message);
      }
      return { success: false, error: fbError?.message };
    }
  }

  async getStudentFromFirebase(studentIdOrIdentifier: string): Promise<Student | null> {
    const raw = fromNepaliDigits(studentIdOrIdentifier.trim());
    if (!raw) return null;
    const queryUpper = raw.toUpperCase();

    // 0. Check local cache first
    const local = this.getStudents();
    const localFound = local.find(
      s => s.id.toUpperCase() === queryUpper || s.username.toUpperCase() === queryUpper || s.phone === raw || s.rollNo.toUpperCase() === queryUpper
    );
    if (localFound) return localFound;

    try {
      // 1. Direct ID lookups in parallel (RTDB & Firestore)
      const rtdbPromise = get(child(ref(realtimeDb), `students/${queryUpper}`)).then(snap => {
        if (snap.exists()) return snap.val() as Student;
        return null;
      }).catch(() => null);

      const firestoreDirectPromise = getDoc(doc(firestoreDb, 'students', queryUpper)).then(snap => {
        if (snap.exists()) return snap.data() as Student;
        return null;
      }).catch(() => null);

      const [rtdbRes, firestoreRes] = await Promise.all([rtdbPromise, firestoreDirectPromise]);
      if (rtdbRes) return rtdbRes;
      if (firestoreRes) return firestoreRes;

      // 2. Query Firestore by phone if 10-digit number
      if (/^\d{10}$/.test(raw)) {
        const qPhone = query(collection(firestoreDb, 'students'), where('phone', '==', raw));
        const snapPhone = await getDocs(qPhone);
        if (!snapPhone.empty) {
          return snapPhone.docs[0].data() as Student;
        }
      }

      // 3. Query Firestore by rollNo if 1 to 5 digits
      if (/^\d{1,5}$/.test(raw)) {
        const qRoll = query(collection(firestoreDb, 'students'), where('rollNo', '==', raw));
        const snapRoll = await getDocs(qRoll);
        if (!snapRoll.empty) {
          return snapRoll.docs[0].data() as Student;
        }
      }

      // 4. Fallback search by username
      const qUser = query(collection(firestoreDb, 'students'), where('username', '==', queryUpper));
      const snapUser = await getDocs(qUser);
      if (!snapUser.empty) {
        return snapUser.docs[0].data() as Student;
      }
    } catch (err) {
      if (!isOfflineOrUnavailableError(err)) {
        console.debug('getStudentFromFirebase notice:', err);
      }
    }

    return null;
  }

  async updateStudentInFirestore(studentId: string, updates: Partial<Student>): Promise<void> {
    try {
      await setDoc(doc(firestoreDb, 'students', studentId), updates, { merge: true });
    } catch (err) {
      if (!isOfflineOrUnavailableError(err)) {
        console.debug('Error updating student in Firestore:', err);
      }
    }
  }

  async deleteStudentFromFirestore(studentId: string): Promise<void> {
    try {
      await deleteDoc(doc(firestoreDb, 'students', studentId));
    } catch (err) {
      if (!isOfflineOrUnavailableError(err)) {
        console.debug('Error deleting student from Firestore:', err);
      }
    }
  }

  /**
   * Complete real-time sync pulling from both Realtime Database & Firestore backend
   * Uses aggressive timeouts (3.5s) to guarantee it NEVER hangs in "Refreshing..."
   */
  async syncWithRealtimeDbAndFirestore(): Promise<{ success: boolean; studentCount: number; error?: string }> {
    if (this.isSyncing) {
      return { success: true, studentCount: this.getStudents().length };
    }
    this.isSyncing = true;
    try {
      // 1. Fetch Realtime Database root snapshot with 3.5s timeout
      const rtdbPromise = withTimeout(
        get(ref(realtimeDb)).catch(() => null),
        3500,
        null
      );

      // 2. Fetch Firestore collections in parallel with 3.5s timeout
      const firestoreStudentsPromise = withTimeout(
        getDocs(collection(firestoreDb, 'students')).catch(() => null),
        3500,
        null
      );
      const firestoreQuizzesPromise = withTimeout(
        getDocs(collection(firestoreDb, 'quizzes')).catch(() => null),
        3500,
        null
      );
      const firestoreQuestionsPromise = withTimeout(
        getDocs(collection(firestoreDb, 'questions')).catch(() => null),
        3500,
        null
      );
      const firestoreSessionsPromise = withTimeout(
        getDocs(collection(firestoreDb, 'quizSessions')).catch(() => null),
        3500,
        null
      );
      const firestoreSettingsPromise = withTimeout(
        getDoc(doc(firestoreDb, 'settings', 'portal')).catch(() => null),
        3500,
        null
      );
      const firestoreWinnersPromise = withTimeout(
        getDocs(collection(firestoreDb, 'winners')).catch(() => null),
        3500,
        null
      );
      const firestoreNotifsPromise = withTimeout(
        getDocs(collection(firestoreDb, 'notifications')).catch(() => null),
        3500,
        null
      );

      const [
        rtdbSnap,
        fStudents,
        fQuizzes,
        fQuestions,
        fSessions,
        fSettings,
        fWinners,
        fNotifs,
      ] = await Promise.all([
        rtdbPromise,
        firestoreStudentsPromise,
        firestoreQuizzesPromise,
        firestoreQuestionsPromise,
        firestoreSessionsPromise,
        firestoreSettingsPromise,
        firestoreWinnersPromise,
        firestoreNotifsPromise,
      ]);

      // A. Populate from Realtime Database if present
      if (rtdbSnap && rtdbSnap.exists()) {
        const rootVal = rtdbSnap.val();
        if (rootVal && typeof rootVal === 'object') {
          // Students
          if (rootVal.students) {
            const rawStd = typeof rootVal.students === 'object' ? Object.values(rootVal.students) as Student[] : [];
            if (rawStd.length > 0) {
              const stdMap = new Map<string, Student>();
              for (const s of this.getStudents()) stdMap.set(s.id, s);
              for (const s of rawStd) {
                if (s && s.id) {
                  const existing = stdMap.get(s.id);
                  stdMap.set(s.id, { ...existing, ...s });
                }
              }
              this.setStorage(STORAGE_KEYS.STUDENTS, Array.from(stdMap.values()));
            }
          }

          // Quizzes
          if (rootVal.quizzes) {
            const rawQ = Array.isArray(rootVal.quizzes) ? rootVal.quizzes : Object.values(rootVal.quizzes) as Quiz[];
            if (rawQ.length > 0) {
              this.setStorage(STORAGE_KEYS.QUIZZES, rawQ);
            }
          }

          // Questions
          if (rootVal.questions) {
            const rawQuestions = Array.isArray(rootVal.questions) ? rootVal.questions : Object.values(rootVal.questions) as Question[];
            if (rawQuestions.length > 0) {
              this.setStorage(STORAGE_KEYS.QUESTIONS, rawQuestions);
            }
          }

          // Sessions
          if (rootVal.quizSessions) {
            const rawSess = Array.isArray(rootVal.quizSessions) ? rootVal.quizSessions : Object.values(rootVal.quizSessions) as QuizSession[];
            if (rawSess.length > 0) {
              const sMap = new Map<string, QuizSession>();
              for (const s of this.getSessions()) sMap.set(s.id, s);
              for (const s of rawSess) {
                if (s && s.id) sMap.set(s.id, s);
              }
              this.setStorage(STORAGE_KEYS.SESSIONS, Array.from(sMap.values()));
            }
          }

          // Settings
          if (rootVal.settings && typeof rootVal.settings === 'object') {
            this.setStorage(STORAGE_KEYS.SETTINGS, { ...DEFAULT_SETTINGS, ...rootVal.settings });
          }

          // Winners
          if (rootVal.winners) {
            const rawW = Array.isArray(rootVal.winners) ? rootVal.winners : Object.values(rootVal.winners) as WinnerRecord[];
            if (rawW.length > 0) {
              this.setStorage(STORAGE_KEYS.WINNERS, rawW);
            }
          }

          // Notifications
          if (rootVal.notifications) {
            const rawN = Array.isArray(rootVal.notifications) ? rootVal.notifications : Object.values(rootVal.notifications) as AppNotification[];
            if (rawN.length > 0) {
              this.mergeNotifications(rawN);
            }
          }
        }
      }

      // B. Merge Firestore snapshots
      if (fStudents && !fStudents.empty) {
        const stdMap = new Map<string, Student>();
        for (const s of this.getStudents()) stdMap.set(s.id, s);
        fStudents.forEach(docSnap => {
          const s = docSnap.data() as Student;
          if (s && s.id) {
            const existing = stdMap.get(s.id);
            stdMap.set(s.id, { ...existing, ...s });
          }
        });
        this.setStorage(STORAGE_KEYS.STUDENTS, Array.from(stdMap.values()));
      }

      if (fQuizzes && !fQuizzes.empty) {
        const qList: Quiz[] = [];
        fQuizzes.forEach(d => qList.push(d.data() as Quiz));
        if (qList.length > 0) this.setStorage(STORAGE_KEYS.QUIZZES, qList);
      }

      if (fQuestions && !fQuestions.empty) {
        const qList: Question[] = [];
        fQuestions.forEach(d => qList.push(d.data() as Question));
        if (qList.length > 0) {
          const qMap = new Map<string, Question>();
          for (const q of this.getQuestions()) qMap.set(q.id, q);
          for (const q of qList) if (q && q.id) qMap.set(q.id, q);
          this.setStorage(STORAGE_KEYS.QUESTIONS, Array.from(qMap.values()));
        }
      }

      if (fSessions && !fSessions.empty) {
        const sList: QuizSession[] = [];
        fSessions.forEach(d => sList.push(d.data() as QuizSession));
        if (sList.length > 0) {
          const sMap = new Map<string, QuizSession>();
          for (const s of this.getSessions()) sMap.set(s.id, s);
          for (const s of sList) if (s && s.id) sMap.set(s.id, s);
          this.setStorage(STORAGE_KEYS.SESSIONS, Array.from(sMap.values()));
        }
      }

      if (fSettings && fSettings.exists()) {
        const s = fSettings.data() as PortalSettings;
        this.setStorage(STORAGE_KEYS.SETTINGS, { ...DEFAULT_SETTINGS, ...s });
      }

      if (fWinners && !fWinners.empty) {
        const wList: WinnerRecord[] = [];
        fWinners.forEach(d => wList.push(d.data() as WinnerRecord));
        if (wList.length > 0) this.setStorage(STORAGE_KEYS.WINNERS, wList);
      }

      if (fNotifs && !fNotifs.empty) {
        const nList: AppNotification[] = [];
        fNotifs.forEach(d => nList.push(d.data() as AppNotification));
        if (nList.length > 0) this.mergeNotifications(nList);
      }

      const now = new Date().toISOString();
      this.setLastSyncedAt(now);
      this.setDraftChanges(false);
      this.notifyListeners();
      return { success: true, studentCount: this.getStudents().length };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: true, studentCount: this.getStudents().length, error: msg };
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Backward-compatible alias for syncWithRealtimeDbAndFirestore
   */
  async syncFromFirestore(): Promise<{ success: boolean; studentCount: number; error?: string }> {
    return this.syncWithRealtimeDbAndFirestore();
  }

  /**
   * Publish all local changes live to Firebase Realtime Database & Firestore
   * Pushes instantly to Realtime Database so all clients update immediately,
   * and persists in Firestore in parallel without blocking or hanging!
   */
  async publishGlobalLive(adminEmail = 'admin@fsudmc.com'): Promise<{ success: boolean; message: string }> {
    try {
      const students = this.getStudents();
      const quizzes = this.getQuizzes();
      const questions = this.getQuestions();
      const sessions = this.getSessions();
      const settings = this.getSettings();
      const winners = this.getWinners();
      const notifs = this.getNotifications();

      // 1. Prepare Realtime Database atomic payload
      const studentsMap: Record<string, unknown> = {};
      for (const s of students) {
        const sanitized: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(s)) {
          if (v !== undefined && k !== 'passcode') {
            sanitized[k] = v;
          }
        }
        studentsMap[s.id] = sanitized;
      }

      const quizzesMap: Record<string, unknown> = {};
      for (const q of quizzes) {
        quizzesMap[q.id] = q;
      }

      const questionsMap: Record<string, unknown> = {};
      for (const q of questions) {
        questionsMap[q.id] = q;
      }

      const sessionsMap: Record<string, unknown> = {};
      for (const sess of sessions) {
        sessionsMap[sess.id] = sess;
      }

      const winnersMap: Record<string, unknown> = {};
      for (const w of winners) {
        winnersMap[w.quizId] = w;
      }

      const notifsMap: Record<string, unknown> = {};
      for (const n of notifs) {
        notifsMap[n.id] = n;
      }

      const rtdbPayload: Record<string, unknown> = {
        syncMeta: {
          lastPublishedAt: new Date().toISOString(),
          publishedBy: adminEmail,
          version: Date.now(),
        },
        settings,
        students: studentsMap,
        quizzes: quizzesMap,
        questions: questionsMap,
        quizSessions: sessionsMap,
        winners: winnersMap,
        notifications: notifsMap,
      };

      // 2. Perform atomic Realtime Database write with 3.5s timeout
      await withTimeout(
        update(ref(realtimeDb), rtdbPayload).catch(err => {
          console.debug('RTDB update notice:', err);
          return null;
        }),
        3500,
        null
      );

      // 3. Perform parallel Firestore writes with 3.5s timeout
      const firestorePromises: Promise<unknown>[] = [];

      for (const s of students) {
        const sanitized: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(s)) {
          if (v !== undefined && k !== 'passcode') {
            sanitized[k] = v;
          }
        }
        firestorePromises.push(
          setDoc(doc(firestoreDb, 'students', s.id), sanitized, { merge: true }).catch(() => {})
        );
        if (s.uid && s.uid !== s.id) {
          firestorePromises.push(
            setDoc(doc(firestoreDb, 'students', s.uid), sanitized, { merge: true }).catch(() => {})
          );
        }
      }

      for (const q of quizzes) {
        firestorePromises.push(
          setDoc(doc(firestoreDb, 'quizzes', q.id), q, { merge: true }).catch(() => {})
        );
      }

      for (const q of questions) {
        firestorePromises.push(
          setDoc(doc(firestoreDb, 'questions', q.id), q, { merge: true }).catch(() => {})
        );
        if (q.quizId) {
          firestorePromises.push(
            setDoc(doc(firestoreDb, 'quizzes', q.quizId, 'questions', q.id), q, { merge: true }).catch(() => {})
          );
        }
      }

      firestorePromises.push(
        setDoc(doc(firestoreDb, 'settings', 'portal'), settings, { merge: true }).catch(() => {})
      );

      for (const w of winners) {
        firestorePromises.push(
          setDoc(doc(firestoreDb, 'winners', w.quizId), w, { merge: true }).catch(() => {})
        );
      }

      for (const n of notifs) {
        firestorePromises.push(
          setDoc(doc(firestoreDb, 'notifications', n.id), n, { merge: true }).catch(() => {})
        );
      }

      // Execute all Firestore writes in parallel with 3.5s timeout
      await withTimeout(Promise.allSettled(firestorePromises), 3500, []);

      // 4. Update local state
      this.setDraftChanges(false);
      const now = new Date().toISOString();
      this.setLastSyncedAt(now);

      this.addAuditLog({
        adminEmail,
        action: 'ग्लोबल लाइभ प्रकाशित (Global Live)',
        target: 'cloud_realtime_and_firestore',
        details: 'सबै विद्यार्थी विवरण, प्रश्न, क्विज तथा सेटिङ Realtime Database र Firestore मा प्रत्यक्ष प्रकाशित गरियो'
      });

      this.notifyListeners();
      return { success: true, message: 'सबै डाटा क्लाउड Realtime Database र Firestore मा सफलतापूर्वक लाइभ प्रकाशित गरियो!' };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, message: `ग्लोबल लाइभ गर्न समस्या: ${msg}` };
    }
  }

  // =================== NOTIFICATIONS ===================

  getNotifications(): AppNotification[] {
    return this.getStorage<AppNotification[]>(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
  }

  getNotificationsForStudent(studentId?: string): AppNotification[] {
    const all = this.getNotifications();
    if (!studentId) {
      return all.filter(n => n.targetType === 'all');
    }
    return all.filter(n => n.targetType === 'all' || n.targetStudentId === studentId);
  }

  getUnreadNotificationCount(studentId?: string): number {
    if (!studentId) return 0;
    const forStudent = this.getNotificationsForStudent(studentId);
    return forStudent.filter(n => !n.readBy || !n.readBy.includes(studentId)).length;
  }

  markNotificationAsRead(notificationId: string, studentId: string): void {
    const notifs = this.getNotifications();
    const idx = notifs.findIndex(n => n.id === notificationId);
    if (idx >= 0) {
      const readBy = notifs[idx].readBy || [];
      if (!readBy.includes(studentId)) {
        notifs[idx].readBy = [...readBy, studentId];
        this.setStorage(STORAGE_KEYS.NOTIFICATIONS, notifs);
        set(ref(realtimeDb, `notifications/${notificationId}/readBy`), notifs[idx].readBy).catch(() => {});
        this.notifyListeners();
      }
    }
  }

  markAllNotificationsAsRead(studentId: string): void {
    const notifs = this.getNotifications();
    let changed = false;
    for (const n of notifs) {
      if (n.targetType === 'all' || n.targetStudentId === studentId) {
        n.readBy = n.readBy || [];
        if (!n.readBy.includes(studentId)) {
          n.readBy.push(studentId);
          changed = true;
          set(ref(realtimeDb, `notifications/${n.id}/readBy`), n.readBy).catch(() => {});
        }
      }
    }
    if (changed) {
      this.setStorage(STORAGE_KEYS.NOTIFICATIONS, notifs);
      this.notifyListeners();
    }
  }

  mergeNotifications(incoming: AppNotification[]): void {
    const local = this.getNotifications();
    const map = new Map<string, AppNotification>();
    for (const n of local) map.set(n.id, n);
    for (const n of incoming) {
      if (n && n.id) {
        const existing = map.get(n.id);
        map.set(n.id, { ...existing, ...n });
      }
    }
    const merged = Array.from(map.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    this.setStorage(STORAGE_KEYS.NOTIFICATIONS, merged);
    this.notifyListeners();
  }

  async sendNotification(params: {
    title: string;
    message: string;
    targetType: 'all' | 'specific';
    targetStudentId?: string;
    targetStudentName?: string;
    type?: NotificationType;
    adminEmail?: string;
  }): Promise<{ success: boolean; notification?: AppNotification; error?: string }> {
    try {
      const notifId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const now = new Date().toISOString();
      const newNotif: AppNotification = {
        id: notifId,
        title: params.title.trim(),
        message: params.message.trim(),
        targetType: params.targetType,
        targetStudentId: params.targetStudentId,
        targetStudentName: params.targetStudentName,
        type: params.type || 'info',
        createdAt: now,
        sentBy: params.adminEmail || 'admin@fsudmc.com',
        readBy: [],
      };

      // 1. Update local storage
      const list = this.getNotifications();
      list.unshift(newNotif);
      this.setStorage(STORAGE_KEYS.NOTIFICATIONS, list);

      // 2. Push to Realtime Database
      set(ref(realtimeDb, `notifications/${notifId}`), newNotif).catch(err => {
        if (!isOfflineOrUnavailableError(err)) {
          console.debug('RTDB sendNotification notice:', err);
        }
      });

      // 3. Push to Firestore
      setDoc(doc(firestoreDb, 'notifications', notifId), newNotif, { merge: true }).catch(err => {
        if (!isOfflineOrUnavailableError(err)) {
          console.debug('Firestore sendNotification notice:', err);
        }
      });

      // 4. Audit log
      this.addAuditLog({
        adminEmail: newNotif.sentBy,
        action: 'सूचना पठाइयो',
        target:
          newNotif.targetType === 'all'
            ? 'सबै विद्यार्थीहरू'
            : `विद्यार्थी: ${newNotif.targetStudentName || newNotif.targetStudentId}`,
        details: `शीर्षक: ${newNotif.title}`,
      });

      this.notifyListeners();
      return { success: true, notification: newNotif };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, error: msg };
    }
  }

  async deleteNotification(notificationId: string, adminEmail = 'admin@fsudmc.com'): Promise<void> {
    const list = this.getNotifications().filter(n => n.id !== notificationId);
    this.setStorage(STORAGE_KEYS.NOTIFICATIONS, list);

    // Delete from Realtime Database
    remove(ref(realtimeDb, `notifications/${notificationId}`)).catch(() => {});

    // Delete from Firestore
    deleteDoc(doc(firestoreDb, 'notifications', notificationId)).catch(() => {});

    this.addAuditLog({
      adminEmail,
      action: 'सूचना हटाइयो',
      target: notificationId,
      details: 'सूचना प्रणालीबाट हटाइयो',
    });

    this.notifyListeners();
  }

  // =================== QUIZZES ===================

  getQuizzes(): Quiz[] {
    return this.getStorage<Quiz[]>(STORAGE_KEYS.QUIZZES, [createInitialQuiz()]);
  }

  getActiveQuiz(): Quiz | null {
    const quizzes = this.getQuizzes();
    const active = quizzes.find(q => q.status === 'active');
    return active || null;
  }

  createQuiz(quizData: Omit<Quiz, 'id' | 'createdAt'>, adminEmail = 'admin'): Quiz {
    const newQuiz: Quiz = {
      ...quizData,
      id: `quiz_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    this.saveQuiz(newQuiz, adminEmail);
    return newQuiz;
  }

  updateQuiz(quiz: Quiz, adminEmail = 'admin'): void {
    this.saveQuiz(quiz, adminEmail);
  }

  setActiveQuiz(quizId: string, adminEmail = 'admin'): void {
    const quizzes = this.getQuizzes();
    quizzes.forEach(q => {
      q.status = q.id === quizId ? 'active' : 'archived';
    });
    this.setStorage(STORAGE_KEYS.QUIZZES, quizzes);
    this.setDraftChanges(true);

    for (const q of quizzes) {
      setDoc(doc(firestoreDb, 'quizzes', q.id), q, { merge: true }).catch(() => {});
    }

    this.addAuditLog({
      adminEmail,
      action: 'सक्रिय क्विज परिवर्तन',
      target: quizId,
      details: `क्विज ${quizId} लाई प्रत्यक्ष सक्रिय गरियो`
    });

    this.notifyListeners();
  }

  saveQuiz(quiz: Quiz, adminEmail = 'admin'): void {
    const quizzes = this.getQuizzes();
    const idx = quizzes.findIndex(q => q.id === quiz.id);
    if (idx >= 0) {
      quizzes[idx] = { ...quiz, updatedAt: new Date().toISOString() };
    } else {
      quizzes.unshift({ ...quiz, createdAt: new Date().toISOString() });
    }
    this.setStorage(STORAGE_KEYS.QUIZZES, quizzes);
    this.setDraftChanges(true);

    // Save to Firestore & Realtime Database
    setDoc(doc(firestoreDb, 'quizzes', quiz.id), quiz, { merge: true }).catch(() => {});
    set(ref(realtimeDb, `quizzes/${quiz.id}`), quiz).catch(() => {});

    this.addAuditLog({
      adminEmail,
      action: 'क्विज सुरक्षित',
      target: quiz.id,
      details: `क्विज "${quiz.title}" सुरक्षित गरियो`
    });

    this.notifyListeners();
  }

  deleteQuiz(quizId: string, adminEmail = 'admin'): void {
    let quizzes = this.getQuizzes();
    quizzes = quizzes.filter(q => q.id !== quizId);
    this.setStorage(STORAGE_KEYS.QUIZZES, quizzes);
    deleteDoc(doc(firestoreDb, 'quizzes', quizId)).catch(() => {});
    remove(ref(realtimeDb, `quizzes/${quizId}`)).catch(() => {});

    this.addAuditLog({
      adminEmail,
      action: 'क्विज मेटाइयो',
      target: quizId,
      details: `क्विज ID ${quizId} स्थायी रूपमा हटाइयो`
    });

    this.notifyListeners();
  }

  // =================== QUESTIONS ===================

  getQuestions(quizId?: string): Question[] {
    const all = this.getStorage<Question[]>(STORAGE_KEYS.QUESTIONS, INITIAL_50_QUESTIONS);
    if (!quizId) return all;
    return all.filter(q => q.quizId === quizId || q.quizId === 'quiz_week_12');
  }

  getQuestionsForSet(setNumber: 1 | 2 | 3 | 4 | 5, quizId?: string): Question[] {
    const all = this.getQuestions(quizId);
    return all.filter(q => q.setNumber === setNumber);
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
    this.setDraftChanges(true);

    // Persist to Firestore & Realtime Database: global questions collection and quiz questions subcollection
    setDoc(doc(firestoreDb, 'questions', question.id), question, { merge: true }).catch(err => {
      console.warn('Firestore question save error:', err);
    });
    if (question.quizId) {
      setDoc(doc(firestoreDb, 'quizzes', question.quizId, 'questions', question.id), question, { merge: true }).catch(() => {});
    }
    set(ref(realtimeDb, `questions/${question.id}`), question).catch(() => {});

    this.addAuditLog({
      adminEmail,
      action: 'प्रश्न सुरक्षित',
      target: question.id,
      details: `सेट ${question.setNumber} को प्रश्न सुरक्षित गरियो`
    });

    this.notifyListeners();
  }

  deleteQuestion(questionId: string, adminEmail = 'admin'): void {
    let questions = this.getQuestions();
    const targetQ = questions.find(q => q.id === questionId);
    questions = questions.filter(q => q.id !== questionId);
    this.setStorage(STORAGE_KEYS.QUESTIONS, questions);
    this.setDraftChanges(true);

    deleteDoc(doc(firestoreDb, 'questions', questionId)).catch(err => {
      console.warn('Firestore question delete notice:', err);
    });
    if (targetQ?.quizId) {
      deleteDoc(doc(firestoreDb, 'quizzes', targetQ.quizId, 'questions', questionId)).catch(() => {});
    }
    remove(ref(realtimeDb, `questions/${questionId}`)).catch(() => {});

    this.addAuditLog({
      adminEmail,
      action: 'प्रश्न मेटाइयो',
      target: questionId,
      details: `प्रश्न हटाइयो`
    });

    this.notifyListeners();
  }

  // =================== SESSIONS & SUBMISSIONS ===================

  getSessions(quizId?: string): QuizSession[] {
    const all = this.getStorage<QuizSession[]>(STORAGE_KEYS.SESSIONS, INITIAL_SESSIONS);
    if (!quizId) return all;
    return all.filter(s => s.quizId === quizId);
  }

  getStudentSession(quizId: string, studentId: string): QuizSession | null {
    const sessions = this.getSessions(quizId);
    return sessions.find(s => s.studentId === studentId) || null;
  }

  startQuizSession(arg1: Student | Quiz, arg2: Student | Quiz): QuizSession {
    const student = ('rollNo' in arg1 ? arg1 : arg2) as Student;
    const quiz = ('durationMinutes' in arg1 ? arg1 : arg2) as Quiz;

    // Requirement: Check approved status before allowing session creation
    if (!this.isStudentApproved(student)) {
      throw new Error('तपाईंको खाता अझै स्वीकृत भएको छैन। प्रशासकीय स्वीकृतिपछि मात्र क्विज सुरु गर्न सकिनेछ।');
    }

    const existing = this.getStudentSession(quiz.id, student.id);
    if (existing) return existing;

    const setNumber = ((Math.floor(Math.random() * 5) + 1) as 1 | 2 | 3 | 4 | 5);
    const setQuestions = this.getQuestionsForSet(setNumber, quiz.id);
    const selectedQuestionIds = setQuestions.map(q => q.id).slice(0, 10);

    const now = new Date();
    const expiresAt = new Date(now.getTime() + quiz.durationMinutes * 60 * 1000).toISOString();

    const newSession: QuizSession = {
      id: `${quiz.id}_${student.id}`,
      uid: student.uid || student.id,
      quizId: quiz.id,
      studentId: student.id,
      studentName: student.name,
      studentRoll: student.rollNo,
      studentClass: student.class,
      studentSemester: student.semester,
      studentPhone: student.phone,
      studentPhoto: student.profilePhoto,
      selectedQuestionIds,
      startedAt: now.toISOString(),
      expiresAt,
      answers: {},
      score: 0,
      totalQuestions: selectedQuestionIds.length,
      percentage: 0,
      timeTakenSeconds: 0,
      status: 'in_progress',
    };

    const sessions = this.getSessions();
    sessions.push(newSession);
    this.setStorage(STORAGE_KEYS.SESSIONS, sessions);

    // Save session to Firestore
    setDoc(doc(firestoreDb, 'quizSessions', newSession.id), newSession, { merge: true }).catch(() => {});

    return newSession;
  }

  saveAnswer(
    quizIdOrSessionId: string,
    studentIdOrQuestionId: string,
    questionIdOrOption: string,
    optionArg?: QuestionOption
  ): QuizSession | null {
    let sessionId = quizIdOrSessionId;
    let questionId = studentIdOrQuestionId;
    let answer = questionIdOrOption as QuestionOption;
    if (optionArg) {
      sessionId = `${quizIdOrSessionId}_${studentIdOrQuestionId}`;
      questionId = questionIdOrOption;
      answer = optionArg;
    }
    return this.saveSessionAnswer(sessionId, questionId, answer);
  }

  saveSessionAnswer(sessionId: string, questionId: string, answer: QuestionOption): QuizSession | null {
    const sessions = this.getSessions();
    const idx = sessions.findIndex(s => s.id === sessionId);
    if (idx === -1) return null;

    const session = sessions[idx];
    if (session.status !== 'in_progress') return session;

    session.answers[questionId] = answer;
    sessions[idx] = session;
    this.setStorage(STORAGE_KEYS.SESSIONS, sessions);
    return session;
  }

  submitQuizSession(
    sessionIdOrQuizId: string,
    studentIdOrIsExpired?: string | boolean,
    _isExpiredArg?: boolean
  ): QuizSession | null {
    let sessionId = sessionIdOrQuizId;
    if (typeof studentIdOrIsExpired === 'string') {
      sessionId = `${sessionIdOrQuizId}_${studentIdOrIsExpired}`;
    }
    const sessions = this.getSessions();
    const idx = sessions.findIndex(s => s.id === sessionId);
    if (idx === -1) {
      return null;
    }

    const session = sessions[idx];
    if (session.status === 'submitted') {
      return session;
    }

    const now = new Date();
    const started = new Date(session.startedAt);
    const timeTakenSeconds = Math.max(1, Math.min(600, Math.floor((now.getTime() - started.getTime()) / 1000)));

    const allQuestions = this.getQuestions(session.quizId);
    const questionMap = new Map<string, Question>();
    allQuestions.forEach(q => questionMap.set(q.id, q));

    let score = 0;
    session.selectedQuestionIds.forEach(qId => {
      const q = questionMap.get(qId);
      const studentAns = session.answers[qId];
      if (q && studentAns && studentAns === q.correctAnswer) {
        score += 1;
      }
    });

    session.score = score;
    session.totalQuestions = session.selectedQuestionIds.length || 10;
    session.percentage = Math.round((score / session.totalQuestions) * 100);
    session.timeTakenSeconds = timeTakenSeconds;
    session.submittedAt = now.toISOString();
    session.status = 'submitted';

    sessions[idx] = session;
    this.calculateRanks(sessions, session.quizId);
    this.setStorage(STORAGE_KEYS.SESSIONS, sessions);

    // Save submission to Firestore
    setDoc(doc(firestoreDb, 'quizSessions', session.id), session, { merge: true }).catch(() => {});

    this.notifyListeners();
    return session;
  }

  private calculateRanks(sessions: QuizSession[], quizId: string): void {
    const quizSessions = sessions
      .filter(s => s.quizId === quizId && s.status === 'submitted')
      .sort((a, b) => {
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        return a.timeTakenSeconds - b.timeTakenSeconds;
      });

    quizSessions.forEach((sess, index) => {
      sess.rank = index + 1;
    });
  }

  // =================== WINNERS ===================

  getWinners(): WinnerRecord[] {
    return this.getStorage<WinnerRecord[]>(STORAGE_KEYS.WINNERS, INITIAL_WINNERS);
  }

  getWinnerForQuiz(quizId: string): WinnerRecord | null {
    const winners = this.getWinners();
    return winners.find(w => w.quizId === quizId) || null;
  }

  saveWinnersList(winners: WinnerRecord[], adminEmail = 'admin'): void {
    this.setStorage(STORAGE_KEYS.WINNERS, winners);
    // Push each winner to Firestore
    for (const w of winners) {
      setDoc(doc(firestoreDb, 'winners', w.quizId), w, { merge: true }).catch(() => {});
    }

    this.addAuditLog({
      adminEmail,
      action: 'विजेता सूची सुरक्षित गरियो',
      target: 'winners_all',
      details: `${winners.length} विजेता रेकर्डहरू स्थायी सुरक्षित गरियो`
    });

    this.notifyListeners();
  }

  publishWinners(winnerRecord: WinnerRecord, adminEmail = 'admin'): void {
    const winners = this.getWinners();
    const idx = winners.findIndex(w => w.quizId === winnerRecord.quizId);
    if (idx >= 0) {
      winners[idx] = winnerRecord;
    } else {
      winners.unshift(winnerRecord);
    }
    this.saveWinnersList(winners, adminEmail);
  }

  addWinner(winnerRecord: WinnerRecord, adminEmail = 'admin'): void {
    this.publishWinners(winnerRecord, adminEmail);
  }

  deleteWinner(quizId: string, adminEmail = 'admin'): void {
    let winners = this.getWinners();
    winners = winners.filter(w => w.quizId !== quizId);
    this.setStorage(STORAGE_KEYS.WINNERS, winners);
    deleteDoc(doc(firestoreDb, 'winners', quizId)).catch(() => {});
    this.notifyListeners();
  }

  getTieBreaks(): TieBreak[] {
    return this.getStorage<TieBreak[]>(STORAGE_KEYS.TIE_BREAKS, []);
  }

  saveTieBreak(tieBreak: TieBreak, adminEmail = 'admin'): void {
    const records = this.getTieBreaks();
    records.unshift(tieBreak);
    this.setStorage(STORAGE_KEYS.TIE_BREAKS, records);

    setDoc(doc(firestoreDb, 'tieBreaks', tieBreak.tieBreakId), tieBreak, { merge: true }).catch(() => {});

    this.addAuditLog({
      adminEmail,
      action: 'टाई-ब्रेक ड्र',
      target: tieBreak.quizId,
      details: `स्पिनिङ ह्विलमार्फत ${tieBreak.winnerName} विजयी छानिए`
    });

    this.notifyListeners();
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
    this.setStorage(STORAGE_KEYS.AUDIT_LOGS, logs.slice(0, 100));

    setDoc(doc(firestoreDb, 'auditLogs', newLog.id), newLog, { merge: true }).catch(() => {});
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
    this.setDraftChanges(true);

    // Save to Firestore & Realtime Database
    setDoc(doc(firestoreDb, 'settings', 'portal'), settings, { merge: true }).catch(() => {});
    set(ref(realtimeDb, 'settings'), settings).catch(() => {});

    this.addAuditLog({
      adminEmail,
      action: 'सेटिङ अद्यावधिक',
      target: 'settings',
      details: 'क्याम्पस क्विज पोर्टल सेटिङ सुरक्षित गरियो'
    });

    this.notifyListeners();
  }
}

export const dataService = new DataService();
