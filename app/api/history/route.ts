import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase';
import type {
  HistoryEntry,
  HistoryResponse,
  HistoryCreateResponse,
  GenerationRequest,
  GenerationResult,
  MediaType,
  VideoModel,
  VideoDuration,
  VideoAspectRatio,
  VideoResolution,
  VideoGenerationResult,
} from '@/lib/types';

// GET /api/history - Get history entries
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const supabase = createRouteHandlerClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { entries: [], error: 'Unauthorized' } as HistoryResponse,
        { status: 401 }
      );
    }

    const { data, error } = await supabase
      .from('history')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    const entries: HistoryEntry[] = (data || []).map((row) => ({
      id: row.id,
      createdAt: row.created_at,
      prompt: row.prompt,
      aspectRatio: row.aspect_ratio,
      resolution: row.resolution,
      referenceImages: row.reference_images || [],
      results: row.results || [],
      thumbnailB64: row.thumbnail_b64,
      model: row.model || 'nanobanana-pro',
      // Video fields
      mediaType: row.media_type || 'image',
      videoModel: row.video_model,
      videoDuration: row.video_duration,
      videoAspectRatio: row.video_aspect_ratio,
      videoResolution: row.video_resolution,
      videoResult: row.video_result,
    }));

    return NextResponse.json({ entries } as HistoryResponse);
  } catch (error) {
    console.error('History fetch error:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch history';
    return NextResponse.json(
      { entries: [], error: message } as HistoryResponse,
      { status: 500 }
    );
  }
}

// POST /api/history - Create history entry
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      request: GenerationRequest;
      results: GenerationResult[];
      thumbnailB64?: string;
      // Video fields
      mediaType?: MediaType;
      videoModel?: VideoModel;
      videoDuration?: VideoDuration;
      videoAspectRatio?: VideoAspectRatio;
      videoResolution?: VideoResolution;
      videoResult?: VideoGenerationResult;
    };

    const supabase = createRouteHandlerClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { entry: null as unknown as HistoryEntry, error: 'Unauthorized' } as HistoryCreateResponse,
        { status: 401 }
      );
    }

    const insertData: Record<string, unknown> = {
      user_id: user.id,
      prompt: body.request.prompt,
      aspect_ratio: body.request.aspectRatio,
      resolution: body.request.resolution,
      reference_images: body.request.referenceImages,
      results: body.results,
      thumbnail_b64: body.thumbnailB64,
      model: body.request.model || 'nanobanana-pro',
      media_type: body.mediaType || 'image',
    };

    // Add video fields if this is a video entry
    if (body.mediaType === 'video') {
      insertData.video_model = body.videoModel;
      insertData.video_duration = body.videoDuration;
      insertData.video_aspect_ratio = body.videoAspectRatio;
      insertData.video_resolution = body.videoResolution;
      insertData.video_result = body.videoResult;
    }

    const { data, error } = await supabase
      .from('history')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      throw error;
    }

    const entry: HistoryEntry = {
      id: data.id,
      createdAt: data.created_at,
      prompt: data.prompt,
      aspectRatio: data.aspect_ratio,
      resolution: data.resolution,
      referenceImages: data.reference_images || [],
      results: data.results || [],
      thumbnailB64: data.thumbnail_b64,
      model: data.model || 'nanobanana-pro',
      // Video fields
      mediaType: data.media_type || 'image',
      videoModel: data.video_model,
      videoDuration: data.video_duration,
      videoAspectRatio: data.video_aspect_ratio,
      videoResolution: data.video_resolution,
      videoResult: data.video_result,
    };

    return NextResponse.json({ entry } as HistoryCreateResponse);
  } catch (error) {
    console.error('History create error:', error);
    const message = error instanceof Error ? error.message : 'Failed to create history entry';
    return NextResponse.json(
      { entry: null as unknown as HistoryEntry, error: message } as HistoryCreateResponse,
      { status: 500 }
    );
  }
}

// PATCH /api/history - Update history entry (rename)
export async function PATCH(request: NextRequest) {
  try {
    const body = (await request.json()) as { id: string; prompt: string };

    if (!body.id || !body.prompt) {
      return NextResponse.json(
        { success: false, error: 'ID and prompt are required' },
        { status: 400 }
      );
    }

    const supabase = createRouteHandlerClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { error } = await supabase
      .from('history')
      .update({ prompt: body.prompt })
      .eq('id', body.id)
      .eq('user_id', user.id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('History update error:', error);
    const message = error instanceof Error ? error.message : 'Failed to update history entry';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// DELETE /api/history - Delete history entry or clear all
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    const supabase = createRouteHandlerClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (id) {
      // Delete single entry
      const { error } = await supabase
        .from('history')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
      if (error) throw error;
    } else {
      // Clear all entries
      const { error } = await supabase
        .from('history')
        .delete()
        .eq('user_id', user.id);
      if (error) throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('History delete error:', error);
    const message = error instanceof Error ? error.message : 'Failed to delete history';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
