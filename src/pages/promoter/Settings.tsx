// ============================================
// PROMOTER SETTINGS PAGE
// ============================================

import { useAuthStore } from '../../stores';
import { auth } from '../../lib/firebase';

export default function PromoterSettings() {
  const { user } = useAuthStore();

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

  if (!user?.promoterProfile) {
    return (
      <div className="p-8">
        <p className="text-gray-400">Profile not found. Please complete your signup first.</p>
      </div>
    );
  }

  const profile = user.promoterProfile;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
        <p className="text-gray-400">Manage your account and preferences</p>
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
              <p className="text-gray-400 text-sm">Promoter</p>
            </div>
            {user.roles.includes('influencer') && (
              <span className="text-xs bg-[#00D9FF]/20 text-[#00D9FF] px-3 py-1 rounded-full">
                Also an Influencer
              </span>
            )}
          </div>

          <div className="flex items-center justify-between py-3 border-b border-white/10">
            <div>
              <p className="text-white font-medium">Company Type</p>
              <p className="text-gray-400 text-sm capitalize">{profile.type || 'Individual'}</p>
            </div>
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

      {/* Notifications Settings (Placeholder) */}
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 mb-6">
        <h2 className="text-xl font-semibold text-white mb-2">Notifications</h2>
        <p className="text-gray-400 text-sm mb-6">Choose how you want to be notified</p>

        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-white/10">
            <div>
              <p className="text-white font-medium">Email Notifications</p>
              <p className="text-gray-400 text-sm">Receive updates about your proposals</p>
            </div>
            <button className="w-12 h-6 bg-[#B8FF00] rounded-full transition-colors">
              <div className="w-5 h-5 bg-white rounded-full transition-transform translate-x-6" />
            </button>
          </div>

          <div className="flex items-center justify-between py-3 border-b border-white/10">
            <div>
              <p className="text-white font-medium">Proposal Responses</p>
              <p className="text-gray-400 text-sm">Get notified when influencers respond</p>
            </div>
            <button className="w-12 h-6 bg-[#B8FF00] rounded-full transition-colors">
              <div className="w-5 h-5 bg-white rounded-full transition-transform translate-x-6" />
            </button>
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-white font-medium">New Messages</p>
              <p className="text-gray-400 text-sm">Get notified for new chat messages</p>
            </div>
            <button className="w-12 h-6 bg-[#B8FF00] rounded-full transition-colors">
              <div className="w-5 h-5 bg-white rounded-full transition-transform translate-x-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-red-500/5 backdrop-blur-sm rounded-2xl border border-red-500/20 p-6 mb-6">
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
