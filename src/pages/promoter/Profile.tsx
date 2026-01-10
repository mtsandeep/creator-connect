// ============================================
// PROMOTER PROFILE PAGE
// ============================================

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../stores';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../lib/firebase';
import { CATEGORIES } from '../../constants/categories';
import { VerificationBadge } from '../../components/VerificationBadge';

export default function PromoterProfile() {
  const { user, updateUserProfile, setActiveRole } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Check if user came from incomplete-profile page with edit=true
  useEffect(() => {
    if (searchParams.get('edit') === 'true') {
      setIsEditing(true);
      // Clean up the URL
      navigate('/promoter/profile', { replace: true });
    }
  }, [searchParams, navigate]);

  // Local state for editing
  const [editedProfile, setEditedProfile] = useState(user?.promoterProfile);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  if (!user?.promoterProfile) {
    return (
      <div className="p-8">
        <p className="text-gray-400">Profile not found. Please complete your signup first.</p>
      </div>
    );
  }

  const profile = user.promoterProfile;

  const handleEdit = () => {
    setEditedProfile({ ...profile });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setEditedProfile({ ...profile });
    setLogoFile(null);
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!editedProfile || !user?.uid) return;

    setIsSaving(true);
    try {
      let logoUrl = editedProfile.logo;

      // Upload new logo if changed
      if (logoFile) {
        const logoRef = ref(storage, `users/${user.uid}/logo/${Date.now()}_${logoFile.name}`);
        await uploadBytes(logoRef, logoFile);
        logoUrl = await getDownloadURL(logoRef);
      }

      // Check if profile is complete (has all required fields)
      const isProfileComplete = !!(
        editedProfile.name &&
        editedProfile.categories &&
        editedProfile.categories.length > 0 &&
        editedProfile.description &&
        editedProfile.location
      );

      // Update Firestore
      await updateDoc(doc(db, 'users', user.uid), {
        promoterProfile: {
          ...editedProfile,
          logo: logoUrl,
        },
        profileComplete: isProfileComplete,
        updatedAt: serverTimestamp(),
      });

      // Update local store
      updateUserProfile({
        promoterProfile: {
          ...editedProfile,
          logo: logoUrl,
        },
        profileComplete: isProfileComplete,
      });

      setIsEditing(false);
      setLogoFile(null);

      // Check if user came from incomplete-profile page and needs verification
      const verificationIntent = sessionStorage.getItem('verificationIntent');
      if (verificationIntent && isProfileComplete) {
        const intent = JSON.parse(verificationIntent);
        if (intent.required && !user.isPromoterVerified) {
          // Redirect to verification page (root route)
          // Clear any previous link-in-bio context - this is dashboard flow
          sessionStorage.removeItem('verificationContext');
          navigate('/verification');
          return;
        }
        // Clear the intent if profile is complete but no verification needed
        sessionStorage.removeItem('verificationIntent');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Profile</h1>
          <p className="text-gray-400">View and manage your brand profile</p>
        </div>
        {!isEditing && (
          <button
            onClick={handleEdit}
            className="bg-[#B8FF00] hover:bg-[#B8FF00]/80 text-gray-900 font-semibold px-6 py-2.5 rounded-xl transition-colors"
          >
            Edit Profile
          </button>
        )}
      </div>

      {!user.businessProfile?.promoter?.isComplete && (
        <div className="mb-6 rounded-2xl border border-orange-500/30 bg-orange-500/10 p-4 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-orange-200">Business profile setup is pending</p>
            <p className="text-xs text-orange-200/80 mt-1">
              Add billing details to enable invoice and record-keeping for collaborations.
            </p>
          </div>
          <button
            onClick={() => navigate('/promoter/business-profile')}
            className="shrink-0 px-4 py-2 bg-orange-500 hover:bg-orange-500/80 text-white font-semibold rounded-xl transition-colors"
          >
            Complete now
          </button>
        </div>
      )}

      {isEditing ? (
        // EDIT MODE
        <div className="space-y-6">
          {/* Logo Upload */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Logo</h3>
            <div className="flex items-center gap-6">
              <img
                src={logoFile ? URL.createObjectURL(logoFile) : profile.logo}
                alt="Logo"
                className="w-24 h-24 rounded-xl object-cover bg-white/10"
              />
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                  className="hidden"
                  id="editLogo"
                />
                <label
                  htmlFor="editLogo"
                  className="inline-block bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg cursor-pointer transition-colors"
                >
                  Change Logo
                </label>
                <p className="text-gray-500 text-sm mt-2">PNG, JPG up to 5MB</p>
              </div>
            </div>
          </div>

          {/* Basic Info */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Company Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Company Name</label>
                <input
                  type="text"
                  value={editedProfile?.name || ''}
                  onChange={(e) => setEditedProfile(prev => ({ ...prev!, name: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#B8FF00]"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Categories</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {CATEGORIES.map((category) => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => {
                        const currentCategories = editedProfile?.categories || [];
                        const newCategories = currentCategories.includes(category)
                          ? currentCategories.filter(c => c !== category)
                          : [...currentCategories, category];
                        setEditedProfile(prev => ({ ...prev!, categories: newCategories }));
                      }}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left ${
                        (editedProfile?.categories || []).includes(category)
                          ? 'bg-[#B8FF00] text-gray-900'
                          : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Website</label>
                <input
                  type="url"
                  value={editedProfile?.website || ''}
                  onChange={(e) => setEditedProfile(prev => ({ ...prev!, website: e.target.value }))}
                  placeholder="https://yourcompany.com"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#B8FF00]"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Location</label>
                <input
                  type="text"
                  value={editedProfile?.location || ''}
                  onChange={(e) => setEditedProfile(prev => ({ ...prev!, location: e.target.value }))}
                  placeholder="City, Country"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#B8FF00]"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Description</label>
                <textarea
                  value={editedProfile?.description || ''}
                  onChange={(e) => setEditedProfile(prev => ({ ...prev!, description: e.target.value }))}
                  placeholder="Tell influencers about your brand..."
                  rows={4}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#B8FF00] resize-none"
                />
              </div>
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
              className="flex-1 bg-[#B8FF00] hover:bg-[#B8FF00]/80 text-gray-900 font-semibold py-3 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
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
            <div className="flex items-start gap-6">
              <img
                src={profile.logo}
                alt={profile.name}
                className="w-24 h-24 rounded-xl object-cover bg-white/10"
              />
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white mb-1">{profile.name}</h2>
                <div className="flex flex-wrap gap-2 mb-3">
                  {(profile.categories || []).map((category) => (
                    <span
                      key={category}
                      className="px-3 py-1 rounded-lg bg-[#B8FF00]/20 text-[#B8FF00] text-sm font-medium"
                    >
                      {category}
                    </span>
                  ))}
                </div>
                <p className="text-gray-400 mb-4">{profile.description}</p>
                <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                  {profile.website && (
                    <a
                      href={profile.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 hover:text-[#B8FF00] transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                      Website
                    </a>
                  )}
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    {profile.type === 'agency' ? 'Agency' : 'Individual'}
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

          {/* Verification Badge and Credits */}
          <VerificationBadge user={user} />

          {/* Account Settings */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
            <h2 className="text-xl font-semibold text-white mb-2">Account</h2>
            <p className="text-gray-400 text-sm mb-6">Your account settings and preferences</p>

            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-white/10">
                <div>
                  <p className="text-white font-medium">Email</p>
                  <p className="text-gray-400 text-sm">{user.email}</p>
                </div>
                <span className="text-gray-500 text-sm">Connected with Google</span>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-white/10">
                <div>
                  <p className="text-white font-medium">Account Type</p>
                  <p className="text-gray-400 text-sm">Promoter</p>
                </div>
                {user.roles.includes('influencer') && (
                  <span className="text-xs bg-[#00D9FF]/20 text-[#00D9FF] px-3 py-1 rounded-full">
                    Also an Influencer
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="text-white font-medium">Member Since</p>
                  <p className="text-gray-400 text-sm">
                    {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Influencer Profile Section */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">Influencer Profile</h3>
                <p className="text-gray-400 text-sm">
                  {user.roles.includes('influencer')
                    ? 'You have both Influencer and Promoter profiles'
                    : 'Create an Influencer profile to collaborate with brands'}
                </p>
              </div>
              {user.roles.includes('influencer') ? (
                <button
                  onClick={() => {
                    setActiveRole('influencer');
                    navigate('/influencer/dashboard');
                  }}
                  className="inline-flex items-center gap-2 bg-[#00D9FF] hover:bg-[#00D9FF]/80 text-gray-900 font-medium px-6 py-2.5 rounded-xl transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                  Switch to Influencer
                </button>
              ) : (
                <a
                  href="/signup/influencer"
                  className="inline-flex items-center gap-2 bg-[#00D9FF] hover:bg-[#00D9FF]/80 text-gray-900 font-medium px-6 py-2.5 rounded-xl transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create Influencer Profile
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
