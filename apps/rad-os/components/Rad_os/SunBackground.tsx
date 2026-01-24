'use client';

import React, { useRef, useEffect, useCallback, useState } from 'react';
import { usePreferencesStore } from '@/store';
import { useWindowManager } from '@/hooks/useWindowManager';

// ============================================================================
// Shader Code
// ============================================================================

const vertexShaderSource = `
  attribute vec2 a_position;
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

const fragmentShaderSource = `
  precision mediump float;

  uniform vec2 u_resolution;
  uniform float u_time;
  uniform vec2 u_mouse;
  uniform float u_mouseInfluence;

  // Bayer 4x4 dithering matrix
  float bayer4x4(vec2 pos) {
    int x = int(mod(pos.x, 4.0));
    int y = int(mod(pos.y, 4.0));
    int index = x + y * 4;

    // Bayer matrix values
    float matrix[16];
    matrix[0] = 0.0;  matrix[1] = 8.0;  matrix[2] = 2.0;  matrix[3] = 10.0;
    matrix[4] = 12.0; matrix[5] = 4.0;  matrix[6] = 14.0; matrix[7] = 6.0;
    matrix[8] = 3.0;  matrix[9] = 11.0; matrix[10] = 1.0; matrix[11] = 9.0;
    matrix[12] = 15.0; matrix[13] = 7.0; matrix[14] = 13.0; matrix[15] = 5.0;

    for (int i = 0; i < 16; i++) {
      if (i == index) return matrix[i] / 16.0;
    }
    return 0.0;
  }

  // Brand colors (converted from hex)
  vec3 warmCloud = vec3(0.996, 0.973, 0.886);  // #FEF8E2
  vec3 sunYellow = vec3(0.988, 0.882, 0.518);  // #FCE184
  vec3 skyBlue = vec3(0.584, 0.729, 0.824);    // #95BAD2

  void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution;
    vec2 pixelPos = gl_FragCoord.xy;

    // Sun position - moving in a gentle arc
    float sunX = 0.3 + sin(u_time * 0.1) * 0.2;
    float sunY = 0.6 + cos(u_time * 0.05) * 0.1;
    vec2 sunPos = vec2(sunX, sunY);

    // Mouse repulsion effect
    vec2 mouseNorm = u_mouse / u_resolution;
    float mouseDistance = distance(sunPos, mouseNorm);
    vec2 repulsion = vec2(0.0);
    if (mouseDistance < 0.3 && u_mouseInfluence > 0.0) {
      vec2 dir = normalize(sunPos - mouseNorm);
      repulsion = dir * (0.3 - mouseDistance) * 0.5 * u_mouseInfluence;
    }
    sunPos += repulsion;

    // Distance from sun center
    float dist = distance(uv, sunPos);

    // Sun glow layers
    float sunCore = smoothstep(0.15, 0.0, dist);
    float sunGlow = smoothstep(0.4, 0.15, dist);
    float sunAura = smoothstep(0.6, 0.3, dist);

    // Apply dithering
    float dither = bayer4x4(pixelPos / 2.0);

    // Quantize glow with dithering
    float quantizedCore = step(dither, sunCore);
    float quantizedGlow = step(dither * 0.8, sunGlow);
    float quantizedAura = step(dither * 0.6, sunAura);

    // Background gradient
    vec3 bgColor = mix(skyBlue, warmCloud, uv.y * 0.8 + 0.2);

    // Layer colors
    vec3 color = bgColor;
    color = mix(color, sunYellow * 0.6 + warmCloud * 0.4, quantizedAura * 0.3);
    color = mix(color, sunYellow * 0.8 + warmCloud * 0.2, quantizedGlow * 0.5);
    color = mix(color, sunYellow, quantizedCore);

    gl_FragColor = vec4(color, 1.0);
  }
