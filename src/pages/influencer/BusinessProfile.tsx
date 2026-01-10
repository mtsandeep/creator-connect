import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores';
import { useBusinessProfile } from '../../hooks/useBusinessProfile';
import { toast } from '../../stores/uiStore';

export default function InfluencerBusinessProfile() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { roleData, isComplete, loading, error, save } = useBusinessProfile('influencer');

  const [legalName, setLegalName] = useState('');
  const [pan, setPan] = useState('');
  const [gstin, setGstin] = useState('');
  const [billingAddress, setBillingAddress] = useState('');

  useEffect(() => {
    setLegalName(roleData?.legalName || '');
    setPan(roleData?.pan || '');
    setGstin(roleData?.gstin || '');
    setBillingAddress(roleData?.billingAddress || '');
  }, [roleData]);

  const redirectTo = useMemo(() => {
    const stored = sessionStorage.getItem('businessProfileRedirect');
    if (!stored) return null;
    try {
      const parsed = JSON.parse(stored);
      return typeof parsed?.to === 'string' ? parsed.to : null;
    } catch {
      return null;
    }
  }, []);

  if (!user?.roles.includes('influencer')) {
    return (
      <div className="p-8">
        <p className="text-gray-400">You don&apos;t have access to this page.</p>
      </div>
    );
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = await save({
      legalName: legalName.trim(),
      pan: pan.trim(),
      gstin: gstin.trim() || undefined,
      billingAddress: billingAddress.trim(),
    });

    if (!result.success) return;

    if (redirectTo) {
      sessionStorage.removeItem('businessProfileRedirect');
      navigate(redirectTo);
      return;
    }

    // Show success message
    toast.success('Business profile saved successfully!');
  };

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Business Profile</h1>
        <p className="text-gray-400">Add billing details used for invoices and record-keeping.</p>
        {isComplete ? (
          <p className="text-xs text-green-400 mt-2">Business profile is complete.</p>
        ) : (
          <p className="text-xs text-orange-300 mt-2">Business profile setup is incomplete.</p>
        )}
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Legal Name</label>
            <input
              value={legalName}
              onChange={(e) => setLegalName(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00D9FF]"
              placeholder="Name as per PAN / Bank"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">PAN</label>
            <input
              value={pan}
              onChange={(e) => setPan(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00D9FF]"
              placeholder="ABCDE1234F"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">GSTIN (optional)</label>
            <input
              value={gstin}
              onChange={(e) => setGstin(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00D9FF]"
              placeholder="22ABCDE1234F1Z5"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Billing Address</label>
            <textarea
              value={billingAddress}
              onChange={(e) => setBillingAddress(e.target.value)}
              rows={4}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00D9FF] resize-none"
              placeholder="Full address for invoices"
              required
            />
          </div>

          {error ? <p className="text-xs text-error-500">{error}</p> : null}
        </div>

        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => navigate('/influencer/profile')}
            disabled={loading}
            className="flex-1 bg-white/5 hover:bg-white/10 text-white font-medium py-3 rounded-xl transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-[#00D9FF] hover:bg-[#00D9FF]/80 text-gray-900 font-semibold py-3 rounded-xl transition-colors disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  );
}
