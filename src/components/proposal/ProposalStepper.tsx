// ============================================
// PROPOSAL STEPPER COMPONENT
// ============================================

import { useState } from 'react';
import { Link } from 'react-router-dom';
import * as Popover from '@radix-ui/react-popover';
import { FiFileText, FiDollarSign, FiPackage, FiCheck, FiClock, FiAlertTriangle, FiX, FiXCircle } from 'react-icons/fi';

import type { PaymentScheduleItem } from '../../types';

interface ProposalStepperProps {
  proposalId: string;
  proposalStatus: 'created' | 'discussing' | 'changes_requested' | 'agreed' | 'cancelled';
  paymentStatus: 'not_started' | 'pending_advance' | 'pending_escrow' | 'advance_paid' | 'pending_milestone' | 'milestone_paid' | 'pending_remaining' | 'fully_paid';
  workStatus: 'not_started' | 'in_progress' | 'revision_requested' | 'submitted' | 'approved' | 'disputed';
  isInfluencer?: boolean;
  createdAt?: number;
  updatedAt?: number;
  paymentSchedule?: PaymentScheduleItem[];
}

type StepKey = 'proposal' | 'payment' | 'delivery' | 'complete';

interface StepState {
  key: StepKey;
  label: string;
  icon: React.ReactNode;
  completedIcon: React.ReactNode;
  status: 'pending' | 'active' | 'completed';
  title: string;
  description: string;
  timestamp?: number;
}

