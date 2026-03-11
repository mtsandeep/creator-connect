// ============================================
// DEMO: Link-in-Bio Flow - Step 1: Instagram Profile
// ============================================

import { useEffect } from 'react';
import DemoLayout from '../../../components/demo/DemoLayout';
import InstagramMock from '../../../components/demo/InstagramMock';
import { useDemoTour, instagramTourSteps } from '../../../hooks/useDemoTour';

export default function LinkBioInstagram() {
  const { startTour, stopTour } = useDemoTour(instagramTourSteps);

  // Start tour automatically on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      startTour();
    }, 500);

    return () => clearTimeout(timer);
  }, [startTour]);

  const handleLinkClick = () => {
    stopTour();
  };

  return (
    <DemoLayout
      flowTitle="Link-in-Bio Discovery"
      currentStep={1}
      totalSteps={4}
      nextPath="/demo/linkbio/profile"
      nextLabel="Click Link"
      perspective="brand"
    >
      <div className="space-y-6">
        {/* Instagram Mock */}
        <div className="flex justify-center">
          <InstagramMock onLinkClick={handleLinkClick} />
        </div>

        {/* Info Cards */}
        <div className="max-w-lg mx-auto space-y-4">
          <div className="bg-white/5 rounded-xl p-5 border border-white/10">
            <h3 className="font-semibold text-white mb-2 flex items-center gap-2">
              <span className="text-xl">📱</span>
              Share Your Link Everywhere
            </h3>
            <p className="text-sm text-gray-400">
              Add your ColLoved link to your Instagram bio, YouTube descriptions, email signature, and more.
            </p>
          </div>
          <div className="bg-white/5 rounded-xl p-5 border border-white/10">
            <h3 className="font-semibold text-white mb-2 flex items-center gap-2">
              <span className="text-xl">🎯</span>
              One Link, Everything Included
            </h3>
            <p className="text-sm text-gray-400">
              Your link-in-bio shows your pricing, terms, portfolio, and lets brands contact you directly.
            </p>
          </div>
        </div>
      </div>
    </DemoLayout>
  );
}
