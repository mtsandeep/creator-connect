import { useState } from 'react';
import { FiPlay, FiClock, FiCheckCircle, FiEye, FiUpload, FiFileText, FiXCircle, FiRefreshCw } from 'react-icons/fi';
import { useInfluencerTasks } from '../../hooks/useVerificationTasks';
import { useAuthStore } from '../../stores';
import { Checkbox } from '@headlessui/react';
import type { VerificationTask, TaskSubmission, SubmitTaskData } from '../../types';
import Modal from '../../components/common/Modal';
import TaskContentSectionViewer from '../../components/tasks/TaskContentSectionViewer';

export default function InfluencerVerificationTasks() {
  const { user } = useAuthStore();
  const {
    availableTasks,
    mySubmissions,
    loading,
    submissionsLoading,
    error,
    startTask,
    submitTask
  } = useInfluencerTasks(user?.uid || '');

  const [activeTab, setActiveTab] = useState<'available' | 'my-tasks'>('available');
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<VerificationTask | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<TaskSubmission | null>(null);

  const [submissionData, setSubmissionData] = useState<SubmitTaskData>({
    completedDeliverables: [],
    submissionNotes: '',
    attachments: []
  });

  const resetSubmissionForm = () => {
    setSubmissionData({
      completedDeliverables: [],
      submissionNotes: '',
      attachments: []
    });
  };

  const handleStartTask = async (task: VerificationTask) => {
    const result = await startTask(task.id);
    if (result.success) {
      // Task started successfully
    }
  };

  const handleSubmitTask = async () => {
    if (!selectedSubmission) return;

    const result = await submitTask(selectedSubmission.id, submissionData);
    if (result.success) {
      setShowSubmissionModal(false);
      setSelectedSubmission(null);
      resetSubmissionForm();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSubmissionData(prev => ({
      ...prev,
      attachments: [...prev.attachments, ...files]
    }));
  };

  const removeAttachment = (index: number) => {
    setSubmissionData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };

  const availableTasksToShow = availableTasks.filter(task => {
    if (!task.maxCompletions) return true;
    return (task.currentCompletions || 0) < task.maxCompletions;
  });

  // Add a new function to get task status
  const getTaskStatus = (task: VerificationTask) => {
    // Check if user has already started this task
    const mySubmission = mySubmissions.find(s => s.taskId === task.id);
    if (mySubmission) {
      return {
        status: 'my-task',
        text: 'In Progress',
        color: 'text-blue-400 bg-blue-400/10',
        action: 'Submit Work',
        actionHandler: () => {
          setSelectedSubmission(mySubmission);
          setSelectedTask(task);
          setShowSubmissionModal(true);
        }
      };
    }

    // Task is available
    return {
      status: 'available',
      text: 'Available',
      color: 'text-green-400 bg-green-400/10',
      action: 'Start Task',
      actionHandler: () => handleStartTask(task)
    };
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-400 bg-green-400/10';
      case 'medium': return 'text-yellow-400 bg-yellow-400/10';
      case 'hard': return 'text-red-400 bg-red-400/10';
      default: return 'text-gray-400 bg-gray-400/10';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_progress': return 'text-blue-400 bg-blue-400/10';
      case 'submitted': return 'text-yellow-400 bg-yellow-400/10';
      case 'approved': return 'text-green-400 bg-green-400/10';
      case 'rejected': return 'text-red-400 bg-red-400/10';
      default: return 'text-gray-400 bg-gray-400/10';
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">Verification Tasks</h1>
        <p className="text-gray-400">Complete verification tasks to earn your verified badge</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-white/10 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('available')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'available'
                ? 'border-[#B8FF00] text-[#B8FF00]'
                : 'border-transparent text-gray-400 hover:text-gray-300'
            }`}
          >
            Available Tasks
            {availableTasksToShow.length > 0 && (
              <span className="ml-2 bg-[#B8FF00]/20 text-[#B8FF00] px-2 py-1 rounded-full text-xs">
                {availableTasksToShow.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('my-tasks')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'my-tasks'
                ? 'border-[#B8FF00] text-[#B8FF00]'
                : 'border-transparent text-gray-400 hover:text-gray-300'
            }`}
          >
            My Tasks
            {mySubmissions.length > 0 && (
              <span className="ml-2 bg-[#B8FF00]/20 text-[#B8FF00] px-2 py-1 rounded-full text-xs">
                {mySubmissions.length}
              </span>
            )}
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'available' && (
        <div>
          {loading ? (
            <div className="text-center py-8 text-gray-400">Loading tasks...</div>
          ) : error ? (
            <div className="text-center py-8 text-red-400">{error}</div>
          ) : availableTasksToShow.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p>No available tasks at the moment</p>
              <p className="text-sm mt-2">Check back later for new verification opportunities</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {availableTasksToShow.map((task) => {
                const taskStatus = getTaskStatus(task);
                
                return (
                  <div key={task.id} className="bg-white/5 border border-white/10 rounded-xl p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-white">{task.title}</h3>
                          <span className={`px-2 py-1 rounded-lg text-xs font-medium ${getDifficultyColor(task.difficulty)}`}>
                            {task.difficulty}
                          </span>
                          <span className={`px-2 py-1 rounded-lg text-xs font-medium ${taskStatus.color}`}>
                            {taskStatus.text}
                          </span>
                        </div>
                        <p className="text-gray-400 mb-4 line-clamp-2">{task.description}</p>

                        <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
                          <div className="flex items-center gap-2">
                            <FiFileText className="w-4 h-4" />
                            <span>{task.deliverables.length} deliverable{task.deliverables.length > 1 ? 's' : ''}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedTask(task);
                              setShowTaskModal(true);
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-medium rounded-lg transition-colors"
                          >
                            <FiEye className="w-4 h-4" />
                            View Details
                          </button>
                          {/* Only show Start Task button when submissions are fully loaded */}
                          {taskStatus.status === 'available' && !submissionsLoading && (
                            <button
                              onClick={taskStatus.actionHandler}
                              className="flex items-center gap-2 px-4 py-2 bg-[#B8FF00] hover:bg-[#B8FF00]/80 text-gray-900 font-semibold rounded-xl transition-colors"
                            >
                              <FiPlay className="w-4 h-4" />
                              {taskStatus.action}
                            </button>
                          )}
                          {/* Show loading skeleton for action button while submissions are loading */}
                          {taskStatus.status === 'available' && submissionsLoading && (
                            <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-xl animate-pulse">
                              <div className="w-4 h-4 bg-white/20 rounded"></div>
                              <div className="w-20 h-4 bg-white/20 rounded"></div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'my-tasks' && (
        <div>
          {loading ? (
            <div className="text-center py-8 text-gray-400">Loading your tasks...</div>
          ) : mySubmissions.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p>You haven't started any verification tasks yet</p>
              <button
                onClick={() => setActiveTab('available')}
                className="mt-2 text-[#B8FF00] hover:text-[#B8FF00]/80"
              >
                Browse Available Tasks
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              {/* In Progress Tasks */}
              {mySubmissions.filter(s => s.status === 'in_progress').length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">In Progress</h3>
                  <div className="grid gap-4">
                    {mySubmissions.filter(s => s.status === 'in_progress').map((submission) => {
                      const task = availableTasks.find(t => t.id === submission.taskId);
                      if (!task) return null;

                      return (
                        <div key={submission.id} className="bg-white/5 border border-white/10 rounded-xl p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-lg font-semibold text-white">{task.title}</h3>
                                <span className={`px-2 py-1 rounded-lg text-xs font-medium ${getDifficultyColor(task.difficulty)}`}>
                                  {task.difficulty}
                                </span>
                                <span className={`px-2 py-1 rounded-lg text-xs font-medium ${getStatusColor(submission.status)}`}>
                                  In Progress
                                </span>
                              </div>
                              <p className="text-gray-400 mb-4 line-clamp-2">{task.description}</p>

                              <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
                                <div className="flex items-center gap-2">
                                  <FiFileText className="w-4 h-4" />
                                  <span>{task.deliverables.length} deliverable{task.deliverables.length > 1 ? 's' : ''}</span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => {
                                    setSelectedTask(task);
                                    setShowTaskModal(true);
                                  }}
                                  className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-medium rounded-lg transition-colors"
                                >
                                  <FiEye className="w-4 h-4" />
                                  View Details
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedSubmission(submission);
                                    setSelectedTask(task);
                                    setShowSubmissionModal(true);
                                  }}
                                  className="flex items-center gap-2 px-4 py-2 bg-[#B8FF00] hover:bg-[#B8FF00]/80 text-gray-900 font-semibold rounded-xl transition-colors"
                                >
                                  <FiUpload className="w-4 h-4" />
                                  Submit Work
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Pending Submissions */}
              {mySubmissions.filter(s => s.status === 'submitted').length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Pending Review</h3>
                  <div className="grid gap-4">
                    {mySubmissions.filter(s => s.status === 'submitted').map((submission) => {
                      const task = availableTasks.find(t => t.id === submission.taskId);
                      if (!task) return null;

                      return (
                        <div key={submission.id} className="bg-white/5 border border-yellow-400/30 rounded-xl p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-lg font-semibold text-white">{task.title}</h3>
                                <span className={`px-2 py-1 rounded-lg text-xs font-medium ${getStatusColor(submission.status)}`}>
                                  <FiClock className="w-3 h-3 inline mr-1" />
                                  Pending Review
                                </span>
                              </div>
                              <p className="text-gray-400 mb-2 line-clamp-2">{task.description}</p>
                              <p className="text-yellow-400 text-sm mb-4">
                                Submitted on {new Date(submission.submittedAt!).toLocaleDateString()}
                              </p>

                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => {
                                    setSelectedTask(task);
                                    setShowTaskModal(true);
                                  }}
                                  className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-medium rounded-lg transition-colors"
                                >
                                  <FiEye className="w-4 h-4" />
                                  View Details
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Completed Tasks */}
              {mySubmissions.filter(s => s.status === 'approved').length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Completed</h3>
                  <div className="grid gap-4">
                    {mySubmissions.filter(s => s.status === 'approved').map((submission) => {
                      const task = availableTasks.find(t => t.id === submission.taskId);
                      if (!task) return null;

                      return (
                        <div key={submission.id} className="bg-white/5 border border-green-400/30 rounded-xl p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-lg font-semibold text-white">{task.title}</h3>
                                <span className={`px-2 py-1 rounded-lg text-xs font-medium ${getStatusColor(submission.status)}`}>
                                  <FiCheckCircle className="w-3 h-3 inline mr-1" />
                                  Approved
                                </span>
                              </div>
                              <p className="text-gray-400 mb-2 line-clamp-2">{task.description}</p>
                              <p className="text-green-400 text-sm mb-4">
                                Completed on {new Date(submission.reviewedAt!).toLocaleDateString()}
                              </p>

                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => {
                                    setSelectedTask(task);
                                    setShowTaskModal(true);
                                  }}
                                  className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-medium rounded-lg transition-colors"
                                >
                                  <FiEye className="w-4 h-4" />
                                  View Details
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Rejected Tasks */}
              {mySubmissions.filter(s => s.status === 'rejected').length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Rejected</h3>
                  <div className="grid gap-4">
                    {mySubmissions.filter(s => s.status === 'rejected').map((submission) => {
                      const task = availableTasks.find(t => t.id === submission.taskId);
                      if (!task) return null;

                      return (
                        <div key={submission.id} className="bg-white/5 border border-red-400/30 rounded-xl p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-lg font-semibold text-white">{task.title}</h3>
                                <span className={`px-2 py-1 rounded-lg text-xs font-medium ${getStatusColor(submission.status)}`}>
                                  <FiXCircle className="w-3 h-3 inline mr-1" />
                                  Rejected
                                </span>
                              </div>
                              <p className="text-gray-400 mb-2 line-clamp-2">{task.description}</p>
                              {submission.rejectionReason && (
                                <p className="text-red-400 text-sm mb-2 whitespace-pre-line">
                                  Reason: {submission.rejectionReason}
                                </p>
                              )}
                              <p className="text-red-400 text-sm mb-4">
                                Rejected on {new Date(submission.reviewedAt!).toLocaleDateString()}
                              </p>

                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => {
                                    setSelectedTask(task);
                                    setShowTaskModal(true);
                                  }}
                                  className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-medium rounded-lg transition-colors"
                                >
                                  <FiEye className="w-4 h-4" />
                                  View Details
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedTask(task);
                                    setSelectedSubmission(submission);
                                    setSubmissionData({
                                      completedDeliverables: submission.completedDeliverables || [],
                                      submissionNotes: submission.submissionNotes || '',
                                      attachments: [] // Reset attachments for resubmission, user can re-upload
                                    });
                                    setShowSubmissionModal(true);
                                  }}
                                  className="flex items-center gap-2 px-3 py-2 bg-blue-400 hover:bg-blue-500 text-white font-medium rounded-lg transition-colors"
                                >
                                  <FiRefreshCw className="w-4 h-4" />
                                  Resubmit
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Task Details Modal */}
      <Modal
        open={showTaskModal}
        onClose={() => setShowTaskModal(false)}
        title={selectedTask?.title}
        maxWidthClassName="max-w-lg"
        footer={
          <button
            onClick={() => setShowTaskModal(false)}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors"
          >
            Close
          </button>
        }
      >
        {selectedTask && (
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">Description</p>
              <p className="text-white whitespace-pre-line">{selectedTask.description}</p>
            </div>

            {/* Content Section Carousel */}
            {selectedTask.contentSection && selectedTask.contentSection.cards.length > 0 && (
              <TaskContentSectionViewer contentSection={selectedTask.contentSection} />
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">Category</p>
                <p className="text-white capitalize">{selectedTask.category.replace('_', ' ')}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Difficulty</p>
                <span className={`inline-block px-2 py-1 rounded-lg text-xs font-medium ${getDifficultyColor(selectedTask.difficulty)}`}>
                  {selectedTask.difficulty}
                </span>
              </div>
            </div>

            
            <div>
              <p className="text-sm text-gray-500 mb-2">Requirements</p>
              <p className="text-white leading-relaxed whitespace-pre-line">
                {selectedTask.requirements.join('\n')}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500 mb-2">What you need to deliver:</p>
              <ul className="space-y-1">
                {selectedTask.deliverables.map((del, index) => (
                  <li key={index} className="flex items-start gap-2 text-white">
                    <span className="text-[#B8FF00] leading-tight">•</span>
                    <span className="flex-1">{del}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </Modal>

      {/* Submit Task Modal */}
      <Modal
        open={showSubmissionModal}
        onClose={() => setShowSubmissionModal(false)}
        title="Submit Task"
        maxWidthClassName="max-w-2xl"
        footer={
          <div className="flex gap-3">
            <button
              onClick={() => setShowSubmissionModal(false)}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmitTask}
              disabled={loading || submissionData.completedDeliverables.length === 0}
              className="px-4 py-2 bg-[#B8FF00] hover:bg-[#B8FF00]/80 text-gray-900 font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Submitting...' : 'Submit Task'}
            </button>
          </div>
        }
      >
        {selectedTask && (
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500 mb-3">Mark the deliverables you have completed:</p>
              
              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-400">Work Progress</p>
                  <p className="text-sm font-semibold text-white">
                    {Math.round((submissionData.completedDeliverables.length / selectedTask.deliverables.length) * 100)}%
                  </p>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#B8FF00] to-[#B8FF00]/60 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${(submissionData.completedDeliverables.length / selectedTask.deliverables.length) * 100}%` 
                    }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                {selectedTask.deliverables.map((deliverable, index) => (
                  <Checkbox
                    key={index}
                    checked={submissionData.completedDeliverables.includes(deliverable)}
                    onChange={(checked) => {
                      if (checked) {
                        setSubmissionData(prev => ({
                          ...prev,
                          completedDeliverables: [...prev.completedDeliverables, deliverable]
                        }));
                      } else {
                        setSubmissionData(prev => ({
                          ...prev,
                          completedDeliverables: prev.completedDeliverables.filter(d => d !== deliverable)
                        }));
                      }
                    }}
                    className="group flex items-start gap-3 cursor-pointer"
                  >
                    <div className="relative mt-1">
                      <div className="w-4 h-4 bg-white/10 border border-white/20 rounded group-data-[checked]:bg-[#B8FF00] group-data-[checked]:border-[#B8FF00] transition-colors" />
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <svg className="w-3 h-3 text-gray-900 opacity-0 group-data-[checked]:opacity-100 transition-opacity" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                    <span className="text-white select-none">{deliverable}</span>
                  </Checkbox>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Your reel/post url and any notes if any
              </label>
              <textarea
                value={submissionData.submissionNotes}
                onChange={(e) => setSubmissionData(prev => ({ ...prev, submissionNotes: e.target.value }))}
                rows={3}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#B8FF00] resize-none"
                placeholder="Paste the reel/post url and any notes you want to let us know."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Attachments (optional)
              </label>
              <div className="space-y-3">
                <div className="border-2 border-dashed border-white/20 rounded-xl p-4">
                  <input
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="flex flex-col items-center cursor-pointer"
                  >
                    <FiUpload className="w-8 h-8 text-gray-400 mb-2" />
                    <span className="text-gray-400 text-sm">Click to upload files</span>
                    <span className="text-gray-500 text-xs mt-1">PNG, JPG, PDF up to 10MB</span>
                  </label>
                </div>

                {submissionData.attachments.length > 0 && (
                  <div className="space-y-2">
                    {submissionData.attachments.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2">
                        <span className="text-white text-sm truncate">{file.name}</span>
                        <button
                          onClick={() => removeAttachment(index)}
                          className="p-1 text-red-400 hover:bg-red-400/10 rounded transition-colors"
                        >
                          <FiXCircle className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {submissionData.completedDeliverables.length === 0 && (
              <div className="p-3 bg-yellow-400/10 border border-yellow-400/30 rounded-lg">
                <p className="text-yellow-400 text-sm">
                  Please mark at least one deliverable as completed before submitting.
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
