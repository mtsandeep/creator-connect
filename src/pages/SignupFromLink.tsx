import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuthStore } from '../stores';
import type { PromoterType } from '../types';
import { Building2, CheckCircle2 } from 'lucide-react';

interface RedirectAfterAuth {
  path: string;
  action: 'start_chat' | 'send_proposal';
  influencerId: string;
  influencerName: string;
}

export default function SignupFromLink() {
  const navigate = useNavigate();
  const { user, updateUserProfile } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [skipProfile, setSkipProfile] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    type: 'individual' as PromoterType,
  });

  const [redirectInfo, setRedirectInfo] = useState<RedirectAfterAuth | null>(null);

  useEffect(() => {
    // Get redirect info from sessionStorage
    const storedRedirect = sessionStorage.getItem('redirectAfterAuth');
    if (storedRedirect) {
      setRedirectInfo(JSON.parse(storedRedirect));
    } else {
      // No redirect info, go to role selection
      navigate('/role-selection');
    }

    // If user is already authenticated and has a promoter profile, redirect
    if (user?.roles.includes('promoter') && user.promoterProfile) {
      handleRedirect();
    }
  }, [user]);

  const handleRedirect = () => {
    const storedRedirect = sessionStorage.getItem('redirectAfterAuth');
    if (storedRedirect) {
      const info: RedirectAfterAuth = JSON.parse(storedRedirect);
      sessionStorage.removeItem('redirectAfterAuth');

      if (info.action === 'start_chat') {
        navigate(`/promoter/messages/${info.influencerId}`);
      } else if (info.action === 'send_proposal') {
        navigate(`/promoter/browse?influencer=${info.influencerId}`);
      }
    } else {
      navigate('/promoter/dashboard');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid) return;

    setLoading(true);

    try {
      if (skipProfile || !formData.name.trim()) {
        // Skip profile creation, set profileIncomplete flag
        await setDoc(
          doc(db, 'users', user.uid),
          {
            roles: ['promoter'],
            activeRole: 'promoter',
            profileComplete: false,
            promoterProfile: {
              name: '',
              type: 'individual',
              categories: [],
              website: '',
              logo: '',
              description: '',
              location: '',
            },
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );

        // Update local user state
        updateUserProfile({
          roles: ['promoter'],
          activeRole: 'promoter',
          profileComplete: false,
          promoterProfile: {
            name: '',
            type: 'individual',
            categories: [],
            website: '',
            logo: '',
            description: '',
            location: '',
          },
        } as any);

        // Redirect to chat/proposal
        handleRedirect();
      } else {
        // Create promoter profile with provided data
        await setDoc(
          doc(db, 'users', user.uid),
          {
            roles: ['promoter'],
            activeRole: 'promoter',
            profileComplete: true,
            promoterProfile: {
              name: formData.name.trim(),
              type: formData.type,
              categories: [],
              website: '',
              logo: '',
              description: '',
              location: '',
            },
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );

        // Update local user state
        updateUserProfile({
          roles: ['promoter'],
          activeRole: 'promoter',
          profileComplete: true,
          promoterProfile: {
            name: formData.name.trim(),
            type: formData.type,
            categories: [],
            website: '',
            logo: '',
            description: '',
            location: '',
          },
        } as any);

        // Redirect to chat/proposal
        handleRedirect();
      }
    } catch (error) {
      console.error('Error creating promoter profile:', error);
      alert('Failed to create profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0F172A] to-[#1E293B]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00D9FF]"></div>
      </div>
    );
  }

  // If user already has promoter profile, redirect
  if (user.roles.includes('promoter') && user.promoterProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0F172A] to-[#1E293B]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00D9FF]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F172A] to-[#1E293B] flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#00D9FF] to-[#00A8CC] rounded-full mb-4">
            <Building2 className="w-8 h-8 text-[#0F172A]" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome! Setting up your brand account
          </h1>
          <p className="text-gray-400">
            You're almost ready to contact{' '}
            {redirectInfo?.influencerName || 'this influencer'}
          </p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="flex items-center justify-center w-8 h-8 bg-[#00D9FF] rounded-full text-[#0F172A] font-semibold">
            1
          </div>
          <div className="w-16 h-1 bg-[#00D9FF] rounded"></div>
          <div className="flex items-center justify-center w-8 h-8 bg-[#00FF94] rounded-full text-[#0F172A]">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Form */}
        <div className="bg-[#1E293B] rounded-2xl p-8 border border-[#00D9FF]/20">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Skip Profile Checkbox */}
            <div className="bg-[#B8FF00]/10 border border-[#B8FF00]/30 rounded-lg p-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={skipProfile}
                  onChange={(e) => setSkipProfile(e.target.checked)}
                  className="mt-1 w-5 h-5 rounded border-gray-600 text-[#00D9FF] focus:ring-[#00D9FF] focus:ring-offset-0"
                />
                <div>
                  <p className="text-[#B8FF00] font-medium">I'll fill this in later</p>
                  <p className="text-gray-400 text-sm">
                    Start chatting immediately and complete your profile later
                  </p>
                </div>
              </label>
            </div>

            {!skipProfile && (
              <>
                {/* Brand/Company Name */}
                <div>
                  <label className="block text-white font-medium mb-2">
                    Brand/Company Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Acme Brands"
                    className="w-full bg-[#0F172A] border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#00D9FF] transition-colors"
                  />
                </div>

                {/* Type */}
                <div>
                  <label className="block text-white font-medium mb-2">
                    Account Type
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, type: 'individual' })}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        formData.type === 'individual'
                          ? 'border-[#00D9FF] bg-[#00D9FF]/10 text-[#00D9FF]'
                          : 'border-gray-700 text-gray-400 hover:border-gray-600'
                      }`}
                    >
                      <p className="font-medium">Individual</p>
                      <p className="text-xs mt-1">Solo brand</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, type: 'agency' })}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        formData.type === 'agency'
                          ? 'border-[#00D9FF] bg-[#00D9FF]/10 text-[#00D9FF]'
                          : 'border-gray-700 text-gray-400 hover:border-gray-600'
                      }`}
                    >
                      <p className="font-medium">Agency</p>
                      <p className="text-xs mt-1">Multiple brands</p>
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || (!skipProfile && !formData.name.trim())}
              className="w-full bg-gradient-to-r from-[#00D9FF] to-[#00A8CC] text-[#0F172A] font-semibold py-4 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#0F172A]"></div>
                  Setting up...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  {skipProfile ? 'Start Chatting' : 'Create Account & Start Chatting'}
                </>
              )}
            </button>

            {skipProfile && (
              <p className="text-center text-gray-400 text-sm">
                You can complete your profile anytime from Settings
              </p>
            )}
          </form>
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-[#0F172A] rounded-xl p-4 border border-gray-800">
          <p className="text-gray-400 text-sm text-center">
            💡 <span className="text-white font-medium">Tip:</span> Complete your profile to send
            proposals. You can chat immediately without completing it.
          </p>
        </div>
      </div>
    </div>
  );
}
