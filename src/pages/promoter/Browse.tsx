// ============================================
// PROMOTER BROWSE INFLUENCERS PAGE
// ============================================

import { useEffect, useState, useMemo } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../stores';
import { collection, query, onSnapshot, where } from 'firebase/firestore';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import InfluencerCard from '../../components/influencer/InfluencerCard';
import FilterPanel from '../../components/promoter/FilterPanel';
import type { InfluencerFilters } from '../../types';
import { LuGrip, LuList, LuSearch } from 'react-icons/lu';

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
  const [searchParams] = useSearchParams();
  const specificInfluencerId = searchParams.get('influencer'); // From link-in-bio flow
  const [influencers, setInfluencers] = useState<InfluencerData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [savedInfluencerIds, setSavedInfluencerIds] = useState<Set<string>>(new Set());

  // Active filters
  const [activeFilters, setActiveFilters] = useState<InfluencerFilters>({});

  // Check if user has access to browse (verified promoters only)
  const canBrowse = user?.verificationBadges?.promoterVerified;

  // Check if the specific influencer from URL is accessible (verified promoters only)
  const hasAccessToSpecificInfluencer = specificInfluencerId && user?.verificationBadges?.promoterVerified;

  // Load saved influencers for this promoter
  useEffect(() => {
    if (!user?.uid || !user.verificationBadges?.promoterVerified) return;

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
  }, [user?.uid, user?.verificationBadges?.promoterVerified]);

  useEffect(() => {
    // Don't fetch if not verified AND no allowed influencers
    if (!canBrowse) {
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

    // Query all influencers (verified promoter can browse any influencer)
    const usersQuery = query(
      collection(db, 'users'), 
      where('roles', 'array-contains', 'influencer')
    );

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
  }, [user?.uid, canBrowse]);

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
  }, [influencers, activeFilters, specificInfluencerId, user?.verificationBadges?.promoterVerified]);

  // If coming from link-in-bio with a specific influencer, filter to show only that influencer
  const displayInfluencers = useMemo(() => {
    if (specificInfluencerId && hasAccessToSpecificInfluencer) {
      return filteredInfluencers.filter(i => i.uid === specificInfluencerId);
    }
    return filteredInfluencers;
  }, [filteredInfluencers, specificInfluencerId, hasAccessToSpecificInfluencer]);

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
  if (!user.verificationBadges?.promoterVerified) {
    // Clear any previous link-in-bio context and set generic dashboard context
    sessionStorage.removeItem('verificationContext');
    return <Navigate to="/verification" replace />;
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
              <LuGrip className="w-5 h-5" />
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
              <LuList className="w-5 h-5" />
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
            resultCount={displayInfluencers.length}
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
              resultCount={displayInfluencers.length}
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
              <LuGrip className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'list'
                  ? 'bg-[#B8FF00] text-gray-900'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              <LuList className="w-5 h-5" />
            </button>
          </div>

          {/* Results Count */}
          {!isLoading && (
            <div className="mb-4 text-sm text-gray-400">
              Showing {displayInfluencers.length} of {influencers.length} influencers
            </div>
          )}

          {/* Loading State */}
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#B8FF00]"></div>
            </div>
          ) : displayInfluencers.length === 0 ? (
            /* Empty State */
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-12 text-center">
              <LuSearch className="w-16 h-16 text-gray-500 mx-auto mb-4" />
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
              {displayInfluencers.map((influencer) => (
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
