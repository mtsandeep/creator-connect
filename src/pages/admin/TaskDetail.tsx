import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiEye, FiCheckCircle, FiXCircle, FiClock, FiArrowLeft, FiSearch, FiUsers } from 'react-icons/fi';
import { useVerificationTasks, useTaskSubmissions } from '../../hooks/useVerificationTasks';
import { useAuthStore } from '../../stores';
import type { TaskSubmissionWithDetails, VerificationTask } from '../../types';
import Modal from '../../components/common/Modal';
import TaskContentSectionViewer from '../../components/tasks/TaskContentSectionViewer';

type SubmissionStatus = 'all' | 'in_progress' | 'submitted' | 'approved' | 'rejected';

export default function TaskDetail() {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { tasks, loading: taskLoading } = useVerificationTasks();
  const { submissions, loading: submissionsLoading, approveSubmission, rejectSubmission } = useTaskSubmissions();
  
  const [task, setTask] = useState<VerificationTask | null>(null);
  const [taskSubmissions, setTaskSubmissions] = useState<TaskSubmissionWithDetails[]>([]);
  const [statusFilter, setStatusFilter] = useState<SubmissionStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<TaskSubmissionWithDetails | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    if (taskId && tasks.length > 0) {
      const foundTask = tasks.find(t => t.id === taskId);
      if (foundTask) {
        setTask(foundTask);
        // Filter submissions for this specific task
        const filtered = submissions.filter(s => s.taskId === taskId);
        setTaskSubmissions(filtered);
      }
    }
  }, [taskId, tasks, submissions]);

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

  const filteredSubmissions = taskSubmissions.filter(submission => {
    const matchesStatus = statusFilter === 'all' || submission.status === statusFilter;
    const matchesSearch = searchQuery === '' || 
      submission.influencerName?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleApprove = async () => {
    if (!selectedSubmission || !user?.uid) return;
    
    const result = await approveSubmission(selectedSubmission.id, user.uid);
    if (result.success) {
      setSelectedSubmission(null);
      // Refresh submissions
      const updatedSubmissions = submissions.filter(s => s.taskId === taskId);
      setTaskSubmissions(updatedSubmissions);
    }
  };

  const handleReject = async () => {
    if (!selectedSubmission || !user?.uid || !rejectionReason.trim()) return;
    
    const result = await rejectSubmission(selectedSubmission.id, user.uid, rejectionReason.trim());
    if (result.success) {
      setShowRejectModal(false);
      setSelectedSubmission(null);
      setRejectionReason('');
      // Refresh submissions
      const updatedSubmissions = submissions.filter(s => s.taskId === taskId);
      setTaskSubmissions(updatedSubmissions);
    }
  };

  const openRejectModal = (submission: TaskSubmissionWithDetails) => {
    setSelectedSubmission(submission);
    setShowRejectModal(true);
  };

  if (taskLoading || !task) {
    return (
      <div className="p-6">
        <div className="text-center py-8 text-gray-400">Loading task details...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Back Button */}
      <button
        onClick={() => navigate('/admin/verification-tasks')}
        className="flex items-center gap-2 mb-6 text-gray-400 hover:text-white transition-colors"
      >
        <FiArrowLeft className="w-4 h-4" />
        Back to Tasks
      </button>

      {/* Task Details */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-8">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white mb-3">{task.title || 'Untitled Task'}</h1>
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className={`px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1 ${getDifficultyColor(task.difficulty)}`}>
                {task.difficulty}
              </span>
              <span className={`px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1 ${task.isActive ? 'text-green-400 bg-green-400/10' : 'text-gray-400 bg-gray-400/10'}`}>
                {task.isActive ? 'Active' : 'Inactive'}
              </span>
              {task.maxCompletions && (
                <span className="px-2 py-1 rounded-lg text-xs font-medium text-blue-400 bg-blue-400/10 flex items-center gap-1">
                  <FiUsers className="w-3 h-3" />
                  {task.currentCompletions || 0} / {task.maxCompletions} completed
                </span>
              )}
            </div>
            <p className="text-gray-300 leading-relaxed whitespace-pre-line">{task.description || 'No description provided'}</p>

            {/* Content Section Carousel */}
            {task.contentSection && task.contentSection.cards.length > 0 && (
              <TaskContentSectionViewer contentSection={task.contentSection} />
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-[#B8FF00] rounded-full"></span>
              Requirements
            </h3>
            <p className="text-gray-300 leading-relaxed whitespace-pre-line">
              {task.requirements.join('\n')}
            </p>
          </div>

          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-[#B8FF00] rounded-full"></span>
              Deliverables
            </h3>
            <ul className="space-y-2">
              {task.deliverables.map((deliverable, index) => (
                <li key={index} className="flex items-start gap-2 text-gray-300">
                  <span className="text-[#B8FF00] leading-tight text-sm">•</span>
                  <span className="flex-1">{deliverable}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Submissions Section */}
      <div>
        <h2 className="text-xl font-bold text-white mb-6">Submissions</h2>

        {/* Status Chips */}
        <div className="mb-6 flex items-center gap-2">
          <span className="text-sm text-gray-500">Filter by status:</span>
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === 'all' 
                ? 'bg-[#B8FF00] text-gray-900' 
                : 'bg-white/10 text-gray-400 hover:bg-white/20 hover:text-white'
            }`}
          >
            All ({submissions.length})
          </button>
          <button
            onClick={() => setStatusFilter('in_progress')}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === 'in_progress' 
                ? 'bg-blue-400 text-white' 
                : 'bg-white/10 text-gray-400 hover:bg-white/20 hover:text-white'
            }`}
          >
            In Progress ({submissions.filter(s => s.status === 'in_progress').length})
          </button>
          <button
            onClick={() => setStatusFilter('submitted')}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === 'submitted' 
                ? 'bg-yellow-400 text-white' 
                : 'bg-white/10 text-gray-400 hover:bg-white/20 hover:text-white'
            }`}
          >
            Submitted ({submissions.filter(s => s.status === 'submitted').length})
          </button>
          <button
            onClick={() => setStatusFilter('approved')}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === 'approved' 
                ? 'bg-green-400 text-white' 
                : 'bg-white/10 text-gray-400 hover:bg-white/20 hover:text-white'
            }`}
          >
            Approved ({submissions.filter(s => s.status === 'approved').length})
          </button>
          <button
            onClick={() => setStatusFilter('rejected')}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === 'rejected' 
                ? 'bg-red-400 text-white' 
                : 'bg-white/10 text-gray-400 hover:bg-white/20 hover:text-white'
            }`}
          >
            Rejected ({submissions.filter(s => s.status === 'rejected').length})
          </button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by influencer name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#B8FF00]"
            />
          </div>
        </div>

        {/* Submissions List */}
        {submissionsLoading ? (
          <div className="text-center py-8 text-gray-400">Loading submissions...</div>
        ) : filteredSubmissions.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p>No submissions found</p>
            <p className="text-sm mt-2">Try adjusting your filters or search criteria</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredSubmissions.map((submission) => (
              <div key={submission.id} className="bg-white/5 border border-white/10 rounded-xl p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-white">{submission.influencerName}</h3>
                      <span className={`px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1 ${getStatusColor(submission.status)}`}>
                        {getStatusIcon(submission.status)}
                        <span className="ml-1">{submission.status.replace('_', ' ')}</span>
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-400 mb-3">
                      <span>Started: {new Date(submission.startedAt!).toLocaleDateString()}</span>
                      {submission.submittedAt && (
                        <span>Submitted: {new Date(submission.submittedAt).toLocaleDateString()}</span>
                      )}
                    </div>

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
                        <p className="text-gray-300 text-sm whitespace-pre-line">{submission.submissionNotes}</p>
                      </div>
                    )}

                    {submission.rejectionReason && (
                      <div className="mb-3">
                        <p className="text-sm text-red-400 mb-1">Rejection Reason:</p>
                        <p className="text-red-300 text-sm whitespace-pre-line">{submission.rejectionReason}</p>
                      </div>
                    )}

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setSelectedSubmission(submission)}
                        className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                      >
                        <FiEye className="w-4 h-4" />
                        View Details
                      </button>
                      
                      {submission.status === 'submitted' && (
                        <>
                          <button
                            onClick={() => setSelectedSubmission(submission)}
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
            ))}
          </div>
        )}
      </div>

      {/* View Details Modal */}
      <Modal
        open={!!selectedSubmission}
        onClose={() => setSelectedSubmission(null)}
        title="Submission Details"
        maxWidthClassName="max-w-2xl"
        footer={
          selectedSubmission?.status === 'submitted' && (
            <div className="flex gap-3">
              <button
                onClick={() => setSelectedSubmission(null)}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors"
              >
                Close
              </button>
              <button
                onClick={handleApprove}
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
        {selectedSubmission && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">Influencer</p>
                <p className="text-white">{selectedSubmission.influencerName}</p>
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
              <p className="text-sm text-gray-500 mb-2">Required Deliverables</p>
              <ul className="space-y-1">
                {task.deliverables.map((deliverable, index) => (
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
                <p className="text-gray-300 bg-white/5 rounded-lg p-3 whitespace-pre-line">{selectedSubmission.submissionNotes}</p>
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
