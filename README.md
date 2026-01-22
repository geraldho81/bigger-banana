# Bigger Banana

A Next.js web application for AI image generation using Google's Gemini API. Port of the original Streamlit-based Big Banana app, designed for Vercel + Supabase deployment.

## Features

- Text-to-image generation via Gemini 3 Pro
- Reference image upload with drag-to-reorder
- Per-image strength control (low/medium/high)
- Multiple aspect ratios and resolutions
- Generation history with one-click reload
- "Luxury cinema" dark theme

## Quick Start

1. Clone and install dependencies:
   ```bash
   npm install
   ```

2. Copy environment template:
   ```bash
   cp .env.example .env.local
   ```

3. Add your API keys to `.env.local`

4. Run development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

- `GOOGLE_API_KEY` - Google Gemini API key
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key

## Deployment

Deploy to Vercel with one click or via CLI:

```bash
vercel
```

Ensure all environment variables are set in Vercel project settings.
