import { NextRequest, NextResponse } from 'next/server';
import { createGeminiClient } from '@/lib/gemini';
import type { GenerationRequest, GenerateResponse } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as GenerationRequest;

    // Validate request
    if (!body.prompt || body.prompt.trim() === '') {
      return NextResponse.json(
        { results: [], error: 'Prompt is required' } as GenerateResponse,
        { status: 400 }
      );
    }

    const client = createGeminiClient();
    const results = await client.generate(body);

    return NextResponse.json({ results } as GenerateResponse);
  } catch (error) {
    console.error('Generation error:', error);
    const message = error instanceof Error ? error.message : 'Generation failed';
    return NextResponse.json(
      { results: [], error: message } as GenerateResponse,
      { status: 500 }
    );
  }
}
