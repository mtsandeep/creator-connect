import { collection, doc, getDoc, getDocs, query, updateDoc, where, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { AdminAction, User } from '../types';

// ============================================
// ADMIN HOOKS
// ============================================

/**
 * Check if current user is an admin
 */
export const useIsAdmin = () => {
  // This will be used from authStore
  return false; // Placeholder
};

/**
 * Log admin action to Firestore
 */
export const logAdminAction = async (
  adminId: string,
  adminEmail: string,
  action: AdminAction,
  targetUserId?: string,
  targetUserEmail?: string,
  reason?: string,
  metadata?: Record<string, any>
) => {
  try {
    const adminLogsRef = collection(db, 'adminLogs');
    const logRef = doc(adminLogsRef);

    // Build log object, excluding undefined values
    const logData: Record<string, any> = {
      id: logRef.id,
      adminId,
      adminEmail,
      action,
      timestamp: Date.now(),
    };

    // Only include optional fields if they have values
    if (targetUserId !== undefined) logData.targetUserId = targetUserId;
    if (targetUserEmail !== undefined) logData.targetUserEmail = targetUserEmail;
    if (reason !== undefined) logData.reason = reason;
    if (metadata !== undefined) logData.metadata = metadata;

    await setDoc(logRef, logData);
  } catch (error) {
    console.error('Error logging admin action:', error);
  }
};

/**
 * Get all influencers
 */
export const useAllInfluencers = () => {
  const fetchInfluencers = async () => {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('roles', 'array-contains', 'influencer'));
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map((doc) => ({
        uid: doc.id,
        ...doc.data(),
      })) as User[];
    } catch (error) {
      console.error('Error fetching influencers:', error);
      return [];
    }
  };

  return { fetchInfluencers };
};

/**
 * Get all promoters
 */
export const useAllPromoters = () => {
  const fetchPromoters = async () => {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('roles', 'array-contains', 'promoter'));
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map((doc) => ({
        uid: doc.id,
        ...doc.data(),
      })) as User[];
    } catch (error) {
      console.error('Error fetching promoters:', error);
      return [];
    }
  };

  return { fetchPromoters };
};

/**
 * Ban a user
 */
export const useBanUser = () => {
  const banUser = async (
    userId: string,
    userEmail: string,
    reason: string,
    adminId: string,
    adminEmail: string
  ) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        isBanned: true,
        banReason: reason,
        bannedAt: Date.now(),
        bannedBy: adminId,
      });

      await logAdminAction(adminId, adminEmail, 'ban_user', userId, userEmail, reason);

      return { success: true };
    } catch (error) {
      console.error('Error banning user:', error);
      return { success: false, error: (error as Error).message };
    }
  };

  return { banUser };
};

/**
 * Unban a user
 */
export const useUnbanUser = () => {
  const unbanUser = async (
    userId: string,
    userEmail: string,
    adminId: string,
    adminEmail: string
  ) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        isBanned: false,
        banReason: null,
        bannedAt: null,
        bannedBy: null,
      });

      await logAdminAction(adminId, adminEmail, 'unban_user', userId, userEmail);

      return { success: true };
    } catch (error) {
      console.error('Error unbanning user:', error);
      return { success: false, error: (error as Error).message };
    }
  };

  return { unbanUser };
};

/**
 * Assign trusted badge to user
 */
export const useAssignTrusted = () => {
  const assignTrusted = async (
    userId: string,
    userEmail: string,
    adminId: string,
    adminEmail: string
  ) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        'verificationBadges.trusted': true,
        trustedAt: Date.now(),
        trustedBy: adminId,
      });

      await logAdminAction(adminId, adminEmail, 'assign_trusted', userId, userEmail);

      return { success: true };
    } catch (error) {
      console.error('Error assigning trusted badge:', error);
      return { success: false, error: (error as Error).message };
    }
  };

  return { assignTrusted };
};

/**
 * Remove trusted badge from user
 */
export const useRemoveTrusted = () => {
  const removeTrusted = async (
    userId: string,
    userEmail: string,
    adminId: string,
    adminEmail: string
  ) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        'verificationBadges.trusted': false,
        trustedAt: null,
        trustedBy: null,
      });

      await logAdminAction(adminId, adminEmail, 'remove_trusted', userId, userEmail);

      return { success: true };
    } catch (error) {
      console.error('Error removing trusted badge:', error);
      return { success: false, error: (error as Error).message };
    }
  };

  return { removeTrusted };
};

/**
 * Assign admin role to user
 */
export const useAssignAdmin = () => {
  const assignAdmin = async (
    userId: string,
    userEmail: string,
    adminId: string,
    adminEmail: string
  ) => {
    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        return { success: false, error: 'User not found' };
      }

      const userData = userDoc.data();
      const currentRoles = userData?.roles || [];

      if (currentRoles.includes('admin')) {
        return { success: false, error: 'User is already an admin' };
      }

      await updateDoc(userRef, {
        roles: [...currentRoles, 'admin'],
      });

      await logAdminAction(adminId, adminEmail, 'assign_admin', userId, userEmail);

      return { success: true };
    } catch (error) {
      console.error('Error assigning admin role:', error);
      return { success: false, error: (error as Error).message };
    }
  };

  return { assignAdmin };
};

/**
 * Get admin logs
 */
export const useAdminLogs = () => {
  const fetchLogs = async (limit = 100) => {
    try {
      const logsRef = collection(db, 'adminLogs');
      const q = query(logsRef);
      const querySnapshot = await getDocs(q);

      const logs = querySnapshot.docs.map((doc) => doc.data());

      // Get all unique targetUserIds from logs
      const userIdsToFetch = [...new Set(
        logs
          .filter((log: any) => log.targetUserId)
          .map((log: any) => log.targetUserId)
      )];

      // Fetch user details from users collection
      const userMap: Record<string, any> = {};
      if (userIdsToFetch.length > 0) {
        const userPromises = userIdsToFetch.map(async (userId) => {
          try {
            const userDoc = await getDoc(doc(db, 'users', userId));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              return {
                id: userId,
                email: userData.email,
              };
            }
          } catch (e) {
            console.warn(`Failed to fetch user ${userId}:`, e);
          }
          return null;
        });

        const users = await Promise.all(userPromises);
        users.forEach((user) => {
          if (user) {
            userMap[user.id] = user;
          }
        });
      }

      // Enrich all logs with fetched user emails
      const enrichedLogs = logs.map((log: any) => {
        if (log.targetUserId && userMap[log.targetUserId]) {
          return {
            ...log,
            targetUserEmail: userMap[log.targetUserId].email,
          };
        }
        return log;
      });

      return enrichedLogs
        .sort((a: any, b: any) => b.timestamp - a.timestamp)
        .slice(0, limit);
    } catch (error) {
      console.error('Error fetching admin logs:', error);
      return [];
    }
  };

  return { fetchLogs };
};
