// ============================================
// PROMOTER BROWSE INFLUENCERS PAGE
// ============================================

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';

const CATEGORIES = [
  'Fashion', 'Beauty', 'Lifestyle', 'Tech', 'Fitness',
  'Food', 'Travel', 'Gaming', 'Education', 'Entertainment',
  'Business', 'Health', 'Music', 'Art', 'Photography'
];

const LANGUAGES = [
  'English', 'Hindi', 'Spanish', 'French', 'German',
  'Portuguese', 'Japanese', 'Korean', 'Arabic', 'Chinese'
];

interface InfluencerFilters {
  search: string;
  categories: string[];
  languages: string[];
  minRating: number;
  verifiedOnly: boolean;
}

export default function PromoterBrowse() {
  const navigate = useNavigate();
  const [influencers, setInfluencers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<InfluencerFilters>({
    search: '',
    categories: [],
    languages: [],
    minRating: 0,
    verifiedOnly: false,
  });
  const [savedInfluencers, setSavedInfluencers] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    setLoading(true);

    // Query all users with influencer role
    const usersQuery = query(
      collection(db, 'users'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(usersQuery, (snapshot) => {
      const users = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter((user: any) => user.roles?.includes('influencer') && user.profileComplete);

      setInfluencers(users);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching influencers:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const toggleCategory = (category: string) => {
    setFilters(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }));
  };

  const toggleLanguage = (language: string) => {
    setFilters(prev => ({
      ...prev,
      languages: prev.languages.includes(language)
        ? prev.languages.filter(l => l !== language)
        : [...prev.languages, language]
    }));
  };

  const toggleSave = (influencerId: string) => {
    setSavedInfluencers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(influencerId)) {
        newSet.delete(influencerId);
      } else {
        newSet.add(influencerId);
      }
      return newSet;
    });
  };

  const filteredInfluencers = influencers.filter((influencer: any) => {
    const profile = influencer.influencerProfile;
    if (!profile) return false;

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchesSearch =
        profile.displayName?.toLowerCase().includes(searchLower) ||
        profile.username?.toLowerCase().includes(searchLower) ||
        profile.bio?.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }

    // Category filter
    if (filters.categories.length > 0) {
      const hasCategory = filters.categories.some(cat => profile.categories?.includes(cat));
      if (!hasCategory) return false;
    }

    // Language filter
    if (filters.languages.length > 0) {
      const hasLanguage = filters.languages.some(lang => profile.languages?.includes(lang));
      if (!hasLanguage) return false;
    }

    // Rating filter
    if (filters.minRating > 0) {
      if ((influencer.avgRating || 0) < filters.minRating) return false;
    }

    // Verified filter
    if (filters.verifiedOnly) {
      if (influencer.totalReviews === 0) return false;
    }

    return true;
  });

  const formatFollowerCount = (count: number) => {
    if (!count) return '0';
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      categories: [],
      languages: [],
      minRating: 0,
      verifiedOnly: false,
    });
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Browse Influencers</h1>
        <p className="text-gray-400">Discover and connect with creators for your campaigns</p>
      </div>

      {/* Search and Filter Bar */}
      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by name, username, or keywords..."
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#B8FF00]"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`px-6 py-3 rounded-xl font-medium transition-colors flex items-center gap-2 ${
            showFilters || filters.categories.length > 0 || filters.languages.length > 0 || filters.minRating > 0 || filters.verifiedOnly
              ? 'bg-[#B8FF00] text-gray-900'
              : 'bg-white/5 text-white hover:bg-white/10'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Filters
          {(filters.categories.length > 0 || filters.languages.length > 0 || filters.minRating > 0 || filters.verifiedOnly) && (
            <span className="bg-gray-900/20 px-2 py-0.5 rounded-full text-xs">
              {[filters.categories.length, filters.languages.length, filters.minRating > 0 ? 1 : 0, filters.verifiedOnly ? 1 : 0].reduce((a, b) => a + b, 0)}
            </span>
          )}
        </button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="mb-6 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Filters</h3>
            <button
              onClick={clearFilters}
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              Clear All
            </button>
          </div>

          {/* Rating Filter */}
          <div className="mb-6">
            <label className="block text-sm text-gray-400 mb-2">Minimum Rating</label>
            <div className="flex gap-2">
              {[0, 4, 4.5, 5].map(rating => (
                <button
                  key={rating}
                  onClick={() => setFilters(prev => ({ ...prev, minRating: rating }))}
                  className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                    filters.minRating === rating
                      ? 'bg-[#B8FF00] text-gray-900'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  {rating === 0 ? 'All' : `${rating}+`}
                </button>
              ))}
            </div>
          </div>

          {/* Categories */}
          <div className="mb-6">
            <label className="block text-sm text-gray-400 mb-2">Categories</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(category => (
                <button
                  key={category}
                  onClick={() => toggleCategory(category)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    filters.categories.includes(category)
                      ? 'bg-[#B8FF00] text-gray-900'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Languages */}
          <div className="mb-6">
            <label className="block text-sm text-gray-400 mb-2">Languages</label>
            <div className="flex flex-wrap gap-2">
              {LANGUAGES.map(language => (
                <button
                  key={language}
                  onClick={() => toggleLanguage(language)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    filters.languages.includes(language)
                      ? 'bg-[#B8FF00] text-gray-900'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  {language}
                </button>
              ))}
            </div>
          </div>

          {/* Verified Toggle */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Verified only (completed projects)</span>
            <button
              onClick={() => setFilters(prev => ({ ...prev, verifiedOnly: !prev.verifiedOnly }))}
              className={`w-12 h-6 rounded-full transition-colors ${
                filters.verifiedOnly ? 'bg-[#B8FF00]' : 'bg-white/10'
              }`}
            >
              <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                filters.verifiedOnly ? 'translate-x-6' : 'translate-x-0.5'
              }`} />
            </button>
          </div>
        </div>
      )}

      {/* Results Count */}
      <div className="mb-4 text-sm text-gray-400">
        {loading ? (
          'Loading influencers...'
        ) : (
          <>
            Showing {filteredInfluencers.length} of {influencers.length} influencers
          </>
        )}
      </div>

      {/* Influencers Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#B8FF00]"></div>
        </div>
      ) : filteredInfluencers.length === 0 ? (
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-12 text-center">
          <svg className="w-16 h-16 text-gray-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-white font-semibold mb-2">No influencers found</h3>
          <p className="text-gray-400 text-sm mb-4">Try adjusting your filters or search terms</p>
          <button
            onClick={clearFilters}
            className="bg-[#B8FF00] hover:bg-[#B8FF00]/80 text-gray-900 font-semibold px-6 py-2 rounded-xl transition-colors"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredInfluencers.map((influencer) => {
            const profile = influencer.influencerProfile;
            if (!profile) return null;

            return (
              <div
                key={influencer.id}
                className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 hover:border-white/20 transition-colors"
              >
                {/* Header */}
                <div className="flex items-start gap-4 mb-4">
                  <img
                    src={profile.profileImage || 'https://via.placeholder.com/100'}
                    alt={profile.displayName}
                    className="w-16 h-16 rounded-full object-cover bg-white/10"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-white font-semibold truncate">{profile.displayName}</h3>
                      {influencer.totalReviews > 0 && (
                        <span className="flex-shrink-0 px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full border border-green-500/30">
                          Verified
                        </span>
                      )}
                    </div>
                    <p className="text-[#B8FF00] text-sm mb-1">@{profile.username}</p>
                    {influencer.avgRating > 0 && (
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h2.95l-2.293 2.153a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-.363-1.118l-2.293-2.153z" />
                        </svg>
                        <span className="text-white text-sm">{influencer.avgRating.toFixed(1)}</span>
                        <span className="text-gray-500 text-xs">({influencer.totalReviews})</span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => toggleSave(influencer.id)}
                    className={`p-2 rounded-lg transition-colors ${
                      savedInfluencers.has(influencer.id)
                        ? 'bg-[#B8FF00] text-gray-900'
                        : 'bg-white/5 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    <svg className="w-5 h-5" fill={savedInfluencers.has(influencer.id) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </button>
                </div>

                {/* Bio */}
                <p className="text-gray-400 text-sm line-clamp-2 mb-4">{profile.bio}</p>

                {/* Categories */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {profile.categories?.slice(0, 3).map((category: string) => (
                    <span
                      key={category}
                      className="px-2 py-1 bg-white/5 rounded text-xs text-gray-300"
                    >
                      {category}
                    </span>
                  ))}
                  {profile.categories?.length > 3 && (
                    <span className="px-2 py-1 bg-white/5 rounded text-xs text-gray-500">
                      +{profile.categories.length - 3}
                    </span>
                  )}
                </div>

                {/* Social Stats */}
                <div className="flex gap-4 mb-4 text-sm">
                  {profile.socialMediaLinks?.filter((link: any) => link.followerCount > 0).slice(0, 2).map((link: any) => (
                    <div key={link.platform} className="flex items-center gap-1">
                      <span className="text-gray-500">
                        {link.platform === 'instagram' ? '📸' : link.platform === 'youtube' ? '▶️' : '🎵'}
                      </span>
                      <span className="text-white font-medium">{formatFollowerCount(link.followerCount)}</span>
                    </div>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/promoter/proposals/new?influencer=${influencer.id}`)}
                    className="flex-1 bg-[#B8FF00] hover:bg-[#B8FF00]/80 text-gray-900 font-medium py-2 rounded-xl transition-colors text-sm"
                  >
                    Send Proposal
                  </button>
                  <button
                    onClick={() => navigate(`/influencer/${influencer.id}`)}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white font-medium rounded-xl transition-colors text-sm"
                  >
                    View Profile
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
