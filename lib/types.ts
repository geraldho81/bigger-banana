export type Strength = 'low' | 'medium' | 'high';

export type AspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4' | '3:2' | '2:3' | '4:5' | '5:4' | '21:9';

export type Resolution = '1K' | '2K' | '4K';

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
}

export interface GenerationResult {
  imageData: string; // Base64 encoded
  mimeType: string;
  seedUsed?: number;
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
