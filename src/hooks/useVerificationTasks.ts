import { useState, useEffect } from 'react';
import { collection, doc, getDoc, getDocs, query, where, orderBy, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import type { VerificationTask, CreateVerificationTaskData, UpdateVerificationTaskData, TaskSubmission, TaskSubmissionWithDetails, TaskSubmissionStatus } from '../types';

interface SubmitTaskData {
  completedDeliverables: string[];
  submissionNotes?: string;
  attachments: File[];
}

interface TaskAttachment {
  id: string;
  name: string;
  url: string;
  type: string;
  uploadedAt: number;
}

export function useVerificationTasks() {
  const [tasks, setTasks] = useState<VerificationTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = async () => {
    setLoading(true);
    setError(null);
    try {
      const tasksQuery = query(
        collection(db, 'verificationTasks'),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(tasksQuery);
      const tasksData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as VerificationTask[];
      setTasks(tasksData);
    } catch (err) {
      setError('Failed to fetch verification tasks');
      console.error('Error fetching tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const createTask = async (data: CreateVerificationTaskData) => {
    setLoading(true);
    setError(null);
    try {
      const taskData = {
        ...data,
        isActive: true,
        isHidden: false, // default to not hidden
        createdAt: Date.now(),
        currentCompletions: 0
      };
      
      // Remove undefined fields to prevent Firestore errors
      if (taskData.maxCompletions === undefined) {
        delete taskData.maxCompletions;
      }
      
      const docRef = await addDoc(collection(db, 'verificationTasks'), taskData);
      await fetchTasks(); // Refresh the list
      return { success: true, taskId: docRef.id };
    } catch (err) {
      setError('Failed to create verification task');
      console.error('Error creating task:', err);
      return { success: false, error: 'Failed to create task' };
    } finally {
      setLoading(false);
    }
  };

  const updateTask = async (taskId: string, data: UpdateVerificationTaskData) => {
    setLoading(true);
    setError(null);
    try {
      const taskRef = doc(db, 'verificationTasks', taskId);
      
      // Remove undefined fields to prevent Firestore errors
      const updateData = { ...data };
      if (updateData.maxCompletions === undefined) {
        delete updateData.maxCompletions;
      }
      
      await updateDoc(taskRef, updateData as any);
      await fetchTasks(); // Refresh the list
      return { success: true };
    } catch (err) {
      setError('Failed to update verification task');
      console.error('Error updating task:', err);
      return { success: false, error: 'Failed to update task' };
    } finally {
      setLoading(false);
    }
  };

  const deleteTask = async (taskId: string) => {
    setLoading(true);
    setError(null);
    try {
      await deleteDoc(doc(db, 'verificationTasks', taskId));
      await fetchTasks(); // Refresh the list
      return { success: true };
    } catch (err) {
      setError('Failed to delete verification task');
      console.error('Error deleting task:', err);
      return { success: false, error: 'Failed to delete task' };
    } finally {
      setLoading(false);
    }
  };

  const hideTask = async (taskId: string) => {
    setLoading(true);
    setError(null);
    try {
      await updateDoc(doc(db, 'verificationTasks', taskId), { isHidden: true });
      await fetchTasks(); // Refresh the list
      return { success: true };
    } catch (err) {
      setError('Failed to hide verification task');
      console.error('Error hiding task:', err);
      return { success: false, error: 'Failed to hide task' };
    } finally {
      setLoading(false);
    }
  };

  const unhideTask = async (taskId: string) => {
    setLoading(true);
    setError(null);
    try {
      await updateDoc(doc(db, 'verificationTasks', taskId), { isHidden: false });
      await fetchTasks(); // Refresh the list
      return { success: true };
    } catch (err) {
      setError('Failed to unhide verification task');
      console.error('Error unhiding task:', err);
      return { success: false, error: 'Failed to unhide task' };
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  return {
    tasks,
    loading,
    error,
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    hideTask,
    unhideTask
  };
}

export function useTaskSubmissions() {
  const [submissions, setSubmissions] = useState<TaskSubmissionWithDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSubmissions = async (status?: TaskSubmissionStatus) => {
    setLoading(true);
    setError(null);
    try {
      let submissionsQuery = query(
        collection(db, 'taskSubmissions'),
        orderBy('startedAt', 'desc')
      );
      
      if (status) {
        submissionsQuery = query(
          collection(db, 'taskSubmissions'),
          where('status', '==', status),
          orderBy('startedAt', 'desc')
        );
      }
      
      const snapshot = await getDocs(submissionsQuery);
      const submissionsData = await Promise.all(
        snapshot.docs.map(async (docSnapshot) => {
          const submissionData = {
            id: docSnapshot.id,
            ...docSnapshot.data()
          } as TaskSubmission;

          // Fetch task details
          const taskDoc = await getDoc(doc(db, 'verificationTasks', submissionData.taskId));
          const taskData = taskDoc.exists() ? taskDoc.data() as VerificationTask : null;

          // Fetch influencer details
          const userDoc = await getDoc(doc(db, 'users', submissionData.influencerId));
          const userData = userDoc.exists() ? userDoc.data() as any : null;

          return {
            ...submissionData,
            taskTitle: taskData?.title || 'Unknown Task',
            taskDescription: taskData?.description || '',
            taskCategory: taskData?.category || 'general',
            taskDifficulty: taskData?.difficulty || 'medium',
            taskRequirements: taskData?.requirements || [],
            taskDeliverables: taskData?.deliverables || [],
            taskMaxCompletions: taskData?.maxCompletions,
            taskCurrentCompletions: taskData?.currentCompletions || 0,
            taskCreatedAt: taskData?.createdAt || Date.now(),
            influencerName: userData?.influencerProfile?.displayName || userData?.email?.split('@')[0] || 'Unknown',
            influencerEmail: userData?.email || ''
          } as TaskSubmissionWithDetails;
        })
      );
      
      setSubmissions(submissionsData);
    } catch (err) {
      setError('Failed to fetch task submissions');
      console.error('Error fetching submissions:', err);
    } finally {
      setLoading(false);
    }
  };

  const approveSubmission = async (submissionId: string, adminId: string) => {
    setLoading(true);
    setError(null);
    try {
      const submissionRef = doc(db, 'taskSubmissions', submissionId);
      const submissionDoc = await getDoc(submissionRef);
      const submissionData = submissionDoc.data();
      
      // Update submission status
      await updateDoc(submissionRef, {
        status: 'approved',
        reviewedAt: Date.now(),
        reviewedBy: adminId
      });

      // Update influencer verification status if this is their first approved task
      if (submissionData?.influencerId) {
        const userRef = doc(db, 'users', submissionData.influencerId);
        const userDoc = await getDoc(userRef);
        const userData = userDoc.data();
        
        // Only update if not already verified
        if (userData && !userData.verificationBadges?.influencerVerified) {
          await updateDoc(userRef, {
            'verificationBadges.influencerVerified': true,
            'verificationBadges.influencerVerifiedAt': Date.now(),
            'verificationBadges.influencerVerifiedBy': adminId,
          });
          console.log(`Influencer ${submissionData.influencerId} is now verified!`);
        }
      }

      await fetchSubmissions(); // Refresh the list
      return { success: true };
    } catch (err) {
      setError('Failed to approve submission');
      console.error('Error approving submission:', err);
      return { success: false, error: 'Failed to approve submission' };
    } finally {
      setLoading(false);
    }
  };

  const rejectSubmission = async (submissionId: string, adminId: string, reason: string) => {
    setLoading(true);
    setError(null);
    try {
      const submissionRef = doc(db, 'taskSubmissions', submissionId);
      await updateDoc(submissionRef, {
        status: 'rejected',
        reviewedAt: Date.now(),
        reviewedBy: adminId,
        rejectionReason: reason
      });
      await fetchSubmissions(); // Refresh the list
      return { success: true };
    } catch (err) {
      setError('Failed to reject submission');
      console.error('Error rejecting submission:', err);
      return { success: false, error: 'Failed to reject submission' };
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  return {
    submissions,
    loading,
    error,
    fetchSubmissions,
    approveSubmission,
    rejectSubmission
  };
}

export function useInfluencerTasks(influencerId: string) {
  const [availableTasks, setAvailableTasks] = useState<VerificationTask[]>([]);
  const [mySubmissions, setMySubmissions] = useState<TaskSubmission[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAvailableTasks = async () => {
    setLoading(true);
    setError(null);
    try {
      const tasksQuery = query(
        collection(db, 'verificationTasks'),
        where('isActive', '==', true),
        where('isHidden', '==', false),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(tasksQuery);
      const tasksData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as VerificationTask[];

      console.log('Fetched tasks:', tasksData); // Debug log

      // Filter out tasks already completed by this influencer
      const completedTaskIds = mySubmissions
        .filter(sub => sub.status === 'approved')
        .map(sub => sub.taskId);

      const availableTasks = tasksData.filter(task => {
        // Skip tasks already completed by this influencer
        if (completedTaskIds.includes(task.id)) {
          return false;
        }
        
        // Always include tasks, even if they're taken by others
        // The UI will show the progress/status
        return true;
      });

      console.log('Available tasks after filtering:', availableTasks); // Debug log

      setAvailableTasks(availableTasks);
    } catch (err) {
      setError('Failed to fetch available tasks');
      console.error('Error fetching available tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMySubmissions = async () => {
    setLoading(true);
    setError(null);
    try {
      const submissionsQuery = query(
        collection(db, 'taskSubmissions'),
        where('influencerId', '==', influencerId),
        orderBy('startedAt', 'desc')
      );
      const snapshot = await getDocs(submissionsQuery);
      const submissionsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as TaskSubmission[];

      // Filter out submissions for hidden tasks by checking the task status
      const filteredSubmissions = await Promise.all(
        submissionsData.map(async (submission) => {
          try {
            const taskDoc = await getDoc(doc(db, 'verificationTasks', submission.taskId));
            const taskData = taskDoc.data();
            // Only include submission if task exists and is not hidden
            if (taskData && !taskData.isHidden) {
              return submission;
            }
            return null;
          } catch (error) {
            // If task doesn't exist, filter out the submission
            console.warn(`Task ${submission.taskId} not found, filtering submission`);
            return null;
          }
        })
      );

      // Filter out null values
      const validSubmissions = filteredSubmissions.filter(sub => sub !== null) as TaskSubmission[];
      setMySubmissions(validSubmissions);
    } catch (err) {
      setError('Failed to fetch your submissions');
      console.error('Error fetching submissions:', err);
    } finally {
      setLoading(false);
    }
  };

  const startTask = async (taskId: string) => {
    setLoading(true);
    setError(null);
    try {
      // Check if already started
      const existingSubmission = mySubmissions.find(sub => sub.taskId === taskId);
      if (existingSubmission) {
        return { success: false, error: 'You have already started this task' };
      }

      const submissionData = {
        taskId,
        influencerId,
        status: 'in_progress',
        startedAt: Date.now(),
        completedDeliverables: [],
        attachments: []
      };

      const docRef = await addDoc(collection(db, 'taskSubmissions'), submissionData);
      
      // Update task completion count
      const taskRef = doc(db, 'verificationTasks', taskId);
      const taskDoc = await getDoc(taskRef);
      if (taskDoc.exists()) {
        const task = taskDoc.data() as VerificationTask;
        await updateDoc(taskRef, {
          currentCompletions: (task.currentCompletions || 0) + 1
        });
      }

      await fetchMySubmissions();
      await fetchAvailableTasks();
      
      return { success: true, submissionId: docRef.id };
    } catch (err) {
      setError('Failed to start task');
      console.error('Error starting task:', err);
      return { success: false, error: 'Failed to start task' };
    } finally {
      setLoading(false);
    }
  };

  const submitTask = async (submissionId: string, data: SubmitTaskData) => {
    setLoading(true);
    setError(null);
    try {
      // Upload attachments
      const attachments: TaskAttachment[] = [];
      for (const file of data.attachments) {
        const storageRef = ref(storage, `task-submissions/${submissionId}/${file.name}`);
        await uploadBytes(storageRef, file);
        const downloadUrl = await getDownloadURL(storageRef);
        
        attachments.push({
          id: `${Date.now()}-${Math.random()}`,
          name: file.name,
          url: downloadUrl,
          type: file.type,
          uploadedAt: Date.now()
        });
      }

      const submissionRef = doc(db, 'taskSubmissions', submissionId);
      await updateDoc(submissionRef, {
        status: 'submitted',
        submittedAt: Date.now(),
        completedDeliverables: data.completedDeliverables,
        submissionNotes: data.submissionNotes,
        attachments
      });

      await fetchMySubmissions();
      return { success: true };
    } catch (err) {
      setError('Failed to submit task');
      console.error('Error submitting task:', err);
      return { success: false, error: 'Failed to submit task' };
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (influencerId) {
      fetchMySubmissions();
    }
  }, [influencerId]);

  useEffect(() => {
    if (influencerId) {
      fetchAvailableTasks();
    }
  }, [influencerId]);

  return {
    availableTasks,
    mySubmissions,
    loading,
    error,
    fetchAvailableTasks,
    fetchMySubmissions,
    startTask,
    submitTask
  };
}
