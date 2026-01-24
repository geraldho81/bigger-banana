export type Strength = 'low' | 'medium' | 'high';

export type AspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4' | '3:2' | '2:3' | '4:5' | '5:4' | '21:9';

export type Resolution = '1K' | '2K' | '4K';

export type Model = 'nanobanana-pro' | 'fal-seedream';

// Media type for toggling between image and video generation
export type MediaType = 'image' | 'video';

// Video-specific types
export type VideoModel = 'kling-2.6-pro' | 'wan-2.6' | 'veo-3.1';
export type VideoDuration = 4 | 5 | 6 | 8 | 10 | 15;
export type VideoResolution = '720p' | '1080p' | '4k';
export type VideoAspectRatio = '16:9' | '9:16' | '1:1' | '4:3' | '3:4';

export interface ReferenceImage {
  id: string;
  data: string; // Base64 encoded
  filename: string;
  mimeType: string;
  strength: Strength;
  thumbnailUrl?: string;
}

export interface GenerationRequest {
  prompt: string;
  aspectRatio: AspectRatio;
  resolution: Resolution;
  referenceImages: ReferenceImage[];
  model: Model;
}

export interface GenerationResult {
  imageData: string; // Base64 encoded
  mimeType: string;
  seedUsed?: number;
}

export interface GenerateResponse {
  results: GenerationResult[];
  error?: string;
}

export interface HistoryResponse {
  entries: HistoryEntry[];
  error?: string;
}

export interface HistoryCreateResponse {
  entry: HistoryEntry;
  error?: string;
}

export const ASPECT_RATIOS: { value: AspectRatio; label: string }[] = [
  { value: '1:1', label: '1:1 Square' },
  { value: '16:9', label: '16:9 Landscape' },
  { value: '9:16', label: '9:16 Portrait' },
  { value: '4:3', label: '4:3 Standard' },
  { value: '3:4', label: '3:4 Portrait' },
  { value: '3:2', label: '3:2 Photo' },
  { value: '2:3', label: '2:3 Portrait' },
  { value: '4:5', label: '4:5 Instagram' },
  { value: '5:4', label: '5:4 Landscape' },
  { value: '21:9', label: '21:9 Cinematic' },
];

export const RESOLUTIONS: { value: Resolution; label: string }[] = [
  { value: '1K', label: '1K (1024px)' },
  { value: '2K', label: '2K (2048px)' },
  { value: '4K', label: '4K (4096px)' },
];

export const STRENGTH_LABELS: Record<Strength, string> = {
  low: 'Loosely inspired',
  medium: 'Based on style',
  high: 'Closely matching',
};

export const MODELS: { value: Model; label: string }[] = [
  { value: 'nanobanana-pro', label: 'Nano Banana Pro' },
  { value: 'fal-seedream', label: 'Seedream (Fal)' },
];

// Video generation types
export interface VideoGenerationRequest {
  prompt: string;
  model: VideoModel;
  duration: VideoDuration;
  aspectRatio: VideoAspectRatio;
  resolution?: VideoResolution;
}

export interface VideoGenerationResult {
  videoUrl?: string;
  videoData?: string; // Base64 encoded
  mimeType: string;
  duration: number;
  hasAudio?: boolean;
}

export interface VideoJobStatus {
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number;
  result?: VideoGenerationResult;
  error?: string;
}

export interface VideoGenerateResponse {
  result?: VideoGenerationResult;
  jobId?: string; // For async models like Veo
  error?: string;
}

export interface HistoryEntry {
  id: string;
  createdAt: string;
  prompt: string;
  aspectRatio: AspectRatio;
  resolution: Resolution;
  referenceImages: ReferenceImage[];
  results: GenerationResult[];
  thumbnailB64?: string;
  model?: Model;
  // Video-specific fields
  mediaType?: MediaType;
  videoModel?: VideoModel;
  videoDuration?: VideoDuration;
  videoAspectRatio?: VideoAspectRatio;
  videoResolution?: VideoResolution;
  videoResult?: VideoGenerationResult;
}
