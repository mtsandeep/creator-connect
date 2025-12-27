// ============================================
// ROLE SELECTION PAGE
// ============================================

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores';

export default function RoleSelection() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  const handleRoleSelect = async (role: 'influencer' | 'promoter') => {
    navigate(`/signup/${role}`, { replace: true });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00D9FF]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] p-4">
      <div className="w-full max-w-4xl">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Creator<span className="text-[#00D9FF]">Connect</span></h1>
          <p className="text-gray-400">Choose your account type</p>
        </div>

        {/* Welcome Message */}
        <div className="text-center mb-12">
          <h2 className="text-2xl font-semibold text-white mb-2">
            Welcome, {user?.email?.split('@')[0]}!
          </h2>
          <p className="text-gray-400">How would you like to use our platform?</p>
        </div>

        {/* Role Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Influencer Card */}
          <button
            onClick={() => handleRoleSelect('influencer')}
            className="group relative bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8 text-left transition-all duration-300 hover:border-[#00D9FF]/50 hover:bg-[#00D9FF]/5 hover:scale-[1.02] active:scale-[0.98]"
          >
            {/* Glow Effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#00D9FF]/20 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

            <div className="relative z-10">
              {/* Icon */}
              <div className="w-16 h-16 bg-gradient-to-br from-[#00D9FF] to-[#00D9FF]/50 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>

              <h3 className="text-xl font-semibold text-white mb-3">I'm an Influencer</h3>
              <p className="text-gray-400 mb-6">
                Showcase your profile, connect with brands, and grow your business
              </p>

              <ul className="space-y-3">
                <li className="flex items-center gap-2 text-sm text-gray-400">
                  <svg className="w-4 h-4 text-[#00D9FF]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Create your influencer profile
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-400">
                  <svg className="w-4 h-4 text-[#00D9FF]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Receive collaboration proposals
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-400">
                  <svg className="w-4 h-4 text-[#00D9FF]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Manage earnings & payments
                </li>
              </ul>
            </div>
          </button>

          {/* Promoter Card */}
          <button
            onClick={() => handleRoleSelect('promoter')}
            className="group relative bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8 text-left transition-all duration-300 hover:border-[#B8FF00]/50 hover:bg-[#B8FF00]/5 hover:scale-[1.02] active:scale-[0.98]"
          >
            {/* Glow Effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#B8FF00]/20 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

            <div className="relative z-10">
              {/* Icon */}
              <div className="w-16 h-16 bg-gradient-to-br from-[#B8FF00] to-[#B8FF00]/50 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>

              <h3 className="text-xl font-semibold text-white mb-3">I'm a Promoter</h3>
              <p className="text-gray-400 mb-6">
                Discover influencers, launch campaigns, and grow your brand
              </p>

              <ul className="space-y-3">
                <li className="flex items-center gap-2 text-sm text-gray-400">
                  <svg className="w-4 h-4 text-[#B8FF00]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Browse & discover influencers
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-400">
                  <svg className="w-4 h-4 text-[#B8FF00]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Send collaboration proposals
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-400">
                  <svg className="w-4 h-4 text-[#B8FF00]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Manage campaigns & payments
                </li>
              </ul>
            </div>
          </button>
        </div>

        {/* Back Button */}
        <div className="mt-8 text-center">
          <button
            onClick={() => navigate('/login')}
            className="text-gray-500 hover:text-white transition-colors text-sm"
          >
            ← Back to login
          </button>
        </div>
      </div>
    </div>
  );
}
