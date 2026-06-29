'use client';

import { useEffect, useState, useCallback } from 'react';
import { tr } from '@/lib/strings';
import { createClient } from '@/lib/supabase/client';
import type { Food } from '@/lib/types/database';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  Plus,
  X,
  UtensilsCrossed,
  Flame,
  ExternalLink,
} from 'lucide-react';

export default function FoodsPage() {
  const [initialFoods, setInitialFoods] = useState<Food[]>([]);
  const [searchResults, setSearchResults] = useState<Food[]>([]);
  const [recentFoods, setRecentFoods] = useState<Food[]>([]);
  const [showAllRecent, setShowAllRecent] = useState(false);
  const [externalFoods, setExternalFoods] = useState<Food[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const saved = localStorage.getItem('recent_foods');
    if (saved) {
      try { setRecentFoods(JSON.parse(saved)); } catch (e) {}
    }
  }, []);

  const doSearch = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      setExternalFoods([]);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/foods/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setSearchResults(data.local ?? []);
      setExternalFoods(data.external ?? []);
    } catch {
      console.error('Search failed');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch initial foods (user's own)
  useEffect(() => {
    async function fetchInitial() {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('foods')
        .select('*')
        .eq('dietitian_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);

      setInitialFoods(data ?? []);
      setLoading(false);
    }
    fetchInitial();
  }, [supabase]);

  // Debounced search
  useEffect(() => {
    if (searchTimeout) clearTimeout(searchTimeout);
    if (search.length >= 2) {
      const timeout = setTimeout(() => doSearch(search), 300);
      setSearchTimeout(timeout);
    } else if (search.length === 0) {
      // Reset to initial
      setExternalFoods([]);
    }
    return () => {
      if (searchTimeout) clearTimeout(searchTimeout);
    };
  }, [search, doSearch]);

  const sourceLabel = (source: string) => {
    switch (source) {
      case 'fatsecret': return tr.foods.sourceFatsecret;
      case 'usda': return tr.foods.sourceUsda;
      case 'dish': return tr.foods.sourceDish;
      default: return tr.foods.sourceManual;
    }
  };

  const sourceBadgeClass = (source: string) => {
    switch (source) {
      case 'fatsecret': return 'badge-accent';
      case 'usda': return 'badge-primary';
      case 'dish': return 'badge-success';
      default: return 'badge-neutral';
    }
  };

  const handleFoodClick = (food: Food) => {
    setRecentFoods(prev => {
      const merged = [food, ...prev];
      const unique = merged.filter((v, i, a) => a.findIndex(t => t.id === v.id || t.name === v.name) === i).slice(0, 20);
      localStorage.setItem('recent_foods', JSON.stringify(unique));
      return unique;
    });
  };

  const handleExternalFoodClick = async (e: React.MouseEvent, food: Food) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { importExternalFood } = await import('@/lib/actions/importFood');
      const res = await importExternalFood(food as any);
      if (res.success && res.id) {
        handleFoodClick({ ...food, id: res.id });
        router.push(`/foods/${res.id}`);
      } else {
        alert(res.error || 'Bir hata oluştu.');
        setLoading(false);
      }
    } catch (err) {
      alert('Yiyecek getirilemedi.');
      setLoading(false);
    }
  };

  const myAddedFoods = initialFoods;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">{tr.foods.title}</h1>
          <p className="page-subtitle">{tr.foods.searchPlaceholder}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/foods/add" className="btn btn-primary">
            <Plus size={16} />
            {tr.foods.addManual}
          </Link>
        </div>
      </div>

      {/* Search */}
      <div className="search-input-wrapper" style={{ marginBottom: 'var(--space-6)' }}>
        <Search className="search-icon" />
        <input
          type="text"
          className="form-input"
          placeholder={tr.foods.searchPlaceholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          id="food-search"
        />
        {search && (
          <button className="search-clear" onClick={() => setSearch('')}>
            <X size={16} />
          </button>
        )}
        {loading && (
          <span
            className="spinner spinner-sm"
            style={{ position: 'absolute', right: 40, top: '50%', transform: 'translateY(-50%)' }}
          />
        )}
      </div>

      {/* Initial state (no search) */}
      {!search && !loading && (
        <>
          {myAddedFoods.length > 0 && (
            <div style={{ marginBottom: 'var(--space-6)' }}>
              <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', color: 'var(--text-secondary)', marginBottom: 'var(--space-3)' }}>
                Benim Eklediklerim
              </h3>
              <div className="flex flex-col gap-2">
                {myAddedFoods.map((food) => (
                  <FoodRow key={food.id} food={food} sourceLabel={sourceLabel} sourceBadgeClass={sourceBadgeClass} />
                ))}
              </div>
            </div>
          )}

          {recentFoods.length > 0 && (
            <div style={{ marginBottom: 'var(--space-6)' }}>
              <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', color: 'var(--text-secondary)', marginBottom: 'var(--space-3)' }}>
                Aradığım Yiyecekler
              </h3>
              <div className="flex flex-col gap-2">
                {(showAllRecent ? recentFoods : recentFoods.slice(0, 5)).map((food, idx) => (
                  <FoodRow key={`recent-${food.id || idx}`} food={food} sourceLabel={sourceLabel} sourceBadgeClass={sourceBadgeClass} />
                ))}
              </div>
              {recentFoods.length > 5 && (
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ width: '100%', marginTop: 'var(--space-2)' }}
                  onClick={() => setShowAllRecent(!showAllRecent)}
                >
                  {showAllRecent ? 'Daha Az Göster' : 'Tümünü Göster'}
                </button>
              )}
            </div>
          )}

          {initialFoods.length === 0 && recentFoods.length === 0 && (
            <div className="empty-state">
              <UtensilsCrossed className="empty-state-icon" />
              <h3 className="empty-state-title">Henüz yiyecek eklemediniz</h3>
              <p className="empty-state-desc">Yukarıdan arama yapabilir veya manuel ekleyebilirsiniz.</p>
            </div>
          )}
        </>
      )}

      {/* Local search results */}
      {search.length >= 2 && searchResults.length > 0 && (
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', color: 'var(--text-secondary)', marginBottom: 'var(--space-3)' }}>
            "{search}" sonuçları
          </h3>
          <div className="flex flex-col gap-2">
            {searchResults.map((food) => (
              <FoodRow key={food.id} food={food} sourceLabel={sourceLabel} sourceBadgeClass={sourceBadgeClass} onClick={() => handleFoodClick(food)} />
            ))}
          </div>
        </div>
      )}

      {/* External results */}
      {externalFoods.length > 0 && (
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <hr className="divider" />
          <h3
            className="flex items-center gap-2"
            style={{
              fontSize: 'var(--text-sm)',
              fontWeight: 'var(--font-semibold)',
              color: 'var(--text-secondary)',
              marginBottom: 'var(--space-3)',
            }}
          >
            <ExternalLink size={14} />
            {tr.foods.externalResults}
          </h3>
          <div className="flex flex-col gap-2">
            {externalFoods.map((food, idx) => (
              <FoodRow
                key={`ext-${idx}`}
                food={food as Food}
                sourceLabel={sourceLabel}
                sourceBadgeClass={sourceBadgeClass}
                isExternal
                onClick={(e) => handleExternalFoodClick(e, food as Food)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Not found CTA */}
      {search.length >= 2 && !loading && searchResults.length === 0 && externalFoods.length === 0 && (
        <div className="empty-state">
          <UtensilsCrossed className="empty-state-icon" />
          <h3 className="empty-state-title">{tr.foods.notFound}</h3>
          <p className="empty-state-desc">
            &quot;{search}&quot; için sonuç bulunamadı
          </p>
          <Link href={`/foods/add?name=${encodeURIComponent(search)}`} className="btn btn-primary">
            <Plus size={16} />
            {tr.foods.notFoundCta}
          </Link>
        </div>
      )}

      {/* Always-visible "not found" link when searching */}
      {search.length >= 2 && !loading && searchResults.length > 0 && (
        <div style={{ textAlign: 'center', marginTop: 'var(--space-4)' }}>
          <Link
            href={`/foods/add?name=${encodeURIComponent(search)}`}
            className="btn btn-ghost"
            style={{ color: 'var(--color-primary-600)' }}
          >
            <Plus size={14} />
            {tr.foods.notFound} {tr.foods.notFoundCta}
          </Link>
        </div>
      )}
    </div>
  );
}

function FoodRow({
  food,
  sourceLabel,
  sourceBadgeClass,
  isExternal,
  onClick,
}: {
  food: Food;
  sourceLabel: (s: string) => string;
  sourceBadgeClass: (s: string) => string;
  isExternal?: boolean;
  onClick?: (e: React.MouseEvent) => void;
}) {
  return (
    <Link
      href={isExternal ? '#' : `/foods/${food.id}`}
      onClick={onClick}
      className="card"
      style={{
        textDecoration: 'none',
        transition: 'all var(--transition-fast)',
      }}
    >
      <div className="card-body flex items-center justify-between" style={{ padding: 'var(--space-3) var(--space-4)' }}>
        <div className="flex items-center gap-3" style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--color-accent-100)',
              color: 'var(--color-accent-600)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <UtensilsCrossed size={16} />
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              className="truncate"
              style={{ fontWeight: 'var(--font-medium)', color: 'var(--text-primary)' }}
            >
              {food.name}
            </div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
              {food.serving_size}{food.serving_unit}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="macro-pills">
            <span className="macro-pill macro-pill-cal">
              <Flame size={10} />
              {food.calories} kcal
            </span>
            <span className="macro-pill macro-pill-p">{food.protein}g P</span>
            <span className="macro-pill macro-pill-c">{food.carbohydrate}g K</span>
            <span className="macro-pill macro-pill-f">{food.fat}g Y</span>
          </div>
          <span className={`badge ${sourceBadgeClass(food.source)}`}>
            {sourceLabel(food.source)}
          </span>
        </div>
      </div>
    </Link>
  );
}
