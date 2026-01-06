// ============================================
// CREATE PROPOSAL FORM COMPONENT
// ============================================

import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores';
import { useCreateProposal } from '../../hooks/useProposal';
import type { CreateProposalData } from '../../types';

interface CreateProposalFormProps {
  influencerId: string;
  influencerName: string;
  onCancel: () => void;
}

export default function CreateProposalForm({
  influencerId,
  influencerName,
  onCancel,
}: CreateProposalFormProps) {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { createProposal, loading } = useCreateProposal();

  const [formData, setFormData] = useState<CreateProposalData & { deadline?: string }>({
    influencerId,
    title: '',
    description: '',
    requirements: '',
    deliverables: [],
    proposedBudget: undefined,
    deadline: undefined,
    paymentMode: 'platform',
  });

  const [deliverableInput, setDeliverableInput] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.uid) return;

    const result = await createProposal({
      ...formData,
      attachments,
    });

    if (result.success) {
      // Navigate to the proposal detail page
      navigate(`/promoter/proposals/${result.proposalId}`);
    }
  };

  const addDeliverable = () => {
    if (deliverableInput.trim()) {
      setFormData({
        ...formData,
        deliverables: [...formData.deliverables, deliverableInput.trim()],
      });
      setDeliverableInput('');
    }
  };

  const removeDeliverable = (index: number) => {
    setFormData({
      ...formData,
      deliverables: formData.deliverables.filter((_, i) => i !== index),
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments([...attachments, ...files]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Send Proposal to {influencerName}</h2>
        <p className="text-gray-400">Create a collaboration proposal to start working together</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Campaign Title *
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g., Summer Fashion Collection Promotion"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#B8FF00]"
            required
          />
        </div>

        {/* Payment Mode */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Payment Mode
          </label>
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
              onClick={() => setFormData({ ...formData, paymentMode: 'platform' })}
              className={
                formData.paymentMode === 'platform'
                  ? 'p-4 bg-[#B8FF00]/10 border border-[#B8FF00]/40 rounded-xl text-left'
                  : 'p-4 bg-white/5 border border-white/10 rounded-xl text-left hover:bg-white/10 transition-colors'
              }
            >
              <p className="text-sm font-semibold text-white">Pay directly</p>
              <p className="text-xs text-gray-400 mt-1">Record payment + upload details</p>
            </button>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Description *
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Describe your campaign and what you're looking for..."
            rows={4}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#B8FF00] resize-none"
            required
          />
        </div>

        {/* Requirements */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Requirements *
          </label>
          <textarea
            value={formData.requirements}
            onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
            placeholder="Specific requirements for the influencer..."
            rows={3}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#B8FF00] resize-none"
            required
          />
        </div>

        {/* Deliverables */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Deliverables
          </label>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={deliverableInput}
              onChange={(e) => setDeliverableInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addDeliverable())}
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

          {formData.deliverables.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.deliverables.map((deliverable, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-[#B8FF00]/20 text-[#B8FF00] rounded-lg text-sm flex items-center gap-2"
                >
                  {deliverable}
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

        {/* Budget */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Proposed Budget (₹)
          </label>
          <input
            type="number"
            value={formData.proposedBudget || ''}
            onChange={(e) => setFormData({ ...formData, proposedBudget: e.target.value ? Number(e.target.value) : undefined })}
            placeholder="Enter your proposed budget (optional - will be discussed in chat)"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#B8FF00]"
          />
          <p className="text-xs text-gray-500 mt-1">
            You can discuss and finalize the budget in chat
          </p>
        </div>

        {/* Deadline */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Deadline (Optional)
          </label>
          <input
            type="date"
            value={formData.deadline || ''}
            onChange={(e) => setFormData({ ...formData, deadline: e.target.value || undefined as any })}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#B8FF00]"
          />
        </div>

        {/* Attachments */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Attachments
          </label>
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            multiple
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full px-4 py-3 bg-white/5 border border-dashed border-white/20 rounded-xl text-gray-400 hover:border-[#B8FF00] hover:text-[#B8FF00] transition-colors"
          >
            Click to attach files (briefs, images, etc.)
          </button>

          {attachments.length > 0 && (
            <div className="mt-3 space-y-2">
              {attachments.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-white/5 rounded-lg px-4 py-2"
                >
                  <span className="text-sm text-gray-300 truncate">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => removeAttachment(index)}
                    className="text-red-400 hover:text-red-300"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !formData.title || !formData.description || !formData.requirements}
            className="flex-1 px-6 py-3 bg-[#B8FF00] hover:bg-[#B8FF00]/80 text-gray-900 font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Sending...' : 'Send Proposal'}
          </button>
        </div>

        <p className="text-xs text-gray-500 text-center">
          The influencer will receive your proposal and can accept or decline it.
          Once accepted, you can discuss details in chat.
        </p>
      </form>
    </div>
  );
}
