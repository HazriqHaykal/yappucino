import { GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut } from "firebase/auth";
import { auth, googleProvider, isFirebaseConfigured } from "../services/firebase";
import { useAuthStore } from "../store/useAuthStore";

export default function GoogleSignIn() {
  const user = useAuthStore((state) => state.user);
  const isSigningIn = useAuthStore((state) => state.isSigningIn);
  const error = useAuthStore((state) => state.error);
  const setSigningIn = useAuthStore((state) => state.setSigningIn);
  const setSession = useAuthStore((state) => state.setSession);
  const setError = useAuthStore((state) => state.setError);
  const signOut = useAuthStore((state) => state.signOut);

  if (!isFirebaseConfigured || !auth) {
    return (
      <div className="rounded-2xl border border-line bg-paper-card p-4 text-sm text-ink-faint shadow-flat">
        Google sign-in needs the VITE_FIREBASE_* keys set in .env (see
        .env.example) to show the sign-in button.
      </div>
    );
  }

  const handleSignIn = async () => {
    if (!auth) return;
    setSigningIn(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      // Calendar read scope was requested alongside sign-in (see
      // services/firebase.ts) — this credential carries the OAuth access
      // token for it, separate from the Firebase Auth session itself.
      const credential = GoogleAuthProvider.credentialFromResult(result);
      setSession(
        {
          id: result.user.uid,
          name: result.user.displayName ?? "there",
          email: result.user.email ?? "",
          pictureUrl: result.user.photoURL ?? undefined,
        },
        credential?.accessToken ?? null,
      );
    } catch (err) {
      console.error("[GoogleSignIn] sign-in failed:", err);
      setError("Google sign-in failed or was cancelled. Please try again.");
    }
  };

  const handleSignOut = async () => {
    if (auth) await firebaseSignOut(auth);
    signOut();
  };

  if (user) {
    return (
      <div className="flex items-center gap-2 rounded-full border border-line bg-paper-card py-1 pl-1 pr-3 shadow-flat">
        {user.pictureUrl ? (
          <img
            src={user.pictureUrl}
            alt=""
            referrerPolicy="no-referrer"
            className="h-7 w-7 rounded-full"
          />
        ) : (
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-clay-light font-display text-xs font-bold text-clay-dark">
            {user.name.charAt(0).toUpperCase()}
          </span>
        )}
        <span className="font-display text-sm font-semibold text-ink">
          {user.name.split(" ")[0]}
        </span>
        <button
          type="button"
          onClick={handleSignOut}
          className="focus-ring text-xs font-semibold text-ink-faint hover:text-clay-dark"
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleSignIn}
        disabled={isSigningIn}
        className="focus-ring rounded-full bg-clay px-4 py-2 font-display text-sm font-semibold text-white transition-colors hover:bg-clay-dark disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSigningIn ? "Signing in…" : "Sign in with Google"}
      </button>
      {error && <p className="mt-2 text-sm text-clay-dark">{error}</p>}
    </div>
  );
}
