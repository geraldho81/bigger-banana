'use client';

import { useStore } from '@/lib/store';
import { ASPECT_RATIOS, RESOLUTIONS } from '@/lib/types';

export function DimensionSelector() {
  const { aspectRatio, resolution, setAspectRatio, setResolution } = useStore();

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="label-gold">Aspect Ratio</label>
        <select
          value={aspectRatio}
          onChange={(e) => setAspectRatio(e.target.value as typeof aspectRatio)}
          className="input-base cursor-pointer"
        >
          {ASPECT_RATIOS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label className="label-gold">Resolution</label>
        <select
          value={resolution}
          onChange={(e) => setResolution(e.target.value as typeof resolution)}
          className="input-base cursor-pointer"
        >
          {RESOLUTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
