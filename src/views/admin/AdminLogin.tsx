'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, AlertCircle, ShieldCheck, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export const AdminLogin: React.FC = () => {
  const { signInAsAdmin, startAdminMfa, verifyAdminMfa } = useAuth();
  const router = useRouter();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [mfaStep, setMfaStep] = useState<'password' | 'phone' | 'code'>('password');
  const [factorId, setFactorId] = useState('');
  const [challengeId, setChallengeId] = useState('');
  const [mfaCode, setMfaCode] = useState('');

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
    const mfa = await startAdminMfa('+919034950792');
    if (mfa.error) { setError(mfa.error); return; }
    setFactorId(mfa.factorId ?? '');
    setChallengeId(mfa.challengeId ?? '');
    setMfaStep(mfa.needsEnrollment ? 'phone' : 'code');
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError('Please fill in all fields.');
      return;
    }
    if (!agreedTerms) {
      setError('Please agree to the Terms and Privacy Policy.');
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
    setSent(true);
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

              {mfaStep === 'password' ? (
                <form className="space-y-4" onSubmit={handleSignIn}>
                  <label className="block text-sm font-bold text-gray-900" htmlFor="admin-email">Admin Email</label>
                  <input type="email" id="admin-email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl p-3.5 outline-none focus:ring-2 focus:ring-brand-blue" placeholder="Admin email" required />
                  <label className="block text-sm font-bold text-gray-900" htmlFor="admin-password">Password</label>
                  <input type="password" id="admin-password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl p-3.5 outline-none focus:ring-2 focus:ring-brand-blue" placeholder="Password" required />
                  <button type="submit" disabled={isLoading} className="w-full bg-gray-900 text-white font-bold py-3.5 rounded-xl hover:bg-brand-blue disabled:opacity-50 flex items-center justify-center gap-2">{isLoading ? <><Loader2 className="w-5 h-5 animate-spin" /> Authenticating...</> : 'Continue to phone verification'}</button>
                </form>
              ) : (
                <form className="space-y-4" onSubmit={async (event) => { event.preventDefault(); setIsLoading(true); setError(null); const result = await verifyAdminMfa(factorId, challengeId, mfaCode); setIsLoading(false); if (result.error) { setError(result.error); return; } router.replace('/godview/dashboard'); }}>
                  <h2 className="text-lg font-bold text-gray-900">Phone verification required</h2>
                  <p className="text-sm text-gray-500">{mfaStep === 'phone' ? 'We sent an enrollment OTP to the admin phone number.' : 'Enter the OTP sent to the admin phone number.'}</p>
                  <input inputMode="numeric" autoComplete="one-time-code" value={mfaCode} onChange={(e) => setMfaCode(e.target.value.replace(/\\D/g, '').slice(0, 6))} className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-center tracking-[0.5em] text-xl rounded-xl p-3.5 outline-none focus:ring-2 focus:ring-brand-blue" placeholder="000000" maxLength={6} required />
                  <button type="submit" disabled={isLoading || mfaCode.length < 6} className="w-full bg-gray-900 text-white font-bold py-3.5 rounded-xl hover:bg-brand-blue disabled:opacity-50">{isLoading ? 'Verifying...' : 'Verify and enter admin panel'}</button>
                </form>
              )}
            </>
          )}

        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
