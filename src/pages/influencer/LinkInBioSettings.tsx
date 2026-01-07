import { useState, useEffect } from 'react';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuthStore } from '../../stores';
import type { LinkInBioSettings, LinkInBioTerm, LinkInBioQuickLink, TermType } from '../../types';
import { Plus, Trash2, ExternalLink, Save, ChevronUp, ChevronDown, Check, ChevronsUpDown, Copy } from 'lucide-react';
import { Switch, Listbox, ListboxButton, ListboxOptions, ListboxOption } from '@headlessui/react';

export default function LinkInBioSettings() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const [linkInBio, setLinkInBio] = useState<LinkInBioSettings>({
    isEnabled: true,
    contactPreference: 'anyone',
    priceOnRequest: false,
    terms: [],
    quickLinks: [],
  });

  const [newTerm, setNewTerm] = useState({ text: '', type: 'generic' as TermType });
  const [newLink, setNewLink] = useState({ title: '', url: '', icon: '🔗' });

  useEffect(() => {
    const fetchSettings = async () => {
      if (!user?.uid) return;

      setLoading(true);
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.influencerProfile?.linkInBio) {
            setLinkInBio(userData.influencerProfile.linkInBio);
          }
        }
      } catch (error) {
        console.error('Error fetching link-in bio settings:', error);
        showMessage('error', 'Failed to load settings');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [user]);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleSave = async () => {
    if (!user?.uid) return;

    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        'influencerProfile.linkInBio': linkInBio,
      });
      showMessage('success', 'Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      showMessage('error', 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const addTerm = () => {
    if (!newTerm.text.trim()) return;

    const term: LinkInBioTerm = {
      id: Date.now().toString(),
      text: newTerm.text.trim(),
      type: newTerm.type,
      order: linkInBio.terms.length,
    };

    setLinkInBio({
      ...linkInBio,
      terms: [...linkInBio.terms, term],
    });

    setNewTerm({ text: '', type: 'generic' });
  };

  const removeTerm = (id: string) => {
    setLinkInBio({
      ...linkInBio,
      terms: linkInBio.terms.filter((t) => t.id !== id),
    });
  };

  const moveTerm = (index: number, direction: 'up' | 'down') => {
    const terms = [...linkInBio.terms];
    if (direction === 'up' && index > 0) {
      [terms[index], terms[index - 1]] = [terms[index - 1], terms[index]];
    } else if (direction === 'down' && index < terms.length - 1) {
      [terms[index], terms[index + 1]] = [terms[index + 1], terms[index]];
    }

    // Update order
    terms.forEach((t, i) => (t.order = i));

    setLinkInBio({ ...linkInBio, terms });
  };

  const addQuickLink = () => {
    if (!newLink.title.trim() || !newLink.url.trim()) return;

    const link: LinkInBioQuickLink = {
      id: Date.now().toString(),
      title: newLink.title.trim(),
      url: newLink.url.trim(),
      icon: newLink.icon,
      order: linkInBio.quickLinks.length,
    };

    setLinkInBio({
      ...linkInBio,
      quickLinks: [...linkInBio.quickLinks, link],
    });

    setNewLink({ title: '', url: '', icon: '🔗' });
  };

  const removeQuickLink = (id: string) => {
    setLinkInBio({
      ...linkInBio,
      quickLinks: linkInBio.quickLinks.filter((l) => l.id !== id),
    });
  };

  const moveQuickLink = (index: number, direction: 'up' | 'down') => {
    const links = [...linkInBio.quickLinks];
    if (direction === 'up' && index > 0) {
      [links[index], links[index - 1]] = [links[index - 1], links[index]];
    } else if (direction === 'down' && index < links.length - 1) {
      [links[index], links[index + 1]] = [links[index + 1], links[index]];
    }

    // Update order
    links.forEach((l, i) => (l.order = i));

    setLinkInBio({ ...linkInBio, quickLinks: links });
  };

  const getPublicUrl = () => {
    const username = user?.influencerProfile?.username || user?.uid;
    return `${window.location.origin}/link/${username}`;
  };

  const copyToClipboard = async () => {
    const url = getPublicUrl();
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00D9FF]"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">Customize Your Link-in Bio</h1>
        <p className="text-gray-400 mb-4">Create a public page to share on social media</p>

        {/* Shareable URL Input */}
        <div className="bg-[#1E293B] rounded-xl p-4 border border-[#00D9FF]/20">
          <div className="bg-[#0F172A]/50 rounded-lg px-4 py-2 mb-4 -mx-1">
            <label className="block text-sm font-semibold text-[#00D9FF]">Your Public Link</label>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 min-w-0">
            <input
              type="text"
              readOnly
              value={getPublicUrl()}
              className="w-full sm:flex-1 min-w-0 bg-[#0F172A] border border-gray-700 rounded-lg px-4 py-2 text-white text-sm"
            />
            <button
              onClick={copyToClipboard}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#00D9FF] hover:bg-[#00A8CC] text-[#0F172A] px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap"
            >
              <Copy className="w-4 h-4" />
              {copied ? 'Copied!' : 'Copy Link'}
            </button>
            <button
              onClick={() => window.open(getPublicUrl(), '_blank')}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#0F172A] hover:bg-[#1E293B] text-[#00D9FF] px-4 py-2 rounded-lg border border-[#00D9FF]/30 transition-all whitespace-nowrap"
            >
              <ExternalLink className="w-4 h-4" />
              Open
            </button>
          </div>
        </div>
      </div>

      {message && (
        <div
          className={`mb-6 p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-[#00FF94]/20 text-[#00FF94] border border-[#00FF94]/30'
              : 'bg-[#FF3366]/20 text-[#FF3366] border border-[#FF3366]/30'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="space-y-6">
        {/* Contact Preferences */}
        <div className="bg-gradient-to-br from-[#7c3aed]/20 via-[#6d28d9]/15 to-[#1E293B] rounded-xl p-6 border-2 border-[#a78bfa]/40 shadow-xl shadow-[#8b5cf6]/10 relative overflow-hidden">
          {/* Decorative glow effect */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-[#a78bfa]/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#8b5cf6]/5 rounded-full blur-2xl pointer-events-none"></div>

          <div className="bg-[#0F172A]/90 rounded-lg px-4 py-2 mb-4 -mx-2 border border-[#a78bfa]/30 backdrop-blur-sm">
            <h2 className="text-base font-semibold text-[#c4b5fd]">Contact Preferences</h2>
          </div>

          <div className="space-y-4 relative">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <p className="text-white font-medium mb-2">Verified brands only</p>
                <p className="text-gray-400 text-sm">
                  Restrict contact to brands who have completed verification. This reduces spam and ensures you receive only genuine, high-quality partnership inquiries.
                </p>
                <div className="mt-3 flex items-center gap-2 text-xs text-[#c4b5fd]">
                  <span className="bg-[#a78bfa]/10 px-2 py-1 rounded-full border border-[#a78bfa]/20">Recommended for established influencers</span>
                </div>
              </div>
              <div className="flex-shrink-0">
                <Switch
                  checked={linkInBio.contactPreference === 'verified_only'}
                  onChange={(checked) =>
                    setLinkInBio({
                      ...linkInBio,
                      contactPreference: checked ? 'verified_only' : 'anyone',
                    })
                  }
                  className={`${
                    linkInBio.contactPreference === 'verified_only' ? 'bg-[#a78bfa]' : 'bg-gray-600'
                  } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#a78bfa] focus:ring-offset-2 focus:ring-offset-[#1E293B]`}
                >
                  <span className="sr-only">Use setting</span>
                  <span
                    className={`${
                      linkInBio.contactPreference === 'verified_only' ? 'translate-x-5' : 'translate-x-0'
                    } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                  />
                </Switch>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Display */}
        <div className="bg-[#1E293B] rounded-xl p-6 border border-[#00D9FF]/20">
          <div className="bg-[#0F172A]/50 rounded-lg px-4 py-2 mb-4 -mx-2">
            <h2 className="text-base font-semibold text-[#00D9FF]">Pricing Display</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div>
                  <p className="text-white font-medium">Enable "Price on Request"</p>
                  <p className="text-gray-400 text-sm mt-1">
                    When enabled, shows "Price on Request" badge instead of actual rates on your public page
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Actual rates are configured in{' '}
                    <a href="/influencer/settings" className="text-[#00D9FF] hover:underline">
                      Settings
                    </a>
                  </p>
                </div>
              </div>
              <Switch
                checked={linkInBio.priceOnRequest}
                onChange={(checked) => setLinkInBio({ ...linkInBio, priceOnRequest: checked })}
                className={`${
                  linkInBio.priceOnRequest ? 'bg-[#00D9FF]' : 'bg-gray-600'
                } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#00D9FF] focus:ring-offset-2 focus:ring-offset-[#1E293B]`}
              >
                <span className="sr-only">Use setting</span>
                <span
                  className={`${
                    linkInBio.priceOnRequest ? 'translate-x-5' : 'translate-x-0'
                  } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                />
              </Switch>
            </div>
          </div>
        </div>

        {/* Terms Section */}
        <div className="bg-[#1E293B] rounded-xl p-6 border border-[#00D9FF]/20">
          <div className="bg-[#0F172A]/50 rounded-lg px-4 py-2 mb-4 -mx-2">
            <h2 className="text-base font-semibold text-[#00D9FF]">Working Terms</h2>
          </div>

          <div className="space-y-3 mb-4">
            {linkInBio.terms.map((term, index) => (
              <div
                key={term.id}
                className="flex items-center gap-3 bg-[#0F172A] rounded-lg p-3"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {term.type === 'allowed' && (
                      <span className="text-[#00FF94]">✓</span>
                    )}
                    {term.type === 'not_allowed' && (
                      <span className="text-[#FF3366]">✗</span>
                    )}
                    <span className="text-white">{term.text}</span>
                    <span className="text-xs text-gray-500 capitalize">
                      ({term.type.replace('_', ' ')})
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => moveTerm(index, 'up')}
                    disabled={index === 0}
                    className="p-1 hover:bg-[#1E293B] rounded disabled:opacity-30"
                  >
                    <ChevronUp className="w-4 h-4 text-gray-400" />
                  </button>
                  <button
                    onClick={() => moveTerm(index, 'down')}
                    disabled={index === linkInBio.terms.length - 1}
                    className="p-1 hover:bg-[#1E293B] rounded disabled:opacity-30"
                  >
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  </button>
                  <button
                    onClick={() => removeTerm(term.id)}
                    className="p-1 hover:bg-[#FF3366]/20 rounded"
                  >
                    <Trash2 className="w-4 h-4 text-[#FF3366]" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-2 min-w-0">
            <Listbox value={newTerm.type} onChange={(value) => setNewTerm({ ...newTerm, type: value as TermType })}>
              <div className="relative">
                <ListboxButton className="relative w-full sm:w-40 bg-[#0F172A] border border-gray-700 rounded-lg px-3 py-2 text-white text-left focus:outline-none focus:border-[#00D9FF] cursor-pointer">
                  <span className="block truncate">
                    {newTerm.type === 'allowed' ? 'Allowed ✓' : newTerm.type === 'not_allowed' ? 'Not Allowed ✗' : 'Generic'}
                  </span>
                  <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                    <ChevronsUpDown className="h-4 w-4 text-gray-400" />
                  </span>
                </ListboxButton>
                <ListboxOptions className="absolute z-10 mt-1 max-h-60 w-full sm:w-40 overflow-auto rounded-md bg-[#1E293B] border border-gray-700 py-1 shadow-lg focus:outline-none">
                  {['generic', 'allowed', 'not_allowed'].map((type) => (
                    <ListboxOption
                      key={type}
                      value={type}
                      className="relative cursor-pointer select-none py-2 pl-3 pr-9 data-[active]:bg-[#00D9FF]/20 data-[active]:text-[#00D9FF] text-white"
                    >
                      <span className="block truncate capitalize data-[selected]:font-medium font-normal">
                        {type === 'allowed' ? 'Allowed ✓' : type === 'not_allowed' ? 'Not Allowed ✗' : 'Generic'}
                      </span>
                      <span className="absolute inset-y-0 right-0 flex items-center pr-3 data-[selected]:flex hidden">
                        <Check className="h-4 w-4 text-[#00D9FF]" />
                      </span>
                    </ListboxOption>
                  ))}
                </ListboxOptions>
              </div>
            </Listbox>
            <input
              type="text"
              value={newTerm.text}
              onChange={(e) => setNewTerm({ ...newTerm, text: e.target.value })}
              placeholder="Add a term (e.g., 'Advance available')"
              className="w-full sm:flex-1 min-w-0 bg-[#0F172A] border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-[#00D9FF]"
              onKeyDown={(e) => e.key === 'Enter' && addTerm()}
            />
            <button
              onClick={addTerm}
              className="w-full sm:w-auto bg-[#00D9FF] text-[#0F172A] px-4 py-2 rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>
        </div>

        {/* Quick Links */}
        <div className="bg-[#1E293B] rounded-xl p-6 border border-[#00D9FF]/20">
          <div className="bg-[#0F172A]/50 rounded-lg px-4 py-2 mb-4 -mx-2">
            <h2 className="text-base font-semibold text-[#00D9FF]">Quick Links</h2>
          </div>

          <div className="space-y-3 mb-4">
            {linkInBio.quickLinks.map((link, index) => (
              <div
                key={link.id}
                className="flex items-center gap-3 bg-[#0F172A] rounded-lg p-3"
              >
                <span className="text-2xl">{link.icon}</span>
                <div className="flex-1">
                  <p className="text-white font-medium">{link.title}</p>
                  <p className="text-gray-400 text-sm truncate">{link.url}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => moveQuickLink(index, 'up')}
                    disabled={index === 0}
                    className="p-1 hover:bg-[#1E293B] rounded disabled:opacity-30"
                  >
                    <ChevronUp className="w-4 h-4 text-gray-400" />
                  </button>
                  <button
                    onClick={() => moveQuickLink(index, 'down')}
                    disabled={index === linkInBio.quickLinks.length - 1}
                    className="p-1 hover:bg-[#1E293B] rounded disabled:opacity-30"
                  >
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  </button>
                  <button
                    onClick={() => removeQuickLink(link.id)}
                    className="p-1 hover:bg-[#FF3366]/20 rounded"
                  >
                    <Trash2 className="w-4 h-4 text-[#FF3366]" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <input
              type="text"
              value={newLink.title}
              onChange={(e) => setNewLink({ ...newLink, title: e.target.value })}
              placeholder="Link title (e.g., 'Portfolio')"
              className="w-full bg-[#0F172A] border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-[#00D9FF]"
            />
            <div className="flex flex-col sm:flex-row gap-2 min-w-0">
              <input
                type="text"
                value={newLink.icon}
                onChange={(e) => setNewLink({ ...newLink, icon: e.target.value })}
                placeholder="Icon (emoji)"
                className="w-full sm:w-40 bg-[#0F172A] border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-[#00D9FF] text-center"
              />
              <input
                type="url"
                value={newLink.url}
                onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
                placeholder="URL (e.g., https://portfolio.com)"
                className="w-full sm:flex-1 min-w-0 bg-[#0F172A] border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-[#00D9FF]"
              />
              <button
                onClick={addQuickLink}
                className="w-full sm:w-auto bg-[#00D9FF] text-[#0F172A] px-4 py-2 rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2 whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                Add Link
              </button>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-gradient-to-r from-[#00D9FF] to-[#00A8CC] text-[#0F172A] font-semibold px-6 py-3 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
