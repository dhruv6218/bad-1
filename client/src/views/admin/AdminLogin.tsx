'use client';

import React, { useState } from 'react';
import Link from '@/lib/navigation';
import { useRouter } from '@/lib/navigation';
import { Loader2, AlertCircle, ShieldCheck, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export const AdminLogin: React.FC = () => {
  const { signInAsAdmin } = useAuth();
  const router = useRouter();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both admin email and password.');
      return;
    }
    setIsLoading(true);
    setError(null);
    const { error: err } = await signInAsAdmin(email, password);
    setIsLoading(false);
    if (err) {
      setError(err);
      return;
    }
    router.push('/godview/dashboard');
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('Admin access is provisioned by the Astrix owner. Use Admin Sign In after your email is added to the secure admin allowlist.');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 relative">
      <div className="bg-noise"></div>
      <div className="w-full max-w-md animate-[fadeIn_0.4s_ease-out] relative z-10">
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 bg-white border border-gray-200 rounded-2xl flex items-center justify-center mb-3 shadow-sm">
            <ShieldCheck className="w-8 h-8 text-brand-blue" />
          </div>
          <h1 className="font-heading text-2xl font-bold text-gray-900">Admin Portal</h1>
          <p className="text-gray-500 text-sm mt-1">Restricted management access</p>
        </div>

        {/* Mode Toggle */}
        <div className="flex bg-gray-200/70 p-1 rounded-2xl mb-6">
          <button
            type="button"
            onClick={() => { setMode('signin'); setError(null); setSent(false); }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
              mode === 'signin'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Admin Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode('signup'); setError(null); setSent(false); }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
              mode === 'signup'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Register New Admin
          </button>
        </div>

        <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-xl">
          {sent ? (
            <div className="text-center py-4">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-200">
                <CheckCircle className="w-7 h-7 text-green-600" />
              </div>
              <h2 className="font-heading text-xl font-bold text-gray-900 mb-2">Admin Magic Link Sent!</h2>
              <p className="text-gray-500 text-xs font-medium mb-6 leading-relaxed">
                We sent a magic link to <strong className="text-gray-900">{email}</strong>.<br />
                Click the magic link in your inbox to authenticate your new admin account.
              </p>
              <button
                onClick={() => router.push('/godview/dashboard')}
                className="w-full bg-gray-900 text-white font-bold py-3.5 px-4 rounded-xl hover:bg-brand-blue transition-colors text-sm shadow-md"
              >
                Access Admin Dashboard →
              </button>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2 text-sm text-red-600 font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {mode === 'signin' ? (
                <form className="space-y-4" onSubmit={handleSignIn}>
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-1.5" htmlFor="admin-email">
                      Admin Email
                    </label>
                    <input
                      type="email"
                      id="admin-email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl p-3.5 outline-none focus:ring-2 focus:ring-brand-blue placeholder-gray-400"
                      placeholder="admin@astrix.ai"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-1.5" htmlFor="admin-password">
                      Password
                    </label>
                    <input
                      type="password"
                      id="admin-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl p-3.5 outline-none focus:ring-2 focus:ring-brand-blue placeholder-gray-400"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gray-900 text-white font-bold py-3.5 rounded-xl hover:bg-brand-blue disabled:opacity-50 transition-colors flex items-center justify-center gap-2 mt-2 shadow-md"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" /> Authenticating...
                      </>
                    ) : (
                      'Access Admin Panel'
                    )}
                  </button>
                </form>
              ) : (
                <form className="space-y-4" onSubmit={handleSignUp}>
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-1.5" htmlFor="admin-name">
                      Full Name
                    </label>
                    <input
                      type="text"
                      id="admin-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl p-3.5 outline-none focus:ring-2 focus:ring-brand-blue placeholder-gray-400"
                      placeholder="Admin User"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-1.5" htmlFor="admin-email-signup">
                      Admin Email
                    </label>
                    <input
                      type="email"
                      id="admin-email-signup"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl p-3.5 outline-none focus:ring-2 focus:ring-brand-blue placeholder-gray-400"
                      placeholder="admin@astrix.ai"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-1.5" htmlFor="admin-password-signup">
                      Password
                    </label>
                    <input
                      type="password"
                      id="admin-password-signup"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl p-3.5 outline-none focus:ring-2 focus:ring-brand-blue placeholder-gray-400"
                      placeholder="••••••••"
                      required
                    />
                  </div>

                  <div className="flex items-start pt-2">
                    <div className="flex items-center h-5">
                      <input
                        id="admin-terms"
                        type="checkbox"
                        checked={agreedTerms}
                        onChange={(e) => setAgreedTerms(e.target.checked)}
                        className="w-4 h-4 border border-gray-300 rounded bg-gray-50 focus:ring-2 focus:ring-brand-blue accent-brand-blue cursor-pointer transition-all"
                        required
                      />
                    </div>
                    <label htmlFor="admin-terms" className="ml-2 text-xs font-medium text-gray-500">
                      I agree to the <Link href="/terms" className="text-brand-blue hover:underline font-bold">Terms</Link> and <Link href="/privacy" className="text-brand-blue hover:underline font-bold">Privacy Policy</Link>.
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gray-900 text-white font-bold py-3.5 rounded-xl hover:bg-brand-blue disabled:opacity-50 transition-colors flex items-center justify-center gap-2 mt-4 shadow-md"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" /> Registering...
                      </>
                    ) : (
                      'Register Admin Account'
                    )}
                  </button>
                </form>
              )}
            </>
          )}

          <div className="mt-8 pt-6 border-t border-gray-100">
            <p className="text-center text-xs text-gray-400 font-medium">
              Demo Credentials: <code className="text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded font-mono">admin@astrix.ai</code> / <code className="text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded font-mono">admin123</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
