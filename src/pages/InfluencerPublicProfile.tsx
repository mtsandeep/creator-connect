// ============================================
// PUBLIC INFLUENCER PROFILE VIEW
// ============================================

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores';
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { formatDistanceToNow } from 'date-fns';
import { MessageCircle, FileText } from 'lucide-react';
import type { User, Review, Proposal } from '../types';
import { FaInstagram, FaYoutube, FaFacebook } from 'react-icons/fa';

// Helper function to format follower count
const formatFollowerCount = (count: number): string => {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  } else if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
};

// Status configuration matching ProposalCard
const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  sent: { label: 'Awaiting Response', color: 'bg-yellow-500/20 text-yellow-500' },
  accepted: { label: 'Accepted', color: 'bg-purple-500/20 text-purple-500' },
  edited: { label: 'Updated', color: 'bg-orange-500/20 text-orange-500' },
  declined: { label: 'Declined', color: 'bg-red-500/20 text-red-500' },
  closed: { label: 'Closed', color: 'bg-red-500/20 text-red-500' },
  in_progress: { label: 'In Progress', color: 'bg-[#B8FF00]/20 text-[#B8FF00]' },
  revision_requested: { label: 'Revision Requested', color: 'bg-orange-500/20 text-orange-500' },
  submitted: { label: 'Submitted', color: 'bg-[#00D9FF]/20 text-[#00D9FF]' },
  approved: { label: 'Completed', color: 'bg-green-500/20 text-green-500' },
  disputed: { label: 'Disputed', color: 'bg-orange-500/20 text-orange-500' },
};

