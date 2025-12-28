// ============================================
// INFLUENCER PROFILE PAGE
// ============================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores';
import { useSignOut } from '../../hooks/useAuth';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { auth, db, storage } from '../../lib/firebase';
import type { SocialMediaLink } from '../../types';

const CATEGORIES = [
  'Fashion', 'Beauty', 'Lifestyle', 'Tech', 'Fitness',
  'Food', 'Travel', 'Gaming', 'Education', 'Entertainment',
  'Business', 'Health', 'Music', 'Art', 'Photography'
];

const PLATFORMS = [
  { id: 'instagram', label: 'Instagram', icon: '📸' },
  { id: 'youtube', label: 'YouTube', icon: '▶️' },
  { id: 'tiktok', label: 'TikTok', icon: '🎵' },
];

const RATE_TYPES = [
  { id: 'story', label: 'Instagram Story' },
  { id: 'post', label: 'Feed Post' },
  { id: 'reel', label: 'Instagram Reel' },
  { id: 'video', label: 'YouTube Video' },
];

const LANGUAGES = [
  'English', 'Hindi', 'Spanish', 'French', 'German',
  'Portuguese', 'Japanese', 'Korean', 'Arabic', 'Chinese'
];

export default function InfluencerProfile() {
  const { user, updateUserProfile, setActiveRole } = useAuthStore();
  const { signOut } = useSignOut();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Local state for editing
  const [editedProfile, setEditedProfile] = useState(user?.influencerProfile);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [mediaKitFile, setMediaKitFile] = useState<File | null>(null);

  if (!user?.influencerProfile) {
    return (
      <div className="p-8">
        <p className="text-gray-400">Profile not found. Please complete your signup first.</p>
      </div>
    );
  }

  const profile = user.influencerProfile;

  const handleEdit = () => {
    setEditedProfile({ ...profile });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setEditedProfile({ ...profile });
    setProfileImageFile(null);
    setMediaKitFile(null);
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

      // Update Firestore
      await updateDoc(doc(db, 'users', user.uid), {
        influencerProfile: {
          ...editedProfile,
          profileImage: profileImageUrl,
          ...(mediaKitUrl && { mediaKit: mediaKitUrl }),
        },
        updatedAt: serverTimestamp(),
      });

      // Update local store
      updateUserProfile({
        influencerProfile: {
          ...editedProfile,
          profileImage: profileImageUrl,
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

  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/';
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
                  onChange={(e) => setEditedProfile(prev => ({ ...prev!, displayName: e.target.value }))}
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
                  onChange={(e) => setEditedProfile(prev => ({ ...prev!, bio: e.target.value }))}
                  rows={4}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00D9FF] resize-none"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Location</label>
                <input
                  type="text"
                  value={editedProfile?.location || ''}
                  onChange={(e) => setEditedProfile(prev => ({ ...prev!, location: e.target.value }))}
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
                        setEditedProfile(prev => ({
                          ...prev!,
                          languages: prev!.languages.includes(lang)
                            ? prev.languages.filter(l => l !== lang)
                            : [...prev.languages, lang]
                        }));
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
                    setEditedProfile(prev => ({
                      ...prev!,
                      categories: prev!.categories.includes(category)
                        ? prev.categories.filter(c => c !== category)
                        : [...prev.categories, category]
                    }));
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
            <h3 className="text-lg font-semibold text-white mb-4">Social Media Links</h3>
            <div className="space-y-4">
              {editedProfile?.socialMediaLinks.map((link, index) => (
                <div key={index} className="p-4 bg-white/5 rounded-xl">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">{PLATFORMS.find(p => p.id === link.platform)?.icon}</span>
                    <span className="text-white font-medium">{PLATFORMS.find(p => p.id === link.platform)?.label}</span>
                  </div>
                  <div className="grid md:grid-cols-2 gap-3">
                    <input
                      type="url"
                      value={link.url}
                      onChange={(e) => {
                        setEditedProfile(prev => ({
                          ...prev!,
                          socialMediaLinks: prev!.socialMediaLinks.map((l, i) =>
                            i === index ? { ...l, url: e.target.value } : l
                          )
                        }));
                      }}
                      placeholder="Profile URL"
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-[#00D9FF]"
                    />
                    <input
                      type="number"
                      value={link.followerCount || ''}
                      onChange={(e) => {
                        setEditedProfile(prev => ({
                          ...prev!,
                          socialMediaLinks: prev!.socialMediaLinks.map((l, i) =>
                            i === index ? { ...l, followerCount: parseInt(e.target.value) || 0 } : l
                          )
                        }));
                      }}
                      placeholder="Followers"
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-[#00D9FF]"
                    />
                  </div>
                </div>
              ))}
            </div>
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
              {profile.socialMediaLinks.map((link) => (
                <div key={link.platform} className="bg-white/5 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{PLATFORMS.find(p => p.id === link.platform)?.icon}</span>
                    <span className="text-white font-medium">{PLATFORMS.find(p => p.id === link.platform)?.label}</span>
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
              ))}
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
