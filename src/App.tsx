import React, { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { dataService } from './lib/dataService';
import { auth, firestoreDb, onAuthStateChanged } from './lib/firebase';
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
import { NotFoundPage } from './pages/NotFoundPage';

// Admin Portal Components & Pages
import { AdminLogin } from './admin/AdminLogin';
import { AdminLayout } from './admin/AdminLayout';
import { AdminDashboard } from './admin/AdminDashboard';
import { AdminQuizzes } from './admin/AdminQuizzes';
import { AdminStudents } from './admin/AdminStudents';
import { AdminQuestions } from './admin/AdminQuestions';
import { AdminSubmissions } from './admin/AdminSubmissions';
import { AdminWinners } from './admin/AdminWinners';
import { AdminReports } from './admin/AdminReports';
import { AdminSettings } from './admin/AdminSettings';

// Helper to determine the normalized route regardless of GitHub Pages base path, subpath, or custom domain
function parseCurrentRoute(): string {
  if (typeof window === 'undefined') return '/';

  // 1. Check if redirected from GitHub Pages 404.html via ?/ (e.g. ?/quizemasteradmin or ?/login)
  if (window.location.search.startsWith('?/')) {
    const raw = window.location.search.slice(2).split('&')[0];
    const decoded = decodeURIComponent(raw.replace(/~and~/g, '&'));
    const cleanUrl = window.location.pathname + window.location.hash;
    window.history.replaceState(null, '', cleanUrl);
    return decoded.startsWith('/') ? decoded : `/${decoded}`;
  }

  // 2. Check if redirected from GitHub Pages 404.html via ?p= or ?path=
  const searchParams = new URLSearchParams(window.location.search);
  const redirectParam = searchParams.get('p') || searchParams.get('path');
  if (redirectParam) {
    const cleanUrl = window.location.pathname + window.location.hash;
    window.history.replaceState(null, '', cleanUrl);
    return redirectParam.startsWith('/') ? redirectParam : `/${redirectParam}`;
  }

  // 3. Check hash route (e.g. #/login, #/quizemasteradmin)
  const hash = window.location.hash.replace(/^#\/?/, '/');
  if (hash && hash !== '/') {
    const cleanHash = hash.replace(/\.html$/, '');
    return cleanHash.startsWith('/') ? cleanHash : `/${cleanHash}`;
  }

  // 4. Check pathname, stripping .html suffix if accessed directly as file
  let rawPath = window.location.pathname || '/';
  if (rawPath.endsWith('.html')) {
    rawPath = rawPath.slice(0, -5);
  }
  if (rawPath.length > 1 && rawPath.endsWith('/')) {
    rawPath = rawPath.slice(0, -1);
  }

  // Recognized known routes
  const recognizedRoutes = [
    '/login',
    '/register',
    '/pending',
    '/dashboard',
    '/todays-quize',
    '/quiz/',
    '/winner-list',
    '/my-status',
    '/profile',
    '/quizemasteradmin',
    '/students',
    '/quizzes',
    '/questions',
    '/submissions',
    '/winners',
    '/reports',
    '/settings',
  ];

  for (const r of recognizedRoutes) {
    const idx = rawPath.indexOf(r);
    if (idx !== -1) {
      const matched = rawPath.substring(idx);
      // If student/admin sub-route accessed directly (e.g. /students), map to admin path
      if (['/students', '/quizzes', '/questions', '/submissions', '/winners', '/reports', '/settings'].includes(matched)) {
        return `/quizemasteradmin${matched}`;
      }
      return matched;
    }
  }

  // Handle trailing slashes or subpaths like /students/ or /students
  if (rawPath === '/students' || rawPath.startsWith('/students/')) {
    return '/quizemasteradmin/students';
  }

  // Dynamic admin slug match
  try {
    const stored = localStorage.getItem('fsudmc_settings_v2');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed?.adminSlug) {
        const slugRoute = `/${parsed.adminSlug}`;
        const idx = rawPath.indexOf(slugRoute);
        if (idx !== -1) {
          return rawPath.substring(idx);
        }
      }
    }
  } catch {
    // ignore
  }

  // Default root
  return '/';
}

