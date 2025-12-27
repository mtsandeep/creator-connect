// ============================================
// AUTH HOOKS
// ============================================

import { useEffect } from 'react';
import {
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import type { User } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '../lib/firebase';
import { useAuthStore } from '../stores';
import type { UserRole, InfluencerProfile, PromoterProfile, PromoterType, SocialMediaLink } from '../types';

// ============================================
// AUTH STATE HOOK
// ============================================

export function useAuth() {
  const { setUser, setLoading, setError } = useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser: User | null) => {
        try {
          if (firebaseUser) {
            // Fetch user document from Firestore
            const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));

            if (userDoc.exists()) {
              const userData = userDoc.data();
              setUser({
                uid: firebaseUser.uid,
                email: firebaseUser.email || '',
                role: userData.role as UserRole,
                createdAt: userData.createdAt || firebaseUser.metadata.creationTime,
                profileComplete: userData.profileComplete || false,
                influencerProfile: userData.influencerProfile,
                promoterProfile: userData.promoterProfile,
                avgRating: userData.avgRating || 0,
                totalReviews: userData.totalReviews || 0,
              });
            } else {
              // User document doesn't exist yet (first time login)
              setUser({
                uid: firebaseUser.uid,
                email: firebaseUser.email || '',
                role: null as any, // Will be set after role selection
                createdAt: Date.now(),
                profileComplete: false,
                avgRating: 0,
                totalReviews: 0,
              });
            }
          } else {
            setUser(null);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          setError('Failed to load user data');
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        console.error('Auth state error:', error);
        setError(error.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [setUser, setLoading, setError]);

  return {
    user: useAuthStore((state) => state.user),
    isAuthenticated: useAuthStore((state) => state.isAuthenticated),
    isLoading: useAuthStore((state) => state.isLoading),
  };
}

// ============================================
// GOOGLE SIGN IN
// ============================================

export function useGoogleSignIn() {
  const { setError } = useAuthStore();

  const signInWithGoogle = async () => {
    setError(null);

    try {
      // Dynamically import Google Provider
      const { GoogleAuthProvider, browserPopupRedirectResolver } = await import('firebase/auth');
      const provider = new GoogleAuthProvider();

      // Configure provider with custom parameters
      provider.setCustomParameters({
        prompt: 'select_account',
      });

      const result = await signInWithPopup(auth, provider, browserPopupRedirectResolver);
      // Auth state listener will handle the user state update
      return result.user;
    } catch (error: any) {
      console.error('Google sign-in error:', error);

      // Handle specific error codes
      if (error.code === 'auth/popup-blocked') {
        setError('Popup was blocked by your browser. Please allow popups for this site and try again.');
      } else if (error.code === 'auth/popup-closed-by-user') {
        setError('Sign-in was cancelled. Please try again.');
      } else if (error.code === 'auth/cancelled-popup-request') {
        setError('Sign-in was cancelled.');
      } else {
        setError(error.message || 'Failed to sign in with Google');
      }
      throw error;
    }
  };

  return { signInWithGoogle };
}

// ============================================
// SIGN OUT
// ============================================

export function useSignOut() {
  const { setLoading, setError, logout } = useAuthStore();

  const signOut = async () => {
    setLoading(true);
    setError(null);

    try {
      await firebaseSignOut(auth);
      logout();
    } catch (error: any) {
      console.error('Sign-out error:', error);
      setError(error.message || 'Failed to sign out');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { signOut };
}

// ============================================
// INFLUENCER PROFILE CREATION
// ============================================

export interface CreateInfluencerProfileData {
  displayName: string;
  username: string;
  bio: string;
  categories: string[];
  socialMediaLinks: SocialMediaLink[];
  location?: string;
  languages: string[];
  profileImage?: File | null;
  mediaKit?: File | null;
  advancePercentage: number;
  rates: { type: string; price: number }[];
}

export function useCreateInfluencerProfile() {
  const { setLoading, setError, updateUserProfile } = useAuthStore();

  const createProfile = async (userId: string, data: CreateInfluencerProfileData) => {
    setLoading(true);
    setError(null);

    try {
      let profileImageUrl = '';
      let mediaKitUrl = '';

      // Upload profile image if provided
      if (data.profileImage) {
        const imageRef = ref(storage, `users/${userId}/profile/${Date.now()}_${data.profileImage.name}`);
        await uploadBytes(imageRef, data.profileImage);
        profileImageUrl = await getDownloadURL(imageRef);
      }

      // Upload media kit if provided
      if (data.mediaKit) {
        const mediaKitRef = ref(storage, `users/${userId}/mediakit/${Date.now()}_${data.mediaKit.name}`);
        await uploadBytes(mediaKitRef, data.mediaKit);
        mediaKitUrl = await getDownloadURL(mediaKitRef);
      }

      // Create influencer profile
      const influencerProfile: InfluencerProfile = {
        displayName: data.displayName,
        username: data.username.startsWith('@') ? data.username : `@${data.username}`,
        bio: data.bio,
        categories: data.categories,
        socialMediaLinks: data.socialMediaLinks,
        profileImage: profileImageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
        pricing: {
          advancePercentage: Math.min(Math.max(data.advancePercentage, 0), 50), // Clamp 0-50
          rates: data.rates,
        },
        location: data.location,
        languages: data.languages,
        ...(mediaKitUrl && { mediaKit: mediaKitUrl }),
      };

      // Update user document
      await setDoc(
        doc(db, 'users', userId),
        {
          role: 'influencer',
          influencerProfile,
          profileComplete: true,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      // Update local store
      updateUserProfile({
        role: 'influencer',
        influencerProfile,
        profileComplete: true,
      });

      return { success: true };
    } catch (error: any) {
      console.error('Error creating influencer profile:', error);
      setError(error.message || 'Failed to create profile');
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  return { createProfile };
}

// ============================================
// PROMOTER PROFILE CREATION
// ============================================

export interface CreatePromoterProfileData {
  name: string;
  type: PromoterType;
  industry: string;
  website: string;
  description: string;
  location: string;
  logo?: File | null;
}

export function useCreatePromoterProfile() {
  const { setLoading, setError, updateUserProfile } = useAuthStore();

  const createProfile = async (userId: string, data: CreatePromoterProfileData) => {
    setLoading(true);
    setError(null);

    try {
      let logoUrl = '';

      // Upload logo if provided
      if (data.logo) {
        const logoRef = ref(storage, `brands/${userId}/logo/${Date.now()}_${data.logo.name}`);
        await uploadBytes(logoRef, data.logo);
        logoUrl = await getDownloadURL(logoRef);
      }

      // Create promoter profile
      const promoterProfile: PromoterProfile = {
        name: data.name,
        type: data.type,
        industry: data.industry,
        website: data.website,
        logo: logoUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${data.name}`,
        description: data.description,
        location: data.location,
      };

      // Update user document
      await setDoc(
        doc(db, 'users', userId),
        {
          role: 'promoter',
          promoterProfile,
          profileComplete: true,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      // Update local store
      updateUserProfile({
        role: 'promoter',
        promoterProfile,
        profileComplete: true,
      });

      return { success: true };
    } catch (error: any) {
      console.error('Error creating promoter profile:', error);
      setError(error.message || 'Failed to create profile');
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  return { createProfile };
}

// ============================================
// CHECK USERNAME AVAILABILITY
// ============================================

export function useCheckUsername() {
  const checkUsername = async (username: string): Promise<boolean> => {
    try {
      const normalizedUsername = username.startsWith('@') ? username : `@${username}`;

      // Query users collection for matching username
      const snapshot = await getDoc(doc(db, 'usernames', normalizedUsername));

      return !snapshot.exists();
    } catch (error) {
      console.error('Error checking username:', error);
      return false;
    }
  };

  return { checkUsername };
}
