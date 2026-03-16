/// <reference types="@webgpu/types" />

import { BAYER_MATRICES } from '../algorithms/bayer'
import { hexToRgb } from '../utils/color'
import { renderGradientDither } from '../gradients/render'
import type { GradientDitherOptions } from '../gradients/render'
import type { DitherGradientType } from '../gradients/types'

export type DitherRenderer = 'webgpu' | 'canvas' | 'auto'

const GRADIENT_TYPE_INDEX: Record<DitherGradientType, number> = {
  linear: 0,
  radial: 1,
  conic: 2,
  diamond: 3,
  reflected: 4,
}

// Uniforms struct layout (64 bytes, all 4-byte aligned):
// offset  0: width       u32
// offset  4: height      u32
// offset  8: pixelScale  u32
// offset 12: matrixSize  u32
// offset 16: gradientType u32
// offset 20: stopCount   u32
// offset 24: glitch      u32
// offset 28: _pad        u32
// offset 32: angle       f32
// offset 36: cx          f32
// offset 40: cy          f32
// offset 44: rx          f32
// offset 48: ry          f32
// offset 52: startAngle  f32
// offset 56: bias        f32
// offset 60: _pad2       f32

const SHADER_SOURCE = /* wgsl */`
struct Uniforms {
  width:        u32,
  height:       u32,
  pixelScale:   u32,
  matrixSize:   u32,
  gradientType: u32,
  stopCount:    u32,
  glitch:       u32,
  _pad:         u32,
  angle:        f32,
  cx:           f32,
  cy:           f32,
  rx:           f32,
  ry:           f32,
  startAngle:   f32,
  bias:         f32,
  _pad2:        f32,
}

struct Stop {
  r:        f32,
  g:        f32,
  b:        f32,
  position: f32,
}

@group(0) @binding(0) var<uniform>            u:          Uniforms;
@group(0) @binding(1) var<storage, read>      stops:      array<Stop>;
@group(0) @binding(2) var<storage, read>      bayerMatrix: array<f32>;
@group(0) @binding(3) var<storage, read_write> output:    array<u32>;

fn linearT(px: f32, py: f32) -> f32 {
  let rad = u.angle * (3.14159265358979 / 180.0);
  let dx = sin(rad);
  let dy = -cos(rad);
  let w = f32(u.width);
  let h = f32(u.height);
  let halfLen = abs(w * 0.5 * dx) + abs(h * 0.5 * dy);
  if halfLen == 0.0 { return 0.5; }
  let proj = (px - w * 0.5) * dx + (py - h * 0.5) * dy;
  return clamp((proj + halfLen) / (2.0 * halfLen), 0.0, 1.0);
}

fn gradientT(px: f32, py: f32) -> f32 {
  switch u.gradientType {
    case 0u: {
      return linearT(px, py);
    }
    case 1u: {
      if u.rx == 0.0 || u.ry == 0.0 { return 1.0; }
      let ndx = (px - u.cx) / u.rx;
      let ndy = (py - u.cy) / u.ry;
      return clamp(sqrt(ndx * ndx + ndy * ndy), 0.0, 1.0);
    }
    case 2u: {
      let startRad = u.startAngle * (3.14159265358979 / 180.0);
      var theta = atan2(px - u.cx, -(py - u.cy));
      theta = theta - startRad;
      let TWO_PI = 6.28318530717959;
      theta = ((theta % TWO_PI) + TWO_PI) % TWO_PI;
      return theta / TWO_PI;
    }
    case 3u: {
      if u.rx == 0.0 || u.ry == 0.0 { return 1.0; }
      let ndx = abs(px - u.cx) / u.rx;
      let ndy = abs(py - u.cy) / u.ry;
      return clamp(ndx + ndy, 0.0, 1.0);
    }
    case 4u: {
      let t = linearT(px, py);
      return 1.0 - abs(2.0 * t - 1.0);
    }
    default: { return 0.0; }
  }
}

@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) gid: vec3<u32>) {
  let px = gid.x;
  let py = gid.y;
  if px >= u.width || py >= u.height { return; }

  let lx = px / u.pixelScale;
  let ly = py / u.pixelScale;
  let sampleX = f32(lx * u.pixelScale) + f32(u.pixelScale) * 0.5;
  let sampleY = f32(ly * u.pixelScale) + f32(u.pixelScale) * 0.5;

  let t = gradientT(sampleX, sampleY);

  // Stop segment lookup — default to last stop color
  let n = u.stopCount;
  if n < 2u { return; }
  var cA = vec3<f32>(stops[n - 1u].r, stops[n - 1u].g, stops[n - 1u].b);
  var cB = cA;
  var localT = 1.0;

  for (var i = 0u; i < 15u; i++) {
    if i >= n - 1u { break; }
    if t <= stops[i + 1u].position {
      let segLen = stops[i + 1u].position - stops[i].position;
      cA = vec3<f32>(stops[i].r, stops[i].g, stops[i].b);
      cB = vec3<f32>(stops[i + 1u].r, stops[i + 1u].g, stops[i + 1u].b);
      localT = select(0.0, clamp((t - stops[i].position) / segLen, 0.0, 1.0), segLen > 0.0);
      break;
    }
  }

  // Bayer threshold at this logical pixel
  let bx = lx % u.matrixSize;
  let by_ = ly % u.matrixSize;
  let bayerThreshold = bayerMatrix[by_ * u.matrixSize + bx];

  let useB = (localT + u.bias) > bayerThreshold;
  let rgb = select(cA, cB, useB);

  // Output index — glitch shifts the row stride
  let stride = select(u.width, u.width + u.glitch, u.glitch > 0u);
  let outIdx = py * stride + px;
  if outIdx >= u.width * u.height { return; }

  // Pack as little-endian u32: R in bits 0-7 → maps directly to ImageData RGBA bytes
  let r = u32(clamp(rgb.r, 0.0, 1.0) * 255.0);
  let g = u32(clamp(rgb.g, 0.0, 1.0) * 255.0);
  let b = u32(clamp(rgb.b, 0.0, 1.0) * 255.0);
  output[outIdx] = r | (g << 8u) | (b << 16u) | (255u << 24u);
}
`

