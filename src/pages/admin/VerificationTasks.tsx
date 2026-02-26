import { useState } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiMoreVertical, FiChevronDown, FiUsers, FiEye, FiEyeOff } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { useVerificationTasks } from '../../hooks/useVerificationTasks';
import type { VerificationTask, CreateVerificationTaskData, TaskContentSection } from '../../types';
import Modal from '../../components/common/Modal';
import TaskContentSectionEditor from '../../components/tasks/TaskContentSectionEditor';

interface VerificationTaskFormData extends Omit<CreateVerificationTaskData, 'requirements'> {
  requirements: string;
}

export default function VerificationTasks() {
  const navigate = useNavigate();
  const { tasks, loading: tasksLoading, createTask, updateTask, deleteTask, hideTask, unhideTask } = useVerificationTasks();
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<VerificationTask | null>(null);
  
  const [formData, setFormData] = useState<VerificationTaskFormData & { contentSection?: TaskContentSection }>({
    title: '',
    description: '',
    requirements: '',
    deliverables: [],
    category: 'social_proof',
    difficulty: 'easy',
    maxCompletions: undefined,
    contentSection: undefined
  });

  const [deliverableInput, setDeliverableInput] = useState('');

  const handleAddDeliverable = () => {
    setFormData({ ...formData, deliverables: [...formData.deliverables, deliverableInput] });
    setDeliverableInput('');
  };

  const handleRemoveDeliverable = (index: number) => {
    setFormData({ ...formData, deliverables: formData.deliverables.filter((_, i) => i !== index) });
  };

  const handleCreateTask = async () => {
    const processedData: CreateVerificationTaskData = {
      ...formData,
      requirements: formData.requirements.split('\n').filter(req => req.trim()),
      contentSection: formData.contentSection
    };
    const result = await createTask(processedData);
    if (result.success) {
      setShowCreateModal(false);
      resetForm();
    }
  };

  const handleUpdateTask = async () => {
    if (!selectedTask) return;

    const processedData: CreateVerificationTaskData = {
      ...formData,
      requirements: formData.requirements.split('\n').filter(req => req.trim()),
      contentSection: formData.contentSection
    };
    const result = await updateTask(selectedTask.id, processedData);
    if (result.success) {
      setShowEditModal(false);
      setSelectedTask(null);
      resetForm();
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
      await deleteTask(taskId);
    }
  };

  const handleHideTask = async (taskId: string) => {
    if (confirm('Are you sure you want to hide this task? It will be hidden from all influencers.')) {
      await hideTask(taskId);
    }
  };

  const handleUnhideTask = async (taskId: string) => {
    await unhideTask(taskId);
  };

  const openEditModal = (task: VerificationTask) => {
    setSelectedTask(task);
    setFormData({
      title: task.title,
      description: task.description,
      requirements: task.requirements.join('\n'),
      deliverables: task.deliverables,
      category: task.category,
      difficulty: task.difficulty,
      maxCompletions: task.maxCompletions,
      contentSection: task.contentSection
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      requirements: '',
      deliverables: [],
      category: 'social_proof',
      difficulty: 'easy',
      maxCompletions: undefined,
      contentSection: undefined
    });
    setDeliverableInput('');
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-400 bg-green-400/10';
      case 'medium': return 'text-yellow-400 bg-yellow-400/10';
      case 'hard': return 'text-red-400 bg-red-400/10';
      default: return 'text-gray-400 bg-gray-400/10';
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Verification Tasks</h1>
          <p className="text-gray-400">Manage verification tasks for influencers</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#B8FF00] hover:bg-[#B8FF00]/80 text-gray-900 font-semibold rounded-xl transition-colors"
        >
          <FiPlus className="w-4 h-4" />
          Create Task
        </button>
      </div>

      {/* Tasks List */}
      <div className="grid gap-4">
        {tasksLoading ? (
          <div className="text-center py-8 text-gray-400">Loading tasks...</div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p>No verification tasks created yet</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-2 text-[#B8FF00] hover:text-[#B8FF00]/80"
            >
              Create your first task
            </button>
          </div>
        ) : (
          tasks.map((task) => (
            <div key={task.id} className="bg-white/5 border border-white/10 rounded-xl p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-white">{task.title || 'Untitled Task'}</h3>
                    {task.isHidden && (
                      <span className="px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1 bg-orange-400/20 text-orange-400 border border-orange-400/30">
                        <FiEyeOff className="w-3 h-3" />
                        Hidden
                      </span>
                    )}
                    <span className={`px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1 ${getDifficultyColor(task.difficulty)}`}>
                      {task.difficulty}
                    </span>
                    <span className={`px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1 ${task.isActive ? 'text-green-400 bg-green-400/10' : 'text-gray-400 bg-gray-400/10'}`}>
                      {task.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-gray-400 mb-4 line-clamp-2">{task.description || 'No description provided'}</p>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Category</p>
                      <p className="text-white capitalize">{task.category.replace('_', ' ')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Max Completions</p>
                      <p className="text-white">{task.maxCompletions || 'Unlimited'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-2">
                      <FiUsers className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-400">
                        {task.currentCompletions || 0} completed
                        {task.maxCompletions && ` / ${task.maxCompletions}`}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => navigate(`/admin/verification-tasks/${task.id}`)}
                    className="flex items-center gap-2 px-3 py-2 bg-[#B8FF00] hover:bg-[#B8FF00]/80 text-gray-900 font-medium rounded-lg transition-colors"
                  >
                    <FiEye className="w-4 h-4" />
                    View Details
                  </button>
                  <Menu>
                    <MenuButton className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                      <FiMoreVertical className="w-4 h-4" />
                    </MenuButton>
                    <MenuItems className="absolute right-0 z-10 mt-1 w-48 bg-[#0a0a0a] border border-white/10 rounded-xl shadow-lg focus:outline-none">
                      <MenuItem>
                        {({ active }) => (
                          <button
                            onClick={() => openEditModal(task)}
                            className={`${
                              active ? 'bg-white/10' : ''
                            } group flex w-full items-center gap-2 px-4 py-2 text-sm text-white`}
                          >
                            <FiEdit2 className="w-4 h-4" />
                            Edit Task
                          </button>
                        )}
                      </MenuItem>
                      <MenuItem>
                        {({ active }) => (
                          <button
                            onClick={() => task.isHidden ? handleUnhideTask(task.id) : handleHideTask(task.id)}
                            className={`${
                              active ? 'bg-white/10' : ''
                            } group flex w-full items-center gap-2 px-4 py-2 text-sm text-white`}
                          >
                            {task.isHidden ? <FiEye className="w-4 h-4" /> : <FiEyeOff className="w-4 h-4" />}
                            {task.isHidden ? 'Unhide Task' : 'Hide Task'}
                          </button>
                        )}
                      </MenuItem>
                      <MenuItem>
                        {({ active }) => (
                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            className={`${
                              active ? 'bg-red-400/10' : ''
                            } group flex w-full items-center gap-2 px-4 py-2 text-sm text-red-400`}
                          >
                            <FiTrash2 className="w-4 h-4" />
                            Delete Task
                          </button>
                        )}
                      </MenuItem>
                    </MenuItems>
                  </Menu>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Task Modal */}
      <Modal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Verification Task"
        maxWidthClassName="max-w-2xl"
        footer={
          <div className="flex gap-3">
            <button
              onClick={() => setShowCreateModal(false)}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateTask}
              disabled={tasksLoading}
              className="px-4 py-2 bg-[#B8FF00] hover:bg-[#B8FF00]/80 text-gray-900 font-semibold rounded-xl transition-colors disabled:opacity-50"
            >
              {tasksLoading ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#B8FF00]"
              placeholder="Enter task title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#B8FF00] resize-none"
              placeholder="Describe what influencers need to do"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
              <Menu>
                <MenuButton className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#B8FF00] flex items-center justify-between">
                  {formData.category.replace('_', ' ')}
                  <FiChevronDown className="w-4 h-4 text-gray-400" />
                </MenuButton>
                <MenuItems className="absolute z-10 mt-1 w-full max-w-xs bg-[#0a0a0a] border border-white/10 rounded-xl shadow-lg focus:outline-none">
                  <MenuItem>
                    {({ active }) => (
                      <button
                        onClick={() => setFormData(prev => ({ ...prev, category: 'social_proof' }))}
                        className={`${
                          active ? 'bg-white/10' : ''
                        } group flex w-full items-center px-4 py-2 text-sm text-white capitalize`}
                      >
                        Social Proof
                      </button>
                    )}
                  </MenuItem>
                  <MenuItem>
                    {({ active }) => (
                      <button
                        onClick={() => setFormData(prev => ({ ...prev, category: 'content_quality' }))}
                        className={`${
                          active ? 'bg-white/10' : ''
                        } group flex w-full items-center px-4 py-2 text-sm text-white capitalize`}
                      >
                        Content Quality
                      </button>
                    )}
                  </MenuItem>
                  <MenuItem>
                    {({ active }) => (
                      <button
                        onClick={() => setFormData(prev => ({ ...prev, category: 'engagement_authenticity' }))}
                        className={`${
                          active ? 'bg-white/10' : ''
                        } group flex w-full items-center px-4 py-2 text-sm text-white capitalize`}
                      >
                        Engagement Authenticity
                      </button>
                    )}
                  </MenuItem>
                  <MenuItem>
                    {({ active }) => (
                      <button
                        onClick={() => setFormData(prev => ({ ...prev, category: 'profile_completion' }))}
                        className={`${
                          active ? 'bg-white/10' : ''
                        } group flex w-full items-center px-4 py-2 text-sm text-white capitalize`}
                      >
                        Profile Completion
                      </button>
                    )}
                  </MenuItem>
                </MenuItems>
              </Menu>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Difficulty</label>
              <Menu>
                <MenuButton className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#B8FF00] flex items-center justify-between">
                  <span className="capitalize">{formData.difficulty}</span>
                  <FiChevronDown className="w-4 h-4 text-gray-400" />
                </MenuButton>
                <MenuItems className="absolute z-10 mt-1 w-full max-w-xs bg-[#0a0a0a] border border-white/10 rounded-xl shadow-lg focus:outline-none">
                  <MenuItem>
                    {({ active }) => (
                      <button
                        onClick={() => setFormData(prev => ({ ...prev, difficulty: 'easy' }))}
                        className={`${
                          active ? 'bg-white/10' : ''
                        } group flex w-full items-center px-4 py-2 text-sm text-white capitalize`}
                      >
                        Easy
                      </button>
                    )}
                  </MenuItem>
                  <MenuItem>
                    {({ active }) => (
                      <button
                        onClick={() => setFormData(prev => ({ ...prev, difficulty: 'medium' }))}
                        className={`${
                          active ? 'bg-white/10' : ''
                        } group flex w-full items-center px-4 py-2 text-sm text-white capitalize`}
                      >
                        Medium
                      </button>
                    )}
                  </MenuItem>
                  <MenuItem>
                    {({ active }) => (
                      <button
                        onClick={() => setFormData(prev => ({ ...prev, difficulty: 'hard' }))}
                        className={`${
                          active ? 'bg-white/10' : ''
                        } group flex w-full items-center px-4 py-2 text-sm text-white capitalize`}
                      >
                        Hard
                      </button>
                    )}
                  </MenuItem>
                </MenuItems>
              </Menu>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Max Completions (optional)</label>
            <input
              type="number"
              min="1"
              value={formData.maxCompletions || ''}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                maxCompletions: e.target.value ? parseInt(e.target.value) : undefined
              }))}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#B8FF00]"
              placeholder="Leave empty for unlimited completions"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Requirements</label>
            <textarea
              value={formData.requirements}
              onChange={(e) => setFormData(prev => ({ ...prev, requirements: e.target.value }))}
              rows={4}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#B8FF00] resize-none"
              placeholder="Enter requirements (one per line)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Deliverables</label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={deliverableInput}
                onChange={(e) => setDeliverableInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddDeliverable())}
                placeholder="e.g., 1 Instagram Post, 2 Stories"
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#B8FF00]"
              />
              <button
                type="button"
                onClick={handleAddDeliverable}
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
                      onClick={() => handleRemoveDeliverable(index)}
                      className="hover:text-red-400 transition-colors"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Content Section */}
          <TaskContentSectionEditor
            value={formData.contentSection}
            onChange={(section) => setFormData(prev => ({ ...prev, contentSection: section }))}
          />
        </div>
      </Modal>

      {/* Edit Task Modal */}
      <Modal
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Verification Task"
        maxWidthClassName="max-w-2xl"
        footer={
          <div className="flex gap-3">
            <button
              onClick={() => setShowEditModal(false)}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleUpdateTask}
              disabled={tasksLoading}
              className="px-4 py-2 bg-[#B8FF00] hover:bg-[#B8FF00]/80 text-gray-900 font-semibold rounded-xl transition-colors disabled:opacity-50"
            >
              {tasksLoading ? 'Updating...' : 'Update Task'}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#B8FF00]"
              placeholder="Enter task title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#B8FF00] resize-none"
              placeholder="Describe what influencers need to do"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
              <Menu>
                <MenuButton className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#B8FF00] flex items-center justify-between">
                  {formData.category.replace('_', ' ')}
                  <FiChevronDown className="w-4 h-4 text-gray-400" />
                </MenuButton>
                <MenuItems className="absolute z-10 mt-1 w-full max-w-xs bg-[#0a0a0a] border border-white/10 rounded-xl shadow-lg focus:outline-none">
                  <MenuItem>
                    {({ active }) => (
                      <button
                        onClick={() => setFormData(prev => ({ ...prev, category: 'social_proof' }))}
                        className={`${
                          active ? 'bg-white/10' : ''
                        } group flex w-full items-center px-4 py-2 text-sm text-white capitalize`}
                      >
                        Social Proof
                      </button>
                    )}
                  </MenuItem>
                  <MenuItem>
                    {({ active }) => (
                      <button
                        onClick={() => setFormData(prev => ({ ...prev, category: 'content_quality' }))}
                        className={`${
                          active ? 'bg-white/10' : ''
                        } group flex w-full items-center px-4 py-2 text-sm text-white capitalize`}
                      >
                        Content Quality
                      </button>
                    )}
                  </MenuItem>
                  <MenuItem>
                    {({ active }) => (
                      <button
                        onClick={() => setFormData(prev => ({ ...prev, category: 'engagement_authenticity' }))}
                        className={`${
                          active ? 'bg-white/10' : ''
                        } group flex w-full items-center px-4 py-2 text-sm text-white capitalize`}
                      >
                        Engagement Authenticity
                      </button>
                    )}
                  </MenuItem>
                  <MenuItem>
                    {({ active }) => (
                      <button
                        onClick={() => setFormData(prev => ({ ...prev, category: 'profile_completion' }))}
                        className={`${
                          active ? 'bg-white/10' : ''
                        } group flex w-full items-center px-4 py-2 text-sm text-white capitalize`}
                      >
                        Profile Completion
                      </button>
                    )}
                  </MenuItem>
                </MenuItems>
              </Menu>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Difficulty</label>
              <Menu>
                <MenuButton className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#B8FF00] flex items-center justify-between">
                  <span className="capitalize">{formData.difficulty}</span>
                  <FiChevronDown className="w-4 h-4 text-gray-400" />
                </MenuButton>
                <MenuItems className="absolute z-10 mt-1 w-full max-w-xs bg-[#0a0a0a] border border-white/10 rounded-xl shadow-lg focus:outline-none">
                  <MenuItem>
                    {({ active }) => (
                      <button
                        onClick={() => setFormData(prev => ({ ...prev, difficulty: 'easy' }))}
                        className={`${
                          active ? 'bg-white/10' : ''
                        } group flex w-full items-center px-4 py-2 text-sm text-white capitalize`}
                      >
                        Easy
                      </button>
                    )}
                  </MenuItem>
                  <MenuItem>
                    {({ active }) => (
                      <button
                        onClick={() => setFormData(prev => ({ ...prev, difficulty: 'medium' }))}
                        className={`${
                          active ? 'bg-white/10' : ''
                        } group flex w-full items-center px-4 py-2 text-sm text-white capitalize`}
                      >
                        Medium
                      </button>
                    )}
                  </MenuItem>
                  <MenuItem>
                    {({ active }) => (
                      <button
                        onClick={() => setFormData(prev => ({ ...prev, difficulty: 'hard' }))}
                        className={`${
                          active ? 'bg-white/10' : ''
                        } group flex w-full items-center px-4 py-2 text-sm text-white capitalize`}
                      >
                        Hard
                      </button>
                    )}
                  </MenuItem>
                </MenuItems>
              </Menu>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Max Completions (optional)</label>
            <input
              type="number"
              min="1"
              value={formData.maxCompletions || ''}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                maxCompletions: e.target.value ? parseInt(e.target.value) : undefined
              }))}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#B8FF00]"
              placeholder="Leave empty for unlimited completions"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Requirements</label>
            <textarea
              value={formData.requirements}
              onChange={(e) => setFormData(prev => ({ ...prev, requirements: e.target.value }))}
              rows={4}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#B8FF00] resize-none"
              placeholder="Enter requirements (one per line)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Deliverables</label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={deliverableInput}
                onChange={(e) => setDeliverableInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddDeliverable())}
                placeholder="e.g., 1 Instagram Post, 2 Stories"
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#B8FF00]"
              />
              <button
                type="button"
                onClick={handleAddDeliverable}
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
                      onClick={() => handleRemoveDeliverable(index)}
                      className="hover:text-red-400 transition-colors"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Content Section */}
          <TaskContentSectionEditor
            value={formData.contentSection}
            onChange={(section) => setFormData(prev => ({ ...prev, contentSection: section }))}
          />
        </div>
      </Modal>
    </div>
  );
}
