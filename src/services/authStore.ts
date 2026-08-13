import { create } from 'zustand';
import { onAuthChanged, signInWithGoogle, signInWithEmail, signUpWithEmail, signOut, type User } from './authService';
import { setSupabaseAuthUid } from './supabaseClient';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isInitialized: boolean;
  setUser: (user: User | null) => void;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  init: () => () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  isInitialized: false,

  setUser: (user) => {
    setSupabaseAuthUid(user?.uid ?? null);
    set({ user, isInitialized: true });
  },

  signInWithEmail: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      await signInWithEmail(email, password);
    } finally {
      set({ isLoading: false });
    }
  },

  signUpWithEmail: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      await signUpWithEmail(email, password);
    } finally {
      set({ isLoading: false });
    }
  },

  signInWithGoogle: async () => {
    set({ isLoading: true });
    try {
      await signInWithGoogle();
    } finally {
      set({ isLoading: false });
    }
  },

  signOut: async () => {
    set({ isLoading: true });
    try {
      await signOut();
      setSupabaseAuthUid(null);
      set({ user: null });
    } finally {
      set({ isLoading: false });
    }
  },

  init: () => {
    const unsubscribe = onAuthChanged((user) => {
      setSupabaseAuthUid(user?.uid ?? null);
      set({ user, isInitialized: true });
    });
    return unsubscribe;
  },
}));
