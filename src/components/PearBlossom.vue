<template>
  <canvas ref="canvas" class="blossom-canvas"></canvas>
</template>

<script setup name="PearBlossom" lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue'

const canvas = ref<HTMLCanvasElement | null>(null)
let ctx: CanvasRenderingContext2D | null = null
let animationId: number = 0

interface PetalState {
  x: number
  y: number
  size: number
  speedY: number
  speedX: number
  rotation: number
  rotationSpeed: number
  opacity: number
}

class Petal implements PetalState {
  x!: number
  y!: number
  size!: number
  speedY!: number
  speedX!: number
  rotation!: number
  rotationSpeed!: number
  opacity!: number

  constructor(width: number, height: number) {
    this.reset(width, height)
  }

  reset(width: number, height: number) {
    this.x = Math.random() * width
    this.y = Math.random() * -height
    this.size = Math.random() * 6 + 4
    this.speedY = Math.random() * 1 + 0.5
    this.speedX = Math.random() * 1 - 0.5
    this.rotation = Math.random() * 360
    this.rotationSpeed = Math.random() * 2 - 1
    this.opacity = Math.random() * 0.5 + 0.5
  }

  update(width: number, height: number) {
    this.y += this.speedY
    this.x += this.speedX
    this.rotation += this.rotationSpeed

    if (this.y > height) {
      this.reset(width, height)
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save()
    ctx.translate(this.x, this.y)
    ctx.rotate((this.rotation * Math.PI) / 180)

    ctx.globalAlpha = this.opacity

    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.ellipse(0, 0, this.size, this.size * 0.6, 0, 0, Math.PI * 2)
    ctx.fill()

    ctx.restore()
  }
}

let petals: Petal[] = []

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

  petals = []
  for (let i = 0; i < 40; i++) {
    petals.push(new Petal(c.width, c.height))
  }

  const animate = () => {
    const context = ctx
    if (!context) return
    context.clearRect(0, 0, c.width, c.height)

    petals.forEach((p) => {
      p.update(c.width, c.height)
      p.draw(context)
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
.blossom-canvas {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;

  pointer-events: none;
  z-index: 9999;
}
</style>
