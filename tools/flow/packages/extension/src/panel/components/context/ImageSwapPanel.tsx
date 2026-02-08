import { useState, useCallback, useEffect, useRef } from "react";
import { sendToContent, onContentMessage } from "../../api/contentBridge";
import { RefreshCw, Check, X, AlertTriangle } from "../ui/icons";
import {
  isImagesResponse,
  isImageSwapResponse,
  type PageImage,
} from "@flow/shared";

/**
 * ImageSwapPanel - Swap images on the page
 *
 * Features:
 * - List all images on page
 * - Swap image src with new URL
 * - Preview before/after
 * - Revert changes
 */

// ============================================================================
// Types
// ============================================================================

interface ImageSwapState {
  imageIndex: number;
  originalSrc: string;
  newSrc: string;
}

// ============================================================================
// Icons
// ============================================================================

const Icons = {
  refresh: <RefreshCw className="w-3 h-3" />,
  check: <Check className="w-3.5 h-3.5" />,
  close: <X className="w-3 h-3" />,
  warning: <AlertTriangle className="w-3.5 h-3.5" />,
  image: (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  ),
  swap: (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <polyline points="17 1 21 5 17 9" />
      <path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <polyline points="7 23 3 19 7 15" />
      <path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </svg>
  ),
  undo: (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M3 7v6h6" />
      <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
    </svg>
  ),
};

// ============================================================================
// Image Card Component
// ============================================================================

interface ImageCardProps {
  image: PageImage;
  swapState: ImageSwapState | null;
  onSelect: () => void;
  onRevert: () => void;
  isSelected: boolean;
}

