'use client';

import { useRef, useState } from 'react';
import { useAppStore } from '@/store';
import { WizardStep } from '@/components/ui/WizardStep';
import { Input, Label, Switch } from '@rdna/radiants/components/core';
import { Upload, Trash2 } from '@rdna/radiants/icons';
import { IconButton } from '@rdna/radiants/components/core';
import { uploadArt } from '@/utils/storage';

export function UploadArt({ onBack }: { onBack: () => void }) {
  const setAdminStep = useAppStore((s) => s.setAdminStep);
  const revealUpfront = useAppStore((s) => s.adminRevealUpfront);
  const setRevealUpfront = useAppStore((s) => s.setAdminRevealUpfront);
  const artItems = useAppStore((s) => s.adminArtItems);
  const addArtItem = useAppStore((s) => s.addAdminArtItem);
  const removeArtItem = useAppStore((s) => s.removeAdminArtItem);
  const updateArtItemName = useAppStore((s) => s.updateAdminArtItemName);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleFiles = async (files: FileList) => {
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue;
      const previewUrl = await uploadArt(file);
      addArtItem({
        file,
        previewUrl,
        name: file.name.replace(/\.[^.]+$/, ''),
      });
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files);
  };

  return (
    <WizardStep
      heading="Upload Irradiated Art"
      description="These are the 1/1 mutations your holders will receive"
      onBack={onBack}
      onNext={artItems.length > 0 ? () => setAdminStep('set-rules') : undefined}
      nextDisabled={artItems.length === 0}
    >
      <div className="flex flex-col gap-4">
        {/* Reveal toggle */}
        <Switch
          checked={revealUpfront}
          onChange={setRevealUpfront}
          label="Reveal art to holders before they commit"
        />

        {/* Upload zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`
            flex flex-col items-center justify-center gap-2 p-8
            border-2 border-dashed rounded-sm cursor-pointer
            transition-colors duration-150
            ${dragging
              ? 'border-action-primary bg-surface-muted'
              : 'border-edge-muted hover:border-edge-primary'
            }
          `}
        >
          <Upload size={24} className="text-content-muted" />
          <span className="font-mondwest text-sm text-content-secondary">
            Drop images here or click to browse
          </span>
          <span className="font-mondwest text-xs text-content-muted">
            PNG, JPG, GIF, WebP
          </span>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
          />
        </div>

        {/* Uploaded art grid */}
        {artItems.length > 0 && (
          <div className="flex flex-col gap-2">
            <span className="font-joystix text-xs uppercase text-content-muted">
              Uploaded ({artItems.length})
            </span>
            <div className="grid @sm:grid-cols-2 @md:grid-cols-3 gap-3">
              {artItems.map((item, i) => (
                <div key={i} className="flex gap-2 items-start p-2 border border-edge-muted rounded-sm">
                  <img
                    src={item.previewUrl}
                    alt={item.name}
                    className="w-14 h-14 rounded-sm object-cover shrink-0"
                  />
                  <div className="flex flex-col gap-1 flex-1 min-w-0">
                    <Input
                      value={item.name}
                      onChange={(e) => updateArtItemName(i, e.target.value)}
                      fullWidth
                    />
                    <span className="font-mondwest text-xs text-content-muted">#{i + 1}</span>
                  </div>
                  <IconButton
                    icon={<Trash2 size={14} />}
                    variant="ghost"
                    size="sm"
                    aria-label="Remove"
                    onClick={() => removeArtItem(i)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </WizardStep>
  );
}
