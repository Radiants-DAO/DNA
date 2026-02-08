'use client';

import { useEffect, useRef, useState } from 'react';

type BlendMode =
  | 'normal' | 'multiply' | 'screen' | 'overlay'
  | 'darken' | 'lighten' | 'color-dodge' | 'color-burn'
  | 'hard-light' | 'soft-light' | 'difference' | 'exclusion'
  | 'hue' | 'saturation' | 'color' | 'luminosity';

const BLEND_MODES: BlendMode[] = [
  'normal', 'multiply', 'screen', 'overlay',
  'darken', 'lighten', 'color-dodge', 'color-burn',
  'hard-light', 'soft-light', 'difference', 'exclusion',
  'hue', 'saturation', 'color', 'luminosity'
];

interface CRTSettings {
  enabled: boolean;
  opacity: number;
  blendMode: BlendMode;
  maskSize: number;
  maskBorder: number;
  aberrationOffset: number;
  screenCurvature: number;
  vignette: number;
  pulseIntensity: number;
  pulseWidth: number;
  pulseRate: number;
  scanlineIntensity: number;
  brightness: number;
  saturation: number;
}

const DEFAULT_SETTINGS: CRTSettings = {
  enabled: true,
  opacity: 0.4,
  blendMode: 'overlay',
  maskSize: 1,
  maskBorder: 1,
  aberrationOffset: 5,
  screenCurvature: 0.1,
  vignette: 1,
  pulseIntensity: 0.1,
  pulseWidth: 150,
  pulseRate: 13,
  scanlineIntensity: 0,
  brightness: 1.25,
  saturation: 1.25,
};

const vertexShaderSource = `
  attribute vec2 a_position;
  attribute vec2 a_texCoord;
  varying vec2 v_texCoord;

  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
    v_texCoord = a_texCoord;
  }
`;

const fragmentShaderSource = `
  precision highp float;

  varying vec2 v_texCoord;
  uniform vec2 u_resolution;
  uniform float u_time;

  // CRT settings
  uniform float u_maskSize;
  uniform float u_maskBorder;
  uniform float u_aberrationOffset;
  uniform float u_screenCurvature;
  uniform float u_vignette;
  uniform float u_pulseIntensity;
  uniform float u_pulseWidth;
  uniform float u_pulseRate;
  uniform float u_scanlineIntensity;
  uniform float u_brightness;
  uniform float u_saturation;
  uniform float u_opacity;
  uniform bool u_enabled;

  void main() {
    if (!u_enabled) {
      gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
      return;
    }

    // Signed uv coordinates (ranging from -1 to +1)
    vec2 uv = v_texCoord * 2.0 - 1.0;

    // Screen curvature distortion
    vec2 curvedUv = uv * (1.0 + (dot(uv, uv) - 1.0) * u_screenCurvature);

    // Convert back to 0-1 range
    vec2 texCoord = curvedUv * 0.5 + 0.5;

    // Compute pixel coordinates
    vec2 pixel = texCoord * u_resolution;

    // RGB cell coordinates
    vec2 coord = pixel / u_maskSize;
    vec2 subcoord = coord * vec2(3.0, 1.0);

    // Offset for staggering every other cell
    vec2 cellOffset = vec2(0.0, fract(floor(coord.x) * 0.5));

    // Compute RGB color index
    float ind = mod(floor(subcoord.x), 3.0);
    vec3 maskColor = vec3(
      ind == 0.0 ? 1.0 : 0.0,
      ind == 1.0 ? 1.0 : 0.0,
      ind == 2.0 ? 1.0 : 0.0
    ) * 2.5;

    // Cell borders (soft shading)
    vec2 cellUv = fract(subcoord + cellOffset) * 2.0 - 1.0;
    vec2 border = 1.0 - cellUv * cellUv * u_maskBorder;
    maskColor *= border.x * border.y;

    // Vignette
    vec2 edge = max(1.0 - uv * uv, 0.0);
    float vignetteValue = pow(edge.x * edge.y, u_vignette);

    // Pulsing effect
    float pulse = 1.0 + u_pulseIntensity * cos(pixel.x / u_pulseWidth + u_time * u_pulseRate);

    // Scanlines
    float scanline = 1.0 - u_scanlineIntensity * (0.5 + 0.5 * sin(pixel.y * 3.14159));

    // Combine all effects
    vec3 color = maskColor;
    color *= vignetteValue;
    color *= pulse;
    color *= scanline;
    color *= u_brightness;

    // Apply saturation
    float gray = dot(color, vec3(0.299, 0.587, 0.114));
    color = mix(vec3(gray), color, u_saturation);

    // Output as overlay
    gl_FragColor = vec4(color, u_opacity);
  }
`;

