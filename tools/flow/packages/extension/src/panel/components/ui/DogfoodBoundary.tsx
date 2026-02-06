import { useState, useCallback, useRef, type ReactNode } from 'react';
import { useAppStore } from '../../stores/appStore';

interface DogfoodBoundaryProps {
  name: string;
  file: string;
  category?: 'layout' | 'designer' | 'mode' | 'panel' | 'utility';
  children: ReactNode;
}

const CATEGORY_COLORS: Record<string, string> = {
  layout: '#3b82f6',
  designer: '#22c55e',
  mode: '#f59e0b',
  panel: '#a855f7',
  utility: '#6b7280',
};

export function DogfoodBoundary({ name, file, category = 'utility', children }: DogfoodBoundaryProps) {
  const dogfoodMode = useAppStore((s) => s.dogfoodMode);
  const [hovered, setHovered] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const boundaryRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  }, []);

  const handleMouseEnter = useCallback(() => setHovered(true), []);
  const handleMouseLeave = useCallback(() => setHovered(false), []);

  if (!dogfoodMode) {
    return <>{children}</>;
  }

  const color = CATEGORY_COLORS[category] ?? CATEGORY_COLORS.utility;

  return (
    <div
      ref={boundaryRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        position: 'relative',
        outline: hovered ? `2px dashed ${color}` : 'none',
        outlineOffset: '-2px',
      }}
      data-dogfood-component={name}
      data-dogfood-file={file}
    >
      {children}
      {hovered && (
        <div
          style={{
            position: 'fixed',
            left: mousePos.x + 12,
            top: mousePos.y - 28,
            background: color,
            color: 'white',
            fontSize: '11px',
            fontFamily: 'ui-monospace, monospace',
            padding: '3px 8px',
            borderRadius: '4px',
            pointerEvents: 'none',
            zIndex: 99999,
            whiteSpace: 'nowrap',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          }}
        >
          {name} <span style={{ opacity: 0.7 }}>({file})</span>
        </div>
      )}
    </div>
  );
}
