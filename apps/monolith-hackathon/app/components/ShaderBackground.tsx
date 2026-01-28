'use client';

import { useState, useEffect, useRef } from 'react';
import { Dithering } from '@paper-design/shaders-react';

type DitheringShape = 'sphere' | 'wave' | 'dots' | 'ripple' | 'swirl' | 'warp';
type DitheringType = '2x2' | '4x4' | '8x8' | 'random';

interface ShaderSettings {
  colorBack: string;
  colorFront: string;
  shape: DitheringShape;
  type: DitheringType;
  size: number;
  speed: number;
  scale: number;
  rotation: number;
  offsetX: number;
  offsetY: number;
}

const SHAPES: DitheringShape[] = ['sphere', 'wave', 'dots', 'ripple', 'swirl', 'warp'];
const TYPES: DitheringType[] = ['2x2', '4x4', '8x8', 'random'];

const PRESET_COLORS = {
  ultraviolet: '#6939ca',
  magma: '#ef5c6f',
  amber: '#fd8f3a',
  green: '#14f1b2',
  black: '#010101',
  transparent: '#00000000',
};

const INITIAL_SETTINGS: ShaderSettings = {
  colorBack: '#010101',
  colorFront: '#6939ca',
  shape: 'swirl',
  type: '8x8',
  size: 1.8,
  speed: 0.58,
  scale: 0.1,
  rotation: 360,
  offsetX: 0,
  offsetY: 0,
};

const FINAL_SETTINGS: ShaderSettings = {
  ...INITIAL_SETTINGS,
  scale: 3.48,
};

// Mobile-specific static settings (no animation)
const MOBILE_SETTINGS: ShaderSettings = {
  colorBack: '#010101',
  colorFront: '#6939ca',
  shape: 'warp',
  type: '8x8',
  size: 1.4,
  speed: 0.58,
  scale: 3.48,
  rotation: 360,
  offsetX: 0,
  offsetY: 0,
};
const MOBILE_OPACITY = 0.26;

const SCALE_DELTA = FINAL_SETTINGS.scale - INITIAL_SETTINGS.scale;
const ANIMATION_DELAY_MS = 500;
const ANIMATION_DURATION_MS = 15000;
const MOBILE_BREAKPOINT = 768;

const easeOutEnd = (t: number): number => {
  const easeStart = 0.8;
  if (t < easeStart) return t;
  const easeProgress = (t - easeStart) / (1 - easeStart);
  const easedPortion = 1 - Math.pow(1 - easeProgress, 3);
  return easeStart + easedPortion * (1 - easeStart);
};

