// ============================================
// INFLUENCER PROFILE PAGE
// ============================================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { resizeImage } from '../../utils/imageUtils';
import { db, storage } from '../../lib/firebase';
import { CATEGORIES } from '../../constants/categories';
import SocialMediaSection from '../../components/SocialMediaSection';
import { useSocialMediaFetch } from '../../hooks/useSocialMediaFetch';
import { useInstagramAnalytics } from '../../hooks/useInstagramAnalytics';
import { IoLogoInstagram, IoLogoYoutube, IoLogoFacebook } from 'react-icons/io5';
import { toast } from '../../stores/uiStore';
import type { InstagramAnalytics, InstagramAnalyticsAlt } from '../../types';

export default function InfluencerProfile() {
  const { user, updateUserProfile, setActiveRole } = useAuthStore();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Hooks for social media fetching
  const { fetchFollowerCount } = useSocialMediaFetch();
  const { fetchAnalytics: fetchInstagramAnalytics } = useInstagramAnalytics();

  // Local state for editing
  const [editedProfile, setEditedProfile] = useState(user?.influencerProfile);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [mediaKitFile, setMediaKitFile] = useState<File | null>(null);

  // Track selected social media platforms
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(
    user?.influencerProfile?.socialMediaLinks?.map(link => link.platform) || []
  );

  // Instagram analytics state
  const [fetchingStatus, setFetchingStatus] = useState<Record<string, boolean>>({});
  const [fetchError, setFetchError] = useState<Record<string, string>>({});
  const [manuallyEnteredFollowers, setManuallyEnteredFollowers] = useState<Record<string, boolean>>({});
  const [instagramAnalytics, setInstagramAnalytics] = useState<InstagramAnalytics | InstagramAnalyticsAlt | null>(null);
  const [isInstagramReportExpanded, setIsInstagramReportExpanded] = useState(true);

  // Auto-expand Instagram analytics report when available
  useEffect(() => {
    if (instagramAnalytics && !fetchingStatus.instagram) {
      setIsInstagramReportExpanded(true);
    }
  }, [instagramAnalytics, fetchingStatus.instagram]);

  if (!user?.influencerProfile) {
    return (
      <div className="p-8">
        <p className="text-gray-400">Profile not found. Please complete your signup first.</p>
      </div>
    );
  }

  const profile = user.influencerProfile;

  // Construct full URL from username for saving
  const constructFullUrl = (platform: string, username: string): string => {
    if (!username) return '';
    
    // If it already starts with https://, return as is
    if (username.startsWith('https://')) return username;
    
    // For Instagram, YouTube, Facebook - construct the full URL
    const prefixes: Record<string, string> = {
      instagram: 'https://instagram.com/',
      youtube: 'https://youtube.com/@',
      facebook: 'https://facebook.com/'
    };
    
    const prefix = prefixes[platform];
    if (!prefix) return username;
    
    return `${prefix}${username}`;
  };

  const handleEdit = () => {
    setEditedProfile({ ...profile });
    setSelectedPlatforms(profile.socialMediaLinks.map(link => link.platform));
    setIsEditing(true);
  };

  const handleCancel = () => {
    setEditedProfile({ ...profile });
    setProfileImageFile(null);
    setMediaKitFile(null);
    setSelectedPlatforms(profile.socialMediaLinks.map(link => link.platform));
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!editedProfile || !user?.uid) return;

    setIsSaving(true);
    try {
      let profileImageUrl = editedProfile.profileImage;
      let mediaKitUrl = editedProfile.mediaKit;

      // Upload new profile image if changed
      if (profileImageFile) {
        // Resize image to 150px max height before upload
        const resizedImage = await resizeImage(profileImageFile, 150, 0.8);
        const imageRef = ref(storage, `users/${user.uid}/profile/${Date.now()}_${resizedImage.name}`);
        await uploadBytes(imageRef, resizedImage);
        profileImageUrl = await getDownloadURL(imageRef);
      }

      // Upload new media kit if changed
      if (mediaKitFile) {
        const mediaKitRef = ref(storage, `users/${user.uid}/mediakit/${Date.now()}_${mediaKitFile.name}`);
        await uploadBytes(mediaKitRef, mediaKitFile);
        mediaKitUrl = await getDownloadURL(mediaKitRef);
      }

      // Construct full URLs for social media links before saving
      const socialMediaLinks = editedProfile.socialMediaLinks.map(link => ({
        ...link,
        url: constructFullUrl(link.platform, link.url)
      }));

      // Update Firestore
      await updateDoc(doc(db, 'users', user.uid), {
        influencerProfile: {
          ...editedProfile,
          profileImage: profileImageUrl,
          socialMediaLinks,
          ...(mediaKitUrl && { mediaKit: mediaKitUrl }),
        },
        updatedAt: serverTimestamp(),
      });

      // Update local store
      updateUserProfile({
        influencerProfile: {
          ...editedProfile,
          profileImage: profileImageUrl,
          socialMediaLinks,
          ...(mediaKitUrl && { mediaKit: mediaKitUrl }),
        },
      });

      setIsEditing(false);
      setProfileImageFile(null);
      setMediaKitFile(null);
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const formatFollowerCount = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  // Strip the URL prefix to get just the username for display/editing
  const stripUrlPrefix = (platform: string, fullUrl: string): string => {
    if (!fullUrl) return '';
    const prefixes: Record<string, string> = {
      instagram: 'https://instagram.com/',
      youtube: 'https://youtube.com/@',
      facebook: 'https://facebook.com/'
    };
    
    const prefix = prefixes[platform];
    if (!prefix) return fullUrl;
    
    if (fullUrl.startsWith(prefix)) {
      return fullUrl.substring(prefix.length);
    }
    // Also try without https://
    const httpPrefix = prefix.replace('https://', '');
    if (fullUrl.includes(httpPrefix)) {
      const parts = fullUrl.split(httpPrefix);
      return parts.length > 1 ? parts[1] : fullUrl;
    }
    return fullUrl;
  };

  const getSocialIcon = (platform: string) => {
    const icons: Record<string, React.ReactNode> = {
      instagram: <IoLogoInstagram className="text-xl text-pink-500" />,
      youtube: <IoLogoYoutube className="text-xl text-red-500" />,
      facebook: <IoLogoFacebook className="text-xl text-blue-500" />
    };
    return icons[platform] || null;
  };

  // Social media handling functions (similar to signup)
  const handleSocialMediaChange = (index: number, field: string, value: any) => {
    if (!editedProfile) return;
    
    const updatedSocialMediaLinks = [...editedProfile.socialMediaLinks];
    updatedSocialMediaLinks[index] = { ...updatedSocialMediaLinks[index], [field]: value };
    
    setEditedProfile(prev => prev ? { ...prev, socialMediaLinks: updatedSocialMediaLinks } : prev);

    // Clear Instagram analytics report when URL changes
    if (field === 'url') {
      setInstagramAnalytics(null);
      setFetchError(prev => ({ ...prev, [updatedSocialMediaLinks[index].platform]: '' }));
      // Reset manual entry flag
      setManuallyEnteredFollowers(prev => ({ ...prev, [updatedSocialMediaLinks[index].platform]: false }));
    } else {
      // Mark as manually entered if user changes follower count
      if (field === 'followerCount') {
        setManuallyEnteredFollowers(prev => ({ ...prev, [updatedSocialMediaLinks[index].platform]: true }));
      }
    }

    // Clear error when user manually changes follower count
    if (field === 'followerCount') {
      setFetchError(prev => ({ ...prev, [updatedSocialMediaLinks[index].platform]: '' }));
    }
  };

  const handleSocialMediaBlur = async (index: number, platform: string, value: string) => {
    if (!editedProfile || !value.trim()) return;

    // Always fetch when username changes (even if follower count is already set)
    // This ensures we get fresh analytics when user updates their username
    await autoFetchFollowerCount(platform, value, index);
  };

  // Debounced auto-fetch for follower counts
  const autoFetchFollowerCount = async (platform: string, username: string, index: number) => {
    setFetchingStatus(prev => ({ ...prev, [platform]: true }));
    setFetchError(prev => ({ ...prev, [platform]: '' })); // Clear previous error

    // For Instagram, use the new detailed analytics API
    if (platform === 'instagram') {
      const result = await fetchInstagramAnalytics(username);

      setFetchingStatus(prev => ({ ...prev, [platform]: false }));

      if (result.success && result.data) {
        setEditedProfile(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            socialMediaLinks: prev.socialMediaLinks.map((l, i) =>
              i === index ? { ...l, followerCount: result.data!.followers } : l
            )
          };
        });
        setFetchError(prev => ({ ...prev, [platform]: '' })); // Clear error on success
        // Reset manual entry flag since this was fetched
        setManuallyEnteredFollowers(prev => ({ ...prev, [platform]: false }));
        toast.success(`Fetched ${result.data!.followers.toLocaleString()} followers for ${username}`);

        // Also show the detailed report card
        setInstagramAnalytics(result.data);
      } else if (result.error) {
        setFetchError(prev => ({ ...prev, [platform]: `Failed to auto fetch, please update follower count manually` }));
      }
      return;
    }

    // For YouTube and Facebook, use the old API
    const result = await fetchFollowerCount(platform, username);

    setFetchingStatus(prev => ({ ...prev, [platform]: false }));

    if (result.success && result.data) {
      setEditedProfile(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          socialMediaLinks: prev.socialMediaLinks.map((l, i) =>
            i === index ? { ...l, followerCount: result.data!.followerCount } : l
          )
        };
      });
      setFetchError(prev => ({ ...prev, [platform]: '' })); // Clear error on success
      // Reset manual entry flag since this was fetched
      setManuallyEnteredFollowers(prev => ({ ...prev, [platform]: false }));
      toast.success(`Fetched ${result.data.followerCount.toLocaleString()} ${platform === 'youtube' ? 'subscribers' : 'followers'} for ${username}`);
    } else if (result.error) {
      setFetchError(prev => ({ ...prev, [platform]: `Failed to auto fetch, please update ${platform === 'youtube' ? 'subscriber' : 'follower'} count manually` }));
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Profile</h1>
          <p className="text-gray-400">View and manage your influencer profile</p>
        </div>
        {!isEditing && (
          <button
            onClick={handleEdit}
            className="bg-[#00D9FF] hover:bg-[#00D9FF]/80 text-gray-900 font-semibold px-6 py-2.5 rounded-xl transition-colors"
          >
            Edit Profile
          </button>
        )}
      </div>

      {!user.businessProfile?.influencer?.isComplete && (
        <div className="mb-6 rounded-2xl border border-orange-500/30 bg-orange-500/10 p-4 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-orange-200">Business profile setup is pending</p>
            <p className="text-xs text-orange-200/80 mt-1">
              Add billing details to enable invoice and record-keeping for collaborations.
            </p>
          </div>
          <button
            onClick={() => navigate('/influencer/business-profile')}
            className="shrink-0 px-4 py-2 bg-orange-500 hover:bg-orange-500/80 text-white font-semibold rounded-xl transition-colors"
          >
            Complete now
          </button>
        </div>
      )}

      {isEditing ? (
        // EDIT MODE
        <div className="space-y-6">
          {/* Profile Image Upload */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Profile Image</h3>
            <div className="flex items-center gap-6">
              <img
                src={profileImageFile ? URL.createObjectURL(profileImageFile) : profile.profileImage}
                alt="Profile"
                className="w-24 h-24 rounded-full object-cover bg-white/10"
              />
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setProfileImageFile(e.target.files?.[0] || null)}
                  className="hidden"
                  id="editProfileImage"
                />
                <label
                  htmlFor="editProfileImage"
                  className="inline-block bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg cursor-pointer transition-colors"
                >
                  Change Photo
                </label>
                <p className="text-gray-500 text-sm mt-2">PNG, JPG up to 5MB</p>
              </div>
            </div>
          </div>

          {/* Basic Info */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Basic Information</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Display Name</label>
                <input
                  type="text"
                  value={editedProfile?.displayName || ''}
                  onChange={(e) => setEditedProfile(prev => prev ? { ...prev, displayName: e.target.value } : prev)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00D9FF]"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Username</label>
                <input
                  type="text"
                  value={editedProfile?.username || ''}
                  disabled
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-gray-400 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">Username cannot be changed</p>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-gray-400 mb-2">Bio</label>
                <textarea
                  value={editedProfile?.bio || ''}
                  onChange={(e) => setEditedProfile(prev => prev ? { ...prev, bio: e.target.value } : prev)}
                  rows={4}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00D9FF] resize-none"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Location</label>
                <input
                  type="text"
                  value={editedProfile?.location || ''}
                  onChange={(e) => setEditedProfile(prev => prev ? { ...prev, location: e.target.value } : prev)}
                  placeholder="City, Country"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00D9FF]"
                />
              </div>
            </div>
          </div>

          {/* Categories */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Categories</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {CATEGORIES.map((category) => (
                <button
                  key={category}
                  onClick={() => {
                    setEditedProfile(prev => {
                      if (!prev) return prev;
                      return {
                        ...prev,
                        categories: prev.categories.includes(category)
                          ? prev.categories.filter(c => c !== category)
                          : [...prev.categories, category]
                      };
                    });
                  }}
                  className={`p-3 rounded-xl text-sm font-medium transition-all ${editedProfile?.categories.includes(category)
                      ? 'bg-[#00D9FF] text-gray-900'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10'
                    }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Social Media */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
            <h3 className="text-lg font-semibold text-white mb-2">Social Media Links</h3>
            <p className="text-gray-400 mb-6">Select the platforms you want to add</p>

            <SocialMediaSection
              socialMediaLinks={editedProfile?.socialMediaLinks || []}
              selectedPlatforms={selectedPlatforms}
              onPlatformToggle={(platformId) => {
                const isSelected = selectedPlatforms.includes(platformId);
                if (isSelected) {
                  setSelectedPlatforms(prev => prev.filter(id => id !== platformId));
                  // Clear data when unchecking
                  setEditedProfile(prev => {
                    if (!prev) return prev;
                    return {
                      ...prev,
                      socialMediaLinks: prev.socialMediaLinks.filter(l => l.platform !== platformId)
                    };
                  });
                } else {
                  setSelectedPlatforms(prev => [...prev, platformId]);
                  // Add new platform with empty data
                  setEditedProfile(prev => {
                    if (!prev) return prev;
                    return {
                      ...prev,
                      socialMediaLinks: [...prev.socialMediaLinks, { platform: platformId, url: '', followerCount: 0 }]
                    };
                  });
                }
              }}
              onSocialMediaChange={handleSocialMediaChange}
              onSocialMediaBlur={handleSocialMediaBlur}
              fetchingStatus={fetchingStatus}
              fetchError={fetchError}
              manuallyEnteredFollowers={manuallyEnteredFollowers}
              instagramAnalytics={instagramAnalytics || undefined}
              isInstagramReportExpanded={isInstagramReportExpanded}
              setIsInstagramReportExpanded={setIsInstagramReportExpanded}
              stripUrlPrefix={stripUrlPrefix}
            />
          </div>

          {/* Media Kit */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Previous Work Samples (Optional)</h3>
            <p className="text-gray-500 text-xs mb-3">
              Showcase your best work, performance data, case studies, or audience insights.
              A strong portfolio helps brands understand your value and collaborate more effectively.
            </p>
            <div className="border-2 border-dashed border-white/10 rounded-xl p-6 text-center">
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => setMediaKitFile(e.target.files?.[0] || null)}
                className="hidden"
                id="editMediaKit"
              />
              <label htmlFor="editMediaKit" className="cursor-pointer">
                {mediaKitFile ? (
                  <p className="text-white">{mediaKitFile.name}</p>
                ) : profile.mediaKit ? (
                  <div>
                    <p className="text-gray-400 mb-2">Current: Media kit uploaded</p>
                    <p className="text-[#00D9FF] text-sm">Click to replace</p>
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">Upload PDF with work samples, case studies, or performance data (max 10MB)</p>
                )}
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={handleCancel}
              disabled={isSaving}
              className="flex-1 bg-white/5 hover:bg-white/10 text-white font-medium py-3 rounded-xl transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 bg-[#00D9FF] hover:bg-[#00D9FF]/80 text-gray-900 font-semibold py-3 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900"></div>
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </div>
      ) : (
        // VIEW MODE
        <div className="space-y-6">
          {/* Profile Header */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <img
                src={profile.profileImage}
                alt={profile.displayName}
                className="w-32 h-32 rounded-full object-cover bg-white/10"
              />
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white mb-1">{profile.displayName}</h2>
                <p className="text-[#00D9FF] mb-3">{profile.username}</p>
                <p className="text-gray-400 mb-4">{profile.bio}</p>
                <div className="flex flex-wrap gap-3 text-sm text-gray-400">
                  {profile.location && (
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {profile.location}
                    </span>
                  )}
                </div>
              </div>
              {user.avgRating > 0 && (
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-1 text-yellow-400 mb-1">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h2.95l-2.293 2.153a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538 1.118l1.518 4.674c.3.922-.755 1.688 1.538 1.118l-3.976-2.888a1 1 0 00-.363-1.118l-2.293-2.153z" />
                    </svg>
                    <span className="text-white font-bold">{user.avgRating.toFixed(1)}</span>
                  </div>
                  <span className="text-xs text-gray-400">{user.totalReviews} reviews</span>
                </div>
              )}
            </div>
          </div>

          {/* Categories */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Categories</h3>
            <div className="flex flex-wrap gap-2">
              {profile.categories.map((category) => (
                <span
                  key={category}
                  className="px-4 py-2 rounded-lg bg-[#00D9FF]/20 text-[#00D9FF] text-sm font-medium"
                >
                  {category}
                </span>
              ))}
            </div>
          </div>

          {/* Social Media Stats */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Social Media</h3>
            <div className="grid md:grid-cols-3 gap-4">
              {profile.socialMediaLinks.map((link) => {
                const platformLabels: Record<string, string> = {
                  instagram: 'Instagram',
                  youtube: 'YouTube',
                  facebook: 'Facebook'
                };
                const platformLabel = platformLabels[link.platform] || link.platform;
                
                return (
                  <div key={link.platform} className="bg-white/5 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">{getSocialIcon(link.platform)}</span>
                      <span className="text-white font-medium">{platformLabel}</span>
                    </div>
                    {link.followerCount > 0 ? (
                      <p className="text-2xl font-bold text-[#00D9FF]">{formatFollowerCount(link.followerCount)}</p>
                    ) : (
                      <p className="text-gray-500 text-sm">Not added</p>
                    )}
                    {link.url && (
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-gray-400 hover:text-[#00D9FF] mt-1 inline-block"
                      >
                        View profile →
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Media Kit */}
          {profile.mediaKit && (
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Media Kit</h3>
              <a
                href={profile.mediaKit}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[#00D9FF] hover:bg-[#00D9FF]/80 text-gray-900 font-medium px-4 py-2 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download Media Kit
              </a>
            </div>
          )}

          {/* Promoter Profile Section */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">Promoter Profile</h3>
                <p className="text-gray-400 text-sm">
                  {user.roles.includes('promoter')
                    ? 'You have both Influencer and Promoter profiles'
                    : 'Create a Promoter profile to hire influencers for your brand'}
                </p>
              </div>
              {user.roles.includes('promoter') ? (
                <button
                  onClick={() => {
                    setActiveRole('promoter');
                    navigate('/promoter/dashboard');
                  }}
                  className="inline-flex items-center gap-2 bg-[#B8FF00] hover:bg-[#B8FF00]/80 text-gray-900 font-medium px-6 py-2.5 rounded-xl transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                  Switch to Promoter
                </button>
              ) : (
                <a
                  href="/signup/promoter"
                  className="inline-flex items-center gap-2 bg-[#B8FF00] hover:bg-[#B8FF00]/80 text-gray-900 font-medium px-6 py-2.5 rounded-xl transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create Promoter Profile
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
