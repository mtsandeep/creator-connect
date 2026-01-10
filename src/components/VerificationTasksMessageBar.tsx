import { useState, useEffect } from 'react';
import { FiInfo, FiX, FiAward, FiClock } from 'react-icons/fi';
import { useInfluencerTasks } from '../hooks/useVerificationTasks';
import { useAuthStore } from '../stores';
import { useNavigate } from 'react-router-dom';

export default function VerificationTasksMessageBar() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { mySubmissions, availableTasks } = useInfluencerTasks(user?.uid || '');
  const [isVisible, setIsVisible] = useState(false);
  const [dismissedTasks, setDismissedTasks] = useState<Set<string>>(new Set());

  useEffect(() => {
    const dismissed = localStorage.getItem('dismissed-verification-tasks');
    if (dismissed) {
      setDismissedTasks(new Set(JSON.parse(dismissed)));
    }
  }, []);

  // Check if we should show the message bar
  useEffect(() => {
    const hasPendingSubmissions = mySubmissions.some(s => s.status === 'submitted');
    const hasInProgressTasks = mySubmissions.some(s => s.status === 'in_progress');
    const hasAvailableTasks = availableTasks.length > 0;
    const isVerified = user?.verificationBadges?.influencerVerified;

    // Don't show if already verified
    if (isVerified) {
      setIsVisible(false);
      return;
    }

    // Show if there are pending submissions, available tasks, or in-progress tasks
    if ((hasPendingSubmissions || hasAvailableTasks || hasInProgressTasks) && !dismissedTasks.has('main')) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [mySubmissions, availableTasks, user?.verificationBadges?.influencerVerified, dismissedTasks]);

  const dismissMessage = (taskId?: string) => {
    if (taskId) {
      const newDismissed = new Set(dismissedTasks).add(taskId);
      setDismissedTasks(newDismissed);
      localStorage.setItem('dismissed-verification-tasks', JSON.stringify(Array.from(newDismissed)));
    } else {
      const newDismissed = new Set(dismissedTasks).add('main');
      setDismissedTasks(newDismissed);
      localStorage.setItem('dismissed-verification-tasks', JSON.stringify(Array.from(newDismissed)));
    }
  };

  const getPendingSubmission = () => {
    return mySubmissions.find(s => s.status === 'submitted');
  };

  const getInProgressTask = () => {
    return mySubmissions.find(s => s.status === 'in_progress');
  };

  if (!isVisible) return null;

  const pendingSubmission = getPendingSubmission();
  const inProgressTask = getInProgressTask();

  return (
    <div className="bg-gradient-to-r from-[#B8FF00]/10 to-[#00D9FF]/10 border border-[#B8FF00]/30 rounded-xl p-4 mb-6">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {pendingSubmission ? (
            <FiClock className="w-5 h-5 text-yellow-400" />
          ) : inProgressTask ? (
            <FiInfo className="w-5 h-5 text-[#B8FF00]" />
          ) : (
            <FiAward className="w-5 h-5 text-[#B8FF00]" />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          {pendingSubmission ? (
            <div>
              <p className="text-yellow-400 font-medium mb-1">Submission Under Review</p>
              <p className="text-gray-300 text-sm mb-2">
                Your verification task submission is being reviewed. Once approved, you'll earn your verified badge!
              </p>
              <button
                onClick={() => navigate('/influencer/verification-tasks')}
                className="text-[#B8FF00] hover:text-[#B8FF00]/80 text-sm font-medium"
              >
                View Status →
              </button>
            </div>
          ) : inProgressTask ? (
            <div>
              <p className="text-[#B8FF00] font-medium mb-1">Complete Your Verification Task</p>
              <p className="text-gray-300 text-sm mb-2">
                You have a verification task in progress. Complete it to earn your verified badge and unlock more opportunities.
              </p>
              <button
                onClick={() => navigate('/influencer/verification-tasks')}
                className="text-[#B8FF00] hover:text-[#B8FF00]/80 text-sm font-medium"
              >
                Continue Task →
              </button>
            </div>
          ) : (
            <div>
              <p className="text-[#B8FF00] font-medium mb-1">Earn Your Verified Badge</p>
              <p className="text-gray-300 text-sm mb-2">
                {availableTasks.length} verification task{availableTasks.length > 1 ? 's' : ''} available. Complete tasks to get verified and build trust with brands.
              </p>
              <button
                onClick={() => navigate('/influencer/verification-tasks')}
                className="text-[#B8FF00] hover:text-[#B8FF00]/80 text-sm font-medium"
              >
                View Tasks →
              </button>
            </div>
          )}
        </div>

        <button
          onClick={() => dismissMessage()}
          className="flex-shrink-0 p-1 text-gray-400 hover:text-white rounded-lg transition-colors"
        >
          <FiX className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
