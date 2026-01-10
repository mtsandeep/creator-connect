import { useCallback, useEffect, useState } from 'react';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuthStore } from '../stores';
import type { BusinessProfileRoleData } from '../types';

type BusinessProfileRole = 'influencer' | 'promoter';

export function isBusinessProfileComplete(roleData?: BusinessProfileRoleData) {
  if (!roleData) return false;
  return Boolean(roleData.legalName && roleData.pan && roleData.billingAddress);
}

export function useBusinessProfile(role: BusinessProfileRole) {
  const { user, updateUserProfile } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [roleData, setRoleData] = useState<BusinessProfileRoleData | undefined>(
    role === 'influencer' ? user?.businessProfile?.influencer : user?.businessProfile?.promoter
  );

  useEffect(() => {
    setRoleData(role === 'influencer' ? user?.businessProfile?.influencer : user?.businessProfile?.promoter);
  }, [role, user?.businessProfile?.influencer, user?.businessProfile?.promoter]);

  const refresh = useCallback(async () => {
    if (!user?.uid) return;
    setLoading(true);
    setError(null);

    try {
      const snap = await getDoc(doc(db, 'users', user.uid));
      if (!snap.exists()) return;
      const data = snap.data();
      const next = data.businessProfile;
      updateUserProfile({ businessProfile: next });
    } catch (e: any) {
      console.error('Error loading business profile:', e);
      setError(e?.message || 'Failed to load business profile');
    } finally {
      setLoading(false);
    }
  }, [user?.uid, updateUserProfile]);

  const save = useCallback(
    async (updates: BusinessProfileRoleData) => {
      if (!user?.uid) {
        setError('Not authenticated');
        return { success: false };
      }

      setLoading(true);
      setError(null);

      try {
        const isComplete = isBusinessProfileComplete(updates);
        
        // Filter out undefined values to avoid Firebase errors
        const filteredUpdates = Object.fromEntries(
          Object.entries(updates).filter(([_, value]) => value !== undefined)
        );
        
        const payload = {
          businessProfile: {
            ...(user.businessProfile || {}),
            [role]: {
              ...filteredUpdates,
              isComplete,
              updatedAt: Date.now(),
            },
            updatedAt: serverTimestamp(),
          },
          updatedAt: serverTimestamp(),
        };

        await setDoc(doc(db, 'users', user.uid), payload, { merge: true });

        updateUserProfile({
          businessProfile: {
            ...(user.businessProfile || {}),
            [role]: {
              ...updates,
              isComplete,
              updatedAt: Date.now(),
            },
          },
        });

        return { success: true };
      } catch (e: any) {
        console.error('Error saving business profile:', e);
        setError(e?.message || 'Failed to save business profile');
        return { success: false };
      } finally {
        setLoading(false);
      }
    },
    [role, user, updateUserProfile]
  );

  return {
    roleData,
    isComplete: isBusinessProfileComplete(roleData),
    loading,
    error,
    refresh,
    save,
  };
}
