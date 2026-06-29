'use client';
import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { deleteFood } from '@/lib/actions/food';
import { useRouter } from 'next/navigation';
import { tr } from '@/lib/strings';

export function DeleteFoodButton({ id }: { id: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    if (!confirm(tr.foods.deleteConfirm || 'Bu yiyeceği silmek istediğinize emin misiniz?')) return;
    setLoading(true);
    const res = await deleteFood(id);
    if (!res.success) {
      alert(res.error);
      setLoading(false);
    } else {
      router.push('/foods');
      router.refresh();
    }
  }

  return (
    <button className="btn btn-ghost btn-sm text-danger" onClick={handleDelete} disabled={loading} style={{ color: 'var(--color-danger-600)' }}>
      {loading ? <span className="spinner spinner-sm" /> : <Trash2 size={16} />}
      {tr.foods.deleteFood}
    </button>
  );
}
