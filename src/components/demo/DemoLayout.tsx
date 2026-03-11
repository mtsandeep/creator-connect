// ============================================
// DEMO LAYOUT COMPONENT
// ============================================

import { Link, useNavigate } from 'react-router-dom';
import Logo from '../Logo';

interface DemoLayoutProps {
  flowId: string;
  flowTitle: string;
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
  flowTitle,
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
  const progressPercentage = totalSteps > 1 ? ((currentStep - 1) / (totalSteps - 1)) * 100 : 100;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col">
      {/* Demo Banner Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/95 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Logo and Demo Badge */}
            <div className="flex items-center gap-3">
              <Link to="/" className="flex items-center gap-2">
                <Logo size="md" />
              </Link>
              <span className="px-2 py-1 bg-[#00D9FF]/20 text-[#00D9FF] text-[10px] font-black uppercase tracking-wider rounded-full">
                Demo Mode
              </span>
            </div>

            {/* Flow Title */}
            <div className="hidden md:flex items-center gap-2">
              <span className="text-gray-400 text-sm">{flowTitle}</span>
              {perspective && (
                <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-full ${
                  perspective === 'brand'
                    ? 'bg-[#B8FF00]/20 text-[#B8FF00]'
                    : 'bg-[#00D9FF]/20 text-[#00D9FF]'
                }`}>
                  {perspective === 'brand' ? 'Brand View' : 'Influencer View'}
                </span>
              )}
            </div>

            {/* Exit Button */}
            <button
              onClick={() => navigate('/demo')}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              Exit Demo
            </button>
          </div>

          {/* Progress Bar */}
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
              <span>Step {currentStep} of {totalSteps}</span>
              <span>{Math.round(progressPercentage)}% Complete</span>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#00D9FF] to-[#B8FF00] rounded-full transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pt-32 pb-24 px-4">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>

      {/* Bottom Navigation */}
      <footer className="fixed bottom-0 left-0 right-0 z-50 bg-[#0a0a0a]/95 backdrop-blur-md border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Previous Button */}
            {prevPath ? (
              <button
                onClick={() => navigate(prevPath)}
                className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                {prevLabel}
              </button>
            ) : (
              <div />
            )}

            {/* Step Indicators */}
            <div className="hidden md:flex items-center gap-2">
              {Array.from({ length: totalSteps }, (_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    i + 1 <= currentStep ? 'bg-[#00D9FF]' : 'bg-white/20'
                  }`}
                />
              ))}
            </div>

            {/* Next Button */}
            {nextPath ? (
              <button
                onClick={() => navigate(nextPath)}
                className="flex items-center gap-2 px-6 py-3 bg-[#00D9FF] hover:bg-[#00D9FF]/80 text-gray-900 font-semibold rounded-xl transition-colors"
              >
                {nextLabel}
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ) : (
              <Link
                to="/signup/influencer"
                className="flex items-center gap-2 px-6 py-3 bg-[#B8FF00] hover:bg-[#B8FF00]/80 text-gray-900 font-semibold rounded-xl transition-colors"
              >
                Get Started
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
