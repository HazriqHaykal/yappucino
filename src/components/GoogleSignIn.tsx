import { GoogleOAuthProvider, useGoogleLogin } from "@react-oauth/google";
import { useAuthStore } from "../store/useAuthStore";

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

// Identity (email/profile) and Calendar read access requested together in
// one consent screen — "sign in" and "connect calendar" used to be two
// separate OAuth flows; this merges them per the original design.
const SIGN_IN_SCOPE =
  "openid email profile https://www.googleapis.com/auth/calendar.readonly";

interface GoogleUserInfo {
  sub: string;
  name: string;
  email: string;
  picture?: string;
}

function GoogleSignInButton() {
  const user = useAuthStore((state) => state.user);
  const isSigningIn = useAuthStore((state) => state.isSigningIn);
  const error = useAuthStore((state) => state.error);
  const setSigningIn = useAuthStore((state) => state.setSigningIn);
  const setSession = useAuthStore((state) => state.setSession);
  const setError = useAuthStore((state) => state.setError);
  const signOut = useAuthStore((state) => state.signOut);

  const login = useGoogleLogin({
    scope: SIGN_IN_SCOPE,
    onSuccess: async (tokenResponse) => {
      setSigningIn(true);
      try {
        const response = await fetch(
          "https://www.googleapis.com/oauth2/v3/userinfo",
          { headers: { Authorization: `Bearer ${tokenResponse.access_token}` } },
        );
        if (!response.ok) {
          throw new Error(`userinfo request failed: ${response.status}`);
        }
        const info: GoogleUserInfo = await response.json();
        setSession(
          {
            id: info.sub,
            name: info.name,
            email: info.email,
            pictureUrl: info.picture,
          },
          tokenResponse.access_token,
        );
      } catch (err) {
        console.error("[GoogleSignIn] couldn't load profile:", err);
        setError("Signed in, but couldn't load your profile. Please try again.");
      }
    },
    onError: () => {
      setError("Google sign-in failed or was cancelled. Please try again.");
    },
  });

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
          onClick={signOut}
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
        onClick={() => login()}
        disabled={isSigningIn}
        className="focus-ring rounded-full bg-clay px-4 py-2 font-display text-sm font-semibold text-white transition-colors hover:bg-clay-dark disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSigningIn ? "Signing in…" : "Sign in with Google"}
      </button>
      {error && <p className="mt-2 text-sm text-clay-dark">{error}</p>}
    </div>
  );
}

export default function GoogleSignIn() {
  if (!CLIENT_ID) {
    return (
      <div className="rounded-2xl border border-line bg-paper-card p-4 text-sm text-ink-faint shadow-flat">
        Google sign-in needs VITE_GOOGLE_CLIENT_ID set in .env (see
        .env.example) to show the sign-in button.
      </div>
    );
  }

  return (
    <GoogleOAuthProvider clientId={CLIENT_ID}>
      <GoogleSignInButton />
    </GoogleOAuthProvider>
  );
}
