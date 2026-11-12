import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { getFunctions, type Functions } from 'firebase/functions';
import rawConfig from '../../firebase-applet-config.json';

// Determine authoritative project ID: prioritize meenabtydatasub
const envProjectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
const rawProjectId = rawConfig.projectId;
const targetProjectId =
  (envProjectId === 'sayyada-datasub' || !envProjectId)
    ? (rawProjectId || 'meenabtydatasub')
    : envProjectId;

// Construct authoritative Firebase configuration from env vars with json config fallback
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || rawConfig.apiKey || 'AIzaSyDummyKeyForSayyadaDataSub7812',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || rawConfig.authDomain || 'meenabtydatasub.firebaseapp.com',
  projectId: targetProjectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || rawConfig.storageBucket || 'meenabtydatasub.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || rawConfig.messagingSenderId || '1029384756',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || rawConfig.appId || '1:1029384756:web:abcdef123456',
  firestoreDatabaseId: rawConfig.firestoreDatabaseId || '(default)',
};

// ---------------------------------------------------------------------
// SAFETY BOOT CHECK — CANARY AGAINST LEGACY PROJECT CONTAMINATION
// Refuse to boot if connected to old thunder-star project or any other
// unapproved project ID.
// ---------------------------------------------------------------------
const activeProjectId = firebaseConfig.projectId;

if (!activeProjectId || activeProjectId === 'thunder-star-digital-academy' || activeProjectId.includes('thunder-star')) {
  throw new Error(
    `[SECURITY FATAL] Refusing to initialize Firebase: Forbidden legacy project detected ("${activeProjectId}"). All operations to "thunder-star-digital-academy" have been permanently halted. Please configure project "meenabtydatasub".`
  );
}

const APPROVED_PROJECTS = ['meenabtydatasub', 'sayyada-datasub'];
if (!APPROVED_PROJECTS.includes(activeProjectId)) {
  throw new Error(
    `[SECURITY FATAL] Refusing to initialize Firebase: Unauthorized project ID "${activeProjectId}". Expected authoritative project "meenabtydatasub".`
  );
}

// Initialize single Firebase instance
const app: FirebaseApp = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

export const auth: Auth = getAuth(app);
export const db: Firestore =
  firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
    ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
    : getFirestore(app);
export const storage: FirebaseStorage = getStorage(app);
export const functions: Functions = getFunctions(app, 'us-central1');

// Enforce browser local session persistence across browser restarts and tab refreshes
setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.warn('[Firebase Auth] Persistence initialization notice:', err);
});

export { app };
export default app;
