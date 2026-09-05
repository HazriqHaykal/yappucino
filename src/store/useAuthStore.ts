import { create } from "zustand";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  pictureUrl?: string;
}

interface AuthStore {
  user: AuthUser | null;
  accessToken: string | null;
  isSigningIn: boolean;
  error: string | null;
  setSigningIn: (value: boolean) => void;
  setSession: (user: AuthUser, accessToken: string) => void;
  setError: (message: string | null) => void;
  signOut: () => void;
}

// In-memory only, same as GoogleCalendarSync's existing token — no
// localStorage/refresh handling yet. Signing out or reloading clears it.
export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  accessToken: null,
  isSigningIn: false,
  error: null,

  setSigningIn: (value) => set({ isSigningIn: value }),
  setSession: (user, accessToken) =>
    set({ user, accessToken, isSigningIn: false, error: null }),
  setError: (message) => set({ error: message, isSigningIn: false }),
  signOut: () => set({ user: null, accessToken: null, error: null }),
}));
