// ============================================
// PUBLIC PROMOTER PROFILE VIEW
// ============================================

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import type { User, Review } from '../types';

export default function PromoterPublicProfile() {
  const { uid } = useParams<{ uid: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [promoter, setPromoter] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    if (!uid) return;

    const fetchPromoter = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', uid));

        if (!userDoc.exists()) {
          setNotFound(true);
          setLoading(false);
          return;
        }

        const userData = userDoc.data();

        // Check if user has promoter profile
        if (!userData.promoterProfile) {
          setNotFound(true);
          setLoading(false);
          return;
        }

        setPromoter({
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
        console.error('Error fetching promoter:', error);
        setLoading(false);
      }
    };

    fetchPromoter();
  }, [uid]);

  const handleSendMessage = () => {
    // TODO: Navigate to create proposal or message page
    // For now, just show an alert
    alert('Message functionality coming soon! This will allow you to send a collaboration inquiry.');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00D9FF]"></div>
      </div>
    );
  }

  if (notFound || !promoter) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Promoter Not Found</h2>
          <button
            onClick={() => navigate('/influencer/dashboard')}
            className="bg-[#B8FF00] hover:bg-[#B8FF00]/80 text-gray-900 font-semibold px-6 py-2 rounded-xl transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const profile = promoter.promoterProfile!;
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
          {/* Logo */}
          <div className="flex-shrink-0">
            <img
              src={profile.logo}
              alt={profile.name}
              className="w-32 h-32 rounded-2xl object-cover border-4 border-white/10"
              onError={(e) => {
                e.currentTarget.src = `https://api.dicebear.com/7.x/initials/svg?seed=${profile.name}`;
              }}
            />
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-white mb-1">
                  {profile.name}
                  {promoter.avgRating > 0 && (
                    <span className="ml-2 text-sm text-[#B8FF00]">★ Verified</span>
                  )}
                </h1>
                <div className="flex items-center gap-2 text-gray-400">
                  <span className="px-2 py-0.5 bg-white/10 rounded text-xs capitalize">
                    {profile.type}
                  </span>
                  <span>•</span>
                  <span>{profile.industry}</span>
                </div>
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
                <div className="text-2xl font-bold text-white">{promoter.avgRating.toFixed(1)}</div>
                <div className="text-gray-500 text-sm">⭐ Rating</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{promoter.totalReviews}</div>
                <div className="text-gray-500 text-sm">Reviews</div>
              </div>
            </div>

            {/* Description */}
            {profile.description && (
              <p className="text-gray-300 mb-4">{profile.description}</p>
            )}

            {/* Website */}
            {profile.website && (
              <a
                href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-[#00D9FF] hover:underline"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
                {profile.website.replace(/^https?:\/\//, '')}
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Brands (for agencies) */}
      {profile.type === 'agency' && profile.brands && profile.brands.length > 0 && (
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">Brands Managed</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {profile.brands.map((brand) => (
              <div
                key={brand}
                className="flex items-center gap-3 bg-white/5 rounded-xl p-4"
              >
                <div className="w-10 h-10 bg-[#B8FF00]/20 rounded-lg flex items-center justify-center">
                  <span className="text-[#B8FF00] font-semibold">{brand[0]}</span>
                </div>
                <div className="text-white capitalize">{brand}</div>
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
    </div>
  );
}
