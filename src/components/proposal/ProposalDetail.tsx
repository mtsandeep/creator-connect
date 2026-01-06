// ============================================
// PROPOSAL DETAIL COMPONENT
// ============================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { FiClock, FiInfo } from 'react-icons/fi';
import Modal from '../common/Modal';
import DeliverableTracker from './DeliverableTracker';
import ProposalStepper from './ProposalStepper';
import ProposalAuditLog from './ProposalAuditLog';
import ProposalActionBar from './ProposalActionBar';
import type { PaymentScheduleItem, Proposal } from '../../types';

interface ProposalDetailProps {
  proposal: Proposal;
  otherUserName?: string;
  isInfluencer?: boolean;
}

export default function ProposalDetail({
  proposal,
  otherUserName,
  isInfluencer = false,
}: ProposalDetailProps) {
  const navigate = useNavigate();
  const [showAuditLogModal, setShowAuditLogModal] = useState(false);
  const [showAdvanceDetailsModal, setShowAdvanceDetailsModal] = useState(false);

  const schedule: PaymentScheduleItem[] = Array.isArray(proposal.paymentSchedule)
    ? (proposal.paymentSchedule as PaymentScheduleItem[])
    : [];
  const advanceItem = schedule.find((item) => item?.type === 'advance');
  const advancePaid = advanceItem?.status === 'paid' || advanceItem?.status === 'released';

  const proposalStatus = proposal.proposalStatus;
  const paymentStatus = proposal.paymentStatus;
  const workStatus = proposal.workStatus;
  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <h1 className="text-3xl font-bold text-white leading-tight">
                {proposal.title}{' '}
                <span className="font-normal text-sm text-gray-400">
                  with{' '}
                  <span className={isInfluencer ? 'text-secondary-500' : 'text-primary-500'}>{otherUserName}</span>
                </span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowAuditLogModal(true)}
              className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              title="Activity log"
            >
              <FiClock size={18} />
            </button>
          </div>
        </div>

        <ProposalActionBar proposal={proposal} otherUserName={otherUserName} isInfluencer={isInfluencer} />

        {/* Status badges for key milestones */}
        <div className="mt-3 flex flex-wrap gap-2">
          {proposalStatus === 'agreed' && (
            <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-md">
              ✓ Terms agreed
            </span>
          )}
          {(paymentStatus === 'advance_paid' || paymentStatus === 'fully_paid') && (
            <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-md">
              ✓ Payment complete
            </span>
          )}
          {workStatus === 'submitted' && (
            <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-md">
              ✓ Work submitted
            </span>
          )}
          {workStatus === 'approved' && (
            <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded-md">
              ✓ Work approved
            </span>
          )}
        </div>

      </div>

      {/* Three-Track Stepper */}
      <div className="mb-8">
        <ProposalStepper
          proposalStatus={proposalStatus}
          paymentStatus={paymentStatus}
          workStatus={workStatus}
          isInfluencer={isInfluencer}
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Details */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
            <div className="p-5 border-b border-white/10">
              <div className="flex items-center gap-3 -mx-5 -mt-5 mb-4 px-5 py-3 bg-white/5 border-b border-white/10">
                <h2 className="text-[11px] font-semibold text-gray-200 uppercase tracking-wider">Description</h2>
                <div className="h-px flex-1 bg-white/10" />
              </div>
              <p className="text-gray-300 whitespace-pre-wrap text-sm leading-relaxed">{proposal.description}</p>
            </div>
            <div className="p-5">
              <div className="flex items-center gap-3 -mx-5 -mt-5 mb-4 px-5 py-3 bg-white/5 border-b border-white/10">
                <h2 className="text-[11px] font-semibold text-gray-200 uppercase tracking-wider">Requirements</h2>
                <div className="h-px flex-1 bg-white/10" />
              </div>
              <p className="text-gray-300 whitespace-pre-wrap text-sm leading-relaxed">{proposal.requirements}</p>
            </div>
          </div>

          {/* Deliverables */}
          {proposal.deliverables && proposal.deliverables.length > 0 && (
            <DeliverableTracker
              deliverables={proposal.deliverables}
              completedDeliverables={proposal.completionPercentage === 100 ? proposal.deliverables : []}
            />
          )}

          {/* Attachments */}
          {proposal.attachments && proposal.attachments.length > 0 && (
            <div className="bg-white/5 rounded-2xl border border-white/10 p-5">
              <h2 className="text-sm font-semibold text-white mb-3">Attachments</h2>
              <div className="space-y-2">
                {proposal.attachments.map((attachment, index) => (
                  <a
                    key={index}
                    href={attachment.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <svg className="w-8 h-8 text-[#00D9FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{attachment.name}</p>
                      <p className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(attachment.uploadedAt), { addSuffix: true })}
                      </p>
                    </div>
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Actions & Info */}
        <div className="space-y-4">
          <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
            {/* Actions */}
            <div className="p-5 border-b border-white/10">
              <div className="flex items-center gap-3 -mx-5 -mt-5 mb-4 px-5 py-3 bg-white/5 border-b border-white/10">
                <h2 className="text-[11px] font-semibold text-gray-200 uppercase tracking-wider">Actions</h2>
                <div className="h-px flex-1 bg-white/10" />
              </div>
              <div className="space-y-3">
                {/* Open Chat */}
                <button
                  onClick={() => {
                    const otherUserId = isInfluencer ? proposal.promoterId : proposal.influencerId;
                    const basePath = isInfluencer
                      ? `/influencer/messages/${otherUserId}`
                      : `/promoter/messages/${otherUserId}`;
                    navigate(`${basePath}/${proposal.id}`);
                  }}
                  className="w-full px-4 py-2 bg-[#00D9FF] hover:bg-[#00D9FF]/80 text-gray-900 font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  Open Chat
                </button>
              </div>
            </div>
            <div className="p-5 border-b border-white/10">
              <div className="flex items-center gap-3 -mx-5 -mt-5 mb-4 px-5 py-3 bg-white/5 border-b border-white/10">
                <h2 className="text-[11px] font-semibold text-gray-200 uppercase tracking-wider">Budget</h2>
                <div className="h-px flex-1 bg-white/10" />
              </div>
              <div className="space-y-2">
              {proposal.proposedBudget && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Proposed</span>
                  <span className="text-white font-medium">₹{proposal.proposedBudget.toLocaleString()}</span>
                </div>
              )}
              {proposal.finalAmount && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Final Amount</span>
                  <span className="text-[#B8FF00] font-medium">₹{proposal.finalAmount.toLocaleString()}</span>
                </div>
              )}
              {proposal.advanceAmount && (
                <>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">Advance ({proposal.advancePercentage}%)</span>
                      {advancePaid && advanceItem ? (
                        <button
                          type="button"
                          onClick={() => setShowAdvanceDetailsModal(true)}
                          className="p-1 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                          title="View advance payment details"
                        >
                          <FiInfo className="w-4 h-4" />
                        </button>
                      ) : null}
                    </div>
                    <span className="text-white font-medium">₹{proposal.advanceAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Remaining</span>
                    <span className="text-white font-medium">₹{proposal.remainingAmount?.toLocaleString()}</span>
                  </div>
                  {advancePaid && (
                    <span className="text-xs text-green-400">✓ Advance paid</span>
                  )}
                </>
              )}
              </div>
            </div>

          <Modal
            open={showAdvanceDetailsModal}
            onClose={() => setShowAdvanceDetailsModal(false)}
            title="Advance payment details"
            maxWidthClassName="max-w-lg"
            footer={
              <button
                onClick={() => setShowAdvanceDetailsModal(false)}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors cursor-pointer"
              >
                Close
              </button>
            }
          >
            <div className="space-y-3 text-left">
              {advanceItem ? (
                <>
                  <div className="flex justify-between gap-4">
                    <span className="text-gray-400 text-sm">Status</span>
                    <span className="text-white text-sm font-medium">{advanceItem.status}</span>
                  </div>
                  {advanceItem.paidAt ? (
                    <div className="flex justify-between gap-4">
                      <span className="text-gray-400 text-sm">Paid on</span>
                      <span className="text-white text-sm font-medium">
                        {new Date(advanceItem.paidAt).toLocaleDateString()}
                      </span>
                    </div>
                  ) : null}
                  {advanceItem.proof?.transactionId ? (
                    <div className="flex justify-between gap-4">
                      <span className="text-gray-400 text-sm">Transaction ID</span>
                      <span className="text-white text-sm font-medium">{advanceItem.proof.transactionId}</span>
                    </div>
                  ) : null}
                  {advanceItem.proof?.notes ? (
                    <div>
                      <span className="text-gray-400 text-sm">Notes</span>
                      <p className="text-white text-sm mt-1 whitespace-pre-wrap">{advanceItem.proof.notes}</p>
                    </div>
                  ) : null}
                  {advanceItem.proof?.screenshotUrl ? (
                    <div>
                      <span className="text-gray-400 text-sm">Payment proof</span>
                      <a
                        href={advanceItem.proof.screenshotUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="block text-sm text-[#B8FF00] hover:underline mt-1 truncate"
                      >
                        View screenshot
                      </a>
                    </div>
                  ) : null}
                </>
              ) : (
                <p className="text-gray-400 text-sm">No advance payment details available.</p>
              )}
            </div>
          </Modal>

          {/* Deadline */}
          {proposal.deadline && (
            <div className="p-5 border-b border-white/10">
              <h2 className="text-sm font-semibold text-white mb-3">Deadline</h2>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-white">{new Date(proposal.deadline).toLocaleDateString()}</span>
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="p-5 border-b border-white/10">
            <div className="flex items-center gap-3 -mx-5 -mt-5 mb-4 px-5 py-3 bg-white/5 border-b border-white/10">
              <h2 className="text-[11px] font-semibold text-gray-200 uppercase tracking-wider">Timeline</h2>
              <div className="h-px flex-1 bg-white/10" />
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Created</span>
                <span className="text-white">
                  {formatDistanceToNow(new Date(proposal.createdAt), { addSuffix: true })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Updated</span>
                <span className="text-white">
                  {formatDistanceToNow(new Date(proposal.updatedAt), { addSuffix: true })}
                </span>
              </div>
            </div>
          </div>

 
        </div>
      </div>
      </div>

      {/* Audit Log Modal */}
      {showAuditLogModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl max-w-2xl w-full max-h-[80vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div>
                <h2 className="text-xl font-bold text-white">Activity Log</h2>
                <p className="text-sm text-gray-400 mt-1">Track all changes and updates</p>
              </div>
              <button
                onClick={() => setShowAuditLogModal(false)}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6">
              <ProposalAuditLog entries={[]} loading={false} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
