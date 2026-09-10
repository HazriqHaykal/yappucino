import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth, googleProvider, isFirebaseConfigured } from "./firebase";
import { useAuthStore } from "../store/useAuthStore";

/**
 * The one place that actually runs the Google sign-in popup — both
 * GoogleSignIn (Room header) and GoogleCalendarSync (Tasks page banner)
 * trigger the same flow through here so there's a single source of truth
 * for the resulting session/access token, not two copies of the same
 * Firebase call. Returns whether sign-in succeeded; errors are already
 * pushed into useAuthStore for the caller's error UI to read.
 */
export async function signInWithGoogle(): Promise<boolean> {
  if (!isFirebaseConfigured || !auth) {
    useAuthStore
      .getState()
      .setError("Google sign-in needs the VITE_FIREBASE_* keys set in .env (see .env.example).");
    return false;
  }

  useAuthStore.getState().setSigningIn(true);
  try {
    const result = await signInWithPopup(auth, googleProvider);
    // Calendar read scope was requested alongside sign-in (see
    // services/firebase.ts) — this credential carries the OAuth access
    // token for it, separate from the Firebase Auth session itself.
    const credential = GoogleAuthProvider.credentialFromResult(result);
    useAuthStore.getState().setSession(
      {
        id: result.user.uid,
        name: result.user.displayName ?? "there",
        email: result.user.email ?? "",
        pictureUrl: result.user.photoURL ?? undefined,
      },
      credential?.accessToken ?? null,
    );
    return true;
  } catch (err) {
    console.error("[signInWithGoogle] sign-in failed:", err);
    useAuthStore.getState().setError("Google sign-in failed or was cancelled. Please try again.");
    return false;
  }
}
