'use client';

import { useStore } from '@/lib/store';
import { Image, Video } from 'lucide-react';
import type { MediaType } from '@/lib/types';

export function MediaTypeToggle() {
  const { mediaType, setMediaType } = useStore();

  const handleToggle = (type: MediaType) => {
    setMediaType(type);
  };

  return (
    <div className="mb-6">
      <div className="inline-flex rounded-lg border border-text-muted/20 bg-bg-secondary p-1">
        <button
          onClick={() => handleToggle('image')}
          className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all ${
            mediaType === 'image'
              ? 'bg-accent-gold text-bg-primary'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          <Image className="h-4 w-4" />
          Image
        </button>
        <button
          onClick={() => handleToggle('video')}
          className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all ${
            mediaType === 'video'
              ? 'bg-accent-gold text-bg-primary'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          <Video className="h-4 w-4" />
          Video
        </button>
      </div>
    </div>
  );
}
