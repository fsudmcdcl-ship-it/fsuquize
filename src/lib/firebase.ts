import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAnalytics, isSupported, type Analytics } from "firebase/analytics";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  type Auth,
  type User,
} from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

// Web app's Firebase configuration provided by user
export const firebaseConfig = {
  apiKey: "AIzaSyA_RY3OVMWE1bBIUXs61wKUsPFeWjViR7o",
  authDomain: "quize-c3025.firebaseapp.com",
  projectId: "quize-c3025",
  storageBucket: "quize-c3025.firebasestorage.app",
  messagingSenderId: "62815879515",
  appId: "1:62815879515:web:8de7b15748cf6ff22a9a7e",
  measurementId: "G-XHX6RBHH12",
};

// Initialize Firebase
export const app: FirebaseApp =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize Services
export const auth: Auth = getAuth(app);
export const firestoreDb: Firestore = getFirestore(app);
export const firebaseStorage: FirebaseStorage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

export let analytics: Analytics | null = null;
if (typeof window !== "undefined") {
  isSupported()
    .then((supported) => {
      if (supported) {
        analytics = getAnalytics(app);
      }
    })
    .catch(() => {
      // Ignore analytics unsupported environment (e.g. headless/ssr)
    });
}

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
