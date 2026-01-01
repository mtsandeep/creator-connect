// ============================================
// INFLUENCER SETTINGS PAGE
// ============================================

import { useState } from 'react';
import { useAuthStore } from '../../stores';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';

const RATE_TYPES = [
  { id: 'story', label: 'Instagram Story' },
  { id: 'post', label: 'Feed Post' },
  { id: 'reel', label: 'Instagram Reel' },
  { id: 'video', label: 'YouTube Video' },
];

export default function InfluencerSettings() {
  const { user, updateUserProfile } = useAuthStore();
  const [isSaving, setIsSaving] = useState(false);
  const [changesMade, setChangesMade] = useState(false);

  // Local state for pricing
  const [advancePercentage, setAdvancePercentage] = useState(
    user?.influencerProfile?.pricing?.advancePercentage || 30
  );
  const [rates, setRates] = useState(
    user?.influencerProfile?.pricing?.rates || RATE_TYPES.map(rt => ({ type: rt.id, price: 0 }))
  );

  if (!user?.influencerProfile) {
    return (
      <div className="p-8">
        <p className="text-gray-400">Profile not found. Please complete your signup first.</p>
      </div>
    );
  }

  const profile = user.influencerProfile;

  const handleRateChange = (index: number, price: number) => {
    setRates(prev => prev.map((rate, i) => (i === index ? { ...rate, price } : rate)));
    setChangesMade(true);
  };

  const handleAdvanceChange = (value: number) => {
    setAdvancePercentage(value);
    setChangesMade(true);
  };

  const handleSave = async () => {
    if (!user?.uid) return;

    setIsSaving(true);
    try {
      // Update Firestore
      await updateDoc(doc(db, 'users', user.uid), {
        'influencerProfile.pricing': {
          advancePercentage,
          rates,
        },
        updatedAt: serverTimestamp(),
      });

      // Update local store
      updateUserProfile({
        influencerProfile: {
          ...profile,
          pricing: {
            advancePercentage,
            rates,
          },
        },
      });

      setChangesMade(false);
    } catch (error) {
      console.error('Error updating settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }

    if (!confirm('This will permanently delete your account and all data. Continue?')) {
      return;
    }

    try {
      // Delete user from Firebase Auth
      await auth.currentUser?.delete();

      // Note: You may want to also delete Firestore documents and Storage files
      // This would require a Cloud Function or additional client-side code

      window.location.href = '/';
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('Failed to delete account. Please contact support.');
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
        <p className="text-gray-400">Manage your account and pricing preferences</p>
      </div>

      {/* Pricing Settings */}
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 mb-6">
        <h2 className="text-xl font-semibold text-white mb-2">Pricing Settings</h2>
        <p className="text-gray-400 text-sm mb-6">
          Configure your advance payment percentage and rates. These are discussed privately with brands.
        </p>

        {/* Advance Percentage */}
        <div className="mb-8">
          <label className="block text-sm text-gray-400 mb-2">
            Advance Payment: {advancePercentage}%
          </label>
          <p className="text-gray-500 text-xs mb-4">
            Maximum 50% - This percentage will be paid upfront when the project starts
          </p>
          <input
            type="range"
            min="0"
            max="50"
            value={advancePercentage}
            onChange={(e) => handleAdvanceChange(parseInt(e.target.value))}
            className="w-full accent-[#00D9FF]"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>0%</span>
            <span>50%</span>
          </div>
        </div>

        {/* Rates */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-white">Your Rates (INR)</h3>
          {RATE_TYPES.map((rateType, index) => (
            <div key={rateType.id} className="flex items-center gap-4 bg-white/5 rounded-xl p-4">
              <div className="flex-1">
                <label className="block text-sm text-gray-400 mb-1">{rateType.label}</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
                  <input
                    type="number"
                    value={rates[index]?.price || ''}
                    onChange={(e) => handleRateChange(index, parseInt(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full bg-transparent border border-white/10 rounded-lg pl-8 pr-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-[#00D9FF]"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {changesMade && (
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-[#00D9FF] hover:bg-[#00D9FF]/80 text-gray-900 font-semibold px-6 py-2.5 rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
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
        )}
      </div>

      {/* Account Settings */}
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 mb-6">
        <h2 className="text-xl font-semibold text-white mb-2">Account</h2>
        <p className="text-gray-400 text-sm mb-6">Manage your account settings and preferences</p>

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
              <p className="text-gray-400 text-sm">Influencer</p>
            </div>
            {user.roles.includes('promoter') && (
              <span className="text-xs bg-[#B8FF00]/20 text-[#B8FF00] px-3 py-1 rounded-full">
                Also a Promoter
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

      {/* Danger Zone */}
      <div className="bg-red-500/5 backdrop-blur-sm rounded-2xl border border-red-500/20 p-6">
        <h2 className="text-xl font-semibold text-red-400 mb-2">Danger Zone</h2>
        <p className="text-gray-400 text-sm mb-6">Irreversible actions for your account</p>

        <button
          onClick={handleDeleteAccount}
          className="w-full md:w-auto bg-red-500/10 hover:bg-red-500/20 text-red-400 font-medium px-6 py-2.5 rounded-xl transition-colors border border-red-500/20"
        >
          Delete Account
        </button>
      </div>
    </div>
  );
}
