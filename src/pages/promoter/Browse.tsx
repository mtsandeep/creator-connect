// ============================================
// PROMOTER BROWSE INFLUENCERS PAGE
// ============================================

import { useEffect, useState, useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../stores';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import InfluencerCard from '../../components/influencer/InfluencerCard';
import FilterPanel from '../../components/promoter/FilterPanel';
import type { InfluencerFilters } from '../../types';

interface InfluencerData {
  id: string;
  uid: string;
  influencerProfile: any;
  avgRating: number;
  totalReviews: number;
  completedProjects: number;
  verificationBadges?: {
    verified: boolean;
    trusted: boolean;
  };
}

type ViewMode = 'grid' | 'list';

export default function PromoterBrowse() {
  const { user } = useAuthStore();
  const [influencers, setInfluencers] = useState<InfluencerData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [savedInfluencerIds, setSavedInfluencerIds] = useState<Set<string>>(new Set());

  // Active filters
  const [activeFilters, setActiveFilters] = useState<InfluencerFilters>({});

  // Load saved influencers for this promoter
  useEffect(() => {
    if (!user?.uid || !user.isPromoterVerified) return;

    const loadSavedInfluencers = async () => {
      try {
        const savedDoc = await getDoc(doc(db, 'promoters', user.uid, 'saved', 'influencers'));
        if (savedDoc.exists()) {
          const saved = savedDoc.data();
          setSavedInfluencerIds(new Set(saved.influencerIds || []));
        }
      } catch (error) {
        console.error('Error loading saved influencers:', error);
      }
    };

    loadSavedInfluencers();
  }, [user?.uid, user.isPromoterVerified]);

  useEffect(() => {
    // Don't fetch if not verified
    if (!user?.isPromoterVerified) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setInfluencers([]);

    // Use sessionStorage to track if user has visited before (resets on page reload)
    const sessionKey = `browse_loaded_${user?.uid}`;
    const hasLoadedBefore = sessionStorage.getItem(sessionKey) === 'true';
    let loadingTimeoutId: ReturnType<typeof setTimeout> | null = null;
    let cachedUsers: InfluencerData[] = []; // Store cached data for fallback

    // Query all users with influencer role
    const usersQuery = query(collection(db, 'users'));

    const unsubscribe = onSnapshot(usersQuery, (snapshot) => {
      const users: InfluencerData[] = snapshot.docs
        .map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            uid: doc.id,
            influencerProfile: data.influencerProfile,
            avgRating: data.avgRating || 0,
            totalReviews: data.totalReviews || 0,
            completedProjects: 0,
            verificationBadges: data.verificationBadges || { verified: false, trusted: false },
          };
        })
        .filter(u => u.influencerProfile && u.influencerProfile.displayName)
        // Filter out the promoter's own influencer profile (if they have one)
        .filter(u => u.uid !== user?.uid);

      if (!hasLoadedBefore) {
        // First visit: wait for server data to avoid empty state flash
        if (!snapshot.metadata.fromCache) {
          // Server data received - now update UI
          setInfluencers(users);
          sessionStorage.setItem(sessionKey, 'true');
          if (loadingTimeoutId) clearTimeout(loadingTimeoutId);
          setIsLoading(false);
        } else {
          // Store cached data for potential fallback
          cachedUsers = users;
        }
      } else {
        // Subsequent visits (navigation back) - show data immediately
        setInfluencers(users);
        setIsLoading(false);
      }
    }, (error) => {
      console.error('Error fetching influencers:', error);
      if (loadingTimeoutId) clearTimeout(loadingTimeoutId);
      setIsLoading(false);
    });

    // Fallback: if server takes too long on first load, show cached data after 3 seconds
    if (!hasLoadedBefore) {
      loadingTimeoutId = setTimeout(() => {
        setInfluencers(cachedUsers);
        sessionStorage.setItem(sessionKey, 'true');
        setIsLoading(false);
      }, 3000);
    }

    return () => {
      if (loadingTimeoutId) clearTimeout(loadingTimeoutId);
      unsubscribe();
    };
  }, [user?.uid, user?.isPromoterVerified]);

  // Filter influencers based on active filters
  const filteredInfluencers = useMemo(() => {
    return influencers.filter((influencer) => {
      const profile = influencer.influencerProfile;
      if (!profile) return false;

      // Search filter
      if (activeFilters.search) {
        const searchLower = activeFilters.search.toLowerCase();
        const matchesSearch =
          profile.displayName?.toLowerCase().includes(searchLower) ||
          profile.username?.toLowerCase().includes(searchLower) ||
          profile.bio?.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Categories filter
      if (activeFilters.categories && activeFilters.categories.length > 0) {
        const hasCategory = activeFilters.categories.some(cat => profile.categories?.includes(cat));
        if (!hasCategory) return false;
      }

      // Languages filter
      if (activeFilters.languages && activeFilters.languages.length > 0) {
        const hasLanguage = activeFilters.languages.some(lang => profile.languages?.includes(lang));
        if (!hasLanguage) return false;
      }

      // Rating filter
      if (activeFilters.minRating && activeFilters.minRating > 0) {
        if (influencer.avgRating < activeFilters.minRating) return false;
      }

      // Location filter
      if (activeFilters.location) {
        if (activeFilters.location === 'Remote') {
          // Show all if remote selected
        } else if (!profile.location?.toLowerCase().includes(activeFilters.location.toLowerCase())) {
          return false;
        }
      }

      // Verified only filter
      if (activeFilters.verifiedOnly) {
        if (influencer.totalReviews === 0) return false;
      }

      // Follower range filter
      if (activeFilters.followerRanges && activeFilters.followerRanges.length > 0) {
        const totalFollowers = profile.socialMediaLinks?.reduce(
          (sum: number, link: any) => sum + (link.followerCount || 0), 0
        ) || 0;

        const FollowerRanges: Record<string, { min: number; max: number }> = {
          '1K-10K': { min: 1000, max: 10000 },
          '10K-50K': { min: 10000, max: 50000 },
          '50K-100K': { min: 50000, max: 100000 },
          '100K-500K': { min: 100000, max: 500000 },
          '500K+': { min: 500000, max: Infinity },
        };

        const matchesRange = activeFilters.followerRanges.some(rangeId => {
          const range = FollowerRanges[rangeId];
          return totalFollowers >= range.min && totalFollowers <= range.max;
        });

        if (!matchesRange) return false;
      }

      return true;
    });
  }, [influencers, activeFilters]);

  // Toggle favorite
  const handleToggleFavorite = async (influencerId: string) => {
    if (!user?.uid) return;

    const newSaved = new Set(savedInfluencerIds);
    if (newSaved.has(influencerId)) {
      newSaved.delete(influencerId);
    } else {
      newSaved.add(influencerId);
    }

    setSavedInfluencerIds(newSaved);

    // Save to Firestore
    try {
      await setDoc(
        doc(db, 'promoters', user.uid, 'saved', 'influencers'),
        {
          influencerIds: Array.from(newSaved),
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (error) {
      console.error('Error saving favorite:', error);
      // Revert on error
      setSavedInfluencerIds(savedInfluencerIds);
    }
  };

  const handleFiltersChange = (filters: InfluencerFilters) => {
    setActiveFilters(filters);
  };

  const handleClearFilters = () => {
    setActiveFilters({});
  };

  // Redirect if user doesn't have promoter role
  if (!user?.roles.includes('promoter')) {
    return <Navigate to="/role-selection" replace />;
  }

  // Show verification screen if not verified
  if (!user.isPromoterVerified) {
    return (
      <div className="flex items-center justify-center min-h-screen p-8">
        <div className="max-w-md w-full bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8 text-center">
          <div className="w-16 h-16 bg-[#B8FF00]/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-[#B8FF00]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Verify Your Account</h2>
          <p className="text-gray-400 mb-6">
            To browse and connect with influencers, you need to verify your promoter account with a one-time deposit of ₹1,000.
          </p>
          <div className="bg-white/5 rounded-xl p-4 mb-6 text-left">
            <h3 className="text-white font-medium mb-3">Why verify?</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-[#B8FF00] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>Access to influencer database</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-[#B8FF00] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>Send collaboration proposals</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-[#B8FF00] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>Prevent spam & ensure quality</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-[#B8FF00] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>Deposit is refundable</span>
              </li>
            </ul>
          </div>
          <button
            onClick={() => {
              console.log('Deposit button clicked - payment integration coming soon');
              /* TODO: Integrate payment gateway later */
            }}
            className="w-full bg-[#B8FF00] hover:bg-[#B8FF00]/80 text-gray-900 font-semibold py-3 rounded-xl transition-colors"
          >
            Pay ₹1,000 to Verify
          </button>
          <p className="text-gray-500 text-xs mt-4">
            Secure payment via Razorpay • Refundable deposit
          </p>

          {/* Development: Skip verification button */}
          {import.meta.env.DEV && (
            <button
              onClick={async () => {
                // Temporarily mark as verified (for development only)
                const { updateDoc, doc, serverTimestamp } = await import('firebase/firestore');
                const { db } = await import('../../lib/firebase');
                const { updateUserProfile } = useAuthStore.getState();
                if (user?.uid) {
                  await updateDoc(doc(db, 'users', user.uid), {
                    isPromoterVerified: true,
                    verifiedAt: serverTimestamp(),
                  });
                  // Update local store immediately so UI reflects the change
                  updateUserProfile({ isPromoterVerified: true });
                }
              }}
              className="w-full mt-4 bg-white/10 hover:bg-white/20 text-gray-400 font-medium py-2 rounded-xl transition-colors text-xs"
            >
              DEV: Skip Verification
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Browse Influencers</h1>
            <p className="text-gray-400">Discover and connect with creators for your campaigns</p>
          </div>
          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'grid'
                  ? 'bg-[#B8FF00] text-gray-900'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
              title="Grid view"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'list'
                  ? 'bg-[#B8FF00] text-gray-900'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
              title="List view"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="flex gap-8">
        {/* Sidebar with Filters */}
        <aside className="hidden lg:block w-72 flex-shrink-0">
          <FilterPanel
            filters={activeFilters}
            onFiltersChange={handleFiltersChange}
            onClearFilters={handleClearFilters}
            resultCount={filteredInfluencers.length}
            isOpen={true}
            onToggle={() => {}}
          />
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          {/* Mobile Filter Toggle */}
          <div className="lg:hidden mb-4">
            <FilterPanel
              filters={activeFilters}
              onFiltersChange={handleFiltersChange}
              onClearFilters={handleClearFilters}
              resultCount={filteredInfluencers.length}
              isOpen={filtersOpen}
              onToggle={() => setFiltersOpen(!filtersOpen)}
            />
          </div>

          {/* Mobile View Toggle */}
          <div className="flex md:hidden justify-end mb-4 gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'grid'
                  ? 'bg-[#B8FF00] text-gray-900'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'list'
                  ? 'bg-[#B8FF00] text-gray-900'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>

          {/* Results Count */}
          {!isLoading && (
            <div className="mb-4 text-sm text-gray-400">
              Showing {filteredInfluencers.length} of {influencers.length} influencers
            </div>
          )}

          {/* Loading State */}
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#B8FF00]"></div>
            </div>
          ) : filteredInfluencers.length === 0 ? (
            /* Empty State */
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-12 text-center">
              <svg className="w-16 h-16 text-gray-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <h3 className="text-white font-semibold mb-2">No influencers found</h3>
              <p className="text-gray-400 text-sm mb-4">Try adjusting your filters or search terms</p>
              <button
                onClick={handleClearFilters}
                className="bg-[#B8FF00] hover:bg-[#B8FF00]/80 text-gray-900 font-semibold px-6 py-2 rounded-xl transition-colors"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            /* Influencers Grid/List */
            <div
              className={
                viewMode === 'grid'
                  ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'
                  : 'space-y-4'
              }
            >
              {filteredInfluencers.map((influencer) => (
                <InfluencerCard
                  key={influencer.id}
                  uid={influencer.uid}
                  profile={influencer.influencerProfile}
                  avgRating={influencer.avgRating}
                  totalReviews={influencer.totalReviews}
                  completedProjects={influencer.completedProjects}
                  isVerified={influencer.verificationBadges?.verified || influencer.totalReviews > 0}
                  isTrusted={influencer.verificationBadges?.trusted || false}
                  isFavorite={savedInfluencerIds.has(influencer.id)}
                  onToggleFavorite={handleToggleFavorite}
                  viewMode={viewMode}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
