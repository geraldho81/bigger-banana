import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase';

export async function GET() {
  try {
    const supabase = createRouteHandlerClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ profile: null, error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_url, updated_at')
      .eq('id', user.id)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      const fallbackName = user.email?.split('@')[0] || 'Creator';
      const { data: created, error: createError } = await supabase
        .from('profiles')
        .insert({ id: user.id, display_name: fallbackName })
        .select('id, display_name, avatar_url, updated_at')
        .single();

      if (createError) {
        throw createError;
      }

      return NextResponse.json({ profile: created });
    }

    return NextResponse.json({ profile: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch profile';
    return NextResponse.json({ profile: null, error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = createRouteHandlerClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ profile: null, error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json()) as {
      displayName?: string;
      avatarUrl?: string;
    };

    const updates = {
      id: user.id,
      display_name: body.displayName?.trim() || null,
      avatar_url: body.avatarUrl?.trim() || null,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('profiles')
      .upsert(updates)
      .select('id, display_name, avatar_url, updated_at')
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ profile: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update profile';
    return NextResponse.json({ profile: null, error: message }, { status: 500 });
  }
}
