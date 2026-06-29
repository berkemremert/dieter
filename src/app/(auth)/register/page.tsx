'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { createDietitianProfile } from '@/lib/actions/auth';
import { tr } from '@/lib/strings';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Leaf } from 'lucide-react';

export default function RegisterPage() {
  const [displayName, setDisplayName] = useState('');
  const [clinicName, setClinicName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError(tr.auth.passwordMismatch);
      return;
    }

    if (password.length < 8) {
      setError(tr.auth.passwordTooShort);
      return;
    }

    setLoading(true);

    try {
      // 1. Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName,
            clinic_name: clinicName || null,
          },
        },
      });

      if (authError) {
        console.error('Auth error:', authError);
        setError(authError.message);
        return;
      }

      if (!authData.user) {
        setError(tr.auth.registerError);
        return;
      }

      // 2. Profile is created via Server Action bypassing RLS timing issues
      const profileResult = await createDietitianProfile(authData.user.id, displayName, clinicName || null);
      if (!profileResult.success) {
        console.error('Profile creation error:', profileResult.error);
      }

      // Force a hard navigation to avoid Next.js client router race conditions with newly set cookies
      window.location.href = '/';
    } catch (err: any) {
      console.error('Registration caught error:', err);
      setError(err?.message || tr.common.error);
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
            <label className="form-label" htmlFor="register-name">
              {tr.auth.displayName}
            </label>
            <input
              id="register-name"
              type="text"
              className="form-input"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Dr. Ayşe Yılmaz"
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="register-clinic">
              {tr.auth.clinicName}{' '}
              <span className="form-label-optional">({tr.common.optional})</span>
            </label>
            <input
              id="register-clinic"
              type="text"
              className="form-input"
              value={clinicName}
              onChange={(e) => setClinicName(e.target.value)}
              placeholder="Sağlıklı Yaşam Kliniği"
            />
            <span className="form-hint">{tr.auth.clinicNameHint}</span>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="register-email">
              {tr.auth.email}
            </label>
            <input
              id="register-email"
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ornek@klinik.com"
              required
              autoComplete="email"
            />
          </div>

          <div className="form-row form-row-2">
            <div className="form-group">
              <label className="form-label" htmlFor="register-password">
                {tr.auth.password}
              </label>
              <input
                id="register-password"
                type="password"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="new-password"
                minLength={8}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="register-confirm-password">
                {tr.auth.confirmPassword}
              </label>
              <input
                id="register-confirm-password"
                type="password"
                className="form-input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="new-password"
                minLength={8}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg w-full"
            disabled={loading}
            id="register-submit"
          >
            {loading ? (
              <>
                <span className="spinner spinner-sm" />
                {tr.common.loading}
              </>
            ) : (
              tr.auth.register
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p className="auth-footer-text">
            {tr.auth.hasAccount}{' '}
            <Link href="/login" className="auth-footer-link">
              {tr.auth.loginNow}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
