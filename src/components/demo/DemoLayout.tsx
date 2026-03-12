// ============================================
// DEMO LAYOUT COMPONENT
// ============================================

import { Link, useNavigate } from 'react-router-dom';
import Logo from '../Logo';

interface DemoLayoutProps {
  currentStep: number;
  totalSteps: number;
  nextPath?: string;
  nextLabel?: string;
  prevPath?: string;
  prevLabel?: string;
  perspective?: 'brand' | 'influencer';
  children: React.ReactNode;
}

export default function DemoLayout({
  currentStep,
  totalSteps,
  nextPath,
  nextLabel = 'Next',
  prevPath,
  prevLabel = 'Previous',
  perspective,
  children,
}: DemoLayoutProps) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col">
      {/* Compact Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/95 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          {/* Logo and Demo Badge */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2">
              <Logo size="sm" />
            </Link>
            <span className="px-2 py-0.5 bg-[#00D9FF]/20 text-[#00D9FF] text-[10px] font-black uppercase tracking-wider rounded-full">
              Demo
            </span>
            {perspective && (
              <span className={`hidden sm:inline px-2 py-0.5 text-[10px] font-bold uppercase rounded-full ${
                perspective === 'brand'
                  ? 'bg-[#B8FF00]/20 text-[#B8FF00]'
                  : 'bg-[#00D9FF]/20 text-[#00D9FF]'
              }`}>
                {perspective === 'brand' ? 'Brand' : 'Influencer'}
              </span>
            )}
          </div>

          {/* Step Indicators */}
          <div className="flex items-center gap-1.5">
            {Array.from({ length: totalSteps }, (_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i + 1 <= currentStep ? 'bg-[#00D9FF]' : 'bg-white/20'
                }`}
              />
            ))}
          </div>

          {/* Exit Button */}
          <button
            onClick={() => navigate('/demo')}
            className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Exit
          </button>
        </div>
      </header>

      {/* Main Content - minimal padding */}
      <main className="flex-1 pt-18 pb-20 px-4 flex justify-center">
        <div className="w-full max-w-lg">
          {children}
        </div>
      </main>

      {/* Fixed Bottom Navigation - always visible */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center justify-center gap-4">
        {prevPath ? (
          <button
            onClick={() => navigate(prevPath)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600/80 hover:bg-gray-600 backdrop-blur-md text-white text-sm font-medium rounded-xl transition-colors border border-gray-500/30"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="hidden sm:inline">{prevLabel}</span>
          </button>
        ) : (
          <div />
        )}

        {nextPath ? (
          <button
            onClick={() => navigate(nextPath)}
            className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-100 text-gray-900 text-sm font-medium rounded-xl transition-colors shadow-lg shadow-black/20"
          >
            <span className="hidden sm:inline">{nextLabel}</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        ) : (
          <Link
            to="/signup/influencer"
            className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-100 text-gray-900 text-sm font-medium rounded-xl transition-colors shadow-lg shadow-black/20"
          >
            <span className="hidden sm:inline">Get Started</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        )}
      </div>
    </div>
  );
}
