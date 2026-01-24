'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Upload, X, GripVertical, ImagePlus } from 'lucide-react';
import { useStore } from '@/lib/store';
import { ReferenceImage, Strength, STRENGTH_LABELS } from '@/lib/types';
import { fileToBase64, generateId, getMimeType, imageToDataUrl } from '@/lib/image';

const MAX_IMAGES = 6;
const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

interface SortableImageProps {
  image: ReferenceImage;
  onRemove: (id: string) => void;
  onStrengthChange: (id: string, strength: Strength) => void;
}

function SortableImage({ image, onRemove, onStrengthChange }: SortableImageProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: image.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const thumbnailUrl = image.thumbnailUrl || imageToDataUrl(image.data, image.mimeType);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group relative flex-shrink-0"
    >
      <div className="card relative h-24 w-24 overflow-hidden">
        {/* Drag Handle */}
        <button
          {...attributes}
          {...listeners}
          className="absolute left-1 top-1 z-10 cursor-grab rounded bg-bg-primary/80 p-1 opacity-0 transition-opacity group-hover:opacity-100"
        >
          <GripVertical className="h-3 w-3 text-text-muted" />
        </button>

        {/* Remove Button */}
        <button
          onClick={() => onRemove(image.id)}
          className="absolute right-1 top-1 z-10 rounded-full bg-bg-primary/80 p-1 opacity-0 transition-opacity hover:bg-red-900/80 group-hover:opacity-100"
        >
          <X className="h-3 w-3 text-text-primary" />
        </button>

        {/* Thumbnail */}
        <img
          src={thumbnailUrl}
          alt={image.filename}
          className="h-full w-full object-cover"
        />
      </div>

      {/* Strength Selector */}
      <select
        value={image.strength}
        onChange={(e) => onStrengthChange(image.id, e.target.value as Strength)}
        className="mt-2 w-24 rounded border border-text-muted/20 bg-bg-secondary px-2 py-1 text-xs text-text-secondary focus:border-accent-gold focus:outline-none"
      >
        {(Object.keys(STRENGTH_LABELS) as Strength[]).map((strength) => (
          <option key={strength} value={strength}>
            {STRENGTH_LABELS[strength]}
          </option>
        ))}
      </select>
    </div>
  );
}

export function ReferenceUploader() {
  const { referenceImages, setReferenceImages } = useStore();
  const [isDragOver, setIsDragOver] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = referenceImages.findIndex((img) => img.id === active.id);
      const newIndex = referenceImages.findIndex((img) => img.id === over.id);
      setReferenceImages(arrayMove(referenceImages, oldIndex, newIndex));
    }
  };

  const processFiles = useCallback(
    async (files: File[]) => {
      const validFiles = files.filter((file) => ACCEPTED_TYPES.includes(file.type));
      const slotsAvailable = MAX_IMAGES - referenceImages.length;
      const filesToAdd = validFiles.slice(0, slotsAvailable);

      if (filesToAdd.length === 0) return;

      const newImages: ReferenceImage[] = await Promise.all(
        filesToAdd.map(async (file) => {
          const base64 = await fileToBase64(file);
          return {
            id: generateId(),
            data: base64,
            filename: file.name,
            mimeType: getMimeType(file.name),
            strength: 'medium' as Strength,
          };
        })
      );

      setReferenceImages([...referenceImages, ...newImages]);
    },
    [referenceImages, setReferenceImages]
  );

  // Handle clipboard paste
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      const imageFiles: File[] = [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) imageFiles.push(file);
        }
      }

      if (imageFiles.length > 0) {
        e.preventDefault();
        await processFiles(imageFiles);
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [processFiles]);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      await processFiles(files);
      e.target.value = '';
    },
    [processFiles]
  );

  // Handle drag and drop from outside
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      const files = Array.from(e.dataTransfer.files);
      await processFiles(files);
    },
    [processFiles]
  );

  const handleRemove = useCallback(
    (id: string) => {
      setReferenceImages(referenceImages.filter((img) => img.id !== id));
    },
    [referenceImages, setReferenceImages]
  );

  const handleStrengthChange = useCallback(
    (id: string, strength: Strength) => {
      setReferenceImages(
        referenceImages.map((img) =>
          img.id === id ? { ...img, strength } : img
        )
      );
    },
    [referenceImages, setReferenceImages]
  );

  const canAddMore = referenceImages.length < MAX_IMAGES;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="label-gold">Reference Images</label>
        <span className="text-xs text-text-muted">
          {referenceImages.length}/{MAX_IMAGES}
        </span>
      </div>

      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`rounded-xl border-2 border-dashed p-4 transition-all ${
          isDragOver
            ? 'border-accent-gold bg-accent-gold/10'
            : 'border-text-muted/20 bg-bg-secondary/30'
        }`}
      >
        {referenceImages.length === 0 && !isDragOver ? (
          // Empty state - large drop zone
          <label className="flex cursor-pointer flex-col items-center justify-center gap-3 py-8">
            <div className="rounded-full bg-bg-tertiary p-4">
              <ImagePlus className="h-8 w-8 text-accent-gold" />
            </div>
            <div className="text-center">
              <p className="text-sm text-text-primary">Drop images here</p>
              <p className="mt-1 text-xs text-text-muted">or click to browse</p>
            </div>
            <input
              type="file"
              accept={ACCEPTED_TYPES.join(',')}
              multiple
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        ) : isDragOver ? (
          // Drag over state
          <div className="flex flex-col items-center justify-center gap-2 py-8">
            <Upload className="h-8 w-8 text-accent-gold animate-bounce" />
            <p className="text-sm text-accent-gold">Drop to add images</p>
          </div>
        ) : (
          // Has images - show grid with add button
          <div className="flex flex-wrap gap-3">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={referenceImages.map((img) => img.id)}
                strategy={horizontalListSortingStrategy}
              >
                {referenceImages.map((image) => (
                  <SortableImage
                    key={image.id}
                    image={image}
                    onRemove={handleRemove}
                    onStrengthChange={handleStrengthChange}
                  />
                ))}
              </SortableContext>
            </DndContext>

            {/* Upload Button */}
            {canAddMore && (
              <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-text-muted/30 bg-bg-secondary/50 transition-all hover:border-accent-gold hover:bg-accent-gold/10">
                <Upload className="h-5 w-5 text-text-muted" />
                <span className="text-xs text-text-muted">Add</span>
                <input
                  type="file"
                  accept={ACCEPTED_TYPES.join(',')}
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            )}
          </div>
        )}
      </div>

      {referenceImages.length > 0 && (
        <p className="text-xs text-text-muted">
          Drag images to reorder. First image has highest priority.
        </p>
      )}
    </div>
  );
}
