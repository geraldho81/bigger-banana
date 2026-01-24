import type { VideoModel, VideoAspectRatio, VideoResolution, VideoDuration } from './types';

export interface VideoModelConfig {
  id: VideoModel;
  label: string;
  durations: VideoDuration[];
  aspects: VideoAspectRatio[];
  resolutions?: VideoResolution[];
  isAsync?: boolean;
  hasAudio?: boolean;
}

export const VIDEO_MODELS: VideoModelConfig[] = [
  {
    id: 'kling-2.6-pro',
    label: 'Kling 2.6 Pro',
    durations: [5, 10],
    aspects: ['16:9', '9:16', '1:1'],
    hasAudio: true,
  },
  {
    id: 'wan-2.6',
    label: 'Wan 2.6',
    durations: [5, 10, 15],
    aspects: ['16:9', '9:16', '1:1', '4:3', '3:4'],
    resolutions: ['720p', '1080p'],
  },
  {
    id: 'veo-3.1',
    label: 'Veo 3.1',
    durations: [4, 6, 8],
    aspects: ['16:9', '9:16'],
    resolutions: ['720p', '1080p', '4k'],
    isAsync: true,
  },
];

export function getVideoModelConfig(modelId: VideoModel): VideoModelConfig | undefined {
  return VIDEO_MODELS.find((m) => m.id === modelId);
}

export function getAvailableDurations(modelId: VideoModel): VideoDuration[] {
  const config = getVideoModelConfig(modelId);
  return config?.durations || [5];
}

export function getAvailableAspects(modelId: VideoModel): VideoAspectRatio[] {
  const config = getVideoModelConfig(modelId);
  return config?.aspects || ['16:9'];
}

export function getAvailableResolutions(modelId: VideoModel): VideoResolution[] | undefined {
  const config = getVideoModelConfig(modelId);
  return config?.resolutions;
}

export function isAsyncModel(modelId: VideoModel): boolean {
  const config = getVideoModelConfig(modelId);
  return config?.isAsync || false;
}
