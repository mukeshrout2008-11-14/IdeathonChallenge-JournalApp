import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  OAuthProvider,
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut as fbSignOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { AppUser } from '../types';

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export const appleProvider = new OAuthProvider('apple.com');
appleProvider.addScope('email');
appleProvider.addScope('name');

// Initialize Firestore with specific database ID if provided in config
const dbId = (firebaseConfig as any).firestoreDatabaseId;
export const db: Firestore = dbId ? getFirestore(app, dbId) : getFirestore(app);

// Map Firebase User to App User
export function mapFirebaseUser(user: FirebaseUser | null): AppUser | null {
  if (!user) return null;
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName || user.email?.split('@')[0] || 'Journaler',
    photoURL: user.photoURL,
  };
}

// Sign in with Google (Popup with graceful fallback to Redirect)
export async function signInWithGoogle(): Promise<AppUser | null> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const mapped = mapFirebaseUser(result.user);
    if (!mapped) throw new Error('User data unavailable after authentication.');
    return mapped;
  } catch (error: any) {
    if (error?.code === 'auth/popup-closed-by-user' || error?.code === 'auth/cancelled-popup-request') {
      console.info('Google Sign-In popup closed by user.');
      const userClosedErr = new Error('Sign-in cancelled. Please click again to sign in.');
      (userClosedErr as any).code = error.code;
      throw userClosedErr;
    }

    if (error?.code === 'auth/popup-blocked') {
      console.warn('Popup blocked by browser. Attempting redirect sign-in fallback...');
      try {
        await signInWithRedirect(auth, googleProvider);
        return null;
      } catch (redirectErr: any) {
        console.warn('Redirect sign-in attempt:', redirectErr);
        const blockedErr = new Error(
          'Pop-up was blocked by your browser. Please allow pop-ups for this site or open in a new tab to sign in.'
        );
        (blockedErr as any).code = 'auth/popup-blocked';
        throw blockedErr;
      }
    }

    console.warn('Google Sign-In issue:', error?.message || error);
    throw error;
  }
}

// Sign in with Apple (iOS / Web Apple Sign-In)
export async function signInWithApple(): Promise<AppUser | null> {
  try {
    const result = await signInWithPopup(auth, appleProvider);
    const mapped = mapFirebaseUser(result.user);
    if (!mapped) throw new Error('User data unavailable after Apple authentication.');
    return mapped;
  } catch (error: any) {
    if (error?.code === 'auth/popup-closed-by-user' || error?.code === 'auth/cancelled-popup-request') {
      console.info('Apple Sign-In popup closed by user.');
      const userClosedErr = new Error('Apple Sign-in cancelled.');
      (userClosedErr as any).code = error.code;
      throw userClosedErr;
    }

    if (error?.code === 'auth/popup-blocked') {
      try {
        await signInWithRedirect(auth, appleProvider);
        return null;
      } catch {
        const blockedErr = new Error('Pop-up was blocked. Please enable pop-ups to complete Apple Sign-in.');
        (blockedErr as any).code = 'auth/popup-blocked';
        throw blockedErr;
      }
    }

    if (error?.code === 'auth/operation-not-allowed') {
      const err = new Error('Apple Sign-In is not yet enabled in the Firebase Console. Please enable Apple in Firebase Authentication providers.');
      (err as any).code = error.code;
      throw err;
    }

    console.warn('Apple Sign-In issue:', error?.message || error);
    throw error;
  }
}

// Sign in with Email & Password
export async function signInWithEmail(email: string, password: string): Promise<AppUser | null> {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
    const mapped = mapFirebaseUser(userCredential.user);
    if (!mapped) throw new Error('User data unavailable after authentication.');
    return mapped;
  } catch (error: any) {
    let message = 'Failed to sign in. Please verify your credentials.';
    if (error?.code === 'auth/user-not-found' || error?.code === 'auth/wrong-password' || error?.code === 'auth/invalid-credential') {
      message = 'Invalid email or password. If you do not have an account, please sign up.';
    } else if (error?.code === 'auth/invalid-email') {
      message = 'Please enter a valid email address.';
    } else if (error?.code === 'auth/user-disabled') {
      message = 'This user account has been disabled.';
    } else if (error?.code === 'auth/too-many-requests') {
      message = 'Too many failed login attempts. Please wait a moment and try again.';
    } else if (error?.code === 'auth/operation-not-allowed') {
      message = 'Email & Password authentication is not enabled in the Firebase Console. Please enable Email/Password provider.';
    }
    const customErr = new Error(message);
    (customErr as any).code = error?.code;
    throw customErr;
  }
}

// Sign up with Email & Password
export async function signUpWithEmail(email: string, password: string, displayName?: string): Promise<AppUser | null> {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
    if (displayName && displayName.trim()) {
      try {
        await updateProfile(userCredential.user, {
          displayName: displayName.trim(),
        });
      } catch (profileErr) {
        console.warn('Could not set displayName on new user:', profileErr);
      }
    }
    const mapped = mapFirebaseUser(userCredential.user);
    if (!mapped) throw new Error('User data unavailable after registration.');
    return mapped;
  } catch (error: any) {
    let message = 'Failed to create account.';
    if (error?.code === 'auth/email-already-in-use') {
      message = 'An account with this email already exists. Please sign in instead.';
    } else if (error?.code === 'auth/weak-password') {
      message = 'Password is too weak. Please use at least 6 characters.';
    } else if (error?.code === 'auth/invalid-email') {
      message = 'Please enter a valid email address.';
    } else if (error?.code === 'auth/operation-not-allowed') {
      message = 'Email/Password sign-up is not enabled in Firebase Console. Please enable Email/Password in Firebase Auth settings.';
    }
    const customErr = new Error(message);
    (customErr as any).code = error?.code;
    throw customErr;
  }
}

// Check for redirect sign-in result on page load
export async function checkRedirectAuthResult(): Promise<AppUser | null> {
  try {
    const result = await getRedirectResult(auth);
    if (result && result.user) {
      return mapFirebaseUser(result.user);
    }
    return null;
  } catch (error: any) {
    if (error?.code !== 'auth/popup-closed-by-user' && error?.code !== 'auth/cancelled-popup-request') {
      console.warn('Redirect sign-in check notice:', error?.message || error);
    }
    return null;
  }
}

// Direct Sign in with Redirect
export async function signInWithGoogleRedirect(): Promise<void> {
  await signInWithRedirect(auth, googleProvider);
}

// Sign Out
export async function signOutUser(): Promise<void> {
  await fbSignOut(auth);
}

// Auth State Listener Helper
export function subscribeToAuth(callback: (user: AppUser | null) => void): () => void {
  // Check redirect result first
  checkRedirectAuthResult().then((user) => {
    if (user) {
      callback(user);
    }
  }).catch(() => {});

  return onAuthStateChanged(auth, (user) => {
    callback(mapFirebaseUser(user));
  });
}


