import { NextRequest, NextResponse } from 'next/server';
import { createFalClient } from '@/lib/fal';
import { createVeoClient } from '@/lib/veo';
import type { VideoGenerationRequest, VideoGenerateResponse } from '@/lib/types';
import { isAsyncModel } from '@/lib/constants';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as VideoGenerationRequest;

    if (!body.prompt?.trim()) {
      return NextResponse.json(
        { error: 'Prompt is required' } as VideoGenerateResponse,
        { status: 400 }
      );
    }

    const { model } = body;

    // Route to appropriate provider
    if (model === 'veo-3.1') {
      // Veo is async - start generation and return job ID
      const veoClient = createVeoClient();
      const jobId = await veoClient.startGeneration(body);

      return NextResponse.json({
        jobId,
      } as VideoGenerateResponse);
    }

    // FAL-based models (Kling, Wan) are synchronous
    const falClient = createFalClient();

    let result;
    if (model === 'kling-2.6-pro') {
      result = await falClient.generateVideoKling(body);
    } else if (model === 'wan-2.6') {
      result = await falClient.generateVideoWan(body);
    } else {
      return NextResponse.json(
        { error: `Unknown model: ${model}` } as VideoGenerateResponse,
        { status: 400 }
      );
    }

    return NextResponse.json({
      result,
    } as VideoGenerateResponse);
  } catch (error) {
    console.error('Video generation error:', error);
    const message = error instanceof Error ? error.message : 'Video generation failed';
    return NextResponse.json(
      { error: message } as VideoGenerateResponse,
      { status: 500 }
    );
  }
}