export default function App() {
  const [showWelcomeSplash, setShowWelcomeSplash] = useState<boolean>(true);

  // Navigation / Routing state
  const [currentPath, setCurrentPath] = useState<string>(parseCurrentRoute);

  // Global State
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null);
  const [currentAdmin, setCurrentAdmin] = useState<AdminUser | null>(null);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [allQuizzes, setAllQuizzes] = useState<Quiz[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [allSessions, setAllSessions] = useState<QuizSession[]>([]);
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [allWinners, setAllWinners] = useState<WinnerRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

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

    // Auto-logout if current student account is suspended, blocked, or missing
    if (s) {
      if (s.status === 'suspended' || s.status === 'blocked' || s.status === 'restricted') {
        dataService.logoutStudent();
        setCurrentStudent(null);
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('student_kickout_reason', s.status);
        }
        navigate('/login');
      }
    }
  };

  // Real-time listener on current student's own Firestore doc to instantly detect admin suspension/blocking
  useEffect(() => {
    if (!currentStudent?.id) return;

    const unsubDoc = onSnapshot(
      doc(firestoreDb, 'students', currentStudent.id),
      (docSnap) => {
        if (!docSnap.exists()) {
          // Account was permanently deleted by admin
          dataService.logoutStudent();
          setCurrentStudent(null);
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('student_kickout_reason', 'deleted');
          }
          navigate('/login');
          return;
        }
        const data = docSnap.data() as Student;
        if (data.status === 'suspended' || data.status === 'blocked' || data.status === 'restricted') {
          // Automatically log out suspended or blocked student
          dataService.logoutStudent();
          setCurrentStudent(null);
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('student_kickout_reason', data.status);
          }
          navigate('/login');
        } else if (data.status !== currentStudent.status || data.name !== currentStudent.name) {
          setCurrentStudent(data);
        }
      },
      (err) => {
        console.debug('Live student document snapshot notice:', err);
      }
    );

    const handleTerminated = (e: Event) => {
      const customEvt = e as CustomEvent<{ reason?: string }>;
      const reason = customEvt.detail?.reason || 'suspended';
      dataService.logoutStudent();
      setCurrentStudent(null);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('student_kickout_reason', reason);
      }
      navigate('/login');
    };
    window.addEventListener('student_session_terminated', handleTerminated);

    return () => {
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

  // Navigate helper
  const navigate = (path: string) => {
    setCurrentPath(path);
    try {
      // If deployed on GitHub Pages under a repo subpath (e.g. username.github.io/reponame)
      const isGitHubRepo = window.location.hostname.endsWith('github.io') && window.location.pathname.split('/').filter(Boolean).length > 0;
      if (isGitHubRepo) {
        window.location.hash = path;
      } else {
        window.history.pushState({}, '', path);
      }
    } catch {
      window.location.hash = path;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
      ? allSessions.find(s => s.quizId === activeQuiz.id && s.studentId === currentStudent.id) || null
      : null;

  const studentSessions = currentStudent
    ? allSessions.filter(s => s.studentId === currentStudent.id)
    : [];

  // Route parser - Secret Admin slug matching (specifically quize.fsudmc.com/quizemasteradmin)
  const isAdminRoute =
    currentPath === adminPrefix ||
    currentPath.startsWith(`${adminPrefix}/`) ||
    currentPath === '/quizemasteradmin' ||
    currentPath.startsWith('/quizemasteradmin/');

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

    let adminContent: React.ReactNode = null;
    if (currentPath === adminPrefix || currentPath === `${adminPrefix}/dashboard`) {
      adminContent = (
        <AdminDashboard
          students={allStudents}
          activeQuiz={activeQuiz}
          sessions={allSessions}
          auditLogs={auditLogs}
          adminSlug={adminSlug}
          navigate={navigate}
        />
      );
    } else if (currentPath === `${adminPrefix}/quizzes`) {
      adminContent = (
        <AdminQuizzes
          quizzes={allQuizzes}
          activeQuiz={activeQuiz}
          onRefresh={refreshData}
        />
      );
    } else if (currentPath === `${adminPrefix}/students`) {
      adminContent = (
        <AdminStudents
          students={allStudents}
          sessions={allSessions}
          onRefresh={refreshData}
        />
      );
    } else if (currentPath === `${adminPrefix}/questions`) {
      adminContent = (
        <AdminQuestions
          questions={allQuestions}
          onRefresh={refreshData}
        />
      );
    } else if (currentPath === `${adminPrefix}/submissions`) {
      adminContent = (
        <AdminSubmissions
          sessions={allSessions}
          quizzes={allQuizzes}
          questions={allQuestions}
          students={allStudents}
          onRefresh={refreshData}
        />
      );
    } else if (currentPath === `${adminPrefix}/winners`) {
      adminContent = (
        <AdminWinners
          quizzes={allQuizzes}
          sessions={allSessions}
          winners={allWinners}
          onRefresh={refreshData}
        />
      );
    } else if (currentPath === `${adminPrefix}/reports`) {
      adminContent = (
        <AdminReports
          quizzes={allQuizzes}
          sessions={allSessions}
          students={allStudents}
          questions={allQuestions}
        />
      );
    } else if (currentPath === `${adminPrefix}/settings`) {
      adminContent = (
        <AdminSettings
          onRefresh={refreshData}
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
      currentStudent.status === 'restricted');

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
    studentPageContent = <NotFoundPage navigate={navigate} />;
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

      <main className="flex-1">
        {studentPageContent}
      </main>

      <Footer navigate={navigate} />
    </div>
  );
}