`;

// ============================================================================
// Component
// ============================================================================

/**
 * WebGL sun background with:
 * - Animated sun moving across screen
 * - 4x4 Bayer matrix dithering for pixel-art aesthetic
 * - Mouse repulsion effect
 * - Intersection Observer to pause when covered
 * - Respects reduceMotion preference
 */
export function SunBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>(0);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const startTimeRef = useRef<number>(0);
  const mouseRef = useRef({ x: 0, y: 0, influence: 0 });
  const isVisibleRef = useRef(true);

  const { reduceMotion } = usePreferencesStore();
  const { openWindows } = useWindowManager();
  const [isFullyCovered, setIsFullyCovered] = useState(false);

  // Check if canvas is fully covered by windows
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkCoverage = () => {
      // If there are many open windows, assume covered
      // This is a simplified check - could be made more precise with getBoundingClientRect
      setIsFullyCovered(openWindows.length >= 3);
    };

    checkCoverage();
  }, [openWindows.length]);

  // Initialize WebGL
  const initGL = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return false;

    const gl = canvas.getContext('webgl');
    if (!gl) {
      console.warn('WebGL not supported');
      return false;
    }

    // Create shaders
    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    if (!vertexShader || !fragmentShader) return false;

    gl.shaderSource(vertexShader, vertexShaderSource);
    gl.shaderSource(fragmentShader, fragmentShaderSource);
    gl.compileShader(vertexShader);
    gl.compileShader(fragmentShader);

    // Check compilation
    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
      console.error('Vertex shader error:', gl.getShaderInfoLog(vertexShader));
      return false;
    }
    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
      console.error('Fragment shader error:', gl.getShaderInfoLog(fragmentShader));
      return false;
    }

    // Create program
    const program = gl.createProgram();
    if (!program) return false;

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(program));
      return false;
    }

    gl.useProgram(program);

    // Set up vertex buffer (full-screen quad)
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW
    );

    const positionLocation = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    glRef.current = gl;
    programRef.current = program;
    startTimeRef.current = performance.now();

    return true;
  }, []);

  // Render frame
  const render = useCallback(() => {
    const gl = glRef.current;
    const program = programRef.current;
    const canvas = canvasRef.current;

    if (!gl || !program || !canvas) return;

    // Update canvas size
    const dpr = window.devicePixelRatio || 1;
    const displayWidth = Math.floor(canvas.clientWidth * dpr);
    const displayHeight = Math.floor(canvas.clientHeight * dpr);

    if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
      canvas.width = displayWidth;
      canvas.height = displayHeight;
      gl.viewport(0, 0, displayWidth, displayHeight);
    }

    // Set uniforms
    const time = reduceMotion ? 0 : (performance.now() - startTimeRef.current) / 1000;

    gl.uniform2f(
      gl.getUniformLocation(program, 'u_resolution'),
      displayWidth,
      displayHeight
    );
    gl.uniform1f(gl.getUniformLocation(program, 'u_time'), time);
    gl.uniform2f(
      gl.getUniformLocation(program, 'u_mouse'),
      mouseRef.current.x * dpr,
      (canvas.clientHeight - mouseRef.current.y) * dpr
    );
    gl.uniform1f(
      gl.getUniformLocation(program, 'u_mouseInfluence'),
      mouseRef.current.influence
    );

    // Draw
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }, [reduceMotion]);

  // Animation loop
  const animate = useCallback(() => {
    if (!isVisibleRef.current || isFullyCovered || reduceMotion) {
      // Still render once for static state
      render();
      return;
    }

    render();
    animationFrameRef.current = requestAnimationFrame(animate);
  }, [render, isFullyCovered, reduceMotion]);

  // Mouse tracking
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleMouseMove = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      mouseRef.current.x = e.clientX - rect.left;
      mouseRef.current.y = e.clientY - rect.top;
      mouseRef.current.influence = 1;
    };

    const handleMouseLeave = () => {
      mouseRef.current.influence = 0;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  // Initialize and start animation
  useEffect(() => {
    if (!initGL()) return;

    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [initGL, animate]);

  // Restart animation when conditions change
  useEffect(() => {
    if (!isFullyCovered && !reduceMotion && glRef.current) {
      animate();
    }
  }, [isFullyCovered, reduceMotion, animate]);

  // Intersection Observer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const observer = new IntersectionObserver(
      (entries) => {
        isVisibleRef.current = entries[0].isIntersecting;
      },
      { threshold: 0 }
    );

    observer.observe(canvas);

    return () => observer.disconnect();
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ touchAction: 'none' }}
    />
  );
}

export default SunBackground;
