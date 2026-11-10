import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';

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

export default app;