export default function CRTShader() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const animationRef = useRef<number>(0);

  const [settings, setSettings] = useState<CRTSettings>(DEFAULT_SETTINGS);
  const [showControls, setShowControls] = useState(false);
  const [copied, setCopied] = useState(false);

  const copySettings = () => {
    navigator.clipboard.writeText(JSON.stringify(settings, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const updateSetting = <K extends keyof CRTSettings>(key: K, value: CRTSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl', {
      alpha: true,
      premultipliedAlpha: false,
      antialias: false
    });
    if (!gl) return;
    glRef.current = gl;

    // Create shaders
    const vertexShader = gl.createShader(gl.VERTEX_SHADER)!;
    gl.shaderSource(vertexShader, vertexShaderSource);
    gl.compileShader(vertexShader);

    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)!;
    gl.shaderSource(fragmentShader, fragmentShaderSource);
    gl.compileShader(fragmentShader);

    // Create program
    const program = gl.createProgram()!;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    programRef.current = program;

    // Set up geometry (full-screen quad)
    const positions = new Float32Array([
      -1, -1,  1, -1,  -1, 1,
      -1,  1,  1, -1,   1, 1,
    ]);
    const texCoords = new Float32Array([
      0, 0,  1, 0,  0, 1,
      0, 1,  1, 0,  1, 1,
    ]);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    const texCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW);

    const texCoordLocation = gl.getAttribLocation(program, 'a_texCoord');
    gl.enableVertexAttribArray(texCoordLocation);
    gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);

    gl.useProgram(program);

    // Enable blending
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, []);

  useEffect(() => {
    const gl = glRef.current;
    const program = programRef.current;
    const canvas = canvasRef.current;
    if (!gl || !program || !canvas) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();
    window.addEventListener('resize', resize);

    const render = (time: number) => {
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      // Update uniforms
      gl.uniform2f(gl.getUniformLocation(program, 'u_resolution'), canvas.width, canvas.height);
      gl.uniform1f(gl.getUniformLocation(program, 'u_time'), time * 0.001);
      gl.uniform1i(gl.getUniformLocation(program, 'u_enabled'), settings.enabled ? 1 : 0);
      gl.uniform1f(gl.getUniformLocation(program, 'u_maskSize'), settings.maskSize);
      gl.uniform1f(gl.getUniformLocation(program, 'u_maskBorder'), settings.maskBorder);
      gl.uniform1f(gl.getUniformLocation(program, 'u_aberrationOffset'), settings.aberrationOffset);
      gl.uniform1f(gl.getUniformLocation(program, 'u_screenCurvature'), settings.screenCurvature);
      gl.uniform1f(gl.getUniformLocation(program, 'u_vignette'), settings.vignette);
      gl.uniform1f(gl.getUniformLocation(program, 'u_pulseIntensity'), settings.pulseIntensity);
      gl.uniform1f(gl.getUniformLocation(program, 'u_pulseWidth'), settings.pulseWidth);
      gl.uniform1f(gl.getUniformLocation(program, 'u_pulseRate'), settings.pulseRate);
      gl.uniform1f(gl.getUniformLocation(program, 'u_scanlineIntensity'), settings.scanlineIntensity);
      gl.uniform1f(gl.getUniformLocation(program, 'u_brightness'), settings.brightness);
      gl.uniform1f(gl.getUniformLocation(program, 'u_saturation'), settings.saturation);
      gl.uniform1f(gl.getUniformLocation(program, 'u_opacity'), settings.opacity);

      gl.drawArrays(gl.TRIANGLES, 0, 6);
      animationRef.current = requestAnimationFrame(render);
    };

    animationRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationRef.current);
    };
  }, [settings]);

  return (
    <>
      <canvas
        ref={canvasRef}
        className="crt-shader-canvas"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 9999,
          pointerEvents: 'none',
          mixBlendMode: settings.blendMode,
        }}
      />

      {/* Toggle Button */}
      <button
        className="crt-toggle"
        onClick={() => setShowControls(!showControls)}
        style={{
          position: 'fixed',
          bottom: '1rem',
          left: '1rem',
          zIndex: 10001,
        }}
      >
        CRT
      </button>

      {/* Controls Panel */}
      {showControls && (
        <div className="shader-controls" style={{ left: '1rem', right: 'auto' }}>
          <div className="shader-controls-header">
            <span>CRT Shader</span>
            <button className="shader-copy-btn" onClick={copySettings}>
              {copied ? '✓ Copied!' : 'Copy'}
            </button>
          </div>

          <div className="shader-control-group">
            <label>
              <input
                type="checkbox"
                checked={settings.enabled}
                onChange={(e) => updateSetting('enabled', e.target.checked)}
              />{' '}
              Enabled
            </label>
          </div>

          <div className="shader-control-group">
            <label>maskSize</label>
            <div className="shader-slider-row">
              <input type="range" min="1" max="10" step="0.5" value={settings.maskSize}
                onChange={(e) => updateSetting('maskSize', parseFloat(e.target.value))} />
              <span>{settings.maskSize.toFixed(1)}</span>
            </div>
          </div>

          <div className="shader-control-group">
            <label>maskBorder</label>
            <div className="shader-slider-row">
              <input type="range" min="0" max="1" step="0.05" value={settings.maskBorder}
                onChange={(e) => updateSetting('maskBorder', parseFloat(e.target.value))} />
              <span>{settings.maskBorder.toFixed(2)}</span>
            </div>
          </div>

          <div className="shader-control-group">
            <label>aberration</label>
            <div className="shader-slider-row">
              <input type="range" min="0" max="5" step="0.1" value={settings.aberrationOffset}
                onChange={(e) => updateSetting('aberrationOffset', parseFloat(e.target.value))} />
              <span>{settings.aberrationOffset.toFixed(1)}</span>
            </div>
          </div>

          <div className="shader-control-group">
            <label>curvature</label>
            <div className="shader-slider-row">
              <input type="range" min="0" max="0.1" step="0.005" value={settings.screenCurvature}
                onChange={(e) => updateSetting('screenCurvature', parseFloat(e.target.value))} />
              <span>{settings.screenCurvature.toFixed(3)}</span>
            </div>
          </div>

          <div className="shader-control-group">
            <label>vignette</label>
            <div className="shader-slider-row">
              <input type="range" min="0" max="1" step="0.05" value={settings.vignette}
                onChange={(e) => updateSetting('vignette', parseFloat(e.target.value))} />
              <span>{settings.vignette.toFixed(2)}</span>
            </div>
          </div>

          <div className="shader-control-group">
            <label>pulseIntensity</label>
            <div className="shader-slider-row">
              <input type="range" min="0" max="0.1" step="0.005" value={settings.pulseIntensity}
                onChange={(e) => updateSetting('pulseIntensity', parseFloat(e.target.value))} />
              <span>{settings.pulseIntensity.toFixed(3)}</span>
            </div>
          </div>

          <div className="shader-control-group">
            <label>pulseWidth</label>
            <div className="shader-slider-row">
              <input type="range" min="10" max="200" step="5" value={settings.pulseWidth}
                onChange={(e) => updateSetting('pulseWidth', parseFloat(e.target.value))} />
              <span>{settings.pulseWidth.toFixed(0)}</span>
            </div>
          </div>

          <div className="shader-control-group">
            <label>pulseRate</label>
            <div className="shader-slider-row">
              <input type="range" min="0" max="50" step="1" value={settings.pulseRate}
                onChange={(e) => updateSetting('pulseRate', parseFloat(e.target.value))} />
              <span>{settings.pulseRate.toFixed(0)}</span>
            </div>
          </div>

          <div className="shader-control-group">
            <label>scanlines</label>
            <div className="shader-slider-row">
              <input type="range" min="0" max="0.3" step="0.01" value={settings.scanlineIntensity}
                onChange={(e) => updateSetting('scanlineIntensity', parseFloat(e.target.value))} />
              <span>{settings.scanlineIntensity.toFixed(2)}</span>
            </div>
          </div>

          <div className="shader-control-group">
            <label>brightness</label>
            <div className="shader-slider-row">
              <input type="range" min="0.5" max="2" step="0.05" value={settings.brightness}
                onChange={(e) => updateSetting('brightness', parseFloat(e.target.value))} />
              <span>{settings.brightness.toFixed(2)}</span>
            </div>
          </div>

          <div className="shader-control-group">
            <label>saturation</label>
            <div className="shader-slider-row">
              <input type="range" min="0" max="2" step="0.05" value={settings.saturation}
                onChange={(e) => updateSetting('saturation', parseFloat(e.target.value))} />
              <span>{settings.saturation.toFixed(2)}</span>
            </div>
          </div>

          <div className="shader-control-group">
            <label>opacity</label>
            <div className="shader-slider-row">
              <input type="range" min="0" max="1" step="0.05" value={settings.opacity}
                onChange={(e) => updateSetting('opacity', parseFloat(e.target.value))} />
              <span>{settings.opacity.toFixed(2)}</span>
            </div>
          </div>

          <div className="shader-control-group">
            <label>blendMode</label>
            <select
              value={settings.blendMode}
              onChange={(e) => updateSetting('blendMode', e.target.value as BlendMode)}
            >
              {BLEND_MODES.map((mode) => (
                <option key={mode} value={mode}>
                  {mode}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </>
  );
}
