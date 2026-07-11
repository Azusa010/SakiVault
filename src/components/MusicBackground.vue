<template>
  <div class="music-background" :class="{ 'is-playing': isPlaying }">
    <canvas ref="canvasRef" aria-hidden="true"></canvas>
  </div>
</template>

<script setup lang="ts" name="MusicBackground">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as THREE from 'three'
import type { AudioReactiveState } from '@/utils/audioReactive'
import { clamp } from '@/utils/audioReactive'
import { selectPaletteColors, type PaletteCandidate, type RgbColor } from '@/utils/coverPalette'

// 背景组件接收的播放状态
interface MusicBackgroundProps {
  coverUrl: string
  audio: AudioReactiveState
  isPlaying: boolean
}

const props = defineProps<MusicBackgroundProps>()

const canvasRef = ref<HTMLCanvasElement | null>(null)

let renderer: THREE.WebGLRenderer | null = null
let scene: THREE.Scene | null = null
let camera: THREE.OrthographicCamera | null = null
let material: THREE.ShaderMaterial | null = null
let geometry: THREE.PlaneGeometry | null = null
let animationFrameId: number | null = null
let resizeObserver: ResizeObserver | null = null
let currentTexture: THREE.Texture | null = null
let fallbackTexture: THREE.DataTexture | null = null
let lastFrameTime = 0
let coverRequestId = 0
let lastDebugTime = 0

// 传入着色器的所有动态参数
interface BackgroundUniforms {
  uTime: { value: number }
  uCover: { value: THREE.Texture }
  uResolution: { value: THREE.Vector2 }
  uColorA: { value: THREE.Color }
  uColorB: { value: THREE.Color }
  uColorC: { value: THREE.Color }
  uColorWeights: { value: THREE.Vector3 }
  uBass: { value: number }
  uMid: { value: number }
  uTreble: { value: number }
  uBeat: { value: number }

  [uniform: string]: THREE.IUniform<unknown>
}

let uniforms: BackgroundUniforms | null = null

const defaultPalette = [
  new THREE.Color('#43575d'),
  new THREE.Color('#5d654d'),
  new THREE.Color('#765947'),
]
const defaultWeights = new THREE.Vector3(0.6, 0.28, 0.12)

const vertexShader = `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`

