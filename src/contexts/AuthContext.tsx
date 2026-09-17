'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export type User = { id: string; email?: string; user_metadata: { full_name?: string; [key: string]: unknown }; app_metadata?: { role?: string; is_admin?: boolean; [key: string]: unknown }; created_at: string }
export type Session = { access_token: string; user: User }
interface AuthContextType { session: Session | null; user: User | null; isInitializing: boolean; isAdmin: boolean; signOut: () => Promise<void>; sendMagicLink: (email: string) => Promise<{ error: string | null }>; signInWithGoogle: () => Promise<void>; signInAsAdmin: (email: string, password: string) => Promise<{ error: string | null }>; signIn: (email: string, password?: string) => Promise<{ error: string | null }>; signUp: (email: string, method?: string, name?: string, password?: string) => Promise<{ error: string | null; needsConfirmation?: boolean }>; resetPassword: (email: string) => Promise<{ error: string | null }>; updatePassword: (password: string) => Promise<{ error: string | null }> }
const AuthContext = createContext<AuthContextType>({ session: null, user: null, isInitializing: true, isAdmin: false, signOut: async () => {}, sendMagicLink: async () => ({ error: null }), signInWithGoogle: async () => {}, signInAsAdmin: async () => ({ error: null }), signIn: async () => ({ error: null }), signUp: async () => ({ error: null }), resetPassword: async () => ({ error: null }), updatePassword: async () => ({ error: null }) })
const safeError = (error: { message?: string; status?: number } | null) => error ? (error.status === 429 ? 'Too many attempts. Please try again later.' : /invalid login|invalid credentials|already registered/i.test(error.message ?? '') ? 'Invalid email or password.' : error.message ?? 'Something went wrong.') : null

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClient(); const [session, setSession] = useState<Session | null>(null); const [isInitializing, setInitializing] = useState(true)
  const user = session?.user ?? null
  const isAdmin = user?.app_metadata?.role === 'admin' || user?.app_metadata?.is_admin === true
  useEffect(() => { let active = true; supabase.auth.getSession().then(({ data }) => { if (active) { setSession(data.session as Session | null); setInitializing(false) } }); const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next as Session | null)); return () => { active = false; data.subscription.unsubscribe() } }, [supabase])
  const signIn = async (email: string, password = '') => { const { data, error } = await supabase.auth.signInWithPassword({ email, password }); if (data.session) setSession(data.session as Session); return { error: safeError(error) } }
  const signUp = async (email: string, _method?: string, name?: string, password = '') => { const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name }, emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ?? `${window.location.origin}/auth/callback` } }); if (data.session) setSession(data.session as Session); return { error: safeError(error), needsConfirmation: !data.session && !!data.user } }
  const sendMagicLink = async (email: string) => { const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ?? `${window.location.origin}/auth/callback` } }); return { error: safeError(error) } }
  const resetPassword = async (email: string) => { const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/auth/callback` }); return { error: safeError(error) } }
  const updatePassword = async (password: string) => { const { error } = await supabase.auth.updateUser({ password }); return { error: safeError(error) } }
  const signOut = async () => { await supabase.auth.signOut(); setSession(null) }
  const signInWithGoogle = async () => { await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ?? `${window.location.origin}/auth/callback` } }) }
  const signInAsAdmin = async (email: string, password: string) => signIn(email, password)
  return <AuthContext.Provider value={{ session, user, isInitializing, isAdmin, signOut, sendMagicLink, signInWithGoogle, signInAsAdmin, signIn, signUp, resetPassword, updatePassword }}>{children}</AuthContext.Provider>
}
export const useAuth = () => useContext(AuthContext)