const MAX_STOPS = 16

export function isWebGPUSupported(): boolean {
  return typeof navigator !== 'undefined' && 'gpu' in navigator
}

export class WebGPUDitherRenderer {
  private constructor(
    private readonly device: GPUDevice,
    private readonly pipeline: GPUComputePipeline,
  ) {}

  static async create(): Promise<WebGPUDitherRenderer | null> {
    if (!isWebGPUSupported()) return null
    try {
      const adapter = await navigator.gpu.requestAdapter()
      if (!adapter) return null
      const device = await adapter.requestDevice()
      const module = device.createShaderModule({ code: SHADER_SOURCE })
      const pipeline = await device.createComputePipelineAsync({
        layout: 'auto',
        compute: { module, entryPoint: 'main' },
      })
      return new WebGPUDitherRenderer(device, pipeline)
    } catch {
      return null
    }
  }

  async render(options: GradientDitherOptions): Promise<ImageData> {
    const {
      gradient,
      algorithm,
      width: rawWidth,
      height: rawHeight,
      threshold: bias = 0,
      pixelScale: rawPixelScale = 1,
      glitch = 0,
    } = options

    const width = Math.round(rawWidth)
    const height = Math.round(rawHeight)
    const pixelScale = Math.max(1, Math.round(rawPixelScale))

    const matrix = BAYER_MATRICES[algorithm]
    if (!matrix) throw new Error(`Unknown algorithm: ${algorithm}`)
    const matrixSize = matrix.length
    const flatMatrix = new Float32Array(matrix.flat())

    const { device, pipeline } = this

    // Uniforms (64 bytes)
    const uniformData = new ArrayBuffer(64)
    const view = new DataView(uniformData)
    const cx = gradient.center[0] * width
    const cy = gradient.center[1] * height
    const maxDim = Math.sqrt(width * width + height * height) / 2
    const rx = gradient.radius * maxDim * (1 / gradient.aspect)
    const ry = gradient.radius * maxDim

    view.setUint32(0, width, true)
    view.setUint32(4, height, true)
    view.setUint32(8, pixelScale, true)
    view.setUint32(12, matrixSize, true)
    view.setUint32(16, GRADIENT_TYPE_INDEX[gradient.type] ?? 0, true)
    view.setUint32(20, Math.min(gradient.stops.length, MAX_STOPS), true)
    view.setUint32(24, glitch, true)
    view.setUint32(28, 0, true)
    view.setFloat32(32, gradient.angle, true)
    view.setFloat32(36, cx, true)
    view.setFloat32(40, cy, true)
    view.setFloat32(44, rx, true)
    view.setFloat32(48, ry, true)
    view.setFloat32(52, gradient.startAngle, true)
    view.setFloat32(56, bias, true)
    view.setFloat32(60, 0, true)

    const uniformBuffer = device.createBuffer({
      size: 64,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    })
    device.queue.writeBuffer(uniformBuffer, 0, uniformData)

    // Stops (16 × {r,g,b,position} f32 = 256 bytes)
    const stopsData = new Float32Array(MAX_STOPS * 4)
    const resolvedStops = gradient.stops.slice(0, MAX_STOPS)
    for (let i = 0; i < resolvedStops.length; i++) {
      const rgb = hexToRgb(resolvedStops[i].color)
      stopsData[i * 4 + 0] = rgb.r / 255
      stopsData[i * 4 + 1] = rgb.g / 255
      stopsData[i * 4 + 2] = rgb.b / 255
      stopsData[i * 4 + 3] = resolvedStops[i].position
    }
    const stopsBuffer = device.createBuffer({
      size: stopsData.byteLength,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    })
    device.queue.writeBuffer(stopsBuffer, 0, stopsData)

    // Bayer matrix
    const matrixBuffer = device.createBuffer({
      size: flatMatrix.byteLength,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    })
    device.queue.writeBuffer(matrixBuffer, 0, flatMatrix)

    // Output (width × height × 4 bytes)
    const outputByteSize = width * height * 4
    const outputBuffer = device.createBuffer({
      size: outputByteSize,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
    })

    const bindGroup = device.createBindGroup({
      layout: pipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: uniformBuffer } },
        { binding: 1, resource: { buffer: stopsBuffer } },
        { binding: 2, resource: { buffer: matrixBuffer } },
        { binding: 3, resource: { buffer: outputBuffer } },
      ],
    })

    const encoder = device.createCommandEncoder()
    const pass = encoder.beginComputePass()
    pass.setPipeline(pipeline)
    pass.setBindGroup(0, bindGroup)
    pass.dispatchWorkgroups(Math.ceil(width / 8), Math.ceil(height / 8))
    pass.end()

    // Copy to staging for CPU readback
    const stagingBuffer = device.createBuffer({
      size: outputByteSize,
      usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
    })
    encoder.copyBufferToBuffer(outputBuffer, 0, stagingBuffer, 0, outputByteSize)
    device.queue.submit([encoder.finish()])

    await stagingBuffer.mapAsync(GPUMapMode.READ)
    // Slice before unmap — the ArrayBuffer is invalidated after unmap()
    const copy = stagingBuffer.getMappedRange().slice(0)
    stagingBuffer.unmap()

    uniformBuffer.destroy()
    stopsBuffer.destroy()
    matrixBuffer.destroy()
    outputBuffer.destroy()
    stagingBuffer.destroy()

    // Little-endian u32 packing (R in bits 0-7) matches Uint8ClampedArray RGBA layout directly
    return new ImageData(new Uint8ClampedArray(copy), width, height)
  }

  destroy(): void {
    this.device.destroy()
  }
}

// Module-level singleton — shared across all components
let _rendererPromise: Promise<WebGPUDitherRenderer | null> | null = null

export function getWebGPURenderer(): Promise<WebGPUDitherRenderer | null> {
  if (!_rendererPromise) {
    _rendererPromise = WebGPUDitherRenderer.create()
  }
  return _rendererPromise
}

/**
 * Render a dithered gradient, dispatching to WebGPU when available.
 * Falls back to the CPU canvas path transparently.
 */
export async function renderGradientDitherAuto(
  options: GradientDitherOptions,
  renderer: DitherRenderer = 'auto',
): Promise<ImageData> {
  if (renderer !== 'canvas' && isWebGPUSupported()) {
    const gpuRenderer = await getWebGPURenderer()
    if (gpuRenderer) return gpuRenderer.render(options)
  }
  return renderGradientDither(options)
}
