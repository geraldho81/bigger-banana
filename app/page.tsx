'use client';

import { PromptInput } from '@/components/PromptInput';
import { DimensionSelector } from '@/components/DimensionSelector';
import { ReferenceUploader } from '@/components/ReferenceUploader';
import { OutputGrid } from '@/components/OutputGrid';
import { HistoryFeed } from '@/components/HistoryFeed';
import { GenerateButton } from '@/components/GenerateButton';
import { useStore } from '@/lib/store';

export default function Home() {
  const { error, clearError } = useStore();

  return (
    <div className="flex min-h-screen">
      {/* Sidebar - History */}
      <aside className="hidden w-64 flex-shrink-0 border-r border-text-muted/10 bg-bg-secondary lg:block">
        <HistoryFeed />
      </aside>

      {/* Main Content */}
      <main className="flex flex-1 flex-col overflow-hidden lg:flex-row">
        {/* Left Panel - Compose */}
        <div className="w-full flex-shrink-0 border-b border-text-muted/10 p-6 lg:w-[400px] lg:border-b-0 lg:border-r lg:overflow-y-auto">
          <div className="mb-8">
            <h1 className="font-display text-3xl text-text-primary">
              Bigger Banana
            </h1>
            <p className="mt-1 text-sm text-text-muted">
              AI Image Generation with Gemini 3 Pro
            </p>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-6 rounded-lg border border-red-500/30 bg-red-900/20 p-4">
              <div className="flex items-start justify-between">
                <p className="text-sm text-red-300">{error}</p>
                <button
                  onClick={clearError}
                  className="ml-2 text-red-300 hover:text-red-100"
                >
                  ×
                </button>
              </div>
            </div>
          )}

          <div className="space-y-6">
            <PromptInput />
            <DimensionSelector />
            <ReferenceUploader />
            <GenerateButton />
          </div>
        </div>

        {/* Right Panel - Results */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-6">
            <h2 className="font-display text-xl text-text-primary">Result</h2>
          </div>
          <OutputGrid />
        </div>
      </main>

      {/* Mobile History Toggle (could be expanded) */}
      <div className="fixed bottom-4 right-4 lg:hidden">
        {/* Could add a floating history button here */}
      </div>
    </div>
  );
}
