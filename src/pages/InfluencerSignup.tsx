// ============================================
// INFLUENCER SIGNUP / PROFILE SETUP
// ============================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateInfluencerProfile, useCheckUsername } from '../hooks/useAuth';
import { useAuthStore } from '../stores';
import { toast } from '../stores/uiStore';

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
  languages: string[];
  profileImage: File | null;
  mediaKit: File | null;
  advancePercentage: number;
  rates: { type: string; price: number }[];
}

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

export default function InfluencerSignup() {
  const navigate = useNavigate();
  const { createProfile } = useCreateInfluencerProfile();
  const { checkUsername } = useCheckUsername();
  const { user, isLoading, error } = useAuthStore();
  const [step, setStep] = useState(1);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const [formData, setFormData] = useState<FormData>({
    displayName: '',
    username: '',
    bio: '',
    categories: [],
    socialMediaLinks: PLATFORMS.map(p => ({ platform: p.id, url: '', followerCount: 0 })),
    location: '',
    languages: ['English'],
    profileImage: null,
    mediaKit: null,
    advancePercentage: 30,
    rates: RATE_TYPES.map(rt => ({ type: rt.id, price: 0 })),
  });

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setValidationError(null);
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
    setFormData(prev => ({
      ...prev,
      socialMediaLinks: prev.socialMediaLinks.map((link, i) =>
        i === index ? { ...link, [field]: value } : link
      )
    }));
    setValidationError(null);
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
      return;
    }

    setIsCheckingUsername(true);
    const available = await checkUsername(username);
    setUsernameAvailable(available);
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

    setIsSubmitting(true);
    const result = await createProfile(user.uid, formData);
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
            <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <p className="text-red-400 text-sm font-medium">Please fix the following issue:</p>
              <p className="text-red-300 text-sm mt-1">{validationError}</p>
            </div>
            <button
              onClick={() => setValidationError(null)}
              className="text-red-400 hover:text-red-300"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
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
                className={`flex-1 h-1 ${s <= step ? 'bg-[#00D9FF]' : 'bg-white/10'} ${
                  s < 4 ? 'mr-2' : ''
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
              <label className="block text-sm text-gray-400 mb-2">Username *</label>
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
                {usernameAvailable === false && (
                  <p className="text-red-400 text-sm mt-1">Username already taken</p>
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

            {/* Languages */}
            <div className="mb-6">
              <label className="block text-sm text-gray-400 mb-2">Languages</label>
              <div className="flex flex-wrap gap-2">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang}
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        languages: prev.languages.includes(lang)
                          ? prev.languages.filter(l => l !== lang)
                          : [...prev.languages, lang]
                      }));
                    }}
                    className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                      formData.languages.includes(lang)
                        ? 'bg-[#00D9FF] text-gray-900'
                        : 'bg-white/5 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
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
                      <svg className="w-12 h-12 mx-auto text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
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
                  className={`p-4 rounded-xl text-sm font-medium transition-all ${
                    formData.categories.includes(category)
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
            <p className="text-gray-400 mb-6">Add at least one social media account</p>

            {formData.socialMediaLinks.map((link, index) => (
              <div key={link.platform} className="mb-6 p-4 bg-white/5 rounded-xl">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">{PLATFORMS.find(p => p.id === link.platform)?.icon}</span>
                  <span className="text-white font-medium">{PLATFORMS.find(p => p.id === link.platform)?.label}</span>
                </div>

                <div className="space-y-3">
                  <input
                    type="url"
                    value={link.url}
                    onChange={(e) => handleSocialMediaChange(index, 'url', e.target.value)}
                    placeholder={`https://${link.platform}.com/yourprofile`}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-[#00D9FF]"
                  />

                  <input
                    type="number"
                    value={link.followerCount || ''}
                    onChange={(e) => handleSocialMediaChange(index, 'followerCount', parseInt(e.target.value) || 0)}
                    placeholder="Follower count"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-[#00D9FF]"
                  />
                </div>
              </div>
            ))}

            <div className="flex gap-4">
              <button
                onClick={() => handleStepChange(2)}
                className="flex-1 bg-white/5 hover:bg-white/10 text-white font-medium py-3 rounded-xl transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => handleStepChange(4)}
                disabled={!formData.socialMediaLinks.some(link => link.url && link.followerCount > 0)}
                className="flex-1 bg-[#00D9FF] hover:bg-[#00D9FF]/80 text-gray-900 font-semibold py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Pricing */}
        {step === 4 && (
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
            <h2 className="text-xl font-semibold text-white mb-2">Pricing Information</h2>
            <p className="text-gray-400 mb-6">Set your rates (these are discussed privately with brands)</p>

            {/* Advance Percentage */}
            <div className="mb-8">
              <label className="block text-sm text-gray-400 mb-2">
                Advance Payment: {formData.advancePercentage}%
              </label>
              <p className="text-gray-500 text-xs mb-4">
                Maximum 50% - This percentage will be paid upfront when the project starts
              </p>
              <input
                type="range"
                min="0"
                max="50"
                value={formData.advancePercentage}
                onChange={(e) => handleInputChange('advancePercentage', parseInt(e.target.value))}
                className="w-full accent-[#00D9FF]"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0%</span>
                <span>50%</span>
              </div>
            </div>

            {/* Rates */}
            <div className="space-y-4 mb-6">
              {RATE_TYPES.map((rateType, index) => (
                <div key={rateType.id} className="flex items-center gap-4">
                  <div className="flex-1">
                    <label className="block text-sm text-gray-400 mb-1">{rateType.label}</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
                      <input
                        type="number"
                        value={formData.rates[index].price || ''}
                        onChange={(e) => handleRateChange(index, parseInt(e.target.value) || 0)}
                        placeholder="0"
                        className="w-full bg-white/5 border border-white/10 rounded-lg pl-8 pr-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-[#00D9FF]"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Media Kit */}
            <div className="mb-6">
              <label className="block text-sm text-gray-400 mb-2">Media Kit (Optional)</label>
              <div className="border-2 border-dashed border-white/10 rounded-xl p-4 text-center hover:border-[#00D9FF]/50 transition-colors">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => handleInputChange('mediaKit', e.target.files?.[0] || null)}
                  className="hidden"
                  id="mediaKit"
                />
                <label htmlFor="mediaKit" className="cursor-pointer">
                  {formData.mediaKit ? (
                    <p className="text-white">{formData.mediaKit.name}</p>
                  ) : (
                    <p className="text-gray-500 text-sm">Upload PDF media kit (max 10MB)</p>
                  )}
                </label>
              </div>
            </div>

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
                {isSubmitting || isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900"></div>
                    Creating Profile...
                  </>
                ) : (
                  'Complete Profile'
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
