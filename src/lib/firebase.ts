import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  setPersistence,
  indexedDBLocalPersistence,
  browserLocalPersistence,
  type Auth,
  type User,
} from "firebase/auth";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  getFirestore,
  enableNetwork,
  disableNetwork,
  type Firestore
} from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import { getDatabase, type Database } from "firebase/database";

// Web app's Firebase configuration provided by user
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyA_RY3OVMWE1bBIUXs61wKUsPFeWjViR7o",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "quize-c3025.firebaseapp.com",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://quize-c3025-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "quize-c3025",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "quize-c3025.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "62815879515",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:62815879515:web:8de7b15748cf6ff22a9a7e",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-XHX6RBHH12",
};

// Initialize Firebase App
export const app: FirebaseApp =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize Firestore with robust local persistent cache & multi-tab support
let firestoreInstance: Firestore;
try {
  firestoreInstance = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager(),
    }),
    ignoreUndefinedProperties: true,
  });
} catch {
  // Fallback to getFirestore if already initialized or in unsupported environment
  firestoreInstance = getFirestore(app);
}

export const firestoreDb: Firestore = firestoreInstance;

// Clean network connection helpers for Firestore
export async function reconnectFirestore(): Promise<void> {
  try {
    await enableNetwork(firestoreDb);
  } catch (err) {
    console.debug('Firestore enableNetwork notice:', err);
  }
}

export async function pauseFirestoreNetwork(): Promise<void> {
  try {
    await disableNetwork(firestoreDb);
  } catch (err) {
    console.debug('Firestore disableNetwork notice:', err);
  }
}

// Automatically reconnect when browser comes online
if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    reconnectFirestore().catch(() => {});
  });
}

// Initialize other Firebase services
export const auth: Auth = getAuth(app);
export const realtimeDb: Database = getDatabase(app);
export const firebaseStorage: FirebaseStorage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

// Configure modern IndexedDB / local storage persistence so auth does not rely on third-party cookies
if (typeof window !== "undefined") {
  setPersistence(auth, indexedDBLocalPersistence).catch(() => {
    setPersistence(auth, browserLocalPersistence).catch(() => {});
  });
}

export const analytics = null;

export const isConfigured = true;
export const config = firebaseConfig;

// Export Firebase Auth helpers specifically for Admin authentication
export async function loginAdminWithFirebase(email: string, pass: string): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    const cred = await signInWithEmailAndPassword(auth, email.trim(), pass);
    return { success: true, user: cred.user };
  } catch (err: unknown) {
    const fbError = err as { code?: string; message?: string };
    let errorMsg = "Firebase लगइन असफल भयो।";
    if (fbError.code === "auth/invalid-credential" || fbError.code === "auth/wrong-password") {
      errorMsg = "इमेल वा पासवर्ड मिलेन। कृपया जाँच गर्नुहोस्।";
    } else if (fbError.code === "auth/user-not-found") {
      errorMsg = "यो इमेल Firebase मा दर्ता गरिएको छैन।";
    } else if (fbError.code === "auth/invalid-email") {
      errorMsg = "अमान्य इमेल ठेगाना प्रविष्ट गरियो।";
    } else if (fbError.code === "auth/too-many-requests") {
      errorMsg = "धेरै पटक प्रयास गरिएको छ। केही समयपछि पुन: प्रयास गर्नुहोस्।";
    } else if (fbError.code === "auth/network-request-failed") {
      errorMsg = "इन्टरनेट वा नेटवर्क जडानमा समस्या आयो।";
    } else if (fbError.code === "auth/operation-not-allowed") {
      errorMsg = "Firebase Console मा Email/Password लगइन विधि सुरु (Enable) गरिएको छैन।";
    } else if (fbError.message) {
      errorMsg = fbError.message;
    }
    return { success: false, error: errorMsg };
  }
}