export default function ShaderBackground() {
  const [isMobile, setIsMobile] = useState(false);
  const [settings, setSettings] = useState<ShaderSettings>(INITIAL_SETTINGS);
  const [opacity, setOpacity] = useState(0);
  const [showControls, setShowControls] = useState(false);
  const [copied, setCopied] = useState(false);
  const animationRef = useRef<number | null>(null);

  // Detect mobile on mount
  useEffect(() => {
    const checkMobile = () => window.innerWidth <= MOBILE_BREAKPOINT;
    const mobile = checkMobile();
    setIsMobile(mobile);

    if (mobile) {
      // Mobile: static settings, no animation
      setSettings(MOBILE_SETTINGS);
      setOpacity(MOBILE_OPACITY);
    }
  }, []);

  // Desktop animation
  useEffect(() => {
    if (isMobile) return; // Skip animation on mobile

    const timeoutId = setTimeout(() => {
      const startTime = performance.now();

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const linearProgress = Math.min(elapsed / ANIMATION_DURATION_MS, 1);
        const easedProgress = easeOutEnd(linearProgress);

        const newScale = INITIAL_SETTINGS.scale + SCALE_DELTA * easedProgress;
        const newOpacity = easedProgress;

        setSettings(prev => ({ ...prev, scale: newScale }));
        setOpacity(newOpacity);

        if (linearProgress < 1) {
          animationRef.current = requestAnimationFrame(animate);
        }
      };

      animationRef.current = requestAnimationFrame(animate);
    }, ANIMATION_DELAY_MS);

    return () => {
      clearTimeout(timeoutId);
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isMobile]);

  const copySettings = () => {
    const allSettings = { ...settings, opacity };
    const settingsJson = JSON.stringify(allSettings, null, 2);
    navigator.clipboard.writeText(settingsJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const updateSetting = <K extends keyof ShaderSettings>(
    key: K,
    value: ShaderSettings[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <>
      <div className="shader-background" style={{ opacity }}>
        <Dithering
          colorBack={settings.colorBack}
          colorFront={settings.colorFront}
          shape={settings.shape}
          type={settings.type}
          size={settings.size}
          speed={settings.speed}
          scale={settings.scale}
          rotation={settings.rotation}
          offsetX={settings.offsetX}
          offsetY={settings.offsetY}
          style={{ width: '100%', height: '100%' }}
        />
      </div>

      {/* Control panel hidden for production - uncomment to enable
      <button
        className="shader-toggle"
        onClick={() => setShowControls(!showControls)}
      >
        {showControls ? '×' : '⚙'}
      </button>
      */}

      {showControls && (
        <div className="shader-controls">
          <div className="shader-controls-header">
            <span>Shader Settings</span>
            <button className="shader-copy-btn" onClick={copySettings}>
              {copied ? '✓ Copied!' : 'Copy Settings'}
            </button>
          </div>

          <div className="shader-control-group">
            <label>Presets</label>
            <div className="shader-presets">
              {SHAPES.map((shape) => (
                <button
                  key={shape}
                  className={`shader-preset-btn ${settings.shape === shape ? 'active' : ''}`}
                  onClick={() => updateSetting('shape', shape)}
                >
                  {shape.charAt(0).toUpperCase() + shape.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="shader-control-group">
            <label>colorBack</label>
            <div className="shader-color-row">
              <input
                type="color"
                value={settings.colorBack === '#00000000' ? '#000000' : settings.colorBack}
                onChange={(e) => updateSetting('colorBack', e.target.value)}
              />
              <input
                type="text"
                value={settings.colorBack}
                onChange={(e) => updateSetting('colorBack', e.target.value)}
              />
            </div>
          </div>

          <div className="shader-control-group">
            <label>colorFront</label>
            <div className="shader-color-row">
              <input
                type="color"
                value={settings.colorFront}
                onChange={(e) => updateSetting('colorFront', e.target.value)}
              />
              <input
                type="text"
                value={settings.colorFront}
                onChange={(e) => updateSetting('colorFront', e.target.value)}
              />
            </div>
          </div>

          <div className="shader-control-group">
            <label>Quick Colors</label>
            <div className="shader-color-swatches">
              {Object.entries(PRESET_COLORS).map(([name, color]) => (
                <button
                  key={name}
                  className="shader-swatch"
                  style={{ backgroundColor: color === '#00000000' ? 'transparent' : color }}
                  onClick={() => updateSetting('colorFront', color)}
                  title={name}
                />
              ))}
            </div>
          </div>

          <div className="shader-control-group">
            <label>type</label>
            <select
              value={settings.type}
              onChange={(e) => updateSetting('type', e.target.value as DitheringType)}
            >
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="shader-control-group">
            <label>size</label>
            <div className="shader-slider-row">
              <input
                type="range"
                min="0.1"
                max="10"
                step="0.1"
                value={settings.size}
                onChange={(e) => updateSetting('size', parseFloat(e.target.value))}
              />
              <span>{settings.size.toFixed(1)}</span>
            </div>
          </div>

          <div className="shader-control-group">
            <label>speed</label>
            <div className="shader-slider-row">
              <input
                type="range"
                min="0"
                max="5"
                step="0.01"
                value={settings.speed}
                onChange={(e) => updateSetting('speed', parseFloat(e.target.value))}
              />
              <span>{settings.speed.toFixed(2)}</span>
            </div>
          </div>

          <div className="shader-control-group">
            <label>scale</label>
            <div className="shader-slider-row">
              <input
                type="range"
                min="0.1"
                max="5"
                step="0.01"
                value={settings.scale}
                onChange={(e) => updateSetting('scale', parseFloat(e.target.value))}
              />
              <span>{settings.scale.toFixed(2)}</span>
            </div>
          </div>

          <div className="shader-control-group">
            <label>rotation</label>
            <div className="shader-slider-row">
              <input
                type="range"
                min="0"
                max="360"
                step="1"
                value={settings.rotation}
                onChange={(e) => updateSetting('rotation', parseFloat(e.target.value))}
              />
              <span>{settings.rotation}</span>
            </div>
          </div>

          <div className="shader-control-group">
            <label>offsetX</label>
            <div className="shader-slider-row">
              <input
                type="range"
                min="-1"
                max="1"
                step="0.01"
                value={settings.offsetX}
                onChange={(e) => updateSetting('offsetX', parseFloat(e.target.value))}
              />
              <span>{settings.offsetX.toFixed(2)}</span>
            </div>
          </div>

          <div className="shader-control-group">
            <label>offsetY</label>
            <div className="shader-slider-row">
              <input
                type="range"
                min="-1"
                max="1"
                step="0.01"
                value={settings.offsetY}
                onChange={(e) => updateSetting('offsetY', parseFloat(e.target.value))}
              />
              <span>{settings.offsetY.toFixed(2)}</span>
            </div>
          </div>

          <div className="shader-control-group">
            <label>opacity</label>
            <div className="shader-slider-row">
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={opacity}
                onChange={(e) => setOpacity(parseFloat(e.target.value))}
              />
              <span>{opacity.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
