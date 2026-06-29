'use client';

import { useEffect, useState, useCallback } from 'react';
import { tr } from '@/lib/strings';
import { createClient } from '@/lib/supabase/client';
import type { Client } from '@/lib/types/database';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Search,
  User,
  Target,
  ChevronRight,
  Trash2,
  X,
} from 'lucide-react';

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  const fetchClients = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('clients')
      .select('*')
      .eq('dietitian_id', user.id)
      .order('updated_at', { ascending: false });

    setClients(data ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const filteredClients = clients.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">{tr.clients.title}</h1>
          <p className="page-subtitle">
            {clients.length} {tr.clients.clientCount}
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setShowAddModal(true)}
          id="add-client-btn"
        >
          <Plus size={16} />
          {tr.clients.addClient}
        </button>
      </div>

      {/* Search */}
      <div className="search-input-wrapper" style={{ marginBottom: 'var(--space-6)' }}>
        <Search className="search-icon" />
        <input
          type="text"
          className="form-input"
          placeholder={tr.clients.searchPlaceholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          id="client-search"
        />
        {search && (
          <button className="search-clear" onClick={() => setSearch('')}>
            <X size={16} />
          </button>
        )}
      </div>

      {/* Client list */}
      {loading ? (
        <div className="content-grid content-grid-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card">
              <div className="card-body">
                <div className="skeleton skeleton-heading" />
                <div className="skeleton skeleton-text" style={{ width: '80%' }} />
                <div className="skeleton skeleton-text" style={{ width: '60%' }} />
              </div>
            </div>
          ))}
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="empty-state">
          <User className="empty-state-icon" />
          <h3 className="empty-state-title">
            {search ? tr.common.noResults : tr.clients.title}
          </h3>
          <p className="empty-state-desc">
            {search
              ? `"${search}" için sonuç bulunamadı`
              : 'Henüz danışan eklenmemiş. İlk danışanınızı ekleyin.'}
          </p>
          {!search && (
            <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
              <Plus size={16} />
              {tr.clients.addClient}
            </button>
          )}
        </div>
      ) : (
        <div className="content-grid content-grid-2">
          {filteredClients.map((client) => (
            <Link
              key={client.id}
              href={`/clients/${client.id}`}
              className="card card-interactive"
              style={{ textDecoration: 'none' }}
            >
              <div className="card-body">
                <div className="flex items-center gap-3" style={{ marginBottom: 'var(--space-3)' }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 'var(--radius-full)',
                      backgroundColor: 'var(--color-primary-100)',
                      color: 'var(--color-primary-600)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      fontWeight: 'var(--font-semibold)',
                      fontSize: 'var(--text-sm)',
                    }}
                  >
                    {client.name
                      .split(' ')
                      .map((w) => w[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: 'var(--font-semibold)',
                        color: 'var(--text-primary)',
                      }}
                    >
                      {client.name}
                    </div>
                    {client.goal && (
                      <div
                        className="flex items-center gap-1"
                        style={{
                          fontSize: 'var(--text-xs)',
                          color: 'var(--text-secondary)',
                          marginTop: 2,
                        }}
                      >
                        <Target size={12} />
                        <span className="truncate">{client.goal}</span>
                      </div>
                    )}
                  </div>
                  <ChevronRight size={16} style={{ color: 'var(--text-tertiary)' }} />
                </div>

                <div className="flex gap-3" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                  {client.weight_kg && <span>{client.weight_kg} kg</span>}
                  {client.height_cm && <span>{client.height_cm} cm</span>}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Add Client Modal */}
      {showAddModal && (
        <AddClientModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            fetchClients();
          }}
        />
      )}
    </div>
  );
}

function AddClientModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [name, setName] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [goal, setGoal] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError(tr.common.required);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error: insertError } = await supabase.from('clients').insert({
        dietitian_id: user.id,
        name: name.trim(),
        birthdate: birthdate || null,
        height_cm: height ? parseFloat(height) : null,
        weight_kg: weight ? parseFloat(weight) : null,
        goal: goal || null,
        notes: notes || null,
      });

      if (insertError) throw insertError;
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : tr.common.error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal modal-md" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{tr.clients.addClient}</h2>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body flex flex-col gap-4">
            {error && (
              <div
                style={{
                  padding: 'var(--space-3)',
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
              <label className="form-label" htmlFor="client-name">
                {tr.clients.name} *
              </label>
              <input
                id="client-name"
                type="text"
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="form-row form-row-3">
              <div className="form-group">
                <label className="form-label" htmlFor="client-birthdate">
                  {tr.clients.birthdate}
                </label>
                <input
                  id="client-birthdate"
                  type="date"
                  className="form-input"
                  value={birthdate}
                  onChange={(e) => setBirthdate(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="client-height">
                  {tr.clients.height}
                </label>
                <input
                  id="client-height"
                  type="number"
                  className="form-input"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  step="0.1"
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="client-weight">
                  {tr.clients.weight}
                </label>
                <input
                  id="client-weight"
                  type="number"
                  className="form-input"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  step="0.1"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="client-goal">
                {tr.clients.goal}
              </label>
              <input
                id="client-goal"
                type="text"
                className="form-input"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder={tr.clients.goalPlaceholder}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="client-notes">
                {tr.clients.notes}
              </label>
              <textarea
                id="client-notes"
                className="form-textarea"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={tr.clients.notesPlaceholder}
                rows={3}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              {tr.common.cancel}
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner spinner-sm" />
                  {tr.common.loading}
                </>
              ) : (
                <>
                  <Plus size={16} />
                  {tr.common.save}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
