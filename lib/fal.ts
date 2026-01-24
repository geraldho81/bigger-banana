import type { GenerationRequest, GenerationResult, Strength, VideoGenerationRequest, VideoGenerationResult, VideoAspectRatio, VideoResolution } from './types';

interface FalImageResult {
  images: { url: string }[];
}

interface FalUpscaleResult {
  image: { url: string };
}

interface FalVideoResult {
  video: { url: string };
}

const VIDEO_ASPECT_RATIO_MAP: Record<VideoAspectRatio, string> = {
  '16:9': '16:9',
  '9:16': '9:16',
  '1:1': '1:1',
  '4:3': '4:3',
  '3:4': '3:4',
};

const VIDEO_RESOLUTION_MAP: Record<VideoResolution, number> = {
  '720p': 720,
  '1080p': 1080,
  '4k': 2160,
};

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
  private baseUrl = 'https://fal.run';

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

    const result = await this.callFal<FalImageResult>('fal-ai/bytedance/seedream/v4.5/text-to-image', payload);
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

    const result = await this.callFal<FalImageResult>('fal-ai/bytedance/seedream/v4.5/edit', payload);
    return result.images[0].url;
  }

  private async upscale(imageUrl: string, scale: number): Promise<string> {
    const payload = {
      image_url: imageUrl,
      scale,
    };

    const result = await this.callFal<FalUpscaleResult>('fal-ai/esrgan', payload);
    return result.image.url;
  }

  private async callFal<T>(
    endpoint: string,
    payload: Record<string, unknown>,
    attempt: number = 0
  ): Promise<T> {
    try {
      const response = await fetch(`${this.baseUrl}/${endpoint}`, {
        method: 'POST',
        headers: {
          Authorization: `Key ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Fal API error: ${response.status} - ${errorText}`);
      }

      return (await response.json()) as T;
    } catch (error) {
      if (attempt < MAX_RETRIES - 1) {
        await this.sleep(RETRY_DELAYS[attempt]);
        return this.callFal<T>(endpoint, payload, attempt + 1);
      }
      throw error;
    }
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

  // Video generation methods

  async generateVideoKling(request: VideoGenerationRequest): Promise<VideoGenerationResult> {
    const aspectRatio = VIDEO_ASPECT_RATIO_MAP[request.aspectRatio] || '16:9';
    const duration = request.duration === 10 ? '10' : '5';

    const payload = {
      prompt: request.prompt,
      aspect_ratio: aspectRatio,
      duration,
    };

    const result = await this.callFal<FalVideoResult>(
      'fal-ai/kling-video/v2.6/pro/text-to-video',
      payload
    );

    return {
      videoUrl: result.video.url,
      mimeType: 'video/mp4',
      duration: request.duration,
      hasAudio: true, // Kling 2.6 Pro has native audio
    };
  }

  async generateVideoWan(request: VideoGenerationRequest): Promise<VideoGenerationResult> {
    const aspectRatio = VIDEO_ASPECT_RATIO_MAP[request.aspectRatio] || '16:9';
    const resolution = VIDEO_RESOLUTION_MAP[request.resolution || '720p'] || 720;

    // Wan duration is in frames at 24fps
    const frames = request.duration * 24;

    const payload = {
      prompt: request.prompt,
      aspect_ratio: aspectRatio,
      resolution,
      num_frames: Math.min(frames, 360), // Max 360 frames (15s at 24fps)
    };

    const result = await this.callFal<FalVideoResult>(
      'fal-ai/wan/v2.6/text-to-video',
      payload
    );

    return {
      videoUrl: result.video.url,
      mimeType: 'video/mp4',
      duration: request.duration,
      hasAudio: false,
    };
  }

  async fetchVideoAsBase64(url: string): Promise<string> {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch video: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer).toString('base64');
  }
}

export function createFalClient(): FalClient {
  const apiKey = process.env.FAL_API_KEY;
  if (!apiKey) {
    throw new Error('FAL_API_KEY is not set');
  }
  return new FalClient(apiKey);
}
