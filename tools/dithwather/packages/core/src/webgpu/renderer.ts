/// <reference types="@webgpu/types" />

import tgpu from 'typegpu'
import * as d from 'typegpu/data'
import type { TgpuRoot } from 'typegpu'

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

// ---- Typed data schemas ---------------------------------------------------
//
// TypeGPU computes byte offsets and padding automatically.
// The struct layout must match the WGSL `Uniforms` struct in the shader.
// All fields are 4-byte primitives (u32/f32) so there are no alignment gaps,
// except two explicit pads to bring the total to 64 bytes (multiple of 16).

const Uniforms = d.struct({
  width:        d.u32,
  height:       d.u32,
  pixelScale:   d.u32,
  matrixSize:   d.u32,
  gradientType: d.u32,
  stopCount:    d.u32,
  glitch:       d.f32,
  pad0:         d.u32,   // align to 16-byte boundary
  angle:        d.f32,
  cx:           d.f32,
  cy:           d.f32,
  rx:           d.f32,
  ry:           d.f32,
  startAngle:   d.f32,
  bias:         d.f32,
  pad1:         d.f32,   // total: 16 × 4 = 64 bytes ✓
})

const Stop = d.struct({
  r:        d.f32,
  g:        d.f32,
  b:        d.f32,
  position: d.f32,
})

const MAX_STOPS = 16
const Stops = d.arrayOf(Stop, MAX_STOPS)
const BayerMatrix = d.arrayOf(d.f32, 64) // always max (8×8), shorter matrices zero-padded

// ---- Bind group layout — named keys, not numeric binding indices ----------
//
// TypeGPU validates that each buffer passed to createBindGroup has the right
// usage flags at compile time. Mismatches are caught before any GPU call.

const layout = tgpu.bindGroupLayout({
  uniforms:    { uniform: Uniforms },
  stops:       { storage: Stops,            access: 'readonly' },
  bayerMatrix: { storage: BayerMatrix,       access: 'readonly' },
  output:      { storage: d.u32, access: 'mutable' },  // schema is a placeholder; raw GPUBuffer passed at bind time
})

// ---- WGSL compute shader --------------------------------------------------
//
// TODO: Replace with 'use gpu' TypeScript functions once unplugin-typegpu is
// wired into the tsup config. That would eliminate this inline string and give
// full type safety inside the shader body.

const SHADER_SOURCE = /* wgsl */`
struct Uniforms {
  width:        u32,
  height:       u32,
  pixelScale:   u32,
  matrixSize:   u32,
  gradientType: u32,
  stopCount:    u32,
  glitch:       f32,
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
    case 0u: { return linearT(px, py); }
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

  let bx = lx % u.matrixSize;
  let by_ = ly % u.matrixSize;
  let bayerThreshold = bayerMatrix[by_ * u.matrixSize + bx];

  let useB = (localT + u.bias) > bayerThreshold;
  let rgb = select(cA, cB, useB);

  let rowOffset = 0u;
  if u.glitch > 0.0 && u.width > 0u {
    rowOffset = u32(round(f32(py) * u.glitch)) % u.width;
  }
  let outX = (px + rowOffset) % u.width;
  let outIdx = py * u.width + outX;

  let r = u32(clamp(rgb.r, 0.0, 1.0) * 255.0);
  let g = u32(clamp(rgb.g, 0.0, 1.0) * 255.0);
  let b = u32(clamp(rgb.b, 0.0, 1.0) * 255.0);
  output[outIdx] = r | (g << 8u) | (b << 16u) | (255u << 24u);
}
`

// ---- Renderer -------------------------------------------------------------

export function isWebGPUSupported(): boolean {
  return typeof navigator !== 'undefined' && 'gpu' in navigator
}

export class WebGPUDitherRenderer {
  private constructor(
    private readonly root: TgpuRoot,
    private readonly pipeline: GPUComputePipeline,
  ) {}

