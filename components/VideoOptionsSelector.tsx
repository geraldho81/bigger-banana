'use client';

import { useStore } from '@/lib/store';
import { VIDEO_MODELS, getAvailableDurations, getAvailableAspects, getAvailableResolutions } from '@/lib/constants';
import type { VideoModel, VideoDuration, VideoAspectRatio, VideoResolution } from '@/lib/types';

const ASPECT_LABELS: Record<VideoAspectRatio, string> = {
  '16:9': '16:9 Landscape',
  '9:16': '9:16 Portrait',
  '1:1': '1:1 Square',
  '4:3': '4:3 Standard',
  '3:4': '3:4 Portrait',
};

const RESOLUTION_LABELS: Record<VideoResolution, string> = {
  '720p': '720p HD',
  '1080p': '1080p Full HD',
  '4k': '4K Ultra HD',
};

export function VideoOptionsSelector() {
  const {
    videoModel,
    videoDuration,
    videoAspectRatio,
    videoResolution,
    setVideoModel,
    setVideoDuration,
    setVideoAspectRatio,
    setVideoResolution,
  } = useStore();

  const availableDurations = getAvailableDurations(videoModel);
  const availableAspects = getAvailableAspects(videoModel);
  const availableResolutions = getAvailableResolutions(videoModel);

  // Auto-adjust duration if current selection is not available for the new model
  const handleModelChange = (newModel: VideoModel) => {
    setVideoModel(newModel);

    const newDurations = getAvailableDurations(newModel);
    if (!newDurations.includes(videoDuration)) {
      setVideoDuration(newDurations[0]);
    }

    const newAspects = getAvailableAspects(newModel);
    if (!newAspects.includes(videoAspectRatio)) {
      setVideoAspectRatio(newAspects[0]);
    }

    const newResolutions = getAvailableResolutions(newModel);
    if (newResolutions && !newResolutions.includes(videoResolution)) {
      setVideoResolution(newResolutions[0]);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="label-gold">Model</label>
        <select
          value={videoModel}
          onChange={(e) => handleModelChange(e.target.value as VideoModel)}
          className="input-base cursor-pointer"
        >
          {VIDEO_MODELS.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
              {option.hasAudio ? ' (with audio)' : ''}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label className="label-gold">Duration</label>
        <select
          value={videoDuration}
          onChange={(e) => setVideoDuration(Number(e.target.value) as VideoDuration)}
          className="input-base cursor-pointer"
        >
          {availableDurations.map((duration) => (
            <option key={duration} value={duration}>
              {duration} seconds
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label className="label-gold">Aspect Ratio</label>
        <select
          value={videoAspectRatio}
          onChange={(e) => setVideoAspectRatio(e.target.value as VideoAspectRatio)}
          className="input-base cursor-pointer"
        >
          {availableAspects.map((aspect) => (
            <option key={aspect} value={aspect}>
              {ASPECT_LABELS[aspect]}
            </option>
          ))}
        </select>
      </div>

      {availableResolutions && (
        <div className="space-y-2">
          <label className="label-gold">Resolution</label>
          <select
            value={videoResolution}
            onChange={(e) => setVideoResolution(e.target.value as VideoResolution)}
            className="input-base cursor-pointer"
          >
            {availableResolutions.map((res) => (
              <option key={res} value={res}>
                {RESOLUTION_LABELS[res]}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
