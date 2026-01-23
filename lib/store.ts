import { create } from 'zustand';
import type {
  AspectRatio,
  Resolution,
  ReferenceImage,
  GenerationResult,
  HistoryEntry,
  GenerationRequest,
  Model,
} from './types';
import { createThumbnail } from './image';

interface AppState {
  // Form state
  prompt: string;
  aspectRatio: AspectRatio;
  resolution: Resolution;
  referenceImages: ReferenceImage[];
  model: Model;

  // Generation state
  generatedResults: GenerationResult[];
  isGenerating: boolean;
  error: string | null;

  // Actions
  setPrompt: (prompt: string) => void;
  setAspectRatio: (aspectRatio: AspectRatio) => void;
  setResolution: (resolution: Resolution) => void;
  setReferenceImages: (images: ReferenceImage[]) => void;
  setModel: (model: Model) => void;
  setGeneratedResults: (results: GenerationResult[]) => void;
  setError: (error: string | null) => void;
  clearError: () => void;

  // Generation
  generate: () => Promise<void>;

  // History
  loadFromHistory: (entry: HistoryEntry) => void;
  saveToHistory: (request: GenerationRequest, results: GenerationResult[]) => Promise<void>;
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

  // Setters
  setPrompt: (prompt) => set({ prompt }),
  setAspectRatio: (aspectRatio) => set({ aspectRatio }),
  setResolution: (resolution) => set({ resolution }),
  setReferenceImages: (referenceImages) => set({ referenceImages }),
  setModel: (model) => set({ model }),
  setGeneratedResults: (generatedResults) => set({ generatedResults }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),

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

  // Load from history
  loadFromHistory: (entry) => {
    set({
      prompt: entry.prompt,
      aspectRatio: entry.aspectRatio,
      resolution: entry.resolution,
      referenceImages: entry.referenceImages,
      model: entry.model || 'nanobanana-pro',
      generatedResults: entry.results,
      error: null,
    });
  },

  // Save to history
  saveToHistory: async (request, results) => {
    try {
      // Create thumbnail from first result
      let thumbnailB64: string | undefined;
      if (results.length > 0 && typeof window !== 'undefined') {
        try {
          thumbnailB64 = await createThumbnail(
            results[0].imageData,
            results[0].mimeType
          );
        } catch {
          // Thumbnail creation failed, continue without it
        }
      }

      await fetch('/api/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request, results, thumbnailB64 }),
      });
    } catch (error) {
      console.error('Failed to save to history:', error);
    }
  },
}));
