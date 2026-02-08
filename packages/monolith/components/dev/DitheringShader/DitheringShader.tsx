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

// Solana Mobile / Monolith colors
const PRESET_COLORS = {
  ultraviolet: '#6939ca',
  magma: '#ef5c6f',
  amber: '#fd8f3a',
  green: '#14f1b2',
  black: '#010101',
  transparent: '#00000000',
};

// Initial settings (on load)
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

// Final settings (after animation)
const FINAL_SETTINGS: ShaderSettings = {
  colorBack: '#010101',
  colorFront: '#6939ca',
  shape: 'swirl',
  type: '8x8',
  size: 1.8,
  speed: 0.58,
  scale: 3.48,
  rotation: 360,
  offsetX: 0,
  offsetY: 0,
};

export default function ShaderBackground() {
  const [settings, setSettings] = useState<ShaderSettings>(INITIAL_SETTINGS);
  const [opacity, setOpacity] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [copied, setCopied] = useState(false);
  const animationRef = useRef<number | null>(null);

  // Animate from initial to final settings over 15 seconds, starting after 0.5s delay
  useEffect(() => {
    const delay = 500; // 0.5 second delay
    const duration = 15000; // 15 seconds

    const timeoutId = setTimeout(() => {
      const startTime = performance.now();

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Linear interpolation (no easing) for scale
        const newScale = INITIAL_SETTINGS.scale + (FINAL_SETTINGS.scale - INITIAL_SETTINGS.scale) * progress;

        // Animate opacity from 0 to 1
        const newOpacity = progress;

        setSettings(prev => ({ ...prev, scale: newScale }));
        setOpacity(newOpacity);

        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animate);
        }
      };

      animationRef.current = requestAnimationFrame(animate);
    }, delay);

    return () => {
      clearTimeout(timeoutId);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

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
      {/* Shader Background */}
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

      {/* Control Panel Toggle */}
      <button
        className="shader-toggle"
        onClick={() => setShowControls(!showControls)}
      >
        {showControls ? '×' : '⚙'}
      </button>

      {/* Control Panel */}
      {showControls && (
        <div className="shader-controls">
          <div className="shader-controls-header">
            <span>Shader Settings</span>
            <button className="shader-copy-btn" onClick={copySettings}>
              {copied ? '✓ Copied!' : 'Copy Settings'}
            </button>
          </div>

          {/* Presets */}
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

          {/* Colors */}
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

          {/* Quick Color Presets */}
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

          {/* Type */}
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

          {/* Sliders */}
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
