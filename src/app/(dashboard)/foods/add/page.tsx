'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { tr } from '@/lib/strings';
import AddFoodForm from '@/components/foods/AddFoodForm';

export default function AddFoodPage() {
  const searchParams = useSearchParams();
  const prefillName = searchParams.get('name') || '';
  const router = useRouter();

  return (
    <div>
      <Link href="/foods" className="btn btn-ghost btn-sm" style={{ marginBottom: 'var(--space-4)' }}>
        <ArrowLeft size={16} />
        {tr.foods.title}
      </Link>

      <div className="page-header">
        <h1 className="page-title">{tr.foods.addManual}</h1>
      </div>

      <div className="card">
        <div className="card-body">
          <AddFoodForm
            initialName={prefillName}
            onSuccess={() => router.push('/foods')}
            onCancel={() => router.push('/foods')}
          />
        </div>
      </div>
    </div>
  );
}
