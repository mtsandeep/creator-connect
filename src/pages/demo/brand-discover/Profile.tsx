// ============================================
// DEMO: Brand Discover Flow - Step 2: Profile View
// Brand views the selected influencer's profile
// ============================================

import { useNavigate, useSearchParams } from 'react-router-dom';
import { FaInstagram, FaYoutube, FaFacebook } from 'react-icons/fa';
import { MessageCircle, FileText } from 'lucide-react';
import { MdVerified, MdVerifiedUser } from 'react-icons/md';
import * as Popover from '@radix-ui/react-popover';
import DemoLayout from '../../../components/demo/DemoLayout';
import { demoInfluencers } from '../../../data/demoData';

const infoItems = [
  {
    icon: '1',
    title: 'Detailed Profile',
    description: 'View the influencer\'s complete profile including bio, categories, social reach, and pricing.',
  },
  {
    icon: '2',
    title: 'Social Proof',
    description: 'See follower counts across platforms and ratings from previous brand collaborations.',
  },
  {
    icon: '3',
    title: 'Contact Options',
    description: 'Reach out via chat or send a formal proposal directly from the profile.',
  },
];

export default function BrandDiscoverProfile() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const influencerId = searchParams.get('influencer') || 'demo-influencer-001';

  // Get the influencer from demo data
  const profile = demoInfluencers.find((i) => i.uid === influencerId) || demoInfluencers[0];

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
      nextPath="/demo/brand-discover/chat"
      nextLabel="Start Chat"
      prevPath="/demo/brand-discover/browse"
      prevLabel="Back to Browse"
      perspective="brand"
    >
      {/* Slim Info Bar */}
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-white/70 font-medium">Brands review your profile details</span>
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
          <div className="relative bg-gradient-to-br from-[#1a1a1a] via-[#0f0f0f] to-[#050505] rounded-3xl p-6 md:p-7 border border-[#B8FF00]/20 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5),0_0_60px_rgba(184,255,0,0.1)]">
            {/* Profile Header */}
            <div className="flex items-start gap-5 mb-6">
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
                      </>
                    )}
                  </div>
                </div>
                <p className="text-gray-500 text-sm mb-3">@{profile.username}</p>
                {profile.categories && profile.categories.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {profile.categories.slice(0, 3).map((cat) => (
                      <span key={cat} className="px-3 py-1 rounded-full bg-[#B8FF00]/10 text-[#B8FF00] text-xs font-bold">
                        {cat}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Social Stats */}
            {socialLinksWithFollowers.length > 0 && (
              <div className={`grid gap-3 mb-6 ${socialLinksWithFollowers.length === 1 ? 'grid-cols-1' : socialLinksWithFollowers.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
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

            {/* Bio */}
            {profile.bio && (
              <div className="mb-6">
                <p className="text-gray-300 text-sm whitespace-pre-line">{profile.bio}</p>
              </div>
            )}

            {/* Terms */}
            <div className="mb-6">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Terms</h3>
              <ul className="space-y-2">
                <li className="flex items-start gap-2 text-sm text-gray-400">
                  <span className="text-[#B8FF00] shrink-0">✓</span>
                  <span>Products must align with my content style</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-400">
                  <span className="text-[#B8FF00] shrink-0">✓</span>
                  <span>{profile.pricing?.advancePercentage || 30}% advance payment required</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-400">
                  <span className="text-red-500 shrink-0">✕</span>
                  <span>No crypto or gambling promotions</span>
                </li>
              </ul>
            </div>

            {/* Pricing */}
            {profile.pricing?.startingFrom ? (
              <div className="bg-gradient-to-r from-[#B8FF00]/5 to-transparent rounded-2xl p-5 border border-[#B8FF00]/10 mb-6 flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Starting from</span>
                  <span className="text-[#B8FF00] font-black text-2xl">₹{profile.pricing.startingFrom.toLocaleString()}</span>
                </div>
                {profile.pricing.advancePercentage > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Advance</span>
                    <span className="text-white font-bold">{profile.pricing.advancePercentage}% upfront</span>
                  </div>
                )}
              </div>
            ) : null}

            {/* Rating */}
            {profile.totalReviews > 0 && (
              <div className="flex items-center gap-2 mb-6">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className={`w-4 h-4 ${i < Math.round(profile.avgRating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`}
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="text-gray-400 text-sm">{profile.avgRating.toFixed(1)}</span>
                <span className="text-gray-500 text-sm">({profile.totalReviews} reviews)</span>
              </div>
            )}

            {/* Action Buttons */}
            <div data-tour="action-buttons" className="grid grid-cols-2 gap-3">
              <button onClick={() => navigate('/demo/brand-discover/proposal')} className="flex items-center justify-center gap-2 py-3 bg-[#00D9FF] text-black text-sm font-bold rounded-xl hover:shadow-[0_0_20px_rgba(0,217,255,0.3)] transition-all cursor-pointer">
                <FileText className="w-4 h-4" />
                Send Proposal
              </button>
              <button onClick={() => navigate('/demo/brand-discover/chat')}
                className="flex items-center justify-center gap-2 py-3 bg-white/5 text-white text-sm font-bold rounded-xl border border-white/10 hover:bg-white/10 transition-all cursor-pointer">
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
