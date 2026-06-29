'use client';

import { useEffect, useState, useCallback } from 'react';
import { tr } from '@/lib/strings';
import { createClient } from '@/lib/supabase/client';
import type { DietPlanWithDetails, PlanDayWithSlots, MealSlotWithItems, Food } from '@/lib/types/database';
import { calculateMealTotals, calculateDayTotals, type NutrientTotals } from '@/lib/utils/nutrients';
import { UNITS } from '@/lib/constants/units';
import Link from 'next/link';
import AddFoodForm from '@/components/foods/AddFoodForm';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Copy,
  Clock,
  Search,
  X,
  Flame,
  FileDown,
  BookTemplate,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';

export default function PlanBuilderPage() {
  const params = useParams();
  const planId = params.id as string;
  const router = useRouter();
  const supabase = createClient();

  const [plan, setPlan] = useState<DietPlanWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [saving, setSaving] = useState(false);

  const fetchPlan = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Fetch plan
    const { data: planData } = await supabase
      .from('diet_plans')
      .select('*')
      .eq('id', planId)
      .single();

    if (!planData) { setLoading(false); return; }

    // Fetch client
    let client = null;
    if (planData.client_id) {
      const { data } = await supabase.from('clients').select('*').eq('id', planData.client_id).single();
      client = data;
    }

    // Fetch days
    const { data: days } = await supabase
      .from('plan_days').select('*').eq('plan_id', planId).order('day_number');

    // Fetch slots
    const dayIds = (days ?? []).map(d => d.id);
    const { data: slots } = dayIds.length > 0
      ? await supabase.from('meal_slots').select('*').in('day_id', dayIds).order('sort_order')
      : { data: [] };

    // Fetch items
    const slotIds = (slots ?? []).map(s => s.id);
    const { data: items } = slotIds.length > 0
      ? await supabase.from('meal_items').select('*').in('slot_id', slotIds).order('sort_order')
      : { data: [] };

    // Fetch foods
    const foodIds = [...new Set((items ?? []).map(i => i.food_id))];
    const { data: foods } = foodIds.length > 0
      ? await supabase.from('foods').select('*').in('id', foodIds)
      : { data: [] };

    const foodMap = new Map((foods ?? []).map(f => [f.id, f]));
    const itemsWithFood = (items ?? []).map(item => ({ ...item, food: foodMap.get(item.food_id)! }));
    const slotsWithItems = (slots ?? []).map(slot => ({
      ...slot,
      items: itemsWithFood.filter(i => i.slot_id === slot.id),
    }));
    const daysWithSlots = (days ?? []).map(day => ({
      ...day,
      slots: slotsWithItems.filter(s => s.day_id === day.id),
    }));

    setPlan({ ...planData, client, days: daysWithSlots });
    setLoading(false);
  }, [planId, supabase]);

  useEffect(() => { fetchPlan(); }, [fetchPlan]);

  async function handleAddDay() {
    setSaving(true);
    const maxDay = plan?.days.reduce((max, d) => Math.max(max, d.day_number), 0) ?? 0;
    await supabase.from('plan_days').insert({
      plan_id: planId,
      day_number: maxDay + 1,
      label: `Gün ${maxDay + 1}`,
    });
    await fetchPlan();
    setSelectedDayIndex((plan?.days.length ?? 0)); // Select the new day
    setSaving(false);
  }

  async function handleDeleteDay(dayId: string) {
    if (!confirm('Bu günü silmek istediğinize emin misiniz?')) return;
    setSaving(true);
    await supabase.from('plan_days').delete().eq('id', dayId);
    if (selectedDayIndex > 0) setSelectedDayIndex(selectedDayIndex - 1);
    await fetchPlan();
    setSaving(false);
  }

  async function handleAddMealSlot(dayId: string, type: 'main' | 'snack', label: string) {
    setSaving(true);
    const maxSort = plan?.days
      .find(d => d.id === dayId)?.slots
      .reduce((max, s) => Math.max(max, s.sort_order), 0) ?? 0;

    await supabase.from('meal_slots').insert({
      day_id: dayId,
      slot_type: type,
      label,
      sort_order: maxSort + 1,
    });
    await fetchPlan();
    setSaving(false);
  }

  async function handleDeleteSlot(slotId: string) {
    setSaving(true);
    await supabase.from('meal_slots').delete().eq('id', slotId);
    await fetchPlan();
    setSaving(false);
  }

  async function handleMoveMealSlot(slotId: string, direction: 'up' | 'down') {
    if (!plan) return;
    const day = plan.days.find(d => d.slots.some(s => s.id === slotId));
    if (!day) return;
    
    const slots = [...day.slots];
    const index = slots.findIndex(s => s.id === slotId);
    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === slots.length - 1) return;
    
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    const currentSlot = slots[index];
    const swapSlot = slots[swapIndex];
    
    setSaving(true);
    
    // We update both in parallel to avoid slow UI
    await Promise.all([
      supabase.from('meal_slots').update({ sort_order: swapSlot.sort_order }).eq('id', currentSlot.id),
      supabase.from('meal_slots').update({ sort_order: currentSlot.sort_order }).eq('id', swapSlot.id)
    ]);
    
    await fetchPlan();
    setSaving(false);
  }

  async function handleAddMealItem(slotId: string, foodId: string, quantity: number, unit: string) {
    setSaving(true);
    await supabase.from('meal_items').insert({ slot_id: slotId, food_id: foodId, quantity, unit });
    await fetchPlan();
    setSaving(false);
  }

  async function handleDeleteItem(itemId: string) {
    setSaving(true);
    await supabase.from('meal_items').delete().eq('id', itemId);
    await fetchPlan();
    setSaving(false);
  }

  async function handleDuplicateDay(dayId: string) {
    setSaving(true);
    const day = plan?.days.find(d => d.id === dayId);
    if (!day) return;

    const maxDay = plan?.days.reduce((max, d) => Math.max(max, d.day_number), 0) ?? 0;
    const { data: newDay } = await supabase.from('plan_days').insert({
      plan_id: planId,
      day_number: maxDay + 1,
      label: `${day.label} (kopya)`,
      notes: day.notes,
    }).select().single();

    if (newDay) {
      for (const slot of day.slots) {
        const { data: newSlot } = await supabase.from('meal_slots').insert({
          day_id: newDay.id,
          slot_type: slot.slot_type,
          label: slot.label,
          time_of_day: slot.time_of_day,
          sort_order: slot.sort_order,
        }).select().single();

        if (newSlot && slot.items.length > 0) {
          await supabase.from('meal_items').insert(
            slot.items.map(item => ({
              slot_id: newSlot.id,
              food_id: item.food_id,
              quantity: item.quantity,
              unit: item.unit,
            }))
          );
        }
      }
    }
    await fetchPlan();
    setSaving(false);
  }

  async function handleSaveAsTemplate() {
    if (!plan) return;
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: newPlan } = await supabase.from('diet_plans').insert({
      dietitian_id: user.id,
      title: `${plan.title} (şablon)`,
      is_template: true,
    }).select().single();

    if (newPlan) {
      for (const day of plan.days) {
        const { data: newDay } = await supabase.from('plan_days').insert({
          plan_id: newPlan.id, day_number: day.day_number, label: day.label, notes: day.notes,
        }).select().single();
        if (!newDay) continue;
        for (const slot of day.slots) {
          const { data: newSlot } = await supabase.from('meal_slots').insert({
            day_id: newDay.id, slot_type: slot.slot_type, label: slot.label, time_of_day: slot.time_of_day, sort_order: slot.sort_order,
          }).select().single();
          if (!newSlot || slot.items.length === 0) continue;
          await supabase.from('meal_items').insert(
            slot.items.map(item => ({ slot_id: newSlot.id, food_id: item.food_id, quantity: item.quantity, unit: item.unit }))
          );
        }
      }
    }
    alert(tr.plans.templateSaved);
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: 400 }}>
        <span className="spinner spinner-lg" />
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="empty-state">
        <h3 className="empty-state-title">Plan bulunamadı</h3>
        <Link href="/plans" className="btn btn-primary">Planlara Dön</Link>
      </div>
    );
  }

  const selectedDay = plan.days[selectedDayIndex];
  const dayTotals = selectedDay ? calculateDayTotals(selectedDay.slots) : null;

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 'var(--space-4)' }}>
        <Link href="/plans" className="btn btn-ghost btn-sm">
          <ArrowLeft size={16} /> {tr.plans.title}
        </Link>
      </div>

      <div className="page-header">
        <div>
          <h1 className="page-title">{plan.title}</h1>
          {plan.client && (
            <p className="page-subtitle">{plan.client.name}</p>
          )}
          {plan.is_template && <span className="badge badge-accent" style={{ marginTop: 'var(--space-1)' }}>Şablon</span>}
        </div>
        <div className="flex gap-2">
          <button className="btn btn-secondary btn-sm" onClick={handleSaveAsTemplate} disabled={saving}>
            <BookTemplate size={14} /> {tr.plans.saveAsTemplate}
          </button>
          <a href={`/api/plans/${planId}/pdf`} className="btn btn-primary btn-sm" target="_blank">
            <FileDown size={14} /> {tr.plans.exportPdf}
          </a>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr 260px', gap: 'var(--space-4)', alignItems: 'start' }}>
        {/* Day sidebar */}
        <div className="card" style={{ position: 'sticky', top: 80 }}>
          <div className="card-header" style={{ padding: 'var(--space-3)' }}>
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)' }}>Günler</span>
          </div>
          <div style={{ padding: 'var(--space-2)' }}>
            {plan.days.map((day, idx) => (
              <button
                key={day.id}
                className={`sidebar-link ${idx === selectedDayIndex ? 'active' : ''}`}
                onClick={() => setSelectedDayIndex(idx)}
                style={{ width: '100%', background: idx === selectedDayIndex ? 'var(--color-primary-50)' : 'transparent', color: idx === selectedDayIndex ? 'var(--color-primary-700)' : 'var(--text-primary)', borderRadius: 'var(--radius-md)', padding: 'var(--space-2) var(--space-3)', border: 'none', cursor: 'pointer', fontSize: 'var(--text-sm)', fontWeight: idx === selectedDayIndex ? 'var(--font-semibold)' : 'var(--font-normal)', textAlign: 'left', fontFamily: 'var(--font-sans)' }}
              >
                {day.label || `Gün ${day.day_number}`}
              </button>
            ))}
            <button className="btn btn-ghost btn-sm w-full" onClick={handleAddDay} disabled={saving} style={{ marginTop: 'var(--space-2)' }}>
              <Plus size={14} /> {tr.plans.addDay}
            </button>
          </div>
        </div>

        {/* Main content — selected day */}
        <div>
          {selectedDay ? (
            <DayView
              day={selectedDay}
              onAddSlot={(type, label) => handleAddMealSlot(selectedDay.id, type, label)}
              onDeleteSlot={handleDeleteSlot}
              onMoveSlot={handleMoveMealSlot}
              onAddItem={handleAddMealItem}
              onDeleteItem={handleDeleteItem}
              onDuplicateDay={() => handleDuplicateDay(selectedDay.id)}
              onDeleteDay={() => handleDeleteDay(selectedDay.id)}
              saving={saving}
            />
          ) : (
            <div className="empty-state">
              <p>Gün ekleyin</p>
              <button className="btn btn-primary" onClick={handleAddDay}>
                <Plus size={16} /> {tr.plans.addDay}
              </button>
            </div>
          )}
        </div>

        {/* Nutrition summary sidebar */}
        <div className="card" style={{ position: 'sticky', top: 80 }}>
          <div className="card-header" style={{ padding: 'var(--space-3)' }}>
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)' }}>
              {tr.plans.nutritionSummary}
            </span>
          </div>
          <div className="card-body" style={{ padding: 'var(--space-3)' }}>
            {dayTotals ? (
              <NutritionDisplay totals={dayTotals} label={tr.plans.dayTotal} />
            ) : (
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>
                Gün seçin
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Day View Component ─────────────────────────────────

function DayView({
  day, onAddSlot, onDeleteSlot, onMoveSlot, onAddItem, onDeleteItem, onDuplicateDay, onDeleteDay, saving,
}: {
  day: PlanDayWithSlots;
  onAddSlot: (type: 'main' | 'snack', label: string) => void;
  onDeleteSlot: (slotId: string) => void;
  onMoveSlot: (slotId: string, direction: 'up' | 'down') => void;
  onAddItem: (slotId: string, foodId: string, quantity: number, unit: string) => void;
  onDeleteItem: (itemId: string) => void;
  onDuplicateDay: () => void;
  onDeleteDay: () => void;
  saving: boolean;
}) {
  const [showAddSlot, setShowAddSlot] = useState(false);

  return (
    <div>
      <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-4)' }}>
        <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)' }}>
          {day.label || `Gün ${day.day_number}`}
        </h2>
        <div className="flex gap-2">
          <button className="btn btn-ghost btn-sm" onClick={onDuplicateDay} disabled={saving}>
            <Copy size={14} /> {tr.plans.duplicateDay}
          </button>
          <button className="btn btn-ghost btn-sm" onClick={onDeleteDay} disabled={saving} style={{ color: 'var(--color-danger-500)' }}>
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Meal slots */}
      {day.slots.length === 0 ? (
        <div className="empty-state card" style={{ padding: 'var(--space-8)' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>Bu güne henüz öğün eklenmemiş</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {day.slots.map((slot, idx) => (
            <MealSlotCard
              key={slot.id}
              slot={slot}
              isFirst={idx === 0}
              isLast={idx === day.slots.length - 1}
              onDeleteSlot={() => onDeleteSlot(slot.id)}
              onMoveSlot={(dir) => onMoveSlot(slot.id, dir)}
              onAddItem={(foodId, qty, unit) => onAddItem(slot.id, foodId, qty, unit)}
              onDeleteItem={onDeleteItem}
              saving={saving}
            />
          ))}
        </div>
      )}

      {/* Add meal slot */}
      <div style={{ marginTop: 'var(--space-4)' }}>
        {showAddSlot ? (
          <AddSlotForm
            onAdd={(type, label) => { onAddSlot(type, label); setShowAddSlot(false); }}
            onCancel={() => setShowAddSlot(false)}
          />
        ) : (
          <button className="btn btn-secondary w-full" onClick={() => setShowAddSlot(true)} disabled={saving}>
            <Plus size={16} /> {tr.plans.addMeal}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Meal Slot Card ─────────────────────────────────────

function MealSlotCard({
  slot, isFirst, isLast, onDeleteSlot, onMoveSlot, onAddItem, onDeleteItem, saving,
}: {
  slot: MealSlotWithItems;
  isFirst: boolean;
  isLast: boolean;
  onDeleteSlot: () => void;
  onMoveSlot: (direction: 'up' | 'down') => void;
  onAddItem: (foodId: string, quantity: number, unit: string) => void;
  onDeleteItem: (itemId: string) => void;
  saving: boolean;
}) {
  const [showFoodSearch, setShowFoodSearch] = useState(false);
  const mealTotals = calculateMealTotals(slot.items);

  return (
    <div className="card">
      <div className="card-header" style={{ padding: 'var(--space-3) var(--space-4)' }}>
        <div className="flex items-center gap-2">
          <span className={`badge ${slot.slot_type === 'main' ? 'badge-primary' : 'badge-accent'}`}>
            {slot.slot_type === 'main' ? tr.plans.mainMeal : tr.plans.snack}
          </span>
          <span style={{ fontWeight: 'var(--font-semibold)', fontSize: 'var(--text-sm)' }}>{slot.label}</span>
          {slot.time_of_day && (
            <span className="flex items-center gap-1" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
              <Clock size={12} /> {slot.time_of_day}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="macro-pill macro-pill-cal">
            <Flame size={10} /> {mealTotals.calories} kcal
          </span>
          <div className="flex items-center" style={{ marginLeft: 'var(--space-2)' }}>
            <button 
              className="btn btn-ghost btn-icon btn-sm" 
              onClick={() => onMoveSlot('up')} 
              disabled={saving || isFirst} 
              style={{ padding: '4px', opacity: isFirst ? 0.3 : 1 }}
              title="Yukarı Taşı"
            >
              <ChevronUp size={14} />
            </button>
            <button 
              className="btn btn-ghost btn-icon btn-sm" 
              onClick={() => onMoveSlot('down')} 
              disabled={saving || isLast} 
              style={{ padding: '4px', opacity: isLast ? 0.3 : 1 }}
              title="Aşağı Taşı"
            >
              <ChevronDown size={14} />
            </button>
          </div>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onDeleteSlot} disabled={saving} style={{ color: 'var(--color-danger-500)', marginLeft: 'var(--space-1)' }} title="Sil">
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div style={{ padding: 'var(--space-2) var(--space-4)' }}>
        {slot.items.length === 0 ? (
          <p style={{ padding: 'var(--space-3) 0', fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', textAlign: 'center' }}>
            Henüz yiyecek eklenmemiş
          </p>
        ) : (
          <div>
            {slot.items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between"
                style={{ padding: 'var(--space-2) 0', borderBottom: '1px solid var(--border-color)' }}
              >
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)' }}>
                    {item.food?.name || 'Unknown food'}
                  </span>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginLeft: 'var(--space-2)' }}>
                    {item.quantity} {UNITS.find(u => u.value === item.unit)?.label || item.unit}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="macro-pills" style={{ fontSize: 'var(--text-xs)' }}>
                    {item.food && (
                      <>
                        <span className="macro-pill macro-pill-cal" style={{ fontSize: '10px' }}>
                          {Math.round((item.food.calories / item.food.serving_size) * item.quantity)} kcal
                        </span>
                      </>
                    )}
                  </div>
                  <button className="btn btn-ghost btn-icon btn-sm" onClick={() => onDeleteItem(item.id)} disabled={saving}>
                    <X size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add food */}
        {showFoodSearch ? (
          <InlineFoodSearch
            onSelect={(foodId, qty, unit) => { onAddItem(foodId, qty, unit); setShowFoodSearch(false); }}
            onCancel={() => setShowFoodSearch(false)}
          />
        ) : (
          <button
            className="btn btn-ghost btn-sm w-full"
            onClick={() => setShowFoodSearch(true)}
            disabled={saving}
            style={{ marginTop: 'var(--space-2)', color: 'var(--color-primary-600)' }}
          >
            <Plus size={14} /> {tr.plans.addFood}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Inline Food Search ─────────────────────────────────

function InlineFoodSearch({
  onSelect, onCancel,
}: {
  onSelect: (foodId: string, quantity: number, unit: string) => void;
  onCancel: () => void;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Food[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState('porsiyon');
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    if (query.length < 2) { setResults([]); return; }
    const timeout = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/foods/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.local ?? []);
      } catch { /* ignore */ }
      setLoading(false);
    }, 300);
    return () => clearTimeout(timeout);
  }, [query]);

  if (showAddForm) {
    return (
      <div style={{ marginTop: 'var(--space-2)', padding: 'var(--space-3)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
        <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-3)' }}>Yeni Yiyecek Ekle</h3>
        <AddFoodForm 
          initialName={query} 
          onSuccess={(food) => {
            setSelectedFood(food);
            setUnit(food.serving_unit);
            setQuantity(String(food.serving_size));
            setShowAddForm(false);
          }}
          onCancel={() => setShowAddForm(false)}
        />
      </div>
    );
  }

  if (selectedFood) {
    return (
      <div style={{ padding: 'var(--space-3)', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', marginTop: 'var(--space-2)' }}>
        <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-2)' }}>
          {selectedFood.name}
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            className="form-input"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            min="0.1"
            step="0.1"
            style={{ width: 80 }}
            autoFocus
          />
          <select className="form-select" value={unit} onChange={(e) => setUnit(e.target.value)} style={{ width: 140 }}>
            {UNITS.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
          </select>
          <button className="btn btn-primary btn-sm" onClick={() => onSelect(selectedFood.id, parseFloat(quantity), unit)}>
            {tr.common.add}
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => setSelectedFood(null)}>
            {tr.common.cancel}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ marginTop: 'var(--space-2)' }}>
      <div className="search-input-wrapper">
        <Search className="search-icon" />
        <input
          type="text"
          className="form-input"
          placeholder={tr.foods.searchPlaceholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
        <button className="search-clear" onClick={onCancel}><X size={16} /></button>
      </div>

      {loading && <div style={{ padding: 'var(--space-2)', textAlign: 'center' }}><span className="spinner spinner-sm" /></div>}

      {!loading && query.length >= 2 && results.length === 0 && (
        <div style={{ padding: 'var(--space-4)', textAlign: 'center', color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
          <p style={{ marginBottom: 'var(--space-2)' }}>Aradığınız yiyecek bulunamadı.</p>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowAddForm(true)}>
            Kendi yiyeceğinizi ekleyin
          </button>
        </div>
      )}

      {results.length > 0 && (
        <div style={{ maxHeight: 200, overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', marginTop: 'var(--space-2)' }}>
          {results.map(food => (
            <button
              key={food.id}
              className="dropdown-item"
              onClick={() => { setSelectedFood(food); setUnit(food.serving_unit); setQuantity(String(food.serving_size)); }}
            >
              <span style={{ flex: 1 }}>{food.name}</span>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>{food.calories} kcal</span>
            </button>
          ))}
          <div style={{ padding: 'var(--space-2)', textAlign: 'center', borderTop: '1px solid var(--border-color)' }}>
            <button className="btn btn-ghost btn-sm w-full" onClick={() => setShowAddForm(true)}>
              Aradığınızı bulamadınız mı? Yeni ekle
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Add Slot Form ──────────────────────────────────────

function AddSlotForm({
  onAdd, onCancel,
}: {
  onAdd: (type: 'main' | 'snack', label: string) => void;
  onCancel: () => void;
}) {
  const [type, setType] = useState<'main' | 'snack'>('main');
  const [label, setLabel] = useState('');

  const defaultLabels = {
    main: [tr.defaultMealLabels.breakfast, tr.defaultMealLabels.lunch, tr.defaultMealLabels.dinner],
    snack: [tr.defaultMealLabels.morningSnack, tr.defaultMealLabels.afternoonSnack, tr.defaultMealLabels.eveningSnack],
  };

  return (
    <div className="card" style={{ padding: 'var(--space-4)' }}>
      <div className="flex flex-col gap-3">
        <div className="flex gap-2">
          <button className={`badge ${type === 'main' ? 'badge-primary' : 'badge-neutral'}`} style={{ cursor: 'pointer', padding: 'var(--space-1) var(--space-3)' }} onClick={() => setType('main')}>
            {tr.plans.mainMeal}
          </button>
          <button className={`badge ${type === 'snack' ? 'badge-accent' : 'badge-neutral'}`} style={{ cursor: 'pointer', padding: 'var(--space-1) var(--space-3)' }} onClick={() => setType('snack')}>
            {tr.plans.snack}
          </button>
        </div>
        <div className="flex gap-2 flex-wrap">
          {defaultLabels[type].map(l => (
            <button key={l} className="btn btn-ghost btn-sm" onClick={() => setLabel(l)} style={{ border: label === l ? '1px solid var(--color-primary-400)' : '1px solid var(--border-color)' }}>
              {l}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input className="form-input" placeholder={tr.plans.mealLabelPlaceholder} value={label} onChange={e => setLabel(e.target.value)} style={{ flex: 1 }} autoFocus />
          <button className="btn btn-primary btn-sm" onClick={() => { if (label.trim()) onAdd(type, label.trim()); }} disabled={!label.trim()}>
            <Plus size={14} /> {tr.common.add}
          </button>
          <button className="btn btn-ghost btn-sm" onClick={onCancel}>{tr.common.cancel}</button>
        </div>
      </div>
    </div>
  );
}

// ─── Nutrition Display ──────────────────────────────────

function NutritionDisplay({ totals, label }: { totals: NutrientTotals; label: string }) {
  const items = [
    { name: tr.foods.calories, value: `${totals.calories} kcal`, color: 'var(--color-calories)' },
    { name: tr.foods.protein, value: `${totals.protein}g`, color: 'var(--color-protein)' },
    { name: tr.foods.carbohydrate, value: `${totals.carbohydrate}g`, color: 'var(--color-carbs)' },
    { name: tr.foods.fat, value: `${totals.fat}g`, color: 'var(--color-fat)' },
    { name: tr.foods.fiber, value: `${totals.fiber}g`, color: 'var(--color-fiber)' },
  ];

  return (
    <div>
      <h4 style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-semibold)', color: 'var(--text-secondary)', marginBottom: 'var(--space-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </h4>
      <div className="flex flex-col gap-2">
        {items.map(item => (
          <div key={item.name} className="flex items-center justify-between" style={{ fontSize: 'var(--text-sm)' }}>
            <span style={{ color: 'var(--text-secondary)' }}>{item.name}</span>
            <span style={{ fontWeight: 'var(--font-semibold)', color: item.color }}>{item.value}</span>
          </div>
        ))}
      </div>

      {/* Macro bar */}
      <div className="nutrient-bar" style={{ marginTop: 'var(--space-3)' }}>
        {totals.calories > 0 && (
          <>
            <div className="nutrient-bar-segment nutrient-bar-protein" style={{ width: `${(totals.protein * 4 / (totals.calories || 1)) * 100}%` }} />
            <div className="nutrient-bar-segment nutrient-bar-carbs" style={{ width: `${(totals.carbohydrate * 4 / (totals.calories || 1)) * 100}%` }} />
            <div className="nutrient-bar-segment nutrient-bar-fat" style={{ width: `${(totals.fat * 9 / (totals.calories || 1)) * 100}%` }} />
          </>
        )}
      </div>
    </div>
  );
}
