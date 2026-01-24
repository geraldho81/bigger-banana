'use client';

import { Loader2 } from 'lucide-react';
import type { VideoJobStatus } from '@/lib/types';

interface GenerationProgressProps {
  status: VideoJobStatus | null;
  isGenerating: boolean;
}

export function GenerationProgress({ status, isGenerating }: GenerationProgressProps) {
  if (!isGenerating) {
    return null;
  }

  const progress = status?.progress ?? 0;
  const statusText = getStatusText(status?.status);

  return (
    <div className="flex flex-col items-center justify-center rounded-2xl bg-bg-secondary p-8">
      <div className="relative mb-6">
        <Loader2 className="h-12 w-12 animate-spin text-accent-gold" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-medium text-accent-gold">
            {progress > 0 ? `${Math.round(progress)}%` : ''}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-4 h-2 w-full max-w-xs overflow-hidden rounded-full bg-bg-tertiary">
        <div
          className="h-full rounded-full bg-accent-gold transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <p className="text-sm text-text-secondary">{statusText}</p>

      {status?.status === 'processing' && (
        <p className="mt-2 text-xs text-text-muted">
          Video generation may take a few minutes...
        </p>
      )}
    </div>
  );
}

function getStatusText(status: VideoJobStatus['status'] | undefined): string {
  switch (status) {
    case 'pending':
      return 'Starting generation...';
    case 'processing':
      return 'Generating video...';
    case 'completed':
      return 'Completed!';
    case 'failed':
      return 'Generation failed';
    default:
      return 'Generating...';
  }
}