function ImageCard({
  image,
  swapState,
  onSelect,
  onRevert,
  isSelected,
}: ImageCardProps) {
  const hasBeenSwapped = swapState !== null;
  const displaySrc = hasBeenSwapped ? swapState.newSrc : image.src;

  return (
    <div
      className={`p-2 rounded border transition-all cursor-pointer ${
        isSelected
          ? "bg-blue-500/20 border-blue-500/50"
          : hasBeenSwapped
          ? "bg-green-500/10 border-green-500/30"
          : "bg-neutral-800/50 border-neutral-700 hover:border-neutral-600"
      }`}
      onClick={onSelect}
    >
      <div className="flex gap-2">
        {/* Thumbnail */}
        <div className="w-16 h-16 bg-neutral-900 rounded overflow-hidden shrink-0 flex items-center justify-center">
          {displaySrc ? (
            <img
              src={displaySrc}
              alt={image.alt || "Page image"}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <span className="text-neutral-600">{Icons.image}</span>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-xs text-neutral-200 truncate" title={displaySrc}>
            {displaySrc ? new URL(displaySrc, window.location.href).pathname.split("/").pop() : "No src"}
          </p>
          {image.alt && (
            <p className="text-[10px] text-neutral-500 truncate" title={image.alt}>
              alt: {image.alt}
            </p>
          )}
          <p className="text-[10px] text-neutral-600">
            {image.naturalWidth} x {image.naturalHeight}
          </p>

          {hasBeenSwapped && (
            <div className="flex items-center gap-1 mt-1">
              <span className="text-green-400">{Icons.check}</span>
              <span className="text-[10px] text-green-400">Swapped</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRevert();
                }}
                className="ml-auto text-[10px] text-neutral-400 hover:text-neutral-200 flex items-center gap-0.5"
                title="Revert to original"
              >
                {Icons.undo}
                <span>Revert</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Swap Form Component
// ============================================================================

interface SwapFormProps {
  image: PageImage;
  onSwap: (newSrc: string) => void;
  onCancel: () => void;
  loading: boolean;
}

function SwapForm({ image, onSwap, onCancel, loading }: SwapFormProps) {
  const [newSrc, setNewSrc] = useState("");
  const [previewError, setPreviewError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSrc.trim()) {
      onSwap(newSrc.trim());
    }
  };

  return (
    <div className="p-3 bg-neutral-800/50 rounded space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-neutral-200">Swap Image</span>
        <button
          onClick={onCancel}
          className="p-1 text-neutral-500 hover:text-neutral-200 rounded hover:bg-neutral-700/50"
        >
          {Icons.close}
        </button>
      </div>

      {/* Current vs New preview */}
      <div className="flex gap-2">
        <div className="flex-1">
          <p className="text-[10px] text-neutral-500 mb-1">Current</p>
          <div className="aspect-video bg-neutral-900 rounded overflow-hidden flex items-center justify-center">
            <img
              src={image.src}
              alt="Current"
              className="max-w-full max-h-full object-contain"
            />
          </div>
        </div>
        <div className="flex items-center text-neutral-600">{Icons.swap}</div>
        <div className="flex-1">
          <p className="text-[10px] text-neutral-500 mb-1">New</p>
          <div className="aspect-video bg-neutral-900 rounded overflow-hidden flex items-center justify-center">
            {newSrc && !previewError ? (
              <img
                src={newSrc}
                alt="Preview"
                className="max-w-full max-h-full object-contain"
                onError={() => setPreviewError(true)}
                onLoad={() => setPreviewError(false)}
              />
            ) : (
              <span className="text-neutral-600 text-xs">
                {previewError ? "Load error" : "Enter URL"}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* URL Input */}
      <form onSubmit={handleSubmit} className="space-y-2">
        <input
          ref={inputRef}
          type="text"
          value={newSrc}
          onChange={(e) => {
            setNewSrc(e.target.value);
            setPreviewError(false);
          }}
          placeholder="Enter new image URL..."
          className="w-full px-2 py-1.5 text-xs text-neutral-200 bg-neutral-900 border border-neutral-700 rounded outline-none focus:border-blue-500/50 placeholder:text-neutral-500/50"
        />

        {previewError && (
          <div className="flex items-center gap-1 text-yellow-400 text-[10px]">
            {Icons.warning}
            <span>Could not load preview image</span>
          </div>
        )}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-1.5 text-xs text-neutral-400 bg-neutral-700 rounded hover:bg-neutral-600 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!newSrc.trim() || loading}
            className="flex-1 py-1.5 text-xs font-medium text-blue-400 bg-blue-500/20 rounded hover:bg-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Swapping..." : "Swap Image"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ============================================================================
// Main ImageSwapPanel Component
// ============================================================================

export function ImageSwapPanel() {
  const [images, setImages] = useState<PageImage[]>([]);
  const [swapStates, setSwapStates] = useState<Map<number, ImageSwapState>>(new Map());
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);

  // Listen for messages from content script
  useEffect(() => {
    const cleanup = onContentMessage((message: unknown) => {
      if (isImagesResponse(message)) {
        setImages(message.payload.images);
        setScanning(false);
      } else if (isImageSwapResponse(message)) {
        setLoading(false);
        if (message.payload.success) {
          setSwapStates((prev) => {
            const next = new Map(prev);
            next.set(message.payload.imageIndex, {
              imageIndex: message.payload.imageIndex,
              originalSrc: message.payload.oldSrc,
              newSrc: message.payload.newSrc,
            });
            return next;
          });
          setSelectedIndex(null);
        }
      }
    });

    return cleanup;
  }, []);

  // Scan for images on mount
  useEffect(() => {
    scanImages();
  }, []);

  const scanImages = useCallback(() => {
    setScanning(true);
    sendToContent({
      type: "panel:scan-images",
      payload: {},
    });

    // Real results come via onContentMessage callback
  }, []);

  const handleSwap = useCallback(
    (imageIndex: number, newSrc: string) => {
      setLoading(true);
      const image = images.find((img) => img.index === imageIndex);
      if (!image) return;

      sendToContent({
        type: "panel:swap-image",
        payload: {
          selector: image.selector,
          newSrc,
        },
      });

      // Real results come via onContentMessage callback
    },
    [images]
  );

  const handleRevert = useCallback(
    (imageIndex: number) => {
      const swapState = swapStates.get(imageIndex);
      if (!swapState) return;

      const image = images.find((img) => img.index === imageIndex);
      if (!image) return;

      sendToContent({
        type: "panel:swap-image",
        payload: {
          selector: image.selector,
          newSrc: swapState.originalSrc,
        },
      });

      setSwapStates((prev) => {
        const next = new Map(prev);
        next.delete(imageIndex);
        return next;
      });
    },
    [images, swapStates]
  );

  const selectedImage = selectedIndex !== null
    ? images.find((img) => img.index === selectedIndex)
    : null;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-3 border-b border-neutral-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-blue-400">{Icons.image}</span>
            <span className="text-xs font-medium text-neutral-200">
              Image Swap
            </span>
            <span className="text-[10px] text-neutral-500">
              ({images.length} images)
            </span>
          </div>
          <button
            onClick={scanImages}
            disabled={scanning}
            className="p-1 text-neutral-500 hover:text-neutral-200 rounded hover:bg-neutral-700/50 transition-colors disabled:opacity-50"
            title="Rescan images"
          >
            <span className={scanning ? "animate-spin" : ""}>{Icons.refresh}</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {scanning ? (
          <div className="text-center py-8">
            <div className="animate-spin text-neutral-500 mb-2">{Icons.refresh}</div>
            <p className="text-xs text-neutral-500">Scanning for images...</p>
          </div>
        ) : images.length > 0 ? (
          <>
            {/* Swap form if image selected */}
            {selectedImage && (
              <SwapForm
                image={selectedImage}
                onSwap={(newSrc) => handleSwap(selectedImage.index, newSrc)}
                onCancel={() => setSelectedIndex(null)}
                loading={loading}
              />
            )}

            {/* Image list */}
            {images.map((image) => (
              <ImageCard
                key={image.index}
                image={image}
                swapState={swapStates.get(image.index) || null}
                onSelect={() => setSelectedIndex(image.index)}
                onRevert={() => handleRevert(image.index)}
                isSelected={selectedIndex === image.index}
              />
            ))}
          </>
        ) : (
          <div className="text-center py-8">
            <div className="text-neutral-500 mb-2">{Icons.image}</div>
            <p className="text-xs text-neutral-500">No images found on the page</p>
          </div>
        )}
      </div>

      {/* Help text */}
      <div className="p-3 border-t border-neutral-700">
        <p className="text-[10px] text-neutral-600">
          Click an image to swap it with a new URL. Changes are temporary and can be reverted.
        </p>
      </div>
    </div>
  );
}

export default ImageSwapPanel;