export async function createAdminWithFirebase(email: string, pass: string): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
    return { success: true, user: cred.user };
  } catch (err: unknown) {
    const fbError = err as { code?: string; message?: string };
    let errorMsg = "खाता सिर्जना असफल भयो।";
    if (fbError.code === "auth/email-already-in-use") {
      errorMsg = "यो इमेल पहिले नै दर्ता भइसकेको छ। कृपया सिधै लगइन गर्नुहोस्।";
    } else if (fbError.code === "auth/weak-password") {
      errorMsg = "पासवर्ड कम्तिमा ६ अक्षर वा अंकको हुनुपर्छ।";
    } else if (fbError.code === "auth/invalid-email") {
      errorMsg = "अमान्य इमेल ठेगाना।";
    } else if (fbError.code === "auth/operation-not-allowed") {
      errorMsg = "Firebase Console मा Email/Password प्रदायक अन गर्नुहोस्।";
    } else if (fbError.message) {
      errorMsg = fbError.message;
    }
    return { success: false, error: errorMsg };
  }
}

export async function loginAdminWithGoogle(): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    const cred = await signInWithPopup(auth, googleProvider);
    return { success: true, user: cred.user };
  } catch (err: unknown) {
    const fbError = err as { code?: string; message?: string };
    let errorMsg = "Google लगइन असफल भयो।";
    if (fbError.code === "auth/popup-closed-by-user") {
      errorMsg = "Google प्रमाणीकरण विन्डो बन्द गरियो।";
    } else if (fbError.code === "auth/cancelled-popup-request") {
      errorMsg = "पप-अप अनुरोध रद्द गरियो।";
    } else if (fbError.code === "auth/popup-blocked") {
      errorMsg = "ब्राउजरले पप-अप रोक्यो, कृपया पप-अप खुला गर्नुहोस्।";
    } else if (fbError.message) {
      errorMsg = fbError.message;
    }
    return { success: false, error: errorMsg };
  }
}

export async function logoutAdminFromFirebase(): Promise<void> {
  try {
    await signOut(auth);
  } catch (err) {
    console.error("Firebase logout error:", err);
  }
}

// =================== STUDENT FIREBASE AUTHENTICATION ===================
// Isolated secondary Auth instance to prevent student registration/login from evicting active admin sessions
const studentAuthApp: FirebaseApp =
  getApps().find(a => a.name === "StudentAuth") ||
  initializeApp(firebaseConfig, "StudentAuth");

export const studentAuth: Auth = getAuth(studentAuthApp);

if (typeof window !== "undefined") {
  setPersistence(studentAuth, indexedDBLocalPersistence).catch(() => {
    setPersistence(studentAuth, browserLocalPersistence).catch(() => {});
  });
}

/**
 * Standardize student login identifier into Firebase Auth compatible email format
 */
export function formatStudentAuthEmail(studentId: string): string {
  const clean = studentId.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  return `student_${clean}@student.fsudmc.edu.np`;
}

/**
 * Hash/expand 4-digit PIN into a secure >=6 character Firebase Auth password
 */
export function formatStudentAuthPassword(passcode: string, rollNo: string): string {
  const cleanRoll = rollNo.trim().replace(/[^a-zA-Z0-9]/g, "") || "std";
  return `Fsu#${passcode}*${cleanRoll}`;
}

/**
 * Register student account in Firebase Authentication
 */
