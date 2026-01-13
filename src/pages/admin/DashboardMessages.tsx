import { useEffect, useMemo, useState } from 'react';
import { addDoc, collection, deleteDoc, doc, getDocs, orderBy, query, updateDoc } from 'firebase/firestore';
import { FiChevronDown, FiEdit2, FiPlus, FiTrash2 } from 'react-icons/fi';
import { Checkbox, Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { db } from '../../lib/firebase';
import Modal from '../../components/common/Modal';

type MessageIntent = 'info' | 'success' | 'warning' | 'promo';

type AudienceRole = 'influencer' | 'promoter';

interface DashboardMessageRecord {
  id: string;
  isActive: boolean;
  intent: MessageIntent;
  iconEmoji?: string;
  title: string;
  body: string;
  audienceRoles?: AudienceRole[];
  ctaLabel?: string;
  ctaPath?: string;
  dismissible?: boolean;
  startAt?: number;
  endAt?: number;
  createdAt?: number;
}

interface MessageFormData {
  isActive: boolean;
  intent: MessageIntent;
  iconEmoji: string;
  title: string;
  body: string;
  targetInfluencers: boolean;
  targetPromoters: boolean;
  ctaLabel: string;
  ctaPath: string;
  dismissible: boolean;
  startAt: string;
  endAt: string;
}

function timestampToInputValue(ts?: number): string {
  if (!ts) return '';
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function inputValueToTimestamp(value: string): number | undefined {
  if (!value) return undefined;
  const t = new Date(value).getTime();
  return Number.isFinite(t) ? t : undefined;
}

export default function AdminDashboardMessages() {
  const [messages, setMessages] = useState<DashboardMessageRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<DashboardMessageRecord | null>(null);

  const [formData, setFormData] = useState<MessageFormData>({
    isActive: true,
    intent: 'promo',
    iconEmoji: '🎉',
    title: '',
    body: '',
    targetInfluencers: true,
    targetPromoters: true,
    ctaLabel: '',
    ctaPath: '',
    dismissible: true,
    startAt: '',
    endAt: '',
  });

  const formAudienceRoles = useMemo(() => {
    const roles: AudienceRole[] = [];
    if (formData.targetInfluencers) roles.push('influencer');
    if (formData.targetPromoters) roles.push('promoter');
    return roles;
  }, [formData.targetInfluencers, formData.targetPromoters]);

  const loadMessages = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'dashboardMessages'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as DashboardMessageRecord[];
      setMessages(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setFormData({
      isActive: true,
      intent: 'promo',
      iconEmoji: '🎉',
      title: '',
      body: '',
      targetInfluencers: true,
      targetPromoters: true,
      ctaLabel: '',
      ctaPath: '',
      dismissible: true,
      startAt: '',
      endAt: '',
    });
    setShowModal(true);
  };

  const openEdit = (m: DashboardMessageRecord) => {
    setEditing(m);
    const roles = m.audienceRoles || [];
    setFormData({
      isActive: m.isActive !== false,
      intent: (m.intent || 'info') as MessageIntent,
      iconEmoji: m.iconEmoji || '',
      title: m.title || '',
      body: m.body || '',
      targetInfluencers: roles.length === 0 ? true : roles.includes('influencer'),
      targetPromoters: roles.length === 0 ? true : roles.includes('promoter'),
      ctaLabel: m.ctaLabel || '',
      ctaPath: m.ctaPath || '',
      dismissible: m.dismissible !== false,
      startAt: timestampToInputValue(m.startAt),
      endAt: timestampToInputValue(m.endAt),
    });
    setShowModal(true);
  };

  const save = async () => {
    if (!formData.title.trim() || !formData.body.trim()) return;

    const payload: any = {
      isActive: formData.isActive,
      intent: formData.intent,
      title: formData.title.trim(),
      body: formData.body.trim(),
      dismissible: formData.dismissible,
      createdAt: editing?.createdAt || Date.now(),
    };

    if (formData.iconEmoji.trim()) payload.iconEmoji = formData.iconEmoji.trim();

    if (formAudienceRoles.length > 0 && formAudienceRoles.length < 2) {
      payload.audienceRoles = formAudienceRoles;
    } else {
      payload.audienceRoles = [];
    }

    if (formData.ctaLabel.trim() && formData.ctaPath.trim()) {
      payload.ctaLabel = formData.ctaLabel.trim();
      payload.ctaPath = formData.ctaPath.trim();
    }

    const startAt = inputValueToTimestamp(formData.startAt);
    const endAt = inputValueToTimestamp(formData.endAt);

    if (startAt) payload.startAt = startAt;
    if (endAt) payload.endAt = endAt;

    setLoading(true);
    try {
      if (editing) {
        await updateDoc(doc(db, 'dashboardMessages', editing.id), payload);
      } else {
        await addDoc(collection(db, 'dashboardMessages'), payload);
      }

      setShowModal(false);
      setEditing(null);
      await loadMessages();
    } finally {
      setLoading(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this message?')) return;

    setLoading(true);
    try {
      await deleteDoc(doc(db, 'dashboardMessages', id));
      await loadMessages();
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (m: DashboardMessageRecord) => {
    setLoading(true);
    try {
      await updateDoc(doc(db, 'dashboardMessages', m.id), {
        isActive: !m.isActive,
      });
      await loadMessages();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Dashboard Messages</h1>
          <p className="text-gray-400">Create announcements, promotions, and notifications for influencers and promoters</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-[#B8FF00] hover:bg-[#B8FF00]/80 text-gray-900 font-semibold rounded-xl transition-colors"
        >
          <FiPlus className="w-4 h-4" />
          Create Message
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-400">Loading...</div>
      ) : messages.length === 0 ? (
        <div className="text-center py-8 text-gray-400">No messages created yet</div>
      ) : (
        <div className="grid gap-4">
          {messages.map((m) => {
            const roles = (m.audienceRoles || []).length === 0 ? 'All' : (m.audienceRoles || []).join(', ');
            return (
              <div key={m.id} className="bg-white/5 border border-white/10 rounded-xl p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-white">
                        {m.iconEmoji ? `${m.iconEmoji} ` : ''}{m.title}
                      </h3>
                      <span className={`px-2 py-1 rounded-lg text-xs font-medium ${m.isActive ? 'text-green-400 bg-green-400/10' : 'text-gray-400 bg-gray-400/10'}`}>
                        {m.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <span className="px-2 py-1 rounded-lg text-xs font-medium text-gray-300 bg-white/5">
                        {m.intent}
                      </span>
                      <span className="px-2 py-1 rounded-lg text-xs font-medium text-gray-300 bg-white/5">
                        {roles}
                      </span>
                    </div>
                    <p className="text-gray-400">{m.body}</p>
                    {(m.ctaLabel && m.ctaPath) && (
                      <p className="text-sm text-gray-500 mt-2">CTA: {m.ctaLabel} → {m.ctaPath}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => toggleActive(m)}
                      className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                    >
                      {m.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => openEdit(m)}
                      className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <FiEdit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => remove(m.id)}
                      className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? 'Edit Message' : 'Create Message'}
        maxWidthClassName="max-w-2xl"
        footer={
          <div className="flex gap-3">
            <button
              onClick={() => setShowModal(false)}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={save}
              disabled={loading || !formData.title.trim() || !formData.body.trim()}
              className="px-4 py-2 bg-[#B8FF00] hover:bg-[#B8FF00]/80 text-gray-900 font-semibold rounded-xl transition-colors disabled:opacity-50"
            >
              {editing ? 'Save Changes' : 'Create Message'}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Checkbox
              checked={formData.isActive}
              onChange={(checked) => setFormData((p) => ({ ...p, isActive: checked }))}
              className="group flex items-center gap-3 cursor-pointer"
            >
              <div className="relative">
                <div className="w-4 h-4 bg-white/10 border border-white/20 rounded group-data-[checked]:bg-[#B8FF00] group-data-[checked]:border-[#B8FF00] transition-colors" />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <svg className="w-3 h-3 text-gray-900 opacity-0 group-data-[checked]:opacity-100 transition-opacity" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <span className="text-white text-sm select-none">Active</span>
            </Checkbox>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Target Audience</label>
              <div className="space-y-2">
                <Checkbox
                  checked={formData.targetInfluencers}
                  onChange={(checked) => setFormData((p) => ({ ...p, targetInfluencers: checked }))}
                  className="group flex items-center gap-3 cursor-pointer"
                >
                  <div className="relative">
                    <div className="w-4 h-4 bg-white/10 border border-white/20 rounded group-data-[checked]:bg-[#B8FF00] group-data-[checked]:border-[#B8FF00] transition-colors" />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <svg className="w-3 h-3 text-gray-900 opacity-0 group-data-[checked]:opacity-100 transition-opacity" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <span className="text-gray-300 text-sm select-none">Influencers</span>
                </Checkbox>

                <Checkbox
                  checked={formData.targetPromoters}
                  onChange={(checked) => setFormData((p) => ({ ...p, targetPromoters: checked }))}
                  className="group flex items-center gap-3 cursor-pointer"
                >
                  <div className="relative">
                    <div className="w-4 h-4 bg-white/10 border border-white/20 rounded group-data-[checked]:bg-[#B8FF00] group-data-[checked]:border-[#B8FF00] transition-colors" />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <svg className="w-3 h-3 text-gray-900 opacity-0 group-data-[checked]:opacity-100 transition-opacity" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <span className="text-gray-300 text-sm select-none">Promoters</span>
                </Checkbox>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Intent</label>
              <Menu>
                <MenuButton className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none flex items-center justify-between">
                  <span className="capitalize">{formData.intent}</span>
                  <FiChevronDown className="w-4 h-4 text-gray-400" />
                </MenuButton>
                <MenuItems className="absolute z-10 mt-1 w-full max-w-xs bg-[#0a0a0a] border border-white/10 rounded-xl shadow-lg focus:outline-none">
                  <MenuItem>
                    {({ active }) => (
                      <button
                        onClick={() => setFormData((p) => ({ ...p, intent: 'promo' }))}
                        className={`${
                          active ? 'bg-white/10' : ''
                        } group flex w-full items-center px-4 py-2 text-sm text-white capitalize`}
                      >
                        Promo
                      </button>
                    )}
                  </MenuItem>
                  <MenuItem>
                    {({ active }) => (
                      <button
                        onClick={() => setFormData((p) => ({ ...p, intent: 'info' }))}
                        className={`${
                          active ? 'bg-white/10' : ''
                        } group flex w-full items-center px-4 py-2 text-sm text-white capitalize`}
                      >
                        Info
                      </button>
                    )}
                  </MenuItem>
                  <MenuItem>
                    {({ active }) => (
                      <button
                        onClick={() => setFormData((p) => ({ ...p, intent: 'success' }))}
                        className={`${
                          active ? 'bg-white/10' : ''
                        } group flex w-full items-center px-4 py-2 text-sm text-white capitalize`}
                      >
                        Success
                      </button>
                    )}
                  </MenuItem>
                  <MenuItem>
                    {({ active }) => (
                      <button
                        onClick={() => setFormData((p) => ({ ...p, intent: 'warning' }))}
                        className={`${
                          active ? 'bg-white/10' : ''
                        } group flex w-full items-center px-4 py-2 text-sm text-white capitalize`}
                      >
                        Warning
                      </button>
                    )}
                  </MenuItem>
                </MenuItems>
              </Menu>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Emoji Icon (optional)</label>
            <input
              type="text"
              value={formData.iconEmoji}
              onChange={(e) => setFormData((p) => ({ ...p, iconEmoji: e.target.value }))}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none"
              placeholder="🎉"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none"
              placeholder="Message title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Message</label>
            <textarea
              value={formData.body}
              onChange={(e) => setFormData((p) => ({ ...p, body: e.target.value }))}
              rows={4}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none resize-none"
              placeholder="What should we show on the dashboard?"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">CTA Label (optional)</label>
              <input
                type="text"
                value={formData.ctaLabel}
                onChange={(e) => setFormData((p) => ({ ...p, ctaLabel: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none"
                placeholder="Learn more"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">CTA Link (path)</label>
              <input
                type="text"
                value={formData.ctaPath}
                onChange={(e) => setFormData((p) => ({ ...p, ctaPath: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none"
                placeholder="/influencer/profile"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Checkbox
              checked={formData.dismissible}
              onChange={(checked) => setFormData((p) => ({ ...p, dismissible: checked }))}
              className="group flex items-center gap-3 cursor-pointer"
            >
              <div className="relative">
                <div className="w-4 h-4 bg-white/10 border border-white/20 rounded group-data-[checked]:bg-[#B8FF00] group-data-[checked]:border-[#B8FF00] transition-colors" />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <svg className="w-3 h-3 text-gray-900 opacity-0 group-data-[checked]:opacity-100 transition-opacity" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <span className="text-white text-sm select-none">Dismissible (can be closed)</span>
            </Checkbox>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Start At (optional)</label>
              <input
                type="datetime-local"
                value={formData.startAt}
                onChange={(e) => setFormData((p) => ({ ...p, startAt: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#B8FF00] [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:hover:opacity-70"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">End At (optional)</label>
              <input
                type="datetime-local"
                value={formData.endAt}
                onChange={(e) => setFormData((p) => ({ ...p, endAt: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#B8FF00] [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:hover:opacity-70"
              />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
