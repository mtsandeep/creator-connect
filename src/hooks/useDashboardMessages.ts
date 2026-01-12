import { useEffect, useMemo, useState } from 'react';
import { collection, doc, getDocs, query, where, orderBy, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { User } from '../types';

export type DashboardMessageIntent = 'info' | 'success' | 'warning' | 'promo';

export interface DashboardMessage {
  id: string;
  intent: DashboardMessageIntent;
  iconEmoji?: string;
  title: string;
  body: string;
  ctaLabel?: string;
  ctaPath?: string;
  dismissible: boolean;
}

interface DashboardMessageDoc {
  isActive: boolean;
  intent?: DashboardMessageIntent;
  iconEmoji?: string;
  title: string;
  body: string;
  ctaLabel?: string;
  ctaPath?: string;
  dismissible?: boolean;
  createdAt?: number;
  audienceRoles?: string[];
  conditions?: {
    influencerVerified?: boolean;
    influencerTrusted?: boolean;
  };
  startAt?: number;
  endAt?: number;
}

function shouldShowMessageForUser(message: DashboardMessageDoc, user: User): boolean {
  if (message.isActive === false) return false;

  const now = Date.now();
  if (typeof message.startAt === 'number' && now < message.startAt) return false;
  if (typeof message.endAt === 'number' && now > message.endAt) return false;

  if (Array.isArray(message.audienceRoles) && message.audienceRoles.length > 0) {
    const hasRole = message.audienceRoles.some((role) => user.roles.includes(role as any));
    if (!hasRole) return false;
  }

  if (message.conditions?.influencerVerified !== undefined) {
    if ((user.verificationBadges?.influencerVerified || false) !== message.conditions.influencerVerified) {
      return false;
    }
  }

  if (message.conditions?.influencerTrusted !== undefined) {
    if ((user.verificationBadges?.influencerTrusted || false) !== message.conditions.influencerTrusted) {
      return false;
    }
  }

  return true;
}

async function hasDismissedMessage(userId: string, messageId: string): Promise<boolean> {
  const dismissalsQuery = query(
    collection(db, 'users', userId, 'dismissedDashboardMessages'),
    where('messageId', '==', messageId)
  );
  const dismissedSnapshot = await getDocs(dismissalsQuery);
  return !dismissedSnapshot.empty;
}

export function useDashboardMessages(user: User | null) {
  const [messages, setMessages] = useState<DashboardMessage[]>([]);
  const [loading, setLoading] = useState(false);

  const verifiedOnceMessage = useMemo<DashboardMessage | null>(() => {
    if (!user?.uid) return null;

    if (!user?.verificationBadges?.influencerVerified) return null;

    return {
      id: 'system.influencerVerified',
      intent: 'success',
      iconEmoji: '✅',
      title: 'You are now verified',
      body: 'Your verified badge is live. Verified creators get higher trust and better response rates from brands.',
      ctaLabel: 'View Profile',
      ctaPath: '/influencer/profile',
      dismissible: true,
    };
  }, [user?.uid, user?.verificationBadges?.influencerVerified]);

  const refresh = async () => {
    if (!user?.uid) return;

    setLoading(true);
    try {
      const activeMessagesQuery = query(
        collection(db, 'dashboardMessages'),
        where('isActive', '==', true),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(activeMessagesQuery);
      const docs = snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as DashboardMessageDoc) }));

      const eligibleDocs = docs.filter((m) => shouldShowMessageForUser(m, user));

      const undismissedDocs: DashboardMessage[] = [];
      for (const m of eligibleDocs) {
        const dismissed = await hasDismissedMessage(user.uid, `dashboard.${m.id}`);
        if (!dismissed) {
          undismissedDocs.push({
            id: `dashboard.${m.id}`,
            intent: m.intent || 'info',
            iconEmoji: m.iconEmoji,
            title: m.title,
            body: m.body,
            ctaLabel: m.ctaLabel,
            ctaPath: m.ctaPath,
            dismissible: m.dismissible !== false,
          });
        }
      }

      if (verifiedOnceMessage) {
        const dismissed = await hasDismissedMessage(user.uid, verifiedOnceMessage.id);
        if (!dismissed) {
          setMessages([verifiedOnceMessage, ...undismissedDocs]);
          return;
        }
      }

      setMessages(undismissedDocs);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, [user?.uid, user?.verificationBadges?.influencerVerified, user?.verificationBadges?.influencerTrusted]);

  const dismissMessage = async (messageId: string) => {
    if (!user?.uid) return;

    await setDoc(doc(db, 'users', user.uid, 'dismissedDashboardMessages', messageId), {
      messageId,
      dismissedAt: Date.now(),
    });

    setMessages((prev) => prev.filter((m) => m.id !== messageId));
  };

  return {
    messages,
    loading,
    dismissMessage,
    refresh,
  };
}
