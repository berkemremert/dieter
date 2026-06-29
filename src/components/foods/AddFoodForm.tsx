'use client';

import { useState } from 'react';
import { tr } from '@/lib/strings';
import { createClient } from '@/lib/supabase/client';
import { UNITS } from '@/lib/constants/units';
import { ALLERGENS, FOOD_CATEGORIES } from '@/lib/constants/allergens';
import { ChevronRight, Save } from 'lucide-react';
import type { Food } from '@/lib/types/database';

interface AddFoodFormProps {
  initialName?: string;
  onSuccess?: (food: Food) => void;
  onCancel?: () => void;
}

export default function AddFoodForm({ initialName = '', onSuccess, onCancel }: AddFoodFormProps) {
  const supabase = createClient();

  const [name, setName] = useState(initialName);
  const [categoryId, setCategoryId] = useState('');
  const [servingSize, setServingSize] = useState('100');
  const [servingUnit, setServingUnit] = useState('g');
  const [baseUnitGrams, setBaseUnitGrams] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('0');
  const [carbs, setCarbs] = useState('0');
  const [fat, setFat] = useState('0');

  // Detailed (expandable)
  const [showDetailed, setShowDetailed] = useState(false);
  const [fiber, setFiber] = useState('');
  const [sugar, setSugar] = useState('');
  const [satFat, setSatFat] = useState('');
  const [sodium, setSodium] = useState('');
  const [cholesterol, setCholesterol] = useState('');
  const [glycemicIndex, setGlycemicIndex] = useState('');
  const [allergenTags, setAllergenTags] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const needsConversion = !['g', 'ml'].includes(servingUnit);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError(tr.foods.nameRequired); return; }
    if (!calories) { setError(tr.foods.caloriesRequired); return; }

    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error: insertError } = await supabase.from('foods').insert({
        name: name.trim(),
        source: 'manual',
        dietitian_id: user.id,
        category_id: categoryId || null,
        serving_size: parseFloat(servingSize),
        serving_unit: servingUnit,
        base_unit_grams: baseUnitGrams ? parseFloat(baseUnitGrams) : null,
        calories: parseFloat(calories),
        protein: parseFloat(protein || '0'),
        carbohydrate: parseFloat(carbs || '0'),
        fat: parseFloat(fat || '0'),
        fiber: fiber ? parseFloat(fiber) : null,
        sugar: sugar ? parseFloat(sugar) : null,
        saturated_fat: satFat ? parseFloat(satFat) : null,
        sodium: sodium ? parseFloat(sodium) : null,
        cholesterol: cholesterol ? parseFloat(cholesterol) : null,
        glycemic_index: glycemicIndex ? parseInt(glycemicIndex) : null,
        allergen_tags: allergenTags.length > 0 ? allergenTags : null,
      }).select().single();

      if (insertError) throw insertError;
      
      if (onSuccess && data) {
        onSuccess(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : tr.common.error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && (
        <div style={{
          padding: 'var(--space-3)',
          backgroundColor: 'var(--color-danger-50)',
          color: 'var(--color-danger-700)',
          borderRadius: 'var(--radius-md)',
          fontSize: 'var(--text-sm)',
        }}>
          {error}
        </div>
      )}

      {/* Basic fields */}
      <div className="form-row form-row-2">
        <div className="form-group">
          <label className="form-label" htmlFor="food-name">{tr.foods.name} *</label>
          <input
            id="food-name"
            type="text"
            className="form-input"
            value={name}
            onChange={(e) => {
              const val = e.target.value;
              setName(val.charAt(0).toUpperCase() + val.slice(1));
            }}
            placeholder="Örn: Tavuk göğsü"
            required
            autoFocus
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="food-category">{tr.foods.category}</label>
          <select
            id="food-category"
            className="form-select"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            <option value="">Seçiniz...</option>
            {FOOD_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-row form-row-3">
        <div className="form-group">
          <label className="form-label" htmlFor="food-serving">{tr.foods.servingSize} *</label>
          <input
            id="food-serving"
            type="number"
            className="form-input"
            value={servingSize}
            onChange={(e) => setServingSize(e.target.value)}
            min="0.1"
            step="0.1"
            required
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="food-unit">{tr.foods.servingUnit} *</label>
          <select
            id="food-unit"
            className="form-select"
            value={servingUnit}
            onChange={(e) => setServingUnit(e.target.value)}
          >
            {UNITS.map((u) => (
              <option key={u.value} value={u.value}>{u.label}</option>
            ))}
          </select>
        </div>
        {needsConversion && (
          <div className="form-group">
            <label className="form-label" htmlFor="food-base-grams">{tr.foods.conversionFactor}</label>
            <input
              id="food-base-grams"
              type="number"
              className="form-input"
              value={baseUnitGrams}
              onChange={(e) => setBaseUnitGrams(e.target.value)}
              placeholder="gram"
              min="0.1"
              step="0.1"
            />
            <span className="form-hint">{tr.foods.conversionHint}</span>
          </div>
        )}
      </div>

      {/* Macros */}
      <div className="form-row form-row-4">
        <div className="form-group">
          <label className="form-label" htmlFor="food-cal">{tr.foods.calories} *</label>
          <input
            id="food-cal"
            type="number"
            className="form-input"
            value={calories}
            onChange={(e) => setCalories(e.target.value)}
            min="0"
            step="0.1"
            required
            placeholder="kcal"
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="food-protein">{tr.foods.protein} (g)</label>
          <input
            id="food-protein"
            type="number"
            className="form-input"
            value={protein}
            onChange={(e) => setProtein(e.target.value)}
            min="0"
            step="0.1"
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="food-carbs">{tr.foods.carbohydrate} (g)</label>
          <input
            id="food-carbs"
            type="number"
            className="form-input"
            value={carbs}
            onChange={(e) => setCarbs(e.target.value)}
            min="0"
            step="0.1"
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="food-fat">{tr.foods.fat} (g)</label>
          <input
            id="food-fat"
            type="number"
            className="form-input"
            value={fat}
            onChange={(e) => setFat(e.target.value)}
            min="0"
            step="0.1"
          />
        </div>
      </div>

      <hr className="divider" />

      {/* Expandable detailed section */}
      <button
        type="button"
        className="expandable-header"
        onClick={() => setShowDetailed(!showDetailed)}
      >
        <ChevronRight size={16} className={`expandable-icon ${showDetailed ? 'open' : ''}`} />
        {tr.foods.detailedInfo}
      </button>

      <div className={`expandable-content ${showDetailed ? 'open' : ''}`}>
        <div className="flex flex-col gap-4" style={{ paddingBottom: 'var(--space-4)' }}>
          <div className="form-row form-row-4">
            <div className="form-group">
              <label className="form-label">{tr.foods.fiber} (g)</label>
              <input type="number" className="form-input" value={fiber} onChange={(e) => setFiber(e.target.value)} min="0" step="0.1" />
            </div>
            <div className="form-group">
              <label className="form-label">{tr.foods.sugar} (g)</label>
              <input type="number" className="form-input" value={sugar} onChange={(e) => setSugar(e.target.value)} min="0" step="0.1" />
            </div>
            <div className="form-group">
              <label className="form-label">{tr.foods.saturatedFat} (g)</label>
              <input type="number" className="form-input" value={satFat} onChange={(e) => setSatFat(e.target.value)} min="0" step="0.1" />
            </div>
            <div className="form-group">
              <label className="form-label">{tr.foods.sodium} (mg)</label>
              <input type="number" className="form-input" value={sodium} onChange={(e) => setSodium(e.target.value)} min="0" step="0.1" />
            </div>
          </div>

          <div className="form-row form-row-2">
            <div className="form-group">
              <label className="form-label">{tr.foods.cholesterol} (mg)</label>
              <input type="number" className="form-input" value={cholesterol} onChange={(e) => setCholesterol(e.target.value)} min="0" step="0.1" />
            </div>
            <div className="form-group">
              <label className="form-label">{tr.foods.glycemicIndex}</label>
              <input type="number" className="form-input" value={glycemicIndex} onChange={(e) => setGlycemicIndex(e.target.value)} min="0" max="100" />
            </div>
          </div>

          {/* Allergens */}
          <div className="form-group">
            <label className="form-label">{tr.foods.allergens}</label>
            <div className="flex gap-2 flex-wrap">
              {ALLERGENS.map((a) => (
                <button
                  key={a.value}
                  type="button"
                  className={`badge ${allergenTags.includes(a.value) ? 'badge-danger' : 'badge-neutral'}`}
                  style={{ cursor: 'pointer', padding: 'var(--space-1) var(--space-3)' }}
                  onClick={() => {
                    setAllergenTags((prev) =>
                      prev.includes(a.value)
                        ? prev.filter((t) => t !== a.value)
                        : [...prev, a.value],
                    );
                  }}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-4">
        {onCancel && (
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            {tr.common.cancel}
          </button>
        )}
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? (
            <>
              <span className="spinner spinner-sm" />
              {tr.common.loading}
            </>
          ) : (
            <>
              <Save size={16} />
              {tr.common.save}
            </>
          )}
        </button>
      </div>
    </form>
  );
}
