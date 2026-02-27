import { useState, useRef, useEffect } from 'react';
import { FiPlus, FiTrash2, FiChevronDown, FiImage, FiList, FiAlignLeft } from 'react-icons/fi';
import type { TaskContentSection, TaskContentCard, TaskContentSectionItem, ContentItemType } from '../../types';

interface TaskContentSectionEditorProps {
  value: TaskContentSection | undefined;
  onChange: (section: TaskContentSection | undefined) => void;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

const createEmptyCard = (): TaskContentCard => ({
  id: generateId(),
  title: '',
  description: [],
  descriptionType: 'list',
  imageUrl: '',
  sections: []
});

const createEmptySection = (): TaskContentSectionItem => ({
  id: generateId(),
  title: '',
  content: [],
  contentType: 'list'
});

// Simple dropdown component
function ContentTypeDropdown({
  value,
  onChange
}: {
  value: ContentItemType;
  onChange: (type: ContentItemType) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 text-xs text-gray-400 hover:text-white bg-white/5 px-2 py-1 rounded"
      >
        {value === 'list' ? <FiList className="w-3 h-3" /> : <FiAlignLeft className="w-3 h-3" />}
        {value === 'list' ? 'List' : 'Text'}
        <FiChevronDown className="w-3 h-3" />
      </button>
      {isOpen && (
        <div className="absolute right-0 z-50 mt-1 w-24 bg-[#0a0a0a] border border-white/10 rounded-lg shadow-lg">
          <button
            type="button"
            onClick={() => {
              onChange('list');
              setIsOpen(false);
            }}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-white hover:bg-white/10"
          >
            <FiList className="w-3 h-3" />
            List
          </button>
          <button
            type="button"
            onClick={() => {
              onChange('textarea');
              setIsOpen(false);
            }}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-white hover:bg-white/10"
          >
            <FiAlignLeft className="w-3 h-3" />
            Text
          </button>
        </div>
      )}
    </div>
  );
}

export default function TaskContentSectionEditor({ value, onChange }: TaskContentSectionEditorProps) {
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  const cards = value?.cards || [];

  // Auto-expand first card when data exists
  useEffect(() => {
    if (cards.length > 0 && !expandedCardId) {
      setExpandedCardId(cards[0].id);
    }
  }, [cards]);

  const updateCards = (newCards: TaskContentCard[]) => {
    if (newCards.length === 0) {
      onChange(undefined);
    } else {
      onChange({ cards: newCards });
    }
  };

  const addCard = () => {
    const newCard = createEmptyCard();
    updateCards([...cards, newCard]);
    setExpandedCardId(newCard.id);
  };

  const removeCard = (id: string) => {
    updateCards(cards.filter(c => c.id !== id));
  };

  const updateCard = (id: string, updates: Partial<TaskContentCard>) => {
    updateCards(cards.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const addSection = (cardId: string) => {
    const newSection = createEmptySection();
    updateCard(cardId, { sections: [...(cards.find(c => c.id === cardId)?.sections || []), newSection] });
  };

  const removeSection = (cardId: string, sectionId: string) => {
    const card = cards.find(c => c.id === cardId);
    if (card) {
      updateCard(cardId, { sections: card.sections.filter(s => s.id !== sectionId) });
    }
  };

  const updateSection = (cardId: string, sectionId: string, updates: Partial<TaskContentSectionItem>) => {
    const card = cards.find(c => c.id === cardId);
    if (card) {
      updateCard(cardId, {
        sections: card.sections.map(s => s.id === sectionId ? { ...s, ...updates } : s)
      });
    }
  };

  const toggleCardExpand = (id: string) => {
    setExpandedCardId(expandedCardId === id ? null : id);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-300">
          Content Section (Optional)
        </label>
        <button
          type="button"
          onClick={addCard}
          className="flex items-center gap-2 px-3 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 rounded-lg text-sm transition-colors"
        >
          <FiPlus className="w-4 h-4" />
          Add Card
        </button>
      </div>

      {cards.length > 0 && (
        <div className="space-y-3">
          {cards.map((card, index) => (
            <div key={card.id} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
              {/* Card Header */}
              <div
                className="flex items-center justify-between p-3 cursor-pointer hover:bg-white/5"
                onClick={() => toggleCardExpand(card.id)}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 bg-white/10 px-2 py-0.5 rounded">
                    {index + 1}
                  </span>
                  <span className="text-white font-medium truncate max-w-[200px]">
                    {card.title || 'Untitled Card'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeCard(card.id);
                    }}
                    className="p-1.5 text-red-400 hover:bg-red-400/10 rounded transition-colors"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                  <FiChevronDown
                    className={`w-4 h-4 text-gray-400 transition-transform ${
                      expandedCardId === card.id ? 'rotate-180' : ''
                    }`}
                  />
                </div>
              </div>

              {/* Card Content (Expanded) */}
              {expandedCardId === card.id && (
                <div className="border-t border-white/10 p-4 space-y-4">
                  {/* Title */}
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Title</label>
                    <input
                      type="text"
                      value={card.title}
                      onChange={(e) => updateCard(card.id, { title: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-cyan-400"
                      placeholder="Card title"
                    />
                  </div>

                  {/* Image URL */}
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      <FiImage className="w-3 h-3 inline mr-1" />
                      Image URL (optional)
                    </label>
                    <input
                      type="text"
                      value={card.imageUrl || ''}
                      onChange={(e) => updateCard(card.id, { imageUrl: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-cyan-400"
                      placeholder="https://example.com/image.png"
                    />
                  </div>

                  {/* Description with Type Toggle */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs text-gray-500">Description</label>
                      <ContentTypeDropdown
                        value={card.descriptionType}
                        onChange={(type) => updateCard(card.id, { descriptionType: type })}
                      />
                    </div>
                    {card.descriptionType === 'list' ? (
                      <div className="space-y-2">
                        {card.description.map((item, i) => (
                          <div key={i} className="flex gap-2">
                            <input
                              type="text"
                              value={item}
                              onChange={(e) => {
                                const newContent = [...card.description];
                                newContent[i] = e.target.value;
                                updateCard(card.id, { description: newContent });
                              }}
                              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-cyan-400"
                              placeholder={`Item ${i + 1}`}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                updateCard(card.id, { description: card.description.filter((_, idx) => idx !== i) });
                              }}
                              className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                            >
                              <FiTrash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => updateCard(card.id, { description: [...card.description, ''] })}
                          className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300"
                        >
                          <FiPlus className="w-3 h-3" />
                          Add Item
                        </button>
                      </div>
                    ) : (
                      <textarea
                        value={card.description.join('\n')}
                        onChange={(e) => updateCard(card.id, { description: [e.target.value] })}
                        rows={3}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-cyan-400 resize-none"
                        placeholder="Enter text content"
                      />
                    )}
                  </div>

                  {/* Additional Sections */}
                  {card.sections && card.sections.length > 0 && (
                    <div className="space-y-3">
                      {card.sections.map((section) => (
                        <div key={section.id} className="bg-white/5 border border-white/10 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-gray-400">Section</span>
                            <button
                              type="button"
                              onClick={() => removeSection(card.id, section.id)}
                              className="p-1 text-red-400 hover:bg-red-400/10 rounded transition-colors"
                            >
                              <FiTrash2 className="w-3 h-3" />
                            </button>
                          </div>

                          {/* Section Title (Optional) */}
                          <div className="mb-2">
                            <label className="block text-xs text-gray-500 mb-1">Title (optional)</label>
                            <input
                              type="text"
                              value={section.title || ''}
                              onChange={(e) => updateSection(card.id, section.id, { title: e.target.value })}
                              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-cyan-400"
                              placeholder="Optional section title"
                            />
                          </div>

                          {/* Section Content */}
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="block text-xs text-gray-500">Content</label>
                              <ContentTypeDropdown
                                value={section.contentType}
                                onChange={(type) => updateSection(card.id, section.id, { contentType: type })}
                              />
                            </div>
                            {section.contentType === 'list' ? (
                              <div className="space-y-2">
                                {section.content.map((item, i) => (
                                  <div key={i} className="flex gap-2">
                                    <input
                                      type="text"
                                      value={item}
                                      onChange={(e) => {
                                        const newContent = [...section.content];
                                        newContent[i] = e.target.value;
                                        updateSection(card.id, section.id, { content: newContent });
                                      }}
                                      className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-cyan-400"
                                      placeholder={`Item ${i + 1}`}
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        updateSection(card.id, section.id, { content: section.content.filter((_, idx) => idx !== i) });
                                      }}
                                      className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                                    >
                                      <FiTrash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                ))}
                                <button
                                  type="button"
                                  onClick={() => updateSection(card.id, section.id, { content: [...section.content, ''] })}
                                  className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300"
                                >
                                  <FiPlus className="w-3 h-3" />
                                  Add Item
                                </button>
                              </div>
                            ) : (
                              <textarea
                                value={section.content.join('\n')}
                                onChange={(e) => updateSection(card.id, section.id, { content: [e.target.value] })}
                                rows={3}
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-cyan-400 resize-none"
                                placeholder="Enter text content"
                              />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add Section Button */}
                  <button
                    type="button"
                    onClick={() => addSection(card.id)}
                    className="flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300"
                  >
                    <FiPlus className="w-4 h-4" />
                    Add Section
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {cards.length === 0 && (
        <p className="text-gray-500 text-sm">
          Add content cards to display a carousel section in the task details.
        </p>
      )}
    </div>
  );
}
