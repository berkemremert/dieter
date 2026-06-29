'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { tr } from '@/lib/strings';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Leaf } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(tr.auth.loginError);
        return;
      }

      router.push('/');
      router.refresh();
    } catch {
      setError(tr.common.error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo-icon">
            <Leaf size={24} />
          </div>
          <div className="auth-logo">
            Dieter<span style={{ color: 'var(--color-primary-400)' }}>.</span>
          </div>
          <p className="auth-subtitle">{tr.common.appDescription}</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {error && (
            <div
              style={{
                padding: 'var(--space-3) var(--space-4)',
                backgroundColor: 'var(--color-danger-50)',
                color: 'var(--color-danger-700)',
                borderRadius: 'var(--radius-md)',
                fontSize: 'var(--text-sm)',
              }}
            >
              {error}
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="login-email">
              {tr.auth.email}
            </label>
            <input
              id="login-email"
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ornek@klinik.com"
              required
              autoComplete="email"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="login-password">
              {tr.auth.password}
            </label>
            <input
              id="login-password"
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
              minLength={8}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg w-full"
            disabled={loading}
            id="login-submit"
          >
            {loading ? (
              <>
                <span className="spinner spinner-sm" />
                {tr.common.loading}
              </>
            ) : (
              tr.auth.login
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p className="auth-footer-text">
            {tr.auth.noAccount}{' '}
            <Link href="/register" className="auth-footer-link">
              {tr.auth.registerNow}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
