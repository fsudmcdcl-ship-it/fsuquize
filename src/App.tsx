import React, { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { ref, onValue } from 'firebase/database';
import { BellRing, Bell, X, Sparkles } from 'lucide-react';
import { dataService, safeRtdbKey, triggerSystemNotification } from './lib/dataService';
import { auth, firestoreDb, realtimeDb, onAuthStateChanged } from './lib/firebase';
import type { Student, AdminUser, Quiz, QuizSession, WinnerRecord, Question, AuditLog } from './types/quiz';

// Student Portal Components & Pages
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { WelcomeSplashScreen } from './components/WelcomeSplashScreen';
import { HomePage } from './pages/HomePage';
import { RegisterPage } from './pages/RegisterPage';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { TodaysQuizPage } from './pages/TodaysQuizPage';
import { QuizSessionPage } from './pages/QuizSessionPage';
import { WinnerListPage } from './pages/WinnerListPage';
import { MyStatusPage } from './pages/MyStatusPage';
import { ProfilePage } from './pages/ProfilePage';
import { AccountPendingPage } from './pages/AccountPendingPage';
import { PastQuestionsPage } from './pages/PastQuestionsPage';
import { NotFoundPage } from './pages/NotFoundPage';

// Admin Portal Components & Pages
import { AdminLogin } from './admin/AdminLogin';
import { AdminLayout } from './admin/AdminLayout';
import { AdminDashboard } from './admin/AdminDashboard';
import { AdminQuizzes } from './admin/AdminQuizzes';
import { AdminStudents } from './admin/AdminStudents';
import { AdminQuestions } from './admin/AdminQuestions';
import { AdminPastQuestions } from './admin/AdminPastQuestions';
import { AdminSubmissions } from './admin/AdminSubmissions';
import { AdminWinners } from './admin/AdminWinners';
import { AdminReports } from './admin/AdminReports';
import { AdminSettings } from './admin/AdminSettings';

// Helper to determine the normalized route regardless of GitHub Pages base path, subpath, or custom domain
function parseCurrentRoute(): string {
  if (typeof window === 'undefined') return '/';

  // Helper to check if admin session is saved and load active slug
  let currentSlug = 'quizemasteradmin';
  let hasAdminSession = false;
  try {
    const storedSettings = localStorage.getItem('fsudmc_settings_v2');
    if (storedSettings) {
      const parsed = JSON.parse(storedSettings);
      if (parsed?.adminSlug) currentSlug = parsed.adminSlug;
    }
    hasAdminSession = Boolean(localStorage.getItem('fsudmc_current_admin_v2'));
  } catch {
    // ignore
  }

  // 1. Check if redirected from GitHub Pages 404.html via ?/ (e.g. ?/quizemasteradmin or ?/login or ?/wrongslug)
  if (window.location.search.startsWith('?/')) {
    const raw = window.location.search.slice(2).split('&')[0];
    const decoded = decodeURIComponent(raw.replace(/~and~/g, '&'));
    const cleanUrl = window.location.pathname + window.location.hash;
    window.history.replaceState(null, '', cleanUrl);
    const path = decoded.startsWith('/') ? decoded : `/${decoded}`;
    if (hasAdminSession && path === '/dashboard') {
      return `/${currentSlug}/dashboard`;
    }
    return path;
  }

  // 2. Check if redirected from GitHub Pages 404.html via ?p= or ?path=
  const searchParams = new URLSearchParams(window.location.search);
  const redirectParam = searchParams.get('p') || searchParams.get('path');
  if (redirectParam) {
    const cleanUrl = window.location.pathname + window.location.hash;
    window.history.replaceState(null, '', cleanUrl);
    const path = redirectParam.startsWith('/') ? redirectParam : `/${redirectParam}`;
    if (hasAdminSession && path === '/dashboard') {
      return `/${currentSlug}/dashboard`;
    }
    return path;
  }

  // 3. Check hash route (e.g. #/login, #/quizemasteradmin, #/wrongslug)
  const hash = window.location.hash.replace(/^#\/?/, '/');
  if (hash && hash !== '/') {
    const cleanHash = hash.replace(/\.html$/, '');
    const path = cleanHash.startsWith('/') ? cleanHash : `/${cleanHash}`;
    if (hasAdminSession && path === '/dashboard') {
      return `/${currentSlug}/dashboard`;
    }
    return path;
  }

  // 4. Check pathname, stripping .html suffix if accessed directly as file
  let rawPath = window.location.pathname || '/';
  if (rawPath.endsWith('.html')) {
    rawPath = rawPath.slice(0, -5);
  }
  if (rawPath.length > 1 && rawPath.endsWith('/')) {
    rawPath = rawPath.slice(0, -1);
  }

  // Root path
  if (!rawPath || rawPath === '' || rawPath === '/') {
    return '/';
  }

  // 5. Dynamic admin slug match
  if (currentSlug) {
    const slugRoute = `/${currentSlug}`;
    const idx = rawPath.indexOf(slugRoute);
    if (idx !== -1) {
      return rawPath.substring(idx);
    }
  }

  // Check default admin slugs
  for (const defaultSlug of ['/quizemasteradmin', '/admin']) {
    const idx = rawPath.indexOf(defaultSlug);
    if (idx !== -1) {
      return rawPath.substring(idx);
    }
  }

  // 6. Direct admin subpaths (when admin session is active or accessed directly)
  const adminDirectSubRoutes = [
    '/dashboard',
    '/students',
    '/quizzes',
    '/questions',
    '/submissions',
    '/winners',
    '/reports',
    '/settings',
  ];
  if (hasAdminSession) {
    for (const r of adminDirectSubRoutes) {
      if (rawPath === r || rawPath.startsWith(`${r}/`)) {
        return `/${currentSlug}${rawPath}`;
      }
    }
  } else {
    for (const r of ['/students', '/quizzes', '/questions', '/submissions', '/winners', '/reports', '/settings']) {
      const idx = rawPath.indexOf(r);
      if (idx !== -1) {
        return `/${currentSlug}${rawPath.substring(idx)}`;
      }
    }
  }

  // 7. Recognized student routes
  const recognizedRoutes = [
    '/login',
    '/register',
    '/pending',
    '/dashboard',
    '/todays-quize',
    '/quiz/',
    '/winner-list',
    '/past-questions',
    '/my-status',
    '/profile',
  ];

  for (const r of recognizedRoutes) {
    const idx = rawPath.indexOf(r);
    if (idx !== -1) {
      return rawPath.substring(idx);
    }
  }

  // Any other wrong slug or unknown URL: return rawPath so NotFoundPage is displayed!
  return rawPath;
}

export default function App() {
  const [showWelcomeSplash, setShowWelcomeSplash] = useState<boolean>(true);

  // Navigation / Routing state
  const [currentPath, setCurrentPath] = useState<string>(parseCurrentRoute);

  // Global State
  const [currentStudent, setCurrentStudent] = useState<Student | null>(() => dataService.getCurrentStudent());
  const [currentAdmin, setCurrentAdmin] = useState<AdminUser | null>(() => dataService.getCurrentAdmin());
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [allQuizzes, setAllQuizzes] = useState<Quiz[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [allSessions, setAllSessions] = useState<QuizSession[]>([]);
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [allWinners, setAllWinners] = useState<WinnerRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Phone notification permission prompt state
  const [showPhoneNotifPrompt, setShowPhoneNotifPrompt] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const dismissed = sessionStorage.getItem('fsudmc_notif_dismissed');
      return Notification.permission === 'default' && !dismissed;
    }
    return false;
  });

  const handleRequestPhoneNotification = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const res = await Notification.requestPermission();
        if (res === 'granted') {
          triggerSystemNotification(
            'दार्चुला बहुमुखी क्याम्पस',
            'मोबाइल नोटिफिकेसन सक्रिय भयो! अब नयाँ क्विज र सूचना तपाईंको फोन नोटिफिकेसनमा आउनेछ।'
          );
        }
        setShowPhoneNotifPrompt(false);
      } catch (err) {
        console.debug('Notification request notice:', err);
        setShowPhoneNotifPrompt(false);
      }
    }
  };

  // Real-time incoming notification alert toast for all devices
  const [activeAlertToast, setActiveAlertToast] = useState<{
    title: string;
    message: string;
    tag?: string;
  } | null>(null);

  useEffect(() => {
    const handleNotificationReceived = (e: Event) => {
      const customEvt = e as CustomEvent<{ title: string; message: string; tag?: string }>;
      if (customEvt.detail) {
        setActiveAlertToast({
          title: customEvt.detail.title,
          message: customEvt.detail.message,
          tag: customEvt.detail.tag,
        });
        refreshData();
      }
    };

    window.addEventListener('fsudmc_notification_received', handleNotificationReceived);
    return () => {
      window.removeEventListener('fsudmc_notification_received', handleNotificationReceived);
    };
  }, []);

  // Auto-dismiss alert toast after 8 seconds
  useEffect(() => {
    if (!activeAlertToast) return;
    const timer = setTimeout(() => {
      setActiveAlertToast(null);
    }, 8000);
    return () => clearTimeout(timer);
  }, [activeAlertToast]);

  // Reload data from data service
  const refreshData = () => {
    const s = dataService.getCurrentStudent();
    setCurrentStudent(s);
    const a = dataService.getCurrentAdmin();
    setCurrentAdmin(a);

    const quizzes = dataService.getQuizzes();
    setAllQuizzes(quizzes);
    const live = dataService.getActiveQuiz();
    setActiveQuiz(live);

    const stds = dataService.getStudents();
    setAllStudents(stds);

    const sess = dataService.getSessions();
    setAllSessions(sess);

    const qBank = dataService.getQuestions();
    setAllQuestions(qBank);

    const winList = dataService.getWinners();
    setAllWinners(winList);

    const logs = dataService.getAuditLogs();
    setAuditLogs(logs);

    // Auto-logout ONLY if current student account is explicitly suspended, blocked, or disabled
    // CRITICAL: NEVER kick out or redirect an active admin when student state changes!
    const isCurrentlyAdminActive = Boolean(
      a ||
      dataService.getCurrentAdmin() ||
      currentPath.includes('admin') ||
      currentPath.startsWith(`/${dataService.getAdminSlug()}`) ||
      ['/dashboard', '/quizzes', '/students', '/questions', '/submissions', '/winners', '/reports', '/settings', '/past-questions'].some(
        p => currentPath === p || currentPath.startsWith(`${p}/`)
      )
    );

    if (s && !isCurrentlyAdminActive) {
      if (
        s.status === 'suspended' ||
        s.status === 'blocked' ||
        s.status === 'disabled' ||
        (s.status as string) === 'disabled'
      ) {
        const reason = s.status;
        dataService.logoutStudent();
        setCurrentStudent(null);
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('student_kickout_reason', reason);
        }
        navigate('/login');
        return;
      }
    }
  };

  // Real-time listener on current student's status in Realtime Database & Firestore
  // Explicitly ensures pending accounts are NEVER logged out. Only suspended/blocked accounts are terminated.
  useEffect(() => {
    if (!currentStudent?.id) return;

    // Helper inside effect to always check fresh admin status
    const isOperatingAsAdmin = () => {
      if (dataService.getCurrentAdmin()) return true;
      if (typeof window !== 'undefined') {
        const path = window.location.pathname || '';
        const hash = window.location.hash || '';
        const slug = dataService.getAdminSlug() || 'quizemasteradmin';
        if (
          path.includes(slug) ||
          path.includes('quizemasteradmin') ||
          path.includes('admin') ||
          hash.includes(slug) ||
          hash.includes('quizemasteradmin') ||
          hash.includes('admin')
        ) {
          return true;
        }
      }
      return false;
    };

    // 1. Realtime Database listener (primary real-time engine)
    const studentRtdbRef = ref(realtimeDb, `students/${safeRtdbKey(currentStudent.id)}`);
    const unsubRtdb = onValue(
      studentRtdbRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          // May not be in RTDB yet; do not log out
          return;
        }
        const data = snapshot.val() as Student;
        if (!data) return;

        if (
          data.status === 'suspended' ||
          data.status === 'blocked' ||
          data.status === 'disabled' ||
          (data.status as string) === 'disabled'
        ) {
          dataService.logoutStudent();
          setCurrentStudent(null);
          // Never redirect if in admin context
          if (!isOperatingAsAdmin()) {
            if (typeof window !== 'undefined') {
              sessionStorage.setItem('student_kickout_reason', data.status);
            }
            navigate('/login');
          }
        } else if (data.status && (data.status !== currentStudent.status || data.name !== currentStudent.name || data.reExamAllowed !== currentStudent.reExamAllowed)) {
          setCurrentStudent((prev) => (prev ? { ...prev, ...data } : data));
        }
      },
      (err) => {
        console.debug('RTDB student monitor notice:', err);
      }
    );

    // 2. Firestore listener fallback
    let docPreviouslyExisted = false;
    const unsubDoc = onSnapshot(
      doc(firestoreDb, 'students', currentStudent.id),
      (docSnap) => {
        if (!docSnap.exists()) {
          // If the account was just created or still pending/local, do not kick out on the initial empty snapshot
          const stillInLocal = dataService.getStudents().some(s => s.id === currentStudent.id);
          if (docPreviouslyExisted && !stillInLocal) {
            // Student account was truly permanently deleted by admin
            dataService.logoutStudent();
            setCurrentStudent(null);
            if (!isOperatingAsAdmin()) {
              if (typeof window !== 'undefined') {
                sessionStorage.setItem('student_kickout_reason', 'deleted');
              }
              navigate('/login');
            }
          }
          return;
        }
        docPreviouslyExisted = true;
        const data = docSnap.data() as Student;
        if (!data) return;

        if (
          data.status === 'suspended' ||
          data.status === 'blocked' ||
          data.status === 'restricted' ||
          data.status === 'disabled' ||
          (data.status as string) === 'disabled'
        ) {
          dataService.logoutStudent();
          setCurrentStudent(null);
          if (!isOperatingAsAdmin()) {
            if (typeof window !== 'undefined') {
              sessionStorage.setItem('student_kickout_reason', data.status);
            }
            navigate('/login');
          }
        } else if (data.status && (data.status !== currentStudent.status || data.name !== currentStudent.name)) {
          setCurrentStudent((prev) => (prev ? { ...prev, ...data } : data));
        }
      },
      (err) => {
        console.debug('Firestore student monitor notice:', err);
      }
    );

    const handleTerminated = (e: Event) => {
      const customEvt = e as CustomEvent<{ reason?: string }>;
      const reason = customEvt.detail?.reason || '';
      // Only terminate session if account is suspended, blocked, or restricted
      if (reason === 'suspended' || reason === 'blocked' || reason === 'restricted' || reason === 'deleted') {
        dataService.logoutStudent();
        setCurrentStudent(null);
        if (!isOperatingAsAdmin()) {
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('student_kickout_reason', reason);
          }
          navigate('/login');
        }
      }
    };
    window.addEventListener('student_session_terminated', handleTerminated);

    return () => {
      unsubRtdb();
      unsubDoc();
      window.removeEventListener('student_session_terminated', handleTerminated);
    };
  }, [currentStudent?.id]);

  useEffect(() => {
    refreshData();

    // Subscribe to DataService live updates & Firestore sync events
    const unsubscribeData = dataService.subscribe(() => {
      refreshData();
    });

    // Listen to Firebase Auth state for admin user
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const admin = dataService.setAdminFromFirebase({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
        });
        setCurrentAdmin(admin);
      }
    });

    return () => {
      unsubscribeData();
      unsubscribeAuth();
    };
  }, []);

  // Listen to popstate & hashchange
  useEffect(() => {
    const handleRouteChange = () => {
      setCurrentPath(parseCurrentRoute());
    };
    window.addEventListener('popstate', handleRouteChange);
    window.addEventListener('hashchange', handleRouteChange);
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
      window.removeEventListener('hashchange', handleRouteChange);
    };
  }, []);

  const adminSubPathsList = [
    '/dashboard',
    '/quizzes',
    '/students',
    '/questions',
    '/submissions',
    '/winners',
    '/reports',
    '/settings',
  ];

  // Context-aware navigate helper: keeps admin within admin dashboard context after actions
  const navigate = (path: string) => {
    // If navigating explicitly to student past questions or student routes, never hijack into admin slug
    if (path === '/past-questions' || path.startsWith('/past-questions/')) {
      setCurrentPath('/past-questions');
      try {
        window.history.pushState({}, '', '/past-questions');
      } catch {
        if (typeof window !== 'undefined') window.location.hash = '/past-questions';
      }
      if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const slug = dataService.getAdminSlug() || 'quizemasteradmin';
    const prefix = `/${slug}`;
    const adminActive = Boolean(currentAdmin || dataService.getCurrentAdmin());
    const onAdminPath =
      currentPath === prefix ||
      currentPath.startsWith(`${prefix}/`) ||
      currentPath === '/quizemasteradmin' ||
      currentPath.startsWith('/quizemasteradmin/') ||
      currentPath === '/admin' ||
      currentPath.startsWith('/admin/') ||
      adminSubPathsList.some(p => currentPath === p || currentPath.startsWith(`${p}/`));

    let targetPath = path;
    const cleanSub = path.replace(/^\//, '').split('?')[0].split('#')[0];
    const adminSubKeywords = [
      'dashboard',
      'quizzes',
      'students',
      'questions',
      'submissions',
      'winners',
      'reports',
      'settings',
    ];
    const isAdminSub = adminSubKeywords.includes(cleanSub);

    // If currently operating within admin context:
    if (adminActive || onAdminPath) {
      if (isAdminSub && !path.startsWith(prefix) && !path.startsWith('/quizemasteradmin') && !path.startsWith('/admin')) {
        targetPath = `${prefix}/${cleanSub}`;
      } else if (path === prefix || path === '/quizemasteradmin' || path === '/admin') {
        targetPath = `${prefix}/dashboard`;
      }
    }

    setCurrentPath(targetPath);
    try {
      // If deployed on GitHub Pages under a repo subpath (e.g. username.github.io/reponame)
      const isGitHubRepo =
        typeof window !== 'undefined' &&
        window.location.hostname.endsWith('github.io') &&
        window.location.pathname.split('/').filter(Boolean).length > 0;
      if (isGitHubRepo) {
        window.location.hash = targetPath;
      } else {
        window.history.pushState({}, '', targetPath);
      }
    } catch {
      if (typeof window !== 'undefined') {
        window.location.hash = targetPath;
      }
    }
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleStudentLogout = () => {
    dataService.logoutStudent();
    setCurrentStudent(null);
    navigate('/');
  };

  const handleStudentStatusUpdated = (updated?: Student) => {
    if (updated) {
      setCurrentStudent(updated);
    }
    refreshData();
  };

  const adminSlug = dataService.getAdminSlug() || 'quizemasteradmin';
  const adminPrefix = `/${adminSlug}`;

  const handleAdminLogout = () => {
    dataService.logoutAdmin();
    setCurrentAdmin(null);
    navigate(adminPrefix);
  };

  // Determine active student session for current quiz
  const studentActiveSession =
    currentStudent && activeQuiz
      ? (currentStudent.reExamAllowed && (!currentStudent.reExamQuizId || currentStudent.reExamQuizId === activeQuiz.id))
        ? null
        : allSessions.find(s => s.quizId === activeQuiz.id && s.studentId === currentStudent.id) || null
      : null;

  const studentSessions = currentStudent
    ? allSessions.filter(s => s.studentId === currentStudent.id)
    : [];

  // Route parser - Secret Admin slug matching and admin session routing
  const isAdminRoute =
    currentPath === adminPrefix ||
    currentPath.startsWith(`${adminPrefix}/`) ||
    currentPath === '/quizemasteradmin' ||
    currentPath.startsWith('/quizemasteradmin/') ||
    currentPath === '/admin' ||
    currentPath.startsWith('/admin/') ||
    // If admin is active and current route is an admin subpath, maintain admin context
    (Boolean(currentAdmin || dataService.getCurrentAdmin()) &&
      adminSubPathsList.some(p => currentPath === p || currentPath.startsWith(`${p}/`)));

  // Admin routes handling
  if (isAdminRoute) {
    if (!currentAdmin) {
      return (
        <div className="min-h-screen bg-slate-950 font-sans">
          <AdminLogin
            adminSlug={adminSlug}
            onAdminLoggedIn={admin => {
              setCurrentAdmin(admin);
              navigate(`${adminPrefix}/dashboard`);
            }}
            navigate={navigate}
          />
        </div>
      );
    }

    // Normalize subpath whether visited via /{adminSlug}/..., /quizemasteradmin/..., /admin/..., or directly
    let adminSubPath = '/dashboard';
    const cleanAdminPrefix = `${adminPrefix}/`;
    if (currentPath.startsWith(cleanAdminPrefix)) {
      adminSubPath = '/' + currentPath.slice(cleanAdminPrefix.length);
    } else if (currentPath.startsWith('/quizemasteradmin/')) {
      adminSubPath = '/' + currentPath.slice('/quizemasteradmin/'.length);
    } else if (currentPath.startsWith('/admin/')) {
      adminSubPath = '/' + currentPath.slice('/admin/'.length);
    } else if (currentPath === adminPrefix || currentPath === '/quizemasteradmin' || currentPath === '/admin') {
      adminSubPath = '/dashboard';
    } else if (adminSubPathsList.some(p => currentPath === p || currentPath.startsWith(`${p}/`))) {
      adminSubPath = currentPath;
    } else {
      adminSubPath = currentPath;
    }

    if (adminSubPath.endsWith('/') && adminSubPath.length > 1) {
      adminSubPath = adminSubPath.slice(0, -1);
    }

    let adminContent: React.ReactNode = null;
    if (adminSubPath === '' || adminSubPath === '/' || adminSubPath === '/dashboard') {
      adminContent = (
        <AdminDashboard
          students={allStudents}
          activeQuiz={activeQuiz}
          sessions={allSessions}
          auditLogs={auditLogs}
          adminSlug={adminSlug}
          navigate={navigate}
          onRefresh={refreshData}
        />
      );
    } else if (adminSubPath === '/quizzes') {
      adminContent = (
        <AdminQuizzes
          quizzes={allQuizzes}
          activeQuiz={activeQuiz}
          onRefresh={refreshData}
        />
      );
    } else if (adminSubPath === '/students') {
      adminContent = (
        <AdminStudents
          students={allStudents}
          sessions={allSessions}
          onRefresh={refreshData}
        />
      );
    } else if (adminSubPath === '/questions') {
      adminContent = (
        <AdminQuestions
          questions={allQuestions}
          onRefresh={refreshData}
        />
      );
    } else if (adminSubPath === '/past-questions') {
      adminContent = (
        <AdminPastQuestions
          quizzes={allQuizzes}
          questions={allQuestions}
          onRefresh={refreshData}
          navigate={navigate}
        />
      );
    } else if (adminSubPath === '/submissions') {
      adminContent = (
        <AdminSubmissions
          sessions={allSessions}
          quizzes={allQuizzes}
          questions={allQuestions}
          students={allStudents}
          onRefresh={refreshData}
        />
      );
    } else if (adminSubPath === '/winners') {
      adminContent = (
        <AdminWinners
          quizzes={allQuizzes}
          sessions={allSessions}
          winners={allWinners}
          onRefresh={refreshData}
        />
      );
    } else if (adminSubPath === '/reports') {
      adminContent = (
        <AdminReports
          quizzes={allQuizzes}
          sessions={allSessions}
          students={allStudents}
          questions={allQuestions}
        />
      );
    } else if (adminSubPath === '/settings') {
      adminContent = (
        <AdminSettings
          onRefresh={refreshData}
          navigate={navigate}
        />
      );
    } else {
      adminContent = (
        <AdminDashboard
          students={allStudents}
          activeQuiz={activeQuiz}
          sessions={allSessions}
          auditLogs={auditLogs}
          adminSlug={adminSlug}
          navigate={navigate}
          onRefresh={refreshData}
        />
      );
    }

    return (
      <AdminLayout
        currentPath={currentPath}
        admin={currentAdmin}
        adminSlug={adminSlug}
        navigate={navigate}
        onLogout={handleAdminLogout}
        onRefresh={refreshData}
      >
        {adminContent}
      </AdminLayout>
    );
  }

  // Student portal routes
  const isSuspendedOrBlocked =
    currentStudent &&
    (currentStudent.status === 'suspended' ||
      currentStudent.status === 'blocked' ||
      currentStudent.status === 'disabled' ||
      (currentStudent.status as string) === 'disabled');

  let studentPageContent: React.ReactNode = null;

  if (isSuspendedOrBlocked && currentPath !== '/login' && currentPath !== '/register' && currentPath !== '/' && currentPath !== '') {
    const reason = currentStudent.status;
    dataService.logoutStudent();
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('student_kickout_reason', reason);
    }
    studentPageContent = (
      <LoginPage
        navigate={navigate}
        onStudentLoggedIn={student => {
          setCurrentStudent(student);
          refreshData();
          if (student.status === 'pending') {
            navigate('/pending');
          } else {
            navigate('/dashboard');
          }
        }}
      />
    );
  } else if (currentPath === '/' || currentPath === '') {
    studentPageContent = (
      <HomePage
        navigate={navigate}
        student={currentStudent}
        activeQuiz={activeQuiz}
        recentWinner={allWinners[0] || null}
        allQuizzes={allQuizzes}
      />
    );
  } else if (currentPath === '/register') {
    studentPageContent = (
      <RegisterPage
        navigate={navigate}
        onStudentRegistered={student => {
          setCurrentStudent(student);
          refreshData();
          if (student.status === 'pending') {
            navigate('/pending');
          } else {
            navigate('/dashboard');
          }
        }}
      />
    );
  } else if (currentPath === '/login') {
    studentPageContent = (
      <LoginPage
        navigate={navigate}
        onStudentLoggedIn={student => {
          setCurrentStudent(student);
          refreshData();
          if (student.status === 'pending') {
            navigate('/pending');
          } else {
            navigate('/dashboard');
          }
        }}
      />
    );
  } else if (currentPath === '/pending') {
    if (!currentStudent) {
      studentPageContent = (
        <LoginPage
          navigate={navigate}
          onStudentLoggedIn={student => {
            setCurrentStudent(student);
            refreshData();
            if (student.status === 'pending') {
              navigate('/pending');
            } else {
              navigate('/dashboard');
            }
          }}
        />
      );
    } else if (currentStudent.status !== 'pending') {
      studentPageContent = (
        <DashboardPage
          student={currentStudent}
          activeQuiz={activeQuiz}
          studentSession={studentActiveSession}
          allStudentSessions={studentSessions}
          navigate={navigate}
          onLogout={handleStudentLogout}
        />
      );
    } else {
      studentPageContent = (
        <AccountPendingPage
          student={currentStudent}
          navigate={navigate}
          onLogout={handleStudentLogout}
          onStatusUpdated={handleStudentStatusUpdated}
        />
      );
    }
  } else if (currentPath === '/dashboard') {
    if (!currentStudent) {
      studentPageContent = (
        <LoginPage
          navigate={navigate}
          onStudentLoggedIn={student => {
            setCurrentStudent(student);
            refreshData();
            if (student.status === 'pending') {
              navigate('/pending');
            } else {
              navigate('/dashboard');
            }
          }}
        />
      );
    } else if (currentStudent.status === 'pending') {
      studentPageContent = (
        <AccountPendingPage
          student={currentStudent}
          navigate={navigate}
          onLogout={handleStudentLogout}
          onStatusUpdated={handleStudentStatusUpdated}
        />
      );
    } else {
      studentPageContent = (
        <DashboardPage
          student={currentStudent}
          activeQuiz={activeQuiz}
          studentSession={studentActiveSession}
          allStudentSessions={studentSessions}
          navigate={navigate}
          onLogout={handleStudentLogout}
        />
      );
    }
  } else if (currentPath === '/todays-quize') {
    if (currentStudent && currentStudent.status === 'pending') {
      studentPageContent = (
        <AccountPendingPage
          student={currentStudent}
          navigate={navigate}
          onLogout={handleStudentLogout}
          onStatusUpdated={handleStudentStatusUpdated}
        />
      );
    } else {
      studentPageContent = (
        <TodaysQuizPage
          navigate={navigate}
          student={currentStudent}
          activeQuiz={activeQuiz}
          studentSession={studentActiveSession}
        />
      );
    }
  } else if (currentPath.startsWith('/quiz/')) {
    const quizId = currentPath.replace('/quiz/', '') || activeQuiz?.id || 'quiz_week_12';
    if (!currentStudent) {
      studentPageContent = (
        <LoginPage
          navigate={navigate}
          onStudentLoggedIn={student => {
            setCurrentStudent(student);
            refreshData();
            if (student.status === 'pending') {
              navigate('/pending');
            } else {
              navigate('/dashboard');
            }
          }}
        />
      );
    } else if (currentStudent.status === 'pending') {
      studentPageContent = (
        <AccountPendingPage
          student={currentStudent}
          navigate={navigate}
          onLogout={handleStudentLogout}
          onStatusUpdated={handleStudentStatusUpdated}
        />
      );
    } else {
      studentPageContent = (
        <QuizSessionPage
          quizId={quizId}
          student={currentStudent}
          activeQuiz={activeQuiz}
          navigate={navigate}
          onSessionUpdated={refreshData}
        />
      );
    }
  } else if (currentPath === '/winner-list') {
    studentPageContent = (
      <WinnerListPage
        winners={allWinners}
        navigate={navigate}
      />
    );
  } else if (currentPath === '/past-questions') {
    studentPageContent = (
      <PastQuestionsPage
        navigate={navigate}
        quizzes={allQuizzes}
        student={currentStudent}
      />
    );
  } else if (currentPath === '/my-status') {
    if (!currentStudent) {
      studentPageContent = (
        <LoginPage
          navigate={navigate}
          onStudentLoggedIn={student => {
            setCurrentStudent(student);
            refreshData();
            if (student.status === 'pending') {
              navigate('/pending');
            } else {
              navigate('/dashboard');
            }
          }}
        />
      );
    } else if (currentStudent.status === 'pending') {
      studentPageContent = (
        <AccountPendingPage
          student={currentStudent}
          navigate={navigate}
          onLogout={handleStudentLogout}
          onStatusUpdated={handleStudentStatusUpdated}
        />
      );
    } else {
      studentPageContent = (
        <MyStatusPage
          student={currentStudent}
          allQuizzes={allQuizzes}
          studentSessions={studentSessions}
          navigate={navigate}
        />
      );
    }
  } else if (currentPath === '/profile') {
    if (!currentStudent) {
      studentPageContent = (
        <LoginPage
          navigate={navigate}
          onStudentLoggedIn={student => {
            setCurrentStudent(student);
            refreshData();
            if (student.status === 'pending') {
              navigate('/pending');
            } else {
              navigate('/dashboard');
            }
          }}
        />
      );
    } else if (currentStudent.status === 'pending') {
      studentPageContent = (
        <AccountPendingPage
          student={currentStudent}
          navigate={navigate}
          onLogout={handleStudentLogout}
          onStatusUpdated={handleStudentStatusUpdated}
        />
      );
    } else {
      studentPageContent = (
        <ProfilePage
          student={currentStudent}
          onStudentUpdated={updated => {
            setCurrentStudent(updated);
            refreshData();
          }}
          navigate={navigate}
        />
      );
    }
  } else {
    studentPageContent = <NotFoundPage navigate={navigate} requestedPath={currentPath} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 font-sans selection:bg-red-500 selection:text-white">
      {/* 2-Second Campus Welcome Screen & Data Preloader */}
      {showWelcomeSplash && (
        <WelcomeSplashScreen
          onComplete={() => setShowWelcomeSplash(false)}
        />
      )}

      <Navbar
        currentPath={currentPath}
        student={currentStudent}
        navigate={navigate}
        onLogout={handleStudentLogout}
      />

      {/* Phone Push Notification Permission Prompt */}
      {showPhoneNotifPrompt && (
        <div className="bg-gradient-to-r from-red-600 via-rose-600 to-indigo-700 text-white px-4 py-2.5 shadow-sm text-xs border-b border-red-700/50">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5 text-center sm:text-left">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                <BellRing className="w-4 h-4 text-amber-300 animate-bounce" />
              </div>
              <div>
                <span className="font-bold">मोबाइल नोटिफिकेसन अलर्ट (Phone Notifications): </span>
                <span className="text-white/90">
                  नयाँ क्विज सुरु भएको, परीक्षा रिसेट र नतिजा घोषणाको तत्काल सूचना आफ्नो फोन नोटिफिकेसन ट्याबमा पाउन अनुमति दिनुहोस्।
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 justify-center">
              <button
                type="button"
                onClick={handleRequestPhoneNotification}
                className="px-3.5 py-1.5 bg-white text-red-700 hover:bg-slate-100 font-bold rounded-xl text-xs shadow-xs transition cursor-pointer"
              >
                🔔 अनुमति दिनुहोस् (Allow)
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowPhoneNotifPrompt(false);
                  sessionStorage.setItem('fsudmc_notif_dismissed', 'true');
                }}
                className="px-2.5 py-1.5 text-white/80 hover:text-white text-xs cursor-pointer"
              >
                पछि
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Real-time Floating Notification Alert Toast for Students */}
      {activeAlertToast && (
        <div className="fixed top-4 right-4 sm:right-6 z-50 max-w-sm w-[calc(100vw-2rem)] animate-in slide-in-from-top-4 fade-in duration-200">
          <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border-2 border-amber-400 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center shrink-0 font-bold shadow-md">
              <Bell className="w-5 h-5 animate-bounce" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[11px] font-black uppercase tracking-wider text-amber-400">
                  नयाँ क्याम्पस सूचना • New Alert
                </span>
                <button
                  type="button"
                  onClick={() => setActiveAlertToast(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <h4 className="text-xs font-bold text-white mt-0.5 line-clamp-1">
                {activeAlertToast.title}
              </h4>
              <p className="text-[11px] text-slate-300 mt-1 line-clamp-2 leading-relaxed">
                {activeAlertToast.message}
              </p>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1">
        {studentPageContent}
      </main>

      <Footer navigate={navigate} />
    </div>
  );
}
