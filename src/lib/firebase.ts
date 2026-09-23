import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

export interface FirebaseClientConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  databaseURL?: string;
}

// Retrieve from Vite environment or localStorage override
function getActiveFirebaseConfig(): FirebaseClientConfig | null {
  const env = import.meta.env;
  if (env.VITE_FIREBASE_API_KEY && env.VITE_FIREBASE_PROJECT_ID) {
    return {
      apiKey: env.VITE_FIREBASE_API_KEY,
      authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || `${env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
      projectId: env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || `${env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
      messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
      appId: env.VITE_FIREBASE_APP_ID || '',
      databaseURL: env.VITE_FIREBASE_DATABASE_URL
    };
  }

  // Check if admin manually saved config in localStorage
  try {
    const custom = localStorage.getItem('fsudmc_firebase_config');
    if (custom) {
      const parsed = JSON.parse(custom);
      if (parsed.apiKey && parsed.projectId) {
        return parsed;
      }
    }
  } catch {
    // Ignore JSON errors
  }

  return null;
}

let firebaseApp: FirebaseApp | null = null;
let firebaseAuth: Auth | null = null;
let firestoreDb: Firestore | null = null;
let firebaseStorage: FirebaseStorage | null = null;

export const config = getActiveFirebaseConfig();
export const isConfigured = Boolean(config && config.apiKey && !config.apiKey.includes('AIzaSy...'));

if (isConfigured && config) {
  try {
    firebaseApp = getApps().length === 0 ? initializeApp(config) : getApps()[0];
    firebaseAuth = getAuth(firebaseApp);
    firestoreDb = getFirestore(firebaseApp);
    firebaseStorage = getStorage(firebaseApp);
  } catch (err) {
    console.warn('Firebase initialization notice:', err);
  }
}

export { firebaseApp, firebaseAuth, firestoreDb, firebaseStorage };

export function saveManualFirebaseConfig(newConfig: FirebaseClientConfig) {
  localStorage.setItem('fsudmc_firebase_config', JSON.stringify(newConfig));
  window.location.reload();
}

export function clearManualFirebaseConfig() {
  localStorage.removeItem('fsudmc_firebase_config');
  window.location.reload();
}
