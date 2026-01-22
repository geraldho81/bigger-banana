'use client';

import { useStore } from '@/lib/store';

export function PromptInput() {
  const { prompt, setPrompt } = useStore();

  const charCount = prompt.length;
  const charColor =
    charCount === 0
      ? 'text-text-muted'
      : charCount < 50
        ? 'text-accent-gold'
        : charCount < 200
          ? 'text-text-secondary'
          : 'text-text-primary';

  return (
    <div className="space-y-2">
      <label className="label-gold">Your Vision</label>
      <div className="relative">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe your image in detail... Include style, mood, composition, colors, and any specific elements you want to see."
          className="input-base min-h-[180px] resize-none font-body text-base leading-relaxed"
        />
        <div className={`absolute bottom-3 right-3 text-xs ${charColor}`}>
          {charCount} characters
        </div>
      </div>
    </div>
  );
}