const fragmentShader = `
precision highp float;

varying vec2 vUv;

uniform sampler2D uCover;
uniform vec2 uResolution;
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform vec3 uColorC;
uniform vec3 uColorWeights;
uniform float uTime;
uniform float uBass;
uniform float uMid;
uniform float uTreble;
uniform float uBeat;

float hash(vec2 point) {
  return fract(sin(dot(point, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 point) {
  vec2 cell = floor(point);
  vec2 local = fract(point);
  local = local * local * (3.0 - 2.0 * local);

  return mix(
    mix(hash(cell), hash(cell + vec2(1.0, 0.0)), local.x),
    mix(hash(cell + vec2(0.0, 1.0)), hash(cell + vec2(1.0, 1.0)), local.x),
    local.y
  );
}

float fbm(vec2 point) {
  float value = 0.0;
  float amplitude = 0.5;

  for (int index = 0; index < 5; index++) {
    value += amplitude * noise(point);
    point = point * 2.03 + vec2(17.4, 11.8);
    amplitude *= 0.5;
  }

  return value;
}

vec3 blurCover(vec2 uv, float radius) {
  vec2 x = vec2(radius, 0.0);
  vec2 y = vec2(0.0, radius);

  vec3 color = texture2D(uCover, uv).rgb * 0.24;
  color += texture2D(uCover, uv + x).rgb * 0.13;
  color += texture2D(uCover, uv - x).rgb * 0.13;
  color += texture2D(uCover, uv + y).rgb * 0.13;
  color += texture2D(uCover, uv - y).rgb * 0.13;
  color += texture2D(uCover, uv + x + y).rgb * 0.06;
  color += texture2D(uCover, uv + x - y).rgb * 0.06;
  color += texture2D(uCover, uv - x + y).rgb * 0.06;
  color += texture2D(uCover, uv - x - y).rgb * 0.06;

  return color;
}

void main() {
  vec2 aspect = vec2(uResolution.x / max(uResolution.y, 1.0), 1.0);
  vec2 point = (vUv - 0.5) * aspect;
  float flowTime = uTime * 0.14;
  float audioPush = uBass * 0.32 + uBeat * 0.48;

  vec2 largeFlow = vec2(
    fbm(point * 1.15 + vec2(flowTime, -flowTime * 0.72)),
    fbm(point * 1.15 + vec2(-flowTime * 0.66, flowTime * 0.81))
  ) - 0.5;

  vec2 mediumFlow = vec2(
    fbm(point * 2.7 + vec2(-flowTime * 1.18, flowTime * 0.64)),
    fbm(point * 2.7 + vec2(flowTime * 0.76, flowTime * 1.12))
  ) - 0.5;

  vec2 domain = point
    + largeFlow * (0.54 + audioPush)
    + mediumFlow * (0.16 + uMid * 0.26);

  float paletteFlowA = fbm(domain * 1.65 + vec2(flowTime * 0.35));
  float paletteFlowB = fbm(domain * 2.45 + vec2(-flowTime * 0.28, flowTime * 0.52));
  float paletteFlowC = fbm(domain * 3.15 - vec2(flowTime * 0.42, flowTime * 0.18));

  // 压缩封面颜色之间过大的面积差距。
// 保留主次顺序，但避免黑色主色完全吞掉其他颜色。
vec3 displayWeights = sqrt(max(uColorWeights, vec3(0.0)));
float displayWeightTotal =
  displayWeights.x
  + displayWeights.y
  + displayWeights.z;

displayWeights /= max(displayWeightTotal, 0.001);

// 三种颜色分别使用独立噪声场，避免由同一阈值产生套娃色块。
float primaryField = pow(
  smoothstep(0.24, 0.76, paletteFlowA),
  1.8
);
float secondaryField = pow(
  smoothstep(0.24, 0.76, paletteFlowB),
  1.8
);
float accentField = pow(
  smoothstep(0.24, 0.76, paletteFlowC),
  1.8
);

// 面积权重决定总体主次，独立噪声决定每种颜色出现的位置。
vec3 colorInfluence = displayWeights * (
  vec3(0.1)
  + vec3(
    primaryField,
    secondaryField,
    accentField
  ) * 1.9
);

// 没有第三种颜色时，彻底关闭第三色影响。
colorInfluence.z *= step(0.001, uColorWeights.z);

float influenceTotal =
  colorInfluence.x
  + colorInfluence.y
  + colorInfluence.z;

colorInfluence /= max(influenceTotal, 0.001);

// 使用归一化影响力同时混合三种颜色，不再逐层覆盖。
vec3 color =
  uColorA * colorInfluence.x * 0.78
  + uColorB * colorInfluence.y
  + uColorC * colorInfluence.z * 1.04;

  float vignette = 1.0 - smoothstep(0.16, 1.16, length(point));
color *= 0.18 + vignette * 0.58;

// 时间决定缓慢移动，中频只轻微扩大移动范围，不直接改变运动相位。
vec2 reactiveCenter = vec2(
  sin(uTime * 0.10) * (0.24 + uMid * 0.08),
  cos(uTime * 0.085) * (0.16 + uMid * 0.06)
);

// 低频控制色块面积，节拍负责短促膨胀。
float bassEnergy = smoothstep(0.18, 0.78, uBass);
float beatEnergy = clamp(uBeat * 2.8, 0.0, 1.0);
float reactiveRadius =
  0.16
  + bassEnergy * 0.18
  + beatEnergy * 0.14;

float reactiveDistance = length(point - reactiveCenter);
float reactiveBlob = 1.0 - smoothstep(
  reactiveRadius,
  reactiveRadius + 0.24,
  reactiveDistance
);

// 在第二、第三颜色之间缓慢切换，使闪动仍然来自封面颜色。
vec3 reactiveColor = mix(
  uColorB,
  uColorC,
  sin(uTime * 0.07) * 0.5 + 0.5
);

// 低频提供持续的“呼吸”，节拍提供更强的局部闪动。
float reactiveStrength =
  bassEnergy * 0.12
  + beatEnergy * 0.52;

color += reactiveColor * reactiveBlob * reactiveStrength;

// 高频只在局部色块边缘产生轻微亮边。
float reactiveEdge = reactiveBlob * (1.0 - reactiveBlob) * 4.0;
color += reactiveColor * reactiveEdge * uTreble * 0.09;

color = pow(max(color, vec3(0.0)), vec3(0.92));

  gl_FragColor = vec4(color, 1.0);
}
`

// 计算 RGB 感知亮度 [0,255]
function getBrightness({ red, green, blue }: RgbColor): number {
  return (red * 299 + green * 587 + blue * 114) / 1000
}

// 计算 RGB 饱和度， [0,1]
function getSaturation({ red, green, blue }: RgbColor): number {
  const max = Math.max(red, green, blue)
  const min = Math.min(red, green, blue)

  return max === 0 ? 0 : (max - min) / max
}

// 背景调色板同时保留颜色和它们在封面中的面积占比。
interface CoverPaletteSelection {
  colors: THREE.Color[]
  weights: [number, number, number]
}

