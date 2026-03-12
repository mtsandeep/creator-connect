// ============================================
// DEMO: Link-in-Bio Flow - Step 2: Public Profile
// Matches the real LinkInBio page design
// ============================================

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaInstagram, FaYoutube, FaFacebook } from 'react-icons/fa';
import { MessageCircle, FileText } from 'lucide-react';
import { MdVerified, MdVerifiedUser } from 'react-icons/md';
import * as Popover from '@radix-ui/react-popover';
import DemoLayout from '../../../components/demo/DemoLayout';
import { demoInfluencer } from '../../../data/demoData';
import { useDemoTour, profileTourSteps } from '../../../hooks/useDemoTour';

const infoItems = [
  {
    icon: '1',
    title: 'Your Professional Profile',
    description: 'This is what brands see when they click your link-in-bio. A complete showcase of your reach, terms, and pricing.',
  },
  {
    icon: '2',
    title: 'Transparent Pricing',
    description: 'Show your starting price and advance requirements. No awkward negotiations - everything is upfront.',
  },
  {
    icon: '3',
    title: 'Direct Contact',
    description: 'Brands can send a proposal or start a chat directly. Both lead to collaborations!',
  },
];

export default function LinkBioProfile() {
  const navigate = useNavigate();
  const profile = demoInfluencer;
  const { startTour, stopTour } = useDemoTour(profileTourSteps);

  // Start tour automatically on mount, stop on unmount
  useEffect(() => {
    const timer = setTimeout(() => {
      startTour();
    }, 500);
    return () => {
      clearTimeout(timer);
      stopTour(); // Stop tour immediately when navigating away
    };
  }, [startTour, stopTour]);

  const socialLinksWithFollowers = profile.socialMediaLinks.filter((l) => (l.followerCount ?? 0) > 0);

  const getPlatformIcon = (platform: string) => {
    const p = platform.toLowerCase();
    if (p.includes('instagram')) return { icon: FaInstagram, color: 'text-pink-500', label: 'Instagram' };
    if (p.includes('youtube')) return { icon: FaYoutube, color: 'text-red-500', label: 'YouTube' };
    if (p.includes('facebook')) return { icon: FaFacebook, color: 'text-blue-500', label: 'Facebook' };
    return null;
  };

  return (
    <DemoLayout
      currentStep={2}
      totalSteps={4}
      nextPath="/demo/linkbio/chat"
      nextLabel="Start Chat"
      prevPath="/demo/linkbio/instagram"
      prevLabel="Back to Instagram"
      perspective="brand"
    >
      {/* Slim Info Bar */}
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-white/70 font-medium">Brands visit your business profile at ColLoved</span>
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

      <div className="flex justify-center">
        <div className="w-full max-w-lg">
          <div data-tour="profile-card" className="relative bg-gradient-to-br from-[#1a1a1a] via-[#0f0f0f] to-[#050505] rounded-3xl p-6 md:p-7 border border-[#00D9FF]/20 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5),0_0_60px_rgba(0,217,255,0.1)]">
            {/* Profile Header */}
            <div data-tour="profile-header" className="flex items-start gap-5 mb-6">
              <div className="relative flex-shrink-0">
                <img
                  src={profile.profileImage || '/default-avatar.png'}
                  alt={profile.displayName}
                  className="w-24 h-24 rounded-2xl object-cover shadow-lg"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-2xl font-black text-white truncate">{profile.displayName}</h1>
                  <div className="flex items-center">
                    {profile.isVerified && (
                      <>
                        <span className="inline-flex items-center text-green-400" title="Verified Influencer">
                          <MdVerified className="w-6 h-6" />
                        </span>
                        <span className="inline-flex items-center text-[#00D9FF]" title="Trusted Influencer">
                          <MdVerifiedUser className="w-6 h-6" />
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <p className="text-gray-500 text-sm mb-3">@{profile.username}</p>
                {profile.categories && profile.categories.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {profile.categories.slice(0, 3).map((cat) => (
                      <span key={cat} className="px-3 py-1 rounded-full bg-[#00D9FF]/10 text-[#00D9FF] text-xs font-bold">
                          {cat}
                        </span>
                      ))}
                  </div>
                )}
              </div>
            </div>

            {/* Social Stats */}
            {socialLinksWithFollowers.length > 0 && (
              <div data-tour="social-stats" className={`grid gap-3 mb-6 ${socialLinksWithFollowers.length === 1 ? 'grid-cols-1' : socialLinksWithFollowers.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                {socialLinksWithFollowers.slice(0, 3).map((link) => {
                  const platform = getPlatformIcon(link.platform);
                  if (!platform) return null;
                  const Icon = platform.icon;
                  return (
                    <div key={link.platform} className="block bg-white/5 rounded-2xl p-3 border border-white/10">
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className={`text-lg ${platform.color}`} />
                        <span className="text-gray-400 text-[10px] font-medium">{platform.label}</span>
                      </div>
                      <p className="text-white font-black text-lg">
                        {link.followerCount >= 1000000 ? `${(link.followerCount / 1000000).toFixed(1)}M` : link.followerCount >= 1000 ? `${(link.followerCount / 1000).toFixed(0)}K` : link.followerCount}
                      </p>
                      <p className="text-gray-500 text-[10px]">followers</p>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Terms */}
            <div data-tour="terms" className="mb-6">
              <ul className="space-y-2">
                <li className="flex items-start gap-2 text-sm text-gray-400">
                  <span className="text-[#00D9FF] shrink-0">✓</span>
                  <span>Products must align with my content style</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-400">
                  <span className="text-[#00D9FF] shrink-0">✓</span>
                  <span>30% advance payment required</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-400">
                  <span className="text-red-500 shrink-0">✕</span>
                  <span>No crypto or gambling promotions</span>
                </li>
              </ul>
            </div>

            {/* Pricing */}
            {profile.pricing?.startingFrom ? (
              <div data-tour="pricing" className="bg-gradient-to-r from-[#00D9FF]/5 to-transparent rounded-2xl p-5 border border-[#00D9FF]/10 mb-6 flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Starting from</span>
                  <span className="text-[#00D9FF] font-black text-2xl">₹{profile.pricing.startingFrom.toLocaleString()}</span>
                </div>
                {profile.pricing.advancePercentage > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Advance</span>
                    <span className="text-white font-bold">{profile.pricing.advancePercentage}% upfront</span>
                  </div>
                )}
              </div>
            ) : null}

            {/* Personal Links */}
            <div data-tour="personal-links" className="space-y-2 mb-6">
              <a href="#" className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-500 to-orange-400 flex items-center justify-center text-white text-sm font-bold">
                  🛍
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">My Amazon Storefront</p>
                  <p className="text-gray-500 text-xs truncate">shop my favorites</p>
                </div>
                <svg className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
              <a href="#" className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-sm font-bold">
                  📚
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">Digital Presets Pack</p>
                  <p className="text-gray-500 text-xs truncate">my editing presets</p>
                </div>
                <svg className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>

            {/* Action Buttons */}
            <div data-tour="action-buttons" className="grid grid-cols-2 gap-3">
              <button onClick={() => navigate('/demo/linkbio/proposal')} className="flex items-center justify-center gap-2 py-3 bg-[#00D9FF] text-black text-sm font-bold rounded-xl hover:shadow-[0_0_20px_rgba(0,217,255,0.3)] transition-all cursor-pointer">
                <FileText className="w-4 h-4" />
                Send Proposal
              </button>
              <button onClick={() => navigate('/demo/linkbio/chat')} className="flex items-center justify-center gap-2 py-3 bg-white/5 text-white text-sm font-bold rounded-xl border border-white/10 hover:bg-white/10 transition-all cursor-pointer">
                <MessageCircle className="w-4 h-4" />
                Start Chat
              </button>
            </div>
          </div>
        </div>
      </div>
    </DemoLayout>
  );
}
