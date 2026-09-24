export type AdminLanguage = 'ne' | 'en';

export const ADMIN_LANG_KEY = 'fsudmc_admin_language';

export function getAdminLanguage(): AdminLanguage {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(ADMIN_LANG_KEY);
    if (saved === 'en' || saved === 'ne') return saved;
  }
  return 'ne';
}

export function setAdminLanguage(lang: AdminLanguage): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(ADMIN_LANG_KEY, lang);
  }
}

export const adminTranslations = {
  ne: {
    // Top bar & general
    portalTitle: 'क्विज मास्टर पोर्टल',
    officialSystem: 'आधिकारिक क्याम्पस क्विज प्रणाली',
    timezone: 'Asia/Kathmandu',
    openStudentPortal: 'विद्यार्थी पोर्टल',
    logout: 'लगआउट',
    switchLanguage: 'English मा बदल्नुहोस्',
    currentLanguageLabel: 'नेपाली',

    // Global sync actions
    refreshDatabase: 'डाटाबेस रिफ्रेस',
    refreshing: 'रिफ्रेस हुँदैछ...',
    refreshedSuccess: 'रियलटाइम डाटाबेसबाट सबै डाटा सफलतापूर्वक रिफ्रेस भयो!',
    saveDraft: 'ड्राफ्ट सेभ',
    savingDraft: 'सेभ हुँदैछ...',
    draftSavedSuccess: 'परिवर्तनहरू ड्राफ्टको रूपमा सेभ गरियो!',
    publishGlobalLive: 'ग्लोबल लाइभ (Publish Live)',
    publishingLive: 'लाइभ प्रकाशित हुँदैछ...',
    publishedLiveSuccess: 'सबै परिवर्तनहरू रियलटाइम डाटाबेस र क्लाउडमा ग्लोबल लाइभ प्रकाशित गरियो!',
    statusGlobalLive: 'रियलटाइम डाटाबेस प्रत्यक्ष सक्रिय (Live)',
    statusDraftChanges: 'अप्रकाशित ड्राफ्ट परिवर्तनहरू छन्',

    // Sidebar items
    navDashboard: 'ड्यासबोर्ड',
    navQuizzes: 'साप्ताहिक क्विज व्यवस्थापन',
    navStudents: 'विद्यार्थी व्यवस्थापन',
    navQuestions: 'प्रश्न बैङ्क (५० प्रश्न)',
    navSubmissions: 'उत्तर तथा सबमिसन',
    navWinners: 'नतिजा तथा विजेता',
    navReports: 'डाउनलोड / एक्सल रिपोर्ट',
    navSettings: 'सेटिङ र फायरबेस',

    // Admin Login
    loginTitle: 'क्विज मास्टर लगइन',
    loginSubtitle: 'दार्चुला बहुमुखी क्याम्पस साप्ताहिक हाजिरी जवाफ व्यवस्थापन',
    emailLabel: 'प्रशासक इमेल (Admin Email)',
    passwordLabel: 'पासवर्ड (Password)',
    loginButton: 'Firebase मार्फत लगइन',
    loggingIn: 'प्रमाणीकरण हुँदैछ...',
    loginWithGoogle: 'Google खाता मार्फत प्रशासक लगइन',
    emergencyMasterLogin: 'आपतकालीन मास्टर पिन प्रयोग?',
    emergencyTitle: 'अफलाइन वा आपतकालीन मास्टर लगइन',
    emergencyDesc: 'इन्टरनेट वा कन्सोलमा समस्या आएको अवस्थामा क्याम्पस मास्टर पिन प्रयोग गर्न सकिन्छ।',
    backToLogin: '← Firebase लगइनमा फर्कनुहोस्',
    backToStudentPortal: '← विद्यार्थी पोर्टलमा फर्कनुहोस्',
    masterUsername: 'प्रशासक प्रयोगकर्ता',
    masterPin: 'मास्टर पासकोड / पिन',
    submitMaster: 'मास्टर लगइन गर्नुहोस्',

    // Students Management
    studentsTitle: 'विद्यार्थी व्यवस्थापन',
    studentsSubtitle: 'दर्ता भएका क्याम्पस विद्यार्थीहरूको सूची, खाता स्थिति नियन्त्रण र प्रमाणीकरण',
    totalStudents: 'जम्मा विद्यार्थी',
    searchPlaceholder: 'नाम, रोल नम्बर, कक्षा वा विद्यार्थी ID बाट खोज्नुहोस्...',
    filterAll: 'सबै स्थिति (All Status)',
    filterPending: 'स्वीकृति पर्खिरहेका (Pending Applications)',
    filterActive: 'सक्रिय / स्वीकृत (Active / Approved)',
    filterSuspended: 'निलम्बित (Suspended)',
    filterBlocked: 'ब्लक गरिएको (Blocked)',
    filterRestricted: 'प्रतिबन्धित (Restricted)',

    // Student Table headers
    thStudent: 'विद्यार्थी',
    thId: 'विद्यार्थी ID',
    thClassSemester: 'कक्षा / सेमेस्टर',
    thRoll: 'रोल नम्बर',
    thPhone: 'फोन नम्बर',
    thStatus: 'स्थिति (Status)',
    thRegisteredDate: 'दर्ता / आवेदन मिति',
    thActions: 'कार्य (Actions)',

    // Student Statuses
    statusPending: 'स्वीकृति पर्खिरहेको (Pending)',
    statusApproved: 'स्वीकृत (Approved)',
    statusActive: 'सक्रिय (Active)',
    statusSuspended: 'निलम्बित',
    statusBlocked: 'ब्लक',
    statusRestricted: 'प्रतिबन्धित',
    statusRejected: 'अस्वीकृत (Rejected)',

    // Student Actions
    btnApprove: 'स्वीकृत गर्नुहोस् (Approve)',
    btnReject: 'अस्वीकृत गर्नुहोस् (Reject)',
    btnEdit: 'विवरण सम्पादन',
    btnActivate: 'सक्रिय बनाउनुहोस्',
    btnSuspend: 'निलम्बन गर्नुहोस्',
    btnBlock: 'ब्लक गर्नुहोस्',
    btnDelete: 'मेटाउनुहोस्',

    // Pending Section
    pendingReviewTitle: 'स्वीकृति पर्खिरहेका नयाँ आवेदनहरू (Pending Applications Review)',
    pendingReviewSubtitle: 'प्रशासकले स्वीकृत (Approve) गरेपछि मात्र विद्यार्थीले क्विज खेल्न पाउनेछन्।',

    // Edit Modal
    editStudentTitle: 'विद्यार्थी विवरण सम्पादन गर्नुहोस्',
    editStudentSubtitle: 'विद्यार्थीको नाम, रोल, कक्षा, फोन, पासकोड र खाता स्थिति अपडेट गर्नुहोस्',
    fieldFullName: 'पूरा नाम *',
    fieldRoll: 'रोल नम्बर *',
    fieldClass: 'कक्षा *',
    fieldSemester: 'सेमेस्टर / वर्ष *',
    fieldPhone: 'फोन नम्बर (१० अंक) *',
    fieldPasscode: '४ अंकको पासकोड (PIN)',
    fieldStatus: 'खाता स्थिति (Account Status)',
    btnCancel: 'रद्द गर्नुहोस्',
    btnSaveStudent: 'परिवर्तन सुरक्षित गर्नुहोस् (Save Changes)',
    savingStudent: 'सेभ हुँदैछ...',
    editSuccess: 'विद्यार्थीको विवरण सफलतापूर्वक अपडेट गरियो र ब्याकइन्डमा सुरक्षित भयो!',

    // Delete Modal
    deleteTitle: 'विद्यार्थी मेटाउने पुष्टि',
    deleteWarning: 'के तपाईं यस विद्यार्थीको खाता प्रणालीबाट पूर्ण रूपमा मेटाउन निश्चित हुनुहुन्छ? यो कार्य फिर्ता गर्न सकिँदैन।',
    btnConfirmDelete: 'हो, स्थायी मेटाउनुहोस्',

    noStudentsFound: 'कुनै विद्यार्थी फेला परेन।',
  },

  en: {
    // Top bar & general
    portalTitle: 'Quiz Master Portal',
    officialSystem: 'Official Campus Quiz System',
    timezone: 'Asia/Kathmandu',
    openStudentPortal: 'Student Portal',
    logout: 'Logout',
    switchLanguage: 'नेपाली मा बदल्नुहोस्',
    currentLanguageLabel: 'English',

    // Global sync actions
    refreshDatabase: 'Refresh Database',
    refreshing: 'Refreshing...',
    refreshedSuccess: 'Database successfully refreshed from Realtime Database & Cloud!',
    saveDraft: 'Save Draft',
    savingDraft: 'Saving Draft...',
    draftSavedSuccess: 'Changes saved locally as Draft!',
    publishGlobalLive: 'Publish Global Live',
    publishingLive: 'Publishing Live...',
    publishedLiveSuccess: 'All changes published globally live to Realtime Database & Cloud!',
    statusGlobalLive: 'Realtime Database Live Synced',
    statusDraftChanges: 'Unpublished Draft Changes',

    // Sidebar items
    navDashboard: 'Dashboard',
    navQuizzes: 'Weekly Quizzes',
    navStudents: 'Student Management',
    navQuestions: 'Question Bank (50 Questions)',
    navSubmissions: 'Submissions & Graded Answers',
    navWinners: 'Results & Winners',
    navReports: 'Download Excel Reports',
    navSettings: 'Settings & Firebase',

    // Admin Login
    loginTitle: 'Quiz Master Login',
    loginSubtitle: 'Darchula Multiple Campus Weekly Quiz Administration',
    emailLabel: 'Admin Email',
    passwordLabel: 'Password',
    loginButton: 'Login via Firebase',
    loggingIn: 'Authenticating...',
    loginWithGoogle: 'Admin Login via Google',
    emergencyMasterLogin: 'Emergency Master PIN Login?',
    emergencyTitle: 'Offline / Emergency Master Login',
    emergencyDesc: 'Use campus emergency credentials if network or Firebase console is unreachable.',
    backToLogin: '← Back to Firebase Login',
    backToStudentPortal: '← Return to Student Portal',
    masterUsername: 'Admin Username / Email',
    masterPin: 'Master Passcode / PIN',
    submitMaster: 'Login with Master PIN',

    // Students Management
    studentsTitle: 'Student Management',
    studentsSubtitle: 'List of registered campus students, account status control, and verification',
    totalStudents: 'Total Students',
    searchPlaceholder: 'Search by name, roll no, class, or student ID...',
    filterAll: 'All Status',
    filterPending: 'Pending Applications',
    filterActive: 'Active / Approved',
    filterSuspended: 'Suspended',
    filterBlocked: 'Blocked',
    filterRestricted: 'Restricted',

    // Student Table headers
    thStudent: 'Student',
    thId: 'Student ID',
    thClassSemester: 'Class / Semester',
    thRoll: 'Roll No',
    thPhone: 'Phone Number',
    thStatus: 'Status',
    thRegisteredDate: 'Registered / Applied Date',
    thActions: 'Actions',

    // Student Statuses
    statusPending: 'Pending Approval',
    statusApproved: 'Approved',
    statusActive: 'Active',
    statusSuspended: 'Suspended',
    statusBlocked: 'Blocked',
    statusRestricted: 'Restricted',
    statusRejected: 'Rejected',

    // Student Actions
    btnApprove: 'Approve Application',
    btnReject: 'Reject',
    btnEdit: 'Edit Details',
    btnActivate: 'Set Active',
    btnSuspend: 'Suspend',
    btnBlock: 'Block',
    btnDelete: 'Delete',

    // Pending Section
    pendingReviewTitle: 'Pending Student Applications Review',
    pendingReviewSubtitle: 'Applications awaiting admin approval. Only approved students can participate in quizzes.',

    // Edit Modal
    editStudentTitle: 'Edit Student Details',
    editStudentSubtitle: 'Update name, roll number, class, phone, passcode, and account status',
    fieldFullName: 'Full Name *',
    fieldRoll: 'Roll Number *',
    fieldClass: 'Class *',
    fieldSemester: 'Semester / Year *',
    fieldPhone: 'Phone Number (10 digits) *',
    fieldPasscode: '4-digit Passcode (PIN)',
    fieldStatus: 'Account Status',
    btnCancel: 'Cancel',
    btnSaveStudent: 'Save Changes to Backend',
    savingStudent: 'Saving...',
    editSuccess: 'Student details successfully updated and persisted to backend!',

    // Delete Modal
    deleteTitle: 'Confirm Student Deletion',
    deleteWarning: 'Are you sure you want to permanently delete this student account? This action cannot be undone.',
    btnConfirmDelete: 'Yes, Delete Permanently',

    noStudentsFound: 'No students found matching the criteria.',
  }
};
