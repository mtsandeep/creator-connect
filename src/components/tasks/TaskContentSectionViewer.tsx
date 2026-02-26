import { useState } from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import type { TaskContentSection } from '../../types';

interface TaskContentSectionViewerProps {
  contentSection: TaskContentSection;
}

export default function TaskContentSectionViewer({ contentSection }: TaskContentSectionViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const { cards } = contentSection;

  if (!cards || cards.length === 0) return null;

  const currentCard = cards[currentIndex];
  const hasMultipleCards = cards.length > 1;

  const goToNext = () => {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const goToPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  return (
    <div className="max-w-md w-full mx-auto mt-6">
      {/* Progress - only show if multiple cards */}
      {hasMultipleCards && (
        <div className="flex justify-between items-center text-sm text-gray-400 mb-3">
          <button
            onClick={goToPrev}
            disabled={currentIndex === 0}
            className={`flex items-center gap-1 ${
              currentIndex === 0
                ? 'text-gray-600 cursor-not-allowed'
                : 'text-gray-400 hover:text-white'
            } transition-colors`}
          >
            <FiChevronLeft className="w-4 h-4" />
            Previous
          </button>
          <div className="flex items-center gap-3">
            <div>
              Info Card <span className="text-white font-medium">{currentIndex + 1}</span> of <span className="text-white font-medium">{cards.length}</span>
            </div>
            <div className="flex gap-1">
              {cards.map((_, index) => (
                <div
                  key={index}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${
                    index === currentIndex ? 'bg-cyan-400' : 'bg-gray-600'
                  }`}
                />
              ))}
            </div>
          </div>
          <button
            onClick={goToNext}
            disabled={currentIndex === cards.length - 1}
            className={`flex items-center gap-1 ${
              currentIndex === cards.length - 1
                ? 'text-gray-600 cursor-not-allowed'
                : 'text-cyan-400 hover:text-cyan-300'
            } transition-colors`}
          >
            Next
            <FiChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Card */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-5">
        {/* Image */}
        {currentCard.imageUrl && (
          <img
            src={currentCard.imageUrl}
            alt={currentCard.title}
            className="rounded-lg mb-4 w-full h-40 object-cover"
          />
        )}

        {/* Title */}
        <h3 className="text-lg font-semibold text-white mb-2">
          {currentCard.title}
        </h3>

        {/* Description */}
        {currentCard.description && currentCard.description.length > 0 && (
          <div className="text-sm text-gray-400 mb-4">
            {currentCard.descriptionType === 'list' ? (
              currentCard.description.map((item, index) => (
                <p key={index} className={index > 0 ? 'mt-1' : ''}>{item}</p>
              ))
            ) : (
              <p className="whitespace-pre-line">{currentCard.description.join('\n')}</p>
            )}
          </div>
        )}

        {/* Sections */}
        {currentCard.sections && currentCard.sections.length > 0 && (
          <div className="space-y-4">
            {currentCard.sections.map((section) => (
              <div key={section.id}>
                {section.title && (
                  <div className="text-xs text-cyan-400 uppercase tracking-wide mb-2">
                    {section.title}
                  </div>
                )}
                {section.content && section.content.length > 0 && (
                  section.contentType === 'list' ? (
                    <ul className="space-y-1 text-sm text-gray-300">
                      {section.content.map((item, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-cyan-400">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-300 whitespace-pre-line">
                      {section.content.join('\n')}
                    </p>
                  )
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Navigation - only show if multiple cards */}
      {hasMultipleCards && (
        <div className="flex justify-between mt-4 text-sm">
          <button
            onClick={goToPrev}
            disabled={currentIndex === 0}
            className={`flex items-center gap-1 ${
              currentIndex === 0
                ? 'text-gray-600 cursor-not-allowed'
                : 'text-gray-400 hover:text-white'
            } transition-colors`}
          >
            <FiChevronLeft className="w-4 h-4" />
            Previous
          </button>
          <button
            onClick={goToNext}
            disabled={currentIndex === cards.length - 1}
            className={`flex items-center gap-1 ${
              currentIndex === cards.length - 1
                ? 'text-gray-600 cursor-not-allowed'
                : 'text-cyan-400 hover:text-cyan-300'
            } transition-colors`}
          >
            Next
            <FiChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
