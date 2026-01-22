import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import type { HistoryEntry, HistoryResponse, HistoryCreateResponse, GenerationRequest, GenerationResult } from '@/lib/types';

// GET /api/history - Get history entries
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const supabase = createServerClient();

    const { data, error } = await supabase
      .from('history')
      .select('*')
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
    };

    const supabase = createServerClient();

    const { data, error } = await supabase
      .from('history')
      .insert({
        prompt: body.request.prompt,
        aspect_ratio: body.request.aspectRatio,
        resolution: body.request.resolution,
        reference_images: body.request.referenceImages,
        results: body.results,
        thumbnail_b64: body.thumbnailB64,
      })
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

// DELETE /api/history - Delete history entry or clear all
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    const supabase = createServerClient();

    if (id) {
      // Delete single entry
      const { error } = await supabase.from('history').delete().eq('id', id);
      if (error) throw error;
    } else {
      // Clear all entries
      const { error } = await supabase.from('history').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (error) throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('History delete error:', error);
    const message = error instanceof Error ? error.message : 'Failed to delete history';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