function supportsWebGl(): boolean {
  return typeof window.WebGLRenderingContext !== 'undefined'
}

// 创建用于无封面、封面加载失败时的纹理
function createFallbackTexture(): THREE.DataTexture {
  const texture = new THREE.DataTexture(new Uint8Array([35, 47, 52, 255]), 1, 1, THREE.RGBAFormat)

  texture.colorSpace = THREE.SRGBColorSpace
  texture.needsUpdate = true

  return texture
}

// *读取封面并提取三个明显颜色，跳过纯黑和纯白区域
async function extractCoverPalette(url: string): Promise<CoverPaletteSelection> {
  const fallbackSelection = (): CoverPaletteSelection => ({
    colors: defaultPalette,
    weights: [defaultWeights.x, defaultWeights.y, defaultWeights.z],
  })

  if (!url) return fallbackSelection()

  try {
    const image = await new Promise<HTMLImageElement>((res, rej) => {
      const element = new Image()
      element.crossOrigin = 'anonymous'
      element.onload = () => res(element)
      element.onerror = () => rej(new Error('封面加载失败'))
      element.src = url
    })

    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')

    if (!context) return fallbackSelection()

    canvas.width = 32
    canvas.height = 32
    context.drawImage(image, 0, 0, canvas.width, canvas.height)

    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data
    const buckets = new Map<string, PaletteCandidate>()

    for (let index = 0; index < pixels.length; index += 16) {
      const color = {
        red: pixels[index] || 0,
        green: pixels[index + 1] || 0,
        blue: pixels[index + 2] || 0,
      }
      const alpha = pixels[index + 3] || 0
      const brightness = getBrightness(color)
      const saturation = getSaturation(color)

      // 深色和中性色也可能是封面主色，仅过滤透明像素与接近纯白的留白。
      if (alpha < 200 || (brightness > 245 && saturation < 0.08)) continue

      const bucketColor = {
        red: Math.floor(color.red / 32) * 32 + 16,
        green: Math.floor(color.green / 32) * 32 + 16,
        blue: Math.floor(color.blue / 32) * 32 + 16,
      }

      const key = `${bucketColor.red}-${bucketColor.green}-${bucketColor.blue}`
      const bucket = buckets.get(key)

      if (bucket) {
        bucket.score += 1
      } else {
        buckets.set(key, { color: bucketColor, score: 1 })
      }
    }

    const selected = selectPaletteColors([...buckets.values()])

    const palette = [
      selected.colors[0] || { red: 67, green: 87, blue: 93 },
      selected.colors[1] || selected.colors[0] || { red: 93, green: 101, blue: 77 },
      selected.colors[2] ||
        selected.colors[1] ||
        selected.colors[0] || { red: 118, green: 89, blue: 71 },
    ]

    return {
      colors: palette.map((color) =>
        new THREE.Color().setRGB(
          color.red / 255,
          color.green / 255,
          color.blue / 255,
          THREE.SRGBColorSpace,
        ),
      ),
      weights: [selected.weights[0] ?? 1, selected.weights[1] ?? 0, selected.weights[2] ?? 0],
    }
  } catch {
    return fallbackSelection()
  }
}

// 将纹理替换到着色器，同时释放旧封面的GPU资源
function replaceCoverTexture(texture: THREE.Texture): void {
  if (!uniforms) return

  if (currentTexture && currentTexture !== fallbackTexture) {
    currentTexture.dispose()
  }

  currentTexture = texture
  uniforms.uCover.value = texture
}

// 切歌时异步更新封面纹理与调色板
async function updateCover(url: string): Promise<void> {
  if (!material || !uniforms) return

  const requestId = ++coverRequestId

  if (!url) {
    if (fallbackTexture) replaceCoverTexture(fallbackTexture)
    uniforms.uColorA.value.copy(defaultPalette[0]!)
    uniforms.uColorB.value.copy(defaultPalette[1]!)
    uniforms.uColorC.value.copy(defaultPalette[2]!)
    uniforms.uColorWeights.value.copy(defaultWeights)
    return
  }

  const loader = new THREE.TextureLoader()
  loader.setCrossOrigin('anonymous')

  loader.load(
    url,
    (texture) => {
      if (requestId !== coverRequestId) {
        texture.dispose()
        return
      }

      texture.colorSpace = THREE.SRGBColorSpace
      texture.minFilter = THREE.LinearFilter
      texture.magFilter = THREE.LinearFilter
      replaceCoverTexture(texture)
    },
    undefined,
    () => {
      if (requestId === coverRequestId && fallbackTexture) {
        replaceCoverTexture(fallbackTexture)
      }
    },
  )

  const palette = await extractCoverPalette(url)

  if (requestId !== coverRequestId || !uniforms) return

  uniforms.uColorA.value.copy(palette.colors[0]!)
  uniforms.uColorB.value.copy(palette.colors[1]!)
  uniforms.uColorC.value.copy(palette.colors[2]!)
  uniforms.uColorWeights.value.fromArray(palette.weights)
}

