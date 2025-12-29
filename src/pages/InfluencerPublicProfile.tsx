// ============================================
// PUBLIC INFLUENCER PROFILE VIEW
// ============================================

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores';
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { User, Review, Proposal } from '../types';

// ============================================
// MESSAGE MODAL COMPONENT
// ============================================

interface MessageModalProps {
  influencerName: string;
  onClose: () => void;
  onDirectChat: () => void;
  onCreateProposal: () => void;
  onOpenProposalChat: (proposalId: string) => void;
  proposals: Proposal[];
  loadingProposals: boolean;
}

function MessageModal({
  influencerName,
  onClose,
  onDirectChat,
  onCreateProposal,
  onOpenProposalChat,
  proposals,
  loadingProposals,
}: MessageModalProps) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl max-w-lg w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">Send a Message</h2>
              <p className="text-gray-400 text-sm mt-1">
                Chat with {influencerName}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* Direct Chat Option */}
          <button
            onClick={onDirectChat}
            className="w-full bg-gradient-to-r from-[#00D9FF]/20 to-[#B8FF00]/20 border border-[#00D9FF]/30 rounded-xl p-4 hover:border-[#00D9FF]/50 transition-all mb-4 group"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-[#00D9FF]/20 rounded-xl group-hover:bg-[#00D9FF]/30 transition-colors">
                <svg className="w-6 h-6 text-[#00D9FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div className="flex-1 text-left">
                <div className="text-white font-semibold">Direct Chat</div>
                <div className="text-gray-400 text-sm">Start a casual conversation</div>
              </div>
              <svg className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>

          {/* Create Proposal Option */}
          <button
            onClick={onCreateProposal}
            className="w-full bg-gradient-to-r from-[#B8FF00]/20 to-[#00D9FF]/20 border border-[#B8FF00]/30 rounded-xl p-4 hover:border-[#B8FF00]/50 transition-all mb-6 group"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-[#B8FF00]/20 rounded-xl group-hover:bg-[#B8FF00]/30 transition-colors">
                <svg className="w-6 h-6 text-[#B8FF00]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="flex-1 text-left">
                <div className="text-white font-semibold">Send a Proposal</div>
                <div className="text-gray-400 text-sm">Start a formal collaboration</div>
              </div>
              <svg className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>

          {/* Previous Proposals Section */}
          {loadingProposals ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#B8FF00]"></div>
            </div>
          ) : proposals.length > 0 ? (
            <div>
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Previous Proposals ({proposals.length})
              </h3>
              <div className="space-y-2">
                {proposals.map((proposal) => (
                  <div
                    key={proposal.id}
                    className="bg-white/5 border border-white/10 rounded-xl p-4 hover:border-white/20 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-white font-medium truncate">{proposal.title}</h4>
                        <div className="flex items-center gap-3 mt-1">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            proposal.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                            proposal.status === 'discussing' ? 'bg-blue-500/20 text-blue-400' :
                            proposal.status === 'finalized' ? 'bg-purple-500/20 text-purple-400' :
                            proposal.status === 'in_progress' ? 'bg-[#B8FF00]/20 text-[#B8FF00]' :
                            proposal.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                            'bg-gray-500/20 text-gray-400'
                          }`}>
                            {proposal.status.replace('_', ' ')}
                          </span>
                          {proposal.finalAmount && (
                            <span className="text-xs text-gray-400">
                              ${proposal.finalAmount.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => onOpenProposalChat(proposal.id)}
                        className="flex-shrink-0 px-3 py-1.5 bg-[#00D9FF] hover:bg-[#00D9FF]/80 text-black text-xs font-semibold rounded-lg transition-colors"
                      >
                        Open Chat
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default function InfluencerPublicProfile() {
  const { uid } = useParams<{ uid: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [influencer, setInfluencer] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [existingProposals, setExistingProposals] = useState<Proposal[]>([]);
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

  const handleSendMessage = async () => {
    if (!user?.uid || !uid) return;

    // Check if user is authenticated
    if (!user.roles.includes('promoter')) {
      alert('Please switch to promoter role to send messages to influencers.');
      return;
    }

    // Fetch all existing proposals with this influencer
    setLoadingProposals(true);
    try {
      const proposalsQuery = query(
        collection(db, 'proposals'),
        where('promoterId', '==', user.uid),
        where('influencerId', '==', uid)
      );
      const proposalsSnapshot = await getDocs(proposalsQuery);

      const proposals: Proposal[] = proposalsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          promoterId: data.promoterId,
          influencerId: data.influencerId,
          status: data.status,
          createdAt: data.createdAt?.toMillis?.() || data.createdAt || 0,
          updatedAt: data.updatedAt?.toMillis?.() || data.updatedAt || 0,
          title: data.title,
          description: data.description,
          requirements: data.requirements,
          deliverables: data.deliverables || [],
          proposedBudget: data.proposedBudget,
          finalAmount: data.finalAmount,
          advancePaid: data.advancePaid || false,
          advanceAmount: data.advanceAmount,
          advancePercentage: data.advancePercentage,
          remainingAmount: data.remainingAmount,
          attachments: data.attachments || [],
          deadline: data.deadline?.toMillis?.() || data.deadline,
          brandApproval: data.brandApproval,
          influencerApproval: data.influencerApproval,
          completionPercentage: data.completionPercentage || 0,
        };
      });

      // Sort by updatedAt (most recent first)
      proposals.sort((a, b) => b.updatedAt - a.updatedAt);

      setExistingProposals(proposals);
      setShowMessageModal(true);
    } catch (error) {
      console.error('Error fetching proposals:', error);
    } finally {
      setLoadingProposals(false);
    }
  };

  const handleMessageModalClose = () => {
    setShowMessageModal(false);
  };

  const handleDirectChat = () => {
    // Navigate to direct messages for this influencer
    navigate(`/promoter/messages/${uid}`);
    setShowMessageModal(false);
  };

  const handleCreateProposal = () => {
    // Navigate to create proposal form
    const profile = influencer?.influencerProfile;
    navigate(`/promoter/proposals?create=true&influencerId=${uid}&influencerName=${encodeURIComponent(profile?.displayName || '')}`);
    setShowMessageModal(false);
  };

  const handleOpenProposalChat = (proposalId: string) => {
    // Navigate to proposal-specific chat
    navigate(`/promoter/messages/${uid}/${proposalId}`);
    setShowMessageModal(false);
  };

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
                <button
                  onClick={handleSendMessage}
                  className="bg-[#B8FF00] hover:bg-[#B8FF00]/80 text-gray-900 font-semibold px-6 py-2 rounded-xl transition-colors"
                >
                  Send Message
                </button>
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

            {/* Languages */}
            {profile.languages && profile.languages.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {profile.languages.map((language) => (
                  <span
                    key={language}
                    className="px-3 py-1 bg-white/10 text-gray-400 rounded-full text-sm"
                  >
                    {language}
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
            {profile.socialMediaLinks.map((link) => (
              <div
                key={link.platform}
                className="flex items-center justify-between bg-white/5 rounded-xl p-4"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">
                    {link.platform === 'instagram' && '📸'}
                    {link.platform === 'youtube' && '▶️'}
                    {link.platform === 'tiktok' && '🎵'}
                  </span>
                  <div>
                    <div className="text-white capitalize">{link.platform}</div>
                    <div className="text-gray-500 text-sm">
                      {(link.followerCount / 1000).toFixed(1)}K followers
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

      {/* Message Modal */}
      {showMessageModal && (
        <MessageModal
          influencerName={profile.displayName}
          onClose={handleMessageModalClose}
          onDirectChat={handleDirectChat}
          onCreateProposal={handleCreateProposal}
          onOpenProposalChat={handleOpenProposalChat}
          proposals={existingProposals}
          loadingProposals={loadingProposals}
        />
      )}
    </div>
  );
}
