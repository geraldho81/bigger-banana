import { GoogleGenerativeAI, Part } from '@google/generative-ai';
import type { GenerationRequest, GenerationResult, ReferenceImage, Strength } from './types';

const STRENGTH_PROMPTS: Record<Strength, string> = {
  low: 'loosely inspired by',
  medium: 'based on the style of',
  high: 'closely matching the composition and style of',
};

const ASPECT_RATIO_DESCRIPTIONS: Record<string, string> = {
  '1:1': 'square (1:1 aspect ratio)',
  '16:9': 'wide landscape (16:9 aspect ratio)',
  '9:16': 'tall portrait (9:16 aspect ratio)',
  '4:3': 'standard landscape (4:3 aspect ratio)',
  '3:4': 'standard portrait (3:4 aspect ratio)',
  '3:2': 'classic photo landscape (3:2 aspect ratio)',
  '2:3': 'classic photo portrait (2:3 aspect ratio)',
  '4:5': 'social media portrait (4:5 aspect ratio)',
  '5:4': 'social media landscape (5:4 aspect ratio)',
  '21:9': 'ultrawide cinematic (21:9 aspect ratio)',
};

const MAX_RETRIES = 3;
const RETRY_DELAYS = [2000, 4000, 6000]; // Exponential backoff

export class GeminiClient {
  private client: GoogleGenerativeAI;

  constructor(apiKey: string) {
    this.client = new GoogleGenerativeAI(apiKey);
  }

  async generate(request: GenerationRequest): Promise<GenerationResult[]> {
    const parts = this.createContentParts(request);
    const result = await this.generateWithRetry(parts, request);
    return result ? [result] : [];
  }

  private createContentParts(request: GenerationRequest): Part[] {
    const parts: Part[] = [];

    // Add reference images
    for (const ref of request.referenceImages) {
      parts.push({
        inlineData: {
          mimeType: ref.mimeType,
          data: ref.data,
        },
      });
    }

    // Build prompt with aspect ratio and reference hints
    const promptWithContext = this.buildFullPrompt(request);
    parts.push({ text: promptWithContext });

    return parts;
  }

  private buildFullPrompt(request: GenerationRequest): string {
    const aspectDesc = ASPECT_RATIO_DESCRIPTIONS[request.aspectRatio] || request.aspectRatio;

    let prompt = `Generate a ${aspectDesc} image.\n\n${request.prompt}`;

    // Add reference hints if there are reference images
    if (request.referenceImages.length > 0) {
      const refHints = request.referenceImages
        .map((ref, index) => {
          const strengthHint = STRENGTH_PROMPTS[ref.strength];
          return `Reference image ${index + 1}: ${strengthHint}`;
        })
        .join('. ');

      prompt = `${prompt}\n\n${refHints}`;
    }

    return prompt;
  }

  private async generateWithRetry(
    parts: Part[],
    request: GenerationRequest,
    attempt: number = 0
  ): Promise<GenerationResult | null> {
    try {
      // Use Gemini 2.0 Flash for image generation
      const model = this.client.getGenerativeModel({
        model: 'gemini-2.0-flash-exp',
        generationConfig: {
          // @ts-expect-error - responseModalities is valid for imagen but not typed
          responseModalities: ['TEXT', 'IMAGE'],
        },
      });

      const response = await model.generateContent({
        contents: [{ role: 'user', parts }],
      });

      const result = response.response;
      const candidates = result.candidates;

      if (!candidates || candidates.length === 0) {
        throw new Error('No candidates in response');
      }

      const content = candidates[0].content;
      if (!content || !content.parts) {
        throw new Error('No content in response');
      }

      for (const part of content.parts) {
        if (part.inlineData) {
          return {
            imageData: part.inlineData.data || '',
            mimeType: part.inlineData.mimeType || 'image/png',
          };
        }
      }

      throw new Error('No image found in response. The model may have returned text only.');
    } catch (error) {
      if (attempt < MAX_RETRIES - 1) {
        await this.sleep(RETRY_DELAYS[attempt]);
        return this.generateWithRetry(parts, request, attempt + 1);
      }
      throw error;
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async testConnection(): Promise<boolean> {
    try {
      const model = this.client.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
      const response = await model.generateContent('Hello');
      return !!response.response.candidates;
    } catch {
      return false;
    }
  }
}

export function createGeminiClient(): GeminiClient {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error('GOOGLE_API_KEY is not set');
  }
  return new GeminiClient(apiKey);
}
