'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { tr } from '@/lib/strings';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  Users,
  UtensilsCrossed,
  ClipboardList,
  BookTemplate,
  Settings,
  LogOut,
  Menu,
  X,
  Leaf,
  Home,
} from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { href: '/', label: tr.nav.dashboard, icon: <Home size={20} /> },
  { href: '/clients', label: tr.nav.clients, icon: <Users size={20} /> },
  { href: '/foods', label: tr.nav.foods, icon: <UtensilsCrossed size={20} /> },
  { href: '/plans', label: tr.nav.plans, icon: <ClipboardList size={20} /> },
  { href: '/settings', label: tr.nav.settings, icon: <Settings size={20} /> },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userName, setUserName] = useState('');
  const [userInitials, setUserInitials] = useState('');

  useEffect(() => {
    async function fetchUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const name = user.user_metadata?.display_name || user.email || '';
        setUserName(name);
        const parts = name.split(' ');
        setUserInitials(
          parts.length >= 2
            ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
            : name.substring(0, 2).toUpperCase(),
        );
      }
    }
    fetchUser();
  }, [supabase]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  function isActive(href: string) {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  }

  return (
    <div className="dashboard-layout">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="mobile-overlay"
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 'var(--z-modal-backdrop)',
          }}
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, var(--color-primary-400), var(--color-primary-600))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Leaf size={18} color="white" />
          </div>
          <span className="sidebar-logo">
            Dieter<span className="sidebar-logo-dot">.</span>
          </span>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar-link ${isActive(item.href) ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
              style={{ position: 'relative' }}
            >
              <span className="sidebar-link-icon">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">{userInitials || '?'}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="sidebar-user-name">{userName}</div>
              <div className="sidebar-user-role">Diyetisyen</div>
            </div>
            <button
              className="btn btn-ghost btn-icon btn-sm"
              onClick={handleLogout}
              title={tr.common.logout}
              style={{ color: 'var(--color-neutral-400)' }}
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="main-content">
        <div className="topbar">
          <div className="flex items-center gap-3">
            <button
              className="btn btn-ghost btn-icon mobile-menu-btn"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Menu"
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div className="topbar-breadcrumb">
              {navItems.find((item) => isActive(item.href))?.label || tr.nav.dashboard}
            </div>
          </div>
          <div className="topbar-actions">
            {/* Placeholder for future actions */}
          </div>
        </div>

        <div className="content-area">{children}</div>
      </main>
    </div>
  );
}
