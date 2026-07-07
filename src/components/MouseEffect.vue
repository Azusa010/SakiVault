<template>
  <canvas ref="canvas" class="mouse-canvas"></canvas>
</template>

<script setup name="MouseEffect" lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue'

const canvas = ref<HTMLCanvasElement | null>(null)
let ctx: CanvasRenderingContext2D | null = null
let animationId: number = 0

interface MousePosition {
  x: number
  y: number
}

const mouse: MousePosition = {
  x: window.innerWidth / 2,
  y: window.innerHeight / 2,
}

interface TrailParticle {
  x: number
  y: number
  size: number
  alpha: number
  update(): void
  draw(): void
}

interface ExplosionParticle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  alpha: number
  gravity: number
  update(): void
  draw(): void
}

const trail: TrailParticle[] = []
const particles: ExplosionParticle[] = []

/* ===== 拖尾粒子 ===== */
class Trail implements TrailParticle {
  x: number
  y: number
  size: number
  alpha: number

  constructor(x: number, y: number) {
    this.x = x
    this.y = y
    this.size = Math.random() * 4 + 2
    this.alpha = 1
  }

  update() {
    this.alpha -= 0.02
    this.size *= 0.97
  }

  draw() {
    if (!ctx) return
    ctx.beginPath()
    ctx.fillStyle = `rgba(255, 182, 193, ${this.alpha})`
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
    ctx.fill()
  }
}

/* ===== 点击爆散 ===== */
class Particle implements ExplosionParticle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  alpha: number
  gravity: number

  constructor(x: number, y: number) {
    this.x = x
    this.y = y

    const angle = Math.random() * Math.PI * 2
    const speed = Math.random() * 3 + 2

    this.vx = Math.cos(angle) * speed
    this.vy = Math.sin(angle) * speed

    this.size = Math.random() * 6 + 3
    this.alpha = 1
    this.gravity = 0.03
  }

  update() {
    this.vy += this.gravity
    this.x += this.vx
    this.y += this.vy

    this.alpha -= 0.02
    this.size *= 0.96
  }

  draw() {
    if (!ctx) return
    ctx.save()
    ctx.globalAlpha = this.alpha

    ctx.fillStyle = '#fff0f5'
    ctx.beginPath()
    ctx.ellipse(this.x, this.y, this.size, this.size * 0.6, 0, 0, Math.PI * 2)
    ctx.fill()

    ctx.restore()
  }
}

/* ===== 初始化 ===== */
const init = () => {
  const c = canvas.value
  if (!c) return

  ctx = c.getContext('2d')

  const resize = () => {
    c.width = window.innerWidth
    c.height = window.innerHeight
  }

  resize()
  window.addEventListener('resize', resize)

  /* 鼠标移动 */
  window.addEventListener('mousemove', (e: MouseEvent) => {
    mouse.x = e.clientX
    mouse.y = e.clientY

    trail.push(new Trail(mouse.x, mouse.y))
  })

  /* 点击爆散 */
  window.addEventListener('click', (e: MouseEvent) => {
    for (let i = 0; i < 20; i++) {
      particles.push(new Particle(e.clientX, e.clientY))
    }
  })

  const animate = () => {
    if (!ctx) return
    ctx.clearRect(0, 0, c.width, c.height)

    /* 拖尾 */
    trail.forEach((t, i) => {
      t.update()
      t.draw()
      if (t.alpha <= 0) trail.splice(i, 1)
    })

    /* 点击粒子 */
    particles.forEach((p, i) => {
      p.update()
      p.draw()
      if (p.alpha <= 0) particles.splice(i, 1)
    })

    animationId = requestAnimationFrame(animate)
  }

  animate()
}

onMounted(init)

onBeforeUnmount(() => {
  cancelAnimationFrame(animationId)
})
</script>

<style scoped>
.mouse-canvas {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;

  pointer-events: none;
  z-index: 9998;
}
</style>
