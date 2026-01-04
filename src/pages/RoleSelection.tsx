// ============================================
// ROLE SELECTION PAGE
// ============================================

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import Logo from '../components/Logo';

export default function RoleSelection() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading, setActiveRole } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  const handleRoleSelect = async (role: 'influencer' | 'promoter') => {
    const hasRole = user?.roles?.includes(role);

    if (hasRole) {
      // User already has this role - set as active and go to dashboard
      setActiveRole(role);

      // Update in Firestore
      if (user?.uid) {
        await updateDoc(doc(db, 'users', user.uid), {
          activeRole: role,
          lastActiveAt: serverTimestamp(),
        });
      }

      navigate(`/${role}/dashboard`, { replace: true });
    } else {
      // User is adding a new role - go to signup
      navigate(`/signup/${role}`, { replace: true });
    }
  };

  const hasInfluencerRole = user?.roles?.includes('influencer') || false;
  const hasPromoterRole = user?.roles?.includes('promoter') || false;

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
          <Logo size="md" />
          <p className="text-gray-400 pl-2">
            {user?.roles && user.roles.length > 0
              ? 'Add another role to your account'
              : 'Choose your account type'}
          </p>
        </div>

        {/* Welcome Message */}
        <div className="text-center mb-12">
          <h2 className="text-2xl font-semibold text-white mb-2">
            {user?.roles && user.roles.length > 0
              ? `Welcome back, ${user.email?.split('@')[0]}!`
              : `Welcome, ${user?.email?.split('@')[0]}!`}
          </h2>
          <p className="text-gray-400">
            {user?.roles && user.roles.length > 0
              ? 'You can use the same account for both roles'
              : 'How would you like to use our platform?'}
          </p>

          {/* Show existing roles */}
          {user?.roles && user.roles.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {user.roles.filter((role) => role !== 'admin').map((role) => (
                <span
                  key={role}
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    role === 'influencer'
                      ? 'bg-[#00D9FF]/20 text-[#00D9FF] border border-[#00D9FF]/30'
                      : 'bg-[#B8FF00]/20 text-[#B8FF00] border border-[#B8FF00]/30'
                  }`}
                >
                  {role === 'influencer' ? '⭐ Influencer' : '🏢 Promoter'}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Role Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Influencer Card */}
          <button
            onClick={() => handleRoleSelect('influencer')}
            className={`group relative bg-white/5 backdrop-blur-sm rounded-2xl border p-8 text-left transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] ${
              hasInfluencerRole
                ? 'border-[#00D9FF]/30 bg-[#00D9FF]/5'
                : 'border-white/10 hover:border-[#00D9FF]/50 hover:bg-[#00D9FF]/5'
            }`}
          >
            {/* Glow Effect */}
            <div className={`absolute inset-0 bg-gradient-to-br from-[#00D9FF]/20 to-transparent rounded-2xl transition-opacity duration-300 ${
              hasInfluencerRole ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            }`}></div>

            <div className="relative z-10">
              {/* Icon */}
              <div className="w-16 h-16 bg-gradient-to-br from-[#00D9FF] to-[#00D9FF]/50 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                {hasInfluencerRole ? (
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                )}
              </div>

              <h3 className="text-xl font-semibold text-white mb-3">
                {hasInfluencerRole ? 'Influencer (Added)' : "I'm an Influencer"}
              </h3>
              <p className="text-gray-400 mb-6">
                {hasInfluencerRole
                  ? 'Go to your influencer dashboard'
                  : 'Showcase your profile, connect with brands, and grow your business'}
              </p>

              {hasInfluencerRole ? (
                <div className="flex items-center gap-2 text-sm text-[#00D9FF]">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Role active - click to switch
                </div>
              ) : (
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
              )}
            </div>
          </button>

          {/* Promoter Card */}
          <button
            onClick={() => handleRoleSelect('promoter')}
            className={`group relative bg-white/5 backdrop-blur-sm rounded-2xl border p-8 text-left transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] ${
              hasPromoterRole
                ? 'border-[#B8FF00]/30 bg-[#B8FF00]/5'
                : 'border-white/10 hover:border-[#B8FF00]/50 hover:bg-[#B8FF00]/5'
            }`}
          >
            {/* Glow Effect */}
            <div className={`absolute inset-0 bg-gradient-to-br from-[#B8FF00]/20 to-transparent rounded-2xl transition-opacity duration-300 ${
              hasPromoterRole ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            }`}></div>

            <div className="relative z-10">
              {/* Icon */}
              <div className="w-16 h-16 bg-gradient-to-br from-[#B8FF00] to-[#B8FF00]/50 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                {hasPromoterRole ? (
                  <svg className="w-8 h-8 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-8 h-8 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                )}
              </div>

              <h3 className="text-xl font-semibold text-white mb-3">
                {hasPromoterRole ? 'Promoter (Added)' : "I'm a Promoter"}
              </h3>
              <p className="text-gray-400 mb-6">
                {hasPromoterRole
                  ? 'Go to your promoter dashboard'
                  : 'Discover influencers, launch campaigns, and grow your brand'}
              </p>

              {hasPromoterRole ? (
                <div className="flex items-center gap-2 text-sm text-[#B8FF00]">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Role active - click to switch
                </div>
              ) : (
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
              )}
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
