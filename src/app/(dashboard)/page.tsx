import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { tr } from '@/lib/strings';
import { Users, UtensilsCrossed, ClipboardList, BookTemplate } from 'lucide-react';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch summary counts
  const [clientsRes, plansRes, templatesRes] = await Promise.all([
    supabase.from('clients').select('id', { count: 'exact', head: true }),
    supabase.from('diet_plans').select('id', { count: 'exact', head: true }).eq('is_template', false),
    supabase.from('diet_plans').select('id', { count: 'exact', head: true }).eq('is_template', true),
  ]);

  const stats = [
    {
      label: tr.nav.clients,
      count: clientsRes.count ?? 0,
      icon: <Users size={24} />,
      href: '/clients',
      color: 'var(--color-primary-500)',
      bgColor: 'var(--color-primary-50)',
    },
    {
      label: tr.nav.plans,
      count: plansRes.count ?? 0,
      icon: <ClipboardList size={24} />,
      href: '/plans',
      color: 'var(--color-info-500)',
      bgColor: 'var(--color-info-50)',
    },
    {
      label: tr.nav.templates,
      count: templatesRes.count ?? 0,
      icon: <BookTemplate size={24} />,
      href: '/templates',
      color: 'var(--color-accent-500)',
      bgColor: 'var(--color-accent-50)',
    },
  ];

  const displayName = user.user_metadata?.display_name || user.email;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            Hoş geldiniz, {displayName?.split(' ')[0]}!
          </h1>
          <p className="page-subtitle">
            {tr.common.appDescription}
          </p>
        </div>
      </div>

      <div className="content-grid content-grid-3" style={{ marginBottom: 'var(--space-8)' }}>
        {stats.map((stat) => (
          <a
            key={stat.href}
            href={stat.href}
            className="card card-interactive"
            style={{ textDecoration: 'none' }}
          >
            <div className="card-body">
              <div className="flex items-center gap-4">
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 'var(--radius-lg)',
                    backgroundColor: stat.bgColor,
                    color: stat.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {stat.icon}
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 'var(--text-2xl)',
                      fontWeight: 'var(--font-bold)',
                      color: 'var(--text-primary)',
                      lineHeight: 1,
                    }}
                  >
                    {stat.count}
                  </div>
                  <div
                    style={{
                      fontSize: 'var(--text-sm)',
                      color: 'var(--text-secondary)',
                      marginTop: 'var(--space-1)',
                    }}
                  >
                    {stat.label}
                  </div>
                </div>
              </div>
            </div>
          </a>
        ))}
      </div>

      {/* Quick actions */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Hızlı İşlemler</h2>
        </div>
        <div className="card-body">
          <div className="flex gap-3 flex-wrap">
            <a href="/clients" className="btn btn-primary">
              <Users size={16} />
              {tr.clients.addClient}
            </a>
            <a href="/plans" className="btn btn-secondary">
              <ClipboardList size={16} />
              {tr.plans.newPlan}
            </a>
            <a href="/foods/add" className="btn btn-secondary">
              <UtensilsCrossed size={16} />
              {tr.foods.addManual}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
