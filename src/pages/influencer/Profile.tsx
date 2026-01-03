// ============================================
// INFLUENCER PROFILE PAGE
// ============================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../lib/firebase';
import { CATEGORIES } from '../../constants/categories';
import { IoLogoInstagram, IoLogoYoutube, IoLogoFacebook } from 'react-icons/io5';

const LANGUAGES = [
  'English', 'Hindi', 'Spanish', 'French', 'German',
  'Portuguese', 'Japanese', 'Korean', 'Arabic', 'Chinese'
];

const PLATFORMS = [
  {
    id: 'instagram',
    label: 'Instagram',
    icon: IoLogoInstagram,
    color: 'text-pink-500',
    urlPrefix: 'instagram.com/',
    placeholder: 'username'
  },
  {
    id: 'youtube',
    label: 'YouTube',
    icon: IoLogoYoutube,
    color: 'text-red-500',
    urlPrefix: 'youtube.com/@',
    placeholder: 'channelname'
  },
  {
    id: 'facebook',
    label: 'Facebook',
    icon: IoLogoFacebook,
    color: 'text-blue-500',
    urlPrefix: 'facebook.com/',
    placeholder: 'page-or-profile'
  }
];

export default function InfluencerProfile() {
  const { user, updateUserProfile, setActiveRole } = useAuthStore();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Local state for editing
  const [editedProfile, setEditedProfile] = useState(user?.influencerProfile);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [mediaKitFile, setMediaKitFile] = useState<File | null>(null);

  // Track selected social media platforms
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(
    user?.influencerProfile?.socialMediaLinks?.map(link => link.platform) || []
  );

  if (!user?.influencerProfile) {
    return (
      <div className="p-8">
        <p className="text-gray-400">Profile not found. Please complete your signup first.</p>
      </div>
    );
  }

  const profile = user.influencerProfile;

  const getSocialIcon = (platform: string) => {
    const platformData = PLATFORMS.find(p => p.id === platform);
    if (!platformData) return null;
    const Icon = platformData.icon;
    return <Icon className={`text-xl ${platformData.color}`} />;
  };

  // Strip the URL prefix to get just the username for display/editing
  const stripUrlPrefix = (platform: string, fullUrl: string): string => {
    if (!fullUrl) return '';
    const platformData = PLATFORMS.find(p => p.id === platform);
    if (!platformData) return fullUrl;

    const prefix = `https://${platformData.urlPrefix}`;
    if (fullUrl.startsWith(prefix)) {
      return fullUrl.substring(prefix.length);
    }
    // Also try without https://
    const httpPrefix = platformData.urlPrefix;
    if (fullUrl.includes(httpPrefix)) {
      const parts = fullUrl.split(httpPrefix);
      return parts.length > 1 ? parts[1] : fullUrl;
    }
    return fullUrl;
  };

  // Construct full URL from username for saving
  const constructFullUrl = (platform: string, username: string): string => {
    if (!username) return '';
    const platformData = PLATFORMS.find(p => p.id === platform);
    if (!platformData) return username;

    // If it already starts with https://, return as is
    if (username.startsWith('https://')) return username;

    return `https://${platformData.urlPrefix}${username}`;
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
        const imageRef = ref(storage, `users/${user.uid}/profile/${Date.now()}_${profileImageFile.name}`);
        await uploadBytes(imageRef, profileImageFile);
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
              <div>
                <label className="block text-sm text-gray-400 mb-2">Languages</label>
                <div className="flex flex-wrap gap-2">
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang}
                      onClick={() => {
                        setEditedProfile(prev => {
                          if (!prev) return prev;
                          return {
                            ...prev,
                            languages: prev.languages.includes(lang)
                              ? prev.languages.filter(l => l !== lang)
                              : [...prev.languages, lang]
                          };
                        });
                      }}
                      className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                        editedProfile?.languages.includes(lang)
                          ? 'bg-[#00D9FF] text-gray-900'
                          : 'bg-white/5 text-gray-400 hover:bg-white/10'
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
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
                  className={`p-3 rounded-xl text-sm font-medium transition-all ${
                    editedProfile?.categories.includes(category)
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

            {/* Platform Selection Checkboxes */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              {PLATFORMS.map((platform) => {
                const Icon = platform.icon;
                const isSelected = selectedPlatforms.includes(platform.id);
                return (
                  <button
                    key={platform.id}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        setSelectedPlatforms(prev => prev.filter(id => id !== platform.id));
                        // Clear data when unchecking
                        setEditedProfile(prev => {
                          if (!prev) return prev;
                          return {
                            ...prev,
                            socialMediaLinks: prev.socialMediaLinks.filter(l => l.platform !== platform.id)
                          };
                        });
                      } else {
                        setSelectedPlatforms(prev => [...prev, platform.id]);
                        // Add new platform with empty data
                        setEditedProfile(prev => {
                          if (!prev) return prev;
                          return {
                            ...prev,
                            socialMediaLinks: [...prev.socialMediaLinks, { platform: platform.id, url: '', followerCount: 0 }]
                          };
                        });
                      }
                    }}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                      isSelected
                        ? 'bg-[#00D9FF]/10 border-[#00D9FF] shadow-[0_0_20px_rgba(0,217,255,0.3)]'
                        : 'bg-white/5 border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Icon className={`text-4xl ${isSelected ? platform.color : 'text-gray-500'}`} />
                      <span className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-gray-400'}`}>
                        {platform.label}
                      </span>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                        isSelected ? 'border-[#00D9FF] bg-[#00D9FF]' : 'border-gray-600'
                      }`}>
                        {isSelected && (
                          <svg className="w-3 h-3 text-gray-900" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Selected Platforms Input Fields */}
            {selectedPlatforms.length > 0 && (
              <div className="space-y-6">
                <p className="text-sm text-gray-400">Enter details for your selected platforms</p>
                {editedProfile?.socialMediaLinks
                  .filter(link => selectedPlatforms.includes(link.platform))
                  .map((link) => {
                    const platform = PLATFORMS.find(p => p.id === link.platform);
                    if (!platform) return null;
                    const Icon = platform.icon;
                    return (
                      <div key={link.platform} className="p-5 bg-white/5 rounded-xl border border-white/10">
                        <div className="flex items-center gap-3 mb-4">
                          <Icon className={`text-2xl ${platform.color}`} />
                          <span className="text-white font-medium">{platform.label}</span>
                        </div>

                        <div className="space-y-3">
                          <div className="relative">
                            <div className="flex items-center gap-1">
                              <span className="text-white text-sm whitespace-nowrap">https://{platform.urlPrefix}</span>
                              <input
                                type="text"
                                value={stripUrlPrefix(link.platform, link.url)}
                                onChange={(e) => {
                                  setEditedProfile(prev => {
                                    if (!prev) return prev;
                                    return {
                                      ...prev,
                                      socialMediaLinks: prev.socialMediaLinks.map((l) =>
                                        l.platform === link.platform ? { ...l, url: e.target.value } : l
                                      )
                                    };
                                  });
                                }}
                                placeholder={platform.placeholder}
                                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-[#00D9FF]"
                              />
                            </div>
                          </div>

                          <input
                            type="number"
                            value={link.followerCount || ''}
                            onChange={(e) => {
                              setEditedProfile(prev => {
                                if (!prev) return prev;
                                return {
                                  ...prev,
                                  socialMediaLinks: prev.socialMediaLinks.map((l) =>
                                    l.platform === link.platform ? { ...l, followerCount: parseInt(e.target.value) || 0 } : l
                                  )
                                };
                              });
                            }}
                            placeholder={platform.id === 'youtube' ? 'Subscriber count' : 'Follower count'}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-[#00D9FF]"
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>

          {/* Media Kit */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Media Kit</h3>
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
                  <p className="text-gray-500 text-sm">Upload PDF media kit (max 10MB)</p>
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
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048-9.754 1.12.923 1.12M5 14h14m-5-4h.01M12 19h5M9 19h1m-6-4h.01" />
                    </svg>
                    {profile.languages.join(', ')}
                  </span>
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
                const platform = PLATFORMS.find(p => p.id === link.platform);
                if (!platform) return null;
                return (
                  <div key={link.platform} className="bg-white/5 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">{getSocialIcon(link.platform)}</span>
                      <span className="text-white font-medium">{platform.label}</span>
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
