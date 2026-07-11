<template>
  <div class="music-background" :class="{ 'is-playing': isPlaying, 'is-active': isActive }">
    <canvas ref="canvasRef" aria-hidden="true"></canvas>
  </div>
</template>

<script setup lang="ts" name="MusicBackground">
import { onBeforeUnmount, onMounted, ref, render, watch } from 'vue'
import * as THREE from 'three'
import type { AudioReactiveState } from '@/utils/audioReactive'
import { clamp } from '@/utils/audioReactive'
import { selectPaletteColors, type PaletteCandidate, type RgbColor } from '@/utils/coverPalette'

// 背景组件接收的播放状态
interface MusicBackgroundProps {
  coverUrl: string
  audio: AudioReactiveState
  isPlaying: boolean
  isActive: boolean
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

/* 生成稳定的伪随机值，用于碎光与流体纹理。 */
float hash(vec2 point) {
  return fract(sin(dot(point, vec2(127.1, 311.7))) * 43758.5453123);
}

/* 生成二维平滑噪声，避免背景出现生硬的规则图案。 */
float noise(vec2 point) {
  vec2 cell = floor(point);
  vec2 local = fract(point);
  local = local * local * (3.0 - 2.0 * local);

  return mix(
    mix(hash(cell), hash(cell + vec2(1.0, 0.0)), local.x),
  mix(
    hash(cell + vec2(0.0, 1.0)),
   hash(cell + vec2(1.0, 1.0)),
   local.x
  ),
    local.y
  );
}

/* 叠加多层噪声，得到大范围且自然的流体流向。 */
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

/* 创建柔和色团；softness 越大，边缘越柔和。 */
float softBlob(vec2 point, vec2 center, float radius, float softness) {
  float distanceToCenter = length(point - center);

  return 1.0 - smoothstep(radius, radius + softness, distanceToCenter);
}

/* 创建一圈扩散波纹，避免中频只影响不可见的流动参数。 */
float waveRing(vec2 point, vec2 center, float radius, float width) {
  float distanceToCenter = length(point - center);
  float ringDistance = abs(distanceToCenter - radius);

  return 1.0 - smoothstep(width, width * 2.8, ringDistance);
}

void main() {
  vec2 aspect = vec2(uResolution.x / max(uResolution.y, 1.0), 1.0);
  vec2 point = (vUv - 0.5) * aspect;

  float flowTime = uTime * 0.14;
  float bassEnergy = smoothstep(0.12, 0.72, uBass);
  float midEnergy = smoothstep(0.10, 0.68, uMid);
  float trebleEnergy = smoothstep(0.08, 0.62, uTreble);
  float beatEnergy = clamp(uBeat * 2.8, 0.0, 1.0);

  /* 低频让整片背景的流向更有推力，节拍则增加瞬间扰动。 */
  float audioPush = bassEnergy * 0.34 + beatEnergy * 0.26;

  vec2 largeFlow = vec2(
    fbm(point * 1.12 + vec2(flowTime, -flowTime * 0.72)),
    fbm(point * 1.12 + vec2(-flowTime * 0.66, flowTime * 0.81))
  ) - 0.5;

  vec2 mediumFlow = vec2(
    fbm(point * 2.65 + vec2(-flowTime * 1.18, flowTime * 0.64)),
    fbm(point * 2.65 + vec2(flowTime * 0.76, flowTime * 1.12))
  ) - 0.5;

  vec2 domain = point
    + largeFlow * (0.46 + audioPush)
    + mediumFlow * (0.12 + midEnergy * 0.24);

  /* 三种封面色仍按面积权重参与，只压缩极端的主色差异。 */
  vec3 displayWeights = sqrt(max(uColorWeights, vec3(0.0)));
  float displayWeightTotal =
    displayWeights.x + displayWeights.y + displayWeights.z;

  displayWeights /= max(displayWeightTotal, 0.001);

  float primaryField = pow(smoothstep(0.23, 0.77, fbm(domain * 1.62)), 1.7);
  float secondaryField = pow(
    smoothstep(0.23, 0.77, fbm(domain * 2.42 + vec2(7.3, 2.1))),
    1.7
  );
  float accentField = pow(
    smoothstep(0.23, 0.77, fbm(domain * 3.08 - vec2(4.2, 9.6))),
    1.7
  );

  vec3 colorInfluence = displayWeights * (
    vec3(0.10) + vec3(primaryField, secondaryField, accentField) * 1.9
  );
  colorInfluence.z *= step(0.001, uColorWeights.z);
  colorInfluence /= max(
    colorInfluence.x + colorInfluence.y + colorInfluence.z,
    0.001
  );

  vec3 color =
    uColorA * colorInfluence.x * 0.80 +
    uColorB * colorInfluence.y +
    uColorC * colorInfluence.z * 1.05;

  /* 三个色团位置不同，防止画面退化成单个中心光圈。 */
  vec2 blobCenterA = vec2(
    sin(uTime * 0.11) * (0.28 + midEnergy * 0.10) - 0.22,
    cos(uTime * 0.08) * (0.18 + midEnergy * 0.08) + 0.08
  );
  vec2 blobCenterB = vec2(
    cos(uTime * 0.075 + 1.8) * (0.34 + midEnergy * 0.11) + 0.24,
    sin(uTime * 0.10 + 0.9) * (0.22 + midEnergy * 0.08) - 0.12
  );
  vec2 blobCenterC = vec2(
    sin(uTime * 0.09 + 3.6) * (0.22 + midEnergy * 0.09),
    cos(uTime * 0.13 + 2.2) * (0.30 + midEnergy * 0.10) - 0.25
  );

  /* 低频决定常态呼吸，鼓点让三层色团同时短促扩张。 */
  float beatExpansion = beatEnergy * 0.11;
  float blobA = softBlob(
    point + largeFlow * 0.13,
    blobCenterA,
    0.22 + bassEnergy * 0.17 + beatExpansion,
    0.30
  );
  float blobB = softBlob(
    point - mediumFlow * 0.15,
    blobCenterB,
    0.17 + bassEnergy * 0.14 + beatExpansion * 0.82,
    0.25
  );
  float blobC = softBlob(
    point + mediumFlow * 0.11,
    blobCenterC,
    0.13 + bassEnergy * 0.11 + beatExpansion * 0.68,
    0.22
  );

  /* 色团用封面色交错叠加，避免只看到单一蓝色光圈。 */
  color += uColorA * blobA * (0.10 + bassEnergy * 0.15);
  color += uColorB * blobB * (0.11 + bassEnergy * 0.17);
  color += uColorC * blobC * (0.10 + bassEnergy * 0.18);

  /* 中频驱动两道波纹：旋律明显时，背景会持续有推进感。 */
  float ringA = waveRing(
    point + largeFlow * 0.08,
    blobCenterA,
    0.31 + fract(uTime * 0.055) * (0.22 + midEnergy * 0.16),
    0.018 + midEnergy * 0.016
  );
  float ringB = waveRing(
    point - mediumFlow * 0.10,
    blobCenterB,
    0.24 + fract(uTime * 0.072 + 0.42) * (0.19 + midEnergy * 0.13),
    0.014 + midEnergy * 0.014
  );

  color += uColorB * ringA * midEnergy * 0.13;
  color += uColorC * ringB * midEnergy * 0.11;

  /* 高频只放在色团边缘做碎光，保证律动清晰但不刺眼。 */
  float blobEdges =
    blobA * (1.0 - blobA) * 4.0 +
    blobB * (1.0 - blobB) * 4.0 +
    blobC * (1.0 - blobC) * 4.0;
  float sparkleNoise = smoothstep(
    0.67,
    0.88,
    fbm(point * 10.0 + vec2(uTime * 0.34, -uTime * 0.26))
  );

  color +=
    mix(uColorB, uColorC, 0.56) *
    blobEdges *
    sparkleNoise *
    trebleEnergy *
    0.22;

  /* 鼓点是全局协同的轻脉冲，不会把注意力锁死在一个点上。 */
  color *= 1.0 + beatEnergy * 0.13;

  float vignette = 1.0 - smoothstep(0.16, 1.16, length(point));
  color *= 0.19 + vignette * 0.62;
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
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 1)

