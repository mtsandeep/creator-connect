// ============================================
// EDIT PROPOSAL FORM COMPONENT
// ============================================

import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUpdateProposal } from '../../hooks/useProposal';
import type { PaymentMode, Proposal } from '../../types';

interface EditProposalFormProps {
  proposal: Proposal;
  otherUserName?: string;
  onCancel?: () => void;
}

export default function EditProposalForm({ proposal, otherUserName, onCancel }: EditProposalFormProps) {
  const navigate = useNavigate();
  const { updateProposal, addAttachment, loading } = useUpdateProposal();

  const [title, setTitle] = useState(proposal.title);
  const [description, setDescription] = useState(proposal.description);
  const [requirements, setRequirements] = useState(proposal.requirements);
  const [deliverables, setDeliverables] = useState<string[]>(proposal.deliverables || []);
  const [deliverableInput, setDeliverableInput] = useState('');
  const [proposedBudget, setProposedBudget] = useState<number | undefined>(proposal.proposedBudget);
  const [deadline, setDeadline] = useState<string>('');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>(proposal.paymentMode || 'platform');

  const [newAttachments, setNewAttachments] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (proposal.deadline) {
      try {
        setDeadline(new Date(proposal.deadline).toISOString().slice(0, 10));
      } catch {
        setDeadline('');
      }
    } else {
      setDeadline('');
    }
  }, [proposal.deadline]);

  const addDeliverable = () => {
    const trimmed = deliverableInput.trim();
    if (!trimmed) return;
    setDeliverables((prev) => [...prev, trimmed]);
    setDeliverableInput('');
  };

  const removeDeliverable = (index: number) => {
    setDeliverables((prev) => prev.filter((_, i) => i !== index));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setNewAttachments((prev) => [...prev, ...files]);
  };

  const removeNewAttachment = (index: number) => {
    setNewAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim() || !description.trim() || !requirements.trim()) {
      setError('Please fill in title, description, and requirements.');
      return;
    }

    const deadlineTimestamp = deadline ? new Date(deadline).getTime() : null;

    const result = await updateProposal(proposal.id, {
      title: title.trim(),
      description: description.trim(),
      requirements: requirements.trim(),
      deliverables,
      proposedBudget,
      deadline: deadlineTimestamp,
      paymentMode,
      declineReason: '',
      proposalStatus: 'edited',
    });

    if (!result.success) {
      setError(result.error || 'Failed to update proposal.');
      return;
    }

    if (newAttachments.length > 0) {
      for (const file of newAttachments) {
        const uploadResult = await addAttachment(proposal.id, file);
        if (!uploadResult.success) {
          setError(uploadResult.error || 'Failed to upload attachment.');
          return;
        }
      }
    }

    navigate(`/promoter/proposals/${proposal.id}`);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Edit Proposal</h2>
        <p className="text-gray-400">
          Update the proposal details and resend it to{' '}
          <span className="text-secondary-500">{otherUserName || 'the influencer'}</span>.
        </p>
      </div>

      {error && (
        <div className="mb-4 bg-error-500/10 border border-error-500/30 text-error-500 rounded-xl px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Campaign Title *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#B8FF00]"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Payment Mode</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              disabled
              className="p-4 bg-white/5 border border-white/10 rounded-xl text-left opacity-60 cursor-not-allowed"
            >
              <p className="text-sm font-semibold text-white">Secure Escrow</p>
              <p className="text-xs text-gray-400 mt-1">Coming soon</p>
            </button>
            <button
              type="button"
              onClick={() => setPaymentMode('platform')}
              className={
                paymentMode === 'platform'
                  ? 'p-4 bg-[#B8FF00]/10 border border-[#B8FF00]/40 rounded-xl text-left'
                  : 'p-4 bg-white/5 border border-white/10 rounded-xl text-left hover:bg-white/10 transition-colors'
              }
            >
              <p className="text-sm font-semibold text-white">Pay directly</p>
              <p className="text-xs text-gray-400 mt-1">Record payment + upload details</p>
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Description *</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#B8FF00] resize-none"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Requirements *</label>
          <textarea
            value={requirements}
            onChange={(e) => setRequirements(e.target.value)}
            rows={3}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#B8FF00] resize-none"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Deliverables</label>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={deliverableInput}
              onChange={(e) => setDeliverableInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addDeliverable();
                }
              }}
              placeholder="e.g., 1 Instagram Post, 2 Stories"
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#B8FF00]"
            />
            <button
              type="button"
              onClick={addDeliverable}
              className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors"
            >
              Add
            </button>
          </div>

          {deliverables.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {deliverables.map((d, index) => (
                <span
                  key={`${d}-${index}`}
                  className="px-3 py-1 bg-[#B8FF00]/20 text-[#B8FF00] rounded-lg text-sm flex items-center gap-2"
                >
                  {d}
                  <button
                    type="button"
                    onClick={() => removeDeliverable(index)}
                    className="hover:text-red-400 transition-colors"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Proposed Budget (₹)</label>
          <input
            type="number"
            value={proposedBudget ?? ''}
            onChange={(e) => setProposedBudget(e.target.value ? Number(e.target.value) : undefined)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#B8FF00]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Deadline (Optional)</label>
          <input
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#B8FF00]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Attachments</label>

          {proposal.attachments?.length > 0 && (
            <div className="mb-3 space-y-2">
              {proposal.attachments.map((att, index) => (
                <a
                  key={`${att.url}-${index}`}
                  href={att.url}
                  target="_blank"
                  rel="noreferrer"
                  className="block bg-white/5 rounded-lg px-4 py-2 text-sm text-gray-300 hover:bg-white/10 transition-colors truncate"
                  title={att.name}
                >
                  {att.name}
                </a>
              ))}
            </div>
          )}

          <input ref={fileInputRef} type="file" onChange={handleFileSelect} multiple className="hidden" />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full px-4 py-3 bg-white/5 border border-dashed border-white/20 rounded-xl text-gray-400 hover:border-[#B8FF00] hover:text-[#B8FF00] transition-colors"
          >
            Click to attach files (briefs, images, etc.)
          </button>

          {newAttachments.length > 0 && (
            <div className="mt-3 space-y-2">
              {newAttachments.map((file, index) => (
                <div key={`${file.name}-${index}`} className="flex items-center justify-between bg-white/5 rounded-lg px-4 py-2">
                  <span className="text-sm text-gray-300 truncate">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => removeNewAttachment(index)}
                    className="text-red-400 hover:text-red-300"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={() => {
              if (onCancel) {
                onCancel();
              } else {
                navigate(`/promoter/proposals/${proposal.id}`);
              }
            }}
            className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-6 py-3 bg-[#B8FF00] hover:bg-[#B8FF00]/80 text-gray-900 font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : 'Save & Reopen'}
          </button>
        </div>
      </form>
    </div>
  );
}
