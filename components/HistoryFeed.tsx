'use client';

import { useEffect, useState, useRef } from 'react';
import { Clock, Trash2, MoreHorizontal, Pencil, Video, Image } from 'lucide-react';
import { useStore } from '@/lib/store';
import { HistoryEntry } from '@/lib/types';
import { ConfirmDialog } from './ConfirmDialog';

interface DropdownMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onRename: () => void;
  onDelete: () => void;
  anchorRef: React.RefObject<HTMLButtonElement>;
}

function DropdownMenu({ isOpen, onClose, onRename, onDelete, anchorRef }: DropdownMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        anchorRef.current &&
        !anchorRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose, anchorRef]);

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      className="absolute right-0 top-full z-50 mt-1 min-w-[140px] rounded-lg border border-text-muted/20 bg-bg-secondary py-1 shadow-xl"
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRename();
          onClose();
        }}
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-text-secondary transition-colors hover:bg-bg-tertiary hover:text-text-primary"
      >
        <Pencil className="h-4 w-4" />
        Rename
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
          onClose();
        }}
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-400 transition-colors hover:bg-bg-tertiary"
      >
        <Trash2 className="h-4 w-4" />
        Delete
      </button>
    </div>
  );
}

interface RenameDialogProps {
  isOpen: boolean;
  currentPrompt: string;
  onConfirm: (newPrompt: string) => void;
  onCancel: () => void;
}

function RenameDialog({ isOpen, currentPrompt, onConfirm, onCancel }: RenameDialogProps) {
  const [value, setValue] = useState(currentPrompt);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setValue(currentPrompt);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, currentPrompt]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      } else if (e.key === 'Enter') {
        onConfirm(value);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel, onConfirm, value]);

  if (!isOpen) return null;

  return (
    <div className="dialog-backdrop" onClick={onCancel}>
      <div
        className="w-full max-w-sm rounded-2xl border border-text-muted/20 bg-bg-secondary p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-display text-lg text-text-primary">Rename</h3>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="input-base mt-4"
          placeholder="Enter new name..."
        />
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onCancel} className="btn-secondary">
            Cancel
          </button>
          <button
            onClick={() => onConfirm(value)}
            className="btn-primary"
            disabled={!value.trim()}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

interface HistoryItemProps {
  entry: HistoryEntry;
  onLoad: () => void;
  onRename: () => void;
  onDelete: () => void;
}

function HistoryItem({ entry, onLoad, onRename, onDelete }: HistoryItemProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  const isVideo = entry.mediaType === 'video';
  const MediaIcon = isVideo ? Video : Image;

  return (
    <div
      className="group relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        if (!isMenuOpen) setIsMenuOpen(false);
      }}
    >
      <button
        onClick={onLoad}
        className="history-item flex items-center gap-2 pr-8"
        title={entry.prompt}
      >
        <MediaIcon className="h-3 w-3 flex-shrink-0 text-text-muted" />
        <span className="truncate">
          {entry.prompt.slice(0, 45)}
          {entry.prompt.length > 45 && '...'}
        </span>
      </button>

      {(isHovered || isMenuOpen) && (
        <button
          ref={menuButtonRef}
          onClick={(e) => {
            e.stopPropagation();
            setIsMenuOpen(!isMenuOpen);
          }}
          className="absolute right-1 top-1/2 -translate-y-1/2 rounded p-1 text-text-muted transition-colors hover:bg-bg-tertiary hover:text-text-primary"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      )}

      <DropdownMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onRename={onRename}
        onDelete={onDelete}
        anchorRef={menuButtonRef}
      />
    </div>
  );
}

export function HistoryFeed() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<HistoryEntry | null>(null);
  const [renameTarget, setRenameTarget] = useState<HistoryEntry | null>(null);
  const { loadFromHistory, generatedResults } = useStore();

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

  const handleDeleteEntry = async () => {
    if (!deleteTarget) return;
    try {
      await fetch(`/api/history?id=${deleteTarget.id}`, { method: 'DELETE' });
      setEntries((prev) => prev.filter((e) => e.id !== deleteTarget.id));
    } catch (error) {
      console.error('Failed to delete entry:', error);
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleRenameEntry = async (newPrompt: string) => {
    if (!renameTarget || !newPrompt.trim()) return;
    try {
      const res = await fetch('/api/history', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: renameTarget.id, prompt: newPrompt }),
      });
      if (res.ok) {
        setEntries((prev) =>
          prev.map((e) =>
            e.id === renameTarget.id ? { ...e, prompt: newPrompt } : e
          )
        );
      }
    } catch (error) {
      console.error('Failed to rename entry:', error);
    } finally {
      setRenameTarget(null);
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
              <HistoryItem
                key={entry.id}
                entry={entry}
                onLoad={() => handleLoadEntry(entry)}
                onRename={() => setRenameTarget(entry)}
                onDelete={() => setDeleteTarget(entry)}
              />
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

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Entry"
        message="This will permanently delete this history entry. This action cannot be reversed."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleDeleteEntry}
        onCancel={() => setDeleteTarget(null)}
      />

      <RenameDialog
        isOpen={!!renameTarget}
        currentPrompt={renameTarget?.prompt || ''}
        onConfirm={handleRenameEntry}
        onCancel={() => setRenameTarget(null)}
      />
    </>
  );
}
