// ============================================
// DEMO: Link-in-Bio Flow - Step 1: Instagram Profile
// ============================================

import { useEffect } from 'react';
import * as Popover from '@radix-ui/react-popover';
import DemoLayout from '../../../components/demo/DemoLayout';
import InstagramMock from '../../../components/demo/InstagramMock';
import { useDemoTour, instagramTourSteps } from '../../../hooks/useDemoTour';

const infoItems = [
  {
    icon: '1',
    title: 'Share Your Link Everywhere',
    description: 'Add your ColLoved link to your Instagram bio, YouTube descriptions, email signature, and more.',
  },
  {
    icon: '2',
    title: 'One Link, Everything Included',
    description: 'Your link-in-bio shows your pricing, terms, portfolio, and lets brands contact you directly.',
  },
];

// Define options outside component to prevent re-creation on each render
const tourOptions = {
  overlayColor: '#000',
  overlayOpacity: 0.5,
};

export default function LinkBioInstagram() {
  const { startTour, stopTour } = useDemoTour(instagramTourSteps, tourOptions);

  // Start tour automatically on mount, stop on unmount
  useEffect(() => {
    const timer = setTimeout(() => {
      startTour();
    }, 500);

    return () => {
      clearTimeout(timer);
      stopTour();
    };
  }, [startTour, stopTour]);

  const handleLinkClick = () => {
    stopTour();
  };

  return (
    <DemoLayout
      currentStep={1}
      totalSteps={4}
      nextPath="/demo/linkbio/profile"
      nextLabel="Click Link"
      perspective="brand"
    >
      {/* Slim Info Bar */}
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-white/70 font-medium">Brands find you on Instagram</span>
          <div className="flex items-center gap-1">
            {infoItems.map((item, index) => (
              <Popover.Root key={index}>
                <Popover.Trigger asChild>
                  <button className="w-6 h-6 flex items-center justify-center rounded-full bg-white/10 border border-white/20 hover:bg-white/20 hover:border-white/30 text-[11px] font-semibold leading-none text-white transition-all data-[state=open]:bg-white/30 data-[state=open]:border-white/40 cursor-pointer">
                    {item.icon}
                  </button>
                </Popover.Trigger>

                <Popover.Portal>
                  <Popover.Content
                    className="w-72 p-3 bg-gray-800 rounded-xl border border-white/10 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-200"
                    sideOffset={8}
                    side="bottom"
                  >
                    <Popover.Arrow className="fill-gray-800" width={12} height={8} />
                    <h4 className="font-semibold text-white text-sm mb-1">{item.title}</h4>
                    <p className="text-xs text-gray-400 leading-relaxed">{item.description}</p>
                  </Popover.Content>
                </Popover.Portal>
              </Popover.Root>
            ))}
          </div>
        </div>
      </div>

      {/* Instagram Mock */}
      <div className="flex justify-center">
        <InstagramMock onLinkClick={handleLinkClick} />
      </div>
    </DemoLayout>
  );
}
