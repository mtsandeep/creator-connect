// ============================================
// INFLUENCER SIGNUP / PROFILE SETUP
// ============================================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateInfluencerProfile, useCheckUsername } from '../hooks/useAuth';
import { useSocialMediaFetch } from '../hooks/useSocialMediaFetch';
import { useInstagramAnalytics } from '../hooks/useInstagramAnalytics';
import { useAuthStore } from '../stores';
import { toast } from '../stores/uiStore';
import { IoLogoInstagram, IoLogoYoutube, IoLogoFacebook } from 'react-icons/io5';
import { X, AlertCircle } from 'lucide-react';
import SocialMediaSection from '../components/SocialMediaSection';
import type { InstagramAnalytics, InstagramAnalyticsAlt } from '../types';
import { CATEGORIES } from '../constants/categories';
import PricingSettings, { RATE_TYPES } from '../components/PricingSettings';

interface FormData {
  displayName: string;
  username: string;
  bio: string;
  categories: string[];
  socialMediaLinks: {
    platform: string;
    url: string;
    followerCount: number;
  }[];
  location: string;
  profileImage: File | null;
  mediaKit: File | null;
  advancePercentage: number;
  rates: { type: string; price: number }[];
}


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
    placeholder: 'pagename or username'
  },
];



export default function InfluencerSignup() {
  const navigate = useNavigate();
  const { createProfile } = useCreateInfluencerProfile();
  const { checkUsername } = useCheckUsername();
  const { fetchFollowerCount } = useSocialMediaFetch();
  const { fetchAnalytics: fetchInstagramAnalytics } = useInstagramAnalytics();
  const { user, isLoading, error } = useAuthStore();
  const [step, setStep] = useState(1);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [fetchingStatus, setFetchingStatus] = useState<Record<string, boolean>>({});
  const [fetchError, setFetchError] = useState<Record<string, string>>({});
  const [manuallyEnteredFollowers, setManuallyEnteredFollowers] = useState<Record<string, boolean>>({});
  const [instagramAnalytics, setInstagramAnalytics] = useState<InstagramAnalytics | InstagramAnalyticsAlt | null>(null);
  const [isInstagramReportExpanded, setIsInstagramReportExpanded] = useState(true);

  const [formData, setFormData] = useState<FormData>({
    displayName: '',
    username: '',
    bio: '',
    categories: [],
    socialMediaLinks: PLATFORMS.map(p => ({ platform: p.id, url: '', followerCount: 0 })),
    location: '',
    profileImage: null,
    mediaKit: null,
    advancePercentage: 30,
    rates: RATE_TYPES.map(rt => ({ type: rt.id, price: 0 })),
  });

  useEffect(() => {
    if (instagramAnalytics && !fetchingStatus.instagram) {
      setIsInstagramReportExpanded(true);
    }
  }, [instagramAnalytics, fetchingStatus.instagram]);

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setValidationError(null);
    
    // Clear username error when user changes the username field
    if (field === 'username') {
      setUsernameError(null);
    }
  };

  const handleCategoryToggle = (category: string) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }));
    setValidationError(null);
  };

  const handleSocialMediaChange = (index: number, field: string, value: string | number) => {
    const platform = formData.socialMediaLinks[index].platform;

    // Always update the field value first
    const updatedFormData = {
      ...formData,
      socialMediaLinks: formData.socialMediaLinks.map((link, i) =>
        i === index ? { ...link, [field]: value } : link
      )
    };

    // Reset follower count and analytics when Instagram username is cleared
    if (platform === 'instagram' && field === 'url' && value === '') {
      updatedFormData.socialMediaLinks[index].followerCount = 0;
      setFormData(updatedFormData);
      // Clear Instagram analytics report
      setInstagramAnalytics(null);
      setFetchError(prev => ({ ...prev, [platform]: '' }));
      // Reset manual entry flag
      setManuallyEnteredFollowers(prev => ({ ...prev, [platform]: false }));
    } else {
      setFormData(updatedFormData);
      // Mark as manually entered if user changes follower count
      if (field === 'followerCount') {
        setManuallyEnteredFollowers(prev => ({ ...prev, [platform]: true }));
      }
    }

    setValidationError(null);

    // Clear error when user manually changes follower count
    if (field === 'followerCount') {
      setFetchError(prev => ({ ...prev, [platform]: '' }));
    }
  };

  const handleSocialMediaBlur = (index: number, platform: string, username: string) => {
    // Auto-fetch follower count only on blur (when user leaves the field)
    if (username.length > 2) {
      autoFetchFollowerCount(platform, username, index);
    }
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
        setFormData(prev => ({
          ...prev,
          socialMediaLinks: prev.socialMediaLinks.map((link, i) =>
            i === index ? { ...link, followerCount: result.data!.followers } : link
          )
        }));
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
      setFormData(prev => ({
        ...prev,
        socialMediaLinks: prev.socialMediaLinks.map((link, i) =>
          i === index ? { ...link, followerCount: result.data!.followerCount } : link
        )
      }));
      setFetchError(prev => ({ ...prev, [platform]: '' })); // Clear error on success
      // Reset manual entry flag since this was fetched
      setManuallyEnteredFollowers(prev => ({ ...prev, [platform]: false }));
      toast.success(`Fetched ${result.data.followerCount.toLocaleString()} ${platform === 'youtube' ? 'subscribers' : 'followers'} for ${username}`);
    } else if (result.error) {
      setFetchError(prev => ({ ...prev, [platform]: `Failed to auto fetch, please update ${platform === 'youtube' ? 'subscriber' : 'follower'} count manually` }));
    }
  };

  const handleStepChange = (newStep: number) => {
    setStep(newStep);
    setValidationError(null);
  };

  const handleRateChange = (index: number, price: number) => {
    setFormData(prev => ({
      ...prev,
      rates: prev.rates.map((rate, i) =>
        i === index ? { ...rate, price } : rate
      )
    }));
  };

  const checkUsernameAvailability = async (username: string) => {
    if (username.length < 3) {
      setUsernameAvailable(null);
      setUsernameError(null);
      return;
    }

    setIsCheckingUsername(true);
    const result = await checkUsername(username);
    setUsernameAvailable(result.available);
    
    if (!result.available) {
      // Set username-specific error message
      setUsernameError(result.reason || 'Username not available');
    } else {
      setUsernameError(null);
    }
    
    setIsCheckingUsername(false);
  };

  const handleSubmit = async () => {
    if (!user?.uid) {
      setValidationError('User not authenticated');
      return;
    }

    // Validate all steps before submitting
    if (!formData.displayName || !formData.username || !formData.bio) {
      setValidationError('Please fill in all required fields (Display Name, Username, Bio)');
      return;
    }

    if (!usernameAvailable) {
      setValidationError('Please choose an available username');
      return;
    }

    if (formData.categories.length === 0) {
      setValidationError('Please select at least one category');
      return;
    }

    const hasSocialLink = formData.socialMediaLinks.some(
      link => link.url && link.followerCount > 0
    );

    if (!hasSocialLink) {
      setValidationError('Please add at least one social media link with follower count');
      return;
    }

    // Clear validation errors and submit
    setValidationError(null);

    // Construct full URLs from username inputs
    const formDataWithUrls = {
      ...formData,
      socialMediaLinks: formData.socialMediaLinks.map(link => {
        const platform = PLATFORMS.find(p => p.id === link.platform);
        if (!platform || !link.url) return link;
        return {
          ...link,
          url: `https://${platform.urlPrefix}${link.url}`
        };
      })
    };

    setIsSubmitting(true);
    const result = await createProfile(user.uid, formDataWithUrls);
    setIsSubmitting(false);

    if (result.success) {
      toast.success('Profile created successfully!');
      navigate('/influencer/dashboard', { replace: true });
    } else {
      setValidationError(result.error || 'Failed to create profile');
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Validation Error Display */}
        {validationError && (
          <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-red-400 text-sm font-medium">Please fix the following issue:</p>
              <p className="text-red-300 text-sm mt-1">{validationError}</p>
            </div>
            <button
              onClick={() => setValidationError(null)}
              className="text-red-400 hover:text-red-300"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* API Error Display */}
        {error && !validationError && (
          <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-xl p-4">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`flex-1 h-1 ${s <= step ? 'bg-[#00D9FF]' : 'bg-white/10'} ${s < 4 ? 'mr-2' : ''
                  }`}
              />
            ))}
          </div>
          <div className="flex justify-between text-sm text-gray-400">
            <span>Basic Info</span>
            <span>Categories</span>
            <span>Social Media</span>
            <span>Pricing</span>
          </div>
        </div>

        {/* Step 1: Basic Info */}
        {step === 1 && (
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
            <h2 className="text-xl font-semibold text-white mb-6">Basic Information</h2>

            {/* Display Name */}
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">Display Name *</label>
              <input
                type="text"
                value={formData.displayName}
                onChange={(e) => handleInputChange('displayName', e.target.value)}
                placeholder="Your display name"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#00D9FF]"
              />
            </div>

            {/* Username */}
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">Username (min 3 chars)*</label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.username.replace('@', '')}
                  onChange={(e) => {
                    const username = e.target.value.replace(/[^a-zA-Z0-9_]/g, '');
                    handleInputChange('username', username);
                    checkUsernameAvailability(username);
                  }}
                  placeholder="username"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#00D9FF]"
                />
                {isCheckingUsername && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#00D9FF]"></div>
                  </div>
                )}
                {usernameAvailable === false && !usernameError && (
                  <p className="text-red-400 text-sm mt-1">Username already taken</p>
                )}
                {usernameError && (
                  <p className="text-red-400 text-sm mt-1">{usernameError}</p>
                )}
                {usernameAvailable === true && (
                  <p className="text-green-400 text-sm mt-1">Username available!</p>
                )}
              </div>
            </div>

            {/* Bio */}
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">Bio *</label>
              <textarea
                value={formData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                placeholder="Tell brands about yourself..."
                rows={4}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#00D9FF] resize-none"
              />
            </div>

            {/* Location */}
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">Location</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                placeholder="City, Country"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#00D9FF]"
              />
            </div>


            {/* Profile Image */}
            <div className="mb-6">
              <label className="block text-sm text-gray-400 mb-2">Profile Image</label>
              <div className="border-2 border-dashed border-white/10 rounded-xl p-6 text-center hover:border-[#00D9FF]/50 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleInputChange('profileImage', e.target.files?.[0] || null)}
                  className="hidden"
                  id="profileImage"
                />
                <label htmlFor="profileImage" className="cursor-pointer">
                  {formData.profileImage ? (
                    <div className="space-y-2">
                      <p className="text-white">{formData.profileImage.name}</p>
                      <p className="text-gray-500 text-sm">Click to change</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="w-12 h-12 mx-auto text-gray-500 flex items-center justify-center border-2 border-dashed border-gray-600 rounded-lg">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <p className="text-gray-500">Click to upload or drag and drop</p>
                      <p className="text-gray-600 text-xs">PNG, JPG up to 5MB</p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            <button
              onClick={() => handleStepChange(2)}
              disabled={!formData.displayName || !formData.username || !formData.bio || !usernameAvailable}
              className="w-full bg-[#00D9FF] hover:bg-[#00D9FF]/80 text-gray-900 font-semibold py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          </div>
        )}

        {/* Step 2: Categories */}
        {step === 2 && (
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
            <h2 className="text-xl font-semibold text-white mb-2">Select Your Categories</h2>
            <p className="text-gray-400 mb-6">Choose at least one category that best describes your content</p>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
              {CATEGORIES.map((category) => (
                <button
                  key={category}
                  onClick={() => handleCategoryToggle(category)}
                  className={`p-4 rounded-xl text-sm font-medium transition-all ${formData.categories.includes(category)
                    ? 'bg-[#00D9FF] text-gray-900 scale-[1.02]'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                    }`}
                >
                  {category}
                </button>
              ))}
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => handleStepChange(1)}
                className="flex-1 bg-white/5 hover:bg-white/10 text-white font-medium py-3 rounded-xl transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => handleStepChange(3)}
                disabled={formData.categories.length === 0}
                className="flex-1 bg-[#00D9FF] hover:bg-[#00D9FF]/80 text-gray-900 font-semibold py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Social Media */}
        {step === 3 && (
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
            <h2 className="text-xl font-semibold text-white mb-2">Social Media Links</h2>
            <p className="text-gray-400 mb-6">Select the platforms you want to add</p>

            <SocialMediaSection
              socialMediaLinks={formData.socialMediaLinks}
              selectedPlatforms={selectedPlatforms}
              onPlatformToggle={(platformId) => {
                const isSelected = selectedPlatforms.includes(platformId);
                if (isSelected) {
                  setSelectedPlatforms(prev => prev.filter(id => id !== platformId));
                  // Clear data when unchecking
                  handleSocialMediaChange(
                    formData.socialMediaLinks.findIndex(l => l.platform === platformId),
                    'url',
                    ''
                  );
                } else {
                  setSelectedPlatforms(prev => [...prev, platformId]);
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
            />

            <div className="flex gap-4 mt-8">
              <button
                onClick={() => handleStepChange(2)}
                className="flex-1 bg-white/5 hover:bg-white/10 text-white font-medium py-3 rounded-xl transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => handleStepChange(4)}
                disabled={!formData.socialMediaLinks.some(link => selectedPlatforms.includes(link.platform) && link.url && link.followerCount > 0)}
                className="flex-1 bg-[#00D9FF] hover:bg-[#00D9FF]/80 text-gray-900 font-semibold py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Pricing */}
        {step === 4 && (
          <PricingSettings
            title="Pricing Information"
            description="Set your rates (these are discussed privately with brands)"
            advancePercentage={formData.advancePercentage}
            rates={formData.rates}
            userPlatforms={selectedPlatforms}
            onAdvanceChange={(value) => handleInputChange('advancePercentage', value)}
            onRateChange={handleRateChange}
            showMediaKit={true}
            mediaKit={formData.mediaKit}
            onMediaKitChange={(file) => handleInputChange('mediaKit', file)}
          >
            <div className="flex gap-4">
              <button
                onClick={() => handleStepChange(3)}
                disabled={isSubmitting || isLoading}
                className="flex-1 bg-white/5 hover:bg-white/10 text-white font-medium py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || isLoading}
                className="flex-1 bg-[#00D9FF] hover:bg-[#00D9FF]/80 text-gray-900 font-semibold py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900"></div>
                    Creating Profile...
                  </>
                ) : (
                  'Complete Profile'
                )}
              </button>
            </div>
          </PricingSettings>
        )}
      </div>
    </div>
  );
}
