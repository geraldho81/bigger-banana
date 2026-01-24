'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = useMemo(
    () =>
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      ),
    [],
  );

  const [ready, setReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;

    const init = async () => {
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      setHasSession(!!data.session);
      setReady(true);
    };

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setHasSession(!!session);
      setReady(true);
    });

    void init();

    return () => {
      active = false;
      subscription?.subscription.unsubscribe();
    };
  }, [supabase]);

  const handleUpdatePassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (!password || !confirmPassword) {
      setError('Please enter and confirm your new password.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSaving(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        setError(updateError.message);
        return;
      }

      setMessage('Password updated. Redirecting to sign in...');
      await supabase.auth.signOut();
      setTimeout(() => {
        router.replace('/login');
      }, 800);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="auth-cinema-bg relative min-h-screen overflow-hidden">
      <div className="auth-grain" />
      <div className="auth-orb auth-orb-left" />
      <div className="auth-orb auth-orb-right" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center px-6 py-12">
        <div className="auth-panel">
          <h1 className="font-display text-2xl text-text-primary">Reset password</h1>
          <p className="mt-2 text-sm text-text-secondary">
            Choose a new password to continue your studio session.
          </p>

          {!ready ? (
            <div className="mt-6 h-12 w-full shimmer-loading rounded-xl" />
          ) : !hasSession ? (
            <div className="mt-6 space-y-4 text-sm text-text-secondary">
              <p>This reset link is invalid or expired.</p>
              <button
                type="button"
                className="btn-secondary w-full"
                onClick={() => router.replace('/login')}
              >
                Back to sign in
              </button>
            </div>
          ) : (
            <form onSubmit={handleUpdatePassword} className="mt-6 space-y-4">
              {error && (
                <div className="rounded-lg border border-red-500/30 bg-red-900/20 px-4 py-3 text-sm text-red-300">
                  {error}
                </div>
              )}
              {message && (
                <div className="rounded-lg border border-accent-gold/30 bg-accent-gold/10 px-4 py-3 text-sm text-text-secondary">
                  {message}
                </div>
              )}
              <div>
                <label className="label-gold" htmlFor="password">
                  New password
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  className="input-base mt-2"
                  placeholder="••••••••"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </div>
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
              <button type="submit" className="btn-primary w-full" disabled={saving}>
                {saving ? 'Updating...' : 'Update password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
