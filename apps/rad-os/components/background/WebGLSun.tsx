'use client';

import { useRef, useEffect, useEffectEvent } from 'react';
import { useRadOSStore } from '@/store';

// ============================================================================
// Constants
// ============================================================================

/** Canvas dimensions (square) for pixel-art effect */
const CANVAS_SIZE = 720;

/** Mouse repulsion distance threshold */
const MOUSE_REPULSION_DISTANCE = 150;

/** Mouse repulsion strength */
const MOUSE_REPULSION_STRENGTH = 0.15;

/** Mouse smoothing easing factor */
const MOUSE_EASING = 0.03;

/** Sun offset easing factor */
const SUN_OFFSET_EASING = 0.02;

/** Color easing for smooth dark mode transitions */
const COLOR_EASING = 0.04;

/** Monolith shader tuning easing for animated theme transitions */
const MONOLITH_TUNER_EASING = 0.035;

// ============================================================================
// Color Palettes
// ============================================================================

/** Light mode: cream (#FEF8E2) and sun-yellow (#FCE184) */
const LIGHT_COLORS = {
  light: [0.996, 0.973, 0.886],  // cream
  dark: [0.988, 0.882, 0.518],   // sun-yellow
  sunGlow: [0.988, 0.882, 0.518], // sun-yellow glow
} as const;

/** Dark mode: enough contrast for visible dithering, glowing sun */
const DARK_COLORS = {
  light: [0.988, 0.882, 0.518],  // sun-yellow (#FCE184)
  dark: [0.059, 0.055, 0.047],   // brand black (#0F0E0C)
  sunGlow: [0.988, 0.882, 0.518], // sun-yellow (#FCE184)
} as const;

const MONOLITH_TUNER_DEFAULTS = {
  falloff: 0.0045,
  bandShift: 1,
  centerZero: 0.04,
  maskRadius: 0.32,
  signalDivisor: 3,
  pixelScale: 1,
  primaryDitherOpacity: 0.78,
} as const;

// ============================================================================
// Shaders
// ============================================================================

const VERTEX_SHADER_SOURCE = `
  attribute vec2 a_position;
  attribute vec2 a_texCoord;
  varying vec2 v_texCoord;
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
    v_texCoord = a_texCoord;
  }
`;

/**
 * Fragment shader - creates pixel-art sun with dithering and mouse interaction
 * Colors are passed as uniforms so they can change with dark mode
 */
