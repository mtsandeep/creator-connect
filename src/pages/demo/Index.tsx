// ============================================
// DEMO HUB PAGE
// ============================================

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Logo from '../../components/Logo';
import { demoFlows, type DemoFlow } from '../../data/demoData';

type FilterType = 'all' | 'influencer' | 'brand';

const filterButtons: { label: string; value: FilterType }[] = [
  { label: 'All Flows', value: 'all' },
  { label: 'For Influencers', value: 'influencer' },
  { label: 'For Brands', value: 'brand' },
];

function filterFlows(flows: DemoFlow[], filter: FilterType): DemoFlow[] {
  if (filter === 'all') return flows;
  return flows.filter((flow) => flow.targetAudience === filter || flow.targetAudience === 'both');
}

export default function DemoIndex() {
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const filteredFlows = filterFlows(demoFlows, activeFilter);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <Logo size="lg" />
          </Link>
          <div className="flex items-center gap-4">
            <span className="px-3 py-1 bg-[#00D9FF]/20 text-[#00D9FF] text-xs font-bold uppercase tracking-wider rounded-full">
              Demo Mode
            </span>
            <Link
              to="/"
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <span className="inline-block px-4 py-2 bg-gradient-to-r from-[#00D9FF]/20 to-[#B8FF00]/20 border border-white/10 rounded-full text-sm font-semibold text-gray-300">
              Interactive Platform Tours
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-black mb-6 leading-tight"
          >
            See How <span className="text-white font-normal" style={{ fontFamily: 'Inter, sans-serif' }}>Col</span><span className="bg-gradient-to-r from-[#00D9FF] to-[#B8FF00] bg-clip-text text-transparent font-black" style={{ fontFamily: 'Inter, sans-serif' }}>Loved</span> Works
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-gray-400 max-w-2xl mx-auto mb-12"
          >
            Explore our platform through interactive demos. Choose a flow that matches your role and see the complete journey.
          </motion.p>
        </div>
      </section>

      {/* Demo Flows Grid */}
      <section className="pb-24 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Filter Tabs */}
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {filterButtons.map((btn) => (
              <button
                key={btn.value}
                onClick={() => setActiveFilter(btn.value)}
                className={`px-4 py-2 text-sm font-bold rounded-full transition-colors cursor-pointer ${
                  activeFilter === btn.value
                    ? 'bg-white text-black'
                    : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>

          {/* Flow Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFlows.map((flow, index) => (
              <motion.div
                key={flow.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * (index + 1) }}
              >
                {flow.comingSoon ? (
                  <div className="block h-full group cursor-not-allowed">
                    <div className="h-full bg-white/5 border border-white/10 rounded-2xl p-6 relative overflow-hidden">
                      {/* Coming Soon Overlay */}
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                        <span className="px-4 py-2 bg-yellow-500/20 text-yellow-400 text-sm font-bold rounded-full border border-yellow-500/30">
                          Coming Soon
                        </span>
                      </div>

                      {/* Icon & Badge */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="text-4xl opacity-50">{flow.icon}</div>
                        <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full ${
                          flow.targetAudience === 'brand'
                            ? 'bg-[#B8FF00]/20 text-[#B8FF00]'
                            : flow.targetAudience === 'influencer'
                            ? 'bg-[#00D9FF]/20 text-[#00D9FF]'
                            : 'bg-purple-500/20 text-purple-400'
                        }`}>
                          {flow.targetAudience === 'brand' ? 'Brand' : flow.targetAudience === 'influencer' ? 'Influencer' : 'Both'}
                        </span>
                      </div>

                      {/* Title & Description */}
                      <h3 className="text-xl font-bold text-white/50 mb-2">
                        {flow.title}
                      </h3>
                      <p className="text-gray-500 text-sm mb-4 line-clamp-2">
                        {flow.description}
                      </p>

                      {/* Steps Preview */}
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-xs text-gray-600">{flow.steps.length} steps</span>
                        <div className="flex gap-1">
                          {flow.steps.slice(0, 4).map((_, i) => (
                            <div
                              key={i}
                              className="w-2 h-2 rounded-full bg-white/10"
                            />
                          ))}
                          {flow.steps.length > 4 && (
                            <div className="w-2 h-2 rounded-full bg-white/5" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <Link
                    to={flow.steps[0].path}
                    className="block h-full group"
                  >
                    <div className="h-full bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-[#00D9FF]/50 hover:bg-white/[0.07] transition-all duration-300">
                      {/* Icon & Badge */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="text-4xl">{flow.icon}</div>
                        <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full ${
                          flow.targetAudience === 'brand'
                            ? 'bg-[#B8FF00]/20 text-[#B8FF00]'
                            : flow.targetAudience === 'influencer'
                            ? 'bg-[#00D9FF]/20 text-[#00D9FF]'
                            : 'bg-purple-500/20 text-purple-400'
                        }`}>
                          {flow.targetAudience === 'brand' ? 'Brand' : flow.targetAudience === 'influencer' ? 'Influencer' : 'Both'}
                        </span>
                      </div>

                      {/* Title & Description */}
                      <h3 className="text-xl font-bold text-white mb-2 group-hover:text-[#00D9FF] transition-colors">
                        {flow.title}
                      </h3>
                      <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                        {flow.description}
                      </p>

                      {/* Steps Preview */}
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-xs text-gray-500">{flow.steps.length} steps</span>
                        <div className="flex gap-1">
                          {flow.steps.slice(0, 4).map((_, i) => (
                            <div
                              key={i}
                              className="w-2 h-2 rounded-full bg-white/20"
                            />
                          ))}
                          {flow.steps.length > 4 && (
                            <div className="w-2 h-2 rounded-full bg-white/10" />
                          )}
                        </div>
                      </div>

                      {/* CTA */}
                      <div className="flex items-center gap-2 text-[#00D9FF] font-semibold text-sm">
                        <span>Start Demo</span>
                        <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </Link>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-gradient-to-b from-[#0a0a0a] to-[#050505] border-t border-white/5">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-gray-400 mb-8">
            Join thousands of creators and brands already using ColLoved.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/signup/influencer"
              className="w-full sm:w-auto px-8 py-4 bg-[#00D9FF] text-black font-black rounded-2xl hover:shadow-[0_0_30px_rgba(0,217,255,0.3)] transition-all text-center"
            >
              I'm a Creator
            </Link>
            <Link
              to="/signup/promoter"
              className="w-full sm:w-auto px-8 py-4 bg-[#B8FF00] text-black font-black rounded-2xl hover:shadow-[0_0_30px_rgba(184,255,0,0.3)] transition-all text-center"
            >
              I'm a Brand
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 px-4 border-t border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <Logo size="md" />
          <p className="text-gray-500 text-sm">
            © 2026 ColLoved. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
