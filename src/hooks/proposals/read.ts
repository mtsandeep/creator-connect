import { useEffect, useState } from 'react';
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuthStore } from '../../stores';
import type { Proposal, ProposalHistoryEntry } from '../../types';
import { convertDocToProposal } from './mapper';

export type ProposalRole = 'promoter' | 'influencer' | 'all';

export function useProposals(role: ProposalRole = 'all') {
  const { user } = useAuthStore();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.uid) {
      setProposals([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    if (role === 'influencer') {
      const q = query(
        collection(db, 'proposals'),
        where('influencerId', '==', user.uid),
        orderBy('updatedAt', 'desc')
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const proposalsData = snapshot.docs.map(convertDocToProposal);
          setProposals(proposalsData);
          setLoading(false);
        },
        (err) => {
          console.error('Error fetching influencer proposals:', err);
          setError(err.message);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    }

    if (role === 'promoter') {
      const q = query(
        collection(db, 'proposals'),
        where('promoterId', '==', user.uid),
        orderBy('updatedAt', 'desc')
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const proposalsData = snapshot.docs.map(convertDocToProposal);
          setProposals(proposalsData);
          setLoading(false);
        },
        (err) => {
          console.error('Error fetching promoter proposals:', err);
          setError(err.message);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    }

    const q1 = query(
      collection(db, 'proposals'),
      where('promoterId', '==', user.uid),
      orderBy('updatedAt', 'desc')
    );

    const q2 = query(
      collection(db, 'proposals'),
      where('influencerId', '==', user.uid),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe1 = onSnapshot(
      q1,
      (snapshot1) => {
        const proposals1 = snapshot1.docs.map(convertDocToProposal);

        const unsubscribe2 = onSnapshot(
          q2,
          (snapshot2) => {
            const proposals2 = snapshot2.docs.map(convertDocToProposal);

            const allProposals = [...proposals1, ...proposals2];
            const uniqueProposals = Array.from(
              new Map(allProposals.map((p) => [p.id, p])).values()
            );

            uniqueProposals.sort((a, b) => b.updatedAt - a.updatedAt);

            setProposals(uniqueProposals);
            setLoading(false);
          },
          (err) => {
            console.error('Error fetching influencer proposals:', err);
            setError(err.message);
            setLoading(false);
          }
        );

        return () => unsubscribe2();
      },
      (err) => {
        console.error('Error fetching promoter proposals:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe1();
  }, [user?.uid, role]);

  return { proposals, loading, error };
}

export function useProposal(proposalId: string | null) {
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!proposalId) {
      setProposal(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const unsubscribe = onSnapshot(
      doc(db, 'proposals', proposalId),
      (docSnap) => {
        if (!docSnap.exists()) {
          setError('Proposal not found');
          setLoading(false);
          return;
        }

        setProposal(convertDocToProposal(docSnap));
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching proposal:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [proposalId]);

  return { proposal, loading, error };
}

export function useProposalHistory(proposalId: string | null) {
  const [entries, setEntries] = useState<ProposalHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!proposalId) {
      setEntries([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const q = query(
      collection(db, 'proposals', proposalId, 'history'),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const nextEntries: ProposalHistoryEntry[] = snapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<ProposalHistoryEntry, 'id'>),
        }));
        setEntries(nextEntries);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching proposal history:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [proposalId]);

  return { entries, loading, error };
}
