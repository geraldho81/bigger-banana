'use client';

import { Sparkles, Loader2, Video } from 'lucide-react';
import { useStore } from '@/lib/store';

export function GenerateButton() {
  const { prompt, isGenerating, generate, generateVideo, mediaType } = useStore();

  const isDisabled = isGenerating || !prompt.trim();

  const handleGenerate = () => {
    if (mediaType === 'video') {
      generateVideo();
    } else {
      generate();
    }
  };

  const buttonLabel = mediaType === 'video' ? 'Generate Video' : 'Generate';
  const generatingLabel = mediaType === 'video' ? 'Generating Video...' : 'Generating...';
  const Icon = mediaType === 'video' ? Video : Sparkles;

  return (
    <button
      onClick={handleGenerate}
      disabled={isDisabled}
      className="btn-primary w-full py-4 text-lg"
    >
      {isGenerating ? (
        <>
          <Loader2 className="h-5 w-5 animate-spin" />
          {generatingLabel}
        </>
      ) : (
        <>
          <Icon className="h-5 w-5" />
          {buttonLabel}
        </>
      )}
    </button>
  );
}
