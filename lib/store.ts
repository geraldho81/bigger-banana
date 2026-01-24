import { create } from 'zustand';
import type {
  AspectRatio,
  Resolution,
  ReferenceImage,
  GenerationResult,
  HistoryEntry,
  GenerationRequest,
  Model,
  MediaType,
  VideoModel,
  VideoDuration,
  VideoAspectRatio,
  VideoResolution,
  VideoGenerationResult,
  VideoGenerationRequest,
  VideoJobStatus,
} from './types';
import { createThumbnail, compressForHistory } from './image';
import { isAsyncModel } from './constants';

interface AppState {
  // Form state
  prompt: string;
  aspectRatio: AspectRatio;
  resolution: Resolution;
  referenceImages: ReferenceImage[];
  model: Model;

  // Media type toggle
  mediaType: MediaType;

  // Video-specific form state
  videoModel: VideoModel;
  videoDuration: VideoDuration;
  videoAspectRatio: VideoAspectRatio;
  videoResolution: VideoResolution;

  // Generation state
  generatedResults: GenerationResult[];
  isGenerating: boolean;
  error: string | null;

  // Video generation state
  videoResult: VideoGenerationResult | null;
  videoJobId: string | null;
  videoJobStatus: VideoJobStatus | null;

  // Actions
  setPrompt: (prompt: string) => void;
  setAspectRatio: (aspectRatio: AspectRatio) => void;
  setResolution: (resolution: Resolution) => void;
  setReferenceImages: (images: ReferenceImage[]) => void;
  setModel: (model: Model) => void;
  setGeneratedResults: (results: GenerationResult[]) => void;
  setError: (error: string | null) => void;
  clearError: () => void;

  // Video actions
  setMediaType: (mediaType: MediaType) => void;
  setVideoModel: (videoModel: VideoModel) => void;
  setVideoDuration: (duration: VideoDuration) => void;
  setVideoAspectRatio: (aspectRatio: VideoAspectRatio) => void;
  setVideoResolution: (resolution: VideoResolution) => void;
  setVideoResult: (result: VideoGenerationResult | null) => void;
  setVideoJobId: (jobId: string | null) => void;
  setVideoJobStatus: (status: VideoJobStatus | null) => void;

  // Generation
  generate: () => Promise<void>;
  generateVideo: () => Promise<void>;
  pollVideoStatus: () => Promise<void>;

  // History
  loadFromHistory: (entry: HistoryEntry) => void;
  saveToHistory: (request: GenerationRequest, results: GenerationResult[]) => Promise<void>;
  saveVideoToHistory: (request: VideoGenerationRequest, result: VideoGenerationResult) => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
  // Initial state
  prompt: '',
  aspectRatio: '1:1',
  resolution: '1K',
  referenceImages: [],
  model: 'nanobanana-pro',
  generatedResults: [],
  isGenerating: false,
  error: null,

  // Media type
  mediaType: 'image',

  // Video-specific initial state
  videoModel: 'kling-2.6-pro',
  videoDuration: 5,
  videoAspectRatio: '16:9',
  videoResolution: '1080p',
  videoResult: null,
  videoJobId: null,
  videoJobStatus: null,

  // Setters
  setPrompt: (prompt) => set({ prompt }),
  setAspectRatio: (aspectRatio) => set({ aspectRatio }),
  setResolution: (resolution) => set({ resolution }),
  setReferenceImages: (referenceImages) => set({ referenceImages }),
  setModel: (model) => set({ model }),
  setGeneratedResults: (generatedResults) => set({ generatedResults }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),

  // Video setters
  setMediaType: (mediaType) => set({ mediaType }),
  setVideoModel: (videoModel) => set({ videoModel }),
  setVideoDuration: (videoDuration) => set({ videoDuration }),
  setVideoAspectRatio: (videoAspectRatio) => set({ videoAspectRatio }),
  setVideoResolution: (videoResolution) => set({ videoResolution }),
  setVideoResult: (videoResult) => set({ videoResult }),
  setVideoJobId: (videoJobId) => set({ videoJobId }),
  setVideoJobStatus: (videoJobStatus) => set({ videoJobStatus }),

