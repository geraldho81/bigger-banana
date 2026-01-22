'use client';

import { useState } from 'react';
import { Download, Copy, Maximize2, Sparkles } from 'lucide-react';
import { useStore } from '@/lib/store';
import { imageToDataUrl, downloadImage, copyImageToClipboard } from '@/lib/image';
import { FullsizeDialog } from './FullsizeDialog';

export function OutputGrid() {
  const { generatedResults, isGenerating } = useStore();
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);

  const handleDownload = (index: number) => {
    const result = generatedResults[index];
    const ext = result.mimeType.split('/')[1] || 'png';
    downloadImage(result.imageData, result.mimeType, `generation-${Date.now()}.${ext}`);
  };

  const handleCopy = async (index: number) => {
    const result = generatedResults[index];
    try {
      await copyImageToClipboard(result.imageData, result.mimeType);
      setCopyStatus('Copied!');
      setTimeout(() => setCopyStatus(null), 2000);
    } catch {
      setCopyStatus('Failed');
      setTimeout(() => setCopyStatus(null), 2000);
    }
  };

  // Loading state
  if (isGenerating) {
    return (
      <div className="flex h-full flex-col items-center justify-center space-y-6 py-12">
        <div className="shimmer-loading h-64 w-64 rounded-2xl" />
        <div className="flex items-center gap-3 text-text-secondary">
          <Sparkles className="h-5 w-5 animate-pulse text-accent-gold" />
          <span className="font-display text-lg italic">Creating your vision...</span>
        </div>
      </div>
    );
  }

  // Empty state
  if (generatedResults.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center space-y-4 py-12 text-center">
        <div className="rounded-full bg-bg-tertiary p-6">
          <Sparkles className="h-8 w-8 text-accent-gold" />
        </div>
        <div>
          <h3 className="font-display text-xl text-text-primary">Your creation awaits</h3>
          <p className="mt-2 text-sm text-text-muted">
            Describe your vision and click Generate
          </p>
        </div>
      </div>
    );
  }

  // Results display
  return (
    <>
      <div className="space-y-6">
        {generatedResults.map((result, index) => {
          const dataUrl = imageToDataUrl(result.imageData, result.mimeType);

          return (
            <div key={index} className="animate-fade-in space-y-3">
              <div className="image-frame">
                <img
                  src={dataUrl}
                  alt={`Generated image ${index + 1}`}
                  className="w-full"
                />
              </div>

              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => setSelectedImageIndex(index)}
                  className="btn-secondary text-sm"
                >
                  <Maximize2 className="h-4 w-4" />
                  View Full Size
                </button>
                <button
                  onClick={() => handleDownload(index)}
                  className="btn-secondary text-sm"
                >
                  <Download className="h-4 w-4" />
                  Download
                </button>
                <button
                  onClick={() => handleCopy(index)}
                  className="btn-secondary text-sm"
                >
                  <Copy className="h-4 w-4" />
                  {copyStatus || 'Copy'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Full-size dialog */}
      {selectedImageIndex !== null && (
        <FullsizeDialog
          result={generatedResults[selectedImageIndex]}
          onClose={() => setSelectedImageIndex(null)}
          onDownload={() => handleDownload(selectedImageIndex)}
          onCopy={() => handleCopy(selectedImageIndex)}
        />
      )}
    </>
  );
}
