'use client';

interface NFTCardProps {
  name: string;
  image: string;
  selected?: boolean;
  burned?: boolean;
  onClick?: () => void;
}

export function NFTCard({ name, image, selected, burned, onClick }: NFTCardProps) {
  return (
    <button
      onClick={onClick}
      disabled={burned}
      className={`
        border rounded-sm overflow-hidden text-left
        transition-shadow duration-150 ease-out
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-edge-focus focus-visible:ring-offset-1
        ${burned
          ? 'border-edge-muted opacity-40 cursor-not-allowed grayscale'
          : selected
            ? 'border-edge-focus shadow-glow-success cursor-pointer'
            : 'border-edge-primary cursor-pointer hover:shadow-lifted'
        }
      `}
    >
      <div className="aspect-square overflow-hidden bg-surface-muted">
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover"
        />
        {burned && (
          <div className="absolute inset-0 flex items-center justify-center bg-surface-primary/60">
            <span className="font-joystix text-xs uppercase text-content-muted">Burned</span>
          </div>
        )}
      </div>
      <div className="p-2">
        <span className="font-joystix text-xs uppercase text-content-heading line-clamp-1">
          {name}
        </span>
      </div>
    </button>
  );
}
