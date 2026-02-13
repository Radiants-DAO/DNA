'use client';

import { useEffect, useRef, useState } from 'react';

const MOBILE_BREAKPOINT = 768;

const SETTINGS = {
  enabled: true,
  opacity: 0.4,
  blendMode: 'overlay' as const,
  maskSize: 1,
  maskBorder: 1,
  screenCurvature: 0.1,
  vignette: 1,
  pulseIntensity: 0.1,
  pulseWidth: 150,
  pulseRate: 13,
  scanlineIntensity: 0,
  brightness: 1.25,
  saturation: 1.25,
} as const;

interface UniformLocations {
  resolution: WebGLUniformLocation | null;
  time: WebGLUniformLocation | null;
  enabled: WebGLUniformLocation | null;
  maskSize: WebGLUniformLocation | null;
  maskBorder: WebGLUniformLocation | null;
  screenCurvature: WebGLUniformLocation | null;
  vignette: WebGLUniformLocation | null;
  pulseIntensity: WebGLUniformLocation | null;
  pulseWidth: WebGLUniformLocation | null;
  pulseRate: WebGLUniformLocation | null;
  scanlineIntensity: WebGLUniformLocation | null;
  brightness: WebGLUniformLocation | null;
  saturation: WebGLUniformLocation | null;
  opacity: WebGLUniformLocation | null;
}

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
  const [isMobile, setIsMobile] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const animationRef = useRef<number>(0);
  const uniformsRef = useRef<UniformLocations | null>(null);

  // Detect mobile and Safari on mount
  useEffect(() => {
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    setIsMobile(window.innerWidth <= MOBILE_BREAKPOINT || isSafari);
  }, []);

  useEffect(() => {
    if (isMobile) return; // Skip WebGL setup on mobile
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl', {
      alpha: true,
      premultipliedAlpha: false,
      antialias: false,
    });
    if (!gl) return;
    glRef.current = gl;

    const vertexShader = gl.createShader(gl.VERTEX_SHADER)!;
    gl.shaderSource(vertexShader, vertexShaderSource);
    gl.compileShader(vertexShader);

    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)!;
    gl.shaderSource(fragmentShader, fragmentShaderSource);
    gl.compileShader(fragmentShader);

    const program = gl.createProgram()!;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    programRef.current = program;

    uniformsRef.current = {
      resolution: gl.getUniformLocation(program, 'u_resolution'),
      time: gl.getUniformLocation(program, 'u_time'),
      enabled: gl.getUniformLocation(program, 'u_enabled'),
      maskSize: gl.getUniformLocation(program, 'u_maskSize'),
      maskBorder: gl.getUniformLocation(program, 'u_maskBorder'),
      screenCurvature: gl.getUniformLocation(program, 'u_screenCurvature'),
      vignette: gl.getUniformLocation(program, 'u_vignette'),
      pulseIntensity: gl.getUniformLocation(program, 'u_pulseIntensity'),
      pulseWidth: gl.getUniformLocation(program, 'u_pulseWidth'),
      pulseRate: gl.getUniformLocation(program, 'u_pulseRate'),
      scanlineIntensity: gl.getUniformLocation(program, 'u_scanlineIntensity'),
      brightness: gl.getUniformLocation(program, 'u_brightness'),
      saturation: gl.getUniformLocation(program, 'u_saturation'),
      opacity: gl.getUniformLocation(program, 'u_opacity'),
    };

    const positions = new Float32Array([
      -1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1,
    ]);
    const texCoords = new Float32Array([0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1]);

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

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [isMobile]);

  useEffect(() => {
    if (isMobile) return; // Skip rendering on mobile

    const gl = glRef.current;
    const program = programRef.current;
    const canvas = canvasRef.current;
    const uniforms = uniformsRef.current;
    if (!gl || !program || !canvas || !uniforms) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();
    window.addEventListener('resize', resize, { passive: true });

    const render = (time: number) => {
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.uniform2f(uniforms.resolution, canvas.width, canvas.height);
      gl.uniform1f(uniforms.time, time * 0.001);
      gl.uniform1i(uniforms.enabled, SETTINGS.enabled ? 1 : 0);
      gl.uniform1f(uniforms.maskSize, SETTINGS.maskSize);
      gl.uniform1f(uniforms.maskBorder, SETTINGS.maskBorder);
      gl.uniform1f(uniforms.screenCurvature, SETTINGS.screenCurvature);
      gl.uniform1f(uniforms.vignette, SETTINGS.vignette);
      gl.uniform1f(uniforms.pulseIntensity, SETTINGS.pulseIntensity);
      gl.uniform1f(uniforms.pulseWidth, SETTINGS.pulseWidth);
      gl.uniform1f(uniforms.pulseRate, SETTINGS.pulseRate);
      gl.uniform1f(uniforms.scanlineIntensity, SETTINGS.scanlineIntensity);
      gl.uniform1f(uniforms.brightness, SETTINGS.brightness);
      gl.uniform1f(uniforms.saturation, SETTINGS.saturation);
      gl.uniform1f(uniforms.opacity, SETTINGS.opacity);

      gl.drawArrays(gl.TRIANGLES, 0, 6);
      animationRef.current = requestAnimationFrame(render);
    };

    animationRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationRef.current);
    };
  }, [isMobile]);

  // Don't render on mobile
  if (isMobile) return null;

  return (
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
        mixBlendMode: SETTINGS.blendMode,
      }}
    />
  );
}
