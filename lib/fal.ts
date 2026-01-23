import type { GenerationRequest, GenerationResult, Strength } from './types';

interface FalImageResult {
  images: { url: string }[];
}

interface FalUpscaleResult {
  image: { url: string };
}

interface FalQueueResponse {
  request_id?: string;
  status?: string;
  error?: string;
}

const STRENGTH_TO_DENOISE: Record<Strength, number> = {
  low: 0.3,
  medium: 0.5,
  high: 0.7,
};

const ASPECT_RATIO_TO_SIZE: Record<string, { width: number; height: number }> = {
  '1:1': { width: 1024, height: 1024 },
  '16:9': { width: 1344, height: 768 },
  '9:16': { width: 768, height: 1344 },
  '4:3': { width: 1152, height: 896 },
  '3:4': { width: 896, height: 1152 },
  '3:2': { width: 1216, height: 832 },
  '2:3': { width: 832, height: 1216 },
  '4:5': { width: 896, height: 1088 },
  '5:4': { width: 1088, height: 896 },
  '21:9': { width: 1536, height: 640 },
};

const MAX_RETRIES = 3;
const RETRY_DELAYS = [2000, 4000, 6000];

export class FalClient {
  private apiKey: string;
  private baseUrl = 'https://queue.fal.run';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generate(request: GenerationRequest): Promise<GenerationResult[]> {
    const hasReferences = request.referenceImages.length > 0;

    let imageUrl: string;
    if (hasReferences) {
      imageUrl = await this.generateImg2Img(request);
    } else {
      imageUrl = await this.generateText2Img(request);
    }

    // Handle upscaling for higher resolutions
    if (request.resolution === '2K') {
      imageUrl = await this.upscale(imageUrl, 2);
    } else if (request.resolution === '4K') {
      imageUrl = await this.upscale(imageUrl, 4);
    }

    // Convert URL to base64
    const imageData = await this.fetchImageAsBase64(imageUrl);

    return [
      {
        imageData,
        mimeType: 'image/png',
      },
    ];
  }

  private async generateText2Img(request: GenerationRequest): Promise<string> {
    const size = ASPECT_RATIO_TO_SIZE[request.aspectRatio] || ASPECT_RATIO_TO_SIZE['1:1'];

    const payload = {
      prompt: request.prompt,
      image_size: {
        width: size.width,
        height: size.height,
      },
      num_images: 1,
      enable_safety_checker: false,
    };

    const result = await this.callFalWithRetry<FalImageResult>('fal-ai/bytedance/seedream/v4.5/text-to-image', payload);
    return result.images[0].url;
  }

  private async generateImg2Img(request: GenerationRequest): Promise<string> {
    const size = ASPECT_RATIO_TO_SIZE[request.aspectRatio] || ASPECT_RATIO_TO_SIZE['1:1'];
    const firstRef = request.referenceImages[0];
    const strength = STRENGTH_TO_DENOISE[firstRef.strength];

    // Convert base64 to data URL for the reference image
    const imageDataUrl = `data:${firstRef.mimeType};base64,${firstRef.data}`;

    const payload = {
      prompt: request.prompt,
      image_url: imageDataUrl,
      image_size: {
        width: size.width,
        height: size.height,
      },
      strength,
      num_images: 1,
      enable_safety_checker: false,
    };

    const result = await this.callFalWithRetry<FalImageResult>('fal-ai/bytedance/seedream/v4.5/edit', payload);
    return result.images[0].url;
  }

  private async upscale(imageUrl: string, scale: number): Promise<string> {
    const payload = {
      image_url: imageUrl,
      scale,
    };

    const result = await this.callFalWithRetry<FalUpscaleResult>('fal-ai/esrgan', payload);
    return result.image.url;
  }

  private async callFalWithRetry<T>(
    endpoint: string,
    payload: Record<string, unknown>,
    attempt: number = 0
  ): Promise<T> {
    try {
      // Submit the request
      const submitResponse = await fetch(`${this.baseUrl}/${endpoint}`, {
        method: 'POST',
        headers: {
          Authorization: `Key ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!submitResponse.ok) {
        const errorText = await submitResponse.text();
        throw new Error(`Fal API error: ${submitResponse.status} - ${errorText}`);
      }

      const submitResult = (await submitResponse.json()) as T & FalQueueResponse;

      // If we get a request_id, we need to poll for the result
      if (submitResult.request_id) {
        return await this.pollForResult<T>(endpoint, submitResult.request_id);
      }

      // If we get the result directly, return it
      return submitResult;
    } catch (error) {
      if (attempt < MAX_RETRIES - 1) {
        await this.sleep(RETRY_DELAYS[attempt]);
        return this.callFalWithRetry<T>(endpoint, payload, attempt + 1);
      }
      throw error;
    }
  }

  private async pollForResult<T>(
    endpoint: string,
    requestId: string
  ): Promise<T> {
    const statusUrl = `${this.baseUrl}/${endpoint}/requests/${requestId}/status`;
    const resultUrl = `${this.baseUrl}/${endpoint}/requests/${requestId}`;

    // Poll for up to 5 minutes
    const maxAttempts = 60;
    const pollInterval = 5000;

    for (let i = 0; i < maxAttempts; i++) {
      await this.sleep(pollInterval);

      const statusResponse = await fetch(statusUrl, {
        headers: {
          Authorization: `Key ${this.apiKey}`,
        },
      });

      if (!statusResponse.ok) {
        continue;
      }

      const status = await statusResponse.json();

      if (status.status === 'COMPLETED') {
        const resultResponse = await fetch(resultUrl, {
          headers: {
            Authorization: `Key ${this.apiKey}`,
          },
        });

        if (!resultResponse.ok) {
          throw new Error(`Failed to fetch result: ${resultResponse.status}`);
        }

        return (await resultResponse.json()) as T;
      }

      if (status.status === 'FAILED') {
        throw new Error(`Fal generation failed: ${status.error || 'Unknown error'}`);
      }
    }

    throw new Error('Fal generation timed out');
  }

  private async fetchImageAsBase64(url: string): Promise<string> {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');

    return base64;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export function createFalClient(): FalClient {
  const apiKey = process.env.FAL_API_KEY;
  if (!apiKey) {
    throw new Error('FAL_API_KEY is not set');
  }
  return new FalClient(apiKey);
}
