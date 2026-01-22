# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Bigger Banana is a Next.js 14+ web application for AI image generation using Google's Gemini API. It's a port of the original Streamlit-based Big Banana app, redesigned for deployment on Vercel with Supabase as the database backend.

**Core Features:**
- Text-to-image generation via Gemini 3 Pro
- Reference image upload with drag-to-reorder and per-image strength control
- Aspect ratio and resolution selection
- Generation history with click-to-reload
- "Luxury cinema" dark theme with gold accents

## Tech Stack

- **Framework:** Next.js 14+ (App Router)
- **Database:** Supabase (PostgreSQL)
- **Styling:** Tailwind CSS
- **API:** Google GenAI SDK (`@google/genai`)
- **Deployment:** Vercel

## Commands

```bash
# Development
npm run dev          # Start dev server at localhost:3000

# Build & Production
npm run build        # Build for production
npm run start        # Start production server

# Linting & Formatting
npm run lint         # ESLint check
npm run lint:fix     # ESLint auto-fix

# Database
npx supabase init              # Initialize Supabase locally
npx supabase db push           # Push migrations to Supabase
npx supabase gen types ts      # Generate TypeScript types from schema
```

## Architecture

```
bigger-banana/
├── app/
│   ├── layout.tsx           # Root layout with fonts, theme
│   ├── page.tsx             # Main single-page app
│   ├── globals.css          # Tailwind + custom theme
│   └── api/
│       ├── generate/route.ts    # POST: Gemini image generation
│       └── history/route.ts     # GET/POST/DELETE: History CRUD
├── components/
│   ├── PromptInput.tsx          # Text area with character count
│   ├── DimensionSelector.tsx    # Aspect ratio + resolution dropdowns
│   ├── ReferenceUploader.tsx    # Drag-to-reorder image upload
│   ├── OutputGrid.tsx           # Generated images display
│   ├── HistoryFeed.tsx          # Sidebar history list
│   └── FullsizeDialog.tsx       # Image preview modal
├── lib/
│   ├── gemini.ts            # Gemini API client wrapper
│   ├── supabase.ts          # Supabase client initialization
│   ├── image.ts             # Image encoding/processing utilities
│   └── types.ts             # TypeScript interfaces
├── supabase/
│   └── migrations/          # Database schema migrations
└── public/                  # Static assets
```

## Data Models

```typescript
interface ReferenceImage {
  data: string;        // Base64 encoded
  filename: string;
  mimeType: string;
  strength: 'low' | 'medium' | 'high';
}

interface GenerationRequest {
  prompt: string;
  aspectRatio: string;  // '1:1', '16:9', '9:16', '4:3', '3:4', '3:2', '2:3', '4:5', '5:4', '21:9'
  resolution: string;   // '1K', '2K', '4K'
  referenceImages: ReferenceImage[];
}

interface GenerationResult {
  imageData: string;    // Base64 encoded
  mimeType: string;
  seedUsed?: number;
}

interface HistoryEntry {
  id: string;
  createdAt: string;
  request: GenerationRequest;
  results: GenerationResult[];
  thumbnailB64?: string;
}
```

## API Routes

**POST /api/generate**
- Request: `GenerationRequest`
- Response: `{ results: GenerationResult[] }`
- Calls Gemini API with multimodal content (images + prompt)

**GET /api/history**
- Query: `?limit=50`
- Response: `{ entries: HistoryEntry[] }`

**POST /api/history**
- Request: `{ request: GenerationRequest, results: GenerationResult[] }`
- Response: `{ entry: HistoryEntry }`

**DELETE /api/history**
- Query: `?id=xxx` or no query to clear all
- Response: `{ success: boolean }`

## Environment Variables

Required in `.env.local` (and Vercel environment):
```
GOOGLE_API_KEY=your-gemini-api-key
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Design System

**Colors:**
- Background: `#0d0d0c` (primary), `#141412` (secondary), `#1a1917` (tertiary)
- Accent: `#c4a574` (gold)
- Text: `#f5f0e6` (primary), `#c9c4b8` (secondary), `#8a857a` (muted)

**Typography:**
- Display: Playfair Display (serif)
- Body: Plus Jakarta Sans (sans-serif)
- Labels: Uppercase, letter-spacing 0.1-0.25em

## Gemini API Integration

- Model: `gemini-3-pro-image-preview`
- Reference images sent as multimodal parts with strength hints in prompt
- Strength mapping:
  - `low` → "loosely inspired by"
  - `medium` → "based on the style of"
  - `high` → "closely matching the composition and style of"
- Retry logic: 3 attempts with exponential backoff (2s, 4s, 6s)

## Supabase Schema

```sql
create table history (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  prompt text not null,
  aspect_ratio text not null,
  resolution text not null,
  reference_images jsonb default '[]',
  results jsonb not null,
  thumbnail_b64 text
);

create index history_created_at_idx on history(created_at desc);
```

## State Management

Use React Context or Zustand for:
- `prompt` - Current prompt text
- `aspectRatio` - Selected ratio (default: '1:1')
- `resolution` - Selected resolution (default: '1K')
- `referenceImages` - Uploaded reference images array
- `generatedResults` - Generated images from last request
- `isGenerating` - Loading state flag
- `error` - Error message to display