  // Generate action
  generate: async () => {
    const { prompt, aspectRatio, resolution, referenceImages, model } = get();

    if (!prompt.trim()) {
      set({ error: 'Please enter a prompt' });
      return;
    }

    set({ isGenerating: true, error: null, generatedResults: [] });

    try {
      const request: GenerationRequest = {
        prompt,
        aspectRatio,
        resolution,
        referenceImages,
        model,
      };

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      set({ generatedResults: data.results });

      // Save to history
      if (data.results.length > 0) {
        await get().saveToHistory(request, data.results);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Generation failed';
      set({ error: message });
    } finally {
      set({ isGenerating: false });
    }
  },

  // Generate video action
  generateVideo: async () => {
    const { prompt, videoModel, videoDuration, videoAspectRatio, videoResolution } = get();

    if (!prompt.trim()) {
      set({ error: 'Please enter a prompt' });
      return;
    }

    set({
      isGenerating: true,
      error: null,
      videoResult: null,
      videoJobId: null,
      videoJobStatus: null,
    });

    try {
      const request: VideoGenerationRequest = {
        prompt,
        model: videoModel,
        duration: videoDuration,
        aspectRatio: videoAspectRatio,
        resolution: videoResolution,
      };

      const response = await fetch('/api/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // For async models (Veo), start polling
      if (data.jobId) {
        set({
          videoJobId: data.jobId,
          videoJobStatus: { jobId: data.jobId, status: 'pending' },
        });
        // Start polling in background
        get().pollVideoStatus();
      } else if (data.result) {
        // Synchronous result (Kling, Wan)
        set({ videoResult: data.result, isGenerating: false });
        // Save to history
        await get().saveVideoToHistory(request, data.result);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Video generation failed';
      set({ error: message, isGenerating: false });
    }
  },

  // Poll video status for async generation (Veo)
  pollVideoStatus: async () => {
    const { videoJobId, prompt, videoModel, videoDuration, videoAspectRatio, videoResolution } = get();

    if (!videoJobId) return;

    const pollInterval = 5000; // 5 seconds
    const maxAttempts = 60; // 5 minutes max
    let attempts = 0;

    const poll = async () => {
      try {
        const response = await fetch(`/api/generate-video/status?jobId=${videoJobId}`);
        const status = await response.json();

        set({ videoJobStatus: status });

        if (status.status === 'completed' && status.result) {
          set({ videoResult: status.result, isGenerating: false });

          // Save to history
          const request: VideoGenerationRequest = {
            prompt,
            model: videoModel,
            duration: videoDuration,
            aspectRatio: videoAspectRatio,
            resolution: videoResolution,
          };
          await get().saveVideoToHistory(request, status.result);
          return;
        }

        if (status.status === 'failed') {
          set({ error: status.error || 'Video generation failed', isGenerating: false });
          return;
        }

        // Continue polling if still processing
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, pollInterval);
        } else {
          set({ error: 'Video generation timed out', isGenerating: false });
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Status check failed';
        set({ error: message, isGenerating: false });
      }
    };

    poll();
  },

  // Load from history
  loadFromHistory: (entry) => {
    // Check if this is a video entry
    if (entry.mediaType === 'video' && entry.videoResult) {
      set({
        prompt: entry.prompt,
        mediaType: 'video',
        videoModel: entry.videoModel || 'kling-2.6-pro',
        videoDuration: entry.videoDuration || 5,
        videoAspectRatio: entry.videoAspectRatio || '16:9',
        videoResolution: entry.videoResolution || '1080p',
        videoResult: entry.videoResult,
        generatedResults: [],
        error: null,
      });
    } else {
      // Image entry
      set({
        prompt: entry.prompt,
        mediaType: 'image',
        aspectRatio: entry.aspectRatio,
        resolution: entry.resolution,
        referenceImages: entry.referenceImages,
        model: entry.model || 'nanobanana-pro',
        generatedResults: entry.results,
        videoResult: null,
        error: null,
      });
    }
  },

  // Save to history
  saveToHistory: async (request, results) => {
    try {
      // Compress images for history storage (reduces size significantly)
      let compressedResults = results;
      let thumbnailB64: string | undefined;

      if (results.length > 0 && typeof window !== 'undefined') {
        try {
          // Compress each result image
          compressedResults = await Promise.all(
            results.map(async (result) => {
              const compressed = await compressForHistory(
                result.imageData,
                result.mimeType
              );
              return {
                ...result,
                imageData: compressed.data,
                mimeType: compressed.mimeType,
              };
            })
          );

          // Create thumbnail from first compressed result
          thumbnailB64 = await createThumbnail(
            compressedResults[0].imageData,
            compressedResults[0].mimeType
          );
        } catch (e) {
          console.error('Image compression failed:', e);
          // Fall back to original results
          compressedResults = results;
        }
      }

      const response = await fetch('/api/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request, results: compressedResults, thumbnailB64 }),
      });

      if (!response.ok) {
        const data = await response.json();
        console.error('History save failed:', response.status, data.error);
      }
    } catch (error) {
      console.error('Failed to save to history:', error);
    }
  },

  // Save video to history
  saveVideoToHistory: async (request, result) => {
    try {
      const response = await fetch('/api/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          request: {
            prompt: request.prompt,
            aspectRatio: '1:1', // Placeholder for compatibility
            resolution: '1K',
            referenceImages: [],
            model: 'nanobanana-pro',
          },
          results: [],
          mediaType: 'video',
          videoModel: request.model,
          videoDuration: request.duration,
          videoAspectRatio: request.aspectRatio,
          videoResolution: request.resolution,
          videoResult: result,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        console.error('Video history save failed:', response.status, data.error);
      }
    } catch (error) {
      console.error('Failed to save video to history:', error);
    }
  },
}));
