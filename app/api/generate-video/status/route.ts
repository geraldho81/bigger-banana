import { NextRequest, NextResponse } from 'next/server';
import { createVeoClient } from '@/lib/veo';
import type { VideoJobStatus } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');

    if (!jobId) {
      return NextResponse.json(
        { jobId: '', status: 'failed', error: 'Job ID is required' } as VideoJobStatus,
        { status: 400 }
      );
    }

    const veoClient = createVeoClient();
    const status = await veoClient.getJobStatus(jobId);

    return NextResponse.json(status);
  } catch (error) {
    console.error('Video status check error:', error);
    const message = error instanceof Error ? error.message : 'Status check failed';
    return NextResponse.json(
      { jobId: '', status: 'failed', error: message } as VideoJobStatus,
      { status: 500 }
    );
  }
}
