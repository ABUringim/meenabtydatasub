import { initializeApp, getApps } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

export const firebaseConfig = {
  apiKey: "AIzaSyCcnTFs6iv2W-9-GlguKbejwcx17mYiE9A",
  authDomain: "meenabtydatasub.firebaseapp.com",
  projectId: "meenabtydatasub",
  storageBucket: "meenabtydatasub.firebasestorage.app",
  messagingSenderId: "633559064274",
  appId: "1:633559064274:web:5df916b4174e3264e9970b"
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Enforce browser local session persistence across browser restarts and tab refreshes
setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.warn('Firebase persistence warning:', err);
});

export default app;
