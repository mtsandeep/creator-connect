// ============================================
// ADMIN LAYOUT WITH SIDEBAR
// ============================================

import { Outlet, NavLink, useLocation, Link } from 'react-router-dom';
import { useAuthStore, useUIStore, useIsImpersonating } from '../../stores';
import { useSignOut } from '../../hooks/useAuth';
import ImpersonationBanner from '../admin/ImpersonationBanner';
import {
  HiChartBar,
  HiUsers,
  HiBuildingOffice,
  HiShieldCheck,
  HiCog,
  HiArrowRightOnRectangle,
} from 'react-icons/hi2';

const navigation = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: HiChartBar },
  { name: 'Influencers', href: '/admin/influencers', icon: HiUsers },
  { name: 'Promoters', href: '/admin/promoters', icon: HiBuildingOffice },
  { name: 'Verifications', href: '/admin/verifications', icon: HiShieldCheck },
  { name: 'Settings', href: '/admin/settings', icon: HiCog },
];

export default function AdminLayout() {
  const { user } = useAuthStore();
  const { sidebarOpen, setSidebarOpen } = useUIStore();
  const { signOut } = useSignOut();
  const location = useLocation();
  const isImpersonating = useIsImpersonating();

  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-[#0f0f1a] border-r border-white/10 transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex flex-col gap-2 px-6 py-4 border-b border-white/10">
            <div className="flex items-center justify-between">
              <Link to="/" className="text-xl font-bold text-white hover:opacity-80 transition-opacity">
                Creator<span className="text-[#00D9FF]">Connect</span>
              </Link>
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden text-gray-400 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded w-fit">ADMIN</span>
          </div>

          {/* User Profile Summary */}
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-white font-bold">
                A
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user?.email}
                </p>
                <p className="text-xs text-red-400 truncate">
                  Administrator
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-red-500/10 text-red-400'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.name}
                </NavLink>
              );
            })}
          </nav>

          {/* Sign Out */}
          <div className="p-4 border-t border-white/10">
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              <HiArrowRightOnRectangle className="w-5 h-5" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar (Mobile) */}
        <header className="lg:hidden flex items-center justify-between h-16 px-4 border-b border-white/10 bg-[#0f0f1a]">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-gray-400 hover:text-white"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <Link to="/" className="text-lg font-bold text-white hover:opacity-80 transition-opacity">
            Creator<span className="text-[#00D9FF]">Connect</span>
          </Link>
          <div className="w-6"></div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          {isImpersonating && <ImpersonationBanner />}
          <Outlet />
        </main>
      </div>
    </div>
  );
}
