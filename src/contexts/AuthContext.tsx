'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface User {
  id: string;
  email: string;
  user_metadata: {
    full_name?: string;
    [key: string]: any;
  };
  created_at: string;
}

export interface Session {
  access_token: string;
  user: User;
}

const MOCK_USER: User = {
  id: 'mock-user-123',
  email: 'alex@company.com',
  user_metadata: { full_name: 'Alex Rivera' },
  created_at: new Date().toISOString(),
};

const MOCK_SESSION: Session = {
  access_token: 'mock-access-token',
  user: MOCK_USER,
};

const USER_STORAGE_KEY = 'astrix_mock_user';
const ADMIN_STORAGE_KEY = 'astrix_admin_session';

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
  session: MOCK_SESSION,
  user: MOCK_USER,
  isInitializing: false,
  isAdmin: false,
  signOut: async () => {},
  sendMagicLink: async () => ({ error: null }),
  signInWithGoogle: async () => {},
  signInAsAdmin: async () => ({ error: null }),
  signIn: async () => ({ error: null }),
  signUp: async () => ({ error: null, needsConfirmation: false }),
  resetPassword: async () => ({ error: null }),
  updatePassword: async () => ({ error: null }),
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(MOCK_SESSION);
  const [user, setUser] = useState<User | null>(MOCK_USER);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem(USER_STORAGE_KEY);
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          setSession({ access_token: 'mock-access-token', user: parsedUser });
        } catch {
          // Keep default mock user
        }
      }

      const adminSession = localStorage.getItem(ADMIN_STORAGE_KEY);
      if (adminSession === 'true') {
        setIsAdmin(true);
      }
    }
    setIsInitializing(false);
  }, []);

  const saveUserSession = (newUser: User) => {
    setUser(newUser);
    setSession({ access_token: 'mock-access-token', user: newUser });
    if (typeof window !== 'undefined') {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(newUser));
    }
  };

  const sendMagicLink = async (email: string): Promise<{ error: string | null }> => {
    const updatedUser: User = {
      ...MOCK_USER,
      email,
      user_metadata: { full_name: user?.user_metadata?.full_name || email.split('@')[0] },
    };
    saveUserSession(updatedUser);
    return { error: null };
  };

  const signIn = async (email: string, _password?: string): Promise<{ error: string | null }> => {
    const updatedUser: User = {
      ...MOCK_USER,
      email,
      user_metadata: { full_name: user?.user_metadata?.full_name || email.split('@')[0] },
    };
    saveUserSession(updatedUser);
    return { error: null };
  };

  const signUp = async (email: string, _method?: string, name?: string, _password?: string): Promise<{ error: string | null; needsConfirmation?: boolean }> => {
    const updatedUser: User = {
      ...MOCK_USER,
      email,
      user_metadata: { full_name: name || email.split('@')[0] || 'Demo User' },
    };
    saveUserSession(updatedUser);
    return { error: null, needsConfirmation: true };
  };

  const resetPassword = async (_email: string): Promise<{ error: string | null }> => {
    return { error: null };
  };

  const updatePassword = async (_password: string): Promise<{ error: string | null }> => {
    return { error: null };
  };

  const signInWithGoogle = async () => {
    const googleUser: User = {
      ...MOCK_USER,
      email: 'alex.rivera.google@gmail.com',
      user_metadata: { full_name: 'Alex Rivera' },
    };
    saveUserSession(googleUser);
  };

  const signInAsAdmin = async (email: string, password: string): Promise<{ error: string | null }> => {
    if (!email || !password) {
      return { error: 'Please enter both admin email and password' };
    }
    setIsAdmin(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem(ADMIN_STORAGE_KEY, 'true');
    }
    return { error: null };
  };

  const signOut = async () => {
    setIsAdmin(false);
    setUser(null);
    setSession(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(ADMIN_STORAGE_KEY);
      localStorage.removeItem(USER_STORAGE_KEY);
    }
  };

  return (
    <AuthContext.Provider value={{
      session, user, isInitializing, isAdmin,
      signOut, sendMagicLink, signInWithGoogle, signInAsAdmin,
      signIn, signUp, resetPassword, updatePassword,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
