'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

const MODE_LABELS = {
  login: 'Sign in',
  signup: 'Create account',
  reset: 'Reset password',
} as const;

type Mode = keyof typeof MODE_LABELS | 'confirm';

export default function LoginPage() {
  const router = useRouter();
  const supabase = useMemo(
    () =>
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      ),
    [],
  );

  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (isMounted && data.session) {
        router.replace('/');
      }
    };

    void checkSession();

    return () => {
      isMounted = false;
    };
  }, [router, supabase]);

  const handlePasswordReset = async () => {
    setError(null);
    setMessage(null);

    if (!email) {
      setError('Email is required.');
      return;
    }

    setLoading(true);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (resetError) {
        setError(resetError.message);
        return;
      }

      setResetSent(true);
      setMessage('Password reset link sent. Check your email to continue.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (!email || !password) {
      setError('Email and password are required.');
      return;
    }

    if (mode === 'signup' && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      if (mode === 'signup') {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (signUpError) {
          setError(signUpError.message);
          return;
        }

        if (data.session) {
          router.replace('/');
          return;
        }

        setMessage(null);
        setMode('confirm');
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        return;
      }

      router.replace('/');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-cinema-bg relative min-h-screen overflow-hidden">
      <div className="auth-grain" />
      <div className="auth-orb auth-orb-left" />
      <div className="auth-orb auth-orb-right" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col items-stretch gap-10 px-6 py-12 lg:flex-row lg:items-center">
        <div className="w-full space-y-6 lg:w-1/2">
          <div className="space-y-4">
            <span className="label-gold text-lg">Bigger Banana</span>
            <h1 className="font-display text-4xl text-text-primary sm:text-5xl">
              A better workspace for
              <span className="block text-accent-gold">AI Creatives</span>
            </h1>
            <p className="max-w-md text-base text-text-secondary sm:text-lg">
              Create, save, and organize your generations, references, and presets
              across devices.
            </p>
          </div>
        </div>

        <div className="w-full lg:w-1/2">
          <div className="auth-panel">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-2xl text-text-primary">
                  {mode === 'confirm'
                    ? 'Confirm your email'
                    : mode === 'reset'
                      ? 'Reset your password'
                      : MODE_LABELS[mode]}
                </h2>
              </div>
              {mode !== 'confirm' && mode !== 'reset' && (
                <div className="inline-flex rounded-full border border-text-muted/20 bg-bg-tertiary/60 p-1">
                  {(['login', 'signup'] as Mode[]).map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => {
                        setMode(value);
                        setError(null);
                        setMessage(null);
                        setResetSent(false);
                      }}
                      className={`rounded-full px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] transition-all ${
                        mode === value
                          ? 'bg-accent-gold text-bg-primary'
                          : 'text-text-muted hover:text-text-primary'
                      }`}
                    >
                      {MODE_LABELS[value as keyof typeof MODE_LABELS]}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {error && (
              <div className="mt-6 rounded-lg border border-red-500/30 bg-red-900/20 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            {message && (
              <div className="mt-6 rounded-lg border border-accent-gold/30 bg-accent-gold/10 px-4 py-3 text-sm text-text-secondary">
                {message}
              </div>
            )}

            {mode === 'confirm' ? (
              <div className="mt-6 space-y-4 text-sm text-text-secondary">
                <p>
                  We sent a confirmation link to <span className="text-text-primary">{email}</span>.
                  Please verify your email to activate your account.
                </p>
                <p className="text-text-muted">
                  You can close this tab once you confirm. After confirming, come back and sign in.
                </p>
                <button
                  type="button"
                  className="btn-secondary w-full"
                  onClick={() => {
                    setMode('login');
                    setError(null);
                    setMessage(null);
                    setResetSent(false);
                  }}
                >
                  Back to sign in
                </button>
              </div>
            ) : mode === 'reset' ? (
              <div className="mt-6 space-y-4">
                <div>
                  <label className="label-gold" htmlFor="email">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    className="input-base mt-2"
                    placeholder="you@studio.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </div>

                <button
                  type="button"
                  className="btn-primary w-full"
                  onClick={handlePasswordReset}
                  disabled={loading}
                >
                  {loading ? 'Sending...' : resetSent ? 'Resend link' : 'Send reset link'}
                </button>

                <button
                  type="button"
                  className="btn-secondary w-full"
                  onClick={() => {
                    setMode('login');
                    setError(null);
                    setMessage(null);
                    setResetSent(false);
                  }}
                >
                  Back to sign in
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div>
                  <label className="label-gold" htmlFor="email">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    className="input-base mt-2"
                    placeholder="you@studio.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </div>

                <div>
                  <label className="label-gold" htmlFor="password">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                    className="input-base mt-2"
                    placeholder="••••••••"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                  {mode === 'login' && (
                    <button
                      type="button"
                      className="mt-2 text-xs text-text-muted underline-offset-4 hover:text-accent-gold"
                      onClick={() => {
                        setMode('reset');
                        setError(null);
                        setMessage(null);
                        setResetSent(false);
                      }}
                    >
                      Forgot password?
                    </button>
                  )}
                </div>

                {mode === 'signup' && (
                  <div>
                    <label className="label-gold" htmlFor="confirmPassword">
                      Confirm password
                    </label>
                    <input
                      id="confirmPassword"
                      type="password"
                      autoComplete="new-password"
                      className="input-base mt-2"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                    />
                  </div>
                )}

                <button
                  type="submit"
                  className="btn-primary w-full"
                  disabled={loading}
                >
                  {loading ? 'Working...' : MODE_LABELS[mode]}
                </button>
              </form>
            )}

            <div className="mt-6 text-xs text-text-muted">
              By continuing, you agree to the Bigger Banana studio guidelines.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
