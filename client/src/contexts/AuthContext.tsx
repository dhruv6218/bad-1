import React, { createContext, useContext, useEffect, useState } from "react";
import type { Session as SupabaseSession, User as SupabaseAuthUser } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

export interface User {
  id: string;
  email: string;
  user_metadata: {
    full_name?: string;
    [key: string]: unknown;
  };
  created_at: string;
}

export interface Session {
  access_token: string;
  user: User;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isInitializing: boolean;
  isAdmin: boolean;
  signOut: () => Promise<void>;
  sendMagicLink: (email: string) => Promise<{ error: string | null }>;
  signInWithGoogle: () => Promise<void>;
  signInAsAdmin: (email: string, password: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password?: string) => Promise<{ error: string | null }>;
  signUp: (email: string, method?: string, name?: string, password?: string) => Promise<{ error: string | null; needsConfirmation?: boolean }>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  updatePassword: (password: string) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  isInitializing: true,
  isAdmin: false,
  signOut: async () => undefined,
  sendMagicLink: async () => ({ error: null }),
  signInWithGoogle: async () => undefined,
  signInAsAdmin: async () => ({ error: null }),
  signIn: async () => ({ error: null }),
  signUp: async () => ({ error: null, needsConfirmation: false }),
  resetPassword: async () => ({ error: null }),
  updatePassword: async () => ({ error: null }),
});

function mapUser(user: SupabaseAuthUser | null): User | null {
  if (!user) return null;
  return {
    id: user.id,
    email: user.email ?? "",
    user_metadata: user.user_metadata ?? {},
    created_at: user.created_at,
  };
}

function mapSession(session: SupabaseSession | null): Session | null {
  const user = mapUser(session?.user ?? null);
  if (!session || !user) return null;
  return { access_token: session.access_token, user };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let mounted = true;
    const loadSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (mounted) {
        setSession(mapSession(data.session));
        setIsInitializing(false);
      }
    };
    void loadSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (mounted) setSession(mapSession(nextSession));
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    if (!session?.user.id) {
      setIsAdmin(false);
      return () => { mounted = false; };
    }
    void supabase.rpc("is_current_user_admin").then(({ data, error }) => {
      if (mounted) setIsAdmin(!error && data === true);
    });
    return () => { mounted = false; };
  }, [session?.user.id]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  const sendMagicLink = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { emailRedirectTo: `${window.location.origin}/app` },
    });
    return { error: error?.message ?? null };
  };

  const signIn = async (email: string, password?: string) => {
    if (!password) return sendMagicLink(email);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (!error) setSession(mapSession(data.session));
    return { error: error?.message ?? null };
  };

  const signUp = async (email: string, _method?: string, name?: string, password?: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password: password || crypto.randomUUID(),
      options: {
        data: { full_name: name?.trim() || normalizedEmail.split("@")[0] },
        emailRedirectTo: `${window.location.origin}/app`,
      },
    });
    if (!error) setSession(mapSession(data.session));
    return { error: error?.message ?? null, needsConfirmation: !data.session && !error };
  };

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/onboarding/step-1` },
    });
  };

  const signInAsAdmin = async (email: string, password: string) => signIn(email, password);

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { error: error?.message ?? null };
  };

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    return { error: error?.message ?? null };
  };

  const user = session?.user ?? null;
  return (
    <AuthContext.Provider value={{
      session,
      user,
      isInitializing,
      isAdmin,
      signOut,
      sendMagicLink,
      signInWithGoogle,
      signInAsAdmin,
      signIn,
      signUp,
      resetPassword,
      updatePassword,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
