'use client';

import { Sparkles, Loader2 } from 'lucide-react';
import { useStore } from '@/lib/store';

export function GenerateButton() {
  const { prompt, isGenerating, generate } = useStore();

  const isDisabled = isGenerating || !prompt.trim();

  return (
    <button
      onClick={generate}
      disabled={isDisabled}
      className="btn-primary w-full py-4 text-lg"
    >
      {isGenerating ? (
        <>
          <Loader2 className="h-5 w-5 animate-spin" />
          Generating...
        </>
      ) : (
        <>
          <Sparkles className="h-5 w-5" />
          Generate
        </>
      )}
    </button>
  );
}
