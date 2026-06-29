'use client';

import { useState, useEffect } from 'react';
import { tr } from '@/lib/strings';
import { createClient } from '@/lib/supabase/client';
import { Save } from 'lucide-react';

export default function SettingsPage() {
  const [displayName, setDisplayName] = useState('');
  const [clinicName, setClinicName] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function fetchProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('dietitians')
        .select('*')
        .eq('id', user.id)
        .single();

      if (data) {
        setDisplayName(data.display_name || '');
        setClinicName(data.clinic_name || '');
      }
    }
    fetchProfile();
  }, [supabase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error: updateError } = await supabase
        .from('dietitians')
        .update({
          display_name: displayName.trim(),
          clinic_name: clinicName.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (updateError) throw updateError;
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : tr.common.error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">{tr.settings.title}</h1>
      </div>

      <div className="card" style={{ maxWidth: 560 }}>
        <div className="card-header">
          <h2 className="card-title">{tr.settings.profile}</h2>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="card-body flex flex-col gap-4">
            {error && (
              <div style={{ padding: 'var(--space-3)', backgroundColor: 'var(--color-danger-50)', color: 'var(--color-danger-700)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)' }}>
                {error}
              </div>
            )}
            {success && (
              <div style={{ padding: 'var(--space-3)', backgroundColor: 'var(--color-success-50)', color: 'var(--color-success-700)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)' }}>
                {tr.settings.saved}
              </div>
            )}

            <div className="form-group">
              <label className="form-label" htmlFor="settings-name">{tr.settings.displayName}</label>
              <input
                id="settings-name"
                type="text"
                className="form-input"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="settings-clinic">
                {tr.settings.clinicName}{' '}
                <span className="form-label-optional">({tr.common.optional})</span>
              </label>
              <input
                id="settings-clinic"
                type="text"
                className="form-input"
                value={clinicName}
                onChange={(e) => setClinicName(e.target.value)}
              />
            </div>
          </div>

          <div className="card-footer flex justify-end">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? (
                <><span className="spinner spinner-sm" /> {tr.common.loading}</>
              ) : (
                <><Save size={16} /> {tr.common.save}</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
