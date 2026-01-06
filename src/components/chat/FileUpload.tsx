// ============================================
// FILE UPLOAD COMPONENT
// ============================================

import { useState, useRef, useCallback } from 'react';
import Modal from '../common/Modal';

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

  const [errorModal, setErrorModal] = useState<{ open: boolean; message: string }>({
    open: false,
    message: '',
  });

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
        setErrorModal({ open: true, message: validation.error || 'Invalid file' });
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
    <>
      <Modal
        open={errorModal.open}
        onClose={() => setErrorModal({ open: false, message: '' })}
        title="Upload failed"
        footer={
          <button
            onClick={() => setErrorModal({ open: false, message: '' })}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>
        }
      >
        <p className="text-gray-400 text-sm">{errorModal.message}</p>
      </Modal>

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
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          <span className={`text-sm ${isDragging ? 'text-[#B8FF00]' : 'text-gray-400'}`}>
            {disabled ? 'Upload disabled' : isDragging ? 'Drop file here' : 'Click or drag file to upload'}
          </span>
        </div>
      </div>
    </>
  );
}