export default function InfluencerPublicProfile() {
  const { uid } = useParams<{ uid: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [influencer, setInfluencer] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loadingProposals, setLoadingProposals] = useState(false);

  useEffect(() => {
    if (!uid) return;

    const fetchInfluencer = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', uid));

        if (!userDoc.exists()) {
          setNotFound(true);
          setLoading(false);
          return;
        }

        const userData = userDoc.data();

        // Check if user has influencer profile
        if (!userData.influencerProfile) {
          setNotFound(true);
          setLoading(false);
          return;
        }

        setInfluencer({
          uid: userDoc.id,
          email: userData.email || '',
          roles: userData.roles || [],
          activeRole: userData.activeRole || null,
          createdAt: userData.createdAt || 0,
          profileComplete: userData.profileComplete || false,
          influencerProfile: userData.influencerProfile,
          promoterProfile: userData.promoterProfile,
          avgRating: userData.avgRating || 0,
          totalReviews: userData.totalReviews || 0,
          isBanned: userData.isBanned || false,
          verificationBadges: userData.verificationBadges || { verified: false, trusted: false },
        });

        // Fetch reviews
        const reviewsQuery = query(
          collection(db, 'reviews'),
          where('revieweeId', '==', uid),
          orderBy('createdAt', 'desc'),
          limit(10)
        );
        const reviewsSnapshot = await getDocs(reviewsQuery);
        const reviewsData = reviewsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Review[];
        setReviews(reviewsData);

        setLoading(false);
      } catch (error) {
        console.error('Error fetching influencer:', error);
        setLoading(false);
      }
    };

    fetchInfluencer();
  }, [uid]);

  const handleDirectChat = () => {
    // Navigate to direct messages for this influencer
    navigate(`/promoter/messages/${uid}`);
  };

  const handleCreateProposal = () => {
    // Navigate to create proposal form
    const profile = influencer?.influencerProfile;
    navigate(`/promoter/proposals?create=true&influencerId=${uid}&influencerName=${encodeURIComponent(profile?.displayName || '')}`);
  };

  const handleViewProposal = (proposalId: string) => {
    // Navigate to proposal detail
    navigate(`/promoter/proposals/${proposalId}`);
  };

  // Fetch proposals for this influencer
  useEffect(() => {
    if (!uid || !user?.roles.includes('promoter')) return;

    const fetchProposals = async () => {
      setLoadingProposals(true);
      try {
        const proposalsQuery = query(
          collection(db, 'proposals'),
          where('promoterId', '==', user.uid),
          where('influencerId', '==', uid),
          orderBy('updatedAt', 'desc')
        );
        const proposalsSnapshot = await getDocs(proposalsQuery);
        const proposalsData = proposalsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Proposal[];
        setProposals(proposalsData);
      } catch (error) {
        console.error('Error fetching proposals:', error);
      } finally {
        setLoadingProposals(false);
      }
    };

    fetchProposals();
  }, [uid, user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00D9FF]"></div>
      </div>
    );
  }

  if (notFound || !influencer) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Influencer Not Found</h2>
          <button
            onClick={() => navigate('/promoter/browse')}
            className="bg-[#B8FF00] hover:bg-[#B8FF00]/80 text-gray-900 font-semibold px-6 py-2 rounded-xl transition-colors"
          >
            Back to Browse
          </button>
        </div>
      </div>
    );
  }

  const profile = influencer.influencerProfile!;
  const isOwnProfile = user?.uid === uid;

  return (
    <div className="max-w-4xl mx-auto p-8">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="mb-6 flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      {/* Profile Header */}
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8 mb-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Profile Image */}
          <div className="flex-shrink-0">
            <img
              src={profile.profileImage}
              alt={profile.displayName}
              className="w-32 h-32 rounded-full object-cover border-4 border-white/10"
              onError={(e) => {
                e.currentTarget.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${uid}`;
              }}
            />
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-white mb-1">
                  {profile.displayName}
                  {influencer.avgRating > 0 && (
                    <span className="ml-2 text-sm text-[#B8FF00]">★ Verified</span>
                  )}
                </h1>
                <p className="text-gray-400">{profile.username}</p>
                {profile.location && (
                  <p className="text-gray-500 text-sm mt-1">📍 {profile.location}</p>
                )}
              </div>

              {!isOwnProfile && (
                <div className="flex flex-col gap-2">
                  <button
                    onClick={handleDirectChat}
                    className="bg-[#00D9FF] hover:bg-[#00D9FF]/80 text-gray-900 font-semibold px-6 py-2 rounded-xl transition-colors cursor-pointer flex items-center gap-2"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Start Chat
                  </button>
                  <button
                    onClick={handleCreateProposal}
                    className="bg-[#B8FF00] hover:bg-[#B8FF00]/80 text-gray-900 font-semibold px-6 py-2 rounded-xl transition-colors cursor-pointer flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    Send Proposal
                  </button>
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-6 mb-4">
              <div>
                <div className="text-2xl font-bold text-white">
                  {profile.socialMediaLinks.reduce((sum, link) => sum + (link.followerCount || 0), 0).toLocaleString()}
                </div>
                <div className="text-gray-500 text-sm">Total Followers</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{influencer.avgRating.toFixed(1)}</div>
                <div className="text-gray-500 text-sm">⭐ Rating</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{influencer.totalReviews}</div>
                <div className="text-gray-500 text-sm">Reviews</div>
              </div>
            </div>

            {/* Bio */}
            {profile.bio && (
              <p className="text-gray-300 mb-4">{profile.bio}</p>
            )}

            {/* Categories */}
            {profile.categories && profile.categories.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {profile.categories.map((category) => (
                  <span
                    key={category}
                    className="px-3 py-1 bg-[#00D9FF]/20 text-[#00D9FF] rounded-full text-sm"
                  >
                    {category}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Social Media Links */}
      {profile.socialMediaLinks && profile.socialMediaLinks.length > 0 && (
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">Social Media</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {profile.socialMediaLinks
              .filter((link) => link.followerCount > 0)
              .map((link) => (
              <div
                key={link.platform}
                className="flex items-center justify-between bg-white/5 rounded-xl p-4"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">
                    {link.platform === 'instagram' && <FaInstagram className="w-6 h-6 text-pink-500" />}
                    {link.platform === 'youtube' && <FaYoutube className="w-6 h-6 text-red-600" />}
                    {link.platform === 'facebook' && <FaFacebook className="w-6 h-6 text-blue-600" />}
                  </span>
                  <div>
                    <div className="text-white capitalize">{link.platform}</div>
                    <div className="text-gray-500 text-sm">
                      {formatFollowerCount(link.followerCount)} followers
                    </div>
                  </div>
                </div>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#00D9FF] hover:underline text-sm"
                >
                  View
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reviews */}
      {reviews.length > 0 && (
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Recent Reviews</h2>
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="bg-white/5 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="text-yellow-400">
                    {'★'.repeat(Math.floor(review.rating))}{'☆'.repeat(5 - Math.floor(review.rating))}
                  </div>
                  <span className="text-gray-500 text-sm">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-gray-300">{review.comment}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Proposals Section - Only for promoters */}
      {user?.roles.includes('promoter') && (
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Your Proposals</h2>
          {loadingProposals ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#B8FF00]"></div>
            </div>
          ) : proposals.length > 0 ? (
            <div className="space-y-3">
              {proposals.map((proposal) => {
                // Use the same status logic as ProposalCard
                const statusKey = proposal.workStatus === 'approved' ? 'approved' : proposal.workStatus;
                const statusConfig = STATUS_CONFIG[statusKey] || STATUS_CONFIG[proposal.proposalStatus];
                const statusLabel = statusConfig.label;
                const statusColor = statusConfig.color;

                // Format dates - handle both Firestore Timestamp objects and plain numbers
                const formatDate = (timestamp?: any) => {
                  if (!timestamp) return null;
                  
                  let date: Date;
                  
                  // Handle Firestore Timestamp object
                  if (timestamp && typeof timestamp === 'object' && 'seconds' in timestamp && 'nanoseconds' in timestamp) {
                    // Convert Firestore Timestamp to Date
                    const milliseconds = timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000;
                    date = new Date(milliseconds);
                  } else if (typeof timestamp === 'number') {
                    // Handle Unix timestamp (milliseconds)
                    date = new Date(timestamp);
                  } else if (timestamp && typeof timestamp.toDate === 'function') {
                    // Handle Firestore Timestamp with toDate method
                    date = timestamp.toDate();
                  } else {
                    return 'Invalid date';
                  }
                  
                  // Check for invalid date
                  if (isNaN(date.getTime())) return 'Invalid date';
                  return formatDistanceToNow(date, { addSuffix: true });
                };

                // Get exact date for tooltip
                const getExactDate = (timestamp?: any) => {
                  if (!timestamp) return null;
                  
                  let date: Date;
                  
                  if (timestamp && typeof timestamp === 'object' && 'seconds' in timestamp && 'nanoseconds' in timestamp) {
                    const milliseconds = timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000;
                    date = new Date(milliseconds);
                  } else if (typeof timestamp === 'number') {
                    date = new Date(timestamp);
                  } else if (timestamp && typeof timestamp.toDate === 'function') {
                    date = timestamp.toDate();
                  } else {
                    return null;
                  }
                  
                  if (isNaN(date.getTime())) return null;
                  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
                };

                const createdDate = formatDate(proposal.createdAt);
                const completedDate = proposal.workStatus === 'approved' ? formatDate(proposal.updatedAt) : null;
                const createdDateTooltip = getExactDate(proposal.createdAt);
                const completedDateTooltip = proposal.workStatus === 'approved' ? getExactDate(proposal.updatedAt) : null;

                return (
                  <div
                    key={proposal.id}
                    className="bg-white/5 border border-white/10 rounded-xl p-4 hover:border-white/20 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-medium truncate mb-2">{proposal.title}</h3>
                        <div className="flex flex-wrap items-center gap-3 mb-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor}`}>
                            {statusLabel}
                          </span>
                          {proposal.finalAmount && (
                            <span className="text-xs text-gray-400">
                              ₹{proposal.finalAmount.toLocaleString()}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400">
                          <span title={createdDateTooltip || undefined}>Created: {createdDate}</span>
                          {completedDate && (
                            <span title={completedDateTooltip || undefined}>Completed: {completedDate}</span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleViewProposal(proposal.id)}
                        className="flex-shrink-0 px-4 py-2 bg-[#00D9FF] hover:bg-[#00D9FF]/80 text-black text-sm font-semibold rounded-lg transition-colors"
                      >
                        View Proposal
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-400 mb-4">You haven't sent any proposals to this influencer yet.</p>
              <button
                onClick={handleCreateProposal}
                className="bg-[#B8FF00] hover:bg-[#B8FF00]/80 text-gray-900 font-semibold px-6 py-2 rounded-xl transition-colors"
              >
                Send Your First Proposal
              </button>
            </div>
          )}
        </div>
      )}

      </div>
  );
}
