import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { tr } from '@/lib/strings';
import Link from 'next/link';
import { ArrowLeft, Flame } from 'lucide-react';
import { UNITS } from '@/lib/constants/units';
import { ALLERGENS } from '@/lib/constants/allergens';

interface Props {
  params: Promise<{ id: string }>;
}

import { DeleteFoodButton } from '@/components/foods/DeleteFoodButton';

export default async function FoodDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: food } = await supabase
    .from('foods')
    .select('*')
    .eq('id', id)
    .single();

  if (!food) notFound();

  const { data: nutrients } = await supabase
    .from('food_nutrients')
    .select('*')
    .eq('food_id', id)
    .single();

  const unitLabel = UNITS.find((u) => u.value === food.serving_unit)?.label || food.serving_unit;

  return (
    <div>
      <Link href="/foods" className="btn btn-ghost btn-sm" style={{ marginBottom: 'var(--space-4)' }}>
        <ArrowLeft size={16} /> {tr.foods.title}
      </Link>

      <div className="page-header flex justify-between items-start">
        <div>
          <h1 className="page-title">{food.name}</h1>
          <span className={`badge ${food.source === 'manual' ? 'badge-neutral' : food.source === 'fatsecret' ? 'badge-accent' : 'badge-primary'}`}>
            {food.source === 'manual' ? tr.foods.sourceManual : food.source === 'fatsecret' ? tr.foods.sourceFatsecret : tr.foods.sourceUsda}
          </span>
        </div>
        
        {food.dietitian_id === user?.id && (
          <DeleteFoodButton id={food.id} />
        )}
      </div>

      <div className="content-grid content-grid-2">
        {/* Macros card */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">
              {tr.foods.perServing} ({food.serving_size} {unitLabel})
            </h2>
          </div>
          <div className="card-body">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span>{tr.foods.calories}</span>
                <span className="macro-pill macro-pill-cal"><Flame size={10} /> {food.calories} kcal</span>
              </div>
              <div className="flex items-center justify-between">
                <span>{tr.foods.protein}</span>
                <span className="macro-pill macro-pill-p">{food.protein}g</span>
              </div>
              <div className="flex items-center justify-between">
                <span>{tr.foods.carbohydrate}</span>
                <span className="macro-pill macro-pill-c">{food.carbohydrate}g</span>
              </div>
              <div className="flex items-center justify-between">
                <span>{tr.foods.fat}</span>
                <span className="macro-pill macro-pill-f">{food.fat}g</span>
              </div>
              {food.fiber != null && (
                <div className="flex items-center justify-between">
                  <span>{tr.foods.fiber}</span>
                  <span>{food.fiber}g</span>
                </div>
              )}
              {food.sugar != null && (
                <div className="flex items-center justify-between">
                  <span>{tr.foods.sugar}</span>
                  <span>{food.sugar}g</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Details card */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">{tr.common.details}</h2>
          </div>
          <div className="card-body flex flex-col gap-2" style={{ fontSize: 'var(--text-sm)' }}>
            {food.saturated_fat != null && (
              <div className="flex justify-between"><span>{tr.foods.saturatedFat}</span><span>{food.saturated_fat}g</span></div>
            )}
            {food.sodium != null && (
              <div className="flex justify-between"><span>{tr.foods.sodium}</span><span>{food.sodium}mg</span></div>
            )}
            {food.cholesterol != null && (
              <div className="flex justify-between"><span>{tr.foods.cholesterol}</span><span>{food.cholesterol}mg</span></div>
            )}
            {food.glycemic_index != null && (
              <div className="flex justify-between"><span>{tr.foods.glycemicIndex}</span><span>{food.glycemic_index}</span></div>
            )}
            {food.allergen_tags && food.allergen_tags.length > 0 && (
              <div>
                <span style={{ display: 'block', marginBottom: 'var(--space-2)' }}>{tr.foods.allergens}</span>
                <div className="flex gap-1 flex-wrap">
                  {food.allergen_tags.map((tag: string) => (
                    <span key={tag} className="badge badge-danger">
                      {ALLERGENS.find((a) => a.value === tag)?.label || tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {food.source_attribution && (
              <div className="flex justify-between">
                <span>{tr.foods.source}</span>
                <span style={{ color: 'var(--text-secondary)' }}>{food.source_attribution}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
