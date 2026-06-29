import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { tr } from '@/lib/strings';
import Link from 'next/link';
import {
  ArrowLeft,
  ClipboardList,
  Plus,
  Calendar,
  Ruler,
  Weight,
  Target,
} from 'lucide-react';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ClientDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: client } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .eq('dietitian_id', user.id)
    .single();

  if (!client) notFound();

  const { data: plans } = await supabase
    .from('diet_plans')
    .select('*')
    .eq('client_id', id)
    .order('updated_at', { ascending: false });

  function calculateAge(birthdate: string): number {
    const today = new Date();
    const birth = new Date(birthdate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  }

  return (
    <div>
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <Link href="/clients" className="btn btn-ghost btn-sm" style={{ marginBottom: 'var(--space-4)' }}>
          <ArrowLeft size={16} />
          {tr.nav.clients}
        </Link>

        <div className="page-header" style={{ marginBottom: 0 }}>
          <div className="flex items-center gap-4">
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--color-primary-100)',
                color: 'var(--color-primary-600)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 'var(--text-xl)',
                fontWeight: 'var(--font-bold)',
                flexShrink: 0,
              }}
            >
              {client.name
                .split(' ')
                .map((w: string) => w[0])
                .join('')
                .toUpperCase()
                .slice(0, 2)}
            </div>
            <div>
              <h1 className="page-title">{client.name}</h1>
              {client.goal && (
                <p className="page-subtitle flex items-center gap-1">
                  <Target size={14} />
                  {client.goal}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Client info cards */}
      <div className="content-grid content-grid-4" style={{ marginBottom: 'var(--space-6)' }}>
        {client.birthdate && (
          <div className="card">
            <div className="card-body flex items-center gap-3">
              <Calendar size={20} style={{ color: 'var(--color-info-500)' }} />
              <div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                  {tr.clients.age}
                </div>
                <div style={{ fontWeight: 'var(--font-semibold)' }}>
                  {calculateAge(client.birthdate)} yaş
                </div>
              </div>
            </div>
          </div>
        )}
        {client.height_cm && (
          <div className="card">
            <div className="card-body flex items-center gap-3">
              <Ruler size={20} style={{ color: 'var(--color-accent-500)' }} />
              <div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                  {tr.clients.height}
                </div>
                <div style={{ fontWeight: 'var(--font-semibold)' }}>{client.height_cm} cm</div>
              </div>
            </div>
          </div>
        )}
        {client.weight_kg && (
          <div className="card">
            <div className="card-body flex items-center gap-3">
              <Weight size={20} style={{ color: 'var(--color-success-500)' }} />
              <div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                  {tr.clients.weight}
                </div>
                <div style={{ fontWeight: 'var(--font-semibold)' }}>{client.weight_kg} kg</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Notes */}
      {client.notes && (
        <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
          <div className="card-header">
            <h2 className="card-title">{tr.clients.notes}</h2>
          </div>
          <div className="card-body">
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>
              {client.notes}
            </p>
          </div>
        </div>
      )}

      {/* Plans */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">{tr.nav.plans}</h2>
          <Link href={`/plans?client=${id}`} className="btn btn-primary btn-sm">
            <Plus size={14} />
            {tr.plans.newPlanForClient}
          </Link>
        </div>
        <div className="card-body">
          {!plans || plans.length === 0 ? (
            <div className="empty-state" style={{ padding: 'var(--space-8)' }}>
              <ClipboardList className="empty-state-icon" />
              <p className="empty-state-desc">{tr.clients.noPlan}</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {plans.map((plan) => (
                <Link
                  key={plan.id}
                  href={`/plans/${plan.id}`}
                  className="flex items-center justify-between"
                  style={{
                    padding: 'var(--space-3) var(--space-4)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                    textDecoration: 'none',
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 'var(--font-medium)', color: 'var(--text-primary)' }}>
                      {plan.title}
                    </div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                      {new Date(plan.updated_at).toLocaleDateString('tr-TR')}
                    </div>
                  </div>
                  <span className="badge badge-primary">
                    <ClipboardList size={12} />
                    Plan
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