const FRAGMENT_SHADER_SOURCE = `
  precision mediump float;
  uniform float u_time;
  uniform vec2 u_resolution;
  uniform vec2 u_mouse;
  uniform vec2 u_sunOffset;
  uniform vec3 u_lightColor;
  uniform vec3 u_darkColor;
  uniform vec3 u_sunGlowColor;
  uniform float u_darkMode;
  uniform float u_themeMode;
  uniform float u_monolithMode;
  uniform float u_monoFalloff;
  uniform float u_monoBandShift;
  uniform float u_monoCenterZero;
  uniform float u_monoMaskRadius;
  uniform float u_monoSignalDivisor;
  uniform float u_monoPixelScale;
  uniform float u_monoPrimaryDitherOpacity;
  varying vec2 v_texCoord;

  /**
   * 4x4 Bayer matrix dithering with radial distance influence
   * Creates pixel-art effect by thresholding intensity values
   */
  float dither(vec2 pos, float value, float radialDistance) {
    vec2 coord = mod(pos, 4.0);
    float x = coord.x;
    float y = coord.y;
    float threshold = 0.0;

    // 4x4 Bayer matrix implemented with conditionals
    if (x < 1.0) {
      if (y < 1.0) threshold = 0.0/16.0;
      else if (y < 2.0) threshold = 12.0/16.0;
      else if (y < 3.0) threshold = 3.0/16.0;
      else threshold = 15.0/16.0;
    } else if (x < 2.0) {
      if (y < 1.0) threshold = 8.0/16.0;
      else if (y < 2.0) threshold = 4.0/16.0;
      else if (y < 3.0) threshold = 11.0/16.0;
      else threshold = 7.0/16.0;
    } else if (x < 3.0) {
      if (y < 1.0) threshold = 2.0/16.0;
      else if (y < 2.0) threshold = 14.0/16.0;
      else if (y < 3.0) threshold = 1.0/16.0;
      else threshold = 13.0/16.0;
    } else {
      if (y < 1.0) threshold = 10.0/16.0;
      else if (y < 2.0) threshold = 6.0/16.0;
      else if (y < 3.0) threshold = 9.0/16.0;
      else threshold = 5.0/16.0;
    }

    // Modify threshold based on radial distance from bottom center
    threshold += radialDistance * 0.3;
    return value > threshold ? 1.0 : 0.0;
  }

  void main() {
    vec2 uv = v_texCoord;
    vec2 pixelPos = uv * u_resolution;

    // Sun position moving from right to left with mouse repulsion
    float sunX = 1.8 - mod(u_time * 0.1, 3.6);
    float sunY = 0.6 + sin(sunX * 3.14159 * 0.8) * 0.3;
    vec2 sunPos = vec2(sunX, sunY) + u_sunOffset;

    // Convert to screen coordinates
    vec2 screenSunPos = vec2(sunPos.x * u_resolution.x * 0.5 + u_resolution.x * 0.5,
                           sunPos.y * u_resolution.y * 0.5 + u_resolution.y * 0.5);
    screenSunPos = mix(screenSunPos, u_resolution * 0.5, smoothstep(0.0, 0.85, u_themeMode));

    // Distance from sun center
    float distToSun = length(pixelPos - screenSunPos);

    // Distance from bottom center for radial dithering
    vec2 bottomCenter = vec2(u_resolution.x * 0.5, 0.0);
    float radialDistance = length(pixelPos - bottomCenter) / (u_resolution.x * 0.7);

    // Sun core (bright center) — stronger glow in dark mode
    float sunRadius = 50.0;
    float sunCore = smoothstep(sunRadius + 10.0, sunRadius - 25.0, distToSun);

    // Radiating waves (increased intensity and range)
    float wavePattern = sin(distToSun * 0.12 - u_time * 2.0) * 0.5 + 0.5;
    float waveIntensity = exp(-distToSun * 0.006) * 1.2;

    // Mouse trail effect
    float mouseDistance = length(pixelPos - u_mouse);
    float mouseTrail = exp(-mouseDistance * 0.02) * 0.3;

    // Background gradient - original warm gradient in light mode, dark in dark mode
    float lightGradient;
    if (uv.y < 0.33) {
      lightGradient = 1.0;
    } else {
      float gradientY = (uv.y - 0.33) / 0.67;
      lightGradient = 1.0 - gradientY * 0.6;
    }
    float darkGradient = 0.1 + 0.3 * exp(-uv.y * 8.0);
    float bgGradient = mix(lightGradient, darkGradient, u_darkMode);

    // Sun effects (dramatically increased brightness)
    float sunEffects = sunCore * 2.5 + wavePattern * waveIntensity * 1.0;

    // Apply distance-based falloff from sun (extended range)
    float falloff = 1.0 - smoothstep(0.0, 350.0, distToSun);
    float sunInfluence = sunEffects * falloff;

    // Combine background gradient with sun effects and mouse trail
    float intensity = bgGradient + sunInfluence + mouseTrail;
    intensity = clamp(intensity, 0.0, 1.0);

    // Apply dithering with radial influence
    float dithered = dither(pixelPos, intensity * 0.6 + 0.1, radialDistance);

    // In dark mode, BOTH dither colors shift toward the glow near the sun,
    // maintaining a tight contrast ratio that matches light mode's subtle texture.
    // Dither the band boundary itself so edges dissolve into the Bayer pattern.
    float sunProximity = exp(-distToSun * 0.006);
    float bandCount = 16.0;
    float scaled = sunProximity * bandCount;
    float bandFrac = fract(scaled);
    float bandBase = floor(scaled) / bandCount;
    float bandNext = (floor(scaled) + 1.0) / bandCount;
    float bandDither = dither(pixelPos + vec2(2.0, 2.0), bandFrac, 0.0);
    sunProximity = mix(bandBase, bandNext, bandDither);
    float dm = sunProximity * u_darkMode;

    vec3 glowDark = u_sunGlowColor * 0.85;
    vec3 effectiveLightColor = mix(u_lightColor, u_sunGlowColor, dm);
    vec3 effectiveDarkColor = mix(u_darkColor, glowDark, dm);

    vec3 radiantsColor = mix(effectiveDarkColor, effectiveLightColor, dithered);
    float themeTransition = smoothstep(0.0, 1.0, u_themeMode);
    vec3 monoLightBaseColor = vec3(0.980, 0.976, 0.957);
    vec3 monoLightMistColor = vec3(0.812, 0.902, 0.894);
    vec3 monoLightSkyColor = vec3(0.584, 0.824, 0.902);
    vec3 monoLightTealColor = vec3(0.380, 0.686, 0.741);
    float monolithTheme = smoothstep(0.0, 1.0, u_monolithMode);
    vec3 monoPurple = vec3(0.412, 0.224, 0.792);
    vec3 monoCyan = monoLightTealColor;
    vec3 monoAccent = mix(monoCyan, monoPurple, monolithTheme);
    vec3 monoLightSource = mix(monoLightBaseColor, monoLightMistColor, dithered * 0.62);
    monoLightSource = mix(monoLightSource, monoAccent, sunProximity * 0.26);
    monoLightSource = mix(monoLightSource, monoAccent, mouseTrail * 0.18);
    vec3 transitionSourceColor = mix(radiantsColor, monoLightSource, (1.0 - u_darkMode) * themeTransition);

    // MONOLITH mode: centered purple/black dither portal field.
    vec2 center = vec2(0.5, 0.5);
    vec2 p = uv - center;
    vec2 portalP = p * vec2(1.08, 1.0);
    float transitionOrbit = themeTransition * (1.0 - themeTransition);
    float orbitAngle = themeTransition * 0.42 + transitionOrbit * sin(length(portalP) * 13.0 - u_time * 1.4) * 0.28;
    float orbitCos = cos(orbitAngle);
    float orbitSin = sin(orbitAngle);
    portalP = vec2(
      portalP.x * orbitCos - portalP.y * orbitSin,
      portalP.x * orbitSin + portalP.y * orbitCos
    );
    float portalDist = length(portalP);
    float portalAngle = atan(portalP.y, portalP.x);
    vec2 monoDitherPos = floor(pixelPos / max(u_monoPixelScale, 0.25));

    float ring = 0.5 + 0.5 * sin(portalDist * 58.0 - u_time * 0.65);
    float shard = 0.5 + 0.5 * sin(portalAngle * 18.0 + portalDist * 34.0 + u_time * 0.18);
    float turbulence = 0.5 + 0.5 * sin((portalP.x - portalP.y) * 42.0 + u_time * 0.22);
    float portalCore = smoothstep(0.58, 0.1, portalDist);

    // Reuse the RadOS sun falloff profile, inverted: dark center, brighter outer field.
    float centerDistance = length(pixelPos - u_resolution * 0.5);
    float monoProximity = exp(-centerDistance * u_monoFalloff);
    float monoBandCount = 16.0;
    float monoScaled = monoProximity * monoBandCount;
    float monoBandFrac = fract(monoScaled);
    float monoBandBase = floor(monoScaled) / monoBandCount;
    float monoBandNext = (floor(monoScaled) + 1.0) / monoBandCount;
    float monoBandDither = dither(monoDitherPos + vec2(2.0, 2.0), monoBandFrac, 0.0);
    monoProximity = mix(monoBandBase, monoBandNext, monoBandDither);
    float densityGate = 1.0 - monoProximity;
    densityGate = max(0.0, densityGate - (u_monoBandShift / monoBandCount));
    densityGate *= smoothstep(0.0, u_monoCenterZero, portalDist);

    float portalShell = smoothstep(0.56, 0.24, portalDist) * smoothstep(0.08, 0.34, portalDist);

    float sideLeft = smoothstep(0.42, 0.0, uv.x) * (0.34 + 0.66 * smoothstep(0.0, 0.9, uv.y));
    float sideRight = smoothstep(0.42, 0.0, 1.0 - uv.x) * (0.34 + 0.66 * smoothstep(0.0, 0.9, uv.y));
    float topField = smoothstep(0.28, 0.0, uv.y) * 0.18;
    float sideField = max(max(sideLeft, sideRight), topField);
    float cornerField = smoothstep(0.58, 1.28, length(abs(p) * 2.0));
    float fullScreenGrain = 0.5 + 0.5 * sin(pixelPos.x * 0.23 + pixelPos.y * 0.17);

    float monoSignal =
      0.05 +
      fullScreenGrain * 0.04 +
      portalCore * (0.34 + ring * 0.32 + shard * 0.16) +
      portalShell * (0.24 + shard * 0.26 + turbulence * 0.18) +
      sideField * 0.36 +
      cornerField * 0.42;
    monoSignal /= max(u_monoSignalDivisor, 0.25);
    monoSignal *= densityGate;
    monoSignal = clamp(monoSignal, 0.0, 1.0);

    float monoDither = dither(monoDitherPos, monoSignal * 0.72, 0.0);
    vec3 monoDarkBase = vec3(0.004, 0.004, 0.004);
    vec3 monoLightBase = monoLightBaseColor;
    vec3 monoBase = mix(monoLightBase, monoDarkBase, u_darkMode);
    vec3 monoInk = monoAccent;
    vec3 portalTint = monoInk * (0.72 + ring * 0.24 + portalCore * 0.12);

    vec3 monolithColor = monoBase;
    monolithColor = mix(monolithColor, portalTint * 0.82, monoDither * u_monoPrimaryDitherOpacity);
    monolithColor += portalTint * portalCore * 0.08;
    monolithColor = mix(monoBase, monolithColor, smoothstep(0.0, u_monoMaskRadius, portalDist));
    monolithColor = clamp(monolithColor, 0.0, 1.0);

    float revealRadius = mix(-0.22, 1.06, themeTransition);
    float portalReveal = 1.0 - smoothstep(revealRadius - 0.08, revealRadius + 0.18, portalDist);
    float orbitalReveal = clamp(portalReveal + transitionOrbit * ring * 0.18 + transitionOrbit * shard * 0.1, 0.0, 1.0);
    vec3 transitionGlow = mix(transitionSourceColor, monoInk * 0.9, orbitalReveal * transitionOrbit * 0.35);
    vec3 finalColor = mix(transitionGlow, monolithColor, orbitalReveal);

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

// ============================================================================
// Helper Functions
// ============================================================================

function createShader(
  gl: WebGLRenderingContext,
  type: number,
  source: string
): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('Shader compilation error:', gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

function createProgram(
  gl: WebGLRenderingContext,
  vertexShader: WebGLShader,
  fragmentShader: WebGLShader
): WebGLProgram | null {
  const program = gl.createProgram();
  if (!program) return null;

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Program linking error:', gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }

  return program;
}

function readCssNumber(name: string, fallback: number): number {
  if (typeof window === 'undefined') return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

// ============================================================================
// Component
// ============================================================================

interface WebGLSunProps {
  className?: string;
}

/**
 * WebGL animated sun background with pixel-art dithering
 *
 * Features:
 * - Animated sun moving across screen
 * - 4x4 Bayer matrix dithering for pixel-art effect
 * - Mouse interaction (sun repulsion, trail effect)
 * - Radial gradient background
 * - Wave patterns radiating from sun
 * - Dark mode support: smoothly transitions to dark dithered sky with glowing sun
 */
export function WebGLSun({ className = '' }: WebGLSunProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const darkModeRef = useRef(useRadOSStore.getState().darkMode);
  const themeRef = useRef(useRadOSStore.getState().theme);
  const reduceMotionRef = useRef(useRadOSStore.getState().reduceMotion);
  const renderRef = useRef<((time: number) => void) | null>(null);
  const motionQueryRef = useRef<MediaQueryList | null>(null);

  const resumeAnimationIfNeeded = useEffectEvent(() => {
    if (!reduceMotionRef.current && animationRef.current === null && renderRef.current) {
      animationRef.current = requestAnimationFrame(renderRef.current);
    }
  });

  // Sync reduced-motion preference (OS-level + app-level)
  useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    motionQueryRef.current = mql;
    const update = () => {
      const nextReduceMotion = useRadOSStore.getState().reduceMotion || mql.matches;
      const wasReducedMotion = reduceMotionRef.current;
      reduceMotionRef.current = nextReduceMotion;
      if (wasReducedMotion && !nextReduceMotion) {
        resumeAnimationIfNeeded();
      }
    };
    update();
    mql.addEventListener('change', update);
    return () => {
      motionQueryRef.current = null;
      mql.removeEventListener('change', update);
    };
  }, []);

  // Avoid rerendering the live WebGL canvas when preferences change.
  useEffect(() => {
    return useRadOSStore.subscribe((state, prevState) => {
      if (state.darkMode !== prevState.darkMode) {
        darkModeRef.current = state.darkMode;
      }

      if (state.theme !== prevState.theme) {
        themeRef.current = state.theme;
      }

      if (state.reduceMotion !== prevState.reduceMotion) {
        const nextReduceMotion = state.reduceMotion || motionQueryRef.current?.matches || false;
        const wasReducedMotion = reduceMotionRef.current;
        reduceMotionRef.current = nextReduceMotion;
        if (wasReducedMotion && !nextReduceMotion) {
          resumeAnimationIfNeeded();
        }
      }
    });
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Fixed size for pixel-art effect
    canvas.width = CANVAS_SIZE;
    canvas.height = CANVAS_SIZE;

    const gl = canvas.getContext('webgl', { alpha: false });
    if (!gl) {
      console.error('WebGL not supported');
      return;
    }

    // Create shaders and program
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER_SOURCE);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER_SOURCE);

    if (!vertexShader || !fragmentShader) {
      console.error('Failed to create shaders');
      return;
    }

    const program = createProgram(gl, vertexShader, fragmentShader);
    if (!program) {
      console.error('Failed to create program');
      return;
    }

    const positionAttributeLocation = gl.getAttribLocation(program, 'a_position');
    const texCoordAttributeLocation = gl.getAttribLocation(program, 'a_texCoord');
    const timeUniformLocation = gl.getUniformLocation(program, 'u_time');
    const resolutionUniformLocation = gl.getUniformLocation(program, 'u_resolution');
    const mouseUniformLocation = gl.getUniformLocation(program, 'u_mouse');
    const sunOffsetUniformLocation = gl.getUniformLocation(program, 'u_sunOffset');
    const lightColorLocation = gl.getUniformLocation(program, 'u_lightColor');
    const darkColorLocation = gl.getUniformLocation(program, 'u_darkColor');
    const sunGlowColorLocation = gl.getUniformLocation(program, 'u_sunGlowColor');
    const darkModeLocation = gl.getUniformLocation(program, 'u_darkMode');
    const themeModeLocation = gl.getUniformLocation(program, 'u_themeMode');
    const monolithModeLocation = gl.getUniformLocation(program, 'u_monolithMode');
    const monoFalloffLocation = gl.getUniformLocation(program, 'u_monoFalloff');
    const monoBandShiftLocation = gl.getUniformLocation(program, 'u_monoBandShift');
    const monoCenterZeroLocation = gl.getUniformLocation(program, 'u_monoCenterZero');
    const monoMaskRadiusLocation = gl.getUniformLocation(program, 'u_monoMaskRadius');
    const monoSignalDivisorLocation = gl.getUniformLocation(program, 'u_monoSignalDivisor');
    const monoPixelScaleLocation = gl.getUniformLocation(program, 'u_monoPixelScale');
    const monoPrimaryDitherOpacityLocation = gl.getUniformLocation(program, 'u_monoPrimaryDitherOpacity');

    // Mouse tracking state
    let mouseX = -1000;
    let mouseY = -1000;
    let smoothMouseX = -1000;
    let smoothMouseY = -1000;
    let sunOffsetX = 0;
    let sunOffsetY = 0;

    // Smoothed color values (start at light mode)
    const curLight = [...LIGHT_COLORS.light];
    const curDark = [...LIGHT_COLORS.dark];
    const curGlow = [...LIGHT_COLORS.sunGlow];
    let curDarkModeVal = 0;
    let curThemeModeVal = themeRef.current === 'skr' || themeRef.current === 'monolith' ? 1 : 0;
    let curMonolithModeVal = themeRef.current === 'monolith' ? 1 : 0;
    let curMonoFalloff = MONOLITH_TUNER_DEFAULTS.falloff;
    let curMonoBandShift = MONOLITH_TUNER_DEFAULTS.bandShift;
    let curMonoCenterZero = MONOLITH_TUNER_DEFAULTS.centerZero;
    let curMonoMaskRadius = MONOLITH_TUNER_DEFAULTS.maskRadius;
    let curMonoSignalDivisor = MONOLITH_TUNER_DEFAULTS.signalDivisor;
    let curMonoPixelScale = MONOLITH_TUNER_DEFAULTS.pixelScale;
    let curMonoPrimaryDitherOpacity = MONOLITH_TUNER_DEFAULTS.primaryDitherOpacity;

    // Mouse event handler
    const handlePointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      const x = (e.clientX - rect.left) * scaleX;
      // Flip Y coordinate to match shader coordinate system (Y=0 at bottom)
      const y = canvas.height - (e.clientY - rect.top) * scaleY;

      if (
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom
      ) {
        mouseX = x;
        mouseY = y;
      } else {
        mouseX = -1000;
        mouseY = -1000;
      }
    };

    const handlePointerLeave = () => {
      mouseX = -1000;
      mouseY = -1000;
    };

    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerleave', handlePointerLeave);

    // Create buffers - using TRIANGLE_STRIP with 4 vertices
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        -1, -1, // Bottom left
        1, -1, // Bottom right
        -1, 1, // Top left
        1, 1, // Top right
      ]),
      gl.STATIC_DRAW
    );

    const texCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        0, 0, // Bottom left
        1, 0, // Bottom right
        0, 1, // Top left
        1, 1, // Top right
      ]),
      gl.STATIC_DRAW
    );

    const render = (time: number) => {
      time *= 0.001; // Convert to seconds

      // Determine target colors based on dark mode
      const isDark = darkModeRef.current;
      const targetColors = isDark ? DARK_COLORS : LIGHT_COLORS;
      const targetDarkModeVal = isDark ? 1 : 0;
      const targetThemeModeVal = themeRef.current === 'skr' || themeRef.current === 'monolith' ? 1 : 0;
      const targetMonolithModeVal = themeRef.current === 'monolith' ? 1 : 0;

      // Smoothly interpolate colors for seamless transition
      for (let i = 0; i < 3; i++) {
        curLight[i] += (targetColors.light[i] - curLight[i]) * COLOR_EASING;
        curDark[i] += (targetColors.dark[i] - curDark[i]) * COLOR_EASING;
        curGlow[i] += (targetColors.sunGlow[i] - curGlow[i]) * COLOR_EASING;
      }
      curDarkModeVal += (targetDarkModeVal - curDarkModeVal) * COLOR_EASING;
      curThemeModeVal += (targetThemeModeVal - curThemeModeVal) * COLOR_EASING;
      curMonolithModeVal += (targetMonolithModeVal - curMonolithModeVal) * COLOR_EASING;

      curMonoFalloff += (readCssNumber('--monolith-webgl-falloff', MONOLITH_TUNER_DEFAULTS.falloff) - curMonoFalloff) * MONOLITH_TUNER_EASING;
      curMonoBandShift += (readCssNumber('--monolith-webgl-band-shift', MONOLITH_TUNER_DEFAULTS.bandShift) - curMonoBandShift) * MONOLITH_TUNER_EASING;
      curMonoCenterZero += (readCssNumber('--monolith-webgl-center-zero', MONOLITH_TUNER_DEFAULTS.centerZero) - curMonoCenterZero) * MONOLITH_TUNER_EASING;
      curMonoMaskRadius += (readCssNumber('--monolith-webgl-mask-radius', MONOLITH_TUNER_DEFAULTS.maskRadius) - curMonoMaskRadius) * MONOLITH_TUNER_EASING;
      curMonoSignalDivisor += (readCssNumber('--monolith-webgl-signal-divisor', MONOLITH_TUNER_DEFAULTS.signalDivisor) - curMonoSignalDivisor) * MONOLITH_TUNER_EASING;
      curMonoPixelScale += (readCssNumber('--monolith-webgl-pixel-scale', MONOLITH_TUNER_DEFAULTS.pixelScale) - curMonoPixelScale) * MONOLITH_TUNER_EASING;
      curMonoPrimaryDitherOpacity += (readCssNumber('--monolith-webgl-primary-dither-opacity', MONOLITH_TUNER_DEFAULTS.primaryDitherOpacity) - curMonoPrimaryDitherOpacity) * MONOLITH_TUNER_EASING;

      // Smooth mouse movement
      smoothMouseX += (mouseX - smoothMouseX) * MOUSE_EASING;
      smoothMouseY += (mouseY - smoothMouseY) * MOUSE_EASING;

      // Calculate sun repulsion
      const sunX = 1.8 - (time * 0.1) % 3.6;
      const sunY = 0.6 + Math.sin(sunX * Math.PI * 0.8) * 0.3;
      const screenSunX = sunX * canvas.width * 0.5 + canvas.width * 0.5;
      const screenSunY = sunY * canvas.height * 0.5 + canvas.height * 0.5;

      const dx = mouseX - screenSunX;
      const dy = mouseY - screenSunY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > 0 && distance < MOUSE_REPULSION_DISTANCE) {
        const force = Math.max(0, 1 - distance / MOUSE_REPULSION_DISTANCE);
        const targetOffsetX = (-dx * force * MOUSE_REPULSION_STRENGTH) / distance;
        const targetOffsetY = (-dy * force * MOUSE_REPULSION_STRENGTH) / distance;
        sunOffsetX += (targetOffsetX - sunOffsetX) * SUN_OFFSET_EASING;
        sunOffsetY += (targetOffsetY - sunOffsetY) * SUN_OFFSET_EASING;
      } else {
        sunOffsetX *= 0.95;
        sunOffsetY *= 0.95;
      }

      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.useProgram(program);

      gl.uniform1f(timeUniformLocation, time);
      gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height);
      gl.uniform2f(mouseUniformLocation, smoothMouseX, smoothMouseY);
      gl.uniform2f(sunOffsetUniformLocation, sunOffsetX, sunOffsetY);
      gl.uniform3f(lightColorLocation, curLight[0], curLight[1], curLight[2]);
      gl.uniform3f(darkColorLocation, curDark[0], curDark[1], curDark[2]);
      gl.uniform3f(sunGlowColorLocation, curGlow[0], curGlow[1], curGlow[2]);
      gl.uniform1f(darkModeLocation, curDarkModeVal);
      gl.uniform1f(themeModeLocation, curThemeModeVal);
      gl.uniform1f(monolithModeLocation, curMonolithModeVal);
      gl.uniform1f(monoFalloffLocation, curMonoFalloff);
      gl.uniform1f(monoBandShiftLocation, curMonoBandShift);
      gl.uniform1f(monoCenterZeroLocation, curMonoCenterZero);
      gl.uniform1f(monoMaskRadiusLocation, curMonoMaskRadius);
      gl.uniform1f(monoSignalDivisorLocation, curMonoSignalDivisor);
      gl.uniform1f(monoPixelScaleLocation, curMonoPixelScale);
      gl.uniform1f(monoPrimaryDitherOpacityLocation, curMonoPrimaryDitherOpacity);

      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.enableVertexAttribArray(positionAttributeLocation);
      gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

      gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
      gl.enableVertexAttribArray(texCoordAttributeLocation);
      gl.vertexAttribPointer(texCoordAttributeLocation, 2, gl.FLOAT, false, 0, 0);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      if (!reduceMotionRef.current) {
        animationRef.current = requestAnimationFrame(render);
      } else {
        animationRef.current = null;
      }
    };

    renderRef.current = render;

    animationRef.current = requestAnimationFrame(render);

    return () => {
      renderRef.current = null;
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerleave', handlePointerLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`webgl-sun absolute inset-0 size-full ${className}`}
      style={{
        imageRendering: 'pixelated',
        objectFit: 'cover',
        objectPosition: 'center',
      }}
    />
  );
}
