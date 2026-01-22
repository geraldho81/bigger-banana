'use client';

import { useEffect, useCallback } from 'react';
import { X, Download, Copy } from 'lucide-react';
import { GenerationResult } from '@/lib/types';
import { imageToDataUrl } from '@/lib/image';

interface FullsizeDialogProps {
  result: GenerationResult;
  onClose: () => void;
  onDownload: () => void;
  onCopy: () => void;
}

export function FullsizeDialog({
  result,
  onClose,
  onDownload,
  onCopy,
}: FullsizeDialogProps) {
  const dataUrl = imageToDataUrl(result.imageData, result.mimeType);

  // Handle escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    // Prevent body scroll
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [handleKeyDown]);

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div
        className="dialog-content"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-full bg-bg-primary/80 p-2 transition-colors hover:bg-bg-tertiary"
        >
          <X className="h-5 w-5 text-text-primary" />
        </button>

        {/* Image */}
        <div className="image-frame">
          <img
            src={dataUrl}
            alt="Full size generated image"
            className="max-h-[75vh] w-auto"
          />
        </div>

        {/* Actions */}
        <div className="mt-4 flex items-center justify-center gap-3">
          <button onClick={onDownload} className="btn-primary">
            <Download className="h-4 w-4" />
            Download
          </button>
          <button onClick={onCopy} className="btn-secondary">
            <Copy className="h-4 w-4" />
            Copy
          </button>
          <button onClick={onClose} className="btn-secondary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
