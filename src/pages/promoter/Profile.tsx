// ============================================
// PROMOTER PROFILE PAGE
// ============================================

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../stores';
import { useSwitchRole } from '../../hooks/useAuth';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { resizeImage } from '../../utils/imageUtils';
import { db, storage } from '../../lib/firebase';
import { CATEGORIES } from '../../constants/categories';
import { getAvatar } from '../../utils/avatarUtils';
import { VerificationBadge } from '../../components/VerificationBadge';
import { FiLink, FiMapPin, FiUser, FiStar, FiPlus, FiRepeat, FiEdit } from 'react-icons/fi';

export default function PromoterProfile() {
  const { user, updateUserProfile } = useAuthStore();
  const { switchRole } = useSwitchRole();
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
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

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
    setValidationErrors([]);
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!editedProfile || !user?.uid) return;

    // Validate required fields
    const errors: string[] = [];
    if (!editedProfile.name?.trim()) {
      errors.push('Company Name is required');
    }
    if (!editedProfile.categories || editedProfile.categories.length === 0) {
      errors.push('At least one Category is required');
    }
    if (!editedProfile.description?.trim()) {
      errors.push('Description is required');
    }

    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    setValidationErrors([]);
    setIsSaving(true);
    try {
      let logoUrl = editedProfile.logo;

      // Upload new logo if changed
      if (logoFile) {
        // Resize logo to 150px max height before upload
        const resizedLogo = await resizeImage(logoFile, 150, 0.8);
        const logoRef = ref(storage, `users/${user.uid}/logo/${Date.now()}_${resizedLogo.name}`);
        await uploadBytes(logoRef, resizedLogo);
        logoUrl = await getDownloadURL(logoRef);
      }

      // Check if profile is complete (has all required fields)
      const isProfileComplete = !!(
        editedProfile.name &&
        editedProfile.categories &&
        editedProfile.categories.length > 0 &&
        editedProfile.description
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
      setValidationErrors([]);

      // Check if user came from incomplete-profile page and needs verification
      const verificationIntent = sessionStorage.getItem('verificationIntent');
      if (verificationIntent && isProfileComplete) {
        const intent = JSON.parse(verificationIntent);
        if (intent.required && !user.verificationBadges?.promoterVerified) {
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Profile</h1>
          <p className="text-gray-400">View and manage your brand profile</p>
        </div>
        {!isEditing && (
          <button
            onClick={handleEdit}
            className="w-full sm:w-auto bg-[#B8FF00] hover:bg-[#B8FF00]/80 text-gray-900 font-semibold px-6 py-3 sm:py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <FiEdit className="w-4 h-4" />
            Edit Profile
          </button>
        )}
      </div>

      {isEditing ? (
        // EDIT MODE
        <div className="space-y-6">
          {/* Logo Upload */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Logo</h3>
            <div className="flex items-center gap-6">
              <img
                src={logoFile ? URL.createObjectURL(logoFile) : getAvatar(user, 'promoter')}
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
                <label className="block text-sm text-gray-400 mb-2">Company Name <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  value={editedProfile?.name || ''}
                  onChange={(e) => {
                    setEditedProfile(prev => ({ ...prev!, name: e.target.value }));
                    setValidationErrors([]);
                  }}
                  className={`w-full bg-white/5 border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#B8FF00] ${validationErrors.includes('Company Name is required') ? 'border-red-500' : 'border-white/10'}`}
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Categories <span className="text-red-400">*</span></label>
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
                        setValidationErrors([]);
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
                <label className="block text-sm text-gray-400 mb-2">Description <span className="text-red-400">*</span></label>
                <textarea
                  value={editedProfile?.description || ''}
                  onChange={(e) => {
                    setEditedProfile(prev => ({ ...prev!, description: e.target.value }));
                    setValidationErrors([]);
                  }}
                  placeholder="Tell influencers about your brand..."
                  rows={4}
                  className={`w-full bg-white/5 border rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#B8FF00] resize-none ${validationErrors.includes('Description is required') ? 'border-red-500' : 'border-white/10'}`}
                />
              </div>
            </div>
          </div>

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-4">
              <p className="text-red-400 font-medium mb-2">Please fill in all required fields:</p>
              <ul className="list-disc list-inside text-red-300 text-sm space-y-1">
                {validationErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}

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
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-6">
              {/* Logo - Centered on mobile, left on desktop */}
              <div className="flex justify-center sm:justify-start sm:flex-shrink-0">
                <img
                  src={getAvatar(user, 'promoter')}
                  alt={profile.name}
                  className="w-24 h-24 sm:w-32 sm:h-32 rounded-xl object-cover bg-white/10"
                />
              </div>
              
              {/* Company Info - Centered on mobile, left on desktop */}
              <div className="flex-1 text-center sm:text-left">
                <h2 className="text-2xl font-bold text-white mb-1">{profile.name}</h2>
                <div className="flex flex-wrap justify-center sm:justify-start gap-2 mb-3">
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
                <div className="flex flex-wrap justify-center sm:justify-start gap-4 text-sm text-gray-400">
                  {profile.website && (
                    <a
                      href={profile.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 hover:text-[#B8FF00] transition-colors"
                    >
                      <FiLink className="w-4 h-4" />
                      Website
                    </a>
                  )}
                  {profile.location && (
                    <span className="flex items-center gap-1">
                      <FiMapPin className="w-4 h-4" />
                      {profile.location}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <FiUser className="w-4 h-4" />
                    {profile.type === 'agency' ? 'Agency' : 'Individual'}
                  </span>
                </div>
              </div>
              
              {/* Rating - Centered on mobile, right on desktop */}
              {user.avgRating > 0 && (
                <div className="flex justify-center sm:justify-end sm:flex-shrink-0">
                  <div className="flex flex-col items-center">
                    <div className="flex items-center gap-1 text-yellow-400 mb-1">
                      <FiStar className="w-5 h-5" />
                      <span className="text-white font-bold">{user.avgRating.toFixed(1)}</span>
                    </div>
                    <span className="text-xs text-gray-400">{user.totalReviews} reviews</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Verification Badge and Credits */}
          <VerificationBadge user={user} />

          {/* Influencer Profile Section */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
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
                  onClick={async () => {
                    const result = await switchRole('influencer');
                    if (result.success) {
                      navigate('/influencer/dashboard');
                    }
                  }}
                  className="w-full sm:w-auto inline-flex items-center gap-2 bg-[#00D9FF] hover:bg-[#00D9FF]/80 text-gray-900 font-medium px-6 py-3 sm:py-2.5 rounded-xl transition-colors"
                >
                  <FiRepeat className="w-5 h-5" />
                  Switch to Influencer
                </button>
              ) : (
                <a
                  href="/signup/influencer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#00D9FF] hover:bg-[#00D9FF]/80 text-gray-900 font-medium px-6 py-3 sm:py-2.5 rounded-xl transition-colors"
                >
                  <FiPlus className="w-5 h-5" />
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
