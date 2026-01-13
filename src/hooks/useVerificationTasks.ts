import { useState, useEffect } from 'react';
import { collection, doc, getDoc, getDocs, query, where, orderBy, addDoc, updateDoc, deleteDoc, runTransaction } from 'firebase/firestore';
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
    } finally {
      setLoading(false);
    }
  };

  const approveSubmission = async (submissionId: string, adminId: string) => {
    setLoading(true);
    setError(null);
    try {
      const reviewedAt = Date.now();
      let influencerIdToVerify: string | undefined;

      await runTransaction(db, async (tx) => {
        const submissionRef = doc(db, 'taskSubmissions', submissionId);
        const submissionDoc = await tx.get(submissionRef);

        if (!submissionDoc.exists()) {
          throw new Error('Submission not found');
        }

        const submissionData = submissionDoc.data() as any;
        influencerIdToVerify = submissionData?.influencerId;

        const taskRef = submissionData?.taskId ? doc(db, 'verificationTasks', submissionData.taskId) : null;
        const taskDoc = taskRef ? await tx.get(taskRef) : null;

        // Prevent double-counting if this is already approved
        if (submissionData?.status === 'approved') {
          return;
        }

        // Update submission status
        tx.update(submissionRef, {
          status: 'approved',
          reviewedAt,
          reviewedBy: adminId,
        });

        // Increment task completion count on approval (completion)
        if (taskRef && taskDoc && taskDoc.exists()) {
          const taskData = taskDoc.data() as any;
          const currentCompletions = taskData?.currentCompletions || 0;

          tx.update(taskRef, {
            currentCompletions: currentCompletions + 1,
          });
        }
      });

      // Update influencer verification status if this is their first approved task
      if (influencerIdToVerify) {
        const userRef = doc(db, 'users', influencerIdToVerify);
        const userDoc = await getDoc(userRef);
        const userData = userDoc.data();

        // Only update if not already verified
        if (userData && !userData.verificationBadges?.influencerVerified) {
          await updateDoc(userRef, {
            'verificationBadges.influencerVerified': true,
            'verificationBadges.influencerVerifiedAt': Date.now(),
            'verificationBadges.influencerVerifiedBy': adminId,
          });
        }
      }

      await fetchSubmissions(); // Refresh the list
      return { success: true };
    } catch (err) {
      setError('Failed to approve submission');
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

      setAvailableTasks(availableTasks);
    } catch (err) {
      setError('Failed to fetch available tasks');
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
            return null;
          }
        })
      );

      // Filter out null values
      const validSubmissions = filteredSubmissions.filter(sub => sub !== null) as TaskSubmission[];
      setMySubmissions(validSubmissions);
    } catch (err) {
      setError('Failed to fetch your submissions');
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

      await fetchMySubmissions();
      await fetchAvailableTasks();
      
      return { success: true, submissionId: docRef.id };
    } catch (err) {
      setError('Failed to start task');
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
