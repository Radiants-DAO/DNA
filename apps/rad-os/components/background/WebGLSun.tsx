'use client';

import React, { useRef, useEffect } from 'react';
import { usePreferencesStore } from '@/store';

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

    vec3 finalColor = mix(effectiveDarkColor, effectiveLightColor, dithered);

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
  const darkModeRef = useRef(false);
  const { darkMode } = usePreferencesStore();

  // Keep ref in sync so the render loop reads the latest value
  darkModeRef.current = darkMode;

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

    // Get locations
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

    // Mouse tracking state
    let mouseX = -1000;
    let mouseY = -1000;
    let smoothMouseX = -1000;
    let smoothMouseY = -1000;
    let sunOffsetX = 0;
    let sunOffsetY = 0;

    // Smoothed color values (start at light mode)
    let curLight = [...LIGHT_COLORS.light];
    let curDark = [...LIGHT_COLORS.dark];
    let curGlow = [...LIGHT_COLORS.sunGlow];
    let curDarkModeVal = 0;

    // Mouse event handler
    const handleMouseMove = (e: MouseEvent) => {
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

    const handleMouseLeave = () => {
      mouseX = -1000;
      mouseY = -1000;
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

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

    // Animation loop
    const render = (time: number) => {
      time *= 0.001; // Convert to seconds

      // Determine target colors based on dark mode
      const isDark = darkModeRef.current;
      const targetColors = isDark ? DARK_COLORS : LIGHT_COLORS;
      const targetDarkModeVal = isDark ? 1 : 0;

      // Smoothly interpolate colors for seamless transition
      for (let i = 0; i < 3; i++) {
        curLight[i] += (targetColors.light[i] - curLight[i]) * COLOR_EASING;
        curDark[i] += (targetColors.dark[i] - curDark[i]) * COLOR_EASING;
        curGlow[i] += (targetColors.sunGlow[i] - curGlow[i]) * COLOR_EASING;
      }
      curDarkModeVal += (targetDarkModeVal - curDarkModeVal) * COLOR_EASING;

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

      // Set viewport
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

      // Clear canvas
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);

      // Use program
      gl.useProgram(program);

      // Set uniforms
      gl.uniform1f(timeUniformLocation, time);
      gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height);
      gl.uniform2f(mouseUniformLocation, smoothMouseX, smoothMouseY);
      gl.uniform2f(sunOffsetUniformLocation, sunOffsetX, sunOffsetY);
      gl.uniform3f(lightColorLocation, curLight[0], curLight[1], curLight[2]);
      gl.uniform3f(darkColorLocation, curDark[0], curDark[1], curDark[2]);
      gl.uniform3f(sunGlowColorLocation, curGlow[0], curGlow[1], curGlow[2]);
      gl.uniform1f(darkModeLocation, curDarkModeVal);

      // Bind position buffer
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.enableVertexAttribArray(positionAttributeLocation);
      gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

      // Bind texture coordinate buffer
      gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
      gl.enableVertexAttribArray(texCoordAttributeLocation);
      gl.vertexAttribPointer(texCoordAttributeLocation, 2, gl.FLOAT, false, 0, 0);

      // Draw
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      animationRef.current = requestAnimationFrame(render);
    };

    // Start animation
    animationRef.current = requestAnimationFrame(render);

    // Cleanup
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`w-full h-full ${className}`}
      style={{
        imageRendering: 'pixelated',
        objectFit: 'cover',
        objectPosition: 'top',
      }}
    />
  );
}

export default WebGLSun;
