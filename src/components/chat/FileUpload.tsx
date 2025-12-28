// ============================================
// FILE UPLOAD COMPONENT
// ============================================

import { useState, useRef, useCallback } from 'react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  maxSize?: number; // in bytes
  disabled?: boolean;
}

export default function FileUpload({
  onFileSelect,
  accept = 'image/*,.pdf,.doc,.docx,.txt',
  maxSize = 10 * 1024 * 1024, // 10MB default
  disabled = false,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): { valid: boolean; error?: string } => {
    // Check file size
    if (file.size > maxSize) {
      return {
        valid: false,
        error: `File size must be less than ${maxSize / 1024 / 1024}MB`,
      };
    }

    return { valid: true };
  };

  const handleFile = useCallback(
    (file: File) => {
      const validation = validateFile(file);

      if (!validation.valid) {
        alert(validation.error);
        return;
      }

      onFileSelect(file);
    },
    [onFileSelect, maxSize]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);

      if (disabled) return;

      const files = Array.from(e.dataTransfer.files);

      if (files.length > 0) {
        handleFile(files[0]);
      }
    },
    [disabled, handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;

    if (files && files.length > 0) {
      handleFile(files[0]);
    }

    // Reset input value so same file can be selected again
    e.target.value = '';
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={handleClick}
      className={`
        relative border-2 border-dashed rounded-lg p-3 transition-all cursor-pointer
        ${isDragging ? 'border-[#B8FF00] bg-[#B8FF00]/10' : 'border-white/10 hover:border-white/20'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileInputChange}
        className="hidden"
        disabled={disabled}
      />

      <div className="flex items-center justify-center gap-2">
        <svg
          className={`w-5 h-5 transition-colors ${isDragging ? 'text-[#B8FF00]' : 'text-gray-400'}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
          />
        </svg>
        <span className={`text-sm ${isDragging ? 'text-[#B8FF00]' : 'text-gray-400'}`}>
          {isDragging ? 'Drop to upload' : 'Attach file'}
        </span>
      </div>
    </div>
  );
}
