import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import type { User } from '../types';
import { useAuthStore } from '../stores';
import { Check, MessageCircle, FileText, ExternalLink, Sparkles } from 'lucide-react';
import Logo from '../components/Logo';
import { FaInstagram, FaYoutube, FaFacebook } from 'react-icons/fa';
import { MdVerified, MdVerifiedUser } from 'react-icons/md';
import { usePublicProfile } from '../hooks/usePublicProfile';

export default function LinkInBio() {
  const { username } = useParams<{ username: string }>();
  const normalizedUsername = (username || '').replace(/^@+/, '');
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const { searchPublicProfiles } = usePublicProfile();

  const [influencer, setInfluencer] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInfluencer = async () => {
      if (!normalizedUsername) {
        setError('Username not provided');
        setLoading(false);
        return;
      }

      try {
        // Use the public profile Cloud Function to search by username
        const result = await searchPublicProfiles(normalizedUsername);
        
        if (result.success && result.profiles && result.profiles.length > 0) {
          const publicProfile = result.profiles[0];
          
          // Convert public profile back to User type (only includes safe fields)
          const userData: User = {
            uid: publicProfile.uid,
            email: '', // Not available in public profile
            roles: ['influencer'], // Assumed for link-in-bio
            activeRole: 'influencer', // Assumed for link-in-bio
            createdAt: Date.now(), // Firestore timestamp format
            profileComplete: true,
            influencerProfile: publicProfile.influencerProfile,
            verificationBadges: publicProfile.verificationBadges,
            avgRating: publicProfile.avgRating,
            totalReviews: publicProfile.totalReviews,
            // Other fields not available in public profile
            promoterProfile: undefined,
            businessProfile: undefined,
            allowedInfluencerIds: undefined,
            isBanned: false,
            banReason: undefined,
            bannedAt: undefined,
            bannedBy: undefined,
          };
          
          setInfluencer(userData);
        } else {
          setError('User not found');
        }
      } catch (err) {
        console.error('Error fetching influencer:', err);
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchInfluencer();
  }, [normalizedUsername]);

  const handleStartChat = () => {
    if (!isAuthenticated) {
      // Pass redirect info as query params instead of sessionStorage
      navigate(`/login?redirect=${encodeURIComponent(`/link/${normalizedUsername}/chat`)}&action=start_chat&username=${normalizedUsername}`);
      return;
    }

    // Prevent users from chatting with themselves
    if (user?.uid === influencer?.uid) {
      setError('You cannot start a chat with yourself');
      return;
    }

    // Check if promoter has incomplete profile
    if (user?.roles.includes('promoter') && !user.profileComplete) {
      const needsVerification = influencer?.influencerProfile?.linkInBio?.contactPreference === 'verified_only';
      sessionStorage.setItem('incompleteProfileContext', JSON.stringify({
        username,
        action: 'chat',
        needsVerification,
        influencerId: influencer?.uid,
        influencerName: influencer?.influencerProfile?.displayName
      }));
      navigate('/incomplete-profile');
      return;
    }

    // Check if user can contact (verified only check)
    if (influencer?.influencerProfile?.linkInBio?.contactPreference === 'verified_only') {
      if (user?.roles.includes('promoter') && !user.verificationBadges?.promoterVerified) {
        sessionStorage.setItem('verificationContext', JSON.stringify({
          username,
          action: 'chat',
          influencerId: influencer?.uid,
          influencerName: influencer?.influencerProfile?.displayName
        }));
        navigate('/verification');
        return;
      }
    }

    // Navigate to dedicated chat page
    navigate(`/link/${normalizedUsername}/chat`);
  };

  const handleSendProposal = () => {
    if (!isAuthenticated) {
      // Pass redirect info as query params instead of sessionStorage
      navigate(`/login?redirect=${encodeURIComponent(`/link/${normalizedUsername}/proposal`)}&action=send_proposal&username=${normalizedUsername}`);
      return;
    }

    // Prevent users from sending proposals to themselves
    if (user?.uid === influencer?.uid) {
      setError('You cannot send a proposal to yourself');
      return;
    }

    // Check if promoter has incomplete profile
    if (user?.roles.includes('promoter') && !user.profileComplete) {
      const needsVerification = influencer?.influencerProfile?.linkInBio?.contactPreference === 'verified_only';
      sessionStorage.setItem('incompleteProfileContext', JSON.stringify({
        username,
        action: 'proposal',
        needsVerification,
        influencerId: influencer?.uid,
        influencerName: influencer?.influencerProfile?.displayName
      }));
      navigate('/incomplete-profile');
      return;
    }

    // Check if user can send proposals (must be verified if influencer requires it)
    if (influencer?.influencerProfile?.linkInBio?.contactPreference === 'verified_only') {
      if (user?.roles.includes('promoter') && !user.verificationBadges?.promoterVerified) {
        sessionStorage.setItem('verificationContext', JSON.stringify({
          username,
          action: 'proposal',
          influencerId: influencer?.uid,
          influencerName: influencer?.influencerProfile?.displayName
        }));
        navigate('/verification');
        return;
      }
    }

    // Navigate to dedicated proposal page
    navigate(`/link/${normalizedUsername}/proposal`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0F172A] to-[#1E293B]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00D9FF]"></div>
      </div>
    );
  }

  if (error || !influencer) {
    const isSelfMessagingError = error === 'You cannot start a chat with yourself' || error === 'You cannot send a proposal to yourself';
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0F172A] to-[#1E293B]">
        <div className="text-center text-white">
          <h1 className="text-2xl font-bold mb-2">
            {isSelfMessagingError ? 'Action Not Allowed' : 'Profile Not Found'}
          </h1>
          <p className="text-gray-400">{error || 'This link may be invalid'}</p>
        </div>
      </div>
    );
  }

  const profile = influencer.influencerProfile!;
  const linkInBio = profile.linkInBio;
  const isVerified = influencer.verificationBadges?.influencerVerified;
  const isTrusted = influencer.verificationBadges?.influencerTrusted;

  // Group terms by type
  const allowedTerms = linkInBio?.terms.filter(t => t.type === 'allowed') || [];
  const notAllowedTerms = linkInBio?.terms.filter(t => t.type === 'not_allowed') || [];
  const genericTerms = linkInBio?.terms.filter(t => t.type === 'generic') || [];

  // Get platform icon and color
  const getPlatformIcon = (platform: string) => {
    const p = platform.toLowerCase();
    if (p.includes('instagram')) return { icon: FaInstagram, color: 'text-pink-500', label: 'Instagram' };
    if (p.includes('youtube')) return { icon: FaYoutube, color: 'text-red-500', label: 'YouTube' };
    if (p.includes('facebook')) return { icon: FaFacebook, color: 'text-blue-500', label: 'Facebook' };
    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] to-[#050505] py-12 px-4">
      <div className="max-w-md mx-auto">
        {/* Single Profile Card */}
        <div className="relative bg-gradient-to-br from-[#1a1a1a] via-[#0f0f0f] to-[#050505] rounded-3xl p-8 border border-[#00D9FF]/20 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5),0_0_60px_rgba(0,217,255,0.1)]">
          {/* Profile Header - Horizontal Layout */}
          <div className="flex items-start gap-5 mb-6">
            <div className="relative flex-shrink-0">
              <img
                src={profile.profileImage || '/default-avatar.png'}
                alt={profile.displayName}
                className="w-20 h-20 rounded-2xl object-cover shadow-lg"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-black text-white truncate">{profile.displayName}</h1>
                {/* Verification Badges */}
                <div className="flex items-center">
                  {isVerified && (
                    <span className="inline-flex items-center px-1 py-0.5 text-green-400 text-xs rounded-full" title="Verified Influencer">
                      <MdVerified className="w-6 h-6" />
                    </span>
                  )}
                  {isTrusted && (
                    <span className="inline-flex items-center px-1 py-0.5 text-[#00D9FF] text-xs rounded-full" title="Trusted Influencer">
                      <MdVerifiedUser className="w-6 h-6" />
                    </span>
                  )}
                </div>
              </div>
              <p className="text-gray-500 text-sm mb-3">{normalizedUsername}</p>

              {/* Category Tags */}
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

          {/* Social Stats Grid */}
          {profile.socialMediaLinks.length > 0 && (
            <div className={`grid gap-3 mb-6 ${
              profile.socialMediaLinks.length === 1 ? 'grid-cols-1' :
              profile.socialMediaLinks.length === 2 ? 'grid-cols-2' :
              'grid-cols-3'
            }`}>
              {profile.socialMediaLinks.slice(0, 3).map((link) => {
                const platform = getPlatformIcon(link.platform);
                if (!platform) return null;
                const Icon = platform.icon;
                return (
                  <a
                    key={link.platform}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block bg-white/5 rounded-2xl p-3 border border-white/10 hover:border-[#00D9FF]/30 hover:bg-white/10 transition-all"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className={`text-lg ${platform.color}`} />
                      <span className="text-gray-400 text-[10px] font-medium">{platform.label}</span>
                    </div>
                    <p className="text-white font-black text-lg">
                      {link.followerCount >= 1000000
                        ? `${(link.followerCount / 1000000).toFixed(1)}M`
                        : link.followerCount >= 1000
                        ? `${(link.followerCount / 1000).toFixed(0)}K`
                        : link.followerCount}
                    </p>
                    <p className="text-gray-500 text-[10px]">followers</p>
                  </a>
                );
              })}
            </div>
          )}

          {/* Terms Section */}
          {linkInBio && linkInBio.terms.length > 0 && (
            <div className="mb-6">
              <ul className="space-y-2">
                {allowedTerms.map((term) => (
                  <li key={term.id} className="flex items-center gap-2 text-sm text-gray-400">
                    <span className="text-[#00D9FF]">✓</span>
                    {term.text}
                  </li>
                ))}
                {notAllowedTerms.map((term) => (
                  <li key={term.id} className="flex items-center gap-2 text-sm text-gray-400">
                    <span className="text-[#00D9FF]">✕</span>
                    {term.text}
                  </li>
                ))}
                {genericTerms.map((term) => (
                  <li key={term.id} className="flex items-center gap-2 text-sm text-gray-400">
                    <Sparkles className="w-3.5 h-3.5 text-[#00D9FF]" />
                    {term.text}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Pricing Section */}
          {linkInBio?.priceOnRequest ? (
            <div className="bg-gradient-to-r from-[#00D9FF]/5 to-transparent rounded-2xl p-5 md:px-6 md:py-7 border border-[#00D9FF]/10 text-center mb-6">
              <div className="flex items-center justify-center gap-3 mb-3">
                <span className="text-gray-300 text-sm">Price discussed in private</span>
                <span className="px-3 py-1 rounded-lg bg-[#00D9FF]/10 text-[#00D9FF] text-xs font-bold uppercase tracking-wider">
                  Price on Request
                </span>
              </div>
              <p className="text-gray-500 text-xs">Connect with me to know details</p>
            </div>
          ) : profile.pricing && (profile.pricing.startingFrom || (profile.pricing.rates && profile.pricing.rates.some(r => r.price > 0))) ? (
            <div className="bg-gradient-to-r from-[#00D9FF]/5 to-transparent rounded-2xl p-5 border border-[#00D9FF]/10 mb-6 gap-3 flex flex-col">
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">Starting from</span>
                <span className="text-[#00D9FF] font-black text-2xl">
                  ₹{(profile.pricing.startingFrom || profile.pricing.rates?.filter(r => r.price > 0).reduce((min, r) => r.price < min ? r.price : min, Infinity) || 0).toLocaleString()}
                </span>
              </div>
              {profile.pricing.advancePercentage > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Advance</span>
                  <span className="text-white font-bold">{profile.pricing.advancePercentage}% upfront</span>
                </div>
              )}
            </div>
          ) : null}

          {/* Quick Links */}
          {linkInBio && linkInBio.quickLinks.length > 0 && (
            <div className="space-y-3 mb-6">
              {linkInBio.quickLinks.map((link) => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10 hover:border-[#00D9FF]/30 hover:bg-white/10 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{link.icon}</span>
                    <span className="font-medium text-white">{link.title}</span>
                  </div>
                  <ExternalLink className="w-5 h-5 text-gray-500 group-hover:text-[#00D9FF]" />
                </a>
              ))}
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleSendProposal}
              className="flex items-center justify-center gap-2 py-3 bg-[#00D9FF] text-black font-black rounded-xl hover:shadow-[0_0_20px_rgba(0,217,255,0.3)] transition-all"
            >
              <FileText className="w-4 h-4" />
              Send Proposal
            </button>
            <button
              onClick={handleStartChat}
              className="flex items-center justify-center gap-2 py-3 bg-white/5 text-white font-bold rounded-xl border border-white/10 hover:bg-white/10 transition-all"
            >
              <MessageCircle className="w-4 h-4" />
              Start Chat
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <a href="/" title="ColLoved - The collaboration workspace" className="inline-block hover:opacity-80 transition-opacity">
            <Logo size="sm" />
          </a>
        </div>
      </div>
    </div>
  );
}