export async function createStudentWithFirebase(
  studentId: string,
  rollNo: string,
  passcode: string
): Promise<{ success: boolean; user?: User; error?: string; technicalError?: string }> {
  const email = formatStudentAuthEmail(studentId);
  const password = formatStudentAuthPassword(passcode, rollNo);

  try {
    const cred = await createUserWithEmailAndPassword(studentAuth, email, password);
    
    // Check if an admin is currently logged into the primary auth instance
    const isPrimaryAdminLoggedIn = Boolean(
      auth.currentUser &&
      (auth.currentUser.email === "admin@fsudmc.com" || auth.currentUser.email?.includes("admin"))
    );

    // If no admin is active on primary auth, sign the student into primary auth as well
    // so that Firestore security rules receive request.auth.uid
    if (!isPrimaryAdminLoggedIn) {
      try {
        await signInWithEmailAndPassword(auth, email, password);
      } catch (primaryErr) {
        console.warn("Notice: Primary auth sync optional:", primaryErr);
      }
    }

    return { success: true, user: cred.user };
  } catch (err: unknown) {
    const fbError = err as { code?: string; message?: string };
    const code = fbError.code || "unknown";
    const msg = fbError.message || "Failed to create Firebase Auth user";
    console.error(`Firebase Auth createStudent error [${code}]:`, msg);

    let errorMsg = "Firebase खाता सिर्जना असफल भयो।";
    if (code === "auth/email-already-in-use") {
      // Account exists in Auth, try sign in with same credentials
      try {
        const signinCred = await signInWithEmailAndPassword(studentAuth, email, password);
        const isPrimaryAdminLoggedIn = Boolean(
          auth.currentUser &&
          (auth.currentUser.email === "admin@fsudmc.com" || auth.currentUser.email?.includes("admin"))
        );
        if (!isPrimaryAdminLoggedIn) {
          try {
            await signInWithEmailAndPassword(auth, email, password);
          } catch {}
        }
        return { success: true, user: signinCred.user };
      } catch (signInErr) {
        console.warn("Student account already exists in Auth but signin failed:", signInErr);
        errorMsg = "यो विद्यार्थी ID पहिले नै दर्ता भइसकेको छ। कृपया सिधै लगइन गर्नुहोस्।";
      }
    } else if (code === "auth/weak-password") {
      errorMsg = "पासवर्ड कम्तिमा ६ अक्षरको हुनुपर्छ।";
    } else if (code === "auth/network-request-failed") {
      errorMsg = "इन्टरनेट वा नेटवर्क जडानमा समस्या आयो।";
    } else if (code === "auth/operation-not-allowed") {
      errorMsg = "Firebase Console मा Email/Password लगइन विधि सुरु गरिएको छैन।";
    } else if (msg) {
      errorMsg = msg;
    }

    return {
      success: false,
      error: errorMsg,
      technicalError: `${code}: ${msg}`
    };
  }
}

/**
 * Log in student using Firebase Authentication
 */
export async function loginStudentWithFirebase(
  studentId: string,
  rollNo: string,
  passcode: string
): Promise<{ success: boolean; user?: User; error?: string; technicalError?: string }> {
  const email = formatStudentAuthEmail(studentId);
  const password = formatStudentAuthPassword(passcode, rollNo);

  try {
    const cred = await signInWithEmailAndPassword(studentAuth, email, password);

    // If no admin is active on primary auth, also sign in primary auth
    // so that Firestore security rules receive request.auth.uid
    const isPrimaryAdminLoggedIn = Boolean(
      auth.currentUser &&
      (auth.currentUser.email === "admin@fsudmc.com" || auth.currentUser.email?.includes("admin"))
    );

    if (!isPrimaryAdminLoggedIn) {
      try {
        await signInWithEmailAndPassword(auth, email, password);
      } catch (primaryErr) {
        console.warn("Notice: Primary auth sync optional:", primaryErr);
      }
    }

    return { success: true, user: cred.user };
  } catch (err: unknown) {
    const fbError = err as { code?: string; message?: string };
    const code = fbError.code || "unknown";
    const msg = fbError.message || "Firebase Auth sign-in failed";
    console.error(`Firebase Auth loginStudent error [${code}]:`, msg);

    let errorMsg = "Firebase लगइन असफल भयो।";
    if (code === "auth/invalid-credential" || code === "auth/wrong-password") {
      errorMsg = "प्रविष्ट गरिएको ४-अंकको पासकोड (PIN) मिलेन।";
    } else if (code === "auth/user-not-found") {
      errorMsg = "यो विद्यार्थी ID Firebase मा दर्ता गरिएको छैन।";
    } else if (code === "auth/too-many-requests") {
      errorMsg = "धेरै पटक गलत प्रयास गरिएको छ। केही समयपछि पुन: प्रयास गर्नुहोस्।";
    } else if (code === "auth/network-request-failed") {
      errorMsg = "इन्टरनेट वा सर्भर जडानमा समस्या आयो। कृपया इन्टरनेट जाँच्नुहोस्।";
    } else if (msg) {
      errorMsg = msg;
    }

    return {
      success: false,
      error: errorMsg,
      technicalError: `${code}: ${msg}`
    };
  }
}

export function saveManualFirebaseConfig(_newConfig: typeof firebaseConfig) {
  // Config is permanently embedded in project
  window.location.reload();
}

export function clearManualFirebaseConfig() {
  window.location.reload();
}

export {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
};
export type { User };