export default function ProposalStepper({
  proposalId,
  proposalStatus,
  paymentStatus,
  workStatus,
  isInfluencer = false,
  createdAt,
  updatedAt,
  paymentSchedule,
}: ProposalStepperProps) {
  const [expandedStep, setExpandedStep] = useState<StepKey | null>(null);

  const schedule: PaymentScheduleItem[] = Array.isArray(paymentSchedule) ? paymentSchedule : [];
  const paidItems = schedule.filter((item) => item?.status === 'paid' || item?.status === 'released');
  const totalPaidAmount = paidItems.reduce((sum, item) => sum + (Number(item?.amount) || 0), 0);

  const agreedOnTimestamp = proposalStatus === 'agreed'
    ? (createdAt || updatedAt || 0)
    : 0;
  const completionTimestamp = paymentStatus === 'fully_paid' && workStatus === 'approved'
    ? (updatedAt || 0)
    : 0;

  // Get step states
  const getStepStates = (): StepState[] => {
    const steps: StepState[] = [];

    // Step 1: Proposal
    const proposalStep: StepState = {
      key: 'proposal',
      label: 'Proposal',
      icon: <FiFileText size={20} />,
      completedIcon: <FiCheck size={20} />,
      status: 'pending',
      title: 'Proposal',
      description: 'Create and agree on proposal terms',
    };

    if (proposalStatus === 'created') {
      proposalStep.status = 'active';
      proposalStep.description = isInfluencer
        ? 'Review the proposal and accept to start discussions'
        : 'Waiting for influencer to respond';
    } else if (proposalStatus === 'discussing') {
      proposalStep.status = 'active';
      proposalStep.description = 'Discussing details and negotiating terms';
    } else if (proposalStatus === 'changes_requested') {
      proposalStep.status = 'active';
      proposalStep.description = 'Proposal updated, awaiting re-approval';
    } else if (proposalStatus === 'agreed') {
      proposalStep.status = 'completed';
      proposalStep.description = 'Proposal terms agreed by both parties';
    } else if (proposalStatus === 'cancelled') {
      proposalStep.status = 'pending';
      proposalStep.description = 'Proposal was cancelled';
    }
    steps.push(proposalStep);

    // Step 2: Payment
    const paymentStep: StepState = {
      key: 'payment',
      label: 'Payment',
      icon: <FiDollarSign size={20} />,
      completedIcon: <FiCheck size={20} />,
      status: 'pending',
      title: 'Payment',
      description: 'Complete payment to start work',
    };

    if (proposalStatus === 'agreed') {
      if (paymentStatus === 'not_started') {
        paymentStep.status = 'active';
        paymentStep.description = isInfluencer
          ? 'Pay platform fee to enable payment'
          : 'Waiting for influencer to pay platform fee';
      } else if (paymentStatus === 'pending_advance' || paymentStatus === 'pending_escrow') {
        paymentStep.status = 'active';
        paymentStep.description = isInfluencer
          ? 'Waiting for promoter to complete payment'
          : 'Complete the payment to start work';
      } else if (paymentStatus === 'advance_paid' || paymentStatus === 'milestone_paid' || paymentStatus === 'pending_milestone') {
        paymentStep.status = 'active';
        paymentStep.description = 'Payment in progress';
      } else if (paymentStatus === 'pending_remaining') {
        paymentStep.status = 'active';
        paymentStep.description = 'Work approved, complete remaining payment';
      } else if (paymentStatus === 'fully_paid') {
        paymentStep.status = 'completed';
        paymentStep.description = 'All payments completed';
      }
    }
    steps.push(paymentStep);

    // Step 3: Delivery
    const deliveryStep: StepState = {
      key: 'delivery',
      label: 'Delivery',
      icon: <FiPackage size={20} />,
      completedIcon: <FiCheck size={20} />,
      status: 'pending',
      title: 'Work Delivery',
      description: 'Submit work for review',
    };

    if (workStatus === 'in_progress') {
      deliveryStep.status = 'active';
      deliveryStep.description = isInfluencer
        ? 'Work in progress, update completion percentage'
        : 'Influencer is working on deliverables';
    } else if (workStatus === 'revision_requested') {
      deliveryStep.status = 'active';
      deliveryStep.description = isInfluencer
        ? 'Revision requested, update and resubmit work'
        : 'Revision requested, waiting for updated work';
    } else if (workStatus === 'submitted') {
      deliveryStep.status = 'active';
      deliveryStep.description = isInfluencer
        ? 'Work submitted, waiting for brand approval'
        : 'Review submitted work and provide feedback';
    } else if (workStatus === 'approved') {
      deliveryStep.status = 'completed';
      deliveryStep.description = 'Work approved by brand';
    } else if (workStatus === 'disputed') {
      deliveryStep.status = 'active';
      deliveryStep.description = 'Dispute raised, admin reviewing';
    }
    steps.push(deliveryStep);

    // Step 4: Complete
    const completeStep: StepState = {
      key: 'complete',
      label: 'Complete',
      icon: <FiClock size={20} />,
      completedIcon: <FiCheck size={20} />,
      status: 'pending',
      title: 'Completed',
      description: 'Collaboration completed successfully',
    };

    if (proposalStatus === 'agreed' && paymentStatus === 'fully_paid' && workStatus === 'approved') {
      completeStep.status = 'completed';
    }
    steps.push(completeStep);

    return steps;
  };

  const steps = getStepStates();
  const activeStepIndex = steps.findIndex(s => s.status === 'active');

  // Render a single step circle
  const renderStepCircle = (step: StepState, index: number) => {
    const isCompleted = step.status === 'completed';
    const isActive = step.status === 'active';
    const isExpanded = expandedStep === step.key;
    const isPending = !isCompleted && !isActive;
    const isBeforeActive = index < activeStepIndex;
    const isLast = index === steps.length - 1;
    const showCompletedTickIcon = step.key === 'complete';
    const connectorIsGreen = isCompleted;
    const connectorIsOrange =
      (isActive && !isCompleted) ||
      (activeStepIndex !== -1 && isBeforeActive && !isCompleted && step.key === 'payment');

    const showWarningBadge = step.key === 'delivery' && workStatus === 'disputed';
    const showCancelledBadge = step.key === 'proposal' && proposalStatus === 'cancelled';

    return (
      <li
        key={step.key}
        className={`
          flex items-start
          ${isLast ? '' : 'flex-1'}
        `}
      >
        <Popover.Root
          open={isExpanded}
          onOpenChange={(open) => setExpandedStep(open ? step.key : null)}
        >
          <Popover.Trigger asChild>
            <button type="button" className="flex flex-col items-center relative shrink-0 cursor-pointer">
              {(isActive || isExpanded) && (
                <div
                  className={`absolute top-6 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full z-0
                    ${isActive ? 'border-2 border-dashed border-warning-500' : 'border-2 border-dashed border-white/40'}
                  `}
                />
              )}

              {showWarningBadge && (
                <div className="absolute top-0 right-0 translate-x-1 -translate-y-1 z-20">
                  <div className="w-5 h-5 rounded-full bg-gray-900 border border-white/10 flex items-center justify-center">
                    <FiAlertTriangle size={20} className="text-warning-500" />
                  </div>
                </div>
              )}

              {showCancelledBadge && (
                <div className="absolute top-0 right-0 translate-x-1 -translate-y-1 z-20">
                  <div className="w-5 h-5 rounded-full bg-gray-900 border border-white/10 flex items-center justify-center">
                    <FiXCircle size={20} className="text-error-500" />
                  </div>
                </div>
              )}

              <div
                className={`
                  w-12 h-12 rounded-full flex items-center justify-center transition-all relative z-10 shrink-0
                  ${isCompleted ? 'bg-gray-900 text-white border-2 border-success-500' : ''}
                  ${isActive && !isCompleted ? 'bg-gray-900 text-white border-2 border-warning-500' : ''}
                  ${!isActive && isExpanded && !isCompleted ? 'bg-white/5 text-white border-2 border-white/20' : ''}
                  ${isPending && !isExpanded && isBeforeActive ? 'bg-gray-700 text-gray-400' : ''}
                  ${isPending && !isExpanded && !isBeforeActive ? 'bg-white/5 text-gray-400 border-2 border-transparent' : ''}
                `}
              >
                {isCompleted && showCompletedTickIcon ? step.completedIcon : step.icon}
              </div>

              <span
                className={`
                  text-xs mt-2 font-medium whitespace-nowrap
                  ${isActive && !isCompleted ? 'text-white' : ''}
                  ${!isActive && isExpanded && !isCompleted ? 'text-white' : ''}
                  ${isPending && !isExpanded ? 'text-gray-400' : ''}
                  ${isCompleted ? 'text-gray-400' : ''}
                `}
              >
                {step.label}
              </span>
            </button>
          </Popover.Trigger>

          <Popover.Portal>
            <Popover.Content
              side="bottom"
              align="center"
              sideOffset={12}
              collisionPadding={12}
              className="z-50 w-[min(28rem,calc(100vw-2rem))] outline-none drop-shadow-2xl bg-gray-900 border border-white/10 rounded-xl"
            >
              <Popover.Arrow width={20} height={10} className="fill-gray-900 stroke-white/10 translate-y-[-1px]" />
              {renderExpandedDetail(step)}
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>

        {!isLast && (
          <div
            className={`
              flex-1 h-0.5 mx-4 mt-6 transition-all
              ${connectorIsGreen ? 'bg-success-500' : connectorIsOrange ? 'bg-warning-500' : 'bg-white/10'}
            `}
          />
        )}
      </li>
    );
  };

  // Render expanded detail section
  const renderExpandedDetail = (step: StepState) => {
    const isCompleted = step.status === 'completed';
    const isActive = step.status === 'active';
    const showCompletedTickIcon = step.key === 'complete';

    return (
      <div className="p-6 animate-slideDown relative">
        {/* Header */}
        <div className="flex items-center mb-4 pr-10">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center
              ${isCompleted ? 'bg-gray-900 text-white border-2 border-success-500' : ''}
              ${isActive && !isCompleted ? 'bg-gray-900 text-white border-2 border-warning-500' : ''}
              ${!isCompleted && !isActive ? 'bg-white/10 text-gray-300' : ''}
            `}>
              {isCompleted && showCompletedTickIcon ? step.completedIcon : step.icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-white">{step.title}</h3>
                {isCompleted &&
                  <FiCheck size={14} className="text-success-500" />}
              </div>
              <p className={`text-sm ${isActive ? 'text-warning-500' : 'text-gray-500'}`}>
                {step.status === 'completed' ? 'Completed' : step.status === 'active' ? 'In Progress' : 'Pending'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setExpandedStep(null)}
            className="absolute top-3 right-3 p-1 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* Description */}
        <p className="text-gray-300 mb-4">{step.description}</p>

        {/* Vertical stepper for this phase */}
        {renderVerticalStepper(step.key)}
      </div>
    );
  };

  // Render vertical stepper for a phase
  const renderVerticalStepper = (stepKey: StepKey) => {
    switch (stepKey) {
      case 'proposal':
        {
          const hasChangesRequested = proposalStatus === 'changes_requested';
          const isProposalDone = proposalStatus === 'agreed' || proposalStatus === 'cancelled';

          const proposalSteps: Array<{ title: string; description: string; status: 'pending' | 'in_progress' | 'completed'; showTick?: boolean }> = [];

          proposalSteps.push({
            title: 'Create Proposal',
            description: 'Proposal is created and shared',
            status: proposalStatus === 'created' ? 'in_progress' : 'completed',
          });

          proposalSteps.push({
            title: 'Discussion',
            description: 'Discuss terms and finalize details',
            status:
              proposalStatus === 'created'
                ? 'pending'
                : proposalStatus === 'discussing' || proposalStatus === 'changes_requested'
                  ? 'in_progress'
                  : proposalStatus === 'agreed'
                    ? 'completed'
                    : 'pending',
          });

          if (hasChangesRequested) {
            proposalSteps.push({
              title: 'Change Request',
              description: 'Changes requested and awaiting re-approval',
              status: proposalStatus === 'changes_requested' ? 'in_progress' : 'pending',
            });
          }

          proposalSteps.push({
            title: proposalStatus === 'cancelled' ? 'Cancelled' : 'Influencer Agreed',
            description: proposalStatus === 'cancelled' ? 'Proposal was declined/cancelled' : 'Terms agreed by both parties',
            status: isProposalDone ? 'completed' : 'pending',
          });

          proposalSteps.push({
            title: 'Proposal Complete',
            description: 'Proposal phase completed',
            status: isProposalDone ? 'completed' : 'pending',
            showTick: isProposalDone,
          });

          return (
            <div className="ml-2">
              {proposalSteps.map((s, idx) =>
                renderVerticalStep(s.status, s.title, s.description, idx === proposalSteps.length - 1, !!s.showTick)
              )}
            </div>
          );
        }

      case 'payment':
        {
          const hasMilestone = paymentStatus === 'pending_milestone' || paymentStatus === 'milestone_paid';
          const paymentComplete = paymentStatus === 'fully_paid';

          const statusOf = (key: 'initiated' | 'advance' | 'milestone' | 'remaining' | 'fully_paid'): 'pending' | 'in_progress' | 'completed' => {
            if (paymentComplete) return 'completed';

            switch (key) {
              case 'initiated':
                return paymentStatus === 'not_started' ? 'pending' : 'completed';
              case 'advance':
                if (paymentStatus === 'pending_advance' || paymentStatus === 'pending_escrow') return 'in_progress';
                if (paymentStatus === 'advance_paid' || paymentStatus === 'pending_milestone' || paymentStatus === 'milestone_paid' || paymentStatus === 'pending_remaining') return 'completed';
                return 'pending';
              case 'milestone':
                if (!hasMilestone) return 'pending';
                if (paymentStatus === 'pending_milestone') return 'in_progress';
                if (paymentStatus === 'milestone_paid' || paymentStatus === 'pending_remaining') return 'completed';
                return 'pending';
              case 'remaining':
                if (paymentStatus === 'pending_remaining') return 'in_progress';
                return 'pending';
              case 'fully_paid':
                return paymentComplete ? 'completed' : 'pending';
            }
          };

          const paymentSteps: Array<{ title: string; description: string; status: 'pending' | 'in_progress' | 'completed'; showTick?: boolean }> = [];

          paymentSteps.push({
            title: 'Payment Initiated',
            description: paymentStatus === 'not_started' ? 'Payment not started yet' : 'Payment flow started',
            status: statusOf('initiated'),
          });

          paymentSteps.push({
            title: 'Advance Paid',
            description: 'Advance payment (or escrow funding)',
            status: statusOf('advance'),
          });

          if (hasMilestone) {
            paymentSteps.push({
              title: 'Milestone Paid',
              description: 'Milestone payment (if applicable)',
              status: statusOf('milestone'),
            });
          }

          paymentSteps.push({
            title: 'Remaining Paid',
            description: 'Remaining payment after approval',
            status: statusOf('remaining'),
          });

          paymentSteps.push({
            title: 'Fully Paid',
            description: 'All payments completed',
            status: statusOf('fully_paid'),
            showTick: paymentComplete,
          });

          return (
            <div className="ml-2">
              {paymentSteps.map((s, idx) =>
                renderVerticalStep(s.status, s.title, s.description, idx === paymentSteps.length - 1, !!s.showTick)
              )}
            </div>
          );
        }

      case 'delivery':
        {
          const workComplete = workStatus === 'approved';

          const statusOf = (key: 'started' | 'submitted' | 'approved' | 'completed'): 'pending' | 'in_progress' | 'completed' => {
            if (workComplete) return 'completed';

            switch (key) {
              case 'started':
                if (workStatus === 'not_started') return 'pending';
                if (workStatus === 'in_progress') return 'in_progress';
                return 'completed';
              case 'submitted':
                if (workStatus === 'submitted') return 'in_progress';
                if (workStatus === 'revision_requested' || workStatus === 'disputed') return 'in_progress';
                return 'pending';
              case 'approved':
                return 'pending';
              case 'completed':
                return 'pending';
            }
          };

          const workSteps: Array<{ title: string; description: string; status: 'pending' | 'in_progress' | 'completed'; showTick?: boolean }> = [];

          workSteps.push({
            title: 'Work Started',
            description: isInfluencer ? 'Start working on deliverables' : 'Influencer starts work',
            status: statusOf('started'),
          });

          workSteps.push({
            title: 'Submitted',
            description: 'Deliverables submitted for review',
            status: workStatus === 'submitted' || workStatus === 'revision_requested' || workStatus === 'disputed' ? 'in_progress' : workStatus === 'approved' ? 'completed' : 'pending',
          });

          workSteps.push({
            title: 'Approved',
            description: 'Work approved by promoter',
            status: workStatus === 'approved' ? 'completed' : 'pending',
          });

          workSteps.push({
            title: 'Completed',
            description: 'Delivery phase completed',
            status: workComplete ? 'completed' : 'pending',
            showTick: workComplete,
          });

          return (
            <div className="ml-2">
              {workSteps.map((s, idx) =>
                renderVerticalStep(s.status, s.title, s.description, idx === workSteps.length - 1, !!s.showTick)
              )}
            </div>
          );
        }

      case 'complete':
        return (
          <>
            {proposalStatus === 'agreed' && paymentStatus === 'fully_paid' && workStatus === 'approved' && (
              <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                <p className="text-xs font-semibold text-gray-200">Summary</p>
                <div className="mt-2 space-y-1 text-xs text-gray-400">
                  <p>Proposal created on: {createdAt ? new Date(createdAt).toLocaleDateString() : '—'}</p>
                  <p>Proposal agreed on: {agreedOnTimestamp ? new Date(agreedOnTimestamp).toLocaleDateString() : '—'}</p>
                  <p>Total amount paid: ₹{totalPaidAmount.toLocaleString()}</p>
                  <p>Completion date: {completionTimestamp ? new Date(completionTimestamp).toLocaleDateString() : '—'}</p>
                  <div className="pt-1 space-y-1">
                    <Link
                      to={`/invoice/${proposalId}/advance?returnTo=${encodeURIComponent(isInfluencer ? `/influencer/proposals/${proposalId}` : `/promoter/proposals/${proposalId}`)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="block text-xs text-primary-500 underline"
                    >
                      Download advance invoice
                    </Link>
                    <Link
                      to={`/invoice/${proposalId}/final?returnTo=${encodeURIComponent(isInfluencer ? `/influencer/proposals/${proposalId}` : `/promoter/proposals/${proposalId}`)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="block text-xs text-primary-500 underline"
                    >
                      Download final invoice
                    </Link>
                    <span className="block text-xs text-gray-500">Send invoice (coming soon)</span>
                  </div>
                </div>
              </div>
            )}
          </>
        );

      default:
        return null;
    }
  };

  // Render a single vertical step
  const renderVerticalStep = (
    status: 'pending' | 'in_progress' | 'completed',
    title: string,
    description: string,
    isLast: boolean,
    showTick: boolean
  ) => {
    const isCompleted = status === 'completed';
    const isInProgress = status === 'in_progress';

    const dotClassName = `w-5 h-5 rounded-full flex items-center justify-center text-[10px]
      ${isCompleted ? 'bg-success-500/20 border-2 border-success-500 text-white' : ''}
      ${isInProgress ? 'bg-warning-500/20 border-2 border-warning-500 text-white' : ''}
      ${!isCompleted && !isInProgress ? 'bg-gray-700 border border-white/10 text-gray-200' : ''}
    `;

    const connectorClassName = `w-0.5 h-10
      ${isCompleted ? 'bg-success-500' : isInProgress ? 'bg-warning-500' : 'bg-white/15'}
    `;

    return (
      <div className="flex items-start gap-3">
        <div className="flex flex-col items-center">
          <div className={dotClassName}>
            {showTick && isCompleted && <FiCheck size={11} className="text-success-500" />}
          </div>
          {!isLast && <div className={connectorClassName} />}
        </div>
        <div className="flex-1 pb-4">
          <p className={`text-sm font-medium ${isInProgress ? 'text-white' : 'text-gray-300'}`}>
            {title}
          </p>
          <p className="text-xs text-gray-400">{description}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Horizontal Stepper */}
      <div className="p-4 py-2">
        <ol className="flex items-center w-full">
          {steps.map((step, index) => renderStepCircle(step, index))}
        </ol>
      </div>

      {/* Dispute warning */}
      {workStatus === 'disputed' && (
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4 flex items-center gap-3">
          <FiAlertTriangle size={20} className="text-orange-400 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-orange-400">Dispute Under Review</p>
            <p className="text-xs text-gray-400">Admin is reviewing this proposal</p>
          </div>
        </div>
      )}
    </div>
  );
}
