// ============================================
// PROMOTER SIGNUP / PROFILE SETUP
// ============================================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreatePromoterProfile } from '../hooks/useAuth';
import { useAuthStore } from '../stores';
import { toast } from '../stores/uiStore';
import type { PromoterType } from '../types';
import { CATEGORIES } from '../constants/categories';

interface FormData {
  name: string;
  type: PromoterType;
  categories: string[];
  website: string;
  description: string;
  location: string;
  logo: File | null;
  brands?: { name: string; logo: File | null }[];
}

interface RedirectAfterSignup {
  action: 'start_chat' | 'send_proposal';
  influencerId: string;
  influencerName: string;
}

export default function PromoterSignup() {
  const navigate = useNavigate();
  const { createProfile } = useCreatePromoterProfile();
  const { user, isLoading, error } = useAuthStore();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [redirectAfterSignup, setRedirectAfterSignup] = useState<RedirectAfterSignup | null>(null);

  const [formData, setFormData] = useState<FormData>({
    name: '',
    type: 'individual',
    categories: [],
    website: '',
    description: '',
    location: '',
    logo: null,
    brands: [{ name: '', logo: null }],
  });

  // Load stored name and redirect info from SignupFromLink
  useEffect(() => {
    const storedName = sessionStorage.getItem('promoterSignupName');
    const storedRedirect = sessionStorage.getItem('redirectAfterSignup');

    if (storedName) {
      setFormData(prev => ({ ...prev, name: storedName }));
      sessionStorage.removeItem('promoterSignupName');
    }

    if (storedRedirect) {
      setRedirectAfterSignup(JSON.parse(storedRedirect));
    }
  }, []);

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setValidationError(null);
  };

  const handleBrandChange = (index: number, field: 'name' | 'logo', value: string | File | null) => {
    setFormData(prev => ({
      ...prev,
      brands: prev.brands?.map((brand, i) =>
        i === index ? { ...brand, [field]: value } : brand
      )
    }));
    setValidationError(null);
  };

  const addBrand = () => {
    setFormData(prev => ({
      ...prev,
      brands: [...(prev.brands || []), { name: '', logo: null }]
    }));
    setValidationError(null);
  };

  const removeBrand = (index: number) => {
    setFormData(prev => ({
      ...prev,
      brands: prev.brands?.filter((_, i) => i !== index)
    }));
    setValidationError(null);
  };

  const handleStepChange = (newStep: number) => {
    setStep(newStep);
    setValidationError(null);
  };

  const handleSubmit = async () => {
    if (!user?.uid) {
      setValidationError('User not authenticated');
      return;
    }

    // Validate Step 2: Basic Info
    if (!formData.name || formData.categories.length === 0 || !formData.website || !formData.location) {
      setValidationError('Please fill in all required fields (Name, Categories, Website, Location)');
      return;
    }

    // Validate Step 3: Brands (agency only)
    if (formData.type === 'agency' && (!formData.brands || formData.brands.length === 0)) {
      setValidationError('Please add at least one brand');
      return;
    }

    // Validate Step 4: Description
    if (!formData.description) {
      setValidationError('Please provide a description');
      return;
    }

    // Clear validation errors and submit
    setValidationError(null);

    setIsSubmitting(true);
    const result = await createProfile(user.uid, formData);
    setIsSubmitting(false);

    if (result.success) {
      toast.success('Profile created successfully!');

      // Check if there's a pending redirect from SignupFromLink
      if (redirectAfterSignup) {
        sessionStorage.removeItem('redirectAfterSignup');
        if (redirectAfterSignup.action === 'start_chat') {
          navigate(`/promoter/messages/${redirectAfterSignup.influencerId}`, { replace: true });
        } else if (redirectAfterSignup.action === 'send_proposal') {
          navigate(`/promoter/browse?influencer=${redirectAfterSignup.influencerId}`, { replace: true });
        }
      } else {
        navigate('/promoter/dashboard', { replace: true });
      }
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
        {formData.type === 'individual' ? (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`flex-1 h-1 ${s <= step ? 'bg-[#B8FF00]' : 'bg-white/10'} ${
                    s < 3 ? 'mr-2' : ''
                  }`}
                />
              ))}
            </div>
            <div className="flex justify-between text-sm text-gray-400">
              <span>Account Type</span>
              <span>Basic Info</span>
              <span>Details</span>
            </div>
          </div>
        ) : (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              {[1, 2, 3, 4].map((s) => (
                <div
                  key={s}
                  className={`flex-1 h-1 ${s <= step ? 'bg-[#B8FF00]' : 'bg-white/10'} ${
                    s < 4 ? 'mr-2' : ''
                  }`}
                />
              ))}
            </div>
            <div className="flex justify-between text-sm text-gray-400">
              <span>Account Type</span>
              <span>Basic Info</span>
              <span>Brands</span>
              <span>Details</span>
            </div>
          </div>
        )}

        {/* Step 1: Account Type */}
        {step === 1 && (
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
            <h2 className="text-xl font-semibold text-white mb-2">Choose Account Type</h2>
            <p className="text-gray-400 mb-6">Select how you want to use our platform</p>

            <div className="grid md:grid-cols-2 gap-4 mb-6">
              {/* Individual */}
              <button
                onClick={() => handleInputChange('type', 'individual')}
                className={`p-6 rounded-xl text-left transition-all ${
                  formData.type === 'individual'
                    ? 'bg-[#B8FF00] text-gray-900 scale-[1.02]'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="font-semibold mb-2">Individual Brand</h3>
                <p className="text-sm opacity-80">
                  You're a single brand looking to collaborate with influencers
                </p>
              </button>

              {/* Agency */}
              <button
                onClick={() => handleInputChange('type', 'agency')}
                className={`p-6 rounded-xl text-left transition-all ${
                  formData.type === 'agency'
                    ? 'bg-[#B8FF00] text-gray-900 scale-[1.02]'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h3 className="font-semibold mb-2">Agency</h3>
                <p className="text-sm opacity-80">
                  You represent multiple brands and manage their influencer campaigns
                </p>
              </button>
            </div>

            <button
              onClick={() => handleStepChange(2)}
              className="w-full bg-[#B8FF00] hover:bg-[#B8FF00]/80 text-gray-900 font-semibold py-3 rounded-xl transition-colors"
            >
              Continue
            </button>
          </div>
        )}

        {/* Step 2: Basic Info */}
        {step === 2 && (
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
            <h2 className="text-xl font-semibold text-white mb-6">
              {formData.type === 'individual' ? 'Brand Information' : 'Agency Information'}
            </h2>

            {/* Name */}
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">
                {formData.type === 'individual' ? 'Brand Name *' : 'Agency Name *'}
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder={formData.type === 'individual' ? 'Your brand name' : 'Your agency name'}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#B8FF00]"
              />
            </div>

            {/* Categories */}
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">Categories *</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {CATEGORIES.map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => {
                      const newCategories = formData.categories.includes(category)
                        ? formData.categories.filter(c => c !== category)
                        : [...formData.categories, category];
                      handleInputChange('categories', newCategories);
                    }}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left ${
                      formData.categories.includes(category)
                        ? 'bg-[#B8FF00] text-gray-900'
                        : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
              {formData.categories.length === 0 && (
                <p className="text-red-400 text-xs mt-2">Please select at least one category</p>
              )}
            </div>

            {/* Website */}
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">Website *</label>
              <input
                type="url"
                value={formData.website}
                onChange={(e) => handleInputChange('website', e.target.value)}
                placeholder="https://yourwebsite.com"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#B8FF00]"
              />
            </div>

            {/* Location */}
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">Location *</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                placeholder="City, Country"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#B8FF00]"
              />
            </div>

            {/* Logo */}
            <div className="mb-6">
              <label className="block text-sm text-gray-400 mb-2">Logo</label>
              <div className="border-2 border-dashed border-white/10 rounded-xl p-6 text-center hover:border-[#B8FF00]/50 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleInputChange('logo', e.target.files?.[0] || null)}
                  className="hidden"
                  id="logo"
                />
                <label htmlFor="logo" className="cursor-pointer">
                  {formData.logo ? (
                    <div className="space-y-2">
                      <p className="text-white">{formData.logo.name}</p>
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

            <div className="flex gap-4">
              <button
                onClick={() => handleStepChange(1)}
                className="flex-1 bg-white/5 hover:bg-white/10 text-white font-medium py-3 rounded-xl transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => handleStepChange(formData.type === 'agency' ? 3 : 4)}
                disabled={!formData.name || formData.categories.length === 0 || !formData.website || !formData.location}
                className="flex-1 bg-[#B8FF00] hover:bg-[#B8FF00]/80 text-gray-900 font-semibold py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Brands (Agency only) */}
        {step === 3 && formData.type === 'agency' && (
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
            <h2 className="text-xl font-semibold text-white mb-2">Manage Your Brands</h2>
            <p className="text-gray-400 mb-6">Add the brands you'll be managing on our platform</p>

            <div className="space-y-4 mb-6">
              {formData.brands?.map((brand, index) => (
                <div key={index} className="p-4 bg-white/5 rounded-xl">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-white font-medium">Brand {index + 1}</h4>
                    {formData.brands && formData.brands.length > 1 && (
                      <button
                        onClick={() => removeBrand(index)}
                        className="text-red-400 hover:text-red-300 text-sm"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="space-y-3">
                    <input
                      type="text"
                      value={brand.name}
                      onChange={(e) => handleBrandChange(index, 'name', e.target.value)}
                      placeholder="Brand name"
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-[#B8FF00]"
                    />

                    <div className="border-2 border-dashed border-white/10 rounded-lg p-3 text-center">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleBrandChange(index, 'logo', e.target.files?.[0] || null)}
                        className="hidden"
                        id={`brand-logo-${index}`}
                      />
                      <label htmlFor={`brand-logo-${index}`} className="cursor-pointer">
                        {brand.logo ? (
                          <p className="text-white text-sm">{brand.logo.name}</p>
                        ) : (
                          <p className="text-gray-500 text-sm">Upload brand logo</p>
                        )}
                      </label>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={addBrand}
              className="w-full mb-6 border-2 border-dashed border-white/20 hover:border-[#B8FF00] text-gray-400 hover:text-white rounded-xl py-3 transition-colors"
            >
              + Add Another Brand
            </button>

            <div className="flex gap-4">
              <button
                onClick={() => handleStepChange(2)}
                className="flex-1 bg-white/5 hover:bg-white/10 text-white font-medium py-3 rounded-xl transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => handleStepChange(4)}
                disabled={!formData.brands || formData.brands.length === 0 || !formData.brands.some(b => b.name.trim() !== '')}
                className="flex-1 bg-[#B8FF00] hover:bg-[#B8FF00]/80 text-gray-900 font-semibold py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Description */}
        {step === 4 && (
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
            <h2 className="text-xl font-semibold text-white mb-2">About {formData.type === 'individual' ? 'Your Brand' : 'Your Agency'}</h2>
            <p className="text-gray-400 mb-6">Tell influencers about your brand or agency</p>

            {/* Description */}
            <div className="mb-6">
              <label className="block text-sm text-gray-400 mb-2">Description *</label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder={
                  formData.type === 'individual'
                    ? 'Describe your brand, values, and the type of collaborations you\'re looking for...'
                    : 'Describe your agency, the brands you represent, and your expertise...'
                }
                rows={8}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#B8FF00] resize-none"
              />
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => handleStepChange(formData.type === 'agency' ? 3 : 2)}
                disabled={isSubmitting || isLoading}
                className="flex-1 bg-white/5 hover:bg-white/10 text-white font-medium py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || isLoading || !formData.description}
                className="flex-1 bg-[#B8FF00] hover:bg-[#B8FF00]/80 text-gray-900 font-semibold py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