  renderer.setPixelRatio(pixelRatio)
  renderer.setSize(width, height, false)
  uniforms.uResolution.value.set(width * pixelRatio, height * pixelRatio)
}

// 渲染一帧静态背景，用于暂停后动画保留当前画面
function renderStaticFrame(): void {
  if (!renderer || !scene || !camera) return
  renderer.render(scene, camera)
}

// 开始背景动画循环
function startRenderLoop(): void {
  if (!props.isActive || animationFrameId !== null || !renderer) return

  lastFrameTime = performance.now()
  animationFrameId = requestAnimationFrame(renderFrame)
}

// 立即停止北京动画循环，释放GPU
function stopRenderLoop(): void {
  if (animationFrameId === null) return

  cancelAnimationFrame(animationFrameId)
  animationFrameId = null
}

// 每帧将音频状态写入 shader uniform；不会触发 Vue 重渲染。
function renderFrame(timestamp: number): void {
  if (!renderer || !scene || !camera || !uniforms) return

  // 非全屏或暂停时候不在预约下一帧
  if (!props.isActive) {
    animationFrameId = null
    renderStaticFrame()
    return
  }

  const elapsedSeconds = clamp((timestamp - lastFrameTime) / 1000 || 0, 0, 0.1)
  lastFrameTime = timestamp

  uniforms.uTime.value += elapsedSeconds * (props.isPlaying ? 1 : 0.16)
  uniforms.uBass.value += ((props.isPlaying ? props.audio.bass : 0) - uniforms.uBass.value) * 0.12
  uniforms.uMid.value += ((props.isPlaying ? props.audio.mid : 0) - uniforms.uMid.value) * 0.1
  uniforms.uTreble.value +=
    ((props.isPlaying ? props.audio.treble : 0) - uniforms.uTreble.value) * 0.08
  uniforms.uBeat.value += ((props.isPlaying ? props.audio.beat : 0) - uniforms.uBeat.value) * 0.2

  renderStaticFrame()
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
  renderStaticFrame()
  startRenderLoop()
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

watch(
  () => props.isActive,
  (isActive) => {
    if (isActive) {
      startRenderLoop()
      return
    }

    stopRenderLoop()
    renderStaticFrame()
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
  transform: scale(1.05);
  filter: blur(18px) saturate(1.1) contrast(1.03);
  will-change: filter, transform;
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
