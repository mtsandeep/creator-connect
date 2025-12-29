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
              <a href="#creators" className="text-gray-400 hover:text-white transition-colors">
                For Creators
              </a>
              <a href="#promoters" className="text-gray-400 hover:text-white transition-colors">
                For Promoters
              </a>
              <a href="#how-it-works" className="text-gray-400 hover:text-white transition-colors">
                How It Works
              </a>
            </nav>

            {/* CTA Buttons */}
            <div className="flex items-center gap-4">
              {isAuthenticated && user?.profileComplete && user?.activeRole ? (
                <>
                  <Link
                    to={user.activeRole === 'influencer' ? '/influencer/dashboard' : '/promoter/dashboard'}
                    className="bg-[#00D9FF] hover:bg-[#00D9FF]/80 text-gray-900 font-semibold px-5 py-2 rounded-xl transition-colors"
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={() => useAuthStore.getState().logout()}
                    className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Sign Out
                  </button>
                </>
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
              The platform that connects creators with brands. Zero fees, secure payments, and genuine collaborations—so you can focus on doing what you love.
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
          </div>
        </div>
      </section>

      {/* For Creators Section */}
      <section id="creators" className="py-24 bg-[#0f0f1a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Built for creators who deserve better
            </h3>
            <p className="text-gray-400 text-lg">
              Finally, a platform that puts you first—no hidden fees, no payment worries, just real opportunities
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Value 1 */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 hover:border-[#00D9FF]/50 transition-colors">
              <div className="w-12 h-12 bg-[#00D9FF]/20 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-[#00D9FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h4 className="text-xl font-semibold text-white mb-2">Keep 100% of Your Earnings</h4>
              <p className="text-gray-400">
                Zero platform fees, always. Every dollar you make is yours to keep.
              </p>
            </div>

            {/* Value 2 */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 hover:border-[#00D9FF]/50 transition-colors">
              <div className="w-12 h-12 bg-[#00D9FF]/20 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-[#00D9FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h4 className="text-xl font-semibold text-white mb-2">Never Worry About Getting Paid</h4>
              <p className="text-gray-400">
                Escrow protection ensures you always receive what you've earned—no more chasing payments.
              </p>
            </div>

            {/* Value 3 */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 hover:border-[#00D9FF]/50 transition-colors">
              <div className="w-12 h-12 bg-[#00D9FF]/20 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-[#00D9FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h4 className="text-xl font-semibold text-white mb-2">Find Real Collaborations</h4>
              <p className="text-gray-400">
                Connect with genuine brands looking for creators like you—not scammers or time-wasters.
              </p>
            </div>

            {/* Value 4 */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 hover:border-[#00D9FF]/50 transition-colors">
              <div className="w-12 h-12 bg-[#00D9FF]/20 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-[#00D9FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
              <h4 className="text-xl font-semibold text-white mb-2">Build Your Reputation</h4>
              <p className="text-gray-400">
                Verified reviews and ratings showcase your credibility and attract better opportunities.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* For Promoters Section */}
      <section id="promoters" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-3xl md:text-4xl font-bold text-white mb-6">
                For Promoters & Brands
              </h3>
              <p className="text-gray-400 text-lg mb-8">
                Discover genuine influencers with verified ratings and credibility metrics. Partner with authentic creators who deliver real results.
              </p>

              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-[#B8FF00]/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                    <svg className="w-4 h-4 text-[#B8FF00]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-1">Verified Credibility</h4>
                    <p className="text-gray-400">Access ratings and reviews from real collaborations</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-[#B8FF00]/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                    <svg className="w-4 h-4 text-[#B8FF00]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-1">Authentic Engagement</h4>
                    <p className="text-gray-400">Find influencers with real audiences and genuine reach</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-[#B8FF00]/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                    <svg className="w-4 h-4 text-[#B8FF00]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-1">Protected Partnerships</h4>
                    <p className="text-gray-400">Escrow system ensures safe transactions for both parties</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8">
              <h4 className="text-2xl font-bold text-white mb-4">Join as a Promoter</h4>
              <p className="text-gray-400 mb-6">
                Start finding the perfect influencers for your brand today.
              </p>
              <Link
                to="/login"
                className="inline-block w-full bg-[#B8FF00] hover:bg-[#B8FF00]/80 text-gray-900 font-semibold px-6 py-3 rounded-xl transition-colors text-center"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Community Section */}
      <section className="py-24 bg-[#0f0f1a]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="w-16 h-16 bg-[#00D9FF]/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-[#00D9FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Building a Trusted Community
          </h3>
          <p className="text-gray-400 text-lg mb-4">
            We're building a community where creators and promoters do business with ease and confidence.
          </p>
          <p className="text-gray-400 text-lg">
            With verified profiles, transparent reviews, and secure payments, you can focus on what matters—creating amazing content and growing your brand.
          </p>
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
              Get started in minutes and collaborate with confidence
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-[#00D9FF] rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-gray-900">
                1
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">Create Your Profile</h4>
              <p className="text-gray-400 text-sm">Sign up and get verified to build your credibility</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-[#00D9FF] rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-gray-900">
                2
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">Find Opportunities</h4>
              <p className="text-gray-400 text-sm">Browse projects or get discovered by brands</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-[#B8FF00] rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-gray-900">
                3
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">Work with Escrow</h4>
              <p className="text-gray-400 text-sm">Agree on terms with payment protection for both sides</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-[#B8FF00] rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-gray-900">
                4
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">Get Paid Securely</h4>
              <p className="text-gray-400 text-sm">Complete the work and receive your payment—guaranteed</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-[#0f0f1a]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to collaborate with confidence?
          </h3>
          <p className="text-gray-400 text-lg mb-8">
            Join a community built on trust, transparency, and fair dealings for creators and promoters alike.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/login"
              className="w-full sm:w-auto bg-[#00D9FF] hover:bg-[#00D9FF]/80 text-gray-900 font-semibold px-8 py-4 rounded-xl transition-colors"
            >
              Start as Creator
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto bg-[#B8FF00] hover:bg-[#B8FF00]/80 text-gray-900 font-semibold px-8 py-4 rounded-xl transition-colors"
            >
              Start as Promoter
            </Link>
          </div>
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
