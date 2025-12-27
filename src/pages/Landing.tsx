// ============================================
// LANDING PAGE
// ============================================

import { Link } from 'react-router-dom';
import { useAuthStore } from '../stores';

export default function Landing() {
  const { isAuthenticated, user } = useAuthStore();

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <header className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex-shrink-0">
              <h1 className="text-2xl font-bold text-white">
                Creator<span className="text-[#00D9FF]">Connect</span>
              </h1>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-400 hover:text-white transition-colors">
                Features
              </a>
              <a href="#how-it-works" className="text-gray-400 hover:text-white transition-colors">
                How It Works
              </a>
              <a href="#pricing" className="text-gray-400 hover:text-white transition-colors">
                Pricing
              </a>
            </nav>

            {/* CTA Buttons */}
            <div className="flex items-center gap-4">
              {isAuthenticated && user?.profileComplete && user?.activeRole ? (
                <Link
                  to={user.activeRole === 'influencer' ? '/influencer/dashboard' : '/promoter/dashboard'}
                  className="bg-[#00D9FF] hover:bg-[#00D9FF]/80 text-gray-900 font-semibold px-5 py-2 rounded-xl transition-colors"
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/login"
                    className="bg-[#00D9FF] hover:bg-[#00D9FF]/80 text-gray-900 font-semibold px-5 py-2 rounded-xl transition-colors"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#00D9FF]/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#B8FF00]/20 rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="text-center">
            <h2 className="text-5xl md:text-7xl font-bold text-white mb-6">
              Connect.<span className="text-[#00D9FF]">Collaborate.</span>Grow.
            </h2>
            <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
              The marketplace that connects creators with brands. Create meaningful partnerships,
              manage campaigns, and grow your business.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/login"
                className="w-full sm:w-auto bg-[#00D9FF] hover:bg-[#00D9FF]/80 text-gray-900 font-semibold px-8 py-4 rounded-xl transition-colors"
              >
                I'm a Creator
              </Link>
              <Link
                to="/login"
                className="w-full sm:w-auto bg-[#B8FF00] hover:bg-[#B8FF00]/80 text-gray-900 font-semibold px-8 py-4 rounded-xl transition-colors"
              >
                I'm a Promoter
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 mt-16 max-w-3xl mx-auto">
              <div>
                <div className="text-3xl font-bold text-white">10K+</div>
                <div className="text-gray-400">Creators</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-white">5K+</div>
                <div className="text-gray-400">Brands</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-white">25K+</div>
                <div className="text-gray-400">Campaigns</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-[#0f0f1a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Everything you need to succeed
            </h3>
            <p className="text-gray-400 text-lg">
              Powerful tools for influencers and brands to create successful partnerships
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 hover:border-[#00D9FF]/50 transition-colors">
              <div className="w-12 h-12 bg-[#00D9FF]/20 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-[#00D9FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h4 className="text-xl font-semibold text-white mb-2">Smart Discovery</h4>
              <p className="text-gray-400">
                Find the perfect influencers for your brand with advanced filters and search
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 hover:border-[#00D9FF]/50 transition-colors">
              <div className="w-12 h-12 bg-[#00D9FF]/20 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-[#00D9FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h4 className="text-xl font-semibold text-white mb-2">Real-time Chat</h4>
              <p className="text-gray-400">
                Communicate seamlessly with built-in messaging and file sharing
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 hover:border-[#00D9FF]/50 transition-colors">
              <div className="w-12 h-12 bg-[#00D9FF]/20 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-[#00D9FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h4 className="text-xl font-semibold text-white mb-2">Secure Payments</h4>
              <p className="text-gray-400">
                Protected transactions with escrow system and flexible payment schedules
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 hover:border-[#B8FF00]/50 transition-colors">
              <div className="w-12 h-12 bg-[#B8FF00]/20 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-[#B8FF00]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h4 className="text-xl font-semibold text-white mb-2">Analytics Dashboard</h4>
              <p className="text-gray-400">
                Track your campaigns, earnings, and performance all in one place
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 hover:border-[#B8FF00]/50 transition-colors">
              <div className="w-12 h-12 bg-[#B8FF00]/20 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-[#B8FF00]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
              <h4 className="text-xl font-semibold text-white mb-2">Reviews & Ratings</h4>
              <p className="text-gray-400">
                Build trust with transparent reviews and rating system
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 hover:border-[#B8FF00]/50 transition-colors">
              <div className="w-12 h-12 bg-[#B8FF00]/20 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-[#B8FF00]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h4 className="text-xl font-semibold text-white mb-2">0% Platform Fees</h4>
              <p className="text-gray-400">
                Keep 100% of your earnings - we don't charge any commission
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">
              How it works
            </h3>
            <p className="text-gray-400 text-lg">
              Get started in minutes, not days
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-[#00D9FF] rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-gray-900">
                1
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">Sign Up</h4>
              <p className="text-gray-400 text-sm">Create your profile with Google authentication</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-[#00D9FF] rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-gray-900">
                2
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">Discover</h4>
              <p className="text-gray-400 text-sm">Browse influencers or receive collaboration requests</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-[#B8FF00] rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-gray-900">
                3
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">Collaborate</h4>
              <p className="text-gray-400 text-sm">Discuss terms, share files, and track progress</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-[#B8FF00] rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-gray-900">
                4
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">Get Paid</h4>
              <p className="text-gray-400 text-sm">Secure payments with escrow protection</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-[#0f0f1a]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to grow your influence?
          </h3>
          <p className="text-gray-400 text-lg mb-8">
            Join thousands of creators and promoters already collaborating on our platform
          </p>
          <Link
            to="/login"
            className="inline-block bg-[#00D9FF] hover:bg-[#00D9FF]/80 text-gray-900 font-semibold px-8 py-4 rounded-xl transition-colors"
          >
            Get Started for Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-2xl font-bold text-white">
              Creator<span className="text-[#00D9FF]">Connect</span>
            </div>
            <div className="text-gray-400 text-sm">
              © {new Date().getFullYear()} CreatorConnect. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
