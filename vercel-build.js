import { cpSync, mkdirSync } from 'node:fs'
import { execSync } from 'node:child_process'

// 1. 运行 Vite 构建
execSync('npm run build-only', { stdio: 'inherit' })

// 2. 把 dist 复制到 Vercel 默认输出目录
mkdirSync('.vercel/output/static', { recursive: true })
cpSync('dist', '.vercel/output/static', { recursive: true })