// 根据画布的实际尺寸更新Three.js 渲染分辨率
function resizeRenderer(): void {
  const canvas = canvasRef.value

  if (!canvas || !renderer || !uniforms) return

  const width = Math.max(canvas.clientWidth, 1)
  const height = Math.max(canvas.clientHeight, 1)
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2)

  renderer.setPixelRatio(pixelRatio)
  renderer.setSize(width, height, false)
  uniforms.uResolution.value.set(width * pixelRatio, height * pixelRatio)
}

// 每帧将音频状态写入 shader uniform；不会触发 Vue 重渲染。
function renderFrame(timestamp: number): void {
  if (!renderer || !scene || !camera || !uniforms) return

  const elapsedSeconds = clamp((timestamp - lastFrameTime) / 1000 || 0, 0, 0.1)
  lastFrameTime = timestamp

  uniforms.uTime.value += elapsedSeconds * (props.isPlaying ? 1 : 0.16)
  uniforms.uBass.value += ((props.isPlaying ? props.audio.bass : 0) - uniforms.uBass.value) * 0.12
  uniforms.uMid.value += ((props.isPlaying ? props.audio.mid : 0) - uniforms.uMid.value) * 0.1
  uniforms.uTreble.value +=
    ((props.isPlaying ? props.audio.treble : 0) - uniforms.uTreble.value) * 0.08
  uniforms.uBeat.value += ((props.isPlaying ? props.audio.beat : 0) - uniforms.uBeat.value) * 0.2

  renderer.render(scene, camera)
  animationFrameId = requestAnimationFrame(renderFrame)
}

// 初始化Three.js 全屏平面与着色器
function initializeRenderer(): void {
  const canvas = canvasRef.value

  if (!canvas || !supportsWebGl()) return

  renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: false,
    antialias: false,
    powerPreference: 'high-performance',
  })

  scene = new THREE.Scene()
  camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
  geometry = new THREE.PlaneGeometry(2, 2)
  fallbackTexture = createFallbackTexture()
  currentTexture = fallbackTexture

  uniforms = {
    uTime: { value: 0 },
    uCover: { value: fallbackTexture },
    uResolution: { value: new THREE.Vector2(1, 1) },
    uColorA: { value: defaultPalette[0]!.clone() },
    uColorB: { value: defaultPalette[1]!.clone() },
    uColorC: { value: defaultPalette[2]!.clone() },
    uColorWeights: { value: defaultWeights.clone() },
    uBass: { value: 0 },
    uMid: { value: 0 },
    uTreble: { value: 0 },
    uBeat: { value: 0 },
  }

  material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader,
    fragmentShader,
    depthWrite: false,
    depthTest: false,
  })

  scene.add(new THREE.Mesh(geometry, material))
  resizeRenderer()

  resizeObserver = new ResizeObserver(resizeRenderer)
  resizeObserver.observe(canvas)

  void updateCover(props.coverUrl)
  animationFrameId = requestAnimationFrame(renderFrame)
}

// 释放动画帧、纹理、材质和WebGL上下文
function disposeRenderer(): void {
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId)
    animationFrameId = null
  }

  resizeObserver?.disconnect()
  resizeObserver = null

  if (currentTexture && currentTexture !== fallbackTexture) {
    currentTexture.dispose()
  }

  fallbackTexture?.dispose()
  geometry?.dispose()
  material?.dispose()
  renderer?.dispose()

  currentTexture = null
  fallbackTexture = null
  geometry = null
  material = null
  renderer = null
  scene = null
  camera = null
  uniforms = null
}

watch(
  () => props.coverUrl,
  (coverUrl) => {
    void updateCover(coverUrl)
  },
)

onMounted(initializeRenderer)
onBeforeUnmount(disposeRenderer)
</script>

<style scoped>
.music-background {
  position: absolute;
  z-index: 0;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  background: #1b2022;
}

.music-background canvas {
  display: block;
  width: 100%;
  height: 100%;
  filter: saturate(1.1) contrast(1.03);
}

.music-background::after {
  position: absolute;
  inset: 0;
  content: '';
  background: rgba(5, 8, 10, 0.1);
}

.music-background.is-playing canvas {
  filter: saturate(1.18) contrast(1.05);
}
</style>
