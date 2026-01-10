import { useState } from 'react';
import { FiEye, FiCheckCircle, FiXCircle, FiClock, FiFilter, FiSearch } from 'react-icons/fi';
import { useTaskSubmissions } from '../../hooks/useVerificationTasks';
import { useAuthStore } from '../../stores';
import type { TaskSubmissionWithDetails, VerificationTask } from '../../types';
import Modal from '../../components/common/Modal';

type SubmissionStatus = 'all' | 'in_progress' | 'submitted' | 'approved' | 'rejected';

export default function TaskSubmissions() {
  const { user } = useAuthStore();
  const { submissions, loading, error, fetchSubmissions, approveSubmission, rejectSubmission } = useTaskSubmissions();
  
  const [selectedSubmission, setSelectedSubmission] = useState<TaskSubmissionWithDetails | null>(null);
  const [selectedTask, setSelectedTask] = useState<VerificationTask | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState<SubmissionStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_progress': return 'text-blue-400 bg-blue-400/10';
      case 'submitted': return 'text-yellow-400 bg-yellow-400/10';
      case 'approved': return 'text-green-400 bg-green-400/10';
      case 'rejected': return 'text-red-400 bg-red-400/10';
      default: return 'text-gray-400 bg-gray-400/10';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'in_progress': return <FiClock className="w-4 h-4" />;
      case 'submitted': return <FiClock className="w-4 h-4" />;
      case 'approved': return <FiCheckCircle className="w-4 h-4" />;
      case 'rejected': return <FiXCircle className="w-4 h-4" />;
      default: return <FiClock className="w-4 h-4" />;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-400 bg-green-400/10';
      case 'medium': return 'text-yellow-400 bg-yellow-400/10';
      case 'hard': return 'text-red-400 bg-red-400/10';
      default: return 'text-gray-400 bg-gray-400/10';
    }
  };

  const filteredSubmissions = submissions.filter(submission => {
    const matchesStatus = statusFilter === 'all' || submission.status === statusFilter;
    const matchesSearch = searchQuery === '' || 
      submission.taskTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      submission.influencerName?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleApprove = async () => {
    if (!selectedSubmission || !user?.uid) return;
    
    const result = await approveSubmission(selectedSubmission.id, user.uid);
    if (result.success) {
      setShowViewModal(false);
      setSelectedSubmission(null);
      setSelectedTask(null);
    }
  };

  const handleReject = async () => {
    if (!selectedSubmission || !user?.uid || !rejectionReason.trim()) return;
    
    const result = await rejectSubmission(selectedSubmission.id, user.uid, rejectionReason.trim());
    if (result.success) {
      setShowRejectModal(false);
      setShowViewModal(false);
      setSelectedSubmission(null);
      setSelectedTask(null);
      setRejectionReason('');
    }
  };

  const openViewModal = (submission: TaskSubmissionWithDetails, task: VerificationTask) => {
    setSelectedSubmission(submission);
    setSelectedTask(task);
    setShowViewModal(true);
  };

  const openRejectModal = (submission: TaskSubmissionWithDetails) => {
    setSelectedSubmission(submission);
    setShowRejectModal(true);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">Task Submissions</h1>
        <p className="text-gray-400">Review and manage verification task submissions</p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by task title or influencer name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#B8FF00]"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <FiFilter className="text-gray-400 w-4 h-4" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as SubmissionStatus)}
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-[#B8FF00]"
          >
            <option value="all">All Status</option>
            <option value="in_progress">In Progress</option>
            <option value="submitted">Submitted</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Submissions List */}
      {loading ? (
        <div className="text-center py-8 text-gray-400">Loading submissions...</div>
      ) : error ? (
        <div className="text-center py-8 text-red-400">{error}</div>
      ) : filteredSubmissions.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <p>No submissions found</p>
          <p className="text-sm mt-2">Try adjusting your filters or search criteria</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredSubmissions.map((submission) => {
            return (
              <div key={submission.id} className="bg-white/5 border border-white/10 rounded-xl p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-white">{submission.taskTitle}</h3>
                      <span className={`px-2 py-1 rounded-lg text-xs font-medium ${getDifficultyColor(submission.taskDifficulty)}`}>
                        {submission.taskDifficulty}
                      </span>
                      <span className={`px-2 py-1 rounded-lg text-xs font-medium ${getStatusColor(submission.status)}`}>
                        {getStatusIcon(submission.status)}
                        <span className="ml-1">{submission.status.replace('_', ' ')}</span>
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-400 mb-3">
                      <span>Influencer: {submission.influencerName}</span>
                      <span>Started: {new Date(submission.startedAt!).toLocaleDateString()}</span>
                      {submission.submittedAt && (
                        <span>Submitted: {new Date(submission.submittedAt).toLocaleDateString()}</span>
                      )}
                    </div>

                    <p className="text-gray-400 mb-3">{submission.taskDescription}</p>

                    {submission.status === 'submitted' && (
                      <div className="mb-3">
                        <p className="text-sm text-gray-500 mb-1">Completed Deliverables:</p>
                        <div className="flex flex-wrap gap-1">
                          {submission.completedDeliverables?.map((deliverable, index) => (
                            <span key={index} className="px-2 py-1 bg-green-400/20 text-green-400 rounded text-xs">
                              {deliverable}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {submission.submissionNotes && (
                      <div className="mb-3">
                        <p className="text-sm text-gray-500 mb-1">Notes:</p>
                        <p className="text-gray-300 text-sm">{submission.submissionNotes}</p>
                      </div>
                    )}

                    {submission.rejectionReason && (
                      <div className="mb-3">
                        <p className="text-sm text-red-400 mb-1">Rejection Reason:</p>
                        <p className="text-red-300 text-sm">{submission.rejectionReason}</p>
                      </div>
                    )}

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => openViewModal(submission, {
                          id: submission.taskId,
                          title: submission.taskTitle,
                          description: submission.taskDescription,
                          category: submission.taskCategory,
                          difficulty: submission.taskDifficulty,
                          requirements: submission.taskRequirements,
                          deliverables: submission.taskDeliverables,
                          maxCompletions: submission.taskMaxCompletions,
                          currentCompletions: submission.taskCurrentCompletions,
                          isActive: true,
                          createdAt: submission.taskCreatedAt
                        })}
                        className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                      >
                        <FiEye className="w-4 h-4" />
                        View Details
                      </button>
                      
                      {submission.status === 'submitted' && (
                        <>
                          <button
                            onClick={() => handleApprove()}
                            className="flex items-center gap-2 px-3 py-2 bg-green-400/20 hover:bg-green-400/30 text-green-400 rounded-lg transition-colors"
                          >
                            <FiCheckCircle className="w-4 h-4" />
                            Approve
                          </button>
                          <button
                            onClick={() => openRejectModal(submission)}
                            className="flex items-center gap-2 px-3 py-2 bg-red-400/20 hover:bg-red-400/30 text-red-400 rounded-lg transition-colors"
                          >
                            <FiXCircle className="w-4 h-4" />
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* View Details Modal */}
      <Modal
        open={showViewModal}
        onClose={() => setShowViewModal(false)}
        title="Submission Details"
        maxWidthClassName="max-w-2xl"
        footer={
          selectedSubmission?.status === 'submitted' && (
            <div className="flex gap-3">
              <button
                onClick={() => setShowViewModal(false)}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => handleApprove()}
                className="flex items-center gap-2 px-4 py-2 bg-green-400/20 hover:bg-green-400/30 text-green-400 rounded-xl transition-colors"
              >
                <FiCheckCircle className="w-4 h-4" />
                Approve
              </button>
              <button
                onClick={() => openRejectModal(selectedSubmission)}
                className="flex items-center gap-2 px-4 py-2 bg-red-400/20 hover:bg-red-400/30 text-red-400 rounded-xl transition-colors"
              >
                <FiXCircle className="w-4 h-4" />
                Reject
              </button>
            </div>
          )
        }
      >
        {selectedSubmission && selectedTask && (
          <div className="space-y-4">
            <div>
              <h4 className="text-lg font-semibold text-white mb-2">{selectedTask.title}</h4>
              <p className="text-gray-400">{selectedTask.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">Influencer</p>
                <p className="text-white">{selectedSubmission.influencerName || 'Unknown'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Status</p>
                <span className={`inline-block px-2 py-1 rounded-lg text-xs font-medium ${getStatusColor(selectedSubmission.status)}`}>
                  {selectedSubmission.status.replace('_', ' ')}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Started</p>
                <p className="text-white">{new Date(selectedSubmission.startedAt!).toLocaleDateString()}</p>
              </div>
              {selectedSubmission.submittedAt && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Submitted</p>
                  <p className="text-white">{new Date(selectedSubmission.submittedAt).toLocaleDateString()}</p>
                </div>
              )}
            </div>

            <div>
              <p className="text-sm text-gray-500 mb-2">Task Requirements</p>
              <ul className="space-y-1">
                {selectedTask.requirements.map((req, index) => (
                  <li key={index} className="flex items-start gap-2 text-white">
                    <span className="text-[#B8FF00] mt-1">•</span>
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-sm text-gray-500 mb-2">Required Deliverables</p>
              <ul className="space-y-1">
                {selectedTask.deliverables.map((deliverable, index) => (
                  <li key={index} className="flex items-center gap-2 text-white">
                    <span className={`w-4 h-4 rounded flex items-center justify-center text-xs ${
                      selectedSubmission.completedDeliverables?.includes(deliverable)
                        ? 'bg-green-400/20 text-green-400'
                        : 'bg-gray-400/20 text-gray-400'
                    }`}>
                      {selectedSubmission.completedDeliverables?.includes(deliverable) ? '✓' : '○'}
                    </span>
                    <span>{deliverable}</span>
                  </li>
                ))}
              </ul>
            </div>

            {selectedSubmission.submissionNotes && (
              <div>
                <p className="text-sm text-gray-500 mb-2">Submission Notes</p>
                <p className="text-gray-300 bg-white/5 rounded-lg p-3">{selectedSubmission.submissionNotes}</p>
              </div>
            )}

            {selectedSubmission.attachments && selectedSubmission.attachments.length > 0 && (
              <div>
                <p className="text-sm text-gray-500 mb-2">Attachments</p>
                <div className="space-y-2">
                  {selectedSubmission.attachments.map((attachment, index) => (
                    <div key={index} className="flex items-center gap-3 bg-white/5 rounded-lg p-3">
                      <span className="text-white">{attachment.name}</span>
                      <a
                        href={attachment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#B8FF00] hover:text-[#B8FF00]/80 text-sm"
                      >
                        View
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Reject Modal */}
      <Modal
        open={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        title="Reject Submission"
        maxWidthClassName="max-w-lg"
        footer={
          <div className="flex gap-3">
            <button
              onClick={() => setShowRejectModal(false)}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleReject}
              disabled={!rejectionReason.trim()}
              className="px-4 py-2 bg-red-400/20 hover:bg-red-400/30 text-red-400 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Reject Submission
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-gray-400">Please provide a reason for rejecting this submission:</p>
          <textarea
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            rows={4}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-red-400 resize-none"
            placeholder="Explain why this submission is being rejected..."
          />
        </div>
      </Modal>
    </div>
  );
}
