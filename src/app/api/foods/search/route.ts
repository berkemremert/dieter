import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { searchFatSecret, searchUSDA } from '@/lib/services/food-search';
import type { Food, FoodInsert } from '@/lib/types/database';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q')?.trim();
  const category = searchParams.get('category');

  if (!query || query.length < 2) {
    return NextResponse.json({ local: [], external: [] });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 1. Search local database first
  let localQuery = supabase
    .from('foods')
    .select('*')
    .ilike('name', `%${query}%`)
    .order('name')
    .limit(15);

  if (category) {
    localQuery = localQuery.eq('category_id', category);
  }

  const { data: localResults } = await localQuery;
  const local: Food[] = localResults ?? [];

  // 2. If local results are sparse, search external APIs
  let external: FoodInsert[] = [];

  if (local.length < 5) {
    // Get existing external_ids to avoid showing duplicates
    const existingExternalIds = new Set(
      local
        .filter((f) => f.external_id)
        .map((f) => `${f.source}:${f.external_id}`),
    );

    // Fan out to both APIs in parallel
    const [fatSecretResults, usdaResults] = await Promise.all([
      searchFatSecret(query).catch(() => []),
      searchUSDA(query).catch(() => []),
    ]);

    // Combine and deduplicate
    const combined = [...fatSecretResults, ...usdaResults];
    external = combined.filter(
      (f) => !existingExternalIds.has(`${f.source}:${f.external_id}`),
    );

    // Cache external results asynchronously (don't block the response)
    cacheExternalResults(external).catch(console.error);
  }

  return NextResponse.json({ local, external });
}

/**
 * Cache external food results into the local database for future searches.
 * Uses upsert with the (source, external_id) unique constraint.
 */
async function cacheExternalResults(foods: FoodInsert[]) {
  if (foods.length === 0) return;

  const { createAdminClient } = await import('@/lib/supabase/admin');
  const supabase = createAdminClient();

  // Use service role or just insert as the current user
  // Foods cached from external sources have no dietitian_id (global)
  for (const food of foods) {
    try {
      await supabase
        .from('foods')
        .upsert(
          {
            ...food,
            dietitian_id: null, // Global food
          },
          {
            onConflict: 'source,external_id',
            ignoreDuplicates: true,
          },
        );
    } catch (error) {
      console.error('Failed to cache food:', food.name, error);
    }
  }
}
