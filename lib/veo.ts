import type { VideoGenerationRequest, VideoGenerationResult, VideoJobStatus, VideoAspectRatio, VideoResolution } from './types';

const ASPECT_RATIO_MAP: Record<VideoAspectRatio, string> = {
  '16:9': '16:9',
  '9:16': '9:16',
  '1:1': '1:1',
  '4:3': '4:3',
  '3:4': '3:4',
};

const RESOLUTION_MAP: Record<VideoResolution, string> = {
  '720p': '720p',
  '1080p': '1080p',
  '4k': '4k',
};

const DURATION_TO_SECONDS: Record<number, number> = {
  4: 4,
  6: 6,
  8: 8,
};

interface VeoGenerateResponse {
  name: string; // Operation ID / job ID
}

interface VeoOperationResponse {
  name: string;
  done: boolean;
  metadata?: {
    progress?: number;
  };
  error?: {
    code: number;
    message: string;
  };
  response?: {
    generatedSamples: Array<{
      video: {
        uri: string;
      };
    }>;
  };
}

export class VeoClient {
  private apiKey: string;
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Start a video generation job. Returns a job ID that can be polled for status.
   */
  async startGeneration(request: VideoGenerationRequest): Promise<string> {
    const aspectRatio = ASPECT_RATIO_MAP[request.aspectRatio] || '16:9';
    const resolution = request.resolution ? RESOLUTION_MAP[request.resolution] : '1080p';
    const durationSeconds = DURATION_TO_SECONDS[request.duration] || 6;

    const response = await fetch(
      `${this.baseUrl}/models/veo-3.1-generate-preview:generateVideo?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          instances: [
            {
              prompt: request.prompt,
            },
          ],
          parameters: {
            aspectRatio,
            resolution,
            durationSeconds,
            personGeneration: 'allow_adult',
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Veo API error: ${response.status} - ${errorText}`);
    }

    const data = (await response.json()) as VeoGenerateResponse;

    // Extract operation/job ID from the response name
    // Format is usually "operations/{operation_id}"
    const jobId = data.name.includes('/') ? data.name.split('/').pop()! : data.name;
    return jobId;
  }

  /**
   * Get the status of a video generation job.
   */
  async getJobStatus(jobId: string): Promise<VideoJobStatus> {
    const response = await fetch(
      `${this.baseUrl}/operations/${jobId}?key=${this.apiKey}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Veo API error: ${response.status} - ${errorText}`);
    }

    const data = (await response.json()) as VeoOperationResponse;

    if (data.error) {
      return {
        jobId,
        status: 'failed',
        error: data.error.message,
      };
    }

    if (data.done) {
      if (data.response?.generatedSamples?.[0]?.video?.uri) {
        const videoUri = data.response.generatedSamples[0].video.uri;

        return {
          jobId,
          status: 'completed',
          progress: 100,
          result: {
            videoUrl: videoUri,
            mimeType: 'video/mp4',
            duration: 0, // Will be determined from actual video
            hasAudio: true, // Veo 3.1 supports audio
          },
        };
      }
      return {
        jobId,
        status: 'failed',
        error: 'No video in response',
      };
    }

    // Still processing
    return {
      jobId,
      status: 'processing',
      progress: data.metadata?.progress || 0,
    };
  }

  /**
   * Poll for job completion with timeout.
   * @param jobId The job ID to poll
   * @param maxWaitMs Maximum time to wait in milliseconds (default: 5 minutes)
   * @param pollIntervalMs Polling interval in milliseconds (default: 5 seconds)
   */
  async waitForCompletion(
    jobId: string,
    maxWaitMs: number = 300000,
    pollIntervalMs: number = 5000
  ): Promise<VideoJobStatus> {
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitMs) {
      const status = await this.getJobStatus(jobId);

      if (status.status === 'completed' || status.status === 'failed') {
        return status;
      }

      await this.sleep(pollIntervalMs);
    }

    return {
      jobId,
      status: 'failed',
      error: 'Timeout waiting for video generation',
    };
  }

  /**
   * Fetch video data as base64 from a URL.
   */
  async fetchVideoAsBase64(url: string): Promise<string> {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch video: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer).toString('base64');
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export function createVeoClient(): VeoClient {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error('GOOGLE_API_KEY is not set');
  }
  return new VeoClient(apiKey);
}
