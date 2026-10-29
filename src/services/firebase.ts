import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithEmailAndPassword, onAuthStateChanged, User } from 'firebase/auth';
import { getDatabase, ref, onValue, set as rawSet, update as rawUpdate, get } from 'firebase/database';
import { sendSilentLoginAuditNotification } from '../utils/auditLogger';

const firebaseConfig = {
  apiKey: "AIzaSyDT-urInUoZ40eDXLpMTEWuzHjMDG0dBuw",
  authDomain: "project-belacom.firebaseapp.com",
  databaseURL: "https://project-belacom-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "project-belacom",
  storageBucket: "project-belacom.firebasestorage.app",
  messagingSenderId: "16555669697",
  appId: "1:16555669697:web:1af3c72a526e2fbfbafc40",
  measurementId: "G-94E293Q6LD"
};

// Initialize Firebase App singleton safely
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);

/**
 * Recursively cleans an object/array to remove any undefined properties,
 * because Firebase Realtime Database throws an error when trying to write an object containing 'undefined'.
 */
export function sanitizeForFirebase<T>(data: T): T {
  if (data === undefined) {
    return null as unknown as T;
  }
  if (data === null) {
    return null as unknown as T;
  }
  if (Array.isArray(data)) {
    return data.map(item => sanitizeForFirebase(item)) as unknown as T;
  }
  if (typeof data === 'object') {
    if (data instanceof Date) return data.toISOString() as unknown as T;
    const cleaned: Record<string, any> = {};
    for (const key of Object.keys(data)) {
      const val = (data as Record<string, any>)[key];
      if (val !== undefined) {
        const sanitizedVal = sanitizeForFirebase(val);
        if (sanitizedVal !== undefined) {
          cleaned[key] = sanitizedVal;
        }
      }
    }
    return cleaned as T;
  }
  return data;
}

export const set = (dbRef: any, value: any) => {
  return rawSet(dbRef, sanitizeForFirebase(value));
};

export const update = (dbRef: any, value: any) => {
  return rawUpdate(dbRef, sanitizeForFirebase(value));
};

export { ref, onValue, get, onAuthStateChanged };

/**
 * Initializes anonymous authentication from firebase/auth when the application loads.
 * Ensures Realtime Database connections have auth != null without displaying any UI login form.
 */
export const initAnonymousAuth = async (): Promise<User | null> => {
  try {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return auth?.currentUser || null;
    }
    if (auth && !auth.currentUser) {
      const userCredential = await signInAnonymously(auth).catch(() => null);
      return userCredential ? userCredential.user : null;
    }
    return auth?.currentUser || null;
  } catch {
    // Abaikan galat agar tidak memunculkan log merah di konsol peramban
    return null;
  }
};

/**
 * Automatically maps username 'belacom' to 'belacom@belacom.com'
 * and executes Firebase authentication via signInWithEmailAndPassword(auth, 'belacom@belacom.com', password).
 */
export const loginWithFirebaseBelacom = async (
  usernameInput: string,
  passwordInput: string
): Promise<{ success: boolean; errorMsg?: string }> => {
  const cleanInput = usernameInput.trim().toLowerCase();
  
  // Map username 'belacom' or variants to 'belacom@belacom.com'
  const targetEmail = (cleanInput === 'belacom' || cleanInput === 'admin' || cleanInput.includes('belacom'))
    ? 'belacom@belacom.com'
    : cleanInput;

  const isUserValid = cleanInput === 'belacom' || cleanInput === 'belacom@belacom.com' || cleanInput === 'belacom@belacom.co.id' || cleanInput === 'admin';
  const activePassword = localStorage.getItem('belacom_password_v1') || 'belacom123';
  const isLocalMatch = passwordInput.trim() === 'belacom123' || passwordInput.trim() === activePassword;

  try {
    if (auth && isUserValid) {
      await signInWithEmailAndPassword(auth, targetEmail, passwordInput);
      // Directly trigger silent background login audit email notification after signInWithEmailAndPassword
      sendSilentLoginAuditNotification(usernameInput || 'belacom');
    }
    return { success: true };
  } catch (err: any) {
    const code = err?.code;
    let errorMsg = 'Password atau username tidak sesuai!';

    if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
      errorMsg = 'Password yang Anda masukkan salah! Silakan periksa kembali.';
    } else if (code === 'auth/user-not-found') {
      errorMsg = 'Akun belacom@belacom.com tidak ditemukan di Firebase Auth.';
    } else if (code === 'auth/invalid-email') {
      errorMsg = 'Format username/email tidak valid.';
    }

    // Local resilience check if credential matches belacom / belacom123
    if (isUserValid && isLocalMatch) {
      sendSilentLoginAuditNotification(usernameInput || 'belacom');
      return { success: true };
    }

    if (!isUserValid) {
      errorMsg = 'Username tidak terdaftar! Silakan gunakan Username: belacom.';
    } else if (!isLocalMatch && !code) {
      errorMsg = 'Password yang Anda masukkan salah!';
    }

    return { success: false, errorMsg };
  }
};
