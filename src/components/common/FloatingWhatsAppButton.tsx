import { useState } from 'react';
import { FaWhatsapp } from 'react-icons/fa';

interface FloatingWhatsAppButtonProps {
  phoneNumber: string;
  message?: string;
  tooltipText?: string;
}

export default function FloatingWhatsAppButton({
  phoneNumber,
  message = "Hi! I need help with ColLoved.",
  tooltipText = "Chat with Support"
}: FloatingWhatsAppButtonProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  // Clean phone number (remove spaces, dashes, etc.)
  const cleanPhone = phoneNumber.replace(/[\s\-\(\)]/g, '');

  // Create WhatsApp URL
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute bottom-full right-0 mb-3 animate-fade-in">
          <div className="bg-white text-gray-900 px-4 py-2 rounded-lg shadow-lg text-sm font-medium whitespace-nowrap">
            {tooltipText}
            <div className="absolute -bottom-1 right-4 w-2 h-2 bg-white transform rotate-45" />
          </div>
        </div>
      )}

      {/* Button */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="flex items-center justify-center w-12 h-12 bg-green-500 hover:bg-green-600 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 group"
        aria-label="Chat on WhatsApp"
      >
        <FaWhatsapp className="w-7 h-7 text-white" />
      </a>
    </div>
  );
}
