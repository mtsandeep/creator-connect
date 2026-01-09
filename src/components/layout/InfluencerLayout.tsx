// ============================================
// INFLUENCER LAYOUT WITH SIDEBAR
// ============================================

import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useAuthStore, useUIStore, useIsImpersonating } from '../../stores';
import { useSignOut } from '../../hooks/useAuth';
import ImpersonationBanner from '../admin/ImpersonationBanner';
import Logo from '../Logo';
import {
  HiHome,
  HiDocumentText,
  HiChatBubbleLeftRight,
  HiCurrencyDollar,
  HiUser,
  HiBuildingOffice,
  HiCog,
  HiLink,
} from 'react-icons/hi2';

const navigation = [
  { name: 'Dashboard', href: '/influencer/dashboard', icon: HiHome },
  { name: 'Proposals', href: '/influencer/proposals', icon: HiDocumentText },
  { name: 'Messages', href: '/influencer/messages', icon: HiChatBubbleLeftRight },
  { name: 'Earnings', href: '/influencer/earnings', icon: HiCurrencyDollar },
  { name: 'Profile', href: '/influencer/profile', icon: HiUser },
  { name: 'Business Profile', href: '/influencer/business-profile', icon: HiBuildingOffice },
  { name: 'Link-in Bio', href: '/influencer/link-bio', icon: HiLink },
  { name: 'Settings', href: '/influencer/settings', icon: HiCog },
];

export default function InfluencerLayout() {
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
          <div className="flex items-center justify-between h-16 px-4 border-b border-white/10">
            <Logo size="md" onClick={(e) => {
              e.preventDefault();
              window.location.href = '/';
            }} />
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-400 hover:text-white pl-2"
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
                src={user?.influencerProfile?.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.uid}`}
                alt="Profile"
                className="w-10 h-10 rounded-full bg-white/10"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user?.influencerProfile?.displayName || 'User'}
                </p>
                <p className="text-xs text-gray-400 truncate">
                  {user?.influencerProfile?.username || '@username'}
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
                      ? 'bg-[#00D9FF]/10 text-[#00D9FF]'
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
          <Logo size="sm" />
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
