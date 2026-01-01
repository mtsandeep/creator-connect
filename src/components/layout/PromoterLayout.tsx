// ============================================
// PROMOTER LAYOUT WITH SIDEBAR
// ============================================

import { Outlet, NavLink, useLocation, Link } from 'react-router-dom';
import { useAuthStore, useUIStore, useIsImpersonating } from '../../stores';
import { useSignOut } from '../../hooks/useAuth';
import ImpersonationBanner from '../admin/ImpersonationBanner';
import {
  HiChartBar,
  HiMagnifyingGlass,
  HiDocumentText,
  HiChatBubbleLeftRight,
  HiBuildingOffice,
  HiCog,
} from 'react-icons/hi2';

const navigation = [
  { name: 'Dashboard', href: '/promoter/dashboard', icon: HiChartBar },
  { name: 'Browse', href: '/promoter/browse', icon: HiMagnifyingGlass },
  { name: 'Proposals', href: '/promoter/proposals', icon: HiDocumentText },
  { name: 'Messages', href: '/promoter/messages', icon: HiChatBubbleLeftRight },
  { name: 'Profile', href: '/promoter/profile', icon: HiBuildingOffice },
  { name: 'Settings', href: '/promoter/settings', icon: HiCog },
];

export default function PromoterLayout() {
  const { user } = useAuthStore();
  const { sidebarOpen, setSidebarOpen } = useUIStore();
  const isImpersonating = useIsImpersonating();
  const { signOut } = useSignOut();
  const location = useLocation();

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
          <div className="flex items-center justify-between h-16 px-6 border-b border-white/10">
            <Link to="/" className="text-xl font-black tracking-tighter text-white hover:opacity-80 transition-opacity">
              CREATOR<span className="text-[#B8FF00]">CONNECT</span>
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

          {/* User Profile Summary */}
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <img
                src={user?.promoterProfile?.logo || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.promoterProfile?.name || 'Brand'}`}
                alt="Logo"
                className="w-10 h-10 rounded-full bg-white/10"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user?.promoterProfile?.name || 'Brand'}
                </p>
                <p className="text-xs text-gray-400 truncate">
                  {user?.promoterProfile?.type === 'agency' ? 'Agency' : 'Brand'}
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
                      ? 'bg-[#B8FF00]/10 text-[#B8FF00]'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.name}
                </NavLink>
              );
            })}
          </nav>

          {/* User Rating */}
          {user && (user.totalReviews ?? 0) > 0 && (
            <div className="p-4 border-t border-white/10">
              <div className="flex items-center gap-2">
                <span className="text-yellow-400">⭐</span>
                <span className="text-white font-medium">{(user.avgRating || 0).toFixed(1)}</span>
                <span className="text-gray-400 text-sm">({user.totalReviews} reviews)</span>
              </div>
            </div>
          )}

          {/* Sign Out */}
          <div className="p-4 border-t border-white/10">
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
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
          <Link to="/" className="text-lg font-black tracking-tighter text-white hover:opacity-80 transition-opacity">
            CREATOR<span className="text-[#B8FF00]">CONNECT</span>
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