  static async create(): Promise<WebGPUDitherRenderer | null> {
    if (!isWebGPUSupported()) return null
    try {
      const root = await tgpu.init()
      const device = root.device
      const module = device.createShaderModule({ code: SHADER_SOURCE })
      const pipeline = await device.createComputePipelineAsync({
        layout: device.createPipelineLayout({
          bindGroupLayouts: [root.unwrap(layout)],
        }),
        compute: { module, entryPoint: 'main' },
      })
      return new WebGPUDitherRenderer(root, pipeline)
    } catch {
      return null
    }
  }

  async render(options: GradientDitherOptions): Promise<ImageData> {
    const { root, pipeline } = this
    const device = root.device

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
    const flatMatrix = matrix.flat()
    const paddedMatrix = Array.from({ length: 64 }, (_, i) => flatMatrix[i] ?? 0)

    const cx = gradient.center[0] * width
    const cy = gradient.center[1] * height
    const maxDim = Math.sqrt(width * width + height * height) / 2
    const rx = gradient.radius * maxDim * (1 / gradient.aspect)
    const ry = gradient.radius * maxDim

    // TypeGPU buffers — struct fields written by name, alignment computed automatically.
    const uniformsBuf = root.createBuffer(Uniforms, {
      width, height, pixelScale, matrixSize,
      gradientType: GRADIENT_TYPE_INDEX[gradient.type] ?? 0,
      stopCount: Math.min(gradient.stops.length, MAX_STOPS),
      glitch, pad0: 0,
      angle: gradient.angle, cx, cy, rx, ry,
      startAngle: gradient.startAngle,
      bias, pad1: 0,
    }).$usage('uniform')

    const stopsArr = gradient.stops.slice(0, MAX_STOPS).map(stop => {
      const rgb = hexToRgb(stop.color)
      return { r: rgb.r / 255, g: rgb.g / 255, b: rgb.b / 255, position: stop.position }
    })
    while (stopsArr.length < MAX_STOPS) stopsArr.push({ r: 0, g: 0, b: 0, position: 0 })
    const stopsBuf = root.createBuffer(Stops, stopsArr).$usage('storage')

    const matrixBuf = root.createBuffer(BayerMatrix, paddedMatrix).$usage('storage')

    // Output buffer is dynamic-sized so we manage it as a raw GPUBuffer.
    // TypeGPU's createBindGroup accepts raw GPUBuffer alongside typed buffers.
    const outputByteSize = width * height * 4
    const outputBuffer = device.createBuffer({
      size: outputByteSize,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
    })

    // Named bind group — TypeGPU validates usage flags at compile time
    const bindGroup = root.createBindGroup(layout, {
      uniforms:    uniformsBuf,
      stops:       stopsBuf,
      bayerMatrix: matrixBuf,
      output:      outputBuffer,
    })

    const encoder = device.createCommandEncoder()
    const pass = encoder.beginComputePass()
    pass.setPipeline(pipeline)
    pass.setBindGroup(0, root.unwrap(bindGroup))
    pass.dispatchWorkgroups(Math.ceil(width / 8), Math.ceil(height / 8))
    pass.end()

    const stagingBuffer = device.createBuffer({
      size: outputByteSize,
      usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
    })
    encoder.copyBufferToBuffer(outputBuffer, 0, stagingBuffer, 0, outputByteSize)
    device.queue.submit([encoder.finish()])

    await stagingBuffer.mapAsync(GPUMapMode.READ)
    const copy = stagingBuffer.getMappedRange().slice(0)
    stagingBuffer.unmap()

    root.unwrap(uniformsBuf).destroy()
    root.unwrap(stopsBuf).destroy()
    root.unwrap(matrixBuf).destroy()
    outputBuffer.destroy()
    stagingBuffer.destroy()

    return new ImageData(new Uint8ClampedArray(copy), width, height)
  }

  destroy(): void {
    this.root.destroy()
  }
}

// ---- Module-level singleton -----------------------------------------------

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
