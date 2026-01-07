import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuthStore } from '../stores';
import { FiArrowLeft } from 'react-icons/fi';

type InvoiceType = 'advance' | 'final';

type InvoiceRecord = {
  type: InvoiceType;
  invoiceNumber: string;
  proposalId: string;
  influencerId: string;
  promoterId: string;
  amount: number;
  currency?: string;
  paidAt?: number;
  createdAt?: any;
  updatedAt?: any;
};

export default function InvoiceView() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();
  const { proposalId, invoiceType } = useParams<{ proposalId: string; invoiceType: InvoiceType }>();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [proposal, setProposal] = useState<any>(null);
  const [invoice, setInvoice] = useState<InvoiceRecord | null>(null);
  const [influencerName, setInfluencerName] = useState<string>('—');
  const [promoterName, setPromoterName] = useState<string>('—');

  useEffect(() => {
    const load = async () => {
      if (!proposalId || !invoiceType) {
        setError('Invalid invoice link');
        setLoading(false);
        return;
      }

      if (invoiceType !== 'advance' && invoiceType !== 'final') {
        setError('Invalid invoice type');
        setLoading(false);
        return;
      }

      try {
        const proposalRef = doc(db, 'proposals', proposalId);
        const proposalSnap = await getDoc(proposalRef);
        if (!proposalSnap.exists()) {
          setError('Proposal not found');
          setLoading(false);
          return;
        }

        const proposalData: any = proposalSnap.data();
        setProposal({ id: proposalId, ...proposalData });

        const invoiceRef = doc(db, 'proposals', proposalId, 'invoices', invoiceType);
        const invoiceSnap = await getDoc(invoiceRef);
        if (!invoiceSnap.exists()) {
          setError('Invoice record not found yet');
          setLoading(false);
          return;
        }

        const invoiceData: any = invoiceSnap.data();
        setInvoice(invoiceData as InvoiceRecord);

        const influencerId = invoiceData?.influencerId;
        const promoterId = invoiceData?.promoterId;

        if (influencerId) {
          const influencerSnap = await getDoc(doc(db, 'users', influencerId));
          if (influencerSnap.exists()) {
            const u: any = influencerSnap.data();
            setInfluencerName(u?.influencerProfile?.displayName || u?.email || '—');
          }
        }

        if (promoterId) {
          const promoterSnap = await getDoc(doc(db, 'users', promoterId));
          if (promoterSnap.exists()) {
            const u: any = promoterSnap.data();
            setPromoterName(u?.promoterProfile?.name || u?.email || '—');
          }
        }

        setLoading(false);
      } catch (e: any) {
        setError(e?.message || 'Failed to load invoice');
        setLoading(false);
      }
    };

    load();
  }, [invoiceType, proposalId]);

  const searchParams = new URLSearchParams(location.search);
  const returnTo = searchParams.get('returnTo');

  const handleBack = () => {
    if (returnTo) {
      navigate(returnTo);
      return;
    }

    const isInfluencer = proposal?.influencerId && user?.uid && proposal.influencerId === user.uid;
    const isPromoter = proposal?.promoterId && user?.uid && proposal.promoterId === user.uid;

    if (proposal?.id) {
      if (isInfluencer) {
        navigate(`/influencer/proposals/${proposal.id}`);
        return;
      }
      if (isPromoter) {
        navigate(`/promoter/proposals/${proposal.id}`);
        return;
      }
    }

    navigate('/');
  };

  const canView = !!user?.uid;

  if (!canView) {
    return (
      <div className="p-8">
        <p className="text-gray-400">Not authenticated</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#00D9FF]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <button
          onClick={handleBack}
          className="text-gray-400 hover:text-white transition-colors mb-4 flex items-center gap-2"
        >
          <FiArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <p className="text-white font-semibold">Unable to load invoice</p>
          <p className="text-gray-400 text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  const invoiceTitle = invoice?.type === 'advance' ? 'Advance Invoice' : 'Final Invoice';
  const paidOn = invoice?.paidAt ? new Date(invoice.paidAt).toLocaleDateString() : '—';
  const amountText = `₹${Number(invoice?.amount || 0).toLocaleString()}`;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between gap-3 mb-4 print:hidden">
        <button
          onClick={handleBack}
          className="text-gray-400 hover:text-white transition-colors flex items-center gap-2"
        >
          <FiArrowLeft className="w-4 h-4" /> Back
        </button>

        <button
          onClick={() => window.print()}
          className="bg-[#00D9FF] hover:bg-[#00D9FF]/80 text-gray-900 font-semibold px-4 py-2 rounded-xl transition-colors"
        >
          Print / Save as PDF
        </button>
      </div>

      <div className="bg-white rounded-2xl p-8 text-gray-900 shadow print:shadow-none">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold">{invoiceTitle}</h1>
            <p className="text-sm text-gray-600 mt-1">Invoice No: {invoice?.invoiceNumber || '—'}</p>
            <p className="text-sm text-gray-600">Proposal: {proposal?.title || '—'}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Paid on</p>
            <p className="font-semibold">{paidOn}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
          <div className="border border-gray-200 rounded-xl p-4">
            <p className="text-xs text-gray-600 font-semibold">Billed From (Influencer)</p>
            <p className="mt-1 font-semibold">{influencerName}</p>
          </div>
          <div className="border border-gray-200 rounded-xl p-4">
            <p className="text-xs text-gray-600 font-semibold">Billed To (Promoter)</p>
            <p className="mt-1 font-semibold">{promoterName}</p>
          </div>
        </div>

        <div className="mt-6 border border-gray-200 rounded-xl overflow-hidden">
          <div className="grid grid-cols-12 bg-gray-50 px-4 py-2 text-xs font-semibold text-gray-600">
            <div className="col-span-8">Description</div>
            <div className="col-span-2 text-right">Qty</div>
            <div className="col-span-2 text-right">Amount</div>
          </div>
          <div className="grid grid-cols-12 px-4 py-3 text-sm">
            <div className="col-span-8">
              {invoice?.type === 'advance' ? 'Advance payment' : 'Remaining payment'} for “{proposal?.title || 'collaboration'}”
            </div>
            <div className="col-span-2 text-right">1</div>
            <div className="col-span-2 text-right">{amountText}</div>
          </div>
          <div className="border-t border-gray-200 px-4 py-3 flex items-center justify-end">
            <div className="w-full sm:w-72">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Total</span>
                <span className="font-bold">{amountText}</span>
              </div>
              <p className="text-xs text-gray-500 mt-2">Currency: {invoice?.currency || 'INR'}</p>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <p className="text-xs text-gray-600 font-semibold">Notes</p>
          <p className="text-sm text-gray-700 mt-1">
            This invoice is generated based on the recorded payment. Please retain for your records.
          </p>
        </div>
      </div>
    </div>
  );
}
