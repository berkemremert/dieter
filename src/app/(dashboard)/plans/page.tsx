'use client';

import { useEffect, useState, useCallback } from 'react';
import { tr } from '@/lib/strings';
import { createClient } from '@/lib/supabase/client';
import type { DietPlan } from '@/lib/types/database';
import Link from 'next/link';
import { Plus, ClipboardList, BookTemplate, Calendar, Trash2 } from 'lucide-react';

export default function PlansPage() {
  const [plans, setPlans] = useState<DietPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'client' | 'template'>('all');
  const supabase = createClient();

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    let q = supabase
      .from('diet_plans')
      .select('*')
      .eq('dietitian_id', user.id)
      .order('updated_at', { ascending: false });

    const { data } = await q;
    setPlans(data ?? []);
    setLoading(false);
  }, [supabase]);

  const displayedPlans = plans.filter(p => {
    if (filter === 'client') return !p.is_template;
    if (filter === 'template') return p.is_template;
    return true;
  });

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const [showNewPlanModal, setShowNewPlanModal] = useState(false);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">{tr.plans.title}</h1>
          <p className="page-subtitle">{displayedPlans.length} plan</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowNewPlanModal(true)} id="new-plan-btn">
          <Plus size={16} />
          {tr.plans.newPlan}
        </button>
      </div>

      {/* Filter tabs */}
      <div className="tabs">
        <button className={`tab ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>
          {tr.plans.allPlans}
        </button>
        <button className={`tab ${filter === 'client' ? 'active' : ''}`} onClick={() => setFilter('client')}>
          {tr.plans.clientPlans}
        </button>
        <button className={`tab ${filter === 'template' ? 'active' : ''}`} onClick={() => setFilter('template')}>
          {tr.templates.title}
        </button>
      </div>

      {loading ? (
        <div className="content-grid content-grid-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card">
              <div className="card-body">
                <div className="skeleton skeleton-heading" />
                <div className="skeleton skeleton-text" style={{ width: '70%' }} />
              </div>
            </div>
          ))}
        </div>
      ) : displayedPlans.length === 0 ? (
        <div className="empty-state">
          <ClipboardList className="empty-state-icon" />
          <h3 className="empty-state-title">{tr.plans.title}</h3>
          <p className="empty-state-desc">Henüz plan oluşturulmamış.</p>
          <button className="btn btn-primary" onClick={() => setShowNewPlanModal(true)}>
            <Plus size={16} />
            {tr.plans.newPlan}
          </button>
        </div>
      ) : (
        <div className="content-grid content-grid-2">
          {displayedPlans.map((plan) => (
            <Link
              key={plan.id}
              href={`/plans/${plan.id}`}
              className="card card-interactive"
              style={{ textDecoration: 'none' }}
            >
              <div className="card-body">
                <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-2)' }}>
                  <div style={{ fontWeight: 'var(--font-semibold)', color: 'var(--text-primary)' }}>
                    {plan.title}
                  </div>
                  <span className={`badge ${plan.is_template ? 'badge-accent' : 'badge-primary'}`}>
                    {plan.is_template ? (
                      <><BookTemplate size={10} /> Şablon</>
                    ) : (
                      <><ClipboardList size={10} /> Plan</>
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-2" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                  <Calendar size={12} />
                  {new Date(plan.updated_at).toLocaleDateString('tr-TR')}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* New Plan Modal */}
      {showNewPlanModal && (
        <NewPlanModal
          templates={plans.filter(p => p.is_template)}
          onClose={() => setShowNewPlanModal(false)}
          onSuccess={() => {
            setShowNewPlanModal(false);
            fetchPlans();
          }}
        />
      )}
    </div>
  );
}

function NewPlanModal({ onClose, onSuccess, templates }: { onClose: () => void; onSuccess: () => void; templates: DietPlan[] }) {
  const [title, setTitle] = useState('');
  const [isTemplate, setIsTemplate] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [clients, setClients] = useState<{id: string, name: string}[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();
  const router = (typeof window !== 'undefined') ? require('next/navigation').useRouter() : null;

  useEffect(() => {
    supabase.from('clients')
      .select('id, name')
      .order('name')
      .then(({ data }) => setClients(data || []));
  }, [supabase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError(tr.common.required); return; }

    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error: insertError } = await supabase
        .from('diet_plans')
        .insert({
          dietitian_id: user.id,
          client_id: selectedClientId || null,
          title: title.trim(),
          is_template: isTemplate,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Copy from template if selected
      if (!isTemplate && selectedTemplateId && data) {
        const { data: tDays } = await supabase.from('plan_days').select('*').eq('plan_id', selectedTemplateId).order('day_number');
        if (tDays && tDays.length > 0) {
          const tDayIds = tDays.map(d => d.id);
          const { data: tSlots } = await supabase.from('meal_slots').select('*').in('day_id', tDayIds);
          const tSlotIds = tSlots?.map(s => s.id) || [];
          const { data: tItems } = tSlotIds.length > 0 ? await supabase.from('meal_items').select('*').in('slot_id', tSlotIds) : { data: [] };

          for (const day of tDays) {
            const { data: newDay } = await supabase.from('plan_days').insert({
              plan_id: data.id, day_number: day.day_number, label: day.label, notes: day.notes
            }).select().single();
            if (!newDay) continue;

            const daySlots = tSlots?.filter(s => s.day_id === day.id) || [];
            for (const slot of daySlots) {
              const { data: newSlot } = await supabase.from('meal_slots').insert({
                day_id: newDay.id, slot_type: slot.slot_type, label: slot.label, time_of_day: slot.time_of_day, sort_order: slot.sort_order
              }).select().single();
              if (!newSlot) continue;

              const slotItems = tItems?.filter(i => i.slot_id === slot.id) || [];
              if (slotItems.length > 0) {
                await supabase.from('meal_items').insert(
                  slotItems.map(item => ({ slot_id: newSlot.id, food_id: item.food_id, quantity: item.quantity, unit: item.unit }))
                );
              }
            }
          }
        }
      } else if (data) {
        // Create first day blank
        await supabase.from('plan_days').insert({
          plan_id: data.id,
          day_number: 1,
          label: 'Gün 1',
        });
      }

      if (data && router) {
        router.push(`/plans/${data.id}`);
      } else {
        onSuccess();
      }
    } catch (err) {
      setError((err as any)?.message || tr.common.error);
      setLoading(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal modal-sm" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{tr.plans.newPlan}</h2>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body flex flex-col gap-4">
            {error && (
              <div style={{ padding: 'var(--space-3)', backgroundColor: 'var(--color-danger-50)', color: 'var(--color-danger-700)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)' }}>
                {error}
              </div>
            )}
            <div className="form-group">
              <label className="form-label">{tr.plans.planTitle} *</label>
              <input
                type="text"
                className="form-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={tr.plans.planTitlePlaceholder}
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="flex items-center gap-2" style={{ cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={isTemplate}
                  onChange={(e) => setIsTemplate(e.target.checked)}
                />
                <span className="form-label" style={{ marginBottom: 0 }}>Şablon olarak oluştur</span>
              </label>
            </div>

            {!isTemplate && templates.length > 0 && (
              <div className="form-group">
                <label className="form-label">Şablon Kullan (İsteğe bağlı)</label>
                <select 
                  className="form-select" 
                  value={selectedTemplateId} 
                  onChange={(e) => setSelectedTemplateId(e.target.value)}
                >
                  <option value="">-- Boş Plan Oluştur --</option>
                  {templates.map(t => (
                    <option key={t.id} value={t.id}>{t.title}</option>
                  ))}
                </select>
                <span className="form-hint" style={{ marginTop: 'var(--space-1)', display: 'block' }}>
                  Seçtiğiniz şablonun tüm günleri ve öğünleri bu plana kopyalanacaktır.
                </span>
              </div>
            )}

            {!isTemplate && clients.length > 0 && (
              <div className="form-group">
                <label className="form-label">Danışan Seç (İsteğe bağlı)</label>
                <select 
                  className="form-select" 
                  value={selectedClientId} 
                  onChange={(e) => setSelectedClientId(e.target.value)}
                >
                  <option value="">-- Danışan Seçilmedi --</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <span className="form-hint" style={{ marginTop: 'var(--space-1)', display: 'block' }}>
                  Bu planı doğrudan bir danışanınıza atayabilirsiniz.
                </span>
              </div>
            )}

          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>{tr.common.cancel}</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <><span className="spinner spinner-sm" /> {tr.common.loading}</> : <><Plus size={16} /> {tr.common.save}</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
