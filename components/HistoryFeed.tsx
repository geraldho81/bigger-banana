'use client';

import { useEffect, useState } from 'react';
import { Clock, Trash2 } from 'lucide-react';
import { useStore } from '@/lib/store';
import { HistoryEntry } from '@/lib/types';
import { ConfirmDialog } from './ConfirmDialog';

export function HistoryFeed() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const { loadFromHistory, generatedResults } = useStore();

  // Fetch history on mount and when results change
  useEffect(() => {
    fetchHistory();
  }, [generatedResults]);

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/history?limit=50');
      const data = await res.json();
      if (data.entries) {
        setEntries(data.entries);
      }
    } catch (error) {
      console.error('Failed to fetch history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = async () => {
    try {
      await fetch('/api/history', { method: 'DELETE' });
      setEntries([]);
    } catch (error) {
      console.error('Failed to clear history:', error);
    } finally {
      setShowClearConfirm(false);
    }
  };

  const handleLoadEntry = (entry: HistoryEntry) => {
    loadFromHistory(entry);
  };

  if (isLoading) {
    return (
      <div className="space-y-3 p-4">
        <div className="flex items-center gap-2 text-text-muted">
          <Clock className="h-4 w-4" />
          <span className="label-gold">History</span>
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="shimmer-loading h-8 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex h-full flex-col p-4">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-accent-gold" />
            <span className="label-gold">History</span>
          </div>
          {entries.length > 0 && (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="rounded p-1 text-text-muted transition-colors hover:bg-bg-tertiary hover:text-red-400"
              title="Clear history"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>

        {entries.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <p className="text-sm text-text-muted">No history yet</p>
            <p className="mt-1 text-xs text-text-muted">
              Your generations will appear here
            </p>
          </div>
        ) : (
          <div className="flex-1 space-y-1 overflow-y-auto">
            {entries.map((entry) => (
              <button
                key={entry.id}
                onClick={() => handleLoadEntry(entry)}
                className="history-item"
                title={entry.prompt}
              >
                {entry.prompt.slice(0, 50)}
                {entry.prompt.length > 50 && '...'}
              </button>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={showClearConfirm}
        title="Clear History"
        message="This will permanently delete all your generation history. This action cannot be reversed."
        confirmLabel="Delete All"
        cancelLabel="Keep History"
        onConfirm={handleClearHistory}
        onCancel={() => setShowClearConfirm(false)}
      />
    </>
  );
}
